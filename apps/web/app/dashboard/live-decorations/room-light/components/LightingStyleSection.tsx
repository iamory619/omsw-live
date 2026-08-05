"use client";

import { Card } from "@/components/ui/Card";
import { EFFECT_OPTIONS } from "../room-light-config";
import type { LightEffect } from "../types";
import { SectionToggle } from "./SectionToggle";

export function LightingStyleSection({
  open,
  value,
  onToggle,
  onChange,
}: {
  open: boolean;
  value: LightEffect;
  onToggle: () => void;
  onChange: (value: LightEffect) => void;
}) {
  return (
    <Card>
      <SectionToggle
        title="Studio Lighting Style"
        description="เลือกรูปแบบการจัดไฟให้เหมาะกับห้องไลฟ์ของคุณ"
        open={open}
        onClick={onToggle}
      />

      {open && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          {EFFECT_OPTIONS.map((effect) => {
            const selected = value === effect.id;

            return (
              <button
                key={effect.id}
                type="button"
                onClick={() => onChange(effect.id)}
                className={`rounded-2xl border p-4 text-left transition ${
                  selected
                    ? "border-pink-500 bg-pink-500/15"
                    : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{effect.icon}</div>
                  <div>
                    <div className="font-black">{effect.name}</div>
                    <div className="mt-1 text-xs leading-5 text-zinc-400">
                      {effect.description}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
