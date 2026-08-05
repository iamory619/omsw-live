"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GlowLight } from "@/components/decorations";

type LightEffect =
  | "studio-softbox"
  | "rgb-studio"
  | "streamer-room"
  | "stage-light"
  | "aurora";

type CanvasMode = "landscape" | "portrait";

type LightPlacement =
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "center";

type LightLayer = {
  id: "light-1" | "light-2" | "light-3";
  enabled: boolean;
  color: string;
  placement: LightPlacement;
  intensity: number;
  blur: number;
  size: number;
};

type RoomLightSettings = {
  enabled: boolean;
  canvasMode: CanvasMode;
  placement: LightPlacement;
  multiLightEnabled: boolean;
  lights: LightLayer[];
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
  enabled: boolean;
  canvas_mode: string | null;
  placement: string | null;
  multi_light_enabled: boolean | null;
  lights: unknown;
  effect: string;
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
  canvasMode: "portrait",
  placement: "center",
  multiLightEnabled: false,
  lights: [
    {
      id: "light-1",
      enabled: true,
      color: "#ff2d95",
      placement: "left",
      intensity: 72,
      blur: 100,
      size: 76,
    },
    {
      id: "light-2",
      enabled: true,
      color: "#38bdf8",
      placement: "right",
      intensity: 72,
      blur: 100,
      size: 76,
    },
    {
      id: "light-3",
      enabled: false,
      color: "#a855f7",
      placement: "top",
      intensity: 60,
      blur: 110,
      size: 64,
    },
  ],
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

const VALID_EFFECTS: LightEffect[] = [
  "studio-softbox",
  "rgb-studio",
  "streamer-room",
  "stage-light",
  "aurora",
];

const REFRESH_INTERVAL_MS = 5000;

export default function DecorationOverlayPage() {
  const params = useParams<{ overlayId: string }>();
  const overlayId = params?.overlayId;
  const supabase = useMemo(() => createClient(), []);

  const [settings, setSettings] =
    useState<RoomLightSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!overlayId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadSettings = async () => {
      const { data, error } = await supabase.rpc(
        "get_decoration_settings_by_overlay",
        {
          p_overlay_id: overlayId,
        },
      );

      if (error) {
        console.error("Decoration overlay RPC error:", error);

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
            ? rowToSettings(row as DecorationSettingsRow)
            : DEFAULT_SETTINGS,
        );
        setLoading(false);
      }
    };

    void loadSettings();

    const intervalId = window.setInterval(() => {
      void loadSettings();
    }, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [overlayId, supabase]);

  if (loading || !overlayId || !settings.enabled) {
    return null;
  }

  const opacity = getOpacity(settings);
  const duration = getDuration(settings);

  return (
    <main
      data-overlay-id={overlayId}
      data-canvas-mode={settings.canvasMode}
      data-placement={settings.placement}
      className="fixed inset-0 overflow-hidden bg-transparent"
    >
      <div className="pointer-events-none absolute inset-0">
        {settings.multiLightEnabled ? (
          <MultipleLightsOverlay
            settings={settings}
            duration={duration}
          />
        ) : (
          <FreeLightBlob
            settings={settings}
            opacity={opacity}
            duration={duration}
          />
        )}
      </div>
    </main>
  );
}


function MultipleLightsOverlay({
  settings,
  duration,
}: {
  settings: RoomLightSettings;
  duration: number;
}) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {settings.lights
        .filter((light) => light.enabled)
        .map((light, index) => {
          const position = getLightPosition(
            settings.canvasMode,
            light.placement,
          );

          const opacity = clamp(
            light.intensity / 100,
            0,
            1,
          );

          return (
            <div
              key={light.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: position.left,
                top: position.top,
                width: `${light.size}%`,
                height: `${light.size}%`,
                background: `radial-gradient(
                  circle,
                  ${hexToRgba(light.color, opacity)} 0%,
                  ${hexToRgba(
                    light.color,
                    opacity * 0.46,
                  )} 38%,
                  transparent 74%
                )`,
                filter: `blur(${light.blur}px)`,
                mixBlendMode: "screen",
                animation: settings.animation
                  ? `roomLightOverlay ${
                      duration + index * 0.35
                    }s ease-in-out infinite ${
                      index % 2 === 1 ? "reverse" : ""
                    }`
                  : undefined,
                transition: settings.smooth
                  ? "filter 700ms ease, opacity 700ms ease, transform 700ms ease"
                  : undefined,
              }}
            />
          );
        })}
    </div>
  );
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

    if (
      !candidate ||
      typeof candidate !== "object"
    ) {
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

function getLightPosition(
  canvasMode: CanvasMode,
  placement: LightPlacement,
): { left: string; top: string } {
  const portrait = canvasMode === "portrait";

  if (placement === "left") {
    return {
      left: portrait ? "18%" : "14%",
      top: "50%",
    };
  }

  if (placement === "right") {
    return {
      left: portrait ? "82%" : "86%",
      top: "50%",
    };
  }

  if (placement === "top") {
    return {
      left: "50%",
      top: portrait ? "16%" : "12%",
    };
  }

  if (placement === "bottom") {
    return {
      left: "50%",
      top: portrait ? "84%" : "88%",
    };
  }

  return { left: "50%", top: "50%" };
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

function FreeLightBlob({
  settings,
  opacity,
  duration,
}: {
  settings: RoomLightSettings;
  opacity: number;
  duration: number;
}) {
  const animation = settings.animation
    ? `roomLightOverlay ${duration}s ease-in-out infinite`
    : undefined;

  const transition = settings.smooth
    ? "filter 700ms ease, opacity 700ms ease, transform 700ms ease"
    : undefined;

  if (settings.effect === "aurora") {
    return (
      <div className="pointer-events-none absolute inset-0">
        <div
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[50%] ${getCanvasBlobClass(settings.canvasMode, "aurora-main")}`}
          style={{
            background: `
              radial-gradient(
                ellipse at 30% 50%,
                ${hexToRgba(settings.primaryColor, opacity * 0.95)} 0%,
                ${hexToRgba(settings.primaryColor, opacity * 0.45)} 32%,
                transparent 70%
              ),
              radial-gradient(
                ellipse at 70% 48%,
                ${hexToRgba(settings.secondaryColor, opacity * 0.9)} 0%,
                ${hexToRgba(settings.secondaryColor, opacity * 0.4)} 34%,
                transparent 72%
              )
            `,
            filter: `blur(${settings.blur}px) saturate(1.25)`,
            opacity,
            animation,
            transition,
            mixBlendMode: "screen",
          }}
        />

        <div
          className={`absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] ${getCanvasBlobClass(settings.canvasMode, "aurora-wave")}`}
          style={{
            background: `linear-gradient(
              90deg,
              transparent 0%,
              ${hexToRgba(settings.primaryColor, opacity * 0.55)} 25%,
              ${hexToRgba(settings.secondaryColor, opacity * 0.5)} 70%,
              transparent 100%
            )`,
            filter: `blur(${Math.max(24, settings.blur * 0.7)}px)`,
            opacity: opacity * 0.85,
            animation: settings.animation
              ? `roomLightPreview ${duration * 1.15}s ease-in-out infinite`
              : undefined,
            transition,
            mixBlendMode: "screen",
          }}
        />
      </div>
    );
  }

  return (
    <GlowLight
      effect={settings.effect}
      canvasMode={settings.canvasMode}
      placement={settings.placement}
      primaryColor={settings.primaryColor}
      secondaryColor={settings.secondaryColor}
      intensity={settings.intensity}
      blur={settings.blur}
      opacity={settings.opacity}
      speed={settings.speed}
      animation={settings.animation}
      smooth={settings.smooth}
    />
  );
}

function rowToSettings(
  row: DecorationSettingsRow,
): RoomLightSettings {
  const effect = VALID_EFFECTS.includes(row.effect as LightEffect)
    ? (row.effect as LightEffect)
    : DEFAULT_SETTINGS.effect;

  const canvasMode: CanvasMode =
    row.canvas_mode === "landscape"
      ? "landscape"
      : "portrait";

  const validPlacements: LightPlacement[] = [
    "left",
    "right",
    "top",
    "bottom",
    "center",
  ];

  const placement: LightPlacement =
    validPlacements.includes(
      row.placement as LightPlacement,
    )
      ? (row.placement as LightPlacement)
      : DEFAULT_SETTINGS.placement;

  const lights = parseLightLayers(row.lights);

  return {
    enabled: row.enabled ?? DEFAULT_SETTINGS.enabled,
    canvasMode,
    placement,
    multiLightEnabled:
      row.multi_light_enabled ??
      DEFAULT_SETTINGS.multiLightEnabled,
    lights,
    effect,
    primaryColor:
      row.primary_color || DEFAULT_SETTINGS.primaryColor,
    secondaryColor:
      row.secondary_color || DEFAULT_SETTINGS.secondaryColor,
    intensity: clamp(row.intensity, 10, 100),
    blur: clamp(row.blur, 20, 180),
    speed: clamp(row.speed, 10, 100),
    opacity: clamp(row.opacity, 10, 100),
    animation: row.animation ?? DEFAULT_SETTINGS.animation,
    smooth: row.smooth ?? DEFAULT_SETTINGS.smooth,
  };
}



function getCanvasBlobClass(
  canvasMode: CanvasMode,
  layer:
    | "aurora-main"
    | "aurora-wave"
    | "stage-left"
    | "stage-right"
    | "rgb-left"
    | "rgb-right"
    | "streamer-main"
    | "streamer-bottom"
    | "softbox",
): string {
  const portrait = canvasMode === "portrait";

  if (layer === "aurora-main") {
    return portrait ? "h-[46%] w-[92%]" : "h-[62%] w-[78%]";
  }

  if (layer === "aurora-wave") {
    return portrait ? "h-[22%] w-[88%]" : "h-[30%] w-[66%]";
  }

  if (layer === "stage-left") {
    return portrait
      ? "left-[10%] h-[82%] w-[38%]"
      : "left-[22%] h-[90%] w-[30%]";
  }

  if (layer === "stage-right") {
    return portrait
      ? "right-[10%] h-[82%] w-[38%]"
      : "right-[22%] h-[90%] w-[30%]";
  }

  if (layer === "rgb-left") {
    return portrait
      ? "left-[-8%] h-[54%] w-[62%]"
      : "left-[8%] h-[70%] w-[44%]";
  }

  if (layer === "rgb-right") {
    return portrait
      ? "right-[-8%] h-[54%] w-[62%]"
      : "right-[8%] h-[70%] w-[44%]";
  }

  if (layer === "streamer-main") {
    return portrait ? "h-[50%] w-[94%]" : "h-[68%] w-[74%]";
  }

  if (layer === "streamer-bottom") {
    return portrait ? "h-[20%] w-[86%]" : "h-[28%] w-[62%]";
  }

  return portrait ? "h-[54%] w-[92%]" : "h-[72%] w-[72%]";
}

function getOpacity(settings: RoomLightSettings): number {
  return clamp(
    (settings.opacity / 100) * (settings.intensity / 100),
    0,
    1,
  );
}

function getDuration(settings: RoomLightSettings): number {
  return Math.max(1.5, 8 - (settings.speed / 100) * 6);
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  if (!Number.isFinite(value)) {
    return minimum;
  }

  return Math.min(Math.max(value, minimum), maximum);
}

function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace("#", "").trim();

  const normalized =
    cleanHex.length === 3
      ? cleanHex
          .split("")
          .map((character) => character + character)
          .join("")
      : cleanHex;

  const safeAlpha = clamp(alpha, 0, 1);

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return `rgba(255, 255, 255, ${safeAlpha})`;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${safeAlpha})`;
}