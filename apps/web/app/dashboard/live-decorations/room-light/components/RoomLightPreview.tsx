"use client";

import {
  Aurora,
  GlowLight,
} from "@/components/decorations";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { RoomLightSettings } from "../types";
import { MultipleLightsPreview } from "./MultipleLightsPreview";

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
  return (
    <div className="xl:sticky xl:top-4 xl:self-start">
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black">
              Live Preview
            </h2>

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
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#111118_0%,#09090d_72%,#050507_100%)]" />

          <div className="absolute inset-x-[7%] top-[7%] h-[68%] overflow-hidden rounded-t-[2rem] border border-white/10 bg-[#101018] shadow-2xl">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:38px_38px]" />

            <div className="absolute bottom-[12%] left-1/2 h-[46%] w-[26%] -translate-x-1/2 rounded-t-[48%] border border-white/10 bg-black/35 shadow-2xl">
              <div className="absolute left-1/2 top-[10%] h-[27%] w-[35%] -translate-x-1/2 rounded-full bg-zinc-700/80" />
              <div className="absolute bottom-0 left-1/2 h-[62%] w-[64%] -translate-x-1/2 rounded-t-[46%] bg-zinc-800/90" />
            </div>

            <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-300 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Live Studio Preview
            </div>
          </div>

          {settings.enabled &&
            settings.multiLightEnabled && (
              <MultipleLightsPreview
                lights={settings.lights}
                canvasMode={settings.canvasMode}
                animation={false}
                speed={settings.speed}
                smooth={settings.smooth}
              />
            )}

          {settings.enabled &&
            !settings.multiLightEnabled &&
            settings.effect === "aurora" && (
              <div className="pointer-events-none absolute inset-0 z-20">
                <Aurora
                  primaryColor={settings.primaryColor}
                  secondaryColor={settings.secondaryColor}
                  accentColor="#38bdf8"
                  opacity={
                    (settings.opacity / 100) *
                    (settings.intensity / 100) *
                    0.72
                  }
                  blur={Math.max(
                    40,
                    settings.blur,
                  )}
                  speed={Math.max(
                    9,
                    20 -
                      (settings.speed / 100) *
                        7,
                  )}
                  intensity={Math.max(
                    0.25,
                    settings.intensity / 90,
                  )}
                  animated={false}
                />
              </div>
            )}

          {settings.enabled &&
            !settings.multiLightEnabled &&
            settings.effect !== "aurora" && (
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
                animation={false}
                smooth={settings.smooth}
              />
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
            {saving
              ? "Saving..."
              : "💾 Save Settings"}
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