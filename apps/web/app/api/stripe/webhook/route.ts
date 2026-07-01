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
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
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

      const { error } = await supabaseAdmin.from("subscriptions").upsert(
        {
          user_id: userId,
          plan,
          status: "active",
          started_at: new Date().toISOString(),
          expires_at: addOneMonth(),
        },
        {
          onConflict: "user_id",
        },
      );

      if (error) {
        console.error("Supabase subscription update error:", error);

        return NextResponse.json(
          { error: "Unable to update subscription" },
          { status: 500 },
        );
      }
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer;

      console.log("Payment failed for customer:", customerId);
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;

      console.log("Subscription cancelled:", subscription.id);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);

    return NextResponse.json(
      { error: "Webhook failed" },
      { status: 500 },
    );
  }
}