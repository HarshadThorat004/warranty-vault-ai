"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  authInputClass,
  authPrimaryButtonClass,
} from "@/components/auth/auth-shell";

type Props = {
  onBack?: () => void;
  callbackUrl?: string;
};

export default function EmailOtpForm({
  onBack,
  callbackUrl = "/dashboard",
}: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [devHint, setDevHint] = useState<string | null>(null);

  async function requestCode(targetEmail = email) {
    const response = await fetch("/api/auth/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: targetEmail }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Could not send code");
    }

    return result as {
      success: boolean;
      message?: string;
      devCode?: string;
      allowedRecipient?: string | null;
    };
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSending(true);
      setDevHint(null);
      const result = await requestCode();

      if (result.devCode) {
        setCode(result.devCode);
        setDevHint(
          `Dev code: ${result.devCode}${
            result.allowedRecipient
              ? ` (Resend can only email ${result.allowedRecipient} until a domain is verified)`
              : ""
          }`
        );
        toast.message("Resend free-tier limit — using local test code");
      } else {
        toast.success("Code sent — check your inbox");
      }

      setStep("code");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Could not send code");
    } finally {
      setSending(false);
    }
  }

  async function resendCode() {
    try {
      setSending(true);
      const result = await requestCode();

      if (result.devCode) {
        setCode(result.devCode);
        setDevHint(`Dev code: ${result.devCode}`);
        toast.message("Resend free-tier limit — using local test code");
      } else {
        setDevHint(null);
        toast.success("Code resent");
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Could not resend code");
    } finally {
      setSending(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();

    try {
      setVerifying(true);

      const result = await signIn("email-otp", {
        email,
        code,
        redirect: false,
      });

      if (result?.error) {
        toast.error(
          result.error === "CredentialsSignin"
            ? "Invalid or expired code"
            : result.error
        );
        return;
      }

      toast.success("Welcome");
      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Could not verify code");
    } finally {
      setVerifying(false);
    }
  }

  if (step === "email") {
    return (
      <form onSubmit={sendCode} className="space-y-4">
        <div>
          <label
            htmlFor="otp-email"
            className="mb-1.5 block text-xs text-white/50"
          >
            Email
          </label>
          <input
            id="otp-email"
            type="email"
            autoComplete="email"
            autoFocus
            required
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputClass}
          />
          <p className="mt-2 text-xs text-white/35">
            We’ll email a free 6-digit code. No password needed.
          </p>
        </div>

        <button
          type="submit"
          disabled={sending || !email}
          className={authPrimaryButtonClass}
        >
          {sending ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Sending code…
            </>
          ) : (
            "Send code"
          )}
        </button>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-full text-center text-sm text-white/40 transition hover:text-white"
          >
            Back
          </button>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={verifyCode} className="space-y-4">
      <div>
        <label
          htmlFor="otp-code"
          className="mb-1.5 block text-xs text-white/50"
        >
          Enter code sent to {email}
        </label>
        <input
          id="otp-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          required
          maxLength={6}
          placeholder="6-digit code"
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          className={authInputClass}
        />
        {devHint && (
          <p className="mt-2 rounded-[10px] border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            {devHint}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={verifying || code.length !== 6}
        className={authPrimaryButtonClass}
      >
        {verifying ? (
          <>
            <Loader2 size={16} className="mr-2 animate-spin" />
            Verifying…
          </>
        ) : (
          "Verify & continue"
        )}
      </button>

      <div className="flex items-center justify-between gap-3 text-sm">
        <button
          type="button"
          onClick={() => {
            setStep("email");
            setCode("");
            setDevHint(null);
          }}
          className="text-white/40 transition hover:text-white"
        >
          Change email
        </button>
        <button
          type="button"
          disabled={sending}
          onClick={() => {
            void resendCode();
          }}
          className="text-white/70 underline decoration-white/30 underline-offset-2 hover:text-white disabled:opacity-50"
        >
          Resend code
        </button>
      </div>

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="w-full text-center text-sm text-white/40 transition hover:text-white"
        >
          Back
        </button>
      )}
    </form>
  );
}
