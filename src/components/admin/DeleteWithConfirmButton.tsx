"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./DeleteWithConfirmButton.module.scss";

type Props = {
  deleteUrl: string;
  confirmText: string;
  redirectTo?: string;
  label?: string;
};

export default function DeleteWithConfirmButton({ deleteUrl, confirmText, redirectTo, label = "Eliminar" }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function close() {
    if (loading) return;
    setOpen(false);
    setValue("");
    setError("");
  }

  async function handleDelete() {
    setLoading(true);
    setError("");
    const res = await fetch(deleteUrl, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "No se pudo eliminar.");
      return;
    }
    setOpen(false);
    if (redirectTo) router.push(redirectTo);
    router.refresh();
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={styles.trigger}>
        {label}
      </button>

      {open && (
        <div className={styles.overlay} onClick={close}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Eliminar &quot;{confirmText}&quot;</h3>
            <p className={styles.modalText}>
              Esta acción no se puede deshacer. Para confirmar, escribí <strong>{confirmText}</strong> abajo.
            </p>
            <input
              className={styles.modalInput}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
            />
            {error && <p className={styles.modalError}>{error}</p>}
            <div className={styles.modalActions}>
              <button type="button" onClick={close} className={styles.cancelBtn} disabled={loading}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className={styles.confirmBtn}
                disabled={value !== confirmText || loading}
              >
                {loading ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
