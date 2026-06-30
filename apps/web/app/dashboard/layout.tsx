"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DevModeBadge } from "@/components/DevModeBadge";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Creator Hub",
    icon: "🏠",
  },
  {
    href: "/dashboard/widgets",
    label: "Widgets",
    icon: "🎁",
  },
  {
    href: "/dashboard/overlays",
    label: "OBS Overlays",
    icon: "🔗",
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    icon: "📊",
  },
  {
    href: "/dashboard/billing",
    label: "Membership",
    icon: "💳",
  },
  {
    href: "/profile",
    label: "My Profile",
    icon: "👤",
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: "⚙️",
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-black text-white">
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-72 border-r border-white/10 bg-zinc-950/95 p-5 backdrop-blur-xl lg:block">
        <Link href="/dashboard" className="block">
          <div className="rounded-3xl border border-pink-500/20 bg-pink-500/10 p-5">
            <div className="text-3xl">✨</div>
            <div className="mt-3 text-2xl font-black">OMSW Live</div>
            <div className="mt-1 text-xs text-pink-200/80">
              Make Every Live Unforgettable.
            </div>
          </div>
        </Link>

        <nav className="mt-6 space-y-2">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  active
                    ? "border border-pink-500/40 bg-pink-500/20 text-pink-100"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-5 left-5 right-5">
          <a
            href="/logout"
            className="block rounded-2xl bg-zinc-800 px-4 py-3 text-center text-sm font-bold transition hover:bg-zinc-700"
          >
            Logout
          </a>
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/80 px-4 py-4 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="font-black">
            ✨ OMSW Live
          </Link>

          <a
            href="/logout"
            className="rounded-xl bg-zinc-800 px-3 py-2 text-sm font-bold"
          >
            Logout
          </a>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs font-bold text-zinc-300"
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </div>
      </header>

      <div className="lg:pl-72">{children}</div>
      <DevModeBadge />
    </div>
  );
}
