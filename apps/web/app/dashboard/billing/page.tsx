"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingCard } from "@/components/ui/LoadingCard";
import { PlanBadge } from "@/components/ui/PlanBadge";
import { SectionHeader } from "@/components/ui/SectionHeader";

import { createClient } from "@/lib/supabase/client";

import type {
  AppPlan,
  Subscription,
} from "@/lib/core/types";

import {
  getTrialDaysLeft,
  isSubscriptionExpired,
} from "@/lib/core/subscriptions";

// ==========================================================
// Types
// ==========================================================

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
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

type PaymentMethod = "card" | "promptpay";

// ==========================================================
// Helpers
// ==========================================================

function normalizePlan(
  plan?: string | null,
): AppPlan {
  if (plan === "creator") {
    return "creator";
  }

  if (plan === "pro") {
    return "pro";
  }

  if (plan === "owner") {
    return "owner";
  }

  return "free";
}

function getPlanLabel(
  plan?: string | null,
) {
  if (plan === "creator") {
    return "⭐ Creator";
  }

  if (plan === "pro") {
    return "💎 Pro";
  }

  if (plan === "owner") {
    return "👑 Owner";
  }

  return "🆓 Free";
}

function getPaymentMethodLabel(
  payment: Payment,
) {
  if (payment.stripe_subscription_id) {
    return "💳 Card";
  }

  return "📱 PromptPay";
}

function formatDate(
  value?: string | null,
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}

// ==========================================================
// Page
// ==========================================================

export default function BillingPage() {
  const supabase = useMemo(
    () => createClient(),
    [],
  );

  // --------------------------------------------------------
  // Data
  // --------------------------------------------------------

  const [
    profile,
    setProfile,
  ] = useState<Profile | null>(null);

  const [
    payments,
    setPayments,
  ] = useState<Payment[]>([]);

  const [
    subscription,
    setSubscription,
  ] = useState<Subscription | null>(
    null,
  );

  // --------------------------------------------------------
  // Loading states
  // --------------------------------------------------------

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    checkoutLoading,
    setCheckoutLoading,
  ] =
    useState<PaymentMethod | null>(
      null,
    );

  const [
    portalLoading,
    setPortalLoading,
  ] = useState(false);

  // ========================================================
  // Subscription State
  // ========================================================

  const trialDaysLeft = useMemo(
    () =>
      getTrialDaysLeft(
        subscription,
      ),
    [subscription],
  );

  const trialExpired = useMemo(
    () =>
      isSubscriptionExpired(
        subscription,
      ),
    [subscription],
  );

  const currentPlan =
    normalizePlan(
      subscription?.plan,
    );

  const isFree =
    currentPlan === "free";

  const isCreator =
    currentPlan === "creator";

  const isPro =
    currentPlan === "pro";

  const isOwner =
    currentPlan === "owner";

  // ========================================================
  // Trial Label
  // ========================================================

  const creatorTrialLabel =
    useMemo(() => {
      if (
        currentPlan === "creator"
      ) {
        if (
          subscription?.expires_at
        ) {
          return trialExpired
            ? "Trial Ended"
            : `${trialDaysLeft} days left`;
        }

        return "Active";
      }

      if (
        currentPlan === "pro"
      ) {
        return "Active";
      }

      if (
        currentPlan === "owner"
      ) {
        return "Unlimited";
      }

      return trialExpired
        ? "Ended"
        : `${trialDaysLeft} days left`;
    }, [
      currentPlan,
      subscription,
      trialExpired,
      trialDaysLeft,
    ]);

  const creatorTrialTone =
    creatorTrialLabel ===
      "Trial Ended" ||
    creatorTrialLabel === "Ended"
      ? "text-red-300"
      : "text-green-300";

  // ========================================================
  // Latest Payment
  // ========================================================

  /**
   * ถ้ามี stripe_subscription_id
   * = Card Subscription
   *
   * ถ้าไม่มี
   * = PromptPay
   */

  const latestPayment =
    payments.length > 0
      ? payments[0]
      : null;

  const hasCardSubscription =
    currentPlan !== "free" &&
    Boolean(
      latestPayment
        ?.stripe_subscription_id,
    );

  const hasPromptPayMembership =
    currentPlan !== "free" &&
    Boolean(latestPayment) &&
    !latestPayment
      ?.stripe_subscription_id;

  // ========================================================
  // Payment Options
  // ========================================================

  /**
   * CARD
   *
   * ให้สมัคร Card ได้ตอน
   *
   * Free
   * Creator Trial
   *
   * ถ้าเป็น Pro อยู่แล้ว
   * จะไม่สร้าง Card Subscription ซ้ำ
   */

  const canBuyWithCard =
    isFree || isCreator;

  /**
   * PROMPTPAY
   *
   * Free
   * Creator Trial
   * Pro
   *
   * สามารถสแกนซื้อได้
   *
   * ถ้า Pro อยู่แล้ว
   * ระบบ Webhook จะต่อจาก expires_at เดิม
   * +30 วัน
   */

  const canBuyWithPromptPay =
    !isOwner;

  /**
   * Owner
   * ไม่ต้องซื้อ Membership
   */

  const canPurchaseMembership =
    !isOwner;

  // ========================================================
  // Checkout
  // ========================================================

  const startCheckout = async (
    plan:
      | "creator"
      | "pro",
    paymentMethod: PaymentMethod,
  ) => {
    if (!profile?.id) {
      alert(
        "Unable to start checkout. Please sign in again.",
      );

      return;
    }

    try {
      setCheckoutLoading(
        paymentMethod,
      );

      const res = await fetch(
        "/api/stripe/create-checkout-session",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            plan,
            userId:
              profile.id,
            paymentMethod,
          }),
        },
      );

      const data =
        await res.json();

      if (
        !res.ok ||
        !data.url
      ) {
        console.error(
          "Unable to start checkout:",
          data,
        );

        alert(
          data?.error ||
            "Unable to start checkout. Please try again.",
        );

        return;
      }

      window.location.href =
        data.url;
    } catch (error) {
      console.error(
        "Checkout request error:",
        error,
      );

      alert(
        "Unable to start checkout. Please try again.",
      );
    } finally {
      setCheckoutLoading(
        null,
      );
    }
  };

  // ========================================================
  // Billing Portal
  // ========================================================

  const openBillingPortal =
    async () => {
      if (!profile?.id) {
        alert(
          "Unable to open billing portal. Please sign in again.",
        );

        return;
      }

      try {
        setPortalLoading(
          true,
        );

        const res =
          await fetch(
            "/api/stripe/create-portal-session",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                {
                  userId:
                    profile.id,
                },
              ),
            },
          );

        const data =
          await res.json();

        if (
          !res.ok ||
          !data.url
        ) {
          console.error(
            "Unable to open billing portal:",
            data,
          );

          alert(
            data?.error ||
              "Unable to open billing portal. Please try again.",
          );

          return;
        }

        window.location.href =
          data.url;
      } catch (error) {
        console.error(
          "Billing portal error:",
          error,
        );

        alert(
          "Unable to open billing portal. Please try again.",
        );
      } finally {
        setPortalLoading(
          false,
        );
      }
    };

  // ========================================================
  // Load Data
  // ========================================================

  useEffect(() => {
    const loadData =
      async () => {
        setLoading(true);

        let {
          data: {
            session,
          },
        } =
          await supabase.auth.getSession();

        // --------------------------------------------------
        // Retry session
        // --------------------------------------------------

        if (!session?.user) {
          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                1000,
              ),
          );

          const retry =
            await supabase.auth.getSession();

          session =
            retry.data
              .session;
        }

        if (!session?.user) {
          setLoading(false);
          return;
        }

        const user =
          session.user;

        // --------------------------------------------------
        // Profile
        // --------------------------------------------------

        const {
          data: profileData,
          error:
            profileError,
        } =
          await supabase
            .from("profiles")
            .select(
              "id,email,display_name",
            )
            .eq(
              "id",
              user.id,
            )
            .single();

        if (
          profileError ||
          !profileData
        ) {
          console.error(
            "Unable to load profile:",
            profileError,
          );

          setLoading(false);

          return;
        }

        // --------------------------------------------------
        // Subscription
        // --------------------------------------------------

        const {
          data:
            subscriptionData,
        } =
          await supabase
            .from(
              "subscriptions",
            )
            .select(
              "id,user_id,plan,status,started_at,expires_at,created_at",
            )
            .eq(
              "user_id",
              user.id,
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              },
            )
            .limit(1)
            .maybeSingle();

        // --------------------------------------------------
        // Payments
        // --------------------------------------------------

        const {
          data:
            paymentsData,
        } =
          await supabase
            .from(
              "payments",
            )
            .select(
              "id,amount,currency,status,plan,paid_at,stripe_customer_id,stripe_subscription_id",
            )
            .eq(
              "user_id",
              user.id,
            )
            .order(
              "paid_at",
              {
                ascending:
                  false,
                nullsFirst:
                  false,
              },
            )
            .limit(10);

        // --------------------------------------------------
        // Set State
        // --------------------------------------------------

        setProfile(
          profileData,
        );

        setSubscription(
          subscriptionData ??
            null,
        );

        setPayments(
          (paymentsData as Payment[]) ||
            [],
        );

        setLoading(false);
      };

    loadData();
  }, [supabase]);

  // ========================================================
  // Dynamic Membership Text
  // ========================================================

  const membershipTitle =
    isPro
      ? "Renew Creator Membership"
      : "Upgrade to Creator";

  const membershipDescription =
    isPro
      ? "Extend your Creator access with PromptPay."
      : "Unlock premium widgets, overlays, and live effects for ฿99/month.";

  // ========================================================
  // Render
  // ========================================================

  return (
    <main className="min-h-screen bg-black p-6 text-white lg:p-8">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          badge="Billing"
          title="Manage Your Billing"
          description="View your current plan, billing history, and billing options."
        />

        {loading ? (
          <LoadingCard />
        ) : (
          <>
            {/* ================================================= */}
            {/* TOP GRID */}
            {/* ================================================= */}

            <section className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
              {/* =============================================== */}
              {/* CURRENT PLAN */}
              {/* =============================================== */}

              <Card className="p-8">
                <div className="text-sm text-zinc-400">
                  Current Plan
                </div>

                <div className="mt-3">
                  <PlanBadge
                    plan={
                      currentPlan
                    }
                  />
                </div>

                {/* Account */}

                <div className="mt-4 rounded-2xl bg-black p-4">
                  <div className="text-sm text-zinc-400">
                    Account
                  </div>

                  <div className="mt-1 break-all font-bold">
                    {profile?.email ||
                      "-"}
                  </div>
                </div>

                {/* Status */}

                <div className="mt-4 rounded-2xl bg-black p-4">
                  <div className="text-sm text-zinc-400">
                    Status
                  </div>

                  <div
                    className={`mt-1 font-black ${
                      subscription?.status ===
                      "active"
                        ? "text-green-300"
                        : "text-red-300"
                    }`}
                  >
                    {subscription?.status ||
                      "active"}
                  </div>
                </div>

                {/* Trial */}

                <div className="mt-4 rounded-2xl bg-black p-4">
                  <div className="text-sm text-zinc-400">
                    Creator Trial
                  </div>

                  <div
                    className={`mt-1 text-2xl font-black ${creatorTrialTone}`}
                  >
                    {
                      creatorTrialLabel
                    }
                  </div>
                </div>

                {/* Expiry */}

                <div className="mt-4 rounded-2xl bg-black p-4">
                  <div className="text-sm text-zinc-400">
                    Renews / Expires
                  </div>

                  <div className="mt-1 font-bold text-zinc-200">
                    {formatDate(
                      subscription?.expires_at,
                    )}
                  </div>
                </div>

                {/* ============================================= */}
                {/* CARD SUBSCRIPTION */}
                {/* ============================================= */}

                {hasCardSubscription && (
                  <>
                    <Button
                      variant="secondary"
                      onClick={
                        openBillingPortal
                      }
                      disabled={
                        portalLoading
                      }
                      className="mt-5 w-full border border-white/10 hover:border-pink-500"
                    >
                      {portalLoading
                        ? "Opening billing..."
                        : "💳 Manage Your Billing"}
                    </Button>

                    <div className="mt-3 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
                      <div className="font-black text-blue-300">
                        💳 Card
                        Subscription
                      </div>

                      <p className="mt-1 text-sm text-zinc-300">
                        Your card
                        subscription
                        renews
                        automatically.
                      </p>
                    </div>
                  </>
                )}

                {/* ============================================= */}
                {/* PROMPTPAY MEMBERSHIP */}
                {/* ============================================= */}

                {hasPromptPayMembership && (
                  <div className="mt-5 rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
                    <div className="font-black text-green-300">
                      📱 PromptPay
                      Membership
                    </div>

                    <p className="mt-1 text-sm text-zinc-300">
                      Your
                      membership
                      remains active
                      until the
                      expiration date
                      above.
                      Scan PromptPay
                      again to add
                      another 30 days.
                    </p>
                  </div>
                )}
              </Card>

              {/* =============================================== */}
              {/* CREATOR MEMBERSHIP */}
              {/* =============================================== */}

              <Card className="border-pink-500/30 bg-pink-500/10 p-8 shadow-2xl shadow-pink-500/10">
                <div className="w-fit rounded-full bg-pink-600 px-3 py-1 text-xs font-black">
                  Creator Membership
                </div>

                <h2 className="mt-5 text-4xl font-black">
                  {membershipTitle}
                </h2>

                <p className="mt-3 text-zinc-300">
                  {
                    membershipDescription
                  }
                </p>

                {/* Price */}

                <div className="mt-6 flex items-end gap-2">
                  <div className="text-6xl font-black">
                    ฿99
                  </div>

                  <div className="pb-2 text-zinc-400">
                    {isPro
                      ? "/ 30 days"
                      : "/ month"}
                  </div>
                </div>

                {/* Features */}

                <ul className="mt-8 space-y-3 text-sm text-zinc-200">
                  <li>
                    ✅ Everything in
                    Free
                  </li>

                  <li>
                    ✅ Magic Lantern
                  </li>

                  <li>
                    ✅ Gift Vehicle
                  </li>

                  <li>
                    ✅ Gift Basket
                  </li>

                  <li>
                    ✅ Fortune Reading
                  </li>

                  <li>
                    ✅ Future premium
                    widgets
                  </li>
                </ul>

                {/* ============================================= */}
                {/* PAYMENT OPTIONS */}
                {/* ============================================= */}

                {canPurchaseMembership ? (
                  <div className="mt-8 space-y-3">
                    {/* ----------------------------------------- */}
                    {/* CARD */}
                    {/* ----------------------------------------- */}

                    {canBuyWithCard && (
                      <Button
                        variant="upgrade"
                        onClick={() =>
                          startCheckout(
                            "creator",
                            "card",
                          )
                        }
                        disabled={
                          checkoutLoading !==
                          null
                        }
                        className="w-full"
                      >
                        {checkoutLoading ===
                        "card"
                          ? "Opening card checkout..."
                          : "💳 Pay with Credit / Debit Card"}
                      </Button>
                    )}

                    {/* ----------------------------------------- */}
                    {/* PROMPTPAY */}
                    {/* ----------------------------------------- */}

                    {canBuyWithPromptPay && (
                      <Button
                        variant="secondary"
                        onClick={() =>
                          startCheckout(
                            "creator",
                            "promptpay",
                          )
                        }
                        disabled={
                          checkoutLoading !==
                          null
                        }
                        className="w-full border border-green-500/30 hover:border-green-400"
                      >
                        {checkoutLoading ===
                        "promptpay"
                          ? "Opening PromptPay..."
                          : isPro
                            ? "📱 Add 30 Days with PromptPay"
                            : "📱 Pay with PromptPay"}
                      </Button>
                    )}

                    {/* ----------------------------------------- */}
                    {/* PRO INFO */}
                    {/* ----------------------------------------- */}

                    {isPro &&
                      hasCardSubscription && (
                        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                          <div className="text-sm font-black text-yellow-200">
                            💡 Existing Card
                            Subscription
                          </div>

                          <p className="mt-2 text-xs leading-5 text-zinc-300">
                            Your card
                            subscription is
                            still active.
                            PromptPay adds
                            another 30 days
                            to your current
                            membership.
                            Manage automatic
                            card renewal with
                            the Billing
                            Portal.
                          </p>
                        </div>
                      )}

                    {/* ----------------------------------------- */}
                    {/* PAYMENT INFORMATION */}
                    {/* ----------------------------------------- */}

                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="text-sm font-bold text-zinc-200">
                        Payment options
                      </div>

                      <div className="mt-2 space-y-2 text-xs leading-5 text-zinc-400">
                        {canBuyWithCard && (
                          <p>
                            💳 Card —
                            automatically
                            renews every
                            month.
                          </p>
                        )}

                        <p>
                          📱 PromptPay —
                          pay once and
                          receive 30 days
                          of access.
                        </p>

                        {isPro && (
                          <p className="text-green-300">
                            Current Creator
                            members can use
                            PromptPay to add
                            another 30 days.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    disabled
                    variant="secondary"
                    className="mt-8 w-full bg-green-600 opacity-80"
                  >
                    👑 Owner Plan
                  </Button>
                )}

                <p className="mt-3 text-center text-xs text-pink-100/70">
                  Secure checkout
                  powered by Stripe.
                </p>
              </Card>
            </section>

            {/* ================================================= */}
            {/* BILLING HISTORY */}
            {/* ================================================= */}

            <Card className="mt-8 p-8">
              <h2 className="text-3xl font-black">
                Billing History
              </h2>

              {payments.length ===
              0 ? (
                <div className="mt-5">
                  <EmptyState
                    icon="💳"
                    title="No billing history yet"
                    description="Your billing history will appear here after your first successful payment."
                  />
                </div>
              ) : (
                <div className="mt-5 overflow-x-auto rounded-2xl bg-black">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="text-zinc-400">
                      <tr className="border-b border-white/10">
                        <th className="p-4">
                          Date
                        </th>

                        <th className="p-4">
                          Plan
                        </th>

                        <th className="p-4">
                          Method
                        </th>

                        <th className="p-4">
                          Amount
                        </th>

                        <th className="p-4">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody className="text-zinc-200">
                      {payments.map(
                        (
                          payment,
                        ) => (
                          <tr
                            key={
                              payment.id
                            }
                            className="border-b border-white/5"
                          >
                            {/* Date */}

                            <td className="p-4">
                              {formatDate(
                                payment.paid_at,
                              )}
                            </td>

                            {/* Plan */}

                            <td className="p-4">
                              {getPlanLabel(
                                payment.plan,
                              )}
                            </td>

                            {/* Method */}

                            <td className="p-4">
                              {getPaymentMethodLabel(
                                payment,
                              )}
                            </td>

                            {/* Amount */}

                            <td className="p-4 font-bold">
                              ฿
                              {(
                                payment.amount /
                                100
                              ).toLocaleString()}
                            </td>

                            {/* Status */}

                            <td className="p-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-black ${
                                  payment.status ===
                                  "paid"
                                    ? "bg-green-600/20 text-green-300"
                                    : payment.status ===
                                        "failed"
                                      ? "bg-red-600/20 text-red-300"
                                      : "bg-yellow-600/20 text-yellow-300"
                                }`}
                              >
                                {
                                  payment.status
                                }
                              </span>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* ================================================= */}
            {/* COMPARE PLANS */}
            {/* ================================================= */}

            <Card className="mt-8 p-8">
              <h2 className="text-3xl font-black">
                Compare plans
              </h2>

              <p className="mt-2 text-zinc-400">
                Compare all plans and
                choose the best fit for
                your live.
              </p>

              <Button
                href="/pricing"
                variant="secondary"
                className="mt-5"
              >
                View Pricing
              </Button>
            </Card>
          </>
        )}
      </div>
    </main>
  );
}