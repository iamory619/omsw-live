"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingCard } from "@/components/ui/LoadingCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  DEFAULT_FLOATING_PARTICLES_SETTINGS,
  FLOATING_PARTICLES_STORAGE_KEY,
} from "./particle-config";
import type {
  FloatingParticlesPreset,
  FloatingParticlesSettings,
  FloatingParticlesSettingsRow,
  ParticleDirection,
  ParticleType,
} from "./types";
import { FloatingParticlesControls } from "./components/FloatingParticlesControls";
import { FloatingParticlesPreview } from "./components/FloatingParticlesPreview";
import { ObsQuickAccess } from "./components/ObsQuickAccess";

type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  overlay_id: string | null;
};

export default function FloatingParticlesSettingsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [origin, setOrigin] =
    useState("");

  const [settings, setSettings] =
    useState<FloatingParticlesSettings>(
      DEFAULT_FLOATING_PARTICLES_SETTINGS,
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [previewKey, setPreviewKey] =
    useState(0);

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

      if (
        profileError ||
        !profileData
      ) {
        setMessage(
          "Unable to load your profile.",
        );

        setLoading(false);
        return;
      }

      setProfile(
        profileData as Profile,
      );

      const {
        data: settingsData,
        error: settingsError,
      } = await supabase
        .from(
          "floating_particles_settings",
        )
        .select(
          [
            "user_id",
            "enabled",
            "preset",
            "canvas_mode",
            "particle_type",
            "primary_color",
            "secondary_color",
            "particle_count",
            "min_size",
            "max_size",
            "speed",
            "opacity",
            "direction",
            "glow",
            "random_rotation",
            "animation",
            "smooth",
          ].join(","),
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (settingsError) {
        console.error(
          "Load Floating Particles settings error:",
          settingsError,
        );

        setMessage(
          "Unable to load saved Floating Particles settings.",
        );

        setLoading(false);
        return;
      }

      if (settingsData) {
        const databaseSettings =
          rowToSettings(
            settingsData as FloatingParticlesSettingsRow,
          );

        setSettings(databaseSettings);

        window.localStorage.setItem(
          FLOATING_PARTICLES_STORAGE_KEY,
          JSON.stringify(
            databaseSettings,
          ),
        );
      } else {
        const { error: createError } =
          await supabase
            .from(
              "floating_particles_settings",
            )
            .insert(
              settingsToRow(
                user.id,
                DEFAULT_FLOATING_PARTICLES_SETTINGS,
              ),
            );

        if (createError) {
          console.error(
            "Create Floating Particles settings error:",
            createError,
          );

          setMessage(
            "Unable to create Floating Particles settings.",
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

    const timerId =
      window.setTimeout(() => {
        setMessage("");
      }, 3000);

    return () => {
      window.clearTimeout(
        timerId,
      );
    };
  }, [message]);

  const overlayUrl =
    origin && profile?.overlay_id
      ? `${origin}/overlay/decorations/floating-particles/${profile.overlay_id}`
      : "";

  const updateSetting = <
    K extends keyof FloatingParticlesSettings,
  >(
    key: K,
    value: FloatingParticlesSettings[K],
  ) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
      ...(key !== "preset"
        ? {
            preset:
              "custom" as FloatingParticlesPreset,
          }
        : {}),
    }));
  };

  const applyPreset = (
    preset: Exclude<
      FloatingParticlesPreset,
      "custom"
    >,
    values: Partial<FloatingParticlesSettings>,
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

      const { error } =
        await supabase
          .from(
            "floating_particles_settings",
          )
          .update(
            settingsToRow(
              profile.id,
              settings,
            ),
          )
          .eq(
            "user_id",
            profile.id,
          );

      if (error) {
        throw error;
      }

      window.localStorage.setItem(
        FLOATING_PARTICLES_STORAGE_KEY,
        JSON.stringify(settings),
      );

      setPreviewKey(
        (current) =>
          current + 1,
      );

      setMessage(
        "✨ Floating Particles saved successfully.",
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(
        "Save Floating Particles settings error:",
        error,
      );

      setMessage(
        "Unable to save Floating Particles settings.",
      );
    } finally {
      setSaving(false);
    }
  };

  const resetSettings =
    async () => {
      if (!profile?.id) {
        return;
      }

      try {
        setSaving(true);
        setMessage("");

        const resetValue = {
          ...DEFAULT_FLOATING_PARTICLES_SETTINGS,
        };

        const { error } =
          await supabase
            .from(
              "floating_particles_settings",
            )
            .update(
              settingsToRow(
                profile.id,
                resetValue,
              ),
            )
            .eq(
              "user_id",
              profile.id,
            );

        if (error) {
          throw error;
        }

        setSettings(
          resetValue,
        );

        window.localStorage.setItem(
          FLOATING_PARTICLES_STORAGE_KEY,
          JSON.stringify(
            resetValue,
          ),
        );

        setPreviewKey(
          (current) =>
            current + 1,
        );

        setMessage(
          "✨ Floating Particles has been reset.",
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } catch (error) {
        console.error(
          "Reset Floating Particles settings error:",
          error,
        );

        setMessage(
          "Unable to reset Floating Particles settings.",
        );
      } finally {
        setSaving(false);
      }
    };

  const copyOverlayUrl =
    async () => {
      if (!overlayUrl) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          overlayUrl,
        );

        setMessage(
          "OBS link copied.",
        );
      } catch (error) {
        console.error(
          "Copy Floating Particles overlay URL error:",
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
            Unable to load Floating Particles
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
            title="✨ Floating Particles"
            description="Add stars, hearts, sparkles, snow, sakura and more to your livestream."
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
          <FloatingParticlesControls
            settings={settings}
            onChange={updateSetting}
            onApplyPreset={applyPreset}
          />

          <FloatingParticlesPreview
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
  settings: FloatingParticlesSettings,
): FloatingParticlesSettingsRow & {
  updated_at: string;
} {
  return {
    user_id: userId,
    enabled: settings.enabled,
    preset: settings.preset,
    canvas_mode:
      settings.canvasMode,
    particle_type:
      settings.particleType,
    primary_color:
      settings.primaryColor,
    secondary_color:
      settings.secondaryColor,
    particle_count:
      settings.particleCount,
    min_size: settings.minSize,
    max_size: settings.maxSize,
    speed: settings.speed,
    opacity: settings.opacity,
    direction:
      settings.direction,
    glow: settings.glow,
    random_rotation:
      settings.randomRotation,
    animation:
      settings.animation,
    smooth: settings.smooth,
    updated_at:
      new Date().toISOString(),
  };
}

function rowToSettings(
  row: FloatingParticlesSettingsRow,
): FloatingParticlesSettings {
  const validPresets:
    FloatingParticlesPreset[] = [
      "custom",
      "pink-hearts",
      "gold-stars",
      "magic-sparkles",
      "winter-snow",
      "sakura-dream",
      "gaming-confetti",
    ];

  const validParticleTypes:
    ParticleType[] = [
      "stars",
      "hearts",
      "sparkles",
      "snow",
      "sakura",
      "leaves",
      "confetti",
      "coins",
      "bubbles",
    ];

  const validDirections:
    ParticleDirection[] = [
      "down",
      "up",
      "left",
      "right",
      "float",
    ];

  return {
    enabled:
      row.enabled ??
      DEFAULT_FLOATING_PARTICLES_SETTINGS.enabled,

    preset:
      validPresets.includes(
        row.preset as FloatingParticlesPreset,
      )
        ? (row.preset as FloatingParticlesPreset)
        : DEFAULT_FLOATING_PARTICLES_SETTINGS.preset,

    canvasMode:
      row.canvas_mode ===
      "landscape"
        ? "landscape"
        : "portrait",

    particleType:
      validParticleTypes.includes(
        row.particle_type as ParticleType,
      )
        ? (row.particle_type as ParticleType)
        : DEFAULT_FLOATING_PARTICLES_SETTINGS.particleType,

    primaryColor:
      row.primary_color ||
      DEFAULT_FLOATING_PARTICLES_SETTINGS.primaryColor,

    secondaryColor:
      row.secondary_color ||
      DEFAULT_FLOATING_PARTICLES_SETTINGS.secondaryColor,

    particleCount:
      clampNumber(
        row.particle_count,
        1,
        120,
        DEFAULT_FLOATING_PARTICLES_SETTINGS.particleCount,
      ),

    minSize:
      clampNumber(
        row.min_size,
        4,
        120,
        DEFAULT_FLOATING_PARTICLES_SETTINGS.minSize,
      ),

    maxSize:
      clampNumber(
        row.max_size,
        4,
        160,
        DEFAULT_FLOATING_PARTICLES_SETTINGS.maxSize,
      ),

    speed:
      clampNumber(
        row.speed,
        10,
        100,
        DEFAULT_FLOATING_PARTICLES_SETTINGS.speed,
      ),

    opacity:
      clampNumber(
        row.opacity,
        10,
        100,
        DEFAULT_FLOATING_PARTICLES_SETTINGS.opacity,
      ),

    direction:
      validDirections.includes(
        row.direction as ParticleDirection,
      )
        ? (row.direction as ParticleDirection)
        : DEFAULT_FLOATING_PARTICLES_SETTINGS.direction,

    glow:
      row.glow ??
      DEFAULT_FLOATING_PARTICLES_SETTINGS.glow,

    randomRotation:
      row.random_rotation ??
      DEFAULT_FLOATING_PARTICLES_SETTINGS.randomRotation,

    animation:
      row.animation ??
      DEFAULT_FLOATING_PARTICLES_SETTINGS.animation,

    smooth:
      row.smooth ??
      DEFAULT_FLOATING_PARTICLES_SETTINGS.smooth,
  };
}

function clampNumber(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number,
): number {
  if (
    typeof value !==
      "number" ||
    !Number.isFinite(value)
  ) {
    return fallback;
  }

  return Math.min(
    Math.max(
      value,
      minimum,
    ),
    maximum,
  );
}