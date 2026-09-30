"use client";

import { useState, useEffect } from "react";
import { getNotificationPreference, setNotificationPreference } from "@/lib/storage";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function NotificationToggle({ className = "" }) {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isSupported = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
    setSupported(isSupported);

    if (isSupported) {
      setPermission(Notification.permission);
      const isSub = getNotificationPreference();
      setSubscribed(isSub && Notification.permission === "granted");
    }
  }, []);

  if (!supported) {
    return null;
  }

  // If user previously blocked notifications, do not harass them
  if (permission === "denied") {
    return (
      <span className="text-[11px] text-zinc-500 font-mono" title="Notifications blocked in browser settings">
        Notifications Blocked
      </span>
    );
  }

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);

    try {
      if (subscribed) {
        // Unsubscribe
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subscription: sub, action: "unsubscribe" }),
          });
        }
        setSubscribed(false);
        setNotificationPreference(false);
      } else {
        // Request Permission
        const perm = await Notification.requestPermission();
        setPermission(perm);

        if (perm === "granted") {
          const keyRes = await fetch("/api/push/vapid-key");
          const { publicKey } = await keyRes.json();

          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          });

          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subscription: sub, action: "subscribe" }),
          });

          setSubscribed(true);
          setNotificationPreference(true);
        } else {
          setNotificationPreference(false);
        }
      }
    } catch (err) {
      console.warn("Notification subscription error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
        subscribed
          ? "border border-violet-800/60 bg-violet-950/40 text-violet-300 hover:bg-violet-950/60"
          : "border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
      } ${className}`}
      title={subscribed ? "Daily note notifications enabled" : "Enable daily note notifications"}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${subscribed ? "bg-violet-400" : "bg-zinc-600"}`} />
      <span>{loading ? "Updating..." : subscribed ? "Daily Notes On" : "Enable Daily Notes"}</span>
    </button>
  );
}
