import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 },
      );
    }

    const { plan, userId, paymentMethod = "card" } =
      await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 },
      );
    }

    let priceId: string | undefined;
    let metadataPlan: string;

    switch (plan) {
      case "creator":
        priceId = process.env.STRIPE_CREATOR_PRICE_ID;
        metadataPlan = "pro";
        break;

      case "pro":
        priceId = process.env.STRIPE_PRO_PRICE_ID;
        metadataPlan = "premium";
        break;

      default:
        return NextResponse.json(
          { error: "Invalid plan" },
          { status: 400 },
        );
    }

    if (!priceId) {
      return NextResponse.json(
        { error: "Missing Stripe Price ID" },
        { status: 500 },
      );
    }

    // ========================================
    // PromptPay
    // จ่ายครั้งเดียว แล้วระบบเราให้สมาชิก 30 วัน
    // ========================================
    if (paymentMethod === "promptpay") {
      // ดึงราคาเดิมจาก Stripe
      const recurringPrice =
        await stripe.prices.retrieve(priceId);

      if (
        recurringPrice.unit_amount == null ||
        !recurringPrice.currency
      ) {
        return NextResponse.json(
          { error: "Invalid Stripe price" },
          { status: 500 },
        );
      }

      const session =
        await stripe.checkout.sessions.create({
          mode: "payment",

          payment_method_types: ["promptpay"],

          line_items: [
            {
              price_data: {
                currency: recurringPrice.currency,

                unit_amount: recurringPrice.unit_amount,

                product_data: {
                  name:
                    metadataPlan === "premium"
                      ? "OMSW Live Premium - 30 Days"
                      : "OMSW Live Pro - 30 Days",
                },
              },

              quantity: 1,
            },
          ],

          metadata: {
            userId,
            plan: metadataPlan,
            paymentType: "promptpay",
            accessDays: "30",
          },

          payment_intent_data: {
            metadata: {
              userId,
              plan: metadataPlan,
              paymentType: "promptpay",
              accessDays: "30",
            },
          },

          success_url:
            `${appUrl}/dashboard/billing?success=true&method=promptpay`,

          cancel_url:
            `${appUrl}/dashboard/billing?cancelled=true`,
        });

      return NextResponse.json({
        url: session.url,
      });
    }

    // ========================================
    // Card
    // Subscription ต่ออายุอัตโนมัติแบบเดิม
    // ========================================
    if (paymentMethod === "card") {
      const session =
        await stripe.checkout.sessions.create({
          mode: "subscription",

          payment_method_types: ["card"],

          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],

          metadata: {
            userId,
            plan: metadataPlan,
            paymentType: "card",
          },

          subscription_data: {
            metadata: {
              userId,
              plan: metadataPlan,
              paymentType: "card",
            },
          },

          success_url:
            `${appUrl}/dashboard/billing?success=true&method=card`,

          cancel_url:
            `${appUrl}/dashboard/billing?cancelled=true`,
        });

      return NextResponse.json({
        url: session.url,
      });
    }

    return NextResponse.json(
      { error: "Invalid payment method" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Stripe Checkout Error:", error);

    return NextResponse.json(
      {
        error: "Unable to create checkout session.",
      },
      { status: 500 },
    );
  }
}