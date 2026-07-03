import Link from "next/link";

const steps = [
  { label: "Creator Account", href: "/onboarding/creator" },
  { label: "Connect LIVE", href: "/onboarding/connect" },
  { label: "OBS Overlay", href: "/onboarding/overlay" },
  { label: "Test Widget", href: "/onboarding/test" },
];

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-black p-6 text-white lg:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-black text-pink-400">
              OMSW Live Setup
            </div>

            <h1 className="mt-2 text-4xl font-black md:text-5xl">
              Welcome to OMSW Live
            </h1>

            <p className="mt-2 text-zinc-400">
              Complete these quick steps to get your first OBS overlay running.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="w-fit rounded-xl bg-zinc-800 px-5 py-3 font-black transition hover:bg-zinc-700"
          >
            Skip setup
          </Link>
        </div>

        <div className="mb-8 grid gap-3 md:grid-cols-4">
          {steps.map((step, index) => (
            <Link
              key={step.href}
              href={step.href}
              className="rounded-2xl border border-white/10 bg-zinc-950 p-4 transition hover:border-pink-500"
            >
              <div className="text-xs font-black text-pink-400">
                Step {index + 1}
              </div>

              <div className="mt-1 font-black">{step.label}</div>
            </Link>
          ))}
        </div>

        {children}
      </div>
    </main>
  );
}