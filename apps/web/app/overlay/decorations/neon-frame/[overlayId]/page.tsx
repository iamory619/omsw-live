"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "next/navigation";
import { NeonFrame } from "@/components/decorations/NeonFrame/NeonFrame";
import { createClient } from "@/lib/supabase/client";
import type {
  NeonFramePreset,
  NeonFrameSettings,
  NeonFrameSettingsRow,
} from "@/app/dashboard/live-decorations/neon-frame/types";
import {
  DEFAULT_NEON_FRAME_SETTINGS,
} from "@/app/dashboard/live-decorations/neon-frame/neon-frame-config";

const REFRESH_INTERVAL_MS = 5000;

export default function NeonFrameOverlayPage() {
  const params =
    useParams<{ overlayId: string }>();

  const overlayId = params?.overlayId;

  const supabase = useMemo(
    () => createClient(),
    [],
  );

  const [settings, setSettings] =
    useState<NeonFrameSettings>(
      DEFAULT_NEON_FRAME_SETTINGS,
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
          "get_neon_frame_settings_by_overlay",
          {
            p_overlay_id: overlayId,
          },
        );

      if (error) {
        console.error(
          "Neon Frame overlay RPC error:",
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
                row as NeonFrameSettingsRow,
              )
            : DEFAULT_NEON_FRAME_SETTINGS,
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
      data-frame-style={
        settings.frameStyle
      }
      className="fixed inset-0 overflow-hidden bg-transparent"
    >
      <NeonFrame settings={settings} />
    </main>
  );
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