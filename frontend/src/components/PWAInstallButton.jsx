"use client";

import { useEffect, useState } from "react";

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if running in standalone mode (already installed)
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    // Check iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    if (iosDevice) {
      setIsIOS(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSTip(!showIOSTip);
    }
  };

  if (isInstalled) {
    return null;
  }

  // Show if prompt is available OR on iOS
  if (!deferredPrompt && !isIOS) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={handleInstallClick}
        aria-label="Install Almanac PWA"
        title="Install Almanac Web App"
        className="flex items-center gap-1.5 rounded-md border border-violet-500/30 bg-violet-950/40 px-2.5 py-1 text-xs font-medium text-violet-200 backdrop-blur-md transition-all hover:border-violet-400/60 hover:bg-violet-900/50 hover:text-white"
      >
        <svg
          className="h-3.5 w-3.5 text-violet-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        <span className="hidden sm:inline">Install App</span>
        <span className="sm:hidden">Install</span>
      </button>

      {showIOSTip && isIOS && (
        <div className="absolute right-0 top-10 z-50 w-64 rounded-md border border-zinc-700 bg-zinc-900 p-3 text-xs text-zinc-200 shadow-2xl">
          <p className="font-semibold text-white">Install Almanac on iOS:</p>
          <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-zinc-300">
            <li>Tap the <strong>Share</strong> button in Safari.</li>
            <li>Select <strong>Add to Home Screen</strong>.</li>
          </ol>
          <button
            onClick={() => setShowIOSTip(false)}
            className="mt-2 text-[10px] text-zinc-400 underline hover:text-white"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
