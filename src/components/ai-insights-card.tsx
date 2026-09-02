import { AlertTriangle, Clock, ShieldCheck } from "lucide-react";

import { EXPIRING_SOON_DAYS } from "@/constants/warranty";

type Props = {
  daysRemaining: number;
  isExpired: boolean;
  coverLabel?: string;
  nextAction?: string;
};

export default function AIInsightsCard({
  daysRemaining,
  isExpired,
  coverLabel,
  nextAction,
}: Props) {
  const cover = coverLabel || "Warranty";
  const insight = isExpired
    ? {
        title: `${cover} has ended`,
        description:
          nextAction ||
          "Keep the claim pack and invoice for service history. Check store or AMC cover if you added one.",
        className: "border-red-500/20 bg-red-500/[0.06]",
        icon: <AlertTriangle size={18} className="text-red-400" />,
      }
    : daysRemaining <= EXPIRING_SOON_DAYS
      ? {
          title: `${cover} ends in ${daysRemaining} days`,
          description:
            nextAction ||
            "Print the claim pack and confirm serial / IMEI before you visit a service centre.",
          className: "border-amber-500/20 bg-amber-500/[0.06]",
          icon: <Clock size={18} className="text-amber-400" />,
        }
      : {
          title: `${cover} is in force`,
          description:
            nextAction ||
            "We will remind you at 30 days, 7 days, and the day before this cover ends.",
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
            Next step
          </p>
          <h2 className="mt-2 text-base font-semibold text-white">
            {insight.title}
          </h2>
          <p className="mt-2 text-sm leading-7 text-gray-400">
            {insight.description}
          </p>
        </div>
      </div>
    </section>
  );
}
