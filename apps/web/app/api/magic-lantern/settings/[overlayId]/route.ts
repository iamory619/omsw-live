import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type RouteContext = {
  params: Promise<{ overlayId: string }>;
};

export const dynamic = "force-dynamic";

const DEFAULT_SETTINGS = {
  gift_name: "All Gifts",
  gift_emoji: "🎁",
  gift_image: "/assets/rose.png",

  /*
    จำนวน Gift สูงสุดที่โชว์ในโคม
    ของใหม่เข้ามา -> ของเก่าสุดหาย
  */
  target_amount: 12,

  /*
    เก็บไว้เผื่อใช้กับ schema เดิม
    ตอนนี้ระบบใหม่ไม่ได้ใช้ progress แล้ว
  */
  start_value: 0,

  /*
    สี glow หลักของโคม
  */
  glow_color: "#a855f7",

  /*
    เอฟเฟกต์อนุภาคในโคม
  */
  petal_effect: "sparkles",

  full_message: "Thank you for the gift!",

  /*
    ระบบใหม่ไม่ใช้ progress bar
  */
  show_progress: false,

  show_gift_name: true,
  show_last_gifter: true,

  /*
    เก็บไว้เพื่อ compatibility
    แต่ logic หลักอยู่ในหน้า widget แล้ว
  */
  enable_fill_animation: true,
  enable_complete_animation: false,
  enable_sound: false,
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  const { overlayId } = await context.params;

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!overlayId) {
    return NextResponse.json(
      {
        error: "Overlay ID is required.",
      },
      {
        status: 400,
      },
    );
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      {
        error:
          "Server configuration is incomplete.",
      },
      {
        status: 500,
      },
    );
  }

  const supabase = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  /*
    หาเจ้าของ overlay
  */
  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("id")
    .eq("overlay_id", overlayId)
    .maybeSingle();

  if (profileError) {
    console.error(
      "[Magic Lantern] Profile lookup failed:",
      profileError,
    );

    return NextResponse.json(
      {
        error:
          "Unable to load overlay owner.",
      },
      {
        status: 500,
      },
    );
  }

  if (!profile) {
    return NextResponse.json(
      {
        error:
          "Overlay owner was not found.",
      },
      {
        status: 404,
      },
    );
  }

  /*
    โหลด Magic Lantern settings
  */
  const {
    data: settings,
    error: settingsError,
  } = await supabase
    .from("magic_lantern_settings")
    .select("*")
    .eq("user_id", profile.id)
    .maybeSingle();

  if (settingsError) {
    console.error(
      "[Magic Lantern] Settings lookup failed:",
      settingsError,
    );

    return NextResponse.json(
      {
        error:
          "Unable to load Magic Lantern settings.",
      },
      {
        status: 500,
      },
    );
  }

  /*
    ถ้ายังไม่มี row ใน database
    ใช้ค่า default ใหม่
  */
  if (!settings) {
    return NextResponse.json(
      DEFAULT_SETTINGS,
      {
        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      },
    );
  }

  /*
    merge กับ default
    เพื่อรองรับ row เก่าที่อาจไม่มี field ใหม่ครบ
  */
  const normalizedSettings = {
    ...DEFAULT_SETTINGS,
    ...settings,

    /*
      ระบบใหม่บังคับปิด progress
      และ complete animation เดิม
    */
    show_progress: false,
    enable_complete_animation: false,
  };

  /*
    ลบ field ระบบเก่าที่ไม่ใช้แล้ว
    เช่น lantern: phoenix / rat / cat / rabbit
  */
  delete (
    normalizedSettings as Record<
      string,
      unknown
    >
  ).lantern;

  return NextResponse.json(
    normalizedSettings,
    {
      headers: {
        "Cache-Control":
          "no-store, max-age=0",
      },
    },
  );
}