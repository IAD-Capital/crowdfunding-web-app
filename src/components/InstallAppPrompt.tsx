"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, Share, SquarePlus } from "lucide-react";
import s from "./InstallAppPrompt.module.scss";

const DISMISS_KEY = "pwa-install-dismissed-at";
const DISMISS_DAYS = 14;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isDismissedRecently(): boolean {
  const raw = localStorage.getItem(DISMISS_KEY);
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

export default function InstallAppPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone() || isDismissedRecently()) return;

    if (isIos()) {
      setShowIosHint(true);
      return;
    }

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
    }
    function onAppInstalled() {
      setDeferredEvent(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDeferredEvent(null);
    setShowIosHint(false);
  }

  async function handleInstallClick() {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    await deferredEvent.userChoice;
    setDeferredEvent(null);
  }

  if (!deferredEvent && !showIosHint) return null;

  return (
    <div className={s.banner} role="dialog" aria-label="Instalar aplicación">
      <Image src="/icons/icon-192.png" alt="" width={40} height={40} className={s.icon} />
      <div className={s.text}>
        <p className={s.title}>Instalá la app de IAD Capital</p>
        {deferredEvent ? (
          <p className={s.subtitle}>Accedé más rápido desde la pantalla de inicio de tu celular.</p>
        ) : (
          <p className={s.subtitle}>
            Tocá <Share size={13} className={s.inlineIcon} /> y luego &quot;Agregar a inicio&quot;{" "}
            <SquarePlus size={13} className={s.inlineIcon} />.
          </p>
        )}
      </div>
      {deferredEvent && (
        <button type="button" className={s.installBtn} onClick={handleInstallClick}>
          Instalar
        </button>
      )}
      <button type="button" className={s.closeBtn} onClick={dismiss} aria-label="Cerrar">
        <X size={16} />
      </button>
    </div>
  );
}
