"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";

export function DeleteAccountButton() {
  const router = useRouter();
  const { token, logout } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!token) return;
    setPending(true);
    setError(null);
    try {
      const res = await apiFetch("/auth/me", { method: "DELETE", token });
      if (!res.ok) throw new Error("Hesap silinemedi.");
      logout();
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hesap silinemedi.");
      setPending(false);
    }
  }

  if (confirming) {
    return (
      <div className="rounded-xl border border-error/30 bg-error-container/10 p-4">
        <p className="text-sm font-medium text-on-surface">
          Hesabınızı silmek istediğinize emin misiniz?
        </p>
        <p className="mt-1 text-xs text-on-surface-variant">
          Bu işlem geri alınamaz. Profiliniz ve ilişkili verileriniz kalıcı
          olarak silinir.
        </p>
        {error ? (
          <p className="mt-2 text-sm text-error">{error}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => void handleDelete()}
            className="rounded-full bg-error px-4 py-2 text-sm font-bold text-on-error transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Siliniyor…" : "Evet, hesabımı sil"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setConfirming(false);
              setError(null);
            }}
            className="rounded-full border border-outline-variant/50 px-4 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
          >
            Vazgeç
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-sm font-medium text-error transition-colors hover:underline"
    >
      Hesabı sil
    </button>
  );
}
