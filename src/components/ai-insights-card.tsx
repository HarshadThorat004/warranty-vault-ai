import { AlertTriangle, Clock, ShieldCheck } from "lucide-react";

import { EXPIRING_SOON_DAYS } from "@/constants/warranty";

type Props = {
  daysRemaining: number;
  isExpired: boolean;
};

export default function AIInsightsCard({ daysRemaining, isExpired }: Props) {
  const insight = isExpired
    ? {
        title: "Warranty expired",
        description:
          "Coverage has ended. Keep your documents handy if you need service history, and consider extended protection if available.",
        className: "border-red-500/20 bg-red-500/[0.06]",
        icon: <AlertTriangle size={18} className="text-red-400" />,
      }
    : daysRemaining <= EXPIRING_SOON_DAYS
      ? {
          title: "Expiring soon",
          description:
            "Coverage is nearing its end. Review documents and check if renewal or claims are needed.",
          className: "border-amber-500/20 bg-amber-500/[0.06]",
          icon: <Clock size={18} className="text-amber-400" />,
        }
      : {
          title: "Protected",
          description:
            "This product is under active warranty coverage. We’ll remind you before it expires.",
          className: "border-cyan-500/20 bg-cyan-500/[0.06]",
          icon: <ShieldCheck size={18} className="text-cyan-300" />,
        };

  return (
    <section
      className={`rounded-2xl border p-5 md:p-6 ${insight.className}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/30">
          {insight.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-500">
            Status insight
          </p>
          <h2 className="mt-2 text-base font-semibold text-white">
            {insight.title}
          </h2>
          <p className="mt-2 text-sm leading-7 text-gray-400">
            {insight.description}
          </p>
          {!isExpired && (
            <p className="mt-4 text-sm text-gray-300">
              <span className="font-semibold text-white">{daysRemaining}</span>{" "}
              days remaining
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
