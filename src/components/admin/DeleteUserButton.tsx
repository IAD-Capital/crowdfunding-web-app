"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { userId: number; currentUserId: number };

export default function DeleteUserButton({ userId, currentUserId }: Props) {
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
    <button onClick={handleDelete} disabled={loading} style={btn}>
      {loading ? "…" : "Eliminar"}
    </button>
  );
}

const btn: React.CSSProperties = {
  background: "none", border: "none", color: "#ef4444",
  fontSize: "0.8rem", cursor: "pointer", padding: 0, fontWeight: 500,
};
