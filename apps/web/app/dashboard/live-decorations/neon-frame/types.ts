export type NeonFrameStyle =
  | "soft-neon"
  | "double-line"
  | "corner-glow"
  | "gaming-rgb"
  | "rounded-frame";

export type NeonFramePreset =
  | "custom"
  | "tiktok-pink"
  | "cyber-purple"
  | "ice-blue"
  | "sunset"
  | "gaming-rgb";

export type CanvasMode =
  | "portrait"
  | "landscape";

export type NeonFrameSettings = {
  enabled: boolean;
  preset: NeonFramePreset;
  canvasMode: CanvasMode;
  frameStyle: NeonFrameStyle;
  primaryColor: string;
  secondaryColor: string;
  thickness: number;
  blur: number;
  opacity: number;
  speed: number;
  borderRadius: number;
  animation: boolean;
  smooth: boolean;
};

export type NeonFrameSettingsRow = {
  user_id: string;
  enabled: boolean;
  preset: string | null;
  canvas_mode: string | null;
  frame_style: string | null;
  primary_color: string;
  secondary_color: string;
  thickness: number;
  blur: number;
  opacity: number;
  speed: number;
  border_radius: number;
  animation: boolean;
  smooth: boolean;
};

export type NeonFrameStyleOption = {
  id: NeonFrameStyle;
  name: string;
  description: string;
  icon: string;
};

export type NeonFramePresetOption = {
  id: Exclude<NeonFramePreset, "custom">;
  name: string;
  description: string;
  icon: string;
  settings: Partial<NeonFrameSettings>;
};