"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingCard } from "@/components/ui/LoadingCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
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
  { name: "Gift Goal", emoji: "🎁", path: "/widget/gift-goal" },
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
  { name: "Fortune Stick", emoji: "🙏", path: "/widget/fortune-stick" },
];

export default function OverlayUrlsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [origin, setOrigin] = useState("");
  const [loading, setLoading] = useState(true);

  const creatorTrialEnded = useMemo(() => {
    return subscription?.plan === "free" && isSubscriptionExpired(subscription);
  }, [subscription]);

  const canCopy = canCopyOverlay(subscription);

  useEffect(() => {
    const loadData = async () => {
      if (typeof window !== "undefined") {
        setOrigin(window.location.origin);
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setLoading(false);
        router.replace("/login");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id,email,display_name,overlay_id")
        .eq("id", session.user.id)
        .single();

      if (profileError || !profileData) {
        setLoading(false);
        router.replace("/login");
        return;
      }

      const { data: subscriptionData } = await supabase
        .from("subscriptions")
        .select("id,user_id,plan,status,started_at,expires_at,created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setProfile(profileData);
      setSubscription((subscriptionData as Subscription | null) || null);
      setLoading(false);
    };

    loadData();
  }, [router, supabase]);

  const copy = async (url: string) => {
    if (!canCopy) {
      alert(
        "Upgrade to Creator to unlock OBS overlays and premium live effects.",
      );
      return;
    }

    await navigator.clipboard.writeText(url);
    alert("OBS overlay link copied successfully!");
  };

  return (
    <main className="min-h-screen bg-black p-6 text-white lg:p-8">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          badge="OBS Overlays"
          title="Copy Your OBS Browser Source Links"
          description="Copy and manage your OMSW Live overlay links for OBS Studio."
        />

        {creatorTrialEnded && (
          <Card className="mb-6 border-pink-500 bg-pink-500/10">
            <h2 className="text-2xl font-black text-pink-200">
              ✨ Your Creator Trial Has Ended
            </h2>

            <p className="mt-2 text-sm text-pink-100/80">
              You're now on the Free plan. Upgrade to Creator to unlock all
              widgets, live effects, and premium OBS overlays.
            </p>

            <Button
              href="/dashboard/billing"
              variant="upgrade"
              className="mt-4"
            >
              Upgrade to Creator
            </Button>
          </Card>
        )}

        {loading ? (
          <LoadingCard />
        ) : (
          <div className="space-y-4">
            {WIDGETS.map((widget) => {
              const url = `${origin}${widget.path}/${profile?.overlay_id || ""}${
                widget.query || ""
              }`;

              return (
                <Card key={widget.name}>
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-2xl font-black">
                        {widget.emoji} {widget.name}
                      </h2>

                      <div className="mt-3 break-all rounded-2xl bg-black p-4 text-sm text-zinc-300">
                        {canCopy
                          ? url
                          : "🔒 Upgrade to Creator to unlock this OBS overlay"}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() => copy(url)}
                        disabled={!canCopy}
                        variant="secondary"
                      >
                        {canCopy ? "Copy Link" : "🔒 Copy Link"}
                      </Button>

                      <Link
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl bg-zinc-700 px-4 py-3 font-black transition hover:bg-zinc-600"
                      >
                        Open Preview
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
