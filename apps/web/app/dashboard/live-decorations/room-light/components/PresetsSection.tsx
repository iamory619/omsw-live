"use client";

import { Card } from "@/components/ui/Card";
import { LIGHT_PRESETS } from "../room-light-config";
import type { PresetId, RoomLightSettings } from "../types";
import { SectionToggle } from "./SectionToggle";

type Props = {
  open: boolean;
  settings: RoomLightSettings;
  onToggle: () => void;
  onApply: (
    presetId: Exclude<PresetId, "custom">,
    presetSettings: Partial<RoomLightSettings>,
  ) => void;
};

export function PresetsSection({
  open,
  settings,
  onToggle,
  onApply,
}: Props) {
  return (
    <Card>
      <SectionToggle
        title="Studio Presets"
        description="เลือกบรรยากาศสำเร็จรูป แล้วปรับรายละเอียดต่อได้ทันที"
        open={open}
        onClick={onToggle}
      />

      {open && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          {LIGHT_PRESETS.map((preset) => {
            const selected = settings.preset === preset.id;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onApply(preset.id, preset.settings)}
                className={`rounded-2xl border p-4 text-left transition ${
                  selected
                    ? "border-pink-500 bg-pink-500/15"
                    : "border-zinc-800 bg-zinc-950 hover:border-pink-500/50 hover:bg-pink-500/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{preset.icon}</div>
                  <div>
                    <div className="font-black">{preset.name}</div>
                    <div className="mt-1 text-xs leading-5 text-zinc-400">
                      {preset.description}
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
