"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { RoomLightSettings } from "../types";

type ObsQuickAccessProps = {
  overlayUrl: string;
  settings: RoomLightSettings;
  onCopy: () => void;
  onOpen: () => void;
};

export function ObsQuickAccess({
  overlayUrl,
  settings,
  onCopy,
  onOpen,
}: ObsQuickAccessProps) {
  const canvasLabel =
    settings.canvasMode === "portrait"
      ? "1080 × 1920"
      : "1920 × 1080";

  const lightLabel = settings.multiLightEnabled
    ? `${settings.lights.filter((light) => light.enabled).length} Lights`
    : settings.effect;

  return (
    <section className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-black">OBS Browser Source</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Copy this link and add it as a Browser Source in OBS.
              </p>
            </div>

            <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-black text-violet-200">
              Decoration
            </span>
          </div>

          <div className="mt-5 break-all rounded-2xl border border-zinc-800 bg-black p-4 text-sm text-zinc-300">
            {overlayUrl || "Overlay URL unavailable"}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
            <Button
              onClick={onCopy}
              disabled={!overlayUrl}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              Copy OBS Link
            </Button>

            <Button
              onClick={onOpen}
              disabled={!overlayUrl}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              Open Overlay
            </Button>
          </div>
        </Card>

        <Card className="border-sky-500/20 bg-sky-500/5">
          <h2 className="text-lg font-black text-sky-200">OBS Setup</h2>

          <div className="mt-4 grid gap-3 text-sm leading-6 text-zinc-300 sm:grid-cols-2">
            <p>
              1. Add a new <strong>Browser Source</strong>.
            </p>
            <p>
              2. Set size to <strong>{canvasLabel}</strong>.
            </p>
            <p>3. Paste the overlay URL.</p>
            <p>4. Keep the source above your camera layer.</p>
          </div>
        </Card>
      </div>

      <Card className="border-pink-500/20 bg-pink-500/5">
        <h2 className="text-lg font-black text-pink-100">Current Setup</h2>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-full bg-black/40 px-3 py-1.5 text-zinc-200">
            {settings.canvasMode === "portrait"
              ? "📱 Portrait"
              : "🖥️ Landscape"}
          </span>

          <span className="rounded-full bg-black/40 px-3 py-1.5 text-zinc-200">
            💡 {lightLabel}
          </span>

          <span className="rounded-full bg-black/40 px-3 py-1.5 text-zinc-200">
            📍 {settings.placement}
          </span>

          <span className="rounded-full bg-black/40 px-3 py-1.5 text-zinc-200">
            🎨 {settings.preset}
          </span>
        </div>

        <p className="mt-4 text-sm leading-6 text-zinc-400">
          The OBS link stays the same. Saving new settings updates the same
          overlay automatically.
        </p>
      </Card>
    </section>
  );
}
