import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PlanBadge } from "@/components/ui/PlanBadge";
import { SectionHeader } from "@/components/ui/SectionHeader";

const plans = [
  {
    name: "Free",
    plan: "free" as const,
    price: "฿0",
    period: "forever",
    description: "Start using OMSW Live with basic live tools.",
    cta: "Start Free",
    href: "/register",
    features: [
      "Gift Goal widget",
      "OBS overlay link",
      "Copy OBS overlay link",
      "Test widget",
      "Basic widget settings",
    ],
  },
  {
    name: "Creator",
    plan: "creator" as const,
    price: "฿99",
    period: "/ month",
    description: "Unlock premium widgets and live effects.",
    cta: "Upgrade to Creator",
    href: "/dashboard/billing",
    popular: true,
    features: [
      "Everything in Free",
      "Magic Lantern",
      "Gift Vehicle",
      "Gift Basket",
      "Fortune Reading",
      "Future Creator widgets",
      "Priority updates",
    ],
  },
  {
    name: "Pro",
    plan: "pro" as const,
    price: "฿299",
    period: "/ month",
    description: "For serious creators who want advanced tools.",
    cta: "Go Pro",
    href: "/dashboard/billing",
    features: [
      "Everything in Creator",
      "Analytics",
      "Marketplace",
      "Premium themes",
      "AI widgets and automations",
      "Early access features",
    ],
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-black p-6 text-white lg:p-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          badge="Pricing"
          title="Choose the plan that fits your LIVE"
          description="Start free, upgrade when you are ready, and unlock more widgets as your live grows."
        />

        <section className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={
                plan.popular
                  ? "relative border-pink-500/50 bg-pink-500/10 shadow-2xl shadow-pink-500/10"
                  : ""
              }
            >
              {plan.popular && (
                <div className="absolute right-6 top-6 rounded-full bg-pink-600 px-3 py-1 text-xs font-black">
                  Most Popular
                </div>
              )}

              <PlanBadge plan={plan.plan} />

              <h2 className="mt-5 text-3xl font-black">{plan.name}</h2>

              <p className="mt-2 min-h-[48px] text-sm text-zinc-400">
                {plan.description}
              </p>

              <div className="mt-6 flex items-end gap-2">
                <div className="text-6xl font-black">{plan.price}</div>
                <div className="pb-2 text-zinc-400">{plan.period}</div>
              </div>

              <ul className="mt-8 space-y-3 text-sm text-zinc-200">
                {plan.features.map((feature) => (
                  <li key={feature}>✅ {feature}</li>
                ))}
              </ul>

              <Button
                href={plan.href}
                variant={plan.popular ? "upgrade" : "secondary"}
                className="mt-8 w-full"
              >
                {plan.cta}
              </Button>
            </Card>
          ))}
        </section>

        <section className="mt-10 rounded-[2rem] border border-white/10 bg-zinc-950 p-8">
          <h2 className="text-3xl font-black">Compare plans</h2>

          <div className="mt-6 overflow-x-auto rounded-2xl bg-black">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-zinc-400">
                <tr className="border-b border-white/10">
                  <th className="p-4">Feature</th>
                  <th className="p-4">Free</th>
                  <th className="p-4">Creator</th>
                  <th className="p-4">Pro</th>
                </tr>
              </thead>

              <tbody className="text-zinc-200">
                {[
                  ["Gift Goal", "✅", "✅", "✅"],
                  ["Magic Lantern", "—", "✅", "✅"],
                  ["Gift Vehicle", "—", "✅", "✅"],
                  ["Gift Basket", "—", "✅", "✅"],
                  ["Fortune Reading", "—", "✅", "✅"],
                  ["Analytics", "—", "—", "✅"],
                  ["Marketplace", "—", "—", "✅"],
                  ["AI Widgets", "—", "—", "✅"],
                ].map((row) => (
                  <tr key={row[0]} className="border-b border-white/5">
                    {row.map((cell) => (
                      <td key={cell} className="p-4 font-bold">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10 text-center">
          <h2 className="text-3xl font-black">Ready to make your LIVE stand out?</h2>
          <p className="mt-2 text-zinc-400">
            Start free today. Upgrade when your live is ready for more effects.
          </p>

          <Link
            href="/register"
            className="mt-5 inline-block rounded-xl bg-pink-600 px-6 py-4 font-black transition hover:bg-pink-500"
          >
            Start OMSW Live Free
          </Link>
        </section>
      </div>
    </main>
  );
}