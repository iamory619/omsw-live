"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "next/navigation";
import { FloatingParticles } from "@/components/decorations/FloatingParticles/FloatingParticles";
import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_FLOATING_PARTICLES_SETTINGS,
} from "@/app/dashboard/live-decorations/floating-particles/particle-config";
import type {
  FloatingParticlesPreset,
  FloatingParticlesSettings,
  FloatingParticlesSettingsRow,
  ParticleDirection,
  ParticleType,
} from "@/app/dashboard/live-decorations/floating-particles/types";

const REFRESH_INTERVAL_MS = 5000;

export default function FloatingParticlesOverlayPage() {
  const params =
    useParams<{ overlayId: string }>();

  const overlayId = params?.overlayId;

  const supabase = useMemo(
    () => createClient(),
    [],
  );

  const [settings, setSettings] =
    useState<FloatingParticlesSettings>(
      DEFAULT_FLOATING_PARTICLES_SETTINGS,
    );

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    if (!overlayId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadSettings = async () => {
      const { data, error } =
        await supabase.rpc(
          "get_floating_particles_settings_by_overlay",
          {
            p_overlay_id: overlayId,
          },
        );

      if (error) {
        console.error(
          "Floating Particles overlay RPC error:",
          error,
        );

        if (!cancelled) {
          setLoading(false);
        }

        return;
      }

      const row = Array.isArray(data)
        ? data[0]
        : data;

      if (!cancelled) {
        setSettings(
          row
            ? rowToSettings(
                row as FloatingParticlesSettingsRow,
              )
            : DEFAULT_FLOATING_PARTICLES_SETTINGS,
        );

        setLoading(false);
      }
    };

    void loadSettings();

    const intervalId =
      window.setInterval(() => {
        void loadSettings();
      }, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [overlayId, supabase]);

  if (
    loading ||
    !overlayId ||
    !settings.enabled
  ) {
    return null;
  }

  return (
    <main
      data-overlay-id={overlayId}
      data-canvas-mode={
        settings.canvasMode
      }
      data-particle-type={
        settings.particleType
      }
      className="fixed inset-0 overflow-hidden bg-transparent"
    >
      <FloatingParticles
        settings={settings}
      />
    </main>
  );
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

  const minSize = clampNumber(
    row.min_size,
    4,
    120,
    DEFAULT_FLOATING_PARTICLES_SETTINGS.minSize,
  );

  const maxSize = Math.max(
    minSize,
    clampNumber(
      row.max_size,
      4,
      160,
      DEFAULT_FLOATING_PARTICLES_SETTINGS.maxSize,
    ),
  );

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

    minSize,

    maxSize,

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
    typeof value !== "number" ||
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