"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./DuplicateButton.module.scss";

type Props = { duplicateUrl: string; redirectBase: string };

export default function DuplicateButton({ duplicateUrl, redirectBase }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDuplicate() {
    setLoading(true);
    const res = await fetch(duplicateUrl, { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      alert("No se pudo duplicar.");
      return;
    }
    const copy = await res.json();
    router.push(`${redirectBase}/${copy.id}`);
  }

  return (
    <button onClick={handleDuplicate} disabled={loading} className={styles.btn}>
      {loading ? "…" : "Duplicar"}
    </button>
  );
}
