import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type RouteContext = {
  params: Promise<{ overlayId: string }>;
};

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: RouteContext) {
  const { overlayId } = await context.params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!overlayId) {
    return NextResponse.json({ error: "Overlay ID is required." }, { status: 400 });
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server configuration is incomplete." }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
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
    .from("magic_lantern_settings")
    .select("*")
    .eq("user_id", profile.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Unable to load Magic Lantern settings." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    settings ?? {
      lantern: "phoenix",
      gift_name: "Rose",
      gift_emoji: "🌹",
      gift_image: "/assets/rose.png",
      target_amount: 50,
      start_value: 0,
      glow_color: "#a855f7",
      petal_effect: "sakura",
      full_message: "✨ Magic Lantern Complete!",
      show_progress: true,
      show_gift_name: true,
      show_last_gifter: true,
      enable_fill_animation: true,
      enable_complete_animation: true,
      enable_sound: true,
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}