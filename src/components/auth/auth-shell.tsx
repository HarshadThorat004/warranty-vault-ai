import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ShieldCheck } from "lucide-react";

export const authInputClass =
  "w-full rounded-[10px] border border-white/15 bg-transparent px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/35";

export const authPrimaryButtonClass =
  "inline-flex w-full items-center justify-center rounded-[10px] bg-white py-2.5 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35";

export const authSecondaryButtonClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-white/15 bg-transparent px-3 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.04] disabled:opacity-50";

function AuthBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[#050505]" />
      {/* Soft fabric / smoke sweeps */}
      <div
        className="absolute -left-[20%] bottom-[-10%] h-[70%] w-[70%] opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 30% 70%, rgba(120,120,120,0.35) 0%, transparent 55%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute -right-[15%] top-[-5%] h-[65%] w-[65%] opacity-45"
        style={{
          background:
            "radial-gradient(ellipse at 70% 20%, rgba(140,140,140,0.4) 0%, transparent 50%)",
          filter: "blur(50px)",
        }}
      />
      <div
        className="absolute left-[10%] top-[35%] h-[50%] w-[50%] rotate-[-18deg] opacity-25"
        style={{
          background:
            "linear-gradient(135deg, transparent 20%, rgba(100,100,100,0.45) 45%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.18] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
          backgroundSize: "180px 180px",
        }}
      />
    </div>
  );
}

export function AuthBrandMark({ className = "" }: { className?: string }) {
  return (
    <div
      className={`mx-auto flex h-10 w-10 items-center justify-center rounded-[10px] border border-white/15 bg-black text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04)] ${className}`}
      aria-hidden
    >
      <ShieldCheck size={20} strokeWidth={1.75} />
    </div>
  );
}

type AuthShellProps = {
  children: ReactNode;
  /** Narrower max width for forms; wider for legal prose */
  wide?: boolean;
  showHomeLink?: boolean;
};

export default function AuthShell({
  children,
  wide = false,
  showHomeLink = true,
}: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <AuthBackground />

      {showHomeLink && (
        <Link
          href="/"
          className="absolute left-5 top-5 z-20 inline-flex items-center gap-1 text-sm text-white/55 transition hover:text-white"
        >
          <ChevronLeft size={16} strokeWidth={1.75} />
          Home
        </Link>
      )}

      <div
        className={`relative z-10 mx-auto flex min-h-screen flex-col justify-center px-4 py-16 ${
          wide ? "max-w-2xl" : "max-w-[380px]"
        }`}
      >
        {children}
      </div>
    </main>
  );
}

type AuthLegalFooterProps = {
  action: "in" | "up";
};

export function AuthLegalFooter({ action }: AuthLegalFooterProps) {
  return (
    <p className="mt-8 text-center text-xs leading-5 text-white/40">
      By signing {action}, you agree to our{" "}
      <Link href="/terms" className="underline decoration-white/30 underline-offset-2 hover:text-white/70">
        Terms
      </Link>{" "}
      and{" "}
      <Link
        href="/privacy"
        className="underline decoration-white/30 underline-offset-2 hover:text-white/70"
      >
        Privacy Policy
      </Link>
      .
    </p>
  );
}
