import { FileText } from "lucide-react";

type Props = {
  className?: string;
  /** Visual height utility, e.g. h-40 or min-h-[260px] */
  sizeClassName?: string;
  label?: string;
};

/**
 * Themed stand-in when a product document is a PDF (not a previewable image).
 */
export default function PdfPlaceholder({
  className = "",
  sizeClassName = "h-40",
  label = "PDF document",
}: Props) {
  return (
    <div
      className={`relative flex ${sizeClassName} w-full flex-col items-center justify-center overflow-hidden bg-neutral-950 ${className}`.trim()}
      aria-hidden
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(34,211,238,0.18) 0%, transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(34,211,238,0.08) 0%, transparent 45%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative flex flex-col items-center gap-3 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-[0_0_0_1px_rgba(34,211,238,0.08)]">
          <FileText size={26} strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-sm font-medium tracking-tight text-white/90">
            {label}
          </p>
          <p className="mt-1 text-[11px] text-gray-500">
            Warranty Vault · secure file
          </p>
        </div>
      </div>
    </div>
  );
}
