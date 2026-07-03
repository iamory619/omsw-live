"use client";

import { FEATURES, isDevelopmentMode } from "@/lib/config/app";

type Props = {
  onSimulateTrial?: () => void;
  onSimulateExpired?: () => void;
  onSimulatePro?: () => void;
  onSimulatePremium?: () => void;
  onSimulateOwner?: () => void;
};

export function DeveloperToolsCard({
  onSimulateTrial,
  onSimulateExpired,
  onSimulatePro,
  onSimulatePremium,
  onSimulateOwner,
}: Props) {
  if (!isDevelopmentMode || !FEATURES.developerTools) return null;

  return (
    <section className="mb-8 rounded-[2rem] border border-green-500/40 bg-green-500/10 p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-green-200">
            🧪 Developer Tools
          </h2>

          <p className="mt-1 text-sm text-green-100/80">
            Available only in development mode. Automatically hidden in
            production.
          </p>
        </div>

        <span className="w-fit rounded-full bg-green-600 px-3 py-1 text-xs font-black">
          DEV ONLY
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSimulateTrial}
          className="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-bold transition hover:bg-zinc-700"
        >
          🎁 Creator Trial
        </button>

        <button
          type="button"
          onClick={onSimulateExpired}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold transition hover:bg-red-500"
        >
          ⛔ Trial Ended
        </button>

        <button
          type="button"
          onClick={onSimulatePro}
          className="rounded-xl bg-pink-600 px-4 py-2 text-sm font-bold transition hover:bg-pink-500"
        >
          ⭐ Creator
        </button>

        <button
          type="button"
          onClick={onSimulatePremium}
          className="rounded-xl bg-yellow-600 px-4 py-2 text-sm font-bold transition hover:bg-yellow-500"
        >
          💎 Pro
        </button>

        <button
          type="button"
          onClick={onSimulateOwner}
          className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold transition hover:bg-purple-500"
        >
          👑 Owner
        </button>
      </div>
    </section>
  );
}