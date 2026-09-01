import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

// ==========================================================
// Helpers
// ==========================================================

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString();
}

function unixToISOString(timestamp?: number | null) {
  if (!timestamp || !Number.isFinite(timestamp)) {
    return null;
  }

  return new Date(timestamp * 1000).toISOString();
}

/**
 * Stripe API รุ่นใหม่บางรุ่นเก็บ subscription ของ Invoice
 * ไว้ใน invoice.parent.subscription_details.subscription
 *
 * Stripe API รุ่นเก่าอาจอยู่ที่ invoice.subscription
 *
 * ฟังก์ชันนี้รองรับทั้งสองแบบ
 */
function getInvoiceSubscriptionId(
  invoice: Stripe.Invoice,
): string | null {
  const invoiceWithSubscription = invoice as Stripe.Invoice & {
    subscription?:
      | string
      | Stripe.Subscription
      | null;

    parent?: {
      subscription_details?: {
        subscription?:
          | string
          | Stripe.Subscription
          | null;
      } | null;
    } | null;
  };

  const subscription =
    invoiceWithSubscription.parent?.subscription_details
      ?.subscription ??
    invoiceWithSubscription.subscription;

  if (typeof subscription === "string") {
    return subscription;
  }

  if (
    subscription &&
    typeof subscription === "object" &&
    "id" in subscription
  ) {
    return subscription.id;
  }

  return null;
}

/**
 * Stripe API บางรุ่นมี current_period_end
 * อยู่ที่ Subscription
 *
 * บางรุ่นอยู่ใน Subscription Item
 *
 * รองรับทั้งสองแบบ
 */
function getSubscriptionPeriodEnd(
  subscription: Stripe.Subscription,
): string | null {
  const legacySubscription =
    subscription as Stripe.Subscription & {
      current_period_end?: number;
    };

  if (
    typeof legacySubscription.current_period_end ===
      "number" &&
    legacySubscription.current_period_end > 0
  ) {
    return unixToISOString(
      legacySubscription.current_period_end,
    );
  }

  const itemPeriodEnds = subscription.items.data
    .map((item) => {
      const itemWithPeriod =
        item as Stripe.SubscriptionItem & {
          current_period_end?: number;
        };

      return itemWithPeriod.current_period_end;
    })
    .filter(
      (value): value is number =>
        typeof value === "number" && value > 0,
    );

  if (itemPeriodEnds.length === 0) {
    return null;
  }

  const latestPeriodEnd = Math.max(...itemPeriodEnds);

  return unixToISOString(latestPeriodEnd);
}

function getSubscriptionStart(
  subscription: Stripe.Subscription,
): string {
  const startDate = unixToISOString(
    subscription.start_date,
  );

  return startDate || new Date().toISOString();
}

function getCustomerId(
  customer:
    | string
    | Stripe.Customer
    | Stripe.DeletedCustomer
    | null
    | undefined,
): string | null {
  if (typeof customer === "string") {
    return customer;
  }

  if (
    customer &&
    typeof customer === "object" &&
    "id" in customer
  ) {
    return customer.id;
  }

  return null;
}

/**
 * ทำ status ของ Stripe ให้ใช้กับระบบเรา
 */
function getDatabaseSubscriptionStatus(
  status: Stripe.Subscription.Status,
) {
  switch (status) {
    case "active":
    case "trialing":
      return "active";

    case "canceled":
    case "incomplete_expired":
      return "canceled";

    case "past_due":
      return "past_due";

    case "unpaid":
      return "unpaid";

    case "incomplete":
      return "incomplete";

    case "paused":
      return "paused";

    default:
      return status;
  }
}

// ==========================================================
// Payment helpers
// ==========================================================

/**
 * ป้องกัน Stripe ส่ง event เดิมซ้ำ
 */
async function paymentEventExists(
  eventId: string,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("payments")
    .select("stripe_event_id")
    .eq("stripe_event_id", eventId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "Unable to check payment event:",
      error,
    );

    return false;
  }

  return Boolean(data);
}

/**
 * ใช้ป้องกัน Card payment แรกถูกบันทึกซ้ำ
 * ระหว่าง
 *
 * checkout.session.completed
 * และ
 * invoice.paid
 */
async function cardSubscriptionPaymentExists(
  subscriptionId: string,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("payments")
    .select("stripe_subscription_id")
    .eq("stripe_subscription_id", subscriptionId)
    .eq("status", "paid")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "Unable to check subscription payment:",
      error,
    );

    return false;
  }

  return Boolean(data);
}

/**
 * หา userId / plan จาก payment
 *
 * ใช้เป็น fallback กรณี metadata ใน Stripe หาย
 */
async function findSubscriptionOwner(
  subscriptionId: string,
) {
  const { data, error } = await supabaseAdmin
    .from("payments")
    .select("user_id, plan")
    .eq(
      "stripe_subscription_id",
      subscriptionId,
    )
    .order("paid_at", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "Unable to find subscription owner:",
      error,
    );

    return {
      userId: null,
      plan: null,
    };
  }

  return {
    userId: data?.user_id || null,
    plan: data?.plan || null,
  };
}

// ==========================================================
// Sync Card Subscription
// ==========================================================

async function syncCardSubscription(
  subscription: Stripe.Subscription,
  fallbackUserId?: string | null,
  fallbackPlan?: string | null,
) {
  let userId =
    subscription.metadata?.userId ||
    fallbackUserId ||
    null;

  let plan =
    subscription.metadata?.plan ||
    fallbackPlan ||
    null;

  if (!userId || !plan) {
    const owner = await findSubscriptionOwner(
      subscription.id,
    );

    userId = userId || owner.userId;
    plan = plan || owner.plan;
  }

  if (!userId) {
    console.warn(
      "Subscription has no OMSW userId:",
      subscription.id,
    );

    return null;
  }

  if (!plan) {
    console.warn(
      "Subscription has no OMSW plan:",
      subscription.id,
    );

    return null;
  }

  const expiresAt =
    getSubscriptionPeriodEnd(subscription);

  const status =
    getDatabaseSubscriptionStatus(
      subscription.status,
    );

  const subscriptionData: {
    user_id: string;
    plan: string;
    status: string;
    started_at: string;
    expires_at?: string;
  } = {
    user_id: userId,
    plan,
    status,
    started_at:
      getSubscriptionStart(subscription),
  };

  if (expiresAt) {
    subscriptionData.expires_at = expiresAt;
  }

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .upsert(subscriptionData, {
      onConflict: "user_id",
    });

  if (error) {
    console.error(
      "Unable to sync Stripe subscription:",
      error,
    );

    throw error;
  }

  console.log("Subscription synced:", {
    subscriptionId: subscription.id,
    userId,
    plan,
    status,
    expiresAt,
  });

  return {
    userId,
    plan,
    status,
    expiresAt,
  };
}

// ==========================================================
// PromptPay
// ==========================================================

async function activatePromptPay(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
) {
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan;

  if (!userId || !plan) {
    console.warn(
      "PromptPay session missing metadata:",
      session.id,
    );

    return;
  }

  // --------------------------------------------------------
  // ต้องจ่ายสำเร็จก่อนเท่านั้น
  // --------------------------------------------------------

  if (session.payment_status !== "paid") {
    console.log(
      "PromptPay is not paid yet:",
      session.id,
      session.payment_status,
    );

    return;
  }

  // --------------------------------------------------------
  // กัน Stripe webhook event เดิมทำงานซ้ำ
  // --------------------------------------------------------

  const duplicate = await paymentEventExists(
    event.id,
  );

  if (duplicate) {
    console.log(
      "PromptPay event already processed:",
      event.id,
    );

    return;
  }

  // --------------------------------------------------------
  // อ่านสมาชิกเดิม
  // --------------------------------------------------------

  const {
    data: existingSubscription,
    error: existingSubscriptionError,
  } = await supabaseAdmin
    .from("subscriptions")
    .select("expires_at, started_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingSubscriptionError) {
    console.error(
      "Unable to read existing subscription:",
      existingSubscriptionError,
    );
  }

  const now = new Date();

  let startDate = now;

  // --------------------------------------------------------
  // ถ้ายังเหลือวันเดิม
  // ให้ต่อ 30 วันจากวันหมดอายุเดิม
  //
  // ตัวอย่าง:
  // เหลือ 10 วัน + ซื้อเพิ่ม 30 วัน
  // = เหลือ 40 วัน
  // --------------------------------------------------------

  if (existingSubscription?.expires_at) {
    const currentExpiry = new Date(
      existingSubscription.expires_at,
    );

    if (
      !Number.isNaN(currentExpiry.getTime()) &&
      currentExpiry > now
    ) {
      startDate = currentExpiry;
    }
  }

  const accessDaysRaw = Number(
    session.metadata?.accessDays || 30,
  );

  const accessDays =
    Number.isFinite(accessDaysRaw) &&
    accessDaysRaw > 0
      ? accessDaysRaw
      : 30;

  const expiresAt = addDays(
    startDate,
    accessDays,
  );

  // --------------------------------------------------------
  // บันทึก payment ก่อน
  //
  // ใช้ stripe_event_id เป็นตัวกัน event ซ้ำ
  // --------------------------------------------------------

  const { error: paymentError } =
    await supabaseAdmin
      .from("payments")
      .insert({
        user_id: userId,

        stripe_event_id: event.id,

        stripe_customer_id: getCustomerId(
          session.customer,
        ),

        stripe_subscription_id: null,

        amount: session.amount_total || 0,

        currency:
          session.currency?.toLowerCase() ||
          "thb",

        status: "paid",

        plan,

        paid_at: now.toISOString(),
      });

  if (paymentError) {
    /**
     * อาจเกิดจาก event เดิมถูกบันทึกไปแล้ว
     * จึงตรวจอีกครั้ง
     */
    const existsAfterInsert =
      await paymentEventExists(event.id);

    if (existsAfterInsert) {
      console.log(
        "PromptPay event already stored:",
        event.id,
      );

      return;
    }

    console.error(
      "PromptPay payment insert error:",
      paymentError,
    );

    throw paymentError;
  }

  // --------------------------------------------------------
  // เปิดสมาชิก
  // --------------------------------------------------------

  const { error: subscriptionError } =
    await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,

          plan,

          status: "active",

          started_at:
            existingSubscription?.started_at ||
            now.toISOString(),

          expires_at: expiresAt,
        },
        {
          onConflict: "user_id",
        },
      );

  if (subscriptionError) {
    console.error(
      "PromptPay subscription update error:",
      subscriptionError,
    );

    /**
     * ลบ payment lock ออก
     * เพื่อให้ Stripe retry event ได้
     */
    const { error: rollbackError } =
      await supabaseAdmin
        .from("payments")
        .delete()
        .eq("stripe_event_id", event.id);

    if (rollbackError) {
      console.error(
        "PromptPay rollback payment error:",
        rollbackError,
      );
    }

    throw subscriptionError;
  }

  console.log(
    "PromptPay membership activated:",
    {
      eventId: event.id,
      sessionId: session.id,
      userId,
      plan,
      accessDays,
      expiresAt,
    },
  );
}

// ==========================================================
// Card Checkout
// ==========================================================

async function activateCardCheckout(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
) {
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan;

  if (!userId || !plan) {
    console.warn(
      "Card checkout missing metadata:",
      session.id,
    );

    return;
  }

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id || null;

  let subscription:
    | Stripe.Subscription
    | null = null;

  // --------------------------------------------------------
  // ดึง Subscription จริงจาก Stripe
  // เพื่อใช้วันหมดอายุจริง
  // --------------------------------------------------------

  if (subscriptionId && stripe) {
    try {
      subscription =
        await stripe.subscriptions.retrieve(
          subscriptionId,
        );
    } catch (error) {
      console.error(
        "Unable to retrieve subscription:",
        error,
      );
    }
  }

  // --------------------------------------------------------
  // Sync สมาชิก
  // --------------------------------------------------------

  if (subscription) {
    await syncCardSubscription(
      subscription,
      userId,
      plan,
    );
  } else {
    /**
     * fallback เผื่อ Stripe retrieve ไม่ได้
     * ให้ 30 วันก่อน
     *
     * invoice.paid / subscription.updated
     * จะ sync วันจริงภายหลัง
     */
    const now = new Date();

    const { error } = await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          plan,
          status: "active",
          started_at: now.toISOString(),
          expires_at: addDays(now, 30),
        },
        {
          onConflict: "user_id",
        },
      );

    if (error) {
      console.error(
        "Card fallback subscription error:",
        error,
      );

      throw error;
    }
  }

  // --------------------------------------------------------
  // ถ้ายังไม่ได้จ่ายจริง
  // ไม่ต้องบันทึก payment
  // --------------------------------------------------------

  if (
    session.payment_status !== "paid" &&
    session.payment_status !==
      "no_payment_required"
  ) {
    console.log(
      "Card Checkout not paid:",
      session.id,
      session.payment_status,
    );

    return;
  }

  // --------------------------------------------------------
  // กัน event เดิมซ้ำ
  // --------------------------------------------------------

  const duplicate = await paymentEventExists(
    event.id,
  );

  if (duplicate) {
    console.log(
      "Card checkout event already processed:",
      event.id,
    );

    return;
  }

  /**
   * invoice.paid อาจมาก่อน checkout.session.completed
   *
   * ถ้ามี payment ของ subscription นี้อยู่แล้ว
   * ไม่ต้องสร้าง payment ซ้ำ
   */
  if (subscriptionId) {
    const alreadyRecorded =
      await cardSubscriptionPaymentExists(
        subscriptionId,
      );

    if (alreadyRecorded) {
      console.log(
        "Initial Card payment already recorded:",
        subscriptionId,
      );

      return;
    }
  }

  const customerId =
    getCustomerId(session.customer) ||
    getCustomerId(subscription?.customer);

  const { error: paymentError } =
    await supabaseAdmin
      .from("payments")
      .insert({
        user_id: userId,

        stripe_event_id: event.id,

        stripe_customer_id: customerId,

        stripe_subscription_id:
          subscriptionId,

        amount: session.amount_total || 0,

        currency:
          session.currency?.toLowerCase() ||
          "thb",

        status: "paid",

        plan,

        paid_at: new Date().toISOString(),
      });

  if (paymentError) {
    console.error(
      "Card Checkout payment insert error:",
      paymentError,
    );
  }

  console.log(
    "Card subscription checkout completed:",
    {
      sessionId: session.id,
      subscriptionId,
      userId,
      plan,
    },
  );
}

// ==========================================================
// Invoice Paid
// ==========================================================

async function processInvoicePaid(
  event: Stripe.Event,
  invoice: Stripe.Invoice,
) {
  if (!stripe) {
    return;
  }

  const subscriptionId =
    getInvoiceSubscriptionId(invoice);

  if (!subscriptionId) {
    /**
     * Invoice ที่ไม่ใช่ Subscription
     * ไม่เกี่ยวกับสมาชิก OMSW
     */
    console.log(
      "Invoice has no subscription:",
      invoice.id,
    );

    return;
  }

  let subscription: Stripe.Subscription;

  try {
    subscription =
      await stripe.subscriptions.retrieve(
        subscriptionId,
      );
  } catch (error) {
    console.error(
      "Unable to retrieve subscription for invoice:",
      subscriptionId,
      error,
    );

    throw error;
  }

  // --------------------------------------------------------
  // Sync วันหมดอายุจริงจาก Stripe
  // --------------------------------------------------------

  const synced =
    await syncCardSubscription(subscription);

  if (!synced) {
    console.warn(
      "Unable to resolve OMSW user for invoice:",
      invoice.id,
    );

    return;
  }

  const {
    userId,
    plan,
  } = synced;

  // --------------------------------------------------------
  // กัน event ซ้ำ
  // --------------------------------------------------------

  const duplicate = await paymentEventExists(
    event.id,
  );

  if (duplicate) {
    console.log(
      "Invoice paid event already processed:",
      event.id,
    );

    return;
  }

  const invoiceWithBillingReason =
    invoice as Stripe.Invoice & {
      billing_reason?: string | null;
    };

  const billingReason =
    invoiceWithBillingReason.billing_reason;

  /**
   * Invoice แรกอาจถูกบันทึกจาก
   * checkout.session.completed ไปแล้ว
   */
  if (billingReason === "subscription_create") {
    const alreadyRecorded =
      await cardSubscriptionPaymentExists(
        subscriptionId,
      );

    if (alreadyRecorded) {
      console.log(
        "Initial invoice payment already recorded:",
        subscriptionId,
      );

      return;
    }
  }

  const customerId =
    getCustomerId(invoice.customer) ||
    getCustomerId(subscription.customer);

  const paidAtUnix =
    invoice.status_transitions?.paid_at;

  const paidAt =
    unixToISOString(paidAtUnix) ||
    new Date().toISOString();

  const { error: paymentError } =
    await supabaseAdmin
      .from("payments")
      .insert({
        user_id: userId,

        stripe_event_id: event.id,

        stripe_customer_id: customerId,

        stripe_subscription_id:
          subscriptionId,

        amount: invoice.amount_paid || 0,

        currency:
          invoice.currency?.toLowerCase() ||
          "thb",

        status: "paid",

        plan,

        paid_at: paidAt,
      });

  if (paymentError) {
    console.error(
      "Invoice paid payment insert error:",
      paymentError,
    );
  }

  console.log("Invoice paid processed:", {
    invoiceId: invoice.id,
    subscriptionId,
    userId,
    plan,
    billingReason,
  });
}

// ==========================================================
// Invoice Payment Failed
// ==========================================================

async function processInvoicePaymentFailed(
  event: Stripe.Event,
  invoice: Stripe.Invoice,
) {
  if (!stripe) {
    return;
  }

  const subscriptionId =
    getInvoiceSubscriptionId(invoice);

  if (!subscriptionId) {
    console.warn(
      "Failed invoice has no subscription:",
      invoice.id,
    );

    return;
  }

  let subscription:
    | Stripe.Subscription
    | null = null;

  try {
    subscription =
      await stripe.subscriptions.retrieve(
        subscriptionId,
      );
  } catch (error) {
    console.error(
      "Unable to retrieve failed subscription:",
      error,
    );
  }

  let userId =
    subscription?.metadata?.userId || null;

  let plan =
    subscription?.metadata?.plan || null;

  if (!userId || !plan) {
    const owner =
      await findSubscriptionOwner(
        subscriptionId,
      );

    userId = userId || owner.userId;
    plan = plan || owner.plan;
  }

  if (!userId) {
    console.warn(
      "Unable to resolve user for failed invoice:",
      invoice.id,
    );

    return;
  }

  // --------------------------------------------------------
  // เปลี่ยนสถานะสมาชิก
  // --------------------------------------------------------

  const { error: subscriptionError } =
    await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "past_due",
      })
      .eq("user_id", userId);

  if (subscriptionError) {
    console.error(
      "Unable to mark subscription past_due:",
      subscriptionError,
    );
  }

  // --------------------------------------------------------
  // กัน failed payment event ซ้ำ
  // --------------------------------------------------------

  const duplicate = await paymentEventExists(
    event.id,
  );

  if (!duplicate) {
    const customerId =
      getCustomerId(invoice.customer) ||
      getCustomerId(subscription?.customer);

    const { error: paymentError } =
      await supabaseAdmin
        .from("payments")
        .insert({
          user_id: userId,

          stripe_event_id: event.id,

          stripe_customer_id: customerId,

          stripe_subscription_id:
            subscriptionId,

          amount: invoice.amount_due || 0,

          currency:
            invoice.currency
              ?.toLowerCase() || "thb",

          status: "failed",

          plan: plan || "unknown",

          paid_at: null,
        });

    if (paymentError) {
      /**
       * ถ้า paid_at ในฐานข้อมูลตั้ง NOT NULL
       * payment failed record อาจ insert ไม่ได้
       *
       * แต่ไม่ทำให้ webhook fail
       */
      console.error(
        "Failed payment insert error:",
        paymentError,
      );
    }
  }

  console.warn(
    "Invoice payment failed processed:",
    {
      invoiceId: invoice.id,
      subscriptionId,
      userId,
      plan,
    },
  );
}

// ==========================================================
// Main Webhook
// ==========================================================

export async function POST(req: NextRequest) {
  // --------------------------------------------------------
  // Stripe Configuration
  // --------------------------------------------------------

  if (!stripe) {
    return NextResponse.json(
      {
        error: "Stripe is not configured",
      },
      {
        status: 500,
      },
    );
  }

  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      {
        error:
          "Stripe webhook secret is not configured",
      },
      {
        status: 500,
      },
    );
  }

  // --------------------------------------------------------
  // Verify Stripe Signature
  // --------------------------------------------------------

  const body = await req.text();

  const signature =
    req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      {
        error: "Missing Stripe signature",
      },
      {
        status: 400,
      },
    );
  }

  let event: Stripe.Event;

  try {
    event =
      stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret,
      );
  } catch (error) {
    console.error(
      "Stripe signature error:",
      error,
    );

    return NextResponse.json(
      {
        error: "Invalid webhook signature",
      },
      {
        status: 400,
      },
    );
  }

  console.log("Stripe webhook received:", {
    eventId: event.id,
    eventType: event.type,
  });

  // --------------------------------------------------------
  // Process Events
  // --------------------------------------------------------

  try {
    switch (event.type) {
      // ====================================================
      // Checkout Completed
      // ====================================================

      case "checkout.session.completed": {
        const session =
          event.data
            .object as Stripe.Checkout.Session;

        const userId =
          session.metadata?.userId;

        const plan =
          session.metadata?.plan;

        const paymentType =
          session.metadata?.paymentType ||
          "card";

        // ----------------------------------------------
        // ไม่ใช่ Checkout ของ OMSW
        // ----------------------------------------------

        if (!userId || !plan) {
          console.warn(
            "Checkout missing OMSW metadata:",
            session.id,
          );

          break;
        }

        console.log(
          "Checkout session completed:",
          {
            sessionId: session.id,
            userId,
            plan,
            paymentType,
            paymentStatus:
              session.payment_status,
          },
        );

        // ----------------------------------------------
        // PromptPay
        // ----------------------------------------------

        if (
          paymentType === "promptpay"
        ) {
          /**
           * ถ้า checkout completed
           * แต่ payment_status ยัง unpaid
           *
           * จะยังไม่เปิดสมาชิก
           *
           * รอ
           * checkout.session.async_payment_succeeded
           */
          await activatePromptPay(
            event,
            session,
          );

          break;
        }

        // ----------------------------------------------
        // Card
        // ----------------------------------------------

        if (paymentType === "card") {
          await activateCardCheckout(
            event,
            session,
          );

          break;
        }

        console.warn(
          "Unknown checkout payment type:",
          paymentType,
        );

        break;
      }

      // ====================================================
      // PromptPay Async Success
      // ====================================================

      case "checkout.session.async_payment_succeeded": {
        const session =
          event.data
            .object as Stripe.Checkout.Session;

        const paymentType =
          session.metadata?.paymentType;

        if (
          paymentType !== "promptpay"
        ) {
          console.log(
            "Ignoring non-PromptPay async success:",
            session.id,
          );

          break;
        }

        console.log(
          "PromptPay async payment succeeded:",
          session.id,
        );

        await activatePromptPay(
          event,
          session,
        );

        break;
      }

      // ====================================================
      // PromptPay Async Failed
      // ====================================================

      case "checkout.session.async_payment_failed": {
        const session =
          event.data
            .object as Stripe.Checkout.Session;

        console.warn(
          "PromptPay async payment failed:",
          {
            sessionId: session.id,
            userId:
              session.metadata?.userId,
            plan:
              session.metadata?.plan,
          },
        );

        /**
         * ไม่เปิดสมาชิก
         * ไม่ต้องแก้ subscriptions
         */

        break;
      }

      // ====================================================
      // Invoice Paid
      // Card ต่ออายุสำเร็จ
      // ====================================================

      case "invoice.paid": {
        const invoice =
          event.data.object as Stripe.Invoice;

        await processInvoicePaid(
          event,
          invoice,
        );

        break;
      }

      // ====================================================
      // Invoice Payment Failed
      // ====================================================

      case "invoice.payment_failed": {
        const invoice =
          event.data.object as Stripe.Invoice;

        await processInvoicePaymentFailed(
          event,
          invoice,
        );

        break;
      }

      // ====================================================
      // Subscription Updated
      // ====================================================

      case "customer.subscription.updated": {
        const subscription =
          event.data
            .object as Stripe.Subscription;

        console.log(
          "Stripe subscription updated:",
          {
            subscriptionId:
              subscription.id,
            status:
              subscription.status,
            cancelAtPeriodEnd:
              subscription.cancel_at_period_end,
          },
        );

        await syncCardSubscription(
          subscription,
        );

        break;
      }

      // ====================================================
      // Subscription Deleted
      // ====================================================

      case "customer.subscription.deleted": {
        const subscription =
          event.data
            .object as Stripe.Subscription;

        let userId =
          subscription.metadata?.userId ||
          null;

        if (!userId) {
          const owner =
            await findSubscriptionOwner(
              subscription.id,
            );

          userId = owner.userId;
        }

        if (!userId) {
          console.warn(
            "Deleted subscription has no OMSW user:",
            subscription.id,
          );

          break;
        }

        const expiresAt =
          getSubscriptionPeriodEnd(
            subscription,
          );

        const updateData: {
          status: string;
          expires_at?: string;
        } = {
          status: "canceled",
        };

        if (expiresAt) {
          updateData.expires_at =
            expiresAt;
        }

        const { error } =
          await supabaseAdmin
            .from("subscriptions")
            .update(updateData)
            .eq("user_id", userId);

        if (error) {
          console.error(
            "Subscription cancel update error:",
            error,
          );

          throw error;
        }

        console.log(
          "Stripe subscription deleted:",
          {
            subscriptionId:
              subscription.id,
            userId,
          },
        );

        break;
      }

      // ====================================================
      // Events ที่เราไม่ได้ใช้งาน
      // ====================================================

      default: {
        console.log(
          "Stripe event ignored:",
          event.type,
        );

        break;
      }
    }

    // ------------------------------------------------------
    // Success
    // ------------------------------------------------------

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error(
      "Stripe webhook processing error:",
      {
        eventId: event.id,
        eventType: event.type,
        error,
      },
    );

    /**
     * ส่ง 500 ให้ Stripe retry
     * กรณีเกิด error จริงระหว่าง update DB
     */
    return NextResponse.json(
      {
        error: "Webhook failed",
      },
      {
        status: 500,
      },
    );
  }
}