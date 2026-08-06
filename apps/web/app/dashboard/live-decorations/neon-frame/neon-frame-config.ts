import type {
  NeonFrameSettings,
} from "./types";

export const DEFAULT_NEON_FRAME_SETTINGS: NeonFrameSettings = {
  enabled: true,
  preset: "custom",
  canvasMode: "portrait",
  frameStyle: "soft-neon",
  primaryColor: "#ff2d95",
  secondaryColor: "#7c3aed",
  thickness: 8,
  blur: 24,
  opacity: 80,
  speed: 45,
  borderRadius: 32,
  animation: true,
  smooth: true,
};