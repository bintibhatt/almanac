"""
Notification Service for Almanac.
Manages push notification subscriptions and delivers updates when new daily
engineering notes are published.
"""

from datetime import datetime, timezone
import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

from backend.providers.base import Topic


class NotificationService:
    """
    Coordinates web push notification subscriptions and delivery.
    Decoupled from third-party transport to allow future migration to AWS SNS/SES/EventBridge.
    """

    def __init__(self, subscriptions_file: Optional[Path] = None):
        if subscriptions_file is None:
            root_dir = Path(__file__).resolve().parents[2]
            self.subscriptions_file = root_dir / "shared" / "push_subscriptions.json"
        else:
            self.subscriptions_file = Path(subscriptions_file)

    def _load_subscriptions(self) -> List[Dict[str, Any]]:
        """Load stored browser push subscriptions."""
        if not self.subscriptions_file.exists():
            return []

        try:
            with open(self.subscriptions_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
        except Exception:
            return []

    def _save_subscriptions(self, subs: List[Dict[str, Any]]):
        """Save subscriptions to disk."""
        self.subscriptions_file.parent.mkdir(parents=True, exist_ok=True)
        with open(self.subscriptions_file, "w", encoding="utf-8") as f:
            json.dump(subs, f, indent=2, ensure_ascii=False)

    def add_subscription(self, subscription: Dict[str, Any]) -> bool:
        """Add or update a browser push subscription."""
        if not subscription or not isinstance(subscription, dict):
            return False

        endpoint = subscription.get("endpoint")
        if not endpoint:
            return False

        subs = self._load_subscriptions()
        # Avoid duplicate endpoints
        existing = [s for s in subs if s.get("endpoint") != endpoint]
        subscription["subscribed_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        existing.append(subscription)
        self._save_subscriptions(existing)
        return True

    def remove_subscription(self, endpoint: str) -> bool:
        """Remove a push subscription by its endpoint."""
        subs = self._load_subscriptions()
        filtered = [s for s in subs if s.get("endpoint") != endpoint]
        if len(filtered) != len(subs):
            self._save_subscriptions(filtered)
            return True
        return False

    def get_subscriptions(self) -> List[Dict[str, Any]]:
        """Return all active push subscriptions."""
        return self._load_subscriptions()

    def notify_daily_note(self, note: Dict[str, Any]) -> Dict[str, Any]:
        """Deliver push notification for a daily note dictionary."""
        topic = Topic(
            title=note.get("title", ""),
            category=note.get("category", "backend"),
            description=note.get("description", ""),
        )
        return self.notify_new_note(topic, note)

    def notify_new_note(self, topic: Topic, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Deliver push notification event for a published note.
        Safe against missing keys and logs securely.
        """
        subs = self._load_subscriptions()
        payload = {
            "title": "📚 New Almanac Note",
            "body": f'"{topic.title}" — Read today\'s note →',
            "category": topic.category,
            "url": f"/notes/{topic.slug}",
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        }

        # If pywebpush is installed and VAPID keys exist, dispatch
        vapid_private_key = os.getenv("VAPID_PRIVATE_KEY")
        vapid_claims_email = os.getenv("VAPID_CLAIMS_EMAIL", "mailto:almanac-notifications@almanac.local")

        sent_count = 0
        failed_count = 0

        if vapid_private_key and subs:
            try:
                from pywebpush import webpush, WebPushException  # type: ignore

                for sub in subs:
                    try:
                        webpush(
                            subscription_info=sub,
                            data=json.dumps(payload),
                            vapid_private_key=vapid_private_key,
                            vapid_claims={"sub": vapid_claims_email},
                        )
                        sent_count += 1
                    except Exception as push_err:
                        failed_count += 1
            except ImportError:
                pass

        # Also write notification event record to shared/notification_history.json
        self._record_notification_event(payload, total_subscribers=len(subs), sent=sent_count)

        return {
            "payload": payload,
            "subscribers": len(subs),
            "total_subscribers": len(subs),
            "delivered": sent_count,
            "status": "delivered" if sent_count > 0 else "logged",
        }

    def _record_notification_event(self, payload: Dict[str, Any], total_subscribers: int, sent: int):
        """Record notification log for audit and telemetry."""
        root_dir = Path(__file__).resolve().parents[2]
        history_path = root_dir / "shared" / "notification_history.json"
        events = []
        if history_path.exists():
            try:
                with open(history_path, "r", encoding="utf-8") as f:
                    events = json.load(f)
                    if not isinstance(events, list):
                        events = []
            except Exception:
                events = []

        record = {
            **payload,
            "subscribers": total_subscribers,
            "delivered": sent,
        }
        events.append(record)
        try:
            with open(history_path, "w", encoding="utf-8") as f:
                json.dump(events[-50:], f, indent=2)  # Keep last 50 events
        except Exception:
            pass
