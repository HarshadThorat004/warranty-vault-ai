"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  authPrimaryButtonClass,
} from "@/components/auth/auth-shell";

type Props = {
  token: string;
};

export default function AcceptInviteButton({ token }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function accept() {
    try {
      setLoading(true);
      const response = await fetch("/api/household/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error || "Could not join vault");
      }

      toast.success("You joined the shared vault");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not join vault"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void accept()}
      disabled={loading}
      className={authPrimaryButtonClass}
    >
      {loading ? (
        <>
          <Loader2 size={16} className="mr-2 animate-spin" />
          Joining…
        </>
      ) : (
        "Join this vault"
      )}
    </button>
  );
}
