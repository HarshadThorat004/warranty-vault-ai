import Image from "next/image";

const SIZE_MAP = {
  sm: 32,
  md: 40,
  lg: 48,
} as const;

const WORDMARK_CLASS = {
  sm: "text-sm",
  md: "text-[15px]",
  lg: "text-base",
} as const;

type BrandLogoProps = {
  variant?: "mark" | "full";
  size?: keyof typeof SIZE_MAP;
  /** Extra line under the wordmark; pass false to hide */
  tagline?: string | false;
  className?: string;
  markClassName?: string;
};

export default function BrandLogo({
  variant = "full",
  size = "md",
  tagline,
  className = "",
  markClassName = "",
}: BrandLogoProps) {
  const px = SIZE_MAP[size];

  const mark = (
    <Image
      src="/brand/logo-mark.svg"
      alt="Warranty Vault"
      width={px}
      height={px}
      className={`shrink-0 ${markClassName}`.trim()}
      unoptimized
      priority
    />
  );

  if (variant === "mark") {
    return (
      <span
        className={`inline-flex shrink-0 ${className}`.trim()}
        style={{ width: px, height: px }}
        role="img"
        aria-label="Warranty Vault"
      >
        {mark}
      </span>
    );
  }

  const resolvedTagline =
    tagline === false ? null : typeof tagline === "string" ? tagline : null;

  return (
    <span
      className={`inline-flex min-w-0 items-center gap-2.5 sm:gap-3 ${className}`.trim()}
    >
      <span
        className="inline-flex shrink-0"
        style={{ width: px, height: px }}
        aria-hidden
      >
        {mark}
      </span>
      <span className="min-w-0 text-left">
        <span
          className={`block font-semibold tracking-tight text-white ${WORDMARK_CLASS[size]}`}
        >
          <span className="sm:hidden">Warranty Vault</span>
          <span className="hidden sm:inline">Warranty Vault AI</span>
        </span>
        {resolvedTagline ? (
          <span className="mt-0.5 block truncate text-[11px] text-gray-500">
            {resolvedTagline}
          </span>
        ) : null}
      </span>
    </span>
  );
}
