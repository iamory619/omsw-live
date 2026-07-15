"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingCard } from "@/components/ui/LoadingCard";
import { SectionHeader } from "@/components/ui/SectionHeader";

type GiftGoalTheme =
  | "cute-pink"
  | "neon"
  | "minimal"
  | "candy"
  | "cyber"
  | "glass";

type GiftGoalSettings = {
  id: string;
  user_id: string;
  title: string;
  gift_name: string;
  gift_emoji: string;
  gift_image: string | null;
  goal_amount: number;
  start_value: number;
  progress_color: string;
  background_style: "dark" | "glass" | "gradient" | "transparent";
  theme: GiftGoalTheme;
  show_gift_icon: boolean;
  show_percentage: boolean;
  show_current_value: boolean;
  show_remaining: boolean;
  show_live_badge: boolean;
  enable_goal_animation: boolean;
  goal_complete_message: string;
  goal_sound: string;
};

const GIFT_PRESETS = [
  { name: "Rose", emoji: "🌹", image: "/assets/rose.png" },
  { name: "Finger Heart", emoji: "🫰", image: "" },
  { name: "Perfume", emoji: "🧴", image: "" },
  { name: "Doughnut", emoji: "🍩", image: "" },
  { name: "TikTok", emoji: "🎵", image: "" },
  { name: "Custom Gift", emoji: "🎁", image: "" },
];

const THEMES: { id: GiftGoalTheme; name: string; preview: string }[] = [
  { id: "cute-pink", name: "Cute Pink", preview: "🎀" },
  { id: "candy", name: "Candy", preview: "🍭" },
  { id: "glass", name: "Glass", preview: "✨" },
  { id: "neon", name: "Neon", preview: "💜" },
  { id: "minimal", name: "Minimal", preview: "🤍" },
  { id: "cyber", name: "Cyber", preview: "⚡" },
];

export default function GiftGoalSettingsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [settings, setSettings] = useState<GiftGoalSettings | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("gift_goal_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Load Gift Goal settings error:", error);
        setMessage("Unable to load Gift Goal settings.");
        setLoading(false);
        return;
      }

      if (data) {
        setSettings(data as GiftGoalSettings);
        setLoading(false);
        return;
      }

      const { data: created, error: createError } = await supabase
        .from("gift_goal_settings")
        .insert({
          user_id: user.id,
          title: "Gift Goal",
          gift_name: "Rose",
          gift_emoji: "🌹",
          gift_image: "/assets/rose.png",
          goal_amount: 100,
          start_value: 0,
          progress_color: "#ec4899",
          background_style: "dark",
          theme: "cute-pink",
          show_gift_icon: true,
          show_percentage: true,
          show_current_value: true,
          show_remaining: true,
          show_live_badge: true,
          enable_goal_animation: true,
          goal_complete_message: "🎉 Goal Complete! Thank you everyone!",
          goal_sound: "celebration",
        })
        .select("*")
        .single();

      if (createError || !created) {
        console.error("Create Gift Goal settings error:", createError);
        setMessage("Unable to create Gift Goal settings.");
        setLoading(false);
        return;
      }

      setSettings(created as GiftGoalSettings);
      setLoading(false);
    };

    void loadSettings();
  }, [router, supabase]);

  const updateSetting = <K extends keyof GiftGoalSettings>(
    key: K,
    value: GiftGoalSettings[K],
  ) => {
    setSettings((current) =>
      current ? { ...current, [key]: value } : current,
    );
  };

  const selectGift = (preset: (typeof GIFT_PRESETS)[number]) => {
    if (!settings) return;

    setSettings({
      ...settings,
      gift_name: preset.name,
      gift_emoji: preset.emoji,
      gift_image: preset.image,
    });
  };

  const saveSettings = async () => {
    if (!settings || !userId) return;

    if (!settings.title.trim() || !settings.gift_name.trim()) {
      setMessage("Please enter a title and gift name.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const { error } = await supabase
        .from("gift_goal_settings")
        .update({
          title: settings.title.trim(),
          gift_name: settings.gift_name.trim(),
          gift_emoji: settings.gift_emoji.trim() || "🎁",
          gift_image: settings.gift_image?.trim() || null,
          goal_amount: Math.max(1, Number(settings.goal_amount) || 1),
          start_value: Math.max(0, Number(settings.start_value) || 0),
          progress_color: settings.progress_color,
          background_style: settings.background_style,
          theme: settings.theme,
          show_gift_icon: settings.show_gift_icon,
          show_percentage: settings.show_percentage,
          show_current_value: settings.show_current_value,
          show_remaining: settings.show_remaining,
          show_live_badge: settings.show_live_badge,
          enable_goal_animation: settings.enable_goal_animation,
          goal_complete_message:
            settings.goal_complete_message.trim() ||
            "🎉 Goal Complete! Thank you everyone!",
          goal_sound: settings.goal_sound,
        })
        .eq("id", settings.id)
        .eq("user_id", userId);

      if (error) throw error;

      setMessage("Gift Goal settings saved successfully.");
    } catch (error) {
      console.error("Save Gift Goal settings error:", error);
      setMessage("Unable to save Gift Goal settings.");
    } finally {
      setSaving(false);
    }
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
          <Card>{message || "Gift Goal settings unavailable."}</Card>
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
            title="🎁 Gift Goal"
            description="Choose the gift, goal, theme and celebration style."
          />

          <div className="flex flex-wrap gap-3">
            <Button href="/dashboard/widgets">Back to Widgets</Button>
            <Button
              onClick={() => void saveSettings()}
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
              <h2 className="text-xl font-black">Goal Details</h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Widget title"
                  value={settings.title}
                  onChange={(value) => updateSetting("title", value)}
                />
                <InputField
                  label="Gift name"
                  value={settings.gift_name}
                  onChange={(value) => updateSetting("gift_name", value)}
                />
                <NumberField
                  label="Goal amount"
                  value={settings.goal_amount}
                  min={1}
                  onChange={(value) => updateSetting("goal_amount", value)}
                />
                <NumberField
                  label="Start value"
                  value={settings.start_value}
                  min={0}
                  onChange={(value) => updateSetting("start_value", value)}
                />
              </div>
            </Card>

            <Card>
              <h2 className="text-xl font-black">Choose Gift</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Only the selected gift will increase this goal.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {GIFT_PRESETS.map((preset) => {
                  const selected =
                    settings.gift_name.toLowerCase() ===
                    preset.name.toLowerCase();

                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => selectGift(preset)}
                      className={`rounded-2xl border p-4 text-center transition ${
                        selected
                          ? "border-pink-500 bg-pink-500/15"
                          : "border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
                      }`}
                    >
                      <div className="text-4xl">{preset.emoji}</div>
                      <div className="mt-2 text-sm font-black">
                        {preset.name}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Gift emoji"
                  value={settings.gift_emoji}
                  onChange={(value) => updateSetting("gift_emoji", value)}
                />
                <InputField
                  label="Gift image URL (optional)"
                  value={settings.gift_image ?? ""}
                  onChange={(value) => updateSetting("gift_image", value)}
                />
              </div>
            </Card>

            <Card>
              <h2 className="text-xl font-black">Theme</h2>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => updateSetting("theme", theme.id)}
                    className={`rounded-2xl border p-4 text-center transition ${
                      settings.theme === theme.id
                        ? "border-pink-500 bg-pink-500/15"
                        : "border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
                    }`}
                  >
                    <div className="text-3xl">{theme.preview}</div>
                    <div className="mt-2 text-sm font-black">{theme.name}</div>
                  </button>
                ))}
              </div>

              <div className="mt-5">
                <label className="block">
                  <span className="text-sm font-bold text-zinc-300">
                    Progress color
                  </span>
                  <input
                    type="color"
                    value={settings.progress_color}
                    onChange={(event) =>
                      updateSetting("progress_color", event.target.value)
                    }
                    className="mt-2 h-12 w-full cursor-pointer rounded-xl border border-zinc-700 bg-zinc-950 p-2"
                  />
                </label>
              </div>
            </Card>

            <Card>
              <h2 className="text-xl font-black">Goal Complete</h2>

              <label className="mt-5 block">
                <span className="text-sm font-bold text-zinc-300">
                  Celebration message
                </span>
                <textarea
                  value={settings.goal_complete_message}
                  onChange={(event) =>
                    updateSetting(
                      "goal_complete_message",
                      event.target.value,
                    )
                  }
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 font-bold outline-none focus:border-pink-500"
                />
              </label>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <h2 className="text-xl font-black">Display Options</h2>

              <div className="mt-5 space-y-3">
                <ToggleRow
                  label="Gift icon"
                  checked={settings.show_gift_icon}
                  onChange={(checked) =>
                    updateSetting("show_gift_icon", checked)
                  }
                />
                <ToggleRow
                  label="Percentage"
                  checked={settings.show_percentage}
                  onChange={(checked) =>
                    updateSetting("show_percentage", checked)
                  }
                />
                <ToggleRow
                  label="Current value"
                  checked={settings.show_current_value}
                  onChange={(checked) =>
                    updateSetting("show_current_value", checked)
                  }
                />
                <ToggleRow
                  label="Remaining amount"
                  checked={settings.show_remaining}
                  onChange={(checked) =>
                    updateSetting("show_remaining", checked)
                  }
                />
                <ToggleRow
                  label="LIVE badge"
                  checked={settings.show_live_badge}
                  onChange={(checked) =>
                    updateSetting("show_live_badge", checked)
                  }
                />
                <ToggleRow
                  label="Goal animation"
                  checked={settings.enable_goal_animation}
                  onChange={(checked) =>
                    updateSetting("enable_goal_animation", checked)
                  }
                />
              </div>
            </Card>

            <Card>
              <h2 className="text-xl font-black">Current Setup</h2>
              <div className="mt-5 space-y-3 text-sm">
                <SummaryRow label="Gift" value={`${settings.gift_emoji} ${settings.gift_name}`} />
                <SummaryRow label="Goal" value={String(settings.goal_amount)} />
                <SummaryRow label="Theme" value={settings.theme} />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

function InputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-zinc-300">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 font-bold outline-none focus:border-pink-500"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-zinc-300">{label}</span>
      <input
        type="number"
        min={min}
        value={value}
        onChange={(event) =>
          onChange(Math.max(min, Number(event.target.value) || min))
        }
        className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 font-bold outline-none focus:border-pink-500"
      />
    </label>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <span className="font-black">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5"
      />
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-zinc-950 px-4 py-3">
      <span className="text-zinc-400">{label}</span>
      <span className="font-black capitalize">{value}</span>
    </div>
  );
}