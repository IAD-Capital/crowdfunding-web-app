"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { trackCtaClick } from "@/lib/analytics";

type Props = {
  investmentId: number;
  hasPendingRequest: boolean;
};

export default function RemovalRequestButton({ investmentId, hasPendingRequest }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function handleRequest() {
    setError(null);
    const res = await fetch(`/api/investments/${investmentId}/removal-request`, {
      method: "POST",
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Error al solicitar remoción.");
      return;
    }
    trackCtaClick("wallet_removal_request", { location: "wallet" });
    startTransition(() => router.refresh());
  }

  async function handleCancel() {
    setError(null);
    const res = await fetch(`/api/investments/${investmentId}/removal-request`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Error al cancelar solicitud.");
      return;
    }
    startTransition(() => router.refresh());
  }

  if (hasPendingRequest) {
    return (
      <div style={pendingWrap}>
        <div style={pendingBadge}>
          <span style={dot} />
          Remoción pendiente de aprobación
        </div>
        <button
          style={cancelBtn}
          onClick={handleCancel}
          disabled={pending}
        >
          Cancelar solicitud
        </button>
        {error && <p style={errStyle}>{error}</p>}
      </div>
    );
  }

  if (confirming) {
    return (
      <div style={confirmWrap}>
        <p style={confirmText}>¿Seguro que querés solicitar la remoción de esta inversión? Un superadmin deberá aprobarla.</p>
        <div style={confirmRow}>
          <button style={confirmYes} onClick={() => { setConfirming(false); handleRequest(); }} disabled={pending}>
            Sí, solicitar
          </button>
          <button style={confirmNo} onClick={() => setConfirming(false)}>
            Cancelar
          </button>
        </div>
        {error && <p style={errStyle}>{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <button style={removeBtn} onClick={() => setConfirming(true)} disabled={pending}>
        Remover inversión
      </button>
      {error && <p style={errStyle}>{error}</p>}
    </div>
  );
}

const pendingWrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.4rem" };
const pendingBadge: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "0.4rem",
  fontSize: "0.78rem", color: "#92400e", fontWeight: 600,
  background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "0.4rem 0.65rem",
};
const dot: React.CSSProperties = {
  width: 7, height: 7, borderRadius: "50%", background: "#f59e0b", flexShrink: 0,
};
const cancelBtn: React.CSSProperties = {
  background: "none", border: "1px solid #d1d5db", borderRadius: 7, padding: "0.3rem 0.75rem",
  fontSize: "0.75rem", cursor: "pointer", color: "#6b7280", fontWeight: 600,
};
const confirmWrap: React.CSSProperties = {
  background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "0.85rem",
  display: "flex", flexDirection: "column", gap: "0.6rem",
};
const confirmText: React.CSSProperties = { fontSize: "0.8rem", color: "#7f1d1d", margin: 0, lineHeight: 1.5 };
const confirmRow: React.CSSProperties = { display: "flex", gap: "0.5rem" };
const confirmYes: React.CSSProperties = {
  flex: 1, padding: "0.4rem", background: "#dc2626", color: "#fff",
  border: "none", borderRadius: 7, fontWeight: 700, fontSize: "0.78rem", cursor: "pointer",
};
const confirmNo: React.CSSProperties = {
  flex: 1, padding: "0.4rem", background: "#fff", color: "#374151",
  border: "1px solid #d1d5db", borderRadius: 7, fontWeight: 600, fontSize: "0.78rem", cursor: "pointer",
};
const removeBtn: React.CSSProperties = {
  width: "100%", padding: "0.45rem", background: "none",
  border: "1px solid #fca5a5", borderRadius: 8, color: "#dc2626",
  fontSize: "0.8rem", fontWeight: 700, cursor: "pointer",
};
const errStyle: React.CSSProperties = { color: "#dc2626", fontSize: "0.75rem", margin: 0 };
