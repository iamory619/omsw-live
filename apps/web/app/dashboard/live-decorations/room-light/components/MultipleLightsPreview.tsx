"use client";

import type {
  CanvasMode,
  LightLayer,
  LightPlacement,
} from "../types";

type Props = {
  lights: LightLayer[];
  canvasMode: CanvasMode;
  animation: boolean;
  speed: number;
  smooth: boolean;
};

export function MultipleLightsPreview({
  lights,
  canvasMode,
  animation: _animation,
  speed: _speed,
  smooth,
}: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {lights
        .filter((light) => light.enabled)
        .map((light) => {
          const position = getLightPosition(
            canvasMode,
            light.placement,
          );

          const opacity = clamp(
            light.intensity / 100,
            0,
            1,
          );

          const size = getLightSize(
            canvasMode,
            light.size,
            light.placement,
          );

          return (
            <div
              key={light.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-[999px]"
              style={{
                left: position.left,
                top: position.top,
                width: size.width,
                height: size.height,
                background: getSoftLightBackground(
                  light.color,
                  opacity,
                  light.placement,
                ),
                filter: `blur(${Math.max(
                  20,
                  light.blur * 0.82,
                )}px)`,
                mixBlendMode: "screen",
                transition: smooth
                  ? "left 700ms ease, top 700ms ease, width 700ms ease, height 700ms ease, filter 700ms ease, opacity 700ms ease"
                  : undefined,
              }}
            />
          );
        })}
    </div>
  );
}

function getSoftLightBackground(
  color: string,
  opacity: number,
  placement: LightPlacement,
): string {
  if (
    placement === "left" ||
    placement === "right"
  ) {
    return `linear-gradient(
      180deg,
      transparent 0%,
      ${hexToRgba(color, opacity * 0.12)} 18%,
      ${hexToRgba(color, opacity * 0.42)} 48%,
      ${hexToRgba(color, opacity * 0.14)} 82%,
      transparent 100%
    )`;
  }

  return `linear-gradient(
    90deg,
    transparent 0%,
    ${hexToRgba(color, opacity * 0.12)} 18%,
    ${hexToRgba(color, opacity * 0.42)} 48%,
    ${hexToRgba(color, opacity * 0.14)} 82%,
    transparent 100%
  )`;
}

function getLightPosition(
  canvasMode: CanvasMode,
  placement: LightPlacement,
): { left: string; top: string } {
  const portrait = canvasMode === "portrait";

  if (placement === "left") {
    return {
      left: portrait ? "18%" : "14%",
      top: "50%",
    };
  }

  if (placement === "right") {
    return {
      left: portrait ? "82%" : "86%",
      top: "50%",
    };
  }

  if (placement === "top") {
    return {
      left: "50%",
      top: portrait ? "18%" : "14%",
    };
  }

  if (placement === "bottom") {
    return {
      left: "50%",
      top: portrait ? "82%" : "86%",
    };
  }

  return {
    left: "50%",
    top: "50%",
  };
}

function getLightSize(
  canvasMode: CanvasMode,
  size: number,
  placement: LightPlacement,
): { width: string; height: string } {
  const portrait = canvasMode === "portrait";
  const normalized = clamp(size, 30, 140);

  if (
    placement === "left" ||
    placement === "right"
  ) {
    return {
      width: `${Math.max(
        20,
        normalized * (portrait ? 0.52 : 0.42),
      )}%`,
      height: `${Math.max(
        40,
        normalized * (portrait ? 1.1 : 0.82),
      )}%`,
    };
  }

  return {
    width: `${Math.max(
      54,
      normalized * (portrait ? 1.18 : 0.92),
    )}%`,
    height: `${Math.max(
      12,
      normalized * (portrait ? 0.24 : 0.3),
    )}%`,
  };
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function hexToRgba(
  hex: string,
  alpha: number,
): string {
  const cleanHex = hex.replace("#", "").trim();

  const normalized =
    cleanHex.length === 3
      ? cleanHex
          .split("")
          .map((character) => character + character)
          .join("")
      : cleanHex;

  const safeAlpha = clamp(alpha, 0, 1);

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return `rgba(255, 255, 255, ${safeAlpha})`;
  }

  const red = Number.parseInt(
    normalized.slice(0, 2),
    16,
  );
  const green = Number.parseInt(
    normalized.slice(2, 4),
    16,
  );
  const blue = Number.parseInt(
    normalized.slice(4, 6),
    16,
  );

  return `rgba(${red}, ${green}, ${blue}, ${safeAlpha})`;
}