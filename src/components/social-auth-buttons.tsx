"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { authSecondaryButtonClass } from "@/components/auth/auth-shell";

type AuthProviders = {
  google: boolean;
  emailOtp: boolean;
};

type Props = {
  callbackUrl?: string;
  mode?: "signin" | "signup";
  onUseOtp?: () => void;
  showOtpShortcut?: boolean;
  showOrDivider?: boolean;
};

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.2 14.5 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-1.7H12z"
      />
      <path
        fill="#34A853"
        d="M3.9 7.3 7.1 9.7C8 7.5 9.8 6 12 6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.2 14.5 2 12 2 8.2 2 4.9 4.1 3.9 7.3z"
      />
      <path
        fill="#4A90E2"
        d="M12 22c2.4 0 4.5-.8 6-2.1l-2.9-2.2c-.8.5-1.8.9-3.1.9-3.9 0-5.3-2.5-5.5-3.8l-3.2 2.5C4.9 19.9 8.2 22 12 22z"
      />
      <path
        fill="#FBBC05"
        d="M21.6 12.2c0-.7-.1-1.2-.2-1.7H12v3.9h5.5c-.3 1.3-1.1 2.3-2.2 3l2.9 2.2c1.7-1.6 2.9-4 2.9-7.4z"
      />
    </svg>
  );
}

export default function SocialAuthButtons({
  callbackUrl = "/dashboard",
  onUseOtp,
  showOtpShortcut = true,
  showOrDivider = true,
}: Props) {
  const [providers, setProviders] = useState<AuthProviders | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/options")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setProviders({
            google: Boolean(data.google),
            emailOtp: Boolean(data.emailOtp),
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProviders({ google: false, emailOtp: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleGoogle() {
    try {
      setBusy(true);
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      await signIn("google", {
        callbackUrl: callbackUrl.startsWith("http")
          ? callbackUrl
          : `${origin}${callbackUrl}`,
      });
    } catch (error) {
      console.error(error);
      toast.error("Could not start Google sign-in");
      setBusy(false);
    }
  }

  if (!providers) {
    return (
      <div className="flex items-center justify-center gap-2 py-3 text-sm text-white/40">
        <Loader2 size={14} className="animate-spin" />
        Loading options…
      </div>
    );
  }

  const showOtp = showOtpShortcut && providers.emailOtp && Boolean(onUseOtp);
  const hasAny = providers.google || showOtp;

  if (!hasAny) {
    return null;
  }

  return (
    <div className="space-y-5">
      <div
        className={`grid gap-2.5 ${
          providers.google && showOtp ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
        }`}
      >
        {providers.google && (
          <button
            type="button"
            onClick={() => void handleGoogle()}
            disabled={busy}
            className={authSecondaryButtonClass}
          >
            {busy ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            <span className="truncate">Continue with Google</span>
          </button>
        )}

        {showOtp && (
          <button
            type="button"
            onClick={onUseOtp}
            className={authSecondaryButtonClass}
          >
            <Mail size={16} className="shrink-0 text-white/70" />
            <span className="truncate">Continue with Email OTP</span>
          </button>
        )}
      </div>

      {showOrDivider && hasAny && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#050505] px-3 text-white/35">or</span>
          </div>
        </div>
      )}
    </div>
  );
}
