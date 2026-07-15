"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingCard } from "@/components/ui/LoadingCard";
import { SectionHeader } from "@/components/ui/SectionHeader";

type LanternTheme = "phoenix" | "rat" | "cat" | "rabbit";
type PetalEffect = "sakura" | "hearts" | "stars" | "sparkles" | "none";

type Settings = {
  id: string;
  user_id: string;
  lantern: LanternTheme;
  gift_name: string;
  gift_emoji: string;
  gift_image: string | null;

  // ใช้คอลัมน์เดิมเป็น Max Gifts เพื่อไม่ต้องแก้ Supabase
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

const LANTERNS = [
  { id: "phoenix", name: "Phoenix", image: "/assets/lantern/phoenix-back.png" },
  { id: "rat", name: "Rat", image: "/assets/lantern/rat-back.png" },
  { id: "cat", name: "Cat", image: "/assets/lantern/cat-back.png" },
  { id: "rabbit", name: "Rabbit", image: "/assets/lantern/rabbit-back.png" },
] as const;

const EFFECTS: { id: PetalEffect; name: string; icon: string }[] = [
  { id: "sakura", name: "Sakura", icon: "🌸" },
  { id: "hearts", name: "Hearts", icon: "💖" },
  { id: "stars", name: "Stars", icon: "⭐" },
  { id: "sparkles", name: "Sparkles", icon: "✨" },
  { id: "none", name: "None", icon: "🚫" },
];

const MAX_OPTIONS = [10, 15, 20, 25, 30, 40, 50, 60];

export default function MagicLanternSettingsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [settings, setSettings] = useState<Settings | null>(null);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

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

      const { data } = await supabase
        .from("magic_lantern_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setSettings({
          ...(data as Settings),
          target_amount: Math.min(
            60,
            Math.max(5, Number(data.target_amount) || 25),
          ),
          show_progress: false,
          enable_complete_animation: false,
        });
        setLoading(false);
        return;
      }

      const { data: created, error } = await supabase
        .from("magic_lantern_settings")
        .insert({
          user_id: user.id,
          lantern: "phoenix",
          gift_name: "All Gifts",
          gift_emoji: "🎁",
          gift_image: "/assets/rose.png",
          target_amount: 25,
          start_value: 0,
          glow_color: "#a855f7",
          petal_effect: "sparkles",
          full_message: "Thank you for the gift!",
          show_progress: false,
          show_gift_name: true,
          show_last_gifter: true,
          enable_fill_animation: true,
          enable_complete_animation: false,
          enable_sound: false,
        })
        .select("*")
        .single();

      if (error || !created) {
        setMessage("Unable to create Magic Lantern settings.");
      } else {
        setSettings(created as Settings);
      }

      setLoading(false);
    };

    void load();
  }, [router, supabase]);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((current) =>
      current ? { ...current, [key]: value } : current,
    );
  };

  const save = async () => {
    if (!settings || !userId) return;

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("magic_lantern_settings")
      .update({
        lantern: settings.lantern,
        gift_name: "All Gifts",
        gift_emoji: settings.gift_emoji.trim() || "🎁",
        gift_image: settings.gift_image?.trim() || null,
        target_amount: Math.min(
          60,
          Math.max(5, Number(settings.target_amount) || 25),
        ),
        start_value: 0,
        glow_color: settings.glow_color,
        petal_effect: settings.petal_effect,
        full_message: settings.full_message?.trim() || "Thank you for the gift!",
        show_progress: false,
        show_gift_name: true,
        show_last_gifter: settings.show_last_gifter,
        enable_fill_animation: true,
        enable_complete_animation: false,
        enable_sound: false,
      })
      .eq("id", settings.id)
      .eq("user_id", userId);

    if (error) {
      console.error(error);

      setMessage(
        `❌ ${error.code ?? ""} ${error.message}${
          error.details ? " - " + error.details : ""
        }`,
      );
    } else {
      setMessage("✅ Magic Lantern settings saved successfully.");
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
          <Card>{message}</Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-3 py-5 text-white sm:px-5 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <SectionHeader
            badge="Widget Settings"
            title="🏮 Magic Lantern"
            description="Every gift floats inside the lantern. When it reaches the limit, the oldest gift disappears automatically."
          />

          <div className="flex flex-wrap gap-3">
            <Button href="/dashboard/widgets">Back to Widgets</Button>
            <Button
              onClick={() => void save()}
              disabled={saving}
              variant="upgrade"
            >
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-4 text-sm font-bold">
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Card>
              <h2 className="text-xl font-black">Choose Lantern</h2>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {LANTERNS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => update("lantern", item.id)}
                    className={`rounded-2xl border p-3 transition ${
                      settings.lantern === item.id
                        ? "border-purple-500 bg-purple-500/15"
                        : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"
                    }`}
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={120}
                      height={150}
                      className="mx-auto h-28 w-auto object-contain"
                    />
                    <div className="mt-2 text-sm font-black">{item.name}</div>
                  </button>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="text-xl font-black">Floating Gifts</h2>
              <p className="mt-2 text-sm text-zinc-400">
                All TikTok gifts will appear. No gift target and no completion
                screen.
              </p>

              <div className="mt-5">
                <label className="text-sm font-black">
                  Maximum gifts on screen
                </label>
                <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8">
                  {MAX_OPTIONS.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => update("target_amount", amount)}
                      className={`rounded-xl border px-3 py-3 text-sm font-black transition ${
                        settings.target_amount === amount
                          ? "border-purple-500 bg-purple-500/20 text-purple-200"
                          : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"
                      }`}
                    >
                      {amount}
                    </button>
                  ))}
                </div>

                <p className="mt-3 text-xs text-zinc-500">
                  Recommended: 25. When a new gift arrives after the limit, the
                  oldest gift is removed.
                </p>
              </div>
            </Card>

            <Card>
              <h2 className="text-xl font-black">Visual Effects</h2>

              <div className="mt-5">
                <label className="text-sm font-black">Glow color</label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.glow_color}
                    onChange={(event) =>
                      update("glow_color", event.target.value)
                    }
                    className="h-12 w-16 cursor-pointer rounded-xl border border-zinc-700 bg-zinc-900 p-1"
                  />
                  <input
                    value={settings.glow_color}
                    onChange={(event) =>
                      update("glow_color", event.target.value)
                    }
                    className="h-12 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 font-mono text-sm outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="text-sm font-black">Ambient particles</label>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {EFFECTS.map((effect) => (
                    <button
                      key={effect.id}
                      type="button"
                      onClick={() => update("petal_effect", effect.id)}
                      className={`rounded-2xl border p-4 text-center transition ${
                        settings.petal_effect === effect.id
                          ? "border-purple-500 bg-purple-500/15"
                          : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"
                      }`}
                    >
                      <div className="text-2xl">{effect.icon}</div>
                      <div className="mt-2 text-xs font-black">
                        {effect.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <label className="mt-6 flex cursor-pointer items-center justify-between rounded-2xl border border-zinc-700 bg-zinc-900 p-4">
                <div>
                  <div className="font-black">Show latest gifter</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    Display the latest viewer and gift above the lantern.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.show_last_gifter}
                  onChange={(event) =>
                    update("show_last_gifter", event.target.checked)
                  }
                  className="h-5 w-5"
                />
              </label>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <h2 className="text-xl font-black">Preview</h2>
              <div
                className="relative mt-4 aspect-[9/16] overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950"
                style={{
                  background: `radial-gradient(circle at 50% 65%, ${settings.glow_color}3d, transparent 58%)`,
                }}
              >
                <Image
                  src={`/assets/lantern/${settings.lantern}-back.png`}
                  alt="Lantern preview"
                  fill
                  className="object-contain p-10"
                />
                <div className="absolute inset-x-8 bottom-8 rounded-xl bg-black/60 px-3 py-2 text-center text-xs font-black">
                  Up to {settings.target_amount} floating gifts
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-black">How it works</h2>
              <div className="mt-4 space-y-3 text-sm text-zinc-400">
                <p>1. A viewer sends any TikTok gift.</p>
                <p>2. The real gift image floats inside the lantern.</p>
                <p>3. Gifts continue moving until newer gifts replace them.</p>
                <p>4. Reset clears every gift immediately.</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
