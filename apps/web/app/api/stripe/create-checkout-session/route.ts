import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 },
      );
    }

    const { plan, userId } = await req.json();

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
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (!priceId) {
      return NextResponse.json(
        { error: "Missing Stripe Price ID" },
        { status: 500 },
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        userId: userId ?? "",
        plan: metadataPlan,
      },
      success_url: `${appUrl}/dashboard/billing?success=true`,
      cancel_url: `${appUrl}/dashboard/billing?cancelled=true`,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe Checkout Error:", error);

    return NextResponse.json(
      { error: "Unable to create checkout session." },
      { status: 500 },
    );
  }
}