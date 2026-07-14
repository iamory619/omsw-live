import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type RouteContext = {
  params: Promise<{
    overlayId: string;
  }>;
};

type RewardRow = {
  id: string;
  emoji: string;
  label: string;
  weight: number | string;
  color: string;
  is_jackpot: boolean;
  is_enabled: boolean;
  sort_order: number;
};

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  const { overlayId } = await context.params;

  if (!overlayId) {
    return NextResponse.json(
      { error: "Overlay ID is required." },
      { status: 400 },
    );
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );

    return NextResponse.json(
      { error: "Server configuration is incomplete." },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("overlay_id", overlayId)
    .maybeSingle();

  if (profileError) {
    console.error("Gift Wheel profile lookup error:", profileError);

    return NextResponse.json(
      { error: "Unable to find overlay owner." },
      { status: 500 },
    );
  }

  if (!profile) {
    return NextResponse.json(
      { error: "Overlay was not found." },
      { status: 404 },
    );
  }

  const { data: settings, error: settingsError } = await supabase
    .from("gift_wheel_settings")
    .select(
      "id,gift_per_spin,theme,tick_sound_enabled,confetti_enabled,stop_burst_enabled,jackpot_enabled",
    )
    .eq("user_id", profile.id)
    .maybeSingle();

  if (settingsError) {
    console.error("Gift Wheel settings lookup error:", settingsError);

    return NextResponse.json(
      { error: "Unable to load Gift Wheel settings." },
      { status: 500 },
    );
  }

  if (!settings) {
    return NextResponse.json({
      giftPerSpin: 10,
      theme: "classic",
      tickSoundEnabled: true,
      confettiEnabled: true,
      stopBurstEnabled: true,
      jackpotEnabled: true,
      prizes: [],
    });
  }

  const { data: rewards, error: rewardsError } = await supabase
    .from("gift_wheel_rewards")
    .select(
      "id,emoji,label,weight,color,is_jackpot,is_enabled,sort_order",
    )
    .eq("setting_id", settings.id)
    .eq("is_enabled", true)
    .order("sort_order", { ascending: true });

  if (rewardsError) {
    console.error("Gift Wheel rewards lookup error:", rewardsError);

    return NextResponse.json(
      { error: "Unable to load Gift Wheel rewards." },
      { status: 500 },
    );
  }

  const prizes = ((rewards ?? []) as RewardRow[])
    .filter((reward) => settings.jackpot_enabled || !reward.is_jackpot)
    .map((reward) => ({
      id: reward.is_jackpot ? "jackpot" : reward.id,
      emoji: reward.emoji,
      label: reward.label,
      weight: Math.max(0, Number(reward.weight) || 0),
      color: reward.color,
    }));

  return NextResponse.json(
    {
      giftPerSpin: Math.max(1, Number(settings.gift_per_spin) || 10),
      theme: settings.theme || "classic",
      tickSoundEnabled: settings.tick_sound_enabled !== false,
      confettiEnabled: settings.confetti_enabled !== false,
      stopBurstEnabled: settings.stop_burst_enabled !== false,
      jackpotEnabled: settings.jackpot_enabled !== false,
      prizes,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}