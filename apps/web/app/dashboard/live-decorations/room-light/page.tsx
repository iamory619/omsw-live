"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingCard } from "@/components/ui/LoadingCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { DEFAULT_SETTINGS, STORAGE_KEY } from "./room-light-config";
import type {
  DecorationSettingsRow,
  LightLayer,
  LightPlacement,
  PresetId,
  Profile,
  RoomLightSettings,
  SettingsSectionId,
} from "./types";
import { ObsQuickAccess } from "./components/ObsQuickAccess";
import { RoomLightPreview } from "./components/RoomLightPreview";
import { SettingsAccordion } from "./components/SettingsAccordion";

export default function RoomLightSettingsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [origin, setOrigin] = useState("");
  const [settings, setSettings] =
    useState<RoomLightSettings>(DEFAULT_SETTINGS);
  const [openSection, setOpenSection] =
    useState<SettingsSectionId>("presets");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    setOrigin(window.location.origin);

    const load = async () => {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select("id,email,display_name,overlay_id")
          .eq("id", user.id)
          .single();

      if (profileError || !profileData) {
        setMessage("Unable to load your profile.");
        setLoading(false);
        return;
      }

      setProfile(profileData as Profile);

      const { data: settingsData, error: settingsError } =
        await supabase
          .from("decoration_settings")
          .select(
            "user_id,enabled,preset,canvas_mode,placement,multi_light_enabled,lights,effect,primary_color,secondary_color,intensity,blur,speed,opacity,animation,smooth",
          )
          .eq("user_id", user.id)
          .maybeSingle();

      if (settingsError) {
        setMessage("Unable to load saved Room Light settings.");
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
          .insert(settingsToRow(user.id, DEFAULT_SETTINGS));

        if (createError) {
          setMessage("Unable to create Room Light settings.");
        }
      }

      setLoading(false);
    };

    void load();
  }, [router, supabase]);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setMessage("");
    }, 3000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [message]);

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
      ...(key !== "enabled" &&
      key !== "effect" &&
      key !== "preset" &&
      key !== "canvasMode" &&
      key !== "placement" &&
      key !== "multiLightEnabled" &&
      key !== "lights"
        ? { preset: "custom" as PresetId }
        : {}),
    }));
  };

  const updateLight = (
    lightId: LightLayer["id"],
    patch: Partial<LightLayer>,
  ) => {
    setSettings((current) => ({
      ...current,
      multiLightEnabled: true,
      preset: "custom",
      lights: current.lights.map((light) =>
        light.id === lightId
          ? { ...light, ...patch }
          : light,
      ),
    }));
  };

  const applyPreset = (
    presetId: Exclude<PresetId, "custom">,
    presetSettings: Partial<RoomLightSettings>,
  ) => {
    const {
      effect: _effect,
      preset: _preset,
      ...visualSettings
    } = presetSettings;

    setSettings((current) => ({
      ...current,
      ...visualSettings,
      preset: presetId,
      enabled: true,
    }));

    setMessage("Preset applied. Press Save Settings to use it in OBS.");
  };

  const saveSettings = async () => {
    if (!profile?.id) return;

    try {
      setSaving(true);
      setMessage("");

      const { error } = await supabase
        .from("decoration_settings")
        .update(settingsToRow(profile.id, settings))
        .eq("user_id", profile.id);

      if (error) throw error;

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(settings),
      );

      setPreviewKey((current) => current + 1);
      setMessage("✨ Lighting saved successfully.");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error("Save Room Light settings error:", error);
      setMessage("Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = async () => {
    if (!profile?.id) return;

    try {
      setSaving(true);
      setMessage("");

      const { error } = await supabase
        .from("decoration_settings")
        .update(settingsToRow(profile.id, DEFAULT_SETTINGS))
        .eq("user_id", profile.id);

      if (error) throw error;

      setSettings({
        ...DEFAULT_SETTINGS,
      });

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(DEFAULT_SETTINGS),
      );

      setPreviewKey((current) => current + 1);
      setOpenSection("presets");
      setMessage("✨ Room Light has been reset.");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error("Reset Room Light settings error:", error);
      setMessage("Unable to reset settings.");
    } finally {
      setSaving(false);
    }
  };

  const copyOverlayUrl = async () => {
    if (!overlayUrl) return;
    await navigator.clipboard.writeText(overlayUrl);
    setMessage("OBS link copied.");
  };

  const openOverlay = () => {
    if (!overlayUrl) return;
    window.open(overlayUrl, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 p-6 text-white">
        <LoadingCard />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-zinc-950 p-6 text-white">
        <Card className="border-red-500/40 bg-red-500/10">
          <h2 className="text-xl font-black text-red-200">
            Unable to load Room Light
          </h2>
          <p className="mt-2 text-sm text-red-100/80">{message}</p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-5"
          >
            Refresh
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-3 py-5 text-white sm:px-5 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <SectionHeader
            badge="Live Decorations"
            title="💡 Studio Room Light"
            description="Create studio lighting, RGB ambience and Aurora effects for your livestream."
          />

          <div className="flex flex-wrap gap-3">
            <Button
              href="/dashboard/live-decorations"
              variant="secondary"
            >
              ← Back
            </Button>

            <Button href="/dashboard/widgets" variant="secondary">
              Widget Center
            </Button>
          </div>
        </div>

        <ObsQuickAccess
          overlayUrl={overlayUrl}
          settings={settings}
          onCopy={copyOverlayUrl}
          onOpen={openOverlay}
        />

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <SettingsAccordion
            settings={settings}
            openSection={openSection}
            onOpenSection={setOpenSection}
            onUpdateSetting={updateSetting}
            onUpdateLight={updateLight}
            onApplyPreset={applyPreset}
          />

          <RoomLightPreview
            settings={settings}
            saving={saving}
            message={message}
            previewKey={previewKey}
            onSave={saveSettings}
            onReset={resetSettings}
          />
        </div>
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
    preset: settings.preset,
    canvas_mode: settings.canvasMode,
    placement: settings.placement,
    multi_light_enabled: settings.multiLightEnabled,
    lights: settings.lights,
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
  const validEffects = [
    "studio-softbox",
    "rgb-studio",
    "streamer-room",
    "stage-light",
    "aurora",
  ] as const;

  const validPresets: PresetId[] = [
    "custom",
    "tiktok-pink",
    "gaming-neon",
    "warm-studio",
    "cool-blue",
    "concert-stage",
    "aurora-blue",
    "aurora-purple",
  ];

  const validPlacements: LightPlacement[] = [
    "left",
    "right",
    "top",
    "bottom",
    "center",
  ];

  return {
    enabled: row.enabled ?? DEFAULT_SETTINGS.enabled,
    preset: validPresets.includes(row.preset as PresetId)
      ? (row.preset as PresetId)
      : DEFAULT_SETTINGS.preset,
    canvasMode:
      row.canvas_mode === "landscape"
        ? "landscape"
        : "portrait",
    placement: validPlacements.includes(
      row.placement as LightPlacement,
    )
      ? (row.placement as LightPlacement)
      : DEFAULT_SETTINGS.placement,
    multiLightEnabled:
      row.multi_light_enabled ??
      DEFAULT_SETTINGS.multiLightEnabled,
    lights: parseLightLayers(row.lights),
    effect: validEffects.includes(row.effect as never)
      ? (row.effect as RoomLightSettings["effect"])
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

function parseLightLayers(value: unknown): LightLayer[] {
  if (!Array.isArray(value)) {
    return DEFAULT_SETTINGS.lights;
  }

  const validPlacements: LightPlacement[] = [
    "left",
    "right",
    "top",
    "bottom",
    "center",
  ];

  return DEFAULT_SETTINGS.lights.map((fallback, index) => {
    const candidate = value[index];

    if (!candidate || typeof candidate !== "object") {
      return fallback;
    }

    const row = candidate as Partial<LightLayer>;

    return {
      id: fallback.id,
      enabled:
        typeof row.enabled === "boolean"
          ? row.enabled
          : fallback.enabled,
      color:
        typeof row.color === "string"
          ? row.color
          : fallback.color,
      placement: validPlacements.includes(
        row.placement as LightPlacement,
      )
        ? (row.placement as LightPlacement)
        : fallback.placement,
      intensity: clampNumber(
        row.intensity,
        10,
        100,
        fallback.intensity,
      ),
      blur: clampNumber(
        row.blur,
        20,
        180,
        fallback.blur,
      ),
      size: clampNumber(
        row.size,
        30,
        140,
        fallback.size,
      ),
    };
  });
}

function clampNumber(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(Math.max(value, minimum), maximum);
}