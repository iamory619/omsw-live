"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Subscription } from "@/lib/core/types";
import {
  getTrialDaysLeft,
  isSubscriptionExpired,
} from "@/lib/core/subscriptions";

type Profile = {
  id: string;
  email: string;
  display_name: string | null;
};

type Payment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  plan: string | null;
  paid_at: string | null;
};

function getPlanLabel(plan?: string | null) {
  if (plan === "pro") return "⭐ Creator";
  if (plan === "premium") return "💎 Pro";
  if (plan === "owner") return "👑 Owner";
  return "🎁 Trial";
}

export default function BillingPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const trialDaysLeft = useMemo(() => {
    return getTrialDaysLeft(subscription);
  }, [subscription]);

  const trialExpired = useMemo(() => {
    return isSubscriptionExpired(subscription);
  }, [subscription]);

  const currentPlan = subscription?.plan || "trial";
  const isTrial = currentPlan === "trial";
  const isCreator = currentPlan === "pro";

  const startCheckout = async (plan: "creator" | "pro") => {
    if (!profile?.id) {
      alert("Unable to start checkout. Please sign in again.");
      return;
    }

    try {
      setCheckoutLoading(true);

      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan,
          userId: profile.id,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        alert("Unable to start checkout. Please try again.");
        return;
      }

      window.location.href = data.url;
    } finally {
      setCheckoutLoading(false);
    }
  };

  useEffect(() => {
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
        .select("id,email,display_name")
        .eq("id", user.id)
        .single();

      const { data: subscriptionData } = await supabase
        .from("subscriptions")
        .select("id,user_id,plan,status,started_at,expires_at,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const { data: paymentsData } = await supabase
        .from("payments")
        .select("id,amount,currency,status,plan,paid_at")
        .eq("user_id", user.id)
        .order("paid_at", { ascending: false })
        .limit(10);

      setProfile(profileData);
      setSubscription(subscriptionData as Subscription | null);
      setPayments(paymentsData || []);
      setLoading(false);
    };

    loadData();
  }, [router, supabase]);

  return (
    <main className="min-h-screen bg-black p-6 text-white lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <div className="text-sm font-black text-pink-400">Membership</div>

          <h1 className="mt-2 text-4xl font-black md:text-5xl">
            Manage Your Creator Membership
          </h1>

          <p className="mt-3 text-zinc-400">
            View your current plan, trial status, and upgrade options.
          </p>
        </div>

        {loading ? (
          <section className="rounded-[2rem] border border-white/10 bg-zinc-950 p-8 text-zinc-400">
            Loading your membership...
          </section>
        ) : (
          <>
            <section className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
              <div className="rounded-[2rem] border border-white/10 bg-zinc-950 p-8">
                <div className="text-sm text-zinc-400">Current Membership</div>

                <div className="mt-3 text-4xl font-black text-pink-300">
                  {getPlanLabel(currentPlan)}
                </div>

                <div className="mt-4 rounded-2xl bg-black p-4">
                  <div className="text-sm text-zinc-400">Account</div>
                  <div className="mt-1 break-all font-bold">
                    {profile?.email || "-"}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-black p-4">
                  <div className="text-sm text-zinc-400">Status</div>
                  <div
                    className={`mt-1 font-black ${
                      subscription?.status === "active"
                        ? "text-green-300"
                        : "text-red-300"
                    }`}
                  >
                    {subscription?.status || "active"}
                  </div>
                </div>

                {isTrial && (
                  <div className="mt-4 rounded-2xl bg-black p-4">
                    <div className="text-sm text-zinc-400">Trial Remaining</div>
                    <div
                      className={`mt-1 text-2xl font-black ${
                        trialExpired ? "text-red-300" : "text-green-300"
                      }`}
                    >
                      {trialExpired ? "Trial Ended" : `${trialDaysLeft} days`}
                    </div>
                  </div>
                )}

                <div className="mt-4 rounded-2xl bg-black p-4">
                  <div className="text-sm text-zinc-400">Expires</div>
                  <div className="mt-1 font-bold text-zinc-200">
                    {subscription?.expires_at
                      ? new Date(subscription.expires_at).toLocaleString()
                      : "—"}
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-pink-500/30 bg-pink-500/10 p-8 shadow-2xl shadow-pink-500/10">
                <div className="w-fit rounded-full bg-pink-600 px-3 py-1 text-xs font-black">
                  Founder Program
                </div>

                <h2 className="mt-5 text-4xl font-black">Become a Founder</h2>

                <p className="mt-3 text-zinc-300">
                  First 100 creators get the Creator plan for ฿99/month.
                </p>

                <div className="mt-6 flex items-end gap-2">
                  <div className="text-6xl font-black">฿99</div>
                  <div className="pb-2 text-zinc-400">/ month</div>
                </div>

                <ul className="mt-8 space-y-3 text-sm text-zinc-200">
                  <li>✅ Lifetime founder price</li>
                  <li>✅ Founder badge</li>
                  <li>✅ All widgets unlocked</li>
                  <li>✅ OBS overlays unlocked</li>
                  <li>✅ Priority updates</li>
                </ul>

                {isCreator ? (
                  <button
                    disabled
                    className="mt-8 w-full cursor-not-allowed rounded-xl bg-green-600 px-5 py-4 font-black opacity-80"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => startCheckout("creator")}
                    disabled={checkoutLoading}
                    className="mt-8 w-full rounded-xl bg-pink-600 px-5 py-4 font-black transition hover:bg-pink-500 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {checkoutLoading
                      ? "Opening checkout..."
                      : "Become a Founder"}
                  </button>
                )}

                <p className="mt-3 text-center text-xs text-pink-100/70">
                  Secure checkout powered by Stripe.
                </p>
              </div>
            </section>

            <section className="mt-8 rounded-[2rem] border border-white/10 bg-zinc-950 p-8">
              <h2 className="text-3xl font-black">Payment History</h2>

              {payments.length === 0 ? (
                <div className="mt-5 rounded-2xl bg-black p-6 text-zinc-500">
                  No invoices yet.
                </div>
              ) : (
                <div className="mt-5 overflow-x-auto rounded-2xl bg-black">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="text-zinc-400">
                      <tr className="border-b border-white/10">
                        <th className="p-4">Date</th>
                        <th className="p-4">Plan</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>

                    <tbody className="text-zinc-200">
                      {payments.map((payment) => (
                        <tr
                          key={payment.id}
                          className="border-b border-white/5"
                        >
                          <td className="p-4">
                            {payment.paid_at
                              ? new Date(payment.paid_at).toLocaleString()
                              : "—"}
                          </td>

                          <td className="p-4">{getPlanLabel(payment.plan)}</td>

                          <td className="p-4 font-bold">
                            ฿{(payment.amount / 100).toLocaleString()}
                          </td>

                          <td className="p-4">
                            <span className="rounded-full bg-green-600/20 px-3 py-1 text-xs font-black text-green-300">
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="mt-8 rounded-[2rem] border border-white/10 bg-zinc-950 p-8">
              <h2 className="text-3xl font-black">Need a different plan?</h2>

              <p className="mt-2 text-zinc-400">
                Compare all memberships and choose the best fit for your live.
              </p>

              <Link
                href="/pricing"
                className="mt-5 inline-block rounded-xl bg-zinc-800 px-5 py-3 font-black transition hover:bg-zinc-700"
              >
                View Pricing
              </Link>
            </section>
          </>
        )}
      </div>
    </main>
  );
}