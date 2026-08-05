"use client";

import { Card } from "@/components/ui/Card";
import { RangeControl } from "./Controls";
import { SectionToggle } from "./SectionToggle";

export function ControlsSection({
  open,
  intensity,
  blur,
  speed,
  opacity,
  onToggle,
  onIntensityChange,
  onBlurChange,
  onSpeedChange,
  onOpacityChange,
}: {
  open: boolean;
  intensity: number;
  blur: number;
  speed: number;
  opacity: number;
  onToggle: () => void;
  onIntensityChange: (value: number) => void;
  onBlurChange: (value: number) => void;
  onSpeedChange: (value: number) => void;
  onOpacityChange: (value: number) => void;
}) {
  return (
    <Card>
      <SectionToggle
        title="Light Controls"
        description="ปรับความแรง ความฟุ้ง ความเร็ว และความโปร่งใส"
        open={open}
        onClick={onToggle}
      />

      {open && (
        <div className="mt-5 space-y-6">
          <RangeControl
            label="Intensity"
            value={intensity}
            min={10}
            max={100}
            suffix="%"
            onChange={onIntensityChange}
          />

          <RangeControl
            label="Blur"
            value={blur}
            min={20}
            max={180}
            suffix=" px"
            onChange={onBlurChange}
          />

          <RangeControl
            label="Animation Speed"
            value={speed}
            min={10}
            max={100}
            suffix="%"
            onChange={onSpeedChange}
          />

          <RangeControl
            label="Opacity"
            value={opacity}
            min={10}
            max={100}
            suffix="%"
            onChange={onOpacityChange}
          />
        </div>
      )}
    </Card>
  );
}
