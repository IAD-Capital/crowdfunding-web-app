"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { subscribeToPush } from "@/lib/pushSubscription";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

type InstallPromptContextValue = {
  // False until the client has checked install/notification state, so menu
  // items can stay hidden during SSR/hydration instead of flashing in.
  ready: boolean;
  canInstall: boolean;
  isIosInstallable: boolean;
  notificationsAvailable: boolean;
  subscribing: boolean;
  requestInstall: () => Promise<void>;
  requestNotifications: () => Promise<boolean>;
};

const InstallPromptContext = createContext<InstallPromptContextValue | null>(null);

export function InstallPromptProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    setStandalone(isStandalone());
    setNotifPermission("Notification" in window ? Notification.permission : "unsupported");
    setReady(true);

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
    }
    function onAppInstalled() {
      setDeferredEvent(null);
      setStandalone(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  async function requestInstall() {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    await deferredEvent.userChoice;
    setDeferredEvent(null);
  }

  async function requestNotifications() {
    setSubscribing(true);
    try {
      const granted = await subscribeToPush();
      setNotifPermission("Notification" in window ? Notification.permission : "unsupported");
      return granted;
    } finally {
      setSubscribing(false);
    }
  }

  const value: InstallPromptContextValue = {
    ready,
    canInstall: ready && !standalone && !!deferredEvent,
    isIosInstallable: ready && !standalone && isIos(),
    notificationsAvailable: ready && notifPermission === "default" && (!isIos() || standalone),
    subscribing,
    requestInstall,
    requestNotifications,
  };

  return <InstallPromptContext.Provider value={value}>{children}</InstallPromptContext.Provider>;
}

export function useInstallPrompt(): InstallPromptContextValue {
  const ctx = useContext(InstallPromptContext);
  if (!ctx) throw new Error("useInstallPrompt must be used within InstallPromptProvider");
  return ctx;
}
