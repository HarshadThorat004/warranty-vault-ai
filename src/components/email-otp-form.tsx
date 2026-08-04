"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-cyan-400/60";

type Props = {
  onBack?: () => void;
};

export default function EmailOtpForm({ onBack }: Props) {
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
      router.push("/dashboard");
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
          <label htmlFor="otp-email" className="mb-1.5 block text-sm text-gray-400">
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
            className={inputClass}
          />
          <p className="mt-2 text-xs text-gray-500">
            We’ll email a free 6-digit code. No password needed.
          </p>
          <p className="mt-1 text-xs text-amber-300/80">
            Until a Resend domain is verified, live email OTP only works for your Resend account email.
          </p>
        </div>

        <button
          type="submit"
          disabled={sending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-black transition hover:bg-gray-100 disabled:opacity-50"
        >
          {sending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Sending code…
            </>
          ) : (
            <>
              Send code
              <ArrowRight size={16} />
            </>
          )}
        </button>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-full text-center text-sm text-gray-500 hover:text-white"
          >
            Back to password sign-in
          </button>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={verifyCode} className="space-y-4">
      <div>
        <label htmlFor="otp-code" className="mb-1.5 block text-sm text-gray-400">
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
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className={inputClass}
        />
        {devHint && (
          <p className="mt-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            {devHint}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={verifying || code.length !== 6}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-black transition hover:bg-gray-100 disabled:opacity-50"
      >
        {verifying ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Verifying…
          </>
        ) : (
          <>
            Verify & continue
            <ArrowRight size={16} />
          </>
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
          className="text-gray-500 hover:text-white"
        >
          Change email
        </button>
        <button
          type="button"
          disabled={sending}
          onClick={() => {
            void resendCode();
          }}
          className="text-cyan-300 hover:underline disabled:opacity-50"
        >
          Resend code
        </button>
      </div>
    </form>
  );
}
