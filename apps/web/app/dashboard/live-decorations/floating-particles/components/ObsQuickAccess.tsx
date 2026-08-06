"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type {
  FloatingParticlesSettings,
} from "@/app/dashboard/live-decorations/floating-particles/types";

type Props = {
  overlayUrl: string;
  settings: FloatingParticlesSettings;
  onCopy: () => void;
  onOpen: () => void;
};

export function ObsQuickAccess({
  overlayUrl,
  settings,
  onCopy,
  onOpen,
}: Props) {
  const canvasSize =
    settings.canvasMode === "portrait"
      ? "1080 × 1920"
      : "1920 × 1080";

  return (
    <section className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-black">
                OBS Browser Source
              </h2>

              <p className="mt-1 text-sm text-zinc-400">
                คัดลอกลิงก์นี้ไปเพิ่มเป็น Browser Source ใน OBS
              </p>
            </div>

            <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs font-black text-sky-200">
              Floating Particles
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
          <h2 className="text-lg font-black text-sky-200">
            OBS Setup
          </h2>

          <div className="mt-4 grid gap-3 text-sm leading-6 text-zinc-300 sm:grid-cols-2">
            <p>
              1. เพิ่ม <strong>Browser Source</strong>
            </p>

            <p>
              2. ตั้งขนาดเป็น <strong>{canvasSize}</strong>
            </p>

            <p>3. วาง Overlay URL</p>

            <p>
              4. วาง Source นี้ไว้เหนือกล้องหรือวิดีโอ
            </p>
          </div>
        </Card>
      </div>

      <Card className="border-sky-500/20 bg-sky-500/5">
        <h2 className="text-lg font-black text-sky-100">
          Current Setup
        </h2>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-full bg-black/40 px-3 py-1.5 text-zinc-200">
            {settings.canvasMode === "portrait"
              ? "📱 Portrait"
              : "🖥️ Landscape"}
          </span>

          <span className="rounded-full bg-black/40 px-3 py-1.5 text-zinc-200">
            {formatParticleIcon(settings.particleType)}{" "}
            {formatParticleType(settings.particleType)}
          </span>

          <span className="rounded-full bg-black/40 px-3 py-1.5 text-zinc-200">
            🎨 {formatPreset(settings.preset)}
          </span>

          <span className="rounded-full bg-black/40 px-3 py-1.5 text-zinc-200">
            ✨ {settings.particleCount} particles
          </span>

          <span className="rounded-full bg-black/40 px-3 py-1.5 text-zinc-200">
            {formatDirectionIcon(settings.direction)}{" "}
            {formatDirection(settings.direction)}
          </span>
        </div>

        <p className="mt-4 text-sm leading-6 text-zinc-400">
          ลิงก์ OBS จะยังเป็นลิงก์เดิม เมื่อบันทึกค่าครั้งใหม่
          Overlay จะอัปเดตตามค่าที่บันทึกไว้
        </p>
      </Card>
    </section>
  );
}

function formatParticleType(
  value: FloatingParticlesSettings["particleType"],
): string {
  if (value === "stars") return "Stars";
  if (value === "hearts") return "Hearts";
  if (value === "sparkles") return "Sparkles";
  if (value === "snow") return "Snow";
  if (value === "sakura") return "Sakura";
  if (value === "leaves") return "Leaves";
  if (value === "confetti") return "Confetti";
  if (value === "coins") return "Coins";
  return "Bubbles";
}

function formatParticleIcon(
  value: FloatingParticlesSettings["particleType"],
): string {
  if (value === "stars") return "⭐";
  if (value === "hearts") return "❤️";
  if (value === "sparkles") return "✨";
  if (value === "snow") return "❄️";
  if (value === "sakura") return "🌸";
  if (value === "leaves") return "🍃";
  if (value === "confetti") return "🎉";
  if (value === "coins") return "🪙";
  return "🫧";
}

function formatPreset(
  value: FloatingParticlesSettings["preset"],
): string {
  if (value === "pink-hearts") return "Pink Hearts";
  if (value === "gold-stars") return "Gold Stars";
  if (value === "magic-sparkles") return "Magic Sparkles";
  if (value === "winter-snow") return "Winter Snow";
  if (value === "sakura-dream") return "Sakura Dream";
  if (value === "gaming-confetti") return "Gaming Confetti";
  return "Custom";
}

function formatDirection(
  value: FloatingParticlesSettings["direction"],
): string {
  if (value === "down") return "Down";
  if (value === "up") return "Up";
  if (value === "left") return "Left";
  if (value === "right") return "Right";
  return "Float";
}

function formatDirectionIcon(
  value: FloatingParticlesSettings["direction"],
): string {
  if (value === "down") return "↓";
  if (value === "up") return "↑";
  if (value === "left") return "←";
  if (value === "right") return "→";
  return "〰";
}