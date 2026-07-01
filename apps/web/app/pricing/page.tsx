import Link from "next/link";

const plans = [
  {
    name: "Trial",
    emoji: "🎁",
    price: "Free",
    subtitle: "9 days",
    description: "Explore OMSW Live before becoming a member.",
    button: "Start Free Trial",
    href: "/register",
    highlight: false,
    features: [
      "All core widgets",
      "OBS overlays",
      "Creator dashboard",
      "Live connection",
      "Widget preview",
    ],
  },
  {
    name: "Creator",
    emoji: "⭐",
    price: "฿99",
    subtitle: "/ month",
    description: "Founder price for the first 100 creators.",
    button: "Become a Founder",
    href: "/dashboard/billing",
    highlight: true,
    badge: "Founder Price",
    features: [
      "Everything in Trial",
      "Founder badge",
      "Lifetime founder price",
      "All widgets unlocked",
      "Priority updates",
    ],
  },
  {
    name: "Pro",
    emoji: "💎",
    price: "฿299",
    subtitle: "/ month",
    description: "For creators who want advanced tools and future features.",
    button: "Upgrade to Pro",
    href: "/dashboard/billing",
    highlight: false,
    badge: "Coming Soon",
    features: [
      "Everything in Creator",
      "Analytics",
      "Marketplace access",
      "Premium themes",
      "AI features coming soon",
    ],
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <Link href="/" className="text-sm font-bold text-pink-400">
            ← Back to Home
          </Link>

          <div className="mt-8 text-sm font-black text-pink-400">
            OMSW Live Pricing
          </div>

          <h1 className="mt-3 text-5xl font-black md:text-7xl">
            Make Every Live Unforgettable.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-zinc-400">
            Choose the membership that fits your creator journey. Start free,
            then become one of the first 100 Founder members.
          </p>
        </div>

        <section className="mb-10 rounded-[2rem] border border-pink-500/30 bg-pink-500/10 p-6 text-center">
          <div className="text-3xl">⭐</div>
          <h2 className="mt-3 text-3xl font-black">Founder Program</h2>
          <p className="mt-2 text-zinc-300">
            First 100 creators get the Creator plan for ฿99/month.
          </p>

          <div className="mx-auto mt-5 h-3 max-w-xl overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full w-[0%] rounded-full bg-pink-500" />
          </div>

          <p className="mt-3 text-sm font-bold text-pink-200">
            0 / 100 Founder spots claimed
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-[2rem] border p-8 ${
                plan.highlight
                  ? "border-pink-500 bg-pink-500/10 shadow-2xl shadow-pink-500/10"
                  : "border-white/10 bg-zinc-950"
              }`}
            >
              {plan.badge && (
                <div className="mb-4 w-fit rounded-full bg-pink-600 px-3 py-1 text-xs font-black">
                  {plan.badge}
                </div>
              )}

              <div className="text-4xl">{plan.emoji}</div>

              <h2 className="mt-4 text-3xl font-black">{plan.name}</h2>

              <p className="mt-2 text-sm text-zinc-400">{plan.description}</p>

              <div className="mt-6 flex items-end gap-2">
                <div className="text-5xl font-black">{plan.price}</div>
                <div className="pb-2 text-zinc-400">{plan.subtitle}</div>
              </div>

              <ul className="mt-8 space-y-3 text-sm text-zinc-300">
                {plan.features.map((feature) => (
                  <li key={feature}>✅ {feature}</li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`mt-8 block rounded-xl px-5 py-3 text-center font-black transition ${
                  plan.highlight
                    ? "bg-pink-600 hover:bg-pink-500"
                    : "bg-zinc-800 hover:bg-zinc-700"
                }`}
              >
                {plan.button}
              </Link>
            </div>
          ))}
        </section>

        <section className="mt-12 rounded-[2rem] border border-white/10 bg-zinc-950 p-8">
          <h2 className="text-3xl font-black">Compare Plans</h2>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-zinc-400">
                <tr className="border-b border-white/10">
                  <th className="py-4">Feature</th>
                  <th className="py-4">Trial</th>
                  <th className="py-4">Creator</th>
                  <th className="py-4">Pro</th>
                </tr>
              </thead>

              <tbody className="text-zinc-300">
                {[
                  ["Core widgets", "✅", "✅", "✅"],
                  ["OBS overlays", "✅", "✅", "✅"],
                  ["Founder badge", "—", "✅", "—"],
                  ["Lifetime founder price", "—", "✅", "—"],
                  ["Analytics", "—", "Coming Soon", "✅"],
                  ["Marketplace", "—", "Coming Soon", "✅"],
                  ["AI features", "—", "Coming Soon", "Coming Soon"],
                ].map((row) => (
                  <tr key={row[0]} className="border-b border-white/5">
                    {row.map((cell) => (
                      <td key={cell} className="py-4">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}