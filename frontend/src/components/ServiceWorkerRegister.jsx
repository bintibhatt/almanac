"use client";

import { useEffect, useState } from "react";

export default function ServiceWorkerRegister() {
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [showReloadToast, setShowReloadToast] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // 1. In development or local testing, actively unregister any existing service worker
    // and wipe stale chunk caches to prevent Webpack module desync and chunk mismatch errors.
    const isDev = process.env.NODE_ENV !== "production" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (isDev) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      if ("caches" in window) {
        caches.keys().then((keys) => {
          for (const key of keys) {
            if (key.startsWith("almanac")) {
              caches.delete(key);
            }
          }
        });
      }
      return;
    }

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");

        // Check if there is already a waiting worker
        if (reg.waiting) {
          setWaitingWorker(reg.waiting);
          setShowReloadToast(true);
        }

        // Listen for new worker updates
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setWaitingWorker(newWorker);
              setShowReloadToast(true);
            }
          });
        });
      } catch {
        // Silently handle registration errors in dev/unsupported envs
      }
    };

    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW);
    }
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ action: "SKIP_WAITING" });
    }
    setShowReloadToast(false);
  };

  if (!showReloadToast) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-lg border border-violet-500/40 bg-zinc-900/95 px-4 py-3 shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-3"
    >
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
        <span className="text-xs font-medium text-zinc-200">
          New version available
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleUpdate}
          className="rounded bg-violet-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-violet-500 cursor-pointer"
        >
          Refresh
        </button>
        <button
          onClick={() => setShowReloadToast(false)}
          className="text-zinc-500 hover:text-zinc-300 text-xs p-1"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
