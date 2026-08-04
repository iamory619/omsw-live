"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type LightEffect = "ambient" | "pulse" | "wave" | "spotlight";

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

const DEFAULT_SETTINGS: RoomLightSettings = {
  enabled: true,
  effect: "ambient",
  primaryColor: "#ff4da6",
  secondaryColor: "#7c3aed",
  intensity: 70,
  blur: 90,
  speed: 45,
  opacity: 65,
  animation: true,
  smooth: true,
};

const STORAGE_KEY = "omsw-room-light-settings";

function parseSavedSettings(value: string | null): RoomLightSettings {
  if (!value) {
    return DEFAULT_SETTINGS;
  }

  try {
    const parsed = JSON.parse(value) as Partial<RoomLightSettings>;

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch (error) {
    console.error("Unable to read Room Light settings:", error);
    return DEFAULT_SETTINGS;
  }
}

export default function DecorationOverlayPage() {
  const params = useParams<{ overlayId: string }>();
  const overlayId = params?.overlayId;

  const [settings, setSettings] =
    useState<RoomLightSettings>(DEFAULT_SETTINGS);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedSettings = window.localStorage.getItem(STORAGE_KEY);

    setSettings(parseSavedSettings(savedSettings));
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) {
        return;
      }

      setSettings(parseSavedSettings(event.newValue));
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  if (loading || !overlayId || !settings.enabled) {
    return null;
  }

  const effectStyle = getEffectStyle(settings);
  const effectClassName = getEffectClassName(settings);
  const opacity = getOpacity(settings);

  return (
    <main
      data-overlay-id={overlayId}
      className="fixed inset-0 overflow-hidden bg-transparent"
    >
      <div className={effectClassName} style={effectStyle} />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          boxShadow: `
            inset 0 0 ${settings.blur * 1.5}px
              ${hexToRgba(settings.primaryColor, opacity * 0.7)},
            inset 0 0 ${settings.blur}px
              ${hexToRgba(settings.secondaryColor, opacity * 0.55)}
          `,
        }}
      />
    </main>
  );
}

function getOpacity(settings: RoomLightSettings): number {
  const opacity = settings.opacity / 100;
  const intensity = settings.intensity / 100;

  return Math.min(Math.max(opacity * intensity, 0), 1);
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

  if (settings.effect === "spotlight") {
    return [
      base,
      smooth,
      animation,
      "bg-[radial-gradient(ellipse_at_top,var(--room-light-primary)_0%,transparent_58%),radial-gradient(ellipse_at_bottom,var(--room-light-secondary)_0%,transparent_60%)]",
      "opacity-[var(--room-light-opacity)]",
      "blur-[var(--room-light-blur)]",
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (settings.effect === "wave") {
    return [
      base,
      smooth,
      animation,
      "bg-[conic-gradient(from_0deg,var(--room-light-primary),var(--room-light-secondary),var(--room-light-primary))]",
      "opacity-[var(--room-light-opacity)]",
      "blur-[var(--room-light-blur)]",
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (settings.effect === "pulse") {
    return [
      base,
      smooth,
      animation,
      "bg-[radial-gradient(circle_at_15%_50%,var(--room-light-primary)_0%,transparent_45%),radial-gradient(circle_at_85%_50%,var(--room-light-secondary)_0%,transparent_45%)]",
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
    "bg-[radial-gradient(circle_at_10%_50%,var(--room-light-primary)_0%,transparent_42%),radial-gradient(circle_at_90%_50%,var(--room-light-secondary)_0%,transparent_42%),radial-gradient(circle_at_50%_100%,var(--room-light-primary)_0%,transparent_46%)]",
    "opacity-[var(--room-light-opacity)]",
    "blur-[var(--room-light-blur)]",
  ]
    .filter(Boolean)
    .join(" ");
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

  const safeAlpha = Math.min(Math.max(alpha, 0), 1);

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return `rgba(255, 255, 255, ${safeAlpha})`;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${safeAlpha})`;
}