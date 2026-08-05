"use client";

import { Aurora } from "@/components/decorations";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type {
  CanvasMode,
  LightLayer,
  LightPlacement,
  RoomLightSettings,
} from "../types";

type Props = {
  settings: RoomLightSettings;
  saving: boolean;
  message: string;
  previewKey: number;
  onSave: () => void;
  onReset: () => void;
};

export function RoomLightPreview({
  settings,
  saving,
  message,
  previewKey,
  onSave,
  onReset,
}: Props) {
  const previewStyle = getPreviewStyle(settings);

  return (
    <div className="xl:sticky xl:top-4 xl:self-start">
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black">Live Preview</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Preview the current lighting setup.
            </p>
          </div>

          <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-black text-green-300">
            {settings.canvasMode === "portrait"
              ? "1080 × 1920"
              : "1920 × 1080"}
          </span>
        </div>

        <div
          key={previewKey}
          className={`relative mx-auto mt-5 overflow-hidden rounded-3xl border border-zinc-700 bg-[#08080d] ${
            settings.canvasMode === "portrait"
              ? "aspect-[9/16] max-h-[68vh]"
              : "aspect-video w-full"
          }`}
        >
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#14141d_0%,#09090d_68%,#050507_100%)]" />

          <div className="absolute inset-x-[7%] top-[7%] h-[68%] overflow-hidden rounded-t-[2rem] border border-white/10 bg-[#101018] shadow-2xl">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:38px_38px]" />

            <div className="absolute bottom-[12%] left-1/2 h-[46%] w-[26%] -translate-x-1/2 rounded-t-[48%] border border-white/10 bg-black/35 shadow-2xl">
              <div className="absolute left-1/2 top-[10%] h-[27%] w-[35%] -translate-x-1/2 rounded-full bg-zinc-700/80" />
              <div className="absolute bottom-0 left-1/2 h-[62%] w-[64%] -translate-x-1/2 rounded-t-[46%] bg-zinc-800/90" />
            </div>

            <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-300 backdrop-blur">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              Live Studio Preview
            </div>
          </div>

          {settings.enabled && settings.multiLightEnabled && (
            <MultipleLightsPreview
              lights={settings.lights}
              canvasMode={settings.canvasMode}
              animation={settings.animation}
              speed={settings.speed}
            />
          )}

          {settings.enabled &&
            !settings.multiLightEnabled &&
            settings.effect === "aurora" && (
              <div
                className={`absolute inset-0 ${getPlacementClassName(
                  settings.canvasMode,
                  settings.placement,
                )}`}
              >
                <Aurora
                  primaryColor={settings.primaryColor}
                  secondaryColor={settings.secondaryColor}
                  accentColor="#38bdf8"
                  opacity={
                    (settings.opacity / 100) *
                    (settings.intensity / 100)
                  }
                  blur={settings.blur}
                  speed={Math.max(
                    4,
                    16 - (settings.speed / 100) * 11,
                  )}
                  intensity={Math.max(
                    0.3,
                    settings.intensity / 70,
                  )}
                  animated={settings.animation}
                  className="z-20"
                />
              </div>
            )}

          {settings.enabled &&
            !settings.multiLightEnabled &&
            settings.effect !== "aurora" && (
              <div
                className={`absolute inset-0 ${getPlacementClassName(
                  settings.canvasMode,
                  settings.placement,
                )}`}
              >
                <div
                  className={getEffectClassName(settings)}
                  style={previewStyle}
                />
              </div>
            )}

          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
          <Button
            onClick={onSave}
            disabled={saving}
            variant="upgrade"
            className="w-full sm:w-auto"
          >
            {saving ? "Saving..." : "💾 Save Settings"}
          </Button>

          <Button
            onClick={onReset}
            disabled={saving}
            variant="secondary"
            className="w-full sm:w-auto"
          >
            Reset
          </Button>
        </div>

        {message && (
          <div className="mt-4 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm font-bold text-green-200">
            {message}
          </div>
        )}
      </Card>
    </div>
  );
}

function MultipleLightsPreview({
  lights,
  canvasMode,
  animation,
  speed,
}: {
  lights: LightLayer[];
  canvasMode: CanvasMode;
  animation: boolean;
  speed: number;
}) {
  const duration = Math.max(1.8, 8 - (speed / 100) * 5.5);

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {lights
        .filter((light) => light.enabled)
        .map((light, index) => {
          const position = getLightPosition(
            canvasMode,
            light.placement,
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
                  ${hexToRgba(
                    light.color,
                    light.intensity / 100,
                  )} 0%,
                  ${hexToRgba(
                    light.color,
                    (light.intensity / 100) * 0.45,
                  )} 38%,
                  transparent 74%
                )`,
                filter: `blur(${light.blur}px)`,
                mixBlendMode: "screen",
                animation: animation
                  ? `roomLightPreview ${
                      duration + index * 0.35
                    }s ease-in-out infinite ${
                      index % 2 === 1 ? "reverse" : ""
                    }`
                  : undefined,
              }}
            />
          );
        })}
    </div>
  );
}

function getLightPosition(
  canvasMode: CanvasMode,
  placement: LightPlacement,
): { left: string; top: string } {
  const portrait = canvasMode === "portrait";

  if (placement === "left") {
    return { left: portrait ? "18%" : "14%", top: "50%" };
  }

  if (placement === "right") {
    return { left: portrait ? "82%" : "86%", top: "50%" };
  }

  if (placement === "top") {
    return { left: "50%", top: portrait ? "16%" : "12%" };
  }

  if (placement === "bottom") {
    return { left: "50%", top: portrait ? "84%" : "88%" };
  }

  return { left: "50%", top: "50%" };
}

function getPlacementClassName(
  canvasMode: CanvasMode,
  placement: LightPlacement,
): string {
  const portrait = canvasMode === "portrait";

  if (placement === "left") {
    return portrait
      ? "-translate-x-[18%] scale-[0.88]"
      : "-translate-x-[22%] scale-[0.9]";
  }

  if (placement === "right") {
    return portrait
      ? "translate-x-[18%] scale-[0.88]"
      : "translate-x-[22%] scale-[0.9]";
  }

  if (placement === "top") {
    return portrait
      ? "-translate-y-[26%] scale-[0.86]"
      : "-translate-y-[18%] scale-[0.9]";
  }

  if (placement === "bottom") {
    return portrait
      ? "translate-y-[26%] scale-[0.86]"
      : "translate-y-[18%] scale-[0.9]";
  }

  return portrait ? "scale-[0.9]" : "scale-100";
}

function getPreviewStyle(
  settings: RoomLightSettings,
): React.CSSProperties {
  const opacity =
    (settings.opacity / 100) *
    (settings.intensity / 100);

  const duration = 8 - (settings.speed / 100) * 6;

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
  const base = "pointer-events-none absolute inset-[-12%]";
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

  return `${base} ${transition} ${animation} bg-[conic-gradient(from_205deg_at_22%_0%,transparent_0deg,var(--room-light-primary)_18deg,transparent_42deg),conic-gradient(from_137deg_at_78%_0%,transparent_0deg,var(--room-light-secondary)_18deg,transparent_42deg),radial-gradient(ellipse_at_50%_100%,var(--room-light-primary)_0%,transparent_45%)] opacity-[var(--room-light-opacity)] blur-[var(--room-light-blur)]`;
}

function hexToRgba(
  hex: string,
  alpha: number,
): string {
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
