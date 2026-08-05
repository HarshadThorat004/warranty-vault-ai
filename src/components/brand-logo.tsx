import Image from "next/image";

const SIZE_MAP = {
  sm: 28,
  md: 36,
  lg: 44,
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
      alt=""
      width={px}
      height={px}
      className={`shrink-0 rounded-[10px] ${markClassName}`.trim()}
      unoptimized
      priority
    />
  );

  if (variant === "mark") {
    return (
      <span
        className={`inline-flex shrink-0 ${className}`.trim()}
        style={{ width: px, height: px }}
        aria-hidden
      >
        {mark}
      </span>
    );
  }

  const resolvedTagline =
    tagline === false ? null : typeof tagline === "string" ? tagline : null;

  return (
    <span className={`inline-flex items-center gap-3 ${className}`.trim()}>
      <span
        className="inline-flex shrink-0"
        style={{ width: px, height: px }}
        aria-hidden
      >
        {mark}
      </span>
      <span className="min-w-0 text-left">
        <span className="block text-sm font-semibold tracking-tight text-white">
          Warranty Vault AI
        </span>
        {resolvedTagline ? (
          <span className="mt-0.5 block text-[11px] text-gray-500">
            {resolvedTagline}
          </span>
        ) : null}
      </span>
    </span>
  );
}
