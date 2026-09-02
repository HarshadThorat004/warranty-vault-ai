"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Users } from "lucide-react";

type Member = {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  role: string;
};

type Invite = {
  id: string;
  email: string;
  expiresAt: string;
};

type HouseholdPayload = {
  household: { id: string; name: string; role: string } | null;
  members: Member[];
  invites: Invite[];
  isOwner: boolean;
  seats: { used: number; max: number };
};

type Props = {
  currentUserId: string;
};

export default function HouseholdSettings({ currentUserId }: Props) {
  const [data, setData] = useState<HouseholdPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [vaultName, setVaultName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/household");
    const body = (await response.json()) as HouseholdPayload & {
      error?: string;
    };

    if (!response.ok) {
      throw new Error(body.error || "Could not load household");
    }

    setData(body);
    setVaultName(body.household?.name ?? "Family vault");
  }

  useEffect(() => {
    load()
      .catch((error) => {
        console.error(error);
        toast.error(
          error instanceof Error ? error.message : "Could not load household"
        );
      })
      .finally(() => setLoading(false));
  }, []);

  async function invite(event: React.FormEvent) {
    event.preventDefault();

    try {
      setBusy("invite");
      const response = await fetch("/api/household/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = (await response.json()) as { error?: string; resent?: boolean };

      if (!response.ok) {
        throw new Error(body.error || "Could not send invite");
      }

      toast.success(
        body.resent ? "Invite resent" : `Invite sent to ${email.trim()}`
      );
      setEmail("");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send invite");
    } finally {
      setBusy(null);
    }
  }

  async function rename(event: React.FormEvent) {
    event.preventDefault();

    try {
      setBusy("rename");
      const response = await fetch("/api/household", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: vaultName }),
      });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error || "Could not rename vault");
      }

      toast.success("Vault name updated");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not rename");
    } finally {
      setBusy(null);
    }
  }

  async function revoke(inviteId: string) {
    try {
      setBusy(`revoke:${inviteId}`);
      const response = await fetch(`/api/household/invites/${inviteId}`, {
        method: "DELETE",
      });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error || "Could not revoke invite");
      }

      toast.success("Invite revoked");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not revoke");
    } finally {
      setBusy(null);
    }
  }

  async function removeMember(userId: string) {
    try {
      setBusy(`remove:${userId}`);
      const response = await fetch(`/api/household/members/${userId}`, {
        method: "DELETE",
      });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error || "Could not remove member");
      }

      toast.success("Member removed");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove");
    } finally {
      setBusy(null);
    }
  }

  async function leave() {
    try {
      setBusy("leave");
      const response = await fetch("/api/household/leave", { method: "POST" });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error || "Could not leave");
      }

      toast.success("You left the shared vault");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not leave");
    } finally {
      setBusy(null);
    }
  }

  if (loading || !data) {
    return (
      <section className="rounded-2xl border border-white/10 bg-neutral-950/80 p-6 md:p-8">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" />
          Loading household…
        </div>
      </section>
    );
  }

  const isOwner = data.isOwner || !data.household;
  const canInvite = isOwner && data.seats.used < data.seats.max;

  return (
    <section className="rounded-2xl border border-white/10 bg-neutral-950/80 p-6 md:p-8">
      <div className="flex items-start gap-3">
        <Users size={18} className="mt-0.5 text-cyan-300" />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-white">Household vault</h2>
          <p className="mt-2 text-sm leading-7 text-gray-500">
            Share this whole vault with family — invoices, warranties, and
            reminders. Invitees must be 18+. Up to {data.seats.max} people.
          </p>

          {data.household && isOwner && (
            <form onSubmit={rename} className="mt-5 flex flex-col gap-2 sm:flex-row">
              <input
                value={vaultName}
                onChange={(event) => setVaultName(event.target.value)}
                maxLength={60}
                aria-label="Vault name"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-600 focus:border-white/25"
              />
              <button
                type="submit"
                disabled={busy === "rename"}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white disabled:opacity-50"
              >
                Save name
              </button>
            </form>
          )}

          {data.household && !isOwner && (
            <p className="mt-4 text-sm text-gray-400">
              You are a member of{" "}
              <span className="text-white">{data.household.name}</span>.
            </p>
          )}

          {isOwner && (
            <form onSubmit={invite} className="mt-5 flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="family@email.com"
                disabled={!canInvite}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-600 focus:border-white/25 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={busy === "invite" || !canInvite}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-100 disabled:opacity-50"
              >
                {busy === "invite" && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                Send invite
              </button>
            </form>
          )}

          <p className="mt-3 text-xs text-gray-600">
            {data.seats.used} of {data.seats.max} seats used
            {data.household ? "" : " — inviting creates the shared vault"}
          </p>

          {data.members.length > 0 && (
            <ul className="mt-5 divide-y divide-white/5 rounded-xl border border-white/5">
              {data.members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white">
                      {member.name || member.email}
                      {member.userId === currentUserId ? " (you)" : ""}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {member.email} · {member.role}
                    </p>
                  </div>
                  {isOwner && member.userId !== currentUserId && (
                    <button
                      type="button"
                      onClick={() => void removeMember(member.userId)}
                      disabled={busy === `remove:${member.userId}`}
                      className="shrink-0 text-xs text-red-300 hover:text-red-200 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {data.invites.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-500">
                Pending invites
              </p>
              <ul className="mt-2 divide-y divide-white/5 rounded-xl border border-white/5">
                {data.invites.map((inviteRow) => (
                  <li
                    key={inviteRow.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm text-white">{inviteRow.email}</p>
                      <p className="text-xs text-gray-500">
                        Expires{" "}
                        {new Date(inviteRow.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => void revoke(inviteRow.id)}
                        disabled={busy === `revoke:${inviteRow.id}`}
                        className="shrink-0 text-xs text-gray-400 hover:text-white disabled:opacity-50"
                      >
                        Revoke
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.household && !isOwner && (
            <button
              type="button"
              onClick={() => void leave()}
              disabled={busy === "leave"}
              className="mt-6 text-sm text-red-300 hover:text-red-200 disabled:opacity-50"
            >
              Leave this vault
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
