"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { userId: number; currentUserId: number; menuItem?: boolean };

export default function DeleteUserButton({ userId, currentUserId, menuItem = false }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (userId === currentUserId) return null;

  async function handleDelete() {
    if (!confirm("¿Eliminar este usuario? Esta acción no se puede deshacer.")) return;
    setLoading(true);
    await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={handleDelete} disabled={loading} style={menuItem ? menuBtn : btn}>
      {loading ? "…" : "Eliminar"}
    </button>
  );
}

const btn: React.CSSProperties = {
  background: "none", border: "none", color: "#ef4444",
  fontSize: "0.8rem", cursor: "pointer", padding: 0, fontWeight: 500,
};

const menuBtn: React.CSSProperties = {
  display: "block", width: "100%", textAlign: "left", padding: "0.55rem 0.85rem",
  background: "none", border: "none", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600,
  color: "#dc2626", whiteSpace: "nowrap",
};
