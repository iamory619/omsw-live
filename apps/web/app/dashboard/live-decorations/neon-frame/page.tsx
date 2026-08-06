"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingCard } from "@/components/ui/LoadingCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { DEFAULT_NEON_FRAME_SETTINGS } from "./neon-frame-config";
import type {
  NeonFramePreset,
  NeonFrameSettings,
  NeonFrameSettingsRow,
} from "./types";
import { NeonFrameControls } from "./components/NeonFrameControls";
import { NeonFramePreview } from "./components/NeonFramePreview";
import { ObsQuickAccess } from "./components/ObsQuickAccess";

type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  overlay_id: string | null;
};

const STORAGE_KEY = "omsw-neon-frame-settings";

export default function NeonFrameSettingsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] =
    useState<Profile | null>(null);
  const [origin, setOrigin] = useState("");
  const [settings, setSettings] =
    useState<NeonFrameSettings>(
      DEFAULT_NEON_FRAME_SETTINGS,
    );
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

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          "id,email,display_name,overlay_id",
        )
        .eq("id", user.id)
        .single();

      if (profileError || !profileData) {
        setMessage(
          "Unable to load your profile.",
        );
        setLoading(false);
        return;
      }

      setProfile(profileData as Profile);

      const {
        data: settingsData,
        error: settingsError,
      } = await supabase
        .from("neon_frame_settings")
        .select(
          [
            "user_id",
            "enabled",
            "preset",
            "canvas_mode",
            "frame_style",
            "primary_color",
            "secondary_color",
            "thickness",
            "blur",
            "opacity",
            "speed",
            "border_radius",
            "animation",
            "smooth",
          ].join(","),
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (settingsError) {
        console.error(
          "Load Neon Frame settings error:",
          settingsError,
        );
        setMessage(
          "Unable to load saved Neon Frame settings.",
        );
        setLoading(false);
        return;
      }

      if (settingsData) {
        const databaseSettings =
          rowToSettings(
            settingsData as NeonFrameSettingsRow,
          );

        setSettings(databaseSettings);

        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(databaseSettings),
        );
      } else {
        const { error: createError } =
          await supabase
            .from("neon_frame_settings")
            .insert(
              settingsToRow(
                user.id,
                DEFAULT_NEON_FRAME_SETTINGS,
              ),
            );

        if (createError) {
          console.error(
            "Create Neon Frame settings error:",
            createError,
          );
          setMessage(
            "Unable to create Neon Frame settings.",
          );
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
      ? `${origin}/overlay/decorations/neon-frame/${profile.overlay_id}`
      : "";

  const updateSetting = <
    K extends keyof NeonFrameSettings,
  >(
    key: K,
    value: NeonFrameSettings[K],
  ) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
      ...(key !== "preset"
        ? {
            preset:
              "custom" as NeonFramePreset,
          }
        : {}),
    }));
  };

  const applyPreset = (
    preset: Exclude<
      NeonFramePreset,
      "custom"
    >,
    values: Partial<NeonFrameSettings>,
  ) => {
    setSettings((current) => ({
      ...current,
      ...values,
      preset,
      enabled: true,
    }));

    setMessage(
      "Preset applied. Press Save Settings to use it in OBS.",
    );
  };

  const saveSettings = async () => {
    if (!profile?.id) {
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const { error } = await supabase
        .from("neon_frame_settings")
        .update(
          settingsToRow(
            profile.id,
            settings,
          ),
        )
        .eq("user_id", profile.id);

      if (error) {
        throw error;
      }

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(settings),
      );

      setPreviewKey(
        (current) => current + 1,
      );

      setMessage(
        "✨ Neon Frame saved successfully.",
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(
        "Save Neon Frame settings error:",
        error,
      );
      setMessage(
        "Unable to save Neon Frame settings.",
      );
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = async () => {
    if (!profile?.id) {
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const resetValue = {
        ...DEFAULT_NEON_FRAME_SETTINGS,
      };

      const { error } = await supabase
        .from("neon_frame_settings")
        .update(
          settingsToRow(
            profile.id,
            resetValue,
          ),
        )
        .eq("user_id", profile.id);

      if (error) {
        throw error;
      }

      setSettings(resetValue);

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(resetValue),
      );

      setPreviewKey(
        (current) => current + 1,
      );

      setMessage(
        "✨ Neon Frame has been reset.",
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(
        "Reset Neon Frame settings error:",
        error,
      );
      setMessage(
        "Unable to reset Neon Frame settings.",
      );
    } finally {
      setSaving(false);
    }
  };

  const copyOverlayUrl = async () => {
    if (!overlayUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        overlayUrl,
      );
      setMessage("OBS link copied.");
    } catch (error) {
      console.error(
        "Copy Neon Frame overlay URL error:",
        error,
      );
      setMessage(
        "Unable to copy OBS link.",
      );
    }
  };

  const openOverlay = () => {
    if (!overlayUrl) {
      return;
    }

    window.open(
      overlayUrl,
      "_blank",
      "noopener,noreferrer",
    );
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
            Unable to load Neon Frame
          </h2>

          <p className="mt-2 text-sm text-red-100/80">
            {message}
          </p>

          <Button
            onClick={() =>
              window.location.reload()
            }
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
            title="✨ Neon Frame"
            description="Create a glowing neon border for your TikTok Live, OBS scene or streaming layout."
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

        <ObsQuickAccess
          overlayUrl={overlayUrl}
          settings={settings}
          onCopy={copyOverlayUrl}
          onOpen={openOverlay}
        />

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <NeonFrameControls
            settings={settings}
            onChange={updateSetting}
            onApplyPreset={applyPreset}
          />

          <NeonFramePreview
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
  settings: NeonFrameSettings,
): NeonFrameSettingsRow & {
  updated_at: string;
} {
  return {
    user_id: userId,
    enabled: settings.enabled,
    preset: settings.preset,
    canvas_mode: settings.canvasMode,
    frame_style: settings.frameStyle,
    primary_color:
      settings.primaryColor,
    secondary_color:
      settings.secondaryColor,
    thickness: settings.thickness,
    blur: settings.blur,
    opacity: settings.opacity,
    speed: settings.speed,
    border_radius:
      settings.borderRadius,
    animation: settings.animation,
    smooth: settings.smooth,
    updated_at: new Date().toISOString(),
  };
}

function rowToSettings(
  row: NeonFrameSettingsRow,
): NeonFrameSettings {
  const validPresets: NeonFramePreset[] = [
    "custom",
    "tiktok-pink",
    "cyber-purple",
    "ice-blue",
    "sunset",
    "gaming-rgb",
  ];

  const validStyles: NeonFrameSettings["frameStyle"][] =
    [
      "soft-neon",
      "double-line",
      "corner-glow",
      "gaming-rgb",
      "rounded-frame",
    ];

  return {
    enabled:
      row.enabled ??
      DEFAULT_NEON_FRAME_SETTINGS.enabled,

    preset: validPresets.includes(
      row.preset as NeonFramePreset,
    )
      ? (row.preset as NeonFramePreset)
      : DEFAULT_NEON_FRAME_SETTINGS.preset,

    canvasMode:
      row.canvas_mode === "landscape"
        ? "landscape"
        : "portrait",

    frameStyle: validStyles.includes(
      row.frame_style as NeonFrameSettings["frameStyle"],
    )
      ? (row.frame_style as NeonFrameSettings["frameStyle"])
      : DEFAULT_NEON_FRAME_SETTINGS.frameStyle,

    primaryColor:
      row.primary_color ||
      DEFAULT_NEON_FRAME_SETTINGS.primaryColor,

    secondaryColor:
      row.secondary_color ||
      DEFAULT_NEON_FRAME_SETTINGS.secondaryColor,

    thickness: clampNumber(
      row.thickness,
      1,
      40,
      DEFAULT_NEON_FRAME_SETTINGS.thickness,
    ),

    blur: clampNumber(
      row.blur,
      0,
      120,
      DEFAULT_NEON_FRAME_SETTINGS.blur,
    ),

    opacity: clampNumber(
      row.opacity,
      10,
      100,
      DEFAULT_NEON_FRAME_SETTINGS.opacity,
    ),

    speed: clampNumber(
      row.speed,
      10,
      100,
      DEFAULT_NEON_FRAME_SETTINGS.speed,
    ),

    borderRadius: clampNumber(
      row.border_radius,
      0,
      120,
      DEFAULT_NEON_FRAME_SETTINGS.borderRadius,
    ),

    animation:
      row.animation ??
      DEFAULT_NEON_FRAME_SETTINGS.animation,

    smooth:
      row.smooth ??
      DEFAULT_NEON_FRAME_SETTINGS.smooth,
  };
}

function clampNumber(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return fallback;
  }

  return Math.min(
    Math.max(value, minimum),
    maximum,
  );
}