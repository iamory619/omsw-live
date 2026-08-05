"use client";

import { Card } from "@/components/ui/Card";
import type { LightLayer, LightPlacement } from "../types";
import { ColorControl, RangeControl } from "./Controls";
import { SectionToggle } from "./SectionToggle";

type Props = {
  open: boolean;
  enabled: boolean;
  lights: LightLayer[];
  onToggleSection: () => void;
  onToggleEnabled: (enabled: boolean) => void;
  onUpdateLight: (
    lightId: LightLayer["id"],
    patch: Partial<LightLayer>,
  ) => void;
};

export function MultipleLightsSection({
  open,
  enabled,
  lights,
  onToggleSection,
  onToggleEnabled,
  onUpdateLight,
}: Props) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <SectionToggle
            title="Multiple Lights"
            description="เปิดไฟได้สูงสุด 3 ดวง และวางแต่ละดวงได้อิสระ"
            open={open}
            onClick={onToggleSection}
          />
        </div>

        <button
          type="button"
          onClick={() => onToggleEnabled(!enabled)}
          aria-pressed={enabled}
          className={`relative mt-1 h-8 w-14 shrink-0 rounded-full transition ${
            enabled ? "bg-pink-600" : "bg-zinc-700"
          }`}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
              enabled ? "left-7" : "left-1"
            }`}
          />
        </button>
      </div>

      {open && (
        <div className="mt-5 space-y-4">
          {lights.map((light, index) => (
            <div
              key={light.id}
              className={`rounded-2xl border p-4 ${
                light.enabled
                  ? "border-pink-500/30 bg-pink-500/5"
                  : "border-zinc-800 bg-zinc-950 opacity-70"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="font-black">Light {index + 1}</div>

                <button
                  type="button"
                  onClick={() =>
                    onUpdateLight(light.id, {
                      enabled: !light.enabled,
                    })
                  }
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    light.enabled
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {light.enabled ? "ON" : "OFF"}
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <ColorControl
                  label="Light Color"
                  value={light.color}
                  onChange={(color) =>
                    onUpdateLight(light.id, { color })
                  }
                />

                <label className="block">
                  <div className="mb-2 text-sm font-bold text-zinc-300">
                    Placement
                  </div>

                  <select
                    value={light.placement}
                    onChange={(event) =>
                      onUpdateLight(light.id, {
                        placement:
                          event.target.value as LightPlacement,
                      })
                    }
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-black outline-none transition focus:border-pink-500"
                  >
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="center">Center</option>
                  </select>
                </label>

                <RangeControl
                  label="Intensity"
                  value={light.intensity}
                  min={10}
                  max={100}
                  suffix="%"
                  onChange={(intensity) =>
                    onUpdateLight(light.id, { intensity })
                  }
                />

                <RangeControl
                  label="Blur"
                  value={light.blur}
                  min={20}
                  max={180}
                  suffix=" px"
                  onChange={(blur) =>
                    onUpdateLight(light.id, { blur })
                  }
                />

                <RangeControl
                  label="Size"
                  value={light.size}
                  min={30}
                  max={140}
                  suffix="%"
                  onChange={(size) =>
                    onUpdateLight(light.id, { size })
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
