"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingCard } from "@/components/ui/LoadingCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Aurora } from "@/components/decorations";

type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  overlay_id: string;
};

type LightEffect =
  | "studio-softbox"
  | "rgb-studio"
  | "streamer-room"
  | "stage-light"
  | "aurora";

type RoomLightSettings = {
  enabled: boolean;
  effect: LightEffect;
  primaryColor: string;
  secondaryColor: string;
  intensity: number;
  blur: number;
  speed: number;
  opacity: number;
  animation: boolean;
  smooth: boolean;
};

type DecorationSettingsRow = {
  user_id: string;
  enabled: boolean;
  effect: LightEffect;
  primary_color: string;
  secondary_color: string;
  intensity: number;
  blur: number;
  speed: number;
  opacity: number;
  animation: boolean;
  smooth: boolean;
};

const DEFAULT_SETTINGS: RoomLightSettings = {
  enabled: true,
  effect: "studio-softbox",
  primaryColor: "#ff4da6",
  secondaryColor: "#7c3aed",
  intensity: 70,
  blur: 90,
  speed: 45,
  opacity: 65,
  animation: true,
  smooth: true,
};

const EFFECT_OPTIONS: Array<{
  id: LightEffect;
  name: string;
  description: string;
  icon: string;
}> = [
  {
    id: "studio-softbox",
    name: "Studio Softbox",
    description: "ไฟนุ่มซ้าย–ขวา เหมาะกับไลฟ์ขายของและพูดคุย",
    icon: "💡",
  },
  {
    id: "rgb-studio",
    name: "RGB Studio",
    description: "ไฟสีสองฝั่งแบบห้องเกม สตรีมเพลง และไลฟ์วัยรุ่น",
    icon: "🌈",
  },
  {
    id: "streamer-room",
    name: "Streamer Room",
    description: "ไฟหลังฉาก ไฟโต๊ะ และแสงบรรยากาศแบบสตรีมเมอร์",
    icon: "🎮",
  },
  {
    id: "stage-light",
    name: "Stage Light",
    description: "ลำแสงด้านบนและแสงพื้น เหมาะกับร้องเพลงและโชว์",
    icon: "🎤",
  },
  {
    id: "aurora",
    name: "Aurora",
    description: "ริ้วแสงเหนือเคลื่อนไหว เหมาะกับไลฟ์เพลง เกม และบรรยากาศแฟนตาซี",
    icon: "🌌",
  },
];

const LIGHT_PRESETS: Array<{
  id: string;
  name: string;
  description: string;
  icon: string;
  settings: Partial<RoomLightSettings>;
}> = [
  {
    id: "tiktok-pink",
    name: "TikTok Pink",
    description: "ชมพู–ม่วง สดใส เหมาะกับไลฟ์บิวตี้",
    icon: "🩷",
    settings: { effect: "rgb-studio", primaryColor: "#ff2d95", secondaryColor: "#7c3aed", intensity: 78, blur: 105, speed: 38, opacity: 72 },
  },
  {
    id: "gaming-neon",
    name: "Gaming Neon",
    description: "ฟ้า–ม่วง เข้มคมแบบห้องเกม",
    icon: "🎮",
    settings: { effect: "streamer-room", primaryColor: "#00d9ff", secondaryColor: "#8b5cf6", intensity: 82, blur: 88, speed: 48, opacity: 76 },
  },
  {
    id: "warm-studio",
    name: "Warm Studio",
    description: "แสงอุ่นนุ่ม ดูผิวสวยและเป็นธรรมชาติ",
    icon: "🧡",
    settings: { effect: "studio-softbox", primaryColor: "#ffd3a1", secondaryColor: "#ff8a4c", intensity: 68, blur: 120, speed: 22, opacity: 62 },
  },
  {
    id: "cool-blue",
    name: "Cool Blue",
    description: "สะอาด โมเดิร์น เหมาะกับไลฟ์เทคและพูดคุย",
    icon: "🩵",
    settings: { effect: "studio-softbox", primaryColor: "#8be9ff", secondaryColor: "#3b82f6", intensity: 72, blur: 110, speed: 28, opacity: 64 },
  },
  {
    id: "concert-stage",
    name: "Concert Stage",
    description: "ลำแสงม่วง–ชมพูสำหรับร้องเพลงและโชว์",
    icon: "🎤",
    settings: { effect: "stage-light", primaryColor: "#ff3cac", secondaryColor: "#784ba0", intensity: 90, blur: 70, speed: 58, opacity: 80 },
  },
  {
    id: "aurora-blue",
    name: "Aurora Blue",
    description: "แสงเหนือฟ้า–เขียว ดูสะอาดและลึกลับ",
    icon: "🌌",
    settings: { effect: "aurora", primaryColor: "#52f7d4", secondaryColor: "#38bdf8", intensity: 82, blur: 95, speed: 40, opacity: 76 },
  },
  {
    id: "aurora-purple",
    name: "Aurora Purple",
    description: "แสงเหนือม่วง–ชมพู แฟนตาซีและโรแมนติก",
    icon: "💜",
    settings: { effect: "aurora", primaryColor: "#a855f7", secondaryColor: "#ff4da6", intensity: 84, blur: 100, speed: 46, opacity: 78 },
  },
];

const STORAGE_KEY = "omsw-room-light-settings";

export default function RoomLightSettingsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [origin, setOrigin] = useState("");
  const [settings, setSettings] =
    useState<RoomLightSettings>(DEFAULT_SETTINGS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    setOrigin(window.location.origin);

    const savedSettings = window.localStorage.getItem(STORAGE_KEY);

    if (savedSettings) {
      try {
        const parsed = JSON.parse(
          savedSettings,
        ) as Partial<RoomLightSettings>;

        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsed,
        });
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    const loadProfile = async () => {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Room light user error:", userError);
        router.replace("/login");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id,email,display_name,overlay_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profileData) {
        console.error("Room light profile error:", profileError);
        setMessage(
          "Unable to load your profile. Please refresh the page.",
        );
        setLoading(false);
        return;
      }

      setProfile(profileData as Profile);

      const { data: settingsData, error: settingsError } = await supabase
        .from("decoration_settings")
        .select(
          "user_id,enabled,effect,primary_color,secondary_color,intensity,blur,speed,opacity,animation,smooth",
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (settingsError) {
        console.error("Load decoration settings error:", settingsError);
        setMessage(
          "Unable to load saved Room Light settings. Local settings are being used.",
        );
        setLoading(false);
        return;
      }

      if (settingsData) {
        const databaseSettings = rowToSettings(
          settingsData as DecorationSettingsRow,
        );

        setSettings(databaseSettings);
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(databaseSettings),
        );
      } else {
        const { error: createError } = await supabase
          .from("decoration_settings")
          .insert(settingsToRow(user.id, settings));

        if (createError) {
          console.error(
            "Create decoration settings error:",
            createError,
          );
          setMessage(
            "Unable to create Room Light settings. Please try again.",
          );
        }
      }

      setLoading(false);
    };

    loadProfile();
  }, [router, supabase]);

  const overlayUrl =
    origin && profile?.overlay_id
      ? `${origin}/overlay/decorations/${profile.overlay_id}`
      : "";

  const updateSetting = <K extends keyof RoomLightSettings>(
    key: K,
    value: RoomLightSettings[K],
  ) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const applyPreset = (presetSettings: Partial<RoomLightSettings>) => {
    setSettings((current) => ({
      ...current,
      ...presetSettings,
      enabled: true,
    }));

    setMessage("Preset applied. Press Save Settings to use it in OBS.");
  };

  const saveSettings = async () => {
    if (!profile?.id) {
      setMessage("User profile not found. Please refresh the page.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const { error } = await supabase
        .from("decoration_settings")
        .upsert(settingsToRow(profile.id, settings), {
          onConflict: "user_id",
        });

      if (error) {
        throw error;
      }

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(settings),
      );

      setPreviewKey((current) => current + 1);
      setMessage("Room Light settings saved successfully.");
    } catch (error) {
      console.error("Save room light settings error:", error);
      setMessage("Unable to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = async () => {
    if (!profile?.id) {
      setMessage("User profile not found. Please refresh the page.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const { error } = await supabase
        .from("decoration_settings")
        .upsert(settingsToRow(profile.id, DEFAULT_SETTINGS), {
          onConflict: "user_id",
        });

      if (error) {
        throw error;
      }

      setSettings(DEFAULT_SETTINGS);
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(DEFAULT_SETTINGS),
      );
      setPreviewKey((current) => current + 1);
      setMessage("Settings restored to default.");
    } catch (error) {
      console.error("Reset room light settings error:", error);
      setMessage("Unable to reset settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const copyOverlayUrl = async () => {
    if (!overlayUrl) return;

    await navigator.clipboard.writeText(overlayUrl);
    alert("Room Light OBS link copied successfully!");
  };

  const openOverlay = () => {
    if (!overlayUrl) return;

    window.open(
      overlayUrl,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const previewStyle = getPreviewStyle(settings);

  return (
    <main className="min-h-screen bg-zinc-950 px-3 py-5 text-white sm:px-5 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <SectionHeader
            badge="Live Decorations"
            title="💡 Studio Room Light"
            description="Create studio lighting, RGB ambience and Aurora effects for your livestream without connecting to gifts."
          />

          <div className="flex flex-wrap gap-3">
            <Button
              href="/dashboard/live-decorations"
              variant="secondary"
            >
              ← Back
            </Button>

            <Button
              href="/dashboard/widgets"
              variant="secondary"
            >
              Widget Center
            </Button>
          </div>
        </div>

        {loading ? (
          <LoadingCard />
        ) : message &&
          !profile ? (
          <Card className="border-red-500/40 bg-red-500/10">
            <h2 className="text-xl font-black text-red-200">
              Unable to load Room Light
            </h2>

            <p className="mt-2 text-sm text-red-100/80">
              {message}
            </p>

            <Button
              onClick={() => window.location.reload()}
              className="mt-5"
            >
              Refresh
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
            <div className="space-y-6">
              <Card>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black">
                      Enable Room Light
                    </h2>

                    <p className="mt-1 text-sm text-zinc-400">
                      Turn the overlay lighting on or off.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      updateSetting(
                        "enabled",
                        !settings.enabled,
                      )
                    }
                    aria-pressed={settings.enabled}
                    className={`relative h-8 w-14 rounded-full transition ${
                      settings.enabled
                        ? "bg-pink-600"
                        : "bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
                        settings.enabled
                          ? "left-7"
                          : "left-1"
                      }`}
                    />
                  </button>
                </div>
              </Card>

              <Card>
                <h2 className="text-xl font-black">
                  Studio Presets
                </h2>

                <p className="mt-1 text-sm text-zinc-400">
                  เลือกบรรยากาศสำเร็จรูป แล้วปรับรายละเอียดต่อได้ทันที
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {LIGHT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset.settings)}
                      className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-left transition hover:border-pink-500/50 hover:bg-pink-500/5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{preset.icon}</div>
                        <div>
                          <div className="font-black">{preset.name}</div>
                          <div className="mt-1 text-xs leading-5 text-zinc-400">
                            {preset.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>

              <Card>
                <h2 className="text-xl font-black">
                  Studio Lighting Style
                </h2>

                <p className="mt-1 text-sm text-zinc-400">
                  เลือกรูปแบบการจัดไฟให้เหมาะกับห้องไลฟ์ของคุณ
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {EFFECT_OPTIONS.map((effect) => {
                    const selected =
                      settings.effect === effect.id;

                    return (
                      <button
                        key={effect.id}
                        type="button"
                        onClick={() =>
                          updateSetting("effect", effect.id)
                        }
                        className={`rounded-2xl border p-4 text-left transition ${
                          selected
                            ? "border-pink-500 bg-pink-500/15"
                            : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-3xl">
                            {effect.icon}
                          </div>

                          <div>
                            <div className="font-black">
                              {effect.name}
                            </div>

                            <div className="mt-1 text-xs leading-5 text-zinc-400">
                              {effect.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Card>
                <h2 className="text-xl font-black">
                  Light Colors
                </h2>

                <div className="mt-5 space-y-5">
                  <ColorControl
                    label="Primary Color"
                    value={settings.primaryColor}
                    onChange={(value) =>
                      updateSetting("primaryColor", value)
                    }
                  />

                  <ColorControl
                    label="Secondary Color"
                    value={settings.secondaryColor}
                    onChange={(value) =>
                      updateSetting("secondaryColor", value)
                    }
                  />
                </div>
              </Card>

              <Card>
                <h2 className="text-xl font-black">
                  Light Controls
                </h2>

                <div className="mt-5 space-y-6">
                  <RangeControl
                    label="Intensity"
                    value={settings.intensity}
                    min={10}
                    max={100}
                    suffix="%"
                    onChange={(value) =>
                      updateSetting("intensity", value)
                    }
                  />

                  <RangeControl
                    label="Blur"
                    value={settings.blur}
                    min={20}
                    max={180}
                    suffix=" px"
                    onChange={(value) =>
                      updateSetting("blur", value)
                    }
                  />

                  <RangeControl
                    label="Animation Speed"
                    value={settings.speed}
                    min={10}
                    max={100}
                    suffix="%"
                    onChange={(value) =>
                      updateSetting("speed", value)
                    }
                  />

                  <RangeControl
                    label="Opacity"
                    value={settings.opacity}
                    min={10}
                    max={100}
                    suffix="%"
                    onChange={(value) =>
                      updateSetting("opacity", value)
                    }
                  />
                </div>
              </Card>

              <Card>
                <div className="space-y-4">
                  <ToggleRow
                    label="Enable Animation"
                    description="Animate the lighting effect."
                    enabled={settings.animation}
                    onChange={(enabled) =>
                      updateSetting("animation", enabled)
                    }
                  />

                  <div className="border-t border-zinc-800" />

                  <ToggleRow
                    label="Smooth Transition"
                    description="Use softer transitions between movements."
                    enabled={settings.smooth}
                    onChange={(enabled) =>
                      updateSetting("smooth", enabled)
                    }
                  />
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="overflow-hidden">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-black">
                      Live Preview
                    </h2>

                    <p className="mt-1 text-sm text-zinc-400">
                      Preview the effect on a sample livestream
                      scene.
                    </p>
                  </div>

                  <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-black text-green-300">
                    1920 × 1080
                  </span>
                </div>

                <div
                  key={previewKey}
                  className="relative mt-5 aspect-video overflow-hidden rounded-3xl border border-zinc-700 bg-[#08080d]"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,#14141d_0%,#09090d_68%,#050507_100%)]" />

                  <div className="absolute inset-x-[7%] top-[7%] h-[68%] overflow-hidden rounded-t-[2rem] border border-white/10 bg-[#101018] shadow-2xl">
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:38px_38px]" />
                    <div className="absolute left-[7%] top-[12%] h-[58%] w-[8%] rounded-full bg-[var(--room-light-primary)] opacity-70 blur-md" />
                    <div className="absolute right-[7%] top-[12%] h-[58%] w-[8%] rounded-full bg-[var(--room-light-secondary)] opacity-70 blur-md" />
                    <div className="absolute left-1/2 top-[8%] h-[52%] w-[38%] -translate-x-1/2 rounded-[50%] bg-white/5 blur-3xl" />
                    <div className="absolute bottom-[12%] left-1/2 h-[46%] w-[26%] -translate-x-1/2 rounded-t-[48%] border border-white/10 bg-black/35 shadow-2xl">
                      <div className="absolute left-1/2 top-[10%] h-[27%] w-[35%] -translate-x-1/2 rounded-full bg-zinc-700/80" />
                      <div className="absolute bottom-0 left-1/2 h-[62%] w-[64%] -translate-x-1/2 rounded-t-[46%] bg-zinc-800/90" />
                    </div>
                    <div className="absolute bottom-[8%] left-[12%] h-2 w-[25%] rounded-full bg-[var(--room-light-primary)] opacity-70 blur-sm" />
                    <div className="absolute bottom-[8%] right-[12%] h-2 w-[25%] rounded-full bg-[var(--room-light-secondary)] opacity-70 blur-sm" />
                    <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-300 backdrop-blur">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                      Live Studio Preview
                    </div>
                  </div>

                  <div className="absolute inset-x-[5%] bottom-[7%] h-[25%] rounded-[50%] bg-black/70 blur-2xl" />
                  <div className="absolute bottom-[8%] left-1/2 h-[13%] w-[52%] -translate-x-1/2 rounded-t-[1.5rem] border border-white/10 bg-zinc-900/85 shadow-2xl">
                    <div className="absolute inset-x-[8%] top-3 h-1.5 rounded-full bg-gradient-to-r from-[var(--room-light-primary)] via-white/30 to-[var(--room-light-secondary)] opacity-80" />
                  </div>

                  {settings.enabled && settings.effect === "aurora" && (
                    <Aurora
                      primaryColor={settings.primaryColor}
                      secondaryColor={settings.secondaryColor}
                      accentColor="#38bdf8"
                      opacity={(settings.opacity / 100) * (settings.intensity / 100)}
                      blur={settings.blur}
                      speed={Math.max(4, 16 - (settings.speed / 100) * 11)}
                      intensity={Math.max(0.3, settings.intensity / 70)}
                      animated={settings.animation}
                      className="z-20"
                    />
                  )}

                  {settings.enabled && settings.effect !== "aurora" && (
                    <div
                      className={getEffectClassName(settings)}
                      style={previewStyle}
                    />
                  )}

                  <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5" />

                  <div className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-300 backdrop-blur">
                    OBS Preview
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
                  <Button
                    onClick={saveSettings}
                    disabled={saving}
                    variant="upgrade"
                    className="w-full sm:w-auto"
                  >
                    {saving
                      ? "Saving..."
                      : "💾 Save Settings"}
                  </Button>

                  <Button
                    onClick={resetSettings}
                    disabled={saving}
                    variant="secondary"
                    className="w-full sm:w-auto"
                  >
                    Reset
                  </Button>
                </div>

                {message && profile && (
                  <div className="mt-4 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm font-bold text-green-200">
                    {message}
                  </div>
                )}
              </Card>

              <Card>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-black">
                      OBS Browser Source
                    </h2>

                    <p className="mt-1 text-sm text-zinc-400">
                      Add this link as a Browser Source in OBS.
                    </p>
                  </div>

                  <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-black text-violet-200">
                    Decoration
                  </span>
                </div>

                <div className="mt-5 break-all rounded-2xl border border-zinc-800 bg-black p-4 text-sm text-zinc-300">
                  {overlayUrl || "Overlay URL unavailable"}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
                  <Button
                    onClick={copyOverlayUrl}
                    disabled={!overlayUrl}
                    variant="secondary"
                    className="w-full sm:w-auto"
                  >
                    Copy OBS Link
                  </Button>

                  <Button
                    onClick={openOverlay}
                    disabled={!overlayUrl}
                    variant="secondary"
                    className="w-full sm:w-auto"
                  >
                    Open Overlay
                  </Button>
                </div>
              </Card>

              <Card className="border-sky-500/20 bg-sky-500/5">
                <h2 className="text-lg font-black text-sky-200">
                  OBS Setup
                </h2>

                <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-300">
                  <p>
                    1. Add a new{" "}
                    <strong>Browser Source</strong> in OBS.
                  </p>

                  <p>
                    2. Set width to <strong>1920</strong> and
                    height to <strong>1080</strong>.
                  </p>

                  <p>
                    3. Paste the Room Light overlay URL and
                    keep the source above your camera layer.
                  </p>

                  <p>
                    4. Make sure the Browser Source background
                    remains transparent.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function settingsToRow(
  userId: string,
  settings: RoomLightSettings,
): DecorationSettingsRow & { updated_at: string } {
  return {
    user_id: userId,
    enabled: settings.enabled,
    effect: settings.effect,
    primary_color: settings.primaryColor,
    secondary_color: settings.secondaryColor,
    intensity: settings.intensity,
    blur: settings.blur,
    speed: settings.speed,
    opacity: settings.opacity,
    animation: settings.animation,
    smooth: settings.smooth,
    updated_at: new Date().toISOString(),
  };
}

function rowToSettings(
  row: DecorationSettingsRow,
): RoomLightSettings {
  const validEffects: LightEffect[] = [
    "studio-softbox",
    "rgb-studio",
    "streamer-room",
    "stage-light",
    "aurora",
  ];

  return {
    enabled: row.enabled,
    effect: validEffects.includes(row.effect)
      ? row.effect
      : DEFAULT_SETTINGS.effect,
    primaryColor:
      row.primary_color || DEFAULT_SETTINGS.primaryColor,
    secondaryColor:
      row.secondary_color || DEFAULT_SETTINGS.secondaryColor,
    intensity: row.intensity,
    blur: row.blur,
    speed: row.speed,
    opacity: row.opacity,
    animation: row.animation,
    smooth: row.smooth,
  };
}

function ColorControl({
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
      <div className="mb-2 text-sm font-bold text-zinc-300">
        {label}
      </div>

      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-16 cursor-pointer rounded-xl border border-zinc-700 bg-zinc-950 p-1"
        />

        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-black uppercase outline-none transition focus:border-pink-500"
        />
      </div>
    </label>
  );
}

function RangeControl({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <div className="mb-3 flex items-center justify-between gap-4">
        <span className="text-sm font-bold text-zinc-300">
          {label}
        </span>

        <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-black text-pink-200">
          {value}
          {suffix}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) =>
          onChange(Number(event.target.value))
        }
        className="w-full accent-pink-500"
      />
    </label>
  );
}

function ToggleRow({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="font-black">{label}</div>
        <div className="mt-1 text-xs text-zinc-400">
          {description}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange(!enabled)}
        aria-pressed={enabled}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          enabled ? "bg-pink-600" : "bg-zinc-700"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function getPreviewStyle(
  settings: RoomLightSettings,
): React.CSSProperties {
  const opacity =
    (settings.opacity / 100) *
    (settings.intensity / 100);

  const duration =
    8 - (settings.speed / 100) * 6;

  return {
    "--room-light-primary": settings.primaryColor,
    "--room-light-secondary": settings.secondaryColor,
    "--room-light-opacity": opacity,
    "--room-light-blur": `${settings.blur}px`,
    "--room-light-duration": `${Math.max(duration, 1.5)}s`,
  } as React.CSSProperties;
}

function getEffectClassName(
  settings: RoomLightSettings,
): string {
  const base =
    "pointer-events-none absolute inset-[-12%]";

  const transition = settings.smooth
    ? "transition-all duration-700"
    : "";

  const animation = settings.animation
    ? "animate-[roomLightPreview_var(--room-light-duration)_ease-in-out_infinite]"
    : "";

  if (settings.effect === "studio-softbox") {
    return `${base} ${transition} ${animation} bg-[radial-gradient(ellipse_at_18%_42%,var(--room-light-primary)_0%,transparent_38%),radial-gradient(ellipse_at_82%_42%,var(--room-light-secondary)_0%,transparent_38%),radial-gradient(ellipse_at_50%_18%,rgba(255,255,255,.45)_0%,transparent_32%)] opacity-[var(--room-light-opacity)] blur-[var(--room-light-blur)]`;
  }

  if (settings.effect === "rgb-studio") {
    return `${base} ${transition} ${animation} bg-[radial-gradient(circle_at_8%_50%,var(--room-light-primary)_0%,transparent_40%),radial-gradient(circle_at_92%_50%,var(--room-light-secondary)_0%,transparent_40%),linear-gradient(115deg,transparent_30%,rgba(255,255,255,.08)_50%,transparent_70%)] opacity-[var(--room-light-opacity)] blur-[var(--room-light-blur)]`;
  }

  if (settings.effect === "streamer-room") {
    return `${base} ${transition} ${animation} bg-[radial-gradient(circle_at_18%_25%,var(--room-light-primary)_0%,transparent_36%),radial-gradient(circle_at_82%_30%,var(--room-light-secondary)_0%,transparent_36%),radial-gradient(ellipse_at_50%_100%,var(--room-light-primary)_0%,transparent_42%)] opacity-[var(--room-light-opacity)] blur-[var(--room-light-blur)]`;
  }

  if (settings.effect === "aurora") {
    return "";
  }

  return `${base} ${transition} ${animation} bg-[conic-gradient(from_205deg_at_22%_0%,transparent_0deg,var(--room-light-primary)_18deg,transparent_42deg),conic-gradient(from_137deg_at_78%_0%,transparent_0deg,var(--room-light-secondary)_18deg,transparent_42deg),radial-gradient(ellipse_at_50%_100%,var(--room-light-primary)_0%,transparent_45%)] opacity-[var(--room-light-opacity)] blur-[var(--room-light-blur)]`;
}