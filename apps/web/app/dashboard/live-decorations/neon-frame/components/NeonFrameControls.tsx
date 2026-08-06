"use client";

import { Card } from "@/components/ui/Card";
import type {
  CanvasMode,
  NeonFramePreset,
  NeonFrameSettings,
  NeonFrameStyle,
} from "../types";

type Props = {
  settings: NeonFrameSettings;
  onChange: <K extends keyof NeonFrameSettings>(
    key: K,
    value: NeonFrameSettings[K],
  ) => void;
  onApplyPreset: (
    preset: Exclude<NeonFramePreset, "custom">,
    values: Partial<NeonFrameSettings>,
  ) => void;
};

const FRAME_STYLES: Array<{
  id: NeonFrameStyle;
  name: string;
  description: string;
  icon: string;
}> = [
  {
    id: "soft-neon",
    name: "Soft Neon",
    description: "กรอบนีออนนุ่ม เหมาะกับไลฟ์ทั่วไป",
    icon: "✨",
  },
  {
    id: "double-line",
    name: "Double Line",
    description: "กรอบสองชั้น ดูคมและเด่นขึ้น",
    icon: "🟪",
  },
  {
    id: "corner-glow",
    name: "Corner Glow",
    description: "แสดงเฉพาะมุม ไม่บังพื้นที่กลางจอ",
    icon: "◱",
  },
  {
    id: "gaming-rgb",
    name: "Gaming RGB",
    description: "กรอบหลายสีสำหรับเกมและสตรีม",
    icon: "🎮",
  },
  {
    id: "rounded-frame",
    name: "Rounded Frame",
    description: "กรอบมนสองสี ดูนุ่มและทันสมัย",
    icon: "💜",
  },
];

const PRESETS: Array<{
  id: Exclude<NeonFramePreset, "custom">;
  name: string;
  icon: string;
  values: Partial<NeonFrameSettings>;
}> = [
  {
    id: "tiktok-pink",
    name: "TikTok Pink",
    icon: "🩷",
    values: {
      frameStyle: "soft-neon",
      primaryColor: "#ff2d95",
      secondaryColor: "#a855f7",
      thickness: 8,
      blur: 28,
      opacity: 88,
      borderRadius: 36,
    },
  },
  {
    id: "cyber-purple",
    name: "Cyber Purple",
    icon: "💜",
    values: {
      frameStyle: "double-line",
      primaryColor: "#7c3aed",
      secondaryColor: "#22d3ee",
      thickness: 7,
      blur: 30,
      opacity: 90,
      borderRadius: 28,
    },
  },
  {
    id: "ice-blue",
    name: "Ice Blue",
    icon: "🩵",
    values: {
      frameStyle: "corner-glow",
      primaryColor: "#38bdf8",
      secondaryColor: "#a5f3fc",
      thickness: 9,
      blur: 26,
      opacity: 86,
      borderRadius: 30,
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    icon: "🌅",
    values: {
      frameStyle: "rounded-frame",
      primaryColor: "#fb7185",
      secondaryColor: "#f59e0b",
      thickness: 8,
      blur: 30,
      opacity: 88,
      borderRadius: 42,
    },
  },
  {
    id: "gaming-rgb",
    name: "Gaming RGB",
    icon: "🌈",
    values: {
      frameStyle: "gaming-rgb",
      primaryColor: "#22d3ee",
      secondaryColor: "#a855f7",
      thickness: 10,
      blur: 34,
      opacity: 92,
      borderRadius: 24,
      animation: true,
    },
  },
];

export function NeonFrameControls({
  settings,
  onChange,
  onApplyPreset,
}: Props) {
  return (
    <div className="space-y-6">
      <Card>
        <ToggleRow
          label="Enable Neon Frame"
          description="เปิดหรือปิดกรอบนีออนใน Overlay"
          enabled={settings.enabled}
          onChange={(enabled) =>
            onChange("enabled", enabled)
          }
        />
      </Card>

      <Card>
        <SectionTitle
          title="Presets"
          description="เลือกชุดสำเร็จรูปแล้วปรับต่อได้"
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {PRESETS.map((preset) => {
            const selected =
              settings.preset === preset.id;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  onApplyPreset(
                    preset.id,
                    preset.values,
                  )
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  selected
                    ? "border-fuchsia-500 bg-fuchsia-500/15"
                    : "border-zinc-800 bg-zinc-950 hover:border-fuchsia-500/50"
                }`}
              >
                <div className="text-2xl">
                  {preset.icon}
                </div>
                <div className="mt-2 font-black">
                  {preset.name}
                </div>
              </button>
            );
          })}
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
              ["portrait", "📱", "Portrait"],
              ["landscape", "🖥️", "Landscape"],
            ] as const
          ).map(([mode, icon, label]) => (
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
                settings.canvasMode === mode
                  ? "border-fuchsia-500 bg-fuchsia-500/15"
                  : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"
              }`}
            >
              <div className="text-2xl">{icon}</div>
              <div className="mt-2 font-black">
                {label}
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Frame Style"
          description="เลือกรูปแบบของกรอบ"
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {FRAME_STYLES.map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() =>
                onChange(
                  "frameStyle",
                  style.id,
                )
              }
              className={`rounded-2xl border p-4 text-left transition ${
                settings.frameStyle === style.id
                  ? "border-fuchsia-500 bg-fuchsia-500/15"
                  : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"
              }`}
            >
              <div className="text-2xl">{style.icon}</div>
              <div className="mt-2 font-black">
                {style.name}
              </div>
              <div className="mt-1 text-xs leading-5 text-zinc-400">
                {style.description}
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Frame Colors"
          description="ปรับสีหลักและสีรอง"
        />

        <div className="mt-5 space-y-5">
          <ColorControl
            label="Primary Color"
            value={settings.primaryColor}
            onChange={(value) =>
              onChange("primaryColor", value)
            }
          />

          <ColorControl
            label="Secondary Color"
            value={settings.secondaryColor}
            onChange={(value) =>
              onChange("secondaryColor", value)
            }
          />
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Frame Controls"
          description="ปรับความหนา ความฟุ้ง และรูปทรง"
        />

        <div className="mt-5 space-y-6">
          <RangeControl
            label="Thickness"
            value={settings.thickness}
            min={1}
            max={24}
            suffix=" px"
            onChange={(value) =>
              onChange("thickness", value)
            }
          />

          <RangeControl
            label="Glow / Blur"
            value={settings.blur}
            min={0}
            max={80}
            suffix=" px"
            onChange={(value) =>
              onChange("blur", value)
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

          <RangeControl
            label="Border Radius"
            value={settings.borderRadius}
            min={0}
            max={100}
            suffix=" px"
            onChange={(value) =>
              onChange("borderRadius", value)
            }
          />

          <RangeControl
            label="Animation Speed"
            value={settings.speed}
            min={10}
            max={100}
            suffix="%"
            onChange={(value) =>
              onChange("speed", value)
            }
          />
        </div>
      </Card>

      <Card>
        <div className="space-y-4">
          <ToggleRow
            label="Animation"
            description="เปิดการเคลื่อนไหวของกรอบ"
            enabled={settings.animation}
            onChange={(enabled) =>
              onChange("animation", enabled)
            }
          />

          <div className="border-t border-zinc-800" />

          <ToggleRow
            label="Smooth Transition"
            description="เปลี่ยนค่าต่าง ๆ อย่างนุ่มนวล"
            enabled={settings.smooth}
            onChange={(enabled) =>
              onChange("smooth", enabled)
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
      <h2 className="text-xl font-black">{title}</h2>
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
          className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-black uppercase outline-none transition focus:border-fuchsia-500"
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

        <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-black text-fuchsia-200">
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
          onChange(Number(event.target.value))
        }
        className="w-full accent-fuchsia-500"
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
        <div className="font-black">{label}</div>
        <div className="mt-1 text-xs text-zinc-400">
          {description}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange(!enabled)}
        aria-pressed={enabled}
        className={`relative h-8 w-14 shrink-0 rounded-full transition ${
          enabled
            ? "bg-fuchsia-600"
            : "bg-zinc-700"
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
            enabled ? "left-7" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}