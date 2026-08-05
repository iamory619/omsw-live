"use client";

import { Card } from "@/components/ui/Card";
import type {
  LightLayer,
  PresetId,
  RoomLightSettings,
  SettingsSectionId,
} from "../types";
import { CanvasSection } from "./CanvasSection";
import { ColorsSection } from "./ColorsSection";
import { ControlsSection } from "./ControlsSection";
import { LightingStyleSection } from "./LightingStyleSection";
import { MotionSection } from "./MotionSection";
import { MultipleLightsSection } from "./MultipleLightsSection";
import { PlacementSection } from "./PlacementSection";
import { PresetsSection } from "./PresetsSection";

type Props = {
  settings: RoomLightSettings;
  openSection: SettingsSectionId;
  onOpenSection: (section: SettingsSectionId) => void;
  onUpdateSetting: <K extends keyof RoomLightSettings>(
    key: K,
    value: RoomLightSettings[K],
  ) => void;
  onUpdateLight: (
    lightId: LightLayer["id"],
    patch: Partial<LightLayer>,
  ) => void;
  onApplyPreset: (
    presetId: Exclude<PresetId, "custom">,
    presetSettings: Partial<RoomLightSettings>,
  ) => void;
};

export function SettingsAccordion({
  settings,
  openSection,
  onOpenSection,
  onUpdateSetting,
  onUpdateLight,
  onApplyPreset,
}: Props) {
  const toggle = (section: SettingsSectionId) => {
    onOpenSection(section);
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black">Enable Room Light</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Turn the overlay lighting on or off.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              onUpdateSetting("enabled", !settings.enabled)
            }
            aria-pressed={settings.enabled}
            className={`relative h-8 w-14 rounded-full transition ${
              settings.enabled ? "bg-pink-600" : "bg-zinc-700"
            }`}
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
                settings.enabled ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>
      </Card>

      <PresetsSection
        open={openSection === "presets"}
        settings={settings}
        onToggle={() => toggle("presets")}
        onApply={onApplyPreset}
      />

      <CanvasSection
        open={openSection === "canvas"}
        value={settings.canvasMode}
        onToggle={() => toggle("canvas")}
        onChange={(value) =>
          onUpdateSetting("canvasMode", value)
        }
      />

      <PlacementSection
        open={openSection === "placement"}
        value={settings.placement}
        onToggle={() => toggle("placement")}
        onChange={(value) =>
          onUpdateSetting("placement", value)
        }
      />

      <MultipleLightsSection
        open={openSection === "multiple"}
        enabled={settings.multiLightEnabled}
        lights={settings.lights}
        onToggleSection={() => toggle("multiple")}
        onToggleEnabled={(value) =>
          onUpdateSetting("multiLightEnabled", value)
        }
        onUpdateLight={onUpdateLight}
      />

      <LightingStyleSection
        open={openSection === "style"}
        value={settings.effect}
        onToggle={() => toggle("style")}
        onChange={(value) =>
          onUpdateSetting("effect", value)
        }
      />

      <ColorsSection
        open={openSection === "colors"}
        primaryColor={settings.primaryColor}
        secondaryColor={settings.secondaryColor}
        onToggle={() => toggle("colors")}
        onPrimaryChange={(value) =>
          onUpdateSetting("primaryColor", value)
        }
        onSecondaryChange={(value) =>
          onUpdateSetting("secondaryColor", value)
        }
      />

      <ControlsSection
        open={openSection === "controls"}
        intensity={settings.intensity}
        blur={settings.blur}
        speed={settings.speed}
        opacity={settings.opacity}
        onToggle={() => toggle("controls")}
        onIntensityChange={(value) =>
          onUpdateSetting("intensity", value)
        }
        onBlurChange={(value) =>
          onUpdateSetting("blur", value)
        }
        onSpeedChange={(value) =>
          onUpdateSetting("speed", value)
        }
        onOpacityChange={(value) =>
          onUpdateSetting("opacity", value)
        }
      />

      <MotionSection
        open={openSection === "motion"}
        animation={settings.animation}
        smooth={settings.smooth}
        onToggle={() => toggle("motion")}
        onAnimationChange={(value) =>
          onUpdateSetting("animation", value)
        }
        onSmoothChange={(value) =>
          onUpdateSetting("smooth", value)
        }
      />
    </div>
  );
}
