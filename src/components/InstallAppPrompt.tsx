"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, Share, SquarePlus, Bell } from "lucide-react";
import s from "./InstallAppPrompt.module.scss";

const INSTALL_DISMISS_KEY = "pwa-install-dismissed-at";
const NOTIF_DISMISS_KEY = "push-opt-in-dismissed-at";
const DISMISS_DAYS = 14;
const INSTALL_PROMPT_TIMEOUT_MS = 3000;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type Stage = "install" | "install-ios" | "notifications" | null;

function isDismissedRecently(key: string): boolean {
  const raw = localStorage.getItem(key);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  if (Number.isNaN(dismissedAt)) return false;
  const elapsedDays = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
  return elapsedDays < DISMISS_DAYS;
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function canOfferNotifications(): boolean {
  return (
    "Notification" in window &&
    Notification.permission === "default" &&
    (!isIos() || isStandalone()) &&
    !isDismissedRecently(NOTIF_DISMISS_KEY)
  );
}

// https://developer.mozilla.org/en-US/docs/Web/API/Push_API/Best_Practices
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function InstallAppPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [stage, setStage] = useState<Stage>(null);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    // iOS has no native install prompt — "add to home screen" is the only
    // way to unlock notifications there, so it can't be subject to the same
    // 14-day dismiss suppression as the Android/desktop install banner below
    // (otherwise closing it once means neither it nor the notifications
    // opt-in can appear again for 2 weeks).
    if (isIos()) {
      if (isStandalone()) {
        if (canOfferNotifications()) setStage("notifications");
      } else {
        setStage("install-ios");
      }
      return;
    }

    if (isStandalone() || isDismissedRecently(INSTALL_DISMISS_KEY)) {
      if (canOfferNotifications()) setStage("notifications");
      return;
    }

    let resolved = false;

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      resolved = true;
      setDeferredEvent(e as BeforeInstallPromptEvent);
      setStage("install");
    }
    function onAppInstalled() {
      resolved = true;
      setDeferredEvent(null);
      setStage(canOfferNotifications() ? "notifications" : null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    // Browsers that never fire beforeinstallprompt (Firefox, desktop Safari,
    // or Chrome that already decided not to offer it) shouldn't block the
    // notifications opt-in forever — fall through after a short wait.
    const timer = setTimeout(() => {
      if (!resolved && canOfferNotifications()) setStage("notifications");
    }, INSTALL_PROMPT_TIMEOUT_MS);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      clearTimeout(timer);
    };
  }, []);

  function dismissInstall() {
    localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now()));
    setDeferredEvent(null);
    setStage(canOfferNotifications() ? "notifications" : null);
  }

  function dismissNotifications() {
    localStorage.setItem(NOTIF_DISMISS_KEY, String(Date.now()));
    setStage(null);
  }

  async function handleInstallClick() {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    await deferredEvent.userChoice;
    setDeferredEvent(null);
    setStage(canOfferNotifications() ? "notifications" : null);
  }

  async function handleEnableNotifications() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setStage(null);
      return;
    }
    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subscription, userAgent: navigator.userAgent }),
      });
    } finally {
      setSubscribing(false);
      setStage(null);
    }
  }

  if (stage === null) return null;

  if (stage === "notifications") {
    return (
      <div className={s.banner} role="dialog" aria-label="Activar notificaciones">
        <div className={s.iconCircle}>
          <Bell size={20} />
        </div>
        <div className={s.text}>
          <p className={s.title}>Activá las notificaciones</p>
          <p className={s.subtitle}>Enterate primero de nuevas unidades y novedades de tus inversiones.</p>
        </div>
        <button type="button" className={s.installBtn} onClick={handleEnableNotifications} disabled={subscribing}>
          {subscribing ? "…" : "Activar"}
        </button>
        <button type="button" className={s.closeBtn} onClick={dismissNotifications} aria-label="Cerrar">
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className={s.banner} role="dialog" aria-label="Instalar aplicación">
      <Image src="/icons/icon-192.png" alt="" width={40} height={40} className={s.icon} />
      <div className={s.text}>
        <p className={s.title}>Instalá la app de IAD Capital</p>
        {stage === "install" ? (
          <p className={s.subtitle}>Accedé más rápido desde la pantalla de inicio de tu celular.</p>
        ) : (
          <p className={s.subtitle}>
            Tocá <Share size={13} className={s.inlineIcon} /> y luego &quot;Agregar a inicio&quot;{" "}
            <SquarePlus size={13} className={s.inlineIcon} />.
          </p>
        )}
      </div>
      {stage === "install" && (
        <button type="button" className={s.installBtn} onClick={handleInstallClick}>
          Instalar
        </button>
      )}
      <button type="button" className={s.closeBtn} onClick={dismissInstall} aria-label="Cerrar">
        <X size={16} />
      </button>
    </div>
  );
}
