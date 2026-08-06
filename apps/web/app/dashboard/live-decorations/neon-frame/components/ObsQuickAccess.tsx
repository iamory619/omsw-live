"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type {
  NeonFrameSettings,
} from "@/app/dashboard/live-decorations/neon-frame/types";

type Props = {
  overlayUrl: string;
  settings: NeonFrameSettings;
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

            <span className="rounded-full bg-fuchsia-500/15 px-3 py-1 text-xs font-black text-fuchsia-200">
              Neon Frame
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

      <Card className="border-fuchsia-500/20 bg-fuchsia-500/5">
        <h2 className="text-lg font-black text-fuchsia-100">
          Current Setup
        </h2>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-full bg-black/40 px-3 py-1.5 text-zinc-200">
            {settings.canvasMode === "portrait"
              ? "📱 Portrait"
              : "🖥️ Landscape"}
          </span>

          <span className="rounded-full bg-black/40 px-3 py-1.5 text-zinc-200">
            ✨ {formatFrameStyle(settings.frameStyle)}
          </span>

          <span className="rounded-full bg-black/40 px-3 py-1.5 text-zinc-200">
            🎨 {formatPreset(settings.preset)}
          </span>

          <span className="rounded-full bg-black/40 px-3 py-1.5 text-zinc-200">
            📏 {settings.thickness}px
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

function formatFrameStyle(
  value: NeonFrameSettings["frameStyle"],
): string {
  if (value === "soft-neon") {
    return "Soft Neon";
  }

  if (value === "double-line") {
    return "Double Line";
  }

  if (value === "corner-glow") {
    return "Corner Glow";
  }

  if (value === "gaming-rgb") {
    return "Gaming RGB";
  }

  return "Rounded Frame";
}

function formatPreset(
  value: NeonFrameSettings["preset"],
): string {
  if (value === "tiktok-pink") {
    return "TikTok Pink";
  }

  if (value === "cyber-purple") {
    return "Cyber Purple";
  }

  if (value === "ice-blue") {
    return "Ice Blue";
  }

  if (value === "sunset") {
    return "Sunset";
  }

  if (value === "gaming-rgb") {
    return "Gaming RGB";
  }

  return "Custom";
}