import type { AppPlan } from "@/lib/core/types";

type Props = {
  plan?: AppPlan | null;
};

export function PlanBadge({ plan = "free" }: Props) {
  let label = "🆓 Free";
  let className = "bg-green-500/20 text-green-200 border-green-500/30";

  switch (plan) {
    case "creator":
      label = "⭐ Creator";
      className = "bg-pink-500/20 text-pink-200 border-pink-500/30";
      break;

    case "pro":
      label = "💎 Pro";
      className = "bg-cyan-500/20 text-cyan-200 border-cyan-500/30";
      break;

    case "owner":
      label = "👑 Owner";
      className = "bg-yellow-500/20 text-yellow-200 border-yellow-500/30";
      break;
  }

  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-black ${className}`}
    >
      {label}
    </span>
  );
}