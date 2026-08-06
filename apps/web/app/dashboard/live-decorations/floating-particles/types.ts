"use client";

export type CanvasMode =
  | "portrait"
  | "landscape";

export type ParticleType =
  | "stars"
  | "hearts"
  | "sparkles"
  | "snow"
  | "sakura"
  | "leaves"
  | "confetti"
  | "coins"
  | "bubbles";

export type ParticleDirection =
  | "down"
  | "up"
  | "left"
  | "right"
  | "float";

export type FloatingParticlesPreset =
  | "custom"
  | "pink-hearts"
  | "gold-stars"
  | "magic-sparkles"
  | "winter-snow"
  | "sakura-dream"
  | "gaming-confetti";

export type FloatingParticlesSettings = {
  enabled: boolean;
  preset: FloatingParticlesPreset;
  canvasMode: CanvasMode;
  particleType: ParticleType;
  primaryColor: string;
  secondaryColor: string;
  particleCount: number;
  minSize: number;
  maxSize: number;
  speed: number;
  opacity: number;
  direction: ParticleDirection;
  glow: boolean;
  randomRotation: boolean;
  animation: boolean;
  smooth: boolean;
};

export type FloatingParticlesSettingsRow = {
  user_id: string;
  enabled: boolean;
  preset: string | null;
  canvas_mode: string | null;
  particle_type: string | null;
  primary_color: string;
  secondary_color: string;
  particle_count: number;
  min_size: number;
  max_size: number;
  speed: number;
  opacity: number;
  direction: string | null;
  glow: boolean;
  random_rotation: boolean;
  animation: boolean;
  smooth: boolean;
};

export type ParticleTypeOption = {
  id: ParticleType;
  name: string;
  description: string;
  icon: string;
};

export type FloatingParticlesPresetOption = {
  id: Exclude<
    FloatingParticlesPreset,
    "custom"
  >;
  name: string;
  description: string;
  icon: string;
  settings: Partial<FloatingParticlesSettings>;
};
