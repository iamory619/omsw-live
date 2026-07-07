import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

function addOneMonth() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 500 },
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook secret is not configured" },
      { status: 500 },
    );
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe signature error:", error);

    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 },
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan;

      if (!userId || !plan) {
        return NextResponse.json(
          { error: "Missing userId or plan metadata" },
          { status: 400 },
        );
      }

      const { error: subscriptionError } = await supabaseAdmin
        .from("subscriptions")
        .upsert(
          {
            user_id: userId,
            plan,
            status: "active",
            started_at: new Date().toISOString(),
            expires_at: addOneMonth(),
          },
          { onConflict: "user_id" },
        );

      if (subscriptionError) {
        console.error("Supabase subscription update error:", subscriptionError);

        return NextResponse.json(
          { error: "Unable to update subscription" },
          { status: 500 },
        );
      }

      const { error: paymentError } = await supabaseAdmin
        .from("payments")
        .insert({
          user_id: userId,
          stripe_event_id: event.id,
          stripe_customer_id:
            typeof session.customer === "string" ? session.customer : null,
          stripe_subscription_id:
            typeof session.subscription === "string"
              ? session.subscription
              : null,
          amount: session.amount_total || 0,
          currency: session.currency || "thb",
          status: "paid",
          plan,
          paid_at: new Date().toISOString(),
        });

      if (paymentError) {
        console.error("Supabase payment insert error:", paymentError);
      }
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer;
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);

    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
