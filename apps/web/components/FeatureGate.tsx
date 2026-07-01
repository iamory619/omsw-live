"use client";

import Link from "next/link";
import type { Subscription } from "@/lib/core/types";
import type { Feature } from "@/lib/core/permissions";
import { canUse } from "@/lib/core/permissions";

type Props = {
  subscription: Subscription | null;
  feature: Feature;
  children: React.ReactNode;
};

export function FeatureGate({ subscription, feature, children }: Props) {
  const plan = subscription?.plan || "trial";
  const allowed = canUse(plan, feature);

  if (allowed) return <>{children}</>;

  return (
    <section className="rounded-[2rem] border border-pink-500/30 bg-pink-500/10 p-8 text-white">
      <div className="text-4xl">🔒</div>

      <h2 className="mt-4 text-3xl font-black">Upgrade Required</h2>

      <p className="mt-2 text-zinc-300">
        This feature is not included in your current membership.
      </p>

      <Link
        href="/dashboard/billing"
        className="mt-5 inline-block rounded-xl bg-pink-600 px-5 py-3 font-black transition hover:bg-pink-500"
      >
        Upgrade Membership
      </Link>
    </section>
  );
}