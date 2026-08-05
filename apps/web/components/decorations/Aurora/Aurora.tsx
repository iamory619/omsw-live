"use client";

import type { CSSProperties } from "react";

export type AuroraProps = {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  opacity?: number;
  blur?: number;
  speed?: number;
  intensity?: number;
  animated?: boolean;
  className?: string;
};

const DEFAULT_PRIMARY_COLOR = "#52f7d4";
const DEFAULT_SECONDARY_COLOR = "#7c3aed";
const DEFAULT_ACCENT_COLOR = "#38bdf8";

export function Aurora({
  primaryColor = DEFAULT_PRIMARY_COLOR,
  secondaryColor = DEFAULT_SECONDARY_COLOR,
  accentColor = DEFAULT_ACCENT_COLOR,
  opacity = 0.7,
  blur = 90,
  speed = 10,
  intensity = 1,
  animated = true,
  className = "",
}: AuroraProps) {
  const safeOpacity = clamp(opacity, 0, 1);
  const safeBlur = clamp(blur, 20, 220);
  const safeSpeed = clamp(speed, 3, 30);
  const safeIntensity = clamp(intensity, 0.2, 1.8);

  const style = {
    "--aurora-primary": primaryColor,
    "--aurora-secondary": secondaryColor,
    "--aurora-accent": accentColor,
    "--aurora-opacity": safeOpacity,
    "--aurora-blur": `${safeBlur}px`,
    "--aurora-speed": `${safeSpeed}s`,
    "--aurora-intensity": safeIntensity,
  } as CSSProperties;

  return (
    <div
      aria-hidden="true"
      className={[
        "aurora-effect",
        "pointer-events-none",
        "absolute",
        "inset-0",
        "overflow-hidden",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      <div
        className={[
          "aurora-effect__sheet",
          "aurora-effect__sheet--one",
          animated ? "aurora-effect__sheet--animated" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      />

      <div
        className={[
          "aurora-effect__sheet",
          "aurora-effect__sheet--two",
          animated
            ? "aurora-effect__sheet--animated-reverse"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
      />

      <div
        className={[
          "aurora-effect__sheet",
          "aurora-effect__sheet--three",
          animated
            ? "aurora-effect__sheet--animated-slow"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
      />

      <div className="aurora-effect__glow aurora-effect__glow--left" />
      <div className="aurora-effect__glow aurora-effect__glow--right" />
      <div className="aurora-effect__vignette" />
    </div>
  );
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  if (!Number.isFinite(value)) {
    return minimum;
  }

  return Math.min(Math.max(value, minimum), maximum);
}