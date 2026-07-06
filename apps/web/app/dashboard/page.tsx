"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DeveloperToolsCard } from "@/components/DeveloperToolsCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingCard } from "@/components/ui/LoadingCard";
import { PlanBadge } from "@/components/ui/PlanBadge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Subscription } from "@/lib/core/types";
import {
  getTrialDaysLeft,
  isSubscriptionExpired,
} from "@/lib/core/subscriptions";

type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  overlay_id: string;
  tiktok_username: string | null;
  created_at: string;
};

type WidgetSettings = {
  basket: string;
  vehicle: string;
  lantern: string;
};

export default function DashboardHomePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [settings, setSettings] = useState<WidgetSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const currentPlan = subscription?.plan || "free";
  const trialDaysLeft = useMemo(() => getTrialDaysLeft(subscription), [subscription]);
  const trialExpired = useMemo(() => isSubscriptionExpired(subscription), [subscription]);

  const creatorTrialLabel = useMemo(() => {
    if (currentPlan === "creator") {
      if (subscription?.expires_at) {
        return trialExpired ? "Trial Ended" : `${trialDaysLeft} days left`;
      }
      return "Active";
    }

    if (currentPlan === "pro") return "Active";
    if (currentPlan === "owner") return "Unlimited";

    return trialExpired ? "Ended" : `${trialDaysLeft} days`;
  }, [currentPlan, subscription, trialExpired, trialDaysLeft]);

  const creatorTrialTone =
    creatorTrialLabel === "Trial Ended" || creatorTrialLabel === "Ended"
      ? "text-red-300"
      : "text-green-300";

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setLoading(false);
        router.replace("/login");
        return;
      }

      const user = session.user;

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id,email,display_name,overlay_id,tiktok_username,created_at")
        .eq("id", user.id)
        .single();

      if (profileError || !profileData) {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      const { data: subscriptionData } = await supabase
        .from("subscriptions")
        .select("id,user_id,plan,status,started_at,expires_at,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: settingsData } = await supabase
        .from("widget_settings")
        .select("basket,vehicle,lantern")
        .eq("user_id", user.id)
        .single();

      setProfile(profileData);
      setSubscription(subscriptionData as Subscription | null);
      setSettings(settingsData || null);
      setLoading(false);
    };

    loadData();
  }, [router, supabase]);

  return (
    <main className="min-h-screen bg-black p-6 text-white lg:p-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          badge="Make Every Live Unforgettable."
          title={loading ? "Loading your dashboard..." : profile?.display_name || "Creator"}
          description="Everything you need to power your LIVE."
        />

        <DeveloperToolsCard
          onSimulateTrial={() => alert("Developer Preview: Use Mission Control to change the current plan.")}
          onSimulateExpired={() => alert("Developer Preview: Use Mission Control to simulate an expired Creator Trial.")}
          onSimulatePro={() => alert("Developer Preview: Use Mission Control to change the current plan.")}
          onSimulatePremium={() => alert("Developer Preview: Use Mission Control to change the current plan.")}
          onSimulateOwner={() => alert("Developer Preview: Use Mission Control to change the current role.")}
        />

        {loading ? (
          <LoadingCard />
        ) : (
          <>
            {trialExpired && subscription?.plan === "free" && (
              <Card className="mb-8 border-pink-500 bg-pink-500/10">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-pink-200">
                      ✨ Your Creator Trial Has Ended
                    </h2>
                    <p className="mt-2 text-sm text-pink-100/80">
                      You're now on the Free plan. Upgrade to Creator to unlock all widgets, live effects, and premium overlays.
                    </p>
                  </div>

                  <Button href="/dashboard/billing" variant="upgrade">
                    Upgrade to Creator
                  </Button>
                </div>
              </Card>
            )}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card>
                <div className="text-sm text-zinc-400">Current Plan</div>
                <div className="mt-3">
                  <PlanBadge plan={currentPlan} />
                </div>
              </Card>

              <Card>
                <div className="text-sm text-zinc-400">Creator Trial</div>
                <div className={`mt-3 text-3xl font-black ${creatorTrialTone}`}>
                  {creatorTrialLabel}
                </div>
              </Card>

              <Card>
                <div className="text-sm text-zinc-400">Creator Username</div>
                <div className="mt-3 break-all text-2xl font-black text-yellow-300">
                  {profile?.tiktok_username ? `@${profile.tiktok_username}` : "Not set"}
                </div>
              </Card>

              <Card>
                <div className="text-sm text-zinc-400">Creator ID</div>
                <div className="mt-3 break-all rounded-xl bg-black p-3 text-xs font-bold text-zinc-300">
                  {profile?.overlay_id || "-"}
                </div>
              </Card>
            </section>

            <section className="mt-8 grid gap-6 xl:grid-cols-3">
              <Link href="/dashboard/widgets" prefetch={false} className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-pink-500/20 to-zinc-950 p-6 transition hover:border-pink-500">
                <div className="text-4xl">🎁</div>
                <h2 className="mt-4 text-2xl font-black">Live Widgets</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Connect your TikTok LIVE account and customize your OMSW Live widgets.
                </p>
              </Link>

              <Link href="/dashboard/overlays" prefetch={false} className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-purple-500/20 to-zinc-950 p-6 transition hover:border-purple-500">
                <div className="text-4xl">🔗</div>
                <h2 className="mt-4 text-2xl font-black">OBS Overlays</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Copy and manage your OBS Browser Source overlays.
                </p>
              </Link>

              <Link href="/dashboard/billing" prefetch={false} className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-yellow-500/20 to-zinc-950 p-6 transition hover:border-yellow-500">
                <div className="text-4xl">💳</div>
                <h2 className="mt-4 text-2xl font-black">Billing</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Manage your subscription, Creator Trial, and billing.
                </p>
              </Link>
            </section>

            <Card className="mt-8">
              <h2 className="text-2xl font-black">Live Widget Preferences</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-black p-4">
                  <div className="text-sm text-zinc-400">Basket</div>
                  <div className="mt-1 font-black">{settings?.basket || "basket-1"}</div>
                </div>

                <div className="rounded-2xl bg-black p-4">
                  <div className="text-sm text-zinc-400">Vehicle Theme</div>
                  <div className="mt-1 font-black">{settings?.vehicle || "tuktuk"}</div>
                </div>

                <div className="rounded-2xl bg-black p-4">
                  <div className="text-sm text-zinc-400">Lantern Theme</div>
                  <div className="mt-1 font-black">{settings?.lantern || "phoenix"}</div>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </main>
  );
}