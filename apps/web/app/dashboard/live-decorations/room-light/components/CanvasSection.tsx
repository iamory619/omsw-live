"use client";

import { Card } from "@/components/ui/Card";
import type { CanvasMode } from "../types";
import { SectionToggle } from "./SectionToggle";

export function CanvasSection({
  open,
  value,
  onToggle,
  onChange,
}: {
  open: boolean;
  value: CanvasMode;
  onToggle: () => void;
  onChange: (value: CanvasMode) => void;
}) {
  return (
    <Card>
      <SectionToggle
        title="Canvas Mode"
        description="เลือกสัดส่วนหน้าจอให้ตรงกับรูปแบบไลฟ์"
        open={open}
        onClick={onToggle}
      />

      {open && (
        <div className="mt-5 grid grid-cols-2 gap-3">
          {[
            ["landscape", "🖥️", "Landscape", "1920 × 1080 · 16:9"],
            ["portrait", "📱", "Portrait", "1080 × 1920 · 9:16"],
          ].map(([id, icon, title, description]) => {
            const mode = id as CanvasMode;
            const selected = value === mode;

            return (
              <button
                key={mode}
                type="button"
                onClick={() => onChange(mode)}
                className={`rounded-2xl border p-4 text-left transition ${
                  selected
                    ? "border-pink-500 bg-pink-500/15"
                    : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"
                }`}
              >
                <div className="text-3xl">{icon}</div>
                <div className="mt-3 font-black">{title}</div>
                <div className="mt-1 text-xs text-zinc-400">
                  {description}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
