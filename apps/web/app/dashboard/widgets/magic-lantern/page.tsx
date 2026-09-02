"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingCard } from "@/components/ui/LoadingCard";
import { SectionHeader } from "@/components/ui/SectionHeader";

type PetalEffect =
  | "sakura"
  | "hearts"
  | "stars"
  | "sparkles"
  | "none";

type Settings = {
  id: string;
  user_id: string;

  gift_name: string;
  gift_emoji: string;
  gift_image: string | null;

  /*
    ใช้ target_amount เดิมใน Supabase
    แต่ความหมายใหม่คือจำนวน Gift สูงสุดในโคม
  */
  target_amount: number;

  start_value: number;

  glow_color: string;
  petal_effect: PetalEffect;

  full_message: string;

  show_progress: boolean;
  show_gift_name: boolean;
  show_last_gifter: boolean;

  enable_fill_animation: boolean;
  enable_complete_animation: boolean;
  enable_sound: boolean;
};

const ACTIVE_LANTERN =
  "/assets/lantern/magic-lantern-active.png";

const EFFECTS: {
  id: PetalEffect;
  name: string;
  icon: string;
}[] = [
  {
    id: "sparkles",
    name: "Sparkles",
    icon: "✨",
  },
  {
    id: "stars",
    name: "Stars",
    icon: "⭐",
  },
  {
    id: "hearts",
    name: "Hearts",
    icon: "💖",
  },
  {
    id: "sakura",
    name: "Sakura",
    icon: "🌸",
  },
  {
    id: "none",
    name: "None",
    icon: "🚫",
  },
];

/*
  เราไม่ควรใส่เยอะเกินไป
  เพราะพื้นที่ด้านในโคมมีจำกัด
*/
const MAX_OPTIONS = [
  6,
  8,
  10,
  12,
  14,
  16,
  20,
];

export default function MagicLanternSettingsPage() {
  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    [],
  );

  const [settings, setSettings] =
    useState<Settings | null>(null);

  const [userId, setUserId] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [previewMode, setPreviewMode] =
    useState<"active" | "special">(
      "active",
    );

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);

      /*
        โหลด settings เดิม
      */
      const {
        data,
        error: loadError,
      } = await supabase
        .from("magic_lantern_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (loadError) {
        console.error(loadError);

        setMessage(
          "Unable to load Magic Lantern settings.",
        );

        setLoading(false);
        return;
      }

      /*
        ถ้ามีข้อมูลอยู่แล้ว
      */
      if (data) {
        setSettings({
          id: data.id,
          user_id: data.user_id,

          gift_name:
            data.gift_name ||
            "All Gifts",

          gift_emoji:
            data.gift_emoji ||
            "🎁",

          gift_image:
            data.gift_image ??
            "/assets/rose.png",

          target_amount: Math.min(
            20,
            Math.max(
              6,
              Number(
                data.target_amount,
              ) || 12,
            ),
          ),

          start_value: 0,

          glow_color:
            data.glow_color ||
            "#a855f7",

          petal_effect:
            (data.petal_effect as PetalEffect) ||
            "sparkles",

          full_message:
            data.full_message ||
            "Thank you for the gift!",

          show_progress: false,

          show_gift_name: true,

          show_last_gifter:
            data.show_last_gifter ??
            true,

          enable_fill_animation:
            true,

          enable_complete_animation:
            false,

          enable_sound: false,
        });

        setLoading(false);
        return;
      }

      /*
        ถ้ายังไม่มี row ให้สร้างใหม่

        หมายเหตุ:
        ไม่ส่ง lantern แล้ว
        เพราะระบบใหม่ไม่มีการเลือกสัตว์
      */
      const {
        data: created,
        error: createError,
      } = await supabase
        .from("magic_lantern_settings")
        .insert({
          user_id: user.id,

          gift_name: "All Gifts",
          gift_emoji: "🎁",
          gift_image:
            "/assets/rose.png",

          target_amount: 12,

          start_value: 0,

          glow_color:
            "#a855f7",

          petal_effect:
            "sparkles",

          full_message:
            "Thank you for the gift!",

          show_progress: false,
          show_gift_name: true,
          show_last_gifter: true,

          enable_fill_animation:
            true,

          enable_complete_animation:
            false,

          enable_sound: false,
        })
        .select("*")
        .single();

      if (
        createError ||
        !created
      ) {
        console.error(createError);

        setMessage(
          "Unable to create Magic Lantern settings.",
        );

        setLoading(false);
        return;
      }

      setSettings({
        id: created.id,
        user_id: created.user_id,

        gift_name:
          created.gift_name ||
          "All Gifts",

        gift_emoji:
          created.gift_emoji ||
          "🎁",

        gift_image:
          created.gift_image ??
          "/assets/rose.png",

        target_amount: Math.min(
          20,
          Math.max(
            6,
            Number(
              created.target_amount,
            ) || 12,
          ),
        ),

        start_value: 0,

        glow_color:
          created.glow_color ||
          "#a855f7",

        petal_effect:
          (created.petal_effect as PetalEffect) ||
          "sparkles",

        full_message:
          created.full_message ||
          "Thank you for the gift!",

        show_progress: false,

        show_gift_name: true,

        show_last_gifter:
          created.show_last_gifter ??
          true,

        enable_fill_animation:
          true,

        enable_complete_animation:
          false,

        enable_sound: false,
      });

      setLoading(false);
    };

    void load();
  }, [router, supabase]);

  const update = <
    K extends keyof Settings,
  >(
    key: K,
    value: Settings[K],
  ) => {
    setSettings((current) =>
      current
        ? {
            ...current,
            [key]: value,
          }
        : current,
    );
  };

  const save = async () => {
    if (!settings || !userId) {
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } =
      await supabase
        .from(
          "magic_lantern_settings",
        )
        .update({
          /*
            ระบบใหม่รับทุก Gift
          */
          gift_name: "All Gifts",

          gift_emoji:
            settings.gift_emoji.trim() ||
            "🎁",

          gift_image:
            settings.gift_image?.trim() ||
            null,

          /*
            จำนวน Gift สูงสุด
            ที่โชว์พร้อมกัน
          */
          target_amount: Math.min(
            20,
            Math.max(
              6,
              Number(
                settings.target_amount,
              ) || 12,
            ),
          ),

          start_value: 0,

          glow_color:
            settings.glow_color,

          petal_effect:
            settings.petal_effect,

          full_message:
            "Thank you for the gift!",

          show_progress: false,

          show_gift_name: true,

          show_last_gifter:
            settings.show_last_gifter,

          enable_fill_animation:
            true,

          enable_complete_animation:
            false,

          enable_sound: false,
        })
        .eq("id", settings.id)
        .eq(
          "user_id",
          userId,
        );

    if (error) {
      console.error(error);

      setMessage(
        `❌ ${error.code ?? ""} ${
          error.message
        }${
          error.details
            ? " - " +
              error.details
            : ""
        }`,
      );
    } else {
      setMessage(
        "✅ Magic Lantern settings saved successfully.",
      );
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 p-6 text-white">
        <div className="mx-auto max-w-5xl">
          <LoadingCard />
        </div>
      </main>
    );
  }

  if (!settings) {
    return (
      <main className="min-h-screen bg-zinc-950 p-6 text-white">
        <div className="mx-auto max-w-5xl">
          <Card>
            {message}
          </Card>
        </div>
      </main>
    );
  }

  const previewImage = ACTIVE_LANTERN;

  return (
    <main className="min-h-screen bg-zinc-950 px-3 py-5 text-white sm:px-5 lg:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <SectionHeader
            badge="Widget Settings"
            title="🏮 Magic Lantern"
            description="TikTok gifts float inside one magical lantern. Gifts worth 5,000+ coins trigger a Legendary glow effect automatically."
          />

          <div className="flex flex-wrap gap-3">
            <Button href="/dashboard/widgets">
              Back to Widgets
            </Button>

            <Button
              onClick={() =>
                void save()
              }
              disabled={saving}
              variant="upgrade"
            >
              {saving
                ? "Saving..."
                : "Save Settings"}
            </Button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-6 rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-4 text-sm font-bold">
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* LEFT */}
          <div className="space-y-6">

            {/* Lantern system - single image + code effects */}
            <Card>
              <h2 className="text-xl font-black">
                Magic Lantern
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                The lantern automatically reacts to incoming TikTok gifts.
                There is one lantern design, no lantern selection, and no progress goal.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {/* Active */}
                <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-4">
                  <div className="text-sm font-black text-purple-200">
                    ✨ Active Lantern
                  </div>

                  <p className="mt-2 text-xs leading-5 text-zinc-400">
                    Used normally and whenever regular gifts are received.
                  </p>
                </div>

                {/* Special */}
                <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-4">
                  <div className="text-sm font-black text-yellow-200">
                    👑 Legendary Lantern
                  </div>

                  <p className="mt-2 text-xs leading-5 text-zinc-400">
                    Automatically activates when a gift is worth 5,000 coins or more.
                  </p>
                </div>
              </div>
            </Card>

            {/* Floating Gifts */}
            <Card>
              <h2 className="text-xl font-black">
                Floating Gifts
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Every TikTok gift can appear inside the lantern.
                When the lantern reaches the maximum number of gifts,
                the oldest gift disappears and the newest gift takes its place.
              </p>

              <div className="mt-6">
                <label className="text-sm font-black">
                  Maximum gifts inside lantern
                </label>

                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {MAX_OPTIONS.map(
                    (amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() =>
                          update(
                            "target_amount",
                            amount,
                          )
                        }
                        className={`rounded-xl border px-3 py-3 text-sm font-black transition ${
                          settings.target_amount ===
                          amount
                            ? "border-purple-500 bg-purple-500/20 text-purple-200"
                            : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"
                        }`}
                      >
                        {amount}
                      </button>
                    ),
                  )}
                </div>

                <p className="mt-3 text-xs leading-5 text-zinc-500">
                  Recommended: 12 gifts. Keeping fewer gifts makes the
                  lantern cleaner and easier to read during a live stream.
                </p>
              </div>
            </Card>

            {/* Visual Effects */}
            <Card>
              <h2 className="text-xl font-black">
                Visual Effects
              </h2>

              {/* Glow */}
              <div className="mt-5">
                <label className="text-sm font-black">
                  Magic glow color
                </label>

                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="color"
                    value={
                      settings.glow_color
                    }
                    onChange={(
                      event,
                    ) =>
                      update(
                        "glow_color",
                        event.target.value,
                      )
                    }
                    className="h-12 w-16 cursor-pointer rounded-xl border border-zinc-700 bg-zinc-900 p-1"
                  />

                  <input
                    value={
                      settings.glow_color
                    }
                    onChange={(
                      event,
                    ) =>
                      update(
                        "glow_color",
                        event.target.value,
                      )
                    }
                    className="h-12 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 font-mono text-sm outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Particles */}
              <div className="mt-6">
                <label className="text-sm font-black">
                  Ambient particles
                </label>

                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {EFFECTS.map(
                    (effect) => (
                      <button
                        key={effect.id}
                        type="button"
                        onClick={() =>
                          update(
                            "petal_effect",
                            effect.id,
                          )
                        }
                        className={`rounded-2xl border p-4 text-center transition ${
                          settings.petal_effect ===
                          effect.id
                            ? "border-purple-500 bg-purple-500/15"
                            : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"
                        }`}
                      >
                        <div className="text-2xl">
                          {
                            effect.icon
                          }
                        </div>

                        <div className="mt-2 text-xs font-black">
                          {
                            effect.name
                          }
                        </div>
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* Latest gifter */}
              <label className="mt-6 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-zinc-700 bg-zinc-900 p-4">
                <div>
                  <div className="font-black">
                    Show latest gifter
                  </div>

                  <div className="mt-1 text-xs leading-5 text-zinc-500">
                    Shows the viewer name and gift when a new gift arrives.
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={
                    settings.show_last_gifter
                  }
                  onChange={(
                    event,
                  ) =>
                    update(
                      "show_last_gifter",
                      event.target.checked,
                    )
                  }
                  className="h-5 w-5 shrink-0"
                />
              </label>
            </Card>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            {/* Preview */}
            <Card>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-black">
                  Preview
                </h2>

                <div className="flex rounded-xl border border-zinc-700 bg-zinc-900 p-1">
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewMode(
                        "active",
                      )
                    }
                    className={`rounded-lg px-3 py-1.5 text-xs font-black transition ${
                      previewMode ===
                      "active"
                        ? "bg-purple-500 text-white"
                        : "text-zinc-400"
                    }`}
                  >
                    Active
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPreviewMode(
                        "special",
                      )
                    }
                    className={`rounded-lg px-3 py-1.5 text-xs font-black transition ${
                      previewMode ===
                      "special"
                        ? "bg-yellow-500 text-black"
                        : "text-zinc-400"
                    }`}
                  >
                    Legendary
                  </button>
                </div>
              </div>

              <div
                className="relative mt-4 aspect-[9/16] overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950"
                style={{
                  background: `
                    radial-gradient(
                      circle at 50% 60%,
                      ${settings.glow_color}35,
                      transparent 58%
                    )
                  `,
                }}
              >
                {previewMode === "special" && (
                  <>
                    <div
                      className="pointer-events-none absolute inset-[10%] rounded-full"
                      style={{
                        background: `
                          radial-gradient(
                            circle,
                            rgba(168,85,247,0.16) 0%,
                            rgba(99,102,241,0.08) 38%,
                            rgba(250,204,21,0.035) 58%,
                            transparent 72%
                          )
                        `,
                        filter: "blur(22px)",
                      }}
                    />

                    <div className="pointer-events-none absolute inset-x-0 top-5 z-20 text-center">
                      <div
                        className="text-xs font-black tracking-[0.2em] text-yellow-100"
                        style={{
                          textShadow: `
                            0 0 7px rgba(250,204,21,.6),
                            0 0 14px rgba(168,85,247,.5)
                          `,
                        }}
                      >
                        ✦ LEGENDARY GIFT ✦
                      </div>
                    </div>
                  </>
                )}

                <Image
                  src={previewImage}
                  alt="Magic Lantern"
                  fill
                  className="object-contain p-5"
                  priority
                  style={{
                    filter:
                      previewMode === "special"
                        ? `
                            brightness(1.08)
                            saturate(1.10)
                            drop-shadow(0 0 18px rgba(168,85,247,.42))
                            drop-shadow(0 0 24px rgba(250,204,21,.14))
                          `
                        : undefined,
                  }}
                />

                <div className="absolute inset-x-5 bottom-5 rounded-xl border border-white/10 bg-black/65 px-3 py-2.5 text-center backdrop-blur-md">
                  <div className="text-xs font-black">
                    Up to{" "}
                    {
                      settings.target_amount
                    }{" "}
                    floating gifts
                  </div>

                  {previewMode ===
                    "special" && (
                    <div className="mt-1 text-[10px] font-bold text-yellow-200">
                      👑 Triggered by
                      5,000+ coin gift
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* How it works */}
            <Card>
              <h2 className="text-lg font-black">
                How it works
              </h2>

              <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-400">
                <p>
                  1. A viewer sends any TikTok gift.
                </p>

                <p>
                  2. The real gift image appears and floats inside the lantern.
                </p>

                <p>
                  3. New gifts replace the oldest gifts after the selected limit.
                </p>

                <p>
                  4. A 5,000+ coin gift automatically activates the Legendary glow effect.
                </p>

                <p>
                  5. The Legendary effect fades out automatically and the same lantern returns to normal.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}