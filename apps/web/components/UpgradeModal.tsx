"use client";

import { Button } from "@/components/ui/Button";

type Props = {
  open: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
};

export function UpgradeModal({
  open,
  title = "⭐ Creator Feature",
  description = "Upgrade to Creator to unlock premium widgets, live effects, and OBS overlays.",
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
      <div className="w-full max-w-lg rounded-[2rem] border border-pink-500/30 bg-zinc-950 p-8 text-white shadow-2xl shadow-pink-500/20">
        <div className="text-5xl">🔒</div>

        <h2 className="mt-5 text-3xl font-black">{title}</h2>

        <p className="mt-3 text-zinc-300">{description}</p>

        <ul className="mt-6 space-y-3 text-sm text-zinc-200">
          <li>✅ Premium live widgets</li>
          <li>✅ Beautiful live effects</li>
          <li>✅ OBS Browser Source overlays</li>
          <li>✅ Future Creator features</li>
        </ul>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            href="/dashboard/billing"
            variant="upgrade"
            className="flex-1"
          >
            Upgrade to Creator
          </Button>

          <Button
            onClick={onClose}
            variant="secondary"
            className="flex-1"
          >
            Maybe Later
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-zinc-500">
          Creator plans start at ฿99/month.
        </p>
      </div>
    </div>
  );
}