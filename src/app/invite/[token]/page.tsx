import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import AcceptInviteButton from "@/components/accept-invite-button";
import AuthShell, { AuthBrandMark } from "@/components/auth/auth-shell";
import { getInviteByToken } from "@/lib/household";
import { getSessionUser } from "@/lib/product-access";
import { emailsMatch } from "@/lib/account";

type Props = {
  params: Promise<{ token: string }>;
};

export const metadata: Metadata = {
  title: "Join household vault — Warranty Vault AI",
  description: "Accept an invite to share a Warranty Vault with your household.",
};

export default async function InvitePage({ params }: Props) {
  const { token } = await params;

  if (!token) {
    return notFound();
  }

  const result = await getInviteByToken(token);
  const user = await getSessionUser();

  if (!result) {
    return (
      <AuthShell>
        <div className="text-center">
          <AuthBrandMark />
          <h1 className="mt-6 text-[28px] font-semibold tracking-tight text-white">
            Invite not found
          </h1>
          <p className="mt-3 text-sm leading-7 text-white/45">
            This link is invalid or was revoked. Ask the vault owner to send a
            new invite.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-block text-sm text-white underline decoration-white/30 underline-offset-2"
          >
            Go to login
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (result.expired) {
    return (
      <AuthShell>
        <div className="text-center">
          <AuthBrandMark />
          <h1 className="mt-6 text-[28px] font-semibold tracking-tight text-white">
            Invite expired
          </h1>
          <p className="mt-3 text-sm leading-7 text-white/45">
            Ask {result.invite.invitedBy.name || result.invite.invitedBy.email}{" "}
            to send a new invite to {result.invite.email}.
          </p>
        </div>
      </AuthShell>
    );
  }

  const { invite } = result;
  const inviter = invite.invitedBy.name || invite.invitedBy.email;
  const callback = `/invite/${token}`;
  const signedInAsInvitee = user
    ? emailsMatch(user.email, invite.email)
    : false;

  return (
    <AuthShell>
      <div className="text-center">
        <AuthBrandMark />
        <h1 className="mt-6 text-[28px] font-semibold tracking-tight text-white sm:text-[32px]">
          Join {invite.household.name}
        </h1>
        <p className="mt-3 text-sm leading-7 text-white/45">
          {inviter} invited <span className="text-white/70">{invite.email}</span>{" "}
          to share one warranty vault. You will see the same products,
          documents, and expiry reminders.
        </p>
      </div>

      <div className="mt-8 space-y-4">
        {!user && (
          <div className="space-y-3">
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(callback)}`}
              className="inline-flex w-full items-center justify-center rounded-[10px] bg-white py-2.5 text-sm font-medium text-black transition hover:bg-white/90"
            >
              Sign in to join
            </Link>
            <Link
              href={`/register?callbackUrl=${encodeURIComponent(callback)}`}
              className="inline-flex w-full items-center justify-center rounded-[10px] border border-white/15 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.04]"
            >
              Create an account
            </Link>
            <p className="text-center text-xs text-white/35">
              Use {invite.email}. New accounts can sign in with an email code.
            </p>
          </div>
        )}

        {user && !signedInAsInvitee && (
          <p className="rounded-[10px] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            You are signed in as {user.email}. Sign out and sign in as{" "}
            {invite.email} to accept this invite.
          </p>
        )}

        {signedInAsInvitee && <AcceptInviteButton token={token} />}
      </div>
    </AuthShell>
  );
}
