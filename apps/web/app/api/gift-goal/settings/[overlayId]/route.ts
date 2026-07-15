import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type RouteContext = {
  params: Promise<{
    overlayId: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  const { overlayId } = await context.params;

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!overlayId) {
    return NextResponse.json(
      { error: "Overlay ID is required." },
      { status: 400 },
    );
  }

  if (!supabaseUrl || !serviceRoleKey) {
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

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Overlay owner was not found." },
      { status: profileError ? 500 : 404 },
    );
  }

  const { data: settings, error } = await supabase
    .from("gift_goal_settings")
    .select("*")
    .eq("user_id", profile.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Unable to load Gift Goal settings." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    settings ?? {
      title: "Gift Goal",
      gift_name: "Rose",
      gift_emoji: "🌹",
      gift_image: "/assets/rose.png",
      goal_amount: 100,
      start_value: 0,
      progress_color: "#ec4899",
      theme: "cute-pink",
      show_gift_icon: true,
      show_percentage: true,
      show_current_value: true,
      show_remaining: true,
      show_live_badge: true,
      enable_goal_animation: true,
      goal_complete_message: "🎉 Goal Complete! Thank you everyone!",
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}