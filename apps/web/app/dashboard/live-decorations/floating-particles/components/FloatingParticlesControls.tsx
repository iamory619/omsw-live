"use client";

import { Card } from "@/components/ui/Card";
import {
  FLOATING_PARTICLES_PRESETS,
  PARTICLE_TYPE_OPTIONS,
} from "@/app/dashboard/live-decorations/floating-particles/particle-config";
import type {
  CanvasMode,
  FloatingParticlesPreset,
  FloatingParticlesSettings,
  ParticleDirection,
  ParticleType,
} from "@/app/dashboard/live-decorations/floating-particles/types";

type Props = {
  settings: FloatingParticlesSettings;
  onChange: <
    K extends keyof FloatingParticlesSettings,
  >(
    key: K,
    value: FloatingParticlesSettings[K],
  ) => void;
  onApplyPreset: (
    preset: Exclude<
      FloatingParticlesPreset,
      "custom"
    >,
    values: Partial<FloatingParticlesSettings>,
  ) => void;
};

const DIRECTIONS: Array<{
  id: ParticleDirection;
  name: string;
  icon: string;
}> = [
  {
    id: "down",
    name: "Down",
    icon: "↓",
  },
  {
    id: "up",
    name: "Up",
    icon: "↑",
  },
  {
    id: "left",
    name: "Left",
    icon: "←",
  },
  {
    id: "right",
    name: "Right",
    icon: "→",
  },
  {
    id: "float",
    name: "Float",
    icon: "〰",
  },
];

export function FloatingParticlesControls({
  settings,
  onChange,
  onApplyPreset,
}: Props) {
  const updateParticleType = (
    particleType: ParticleType,
  ) => {
    onChange(
      "particleType",
      particleType,
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <ToggleRow
          label="Enable Floating Particles"
          description="เปิดหรือปิดเอฟเฟกต์อนุภาคใน Overlay"
          enabled={settings.enabled}
          onChange={(enabled) =>
            onChange("enabled", enabled)
          }
        />
      </Card>

      <Card>
        <SectionTitle
          title="Presets"
          description="เลือกชุดสำเร็จรูป แล้วปรับแต่งต่อได้"
        />

        <div className="mt-5 grid gap-3">
          {FLOATING_PARTICLES_PRESETS.map(
            (preset) => {
              const selected =
                settings.preset === preset.id;

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() =>
                    onApplyPreset(
                      preset.id,
                      preset.settings,
                    )
                  }
                  className={`rounded-2xl border p-4 text-left transition ${
                    selected
                      ? "border-sky-500 bg-sky-500/15"
                      : "border-zinc-800 bg-zinc-950 hover:border-sky-500/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">
                      {preset.icon}
                    </span>

                    <div>
                      <div className="font-black">
                        {preset.name}
                      </div>

                      <p className="mt-1 text-xs leading-5 text-zinc-400">
                        {preset.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            },
          )}
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Canvas Mode"
          description="เลือกขนาดให้ตรงกับรูปแบบไลฟ์"
        />

        <div className="mt-5 grid grid-cols-2 gap-3">
          {(
            [
              [
                "portrait",
                "📱",
                "Portrait",
              ],
              [
                "landscape",
                "🖥️",
                "Landscape",
              ],
            ] as const
          ).map(
            ([mode, icon, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() =>
                  onChange(
                    "canvasMode",
                    mode as CanvasMode,
                  )
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  settings.canvasMode ===
                  mode
                    ? "border-sky-500 bg-sky-500/15"
                    : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"
                }`}
              >
                <div className="text-2xl">
                  {icon}
                </div>

                <div className="mt-2 font-black">
                  {label}
                </div>
              </button>
            ),
          )}
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Particle Type"
          description="เลือกรูปแบบอนุภาคที่ต้องการ"
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {PARTICLE_TYPE_OPTIONS.map(
            (option) => (
              <button
                key={option.id}
                type="button"
                onClick={() =>
                  updateParticleType(
                    option.id,
                  )
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  settings.particleType ===
                  option.id
                    ? "border-sky-500 bg-sky-500/15"
                    : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"
                }`}
              >
                <div className="text-2xl">
                  {option.icon}
                </div>

                <div className="mt-2 font-black">
                  {option.name}
                </div>

                <p className="mt-1 text-xs leading-5 text-zinc-400">
                  {option.description}
                </p>
              </button>
            ),
          )}
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Particle Colors"
          description="ปรับสีหลักและสีรองของอนุภาค"
        />

        <div className="mt-5 space-y-5">
          <ColorControl
            label="Primary Color"
            value={settings.primaryColor}
            onChange={(value) =>
              onChange(
                "primaryColor",
                value,
              )
            }
          />

          <ColorControl
            label="Secondary Color"
            value={
              settings.secondaryColor
            }
            onChange={(value) =>
              onChange(
                "secondaryColor",
                value,
              )
            }
          />
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Motion Direction"
          description="เลือกทิศทางการเคลื่อนที่"
        />

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {DIRECTIONS.map((direction) => (
            <button
              key={direction.id}
              type="button"
              onClick={() =>
                onChange(
                  "direction",
                  direction.id,
                )
              }
              className={`rounded-2xl border p-4 text-center transition ${
                settings.direction ===
                direction.id
                  ? "border-sky-500 bg-sky-500/15"
                  : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"
              }`}
            >
              <div className="text-2xl">
                {direction.icon}
              </div>

              <div className="mt-2 text-sm font-black">
                {direction.name}
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Particle Controls"
          description="ปรับจำนวน ขนาด ความเร็ว และความโปร่งใส"
        />

        <div className="mt-5 space-y-6">
          <RangeControl
            label="Particle Count"
            value={
              settings.particleCount
            }
            min={1}
            max={80}
            suffix=""
            onChange={(value) =>
              onChange(
                "particleCount",
                value,
              )
            }
          />

          <RangeControl
            label="Minimum Size"
            value={settings.minSize}
            min={4}
            max={80}
            suffix=" px"
            onChange={(value) =>
              onChange(
                "minSize",
                Math.min(
                  value,
                  settings.maxSize,
                ),
              )
            }
          />

          <RangeControl
            label="Maximum Size"
            value={settings.maxSize}
            min={4}
            max={120}
            suffix=" px"
            onChange={(value) =>
              onChange(
                "maxSize",
                Math.max(
                  value,
                  settings.minSize,
                ),
              )
            }
          />

          <RangeControl
            label="Speed"
            value={settings.speed}
            min={10}
            max={100}
            suffix="%"
            onChange={(value) =>
              onChange("speed", value)
            }
          />

          <RangeControl
            label="Opacity"
            value={settings.opacity}
            min={10}
            max={100}
            suffix="%"
            onChange={(value) =>
              onChange("opacity", value)
            }
          />
        </div>
      </Card>

      <Card>
        <div className="space-y-4">
          <ToggleRow
            label="Glow"
            description="เพิ่มแสงฟุ้งรอบอนุภาค"
            enabled={settings.glow}
            onChange={(enabled) =>
              onChange("glow", enabled)
            }
          />

          <div className="border-t border-zinc-800" />

          <ToggleRow
            label="Random Rotation"
            description="หมุนอนุภาคแบบสุ่มเพื่อให้ดูเป็นธรรมชาติ"
            enabled={
              settings.randomRotation
            }
            onChange={(enabled) =>
              onChange(
                "randomRotation",
                enabled,
              )
            }
          />

          <div className="border-t border-zinc-800" />

          <ToggleRow
            label="Animation"
            description="เปิดการเคลื่อนไหวของอนุภาค"
            enabled={settings.animation}
            onChange={(enabled) =>
              onChange(
                "animation",
                enabled,
              )
            }
          />

          <div className="border-t border-zinc-800" />

          <ToggleRow
            label="Smooth Transition"
            description="เปลี่ยนค่าต่าง ๆ อย่างนุ่มนวล"
            enabled={settings.smooth}
            onChange={(enabled) =>
              onChange(
                "smooth",
                enabled,
              )
            }
          />
        </div>
      </Card>
    </div>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-xl font-black">
        {title}
      </h2>

      <p className="mt-1 text-sm text-zinc-400">
        {description}
      </p>
    </div>
  );
}

function ColorControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-bold text-zinc-300">
        {label}
      </div>

      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="h-12 w-16 cursor-pointer rounded-xl border border-zinc-700 bg-zinc-950 p-1"
        />

        <input
          type="text"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-black uppercase outline-none transition focus:border-sky-500"
        />
      </div>
    </label>
  );
}

function RangeControl({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <div className="mb-3 flex items-center justify-between gap-4">
        <span className="text-sm font-bold text-zinc-300">
          {label}
        </span>

        <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-black text-sky-200">
          {value}
          {suffix}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) =>
          onChange(
            Number(
              event.target.value,
            ),
          )
        }
        className="w-full accent-sky-500"
      />
    </label>
  );
}

function ToggleRow({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="font-black">
          {label}
        </div>

        <div className="mt-1 text-xs text-zinc-400">
          {description}
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          onChange(!enabled)
        }
        aria-pressed={enabled}
        className={`relative h-8 w-14 shrink-0 rounded-full transition ${
          enabled
            ? "bg-sky-600"
            : "bg-zinc-700"
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
            enabled
              ? "left-7"
              : "left-1"
          }`}
        />
      </button>
    </div>
  );
}