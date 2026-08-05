"use client";

import { Card } from "@/components/ui/Card";
import { ToggleRow } from "./Controls";
import { SectionToggle } from "./SectionToggle";

export function MotionSection({
  open,
  animation,
  smooth,
  onToggle,
  onAnimationChange,
  onSmoothChange,
}: {
  open: boolean;
  animation: boolean;
  smooth: boolean;
  onToggle: () => void;
  onAnimationChange: (value: boolean) => void;
  onSmoothChange: (value: boolean) => void;
}) {
  return (
    <Card>
      <SectionToggle
        title="Animation"
        description="เปิดปิดการเคลื่อนไหวและความนุ่มของแสง"
        open={open}
        onClick={onToggle}
      />

      {open && (
        <div className="mt-5 space-y-4">
          <ToggleRow
            label="Enable Animation"
            description="Animate the lighting effect."
            enabled={animation}
            onChange={onAnimationChange}
          />

          <div className="border-t border-zinc-800" />

          <ToggleRow
            label="Smooth Transition"
            description="Use softer transitions between movements."
            enabled={smooth}
            onChange={onSmoothChange}
          />
        </div>
      )}
    </Card>
  );
}
