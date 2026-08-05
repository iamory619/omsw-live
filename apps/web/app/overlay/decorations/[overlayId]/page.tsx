"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Aurora } from "@/components/decorations";

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
  enabled: boolean;
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
      className="fixed inset-0 overflow-hidden bg-transparent"
    >
      {settings.effect === "aurora" ? (
        <Aurora
          primaryColor={settings.primaryColor}
          secondaryColor={settings.secondaryColor}
          accentColor="#38bdf8"
          opacity={opacity}
          blur={settings.blur}
          speed={Math.max(4, 16 - (settings.speed / 100) * 11)}
          intensity={Math.max(0.3, settings.intensity / 70)}
          animated={settings.animation}
        />
      ) : (
        <>
          <div
            className={getEffectClassName(settings)}
            style={getEffectStyle(settings)}
          />

          <StudioLightLayers
            settings={settings}
            opacity={opacity}
            duration={duration}
          />

          <div
            className="pointer-events-none absolute inset-0"
            style={{
              boxShadow: `
                inset 0 0 ${settings.blur * 1.6}px
                  ${hexToRgba(settings.primaryColor, opacity * 0.58)},
                inset 0 0 ${settings.blur * 1.05}px
                  ${hexToRgba(settings.secondaryColor, opacity * 0.48)}
              `,
            }}
          />
        </>
      )}
    </main>
  );
}

function StudioLightLayers({
  settings,
  opacity,
  duration,
}: {
  settings: RoomLightSettings;
  opacity: number;
  duration: number;
}) {
  if (settings.effect === "studio-softbox") {
    return (
      <>
        <div
          className="pointer-events-none absolute -left-[8%] top-[8%] h-[74%] w-[30%] rounded-[50%] blur-3xl"
          style={{
            background: settings.primaryColor,
            opacity: opacity * 0.48,
          }}
        />

        <div
          className="pointer-events-none absolute -right-[8%] top-[8%] h-[74%] w-[30%] rounded-[50%] blur-3xl"
          style={{
            background: settings.secondaryColor,
            opacity: opacity * 0.48,
          }}
        />

        <div
          className="pointer-events-none absolute left-1/2 top-[-18%] h-[56%] w-[48%] -translate-x-1/2 rounded-[50%] bg-white blur-3xl"
          style={{ opacity: opacity * 0.2 }}
        />
      </>
    );
  }

  if (settings.effect === "rgb-studio") {
    return (
      <>
        <div
          className="pointer-events-none absolute -left-[8%] inset-y-[10%] w-[26%] rounded-[50%] blur-3xl"
          style={{
            background: settings.primaryColor,
            opacity: opacity * 0.66,
          }}
        />

        <div
          className="pointer-events-none absolute -right-[8%] inset-y-[10%] w-[26%] rounded-[50%] blur-3xl"
          style={{
            background: settings.secondaryColor,
            opacity: opacity * 0.66,
          }}
        />

        <div
          className="pointer-events-none absolute inset-x-[18%] bottom-[-8%] h-[26%] rounded-[50%] blur-3xl"
          style={{
            background: `linear-gradient(90deg, ${settings.primaryColor}, ${settings.secondaryColor})`,
            opacity: opacity * 0.45,
          }}
        />
      </>
    );
  }

  if (settings.effect === "streamer-room") {
    return (
      <>
        <div
          className="pointer-events-none absolute left-[7%] top-[8%] h-[34%] w-[34%] rounded-full blur-3xl"
          style={{
            background: settings.primaryColor,
            opacity: opacity * 0.55,
          }}
        />

        <div
          className="pointer-events-none absolute right-[7%] top-[12%] h-[34%] w-[34%] rounded-full blur-3xl"
          style={{
            background: settings.secondaryColor,
            opacity: opacity * 0.55,
          }}
        />

        <div
          className="pointer-events-none absolute inset-x-[12%] bottom-[-10%] h-[35%] rounded-[50%] blur-3xl"
          style={{
            background: `linear-gradient(90deg, ${settings.primaryColor}, ${settings.secondaryColor})`,
            opacity: opacity * 0.52,
          }}
        />
      </>
    );
  }

  return (
    <>
      <div
        className="pointer-events-none absolute left-[5%] top-[-20%] h-[105%] w-[30%] origin-top -rotate-[12deg] blur-2xl"
        style={{
          background: `linear-gradient(to bottom, ${hexToRgba(
            settings.primaryColor,
            opacity * 0.72,
          )}, transparent 74%)`,
          animation: settings.animation
            ? `roomLightBeam ${duration}s ease-in-out infinite`
            : undefined,
        }}
      />

      <div
        className="pointer-events-none absolute right-[5%] top-[-20%] h-[105%] w-[30%] origin-top rotate-[12deg] blur-2xl"
        style={{
          background: `linear-gradient(to bottom, ${hexToRgba(
            settings.secondaryColor,
            opacity * 0.72,
          )}, transparent 74%)`,
          animation: settings.animation
            ? `roomLightBeam ${duration}s ease-in-out infinite reverse`
            : undefined,
        }}
      />

      <div
        className="pointer-events-none absolute inset-x-[18%] bottom-[-12%] h-[32%] rounded-[50%] blur-3xl"
        style={{
          background: settings.primaryColor,
          opacity: opacity * 0.48,
        }}
      />
    </>
  );
}

function rowToSettings(
  row: DecorationSettingsRow,
): RoomLightSettings {
  const effect = VALID_EFFECTS.includes(row.effect as LightEffect)
    ? (row.effect as LightEffect)
    : DEFAULT_SETTINGS.effect;

  return {
    enabled: row.enabled ?? DEFAULT_SETTINGS.enabled,
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

function getEffectStyle(
  settings: RoomLightSettings,
): React.CSSProperties {
  return {
    "--room-light-primary": settings.primaryColor,
    "--room-light-secondary": settings.secondaryColor,
    "--room-light-opacity": getOpacity(settings),
    "--room-light-blur": `${settings.blur}px`,
    "--room-light-duration": `${getDuration(settings)}s`,
  } as React.CSSProperties;
}

function getEffectClassName(
  settings: RoomLightSettings,
): string {
  const base = "pointer-events-none absolute inset-[-18%]";

  const smooth = settings.smooth
    ? "transition-all duration-700"
    : "";

  const animation = settings.animation
    ? "animate-[roomLightOverlay_var(--room-light-duration)_ease-in-out_infinite]"
    : "";

  if (settings.effect === "studio-softbox") {
    return [
      base,
      smooth,
      animation,
      "bg-[radial-gradient(ellipse_at_18%_42%,var(--room-light-primary)_0%,transparent_38%),radial-gradient(ellipse_at_82%_42%,var(--room-light-secondary)_0%,transparent_38%),radial-gradient(ellipse_at_50%_8%,rgba(255,255,255,.32)_0%,transparent_30%)]",
      "opacity-[var(--room-light-opacity)]",
      "blur-[var(--room-light-blur)]",
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (settings.effect === "rgb-studio") {
    return [
      base,
      smooth,
      animation,
      "bg-[radial-gradient(circle_at_7%_50%,var(--room-light-primary)_0%,transparent_40%),radial-gradient(circle_at_93%_50%,var(--room-light-secondary)_0%,transparent_40%),linear-gradient(115deg,transparent_30%,rgba(255,255,255,.07)_50%,transparent_70%)]",
      "opacity-[var(--room-light-opacity)]",
      "blur-[var(--room-light-blur)]",
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (settings.effect === "streamer-room") {
    return [
      base,
      smooth,
      animation,
      "bg-[radial-gradient(circle_at_18%_24%,var(--room-light-primary)_0%,transparent_36%),radial-gradient(circle_at_82%_28%,var(--room-light-secondary)_0%,transparent_36%),radial-gradient(ellipse_at_50%_100%,var(--room-light-primary)_0%,transparent_44%)]",
      "opacity-[var(--room-light-opacity)]",
      "blur-[var(--room-light-blur)]",
    ]
      .filter(Boolean)
      .join(" ");
  }

  return [
    base,
    smooth,
    animation,
    "bg-[conic-gradient(from_205deg_at_22%_0%,transparent_0deg,var(--room-light-primary)_18deg,transparent_43deg),conic-gradient(from_137deg_at_78%_0%,transparent_0deg,var(--room-light-secondary)_18deg,transparent_43deg),radial-gradient(ellipse_at_50%_100%,var(--room-light-primary)_0%,transparent_46%)]",
    "opacity-[var(--room-light-opacity)]",
    "blur-[var(--room-light-blur)]",
  ]
    .filter(Boolean)
    .join(" ");
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