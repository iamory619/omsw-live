"use client";

import { Card } from "@/components/ui/Card";
import type { LightPlacement } from "../types";
import { SectionToggle } from "./SectionToggle";

const OPTIONS: Array<{
  id: LightPlacement;
  icon: string;
  label: string;
}> = [
  { id: "left", icon: "⬅️", label: "Left" },
  { id: "right", icon: "➡️", label: "Right" },
  { id: "top", icon: "⬆️", label: "Top" },
  { id: "bottom", icon: "⬇️", label: "Bottom" },
  { id: "center", icon: "🎯", label: "Center" },
];

export function PlacementSection({
  open,
  value,
  onToggle,
  onChange,
}: {
  open: boolean;
  value: LightPlacement;
  onToggle: () => void;
  onChange: (value: LightPlacement) => void;
}) {
  return (
    <Card>
      <SectionToggle
        title="Light Placement"
        description="เลือกตำแหน่งแสง เพื่อไม่ให้บังหน้าคนไลฟ์"
        open={open}
        onClick={onToggle}
      />

      {open && (
        <div className="mt-5 grid grid-cols-2 gap-3">
          {OPTIONS.map((option) => {
            const selected = value === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onChange(option.id)}
                className={`rounded-2xl border p-4 text-left transition ${
                  selected
                    ? "border-pink-500 bg-pink-500/15"
                    : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"
                }`}
              >
                <div className="text-2xl">{option.icon}</div>
                <div className="mt-2 font-black">{option.label}</div>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
