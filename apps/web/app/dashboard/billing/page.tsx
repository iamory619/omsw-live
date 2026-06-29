"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  email: string;
  plan: string;
  trial_end: string;
};

export default function BillingPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<Profile | null>(null);

  const trialDaysLeft = useMemo(() => {
    if (!profile?.trial_end) return 0;

    return Math.max(
      Math.ceil((new Date(profile.trial_end).getTime() - Date.now()) / 86400000),
      0,
    );
  }, [profile?.trial_end]);

  const trialExpired = useMemo(() => {
    if (!profile?.trial_end) return false;

    return new Date(profile.trial_end).getTime() < Date.now();
  }, [profile?.trial_end]);

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("id,email,plan,trial_end")
        .eq("id", user.id)
        .single();

      if (!data) {
        router.replace("/login");
        return;
      }

      setProfile(data);
    };

    loadProfile();
  }, [router, supabase]);

  return (
    <main className="min-h-screen bg-black p-6 text-white lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-black">Billing</h1>
          <p className="mt-2 text-zinc-400">
            จัดการแพ็กเกจและสถานะการใช้งาน OMSW Live
          </p>
        </div>

        <section className="mb-8 rounded-[2rem] border border-white/10 bg-zinc-950 p-6">
          <div className="text-sm text-zinc-400">Membership</div>
          <div className="mt-3 text-4xl font-black capitalize text-pink-300">
            {profile?.plan || "trial"}
          </div>

          <div
            className={`mt-3 text-xl font-bold ${
              trialExpired ? "text-red-300" : "text-green-300"
            }`}
          >
            {trialExpired
              ? "Trial expired"
              : `Trial เหลือ ${trialDaysLeft} วัน`}
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-8">
            <h2 className="text-2xl font-black">Trial</h2>
            <div className="mt-4 text-4xl font-black text-green-300">
              ฟรี 9 วัน
            </div>
            <p className="mt-3 text-zinc-400">
              สำหรับผู้ใช้ใหม่เท่านั้น ทดลองได้ 1 ครั้งต่อ Account
            </p>
          </div>

          <div className="rounded-[2rem] border border-pink-500 bg-pink-500/10 p-8 shadow-2xl shadow-pink-500/10">
            <div className="mb-3 w-fit rounded-full bg-pink-600 px-3 py-1 text-xs font-bold">
              Recommended
            </div>

            <h2 className="text-2xl font-black">Pro</h2>
            <div className="mt-4 text-4xl font-black text-pink-300">
              ฿299
              <span className="text-base font-normal text-zinc-400">/เดือน</span>
            </div>

            <ul className="mt-6 space-y-3 text-sm text-zinc-300">
              <li>✅ ใช้งาน Widget ครบ</li>
              <li>✅ Overlay URL ส่วนตัว</li>
              <li>✅ บันทึก Widget Settings</li>
              <li>✅ Dashboard สมาชิก</li>
            </ul>

            <button
              disabled
              className="mt-8 block w-full cursor-not-allowed rounded-xl bg-pink-600 px-5 py-3 text-center font-bold opacity-60"
            >
              Payment Coming Soon
            </button>
          </div>

          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-8">
            <h2 className="text-2xl font-black">Premium</h2>
            <div className="mt-4 text-4xl font-black text-yellow-300">
              เร็ว ๆ นี้
            </div>
            <p className="mt-3 text-zinc-400">
              Premium Widgets, Analytics และ Custom Branding
            </p>
          </div>
        </div>

        <Link
          href="/pricing"
          className="mt-8 inline-block rounded-xl bg-zinc-800 px-5 py-3 font-bold transition hover:bg-zinc-700"
        >
          View public Pricing page
        </Link>
      </div>
    </main>
  );
}
