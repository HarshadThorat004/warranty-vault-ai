"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

type DeleteMode = "solo" | "member" | "owner-with-others";

type Props = {
  email: string;
  mode?: DeleteMode;
};

export default function DeleteAccountButton({
  email,
  mode = "solo",
}: Props) {
  const [open, setOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function handleDelete() {
    try {
      setLoading(true);

      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: confirmEmail }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error || "Failed to delete account");
      }

      toast.success("Account deleted");
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete account"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setConfirmEmail("");
          setOpen(true);
        }}
        className="rounded-xl bg-red-500/90 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500"
      >
        Delete account
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
        >
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-neutral-950 p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2
                  id="delete-account-title"
                  className="text-xl font-bold text-white"
                >
                  Delete your account?
                </h2>
                <p className="mt-2 text-sm text-gray-400">
                  {mode === "member"
                    ? "This removes your account. Shared vault products stay with the household."
                    : mode === "owner-with-others"
                      ? "This removes your account. The shared vault stays, and ownership moves to another member."
                      : "This permanently removes your products, invoices, warranty cards, and reminder history. Uploaded files are deleted from storage. This cannot be undone."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-gray-500 transition hover:text-white"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <label className="block text-xs font-medium text-gray-400">
              Type {email} to confirm
              <input
                type="email"
                value={confirmEmail}
                onChange={(event) => setConfirmEmail(event.target.value)}
                autoComplete="email"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none ring-0 placeholder:text-gray-600 focus:border-white/25"
                placeholder={email}
              />
            </label>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-gray-700 px-5 py-3 font-semibold text-white transition hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading || confirmEmail.trim().length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
