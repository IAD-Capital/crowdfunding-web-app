"use client";

import { Bell } from "lucide-react";
import { useInstallPrompt } from "./InstallPromptProvider";
import { trackCtaClick } from "@/lib/analytics";
import s from "./Header.module.scss";

export default function HeaderNotifyButton() {
  const { ready, notificationsAvailable, subscribing, requestNotifications } = useInstallPrompt();

  if (!ready || !notificationsAvailable) return null;

  function handleClick() {
    trackCtaClick("header_notifications", { location: "header" });
    requestNotifications();
  }

  return (
    <button type="button" className={s.notifyBtn} onClick={handleClick} disabled={subscribing}>
      <Bell size={15} />
      {subscribing ? "Activando…" : "Recibir novedades"}
    </button>
  );
}
