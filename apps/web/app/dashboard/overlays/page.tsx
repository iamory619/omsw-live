"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Subscription } from "@/lib/core/types";
import { canCopyOverlay } from "@/lib/core/permissions";
import { isSubscriptionExpired } from "@/lib/core/subscriptions";

type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  overlay_id: string;
};

const WIDGETS = [
  {
    name: "Gift Goal",
    emoji: "🎁",
    path: "/widget/gift-goal",
  },
  {
    name: "Magic Lantern",
    emoji: "🧙",
    path: "/widget/magic-lantern",
    query: "?lantern=phoenix",
  },
  {
    name: "Gift Vehicle",
    emoji: "🛺",
    path: "/widget/gift-vehicle",
    query: "?vehicle=tuktuk",
  },
  {
    name: "Gift Basket",
    emoji: "🧺",
    path: "/widget/gift-plane",
    query: "?basket=basket-1",
  },
  {
    name: "Fortune Stick",
    emoji: "🙏",
    path: "/widget/fortune-stick",
  },
];

export default function OverlayUrlsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [origin, setOrigin] = useState("");
  const [loading, setLoading] = useState(true);

  const trialExpired = useMemo(() => {
    return isSubscriptionExpired(subscription);
  }, [subscription]);

  const canCopy = canCopyOverlay(subscription);

  useEffect(() => {
    setOrigin(window.location.origin);

    const loadData = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id,email,display_name,overlay_id")
        .eq("id", user.id)
        .single();

      if (!profileData) {
        router.replace("/login");
        return;
      }

      const { data: subscriptionData } = await supabase
        .from("subscriptions")
        .select("id,user_id,plan,status,started_at,expires_at,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      setProfile(profileData);
      setSubscription(subscriptionData as Subscription | null);
      setLoading(false);
    };

    loadData();
  }, [router, supabase]);

  const copy = async (url: string) => {
    if (!canCopy) {
      alert("Your trial has ended. Become a Founder to copy overlay links.");
      return;
    }

    await navigator.clipboard.writeText(url);
    alert("Overlay link copied successfully!");
  };

  return (
    <main className="min-h-screen bg-black p-6 text-white lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-black">OBS Overlays</h1>

          <p className="mt-2 text-zinc-400">
            Your overlay links, ready to use in OBS.
          </p>
        </div>

        {trialExpired && subscription?.plan === "trial" && (
          <section className="mb-6 rounded-[2rem] border border-red-500 bg-red-500/10 p-6">
            <h2 className="text-2xl font-black text-red-200">
              🎁 Your Trial Has Ended
            </h2>

            <p className="mt-2 text-sm text-red-100/80">
              Upgrade to Creator to unlock your overlay links and continue using
              OMSW Live.
            </p>

            <Link
              href="/dashboard/billing"
              className="mt-4 inline-block rounded-xl bg-pink-600 px-5 py-3 font-bold transition hover:bg-pink-500"
            >
              Become a Founder
            </Link>
          </section>
        )}

        {loading && (
          <div className="rounded-[2rem] border border-white/10 bg-zinc-950 p-6 text-zinc-400">
            Loading your overlays...
          </div>
        )}

        {!loading && (
          <div className="space-y-4">
            {WIDGETS.map((widget) => {
              const url = `${origin}${widget.path}/${profile?.overlay_id || ""}${
                widget.query || ""
              }`;

              return (
                <div
                  key={widget.name}
                  className="rounded-[2rem] border border-white/10 bg-zinc-950 p-6"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-2xl font-black">
                        {widget.emoji} {widget.name}
                      </h2>

                      <div className="mt-3 break-all rounded-2xl bg-black p-4 text-sm text-zinc-300">
                        {canCopy ? url : "🔒 Become a Founder to unlock this overlay"}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => copy(url)}
                        disabled={!canCopy}
                        className="rounded-xl bg-purple-600 px-4 py-2 font-bold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {canCopy ? "Copy Link" : "🔒 Copy Link"}
                      </button>

                      <Link
                        href={url}
                        target="_blank"
                        className="rounded-xl bg-zinc-700 px-4 py-2 font-bold transition hover:bg-zinc-600"
                      >
                        Open Preview
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
