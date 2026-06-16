"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton({ label }: { label: string }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      style={{
        padding: "0.5rem 1rem", background: "#111", color: "#fff",
        border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600,
      }}
    >
      {label}
    </button>
  );
}
