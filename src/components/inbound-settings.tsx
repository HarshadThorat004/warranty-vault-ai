"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Copy, Inbox, Loader2 } from "lucide-react";

type DraftRow = {
  id: string;
  fromEmail: string | null;
  subject: string | null;
  createdAt: string;
};

export default function InboundSettings() {
  const [address, setAddress] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/inbound/address");
    const body = (await response.json()) as {
      address?: string;
      drafts?: DraftRow[];
      error?: string;
    };

    if (!response.ok) {
      throw new Error(body.error || "Could not load inbound address");
    }

    setAddress(body.address ?? null);
    setDrafts(body.drafts ?? []);
  }

  useEffect(() => {
    load()
      .catch((error) => {
        console.error(error);
        toast.error(
          error instanceof Error ? error.message : "Could not load inbox"
        );
      })
      .finally(() => setLoading(false));
  }, []);

  async function copyAddress() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("Address copied");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy");
    }
  }

  async function dismiss(id: string) {
    try {
      setBusyId(id);
      const response = await fetch(`/api/inbound/drafts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "dismissed" }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error || "Could not dismiss");
      }
      toast.success("Draft dismissed");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not dismiss");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-white/10 bg-neutral-950/80 p-6 md:p-8">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" />
          Loading inbox…
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-neutral-950/80 p-6 md:p-8">
      <div className="flex items-start gap-3">
        <Inbox size={18} className="mt-0.5 text-cyan-300" />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-white">
            Email-forward inbox
          </h2>
          <p className="mt-2 text-sm leading-7 text-gray-500">
            Forward Amazon or Flipkart invoice PDFs to this address. We store
            the file and fill what we can. Nothing becomes a product until you
            review it.
          </p>

          {address && (
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <code className="block min-w-0 flex-1 truncate rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-cyan-100">
                {address}
              </code>
              <button
                type="button"
                onClick={() => void copyAddress()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          )}

          <p className="mt-3 text-xs text-gray-600">
            Receiving needs MX on inbound.warrantyvault.in in Resend. Until
            that is live, this address is reserved for you.
          </p>

          {drafts.length > 0 && (
            <ul className="mt-5 divide-y divide-white/5 rounded-xl border border-white/5">
              {drafts.map((draft) => (
                <li
                  key={draft.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white">
                      {draft.subject || "Invoice email"}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {draft.fromEmail || "Unknown sender"} ·{" "}
                      {new Date(draft.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={`/dashboard/add-product?draft=${draft.id}`}
                      className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black"
                    >
                      Review
                    </Link>
                    <button
                      type="button"
                      onClick={() => void dismiss(draft.id)}
                      disabled={busyId === draft.id}
                      className="rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:text-white disabled:opacity-50"
                    >
                      Dismiss
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
