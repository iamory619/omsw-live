"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DeveloperToolsCard } from "@/components/DeveloperToolsCard";
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

  const currentPlan = subscription?.plan || "trial";

  const trialDaysLeft = useMemo(() => {
    return getTrialDaysLeft(subscription);
  }, [subscription]);

  const trialExpired = useMemo(() => {
    return isSubscriptionExpired(subscription);
  }, [subscription]);

  const loadData = async () => {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/login");
      return;
    }

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

    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("id,user_id,plan,status,started_at,expires_at,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (subscriptionError) {
      console.error("Load subscription error:", subscriptionError);
    }

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

  useEffect(() => {
    loadData();
  }, [router, supabase]);

  return (
    <main className="min-h-screen bg-black p-6 text-white lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="text-sm font-bold text-pink-400">
            Ready to create an amazing live today?
          </div>

          <h1 className="mt-2 text-4xl font-black md:text-5xl">
            {loading ? "Loading..." : profile?.display_name || "Creator"}
          </h1>

          <p className="mt-2 text-zinc-400">
            Everything you need to power your LIVE.
          </p>
        </div>

        <DeveloperToolsCard
          onSimulateTrial={() => alert("ตอนนี้ปุ่มนี้ยังเป็น UI จำลองเท่านั้น ให้เปลี่ยน Plan จริงที่หน้า Admin")}
          onSimulateExpired={() => alert("ตอนนี้ปุ่มนี้ยังเป็น UI จำลองเท่านั้น ให้กด Disable หรือปรับ expires_at ที่ Admin/DB")}
          onSimulatePro={() => alert("ตอนนี้ปุ่มนี้ยังเป็น UI จำลองเท่านั้น ให้เปลี่ยน Plan จริงที่หน้า Admin")}
          onSimulatePremium={() => alert("ตอนนี้ปุ่มนี้ยังเป็น UI จำลองเท่านั้น ให้เปลี่ยน Plan จริงที่หน้า Admin")}
          onSimulateOwner={() => alert("Owner ตอนนี้เป็น Role แล้ว ให้ตั้ง Role ที่หน้า Admin")}
        />

        {trialExpired && subscription?.plan === "trial" && (
          <section className="mb-8 rounded-[2rem] border border-red-500 bg-red-500/10 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-black text-red-200">
                  ⚠️ Trial หมดอายุแล้ว
                </h2>

                <p className="mt-2 text-sm text-red-100/80">
                  ปุ่ม Connect, Copy และ Test Widget จะถูกล็อกไว้ชั่วคราว
                  กรุณาอัปเกรดเป็น Pro เพื่อใช้งานต่อ
                </p>
              </div>

              <Link
                href="/dashboard/billing"
                className="w-fit rounded-xl bg-pink-600 px-5 py-3 font-bold transition hover:bg-pink-500"
              >
                Upgrade Now
              </Link>
            </div>
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[2rem] border border-white/10 bg-zinc-950 p-6">
            <div className="text-sm text-zinc-400">Membership</div>
            <div className="mt-3 text-3xl font-black capitalize text-pink-300">
              {loading ? "..." : currentPlan}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-zinc-950 p-6">
            <div className="text-sm text-zinc-400">Days Remaining</div>
            <div
              className={`mt-3 text-3xl font-black ${
                trialExpired ? "text-red-300" : "text-green-300"
              }`}
            >
              {loading
                ? "..."
                : subscription?.plan !== "trial"
                  ? "—"
                  : trialExpired
                    ? "Expired"
                    : `${trialDaysLeft} days`}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-zinc-950 p-6">
            <div className="text-sm text-zinc-400">TikTok</div>
            <div className="mt-3 break-all text-2xl font-black text-yellow-300">
              {loading
                ? "..."
                : profile?.tiktok_username
                  ? `@${profile.tiktok_username}`
                  : "Not set"}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-zinc-950 p-6">
            <div className="text-sm text-zinc-400">Overlay ID</div>
            <div className="mt-3 break-all rounded-xl bg-black p-3 text-xs font-bold text-zinc-300">
              {loading ? "Loading..." : profile?.overlay_id}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-3">
          <Link
            href="/dashboard/widgets"
            className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-pink-500/20 to-zinc-950 p-6 transition hover:border-pink-500"
          >
            <div className="text-4xl">🎁</div>
            <h2 className="mt-4 text-2xl font-black">Widget Manager</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Connect your live platform and manage your widgets.
            </p>
          </Link>

          <Link
            href="/dashboard/overlays"
            className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-purple-500/20 to-zinc-950 p-6 transition hover:border-purple-500"
          >
            <div className="text-4xl">🔗</div>
            <h2 className="mt-4 text-2xl font-black">Overlay URLs</h2>
            <p className="mt-2 text-sm text-zinc-400">
              รวมลิงก์ Overlay สำหรับ OBS ทั้งหมดในที่เดียว
            </p>
          </Link>

          <Link
            href="/dashboard/billing"
            className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-yellow-500/20 to-zinc-950 p-6 transition hover:border-yellow-500"
          >
            <div className="text-4xl">💳</div>
            <h2 className="mt-4 text-2xl font-black">Billing</h2>
            <p className="mt-2 text-sm text-zinc-400">
              ดูแพ็กเกจ Trial / Pro / Premium และเตรียมอัปเกรด
            </p>
          </Link>
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-zinc-950 p-6">
          <h2 className="text-2xl font-black">Current Widget Settings</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-black p-4">
              <div className="text-sm text-zinc-400">Basket</div>
              <div className="mt-1 font-black">{settings?.basket || "basket-1"}</div>
            </div>

            <div className="rounded-2xl bg-black p-4">
              <div className="text-sm text-zinc-400">Vehicle</div>
              <div className="mt-1 font-black">{settings?.vehicle || "tuktuk"}</div>
            </div>

            <div className="rounded-2xl bg-black p-4">
              <div className="text-sm text-zinc-400">Lantern</div>
              <div className="mt-1 font-black">{settings?.lantern || "phoenix"}</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
