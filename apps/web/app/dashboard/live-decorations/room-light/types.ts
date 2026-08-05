export type LightEffect =
  | "studio-softbox"
  | "rgb-studio"
  | "streamer-room"
  | "stage-light"
  | "aurora";

export type PresetId =
  | "custom"
  | "tiktok-pink"
  | "gaming-neon"
  | "warm-studio"
  | "cool-blue"
  | "concert-stage"
  | "aurora-blue"
  | "aurora-purple";

export type CanvasMode = "landscape" | "portrait";

export type LightPlacement =
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "center";

export type LightLayerId =
  | "light-1"
  | "light-2"
  | "light-3";

export type LightLayer = {
  id: LightLayerId;
  enabled: boolean;
  color: string;
  placement: LightPlacement;
  intensity: number;
  blur: number;
  size: number;
};

export type RoomLightSettings = {
  enabled: boolean;
  preset: PresetId;
  canvasMode: CanvasMode;
  placement: LightPlacement;
  multiLightEnabled: boolean;
  lights: LightLayer[];
  effect: LightEffect;
  primaryColor: string;
  secondaryColor: string;
  intensity: number;
  blur: number;
  speed: number;
  opacity: number;
  animation: boolean;
  smooth: boolean;
};

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  overlay_id: string;
};

export type DecorationSettingsRow = {
  user_id: string;
  enabled: boolean;
  preset: string | null;
  canvas_mode: string | null;
  placement: string | null;
  multi_light_enabled: boolean | null;
  lights: unknown;
  effect: string;
  primary_color: string;
  secondary_color: string;
  intensity: number;
  blur: number;
  speed: number;
  opacity: number;
  animation: boolean;
  smooth: boolean;
};

export type EffectOption = {
  id: LightEffect;
  name: string;
  description: string;
  icon: string;
};

export type LightPreset = {
  id: Exclude<PresetId, "custom">;
  name: string;
  description: string;
  icon: string;
  settings: Partial<RoomLightSettings>;
};

export type SettingsSectionId =
  | "presets"
  | "canvas"
  | "placement"
  | "multiple"
  | "style"
  | "colors"
  | "controls"
  | "motion";
