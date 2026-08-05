"use client";

import { Card } from "@/components/ui/Card";
import { ColorControl } from "./Controls";
import { SectionToggle } from "./SectionToggle";

export function ColorsSection({
  open,
  primaryColor,
  secondaryColor,
  onToggle,
  onPrimaryChange,
  onSecondaryChange,
}: {
  open: boolean;
  primaryColor: string;
  secondaryColor: string;
  onToggle: () => void;
  onPrimaryChange: (value: string) => void;
  onSecondaryChange: (value: string) => void;
}) {
  return (
    <Card>
      <SectionToggle
        title="Light Colors"
        description="ปรับสีหลักและสีรองของเอฟเฟกต์"
        open={open}
        onClick={onToggle}
      />

      {open && (
        <div className="mt-5 space-y-5">
          <ColorControl
            label="Primary Color"
            value={primaryColor}
            onChange={onPrimaryChange}
          />

          <ColorControl
            label="Secondary Color"
            value={secondaryColor}
            onChange={onSecondaryChange}
          />
        </div>
      )}
    </Card>
  );
}
