"use client";

import type {
  CanvasMode,
  LightEffect,
  LightPlacement,
} from "@/app/dashboard/live-decorations/room-light/types";

type GlowLightProps = {
  effect: LightEffect;
  canvasMode: CanvasMode;
  placement: LightPlacement;
  primaryColor: string;
  secondaryColor: string;
  intensity: number;
  blur: number;
  opacity: number;
  speed: number;
  animation: boolean;
  smooth: boolean;
};

export function GlowLight({
  effect,
  canvasMode,
  placement,
  primaryColor,
  secondaryColor,
  intensity,
  blur,
  opacity,
  speed: _speed,
  animation: _animation,
  smooth,
}: GlowLightProps) {
  const safeOpacity = clamp((opacity / 100) * (intensity / 100), 0, 1);

  const position = getPlacementPosition(canvasMode, placement);

  const transition = smooth
    ? "left 700ms ease, top 700ms ease, width 700ms ease, height 700ms ease, filter 700ms ease, opacity 700ms ease"
    : undefined;

  if (effect === "stage-light") {
    const beamSize = getBeamSize(canvasMode);

    return (
      <div className="pointer-events-none absolute inset-0 z-20">
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 -rotate-[10deg]"
          style={{
            left:
              placement === "center"
                ? canvasMode === "portrait"
                  ? "34%"
                  : "38%"
                : position.left,
            top: placement === "bottom" ? "58%" : position.top,
            width: beamSize.width,
            height: beamSize.height,
            background: `linear-gradient(
              to bottom,
              ${hexToRgba(primaryColor, safeOpacity * 0.52)} 0%,
              ${hexToRgba(primaryColor, safeOpacity * 0.22)} 34%,
              transparent 82%
            )`,
            filter: `blur(${Math.max(18, blur * 0.55)}px)`,
            mixBlendMode: "screen",
            transition,
          }}
        />

        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 rotate-[10deg]"
          style={{
            left:
              placement === "center"
                ? canvasMode === "portrait"
                  ? "66%"
                  : "62%"
                : mirrorPercent(position.left),
            top: placement === "bottom" ? "58%" : position.top,
            width: beamSize.width,
            height: beamSize.height,
            background: `linear-gradient(
              to bottom,
              ${hexToRgba(secondaryColor, safeOpacity * 0.52)} 0%,
              ${hexToRgba(secondaryColor, safeOpacity * 0.22)} 34%,
              transparent 82%
            )`,
            filter: `blur(${Math.max(18, blur * 0.55)}px)`,
            mixBlendMode: "screen",
            transition,
          }}
        />
      </div>
    );
  }

  if (effect === "rgb-studio") {
    const size = getEdgeGlowSize(canvasMode);

    return (
      <div className="pointer-events-none absolute inset-0 z-20">
        <SoftGlowStrip
          color={primaryColor}
          opacity={safeOpacity * 0.58}
          blur={blur}
          left={
            placement === "center"
              ? canvasMode === "portrait"
                ? "20%"
                : "16%"
              : position.left
          }
          top={position.top}
          width={size.width}
          height={size.height}
          transition={transition}
        />

        <SoftGlowStrip
          color={secondaryColor}
          opacity={safeOpacity * 0.58}
          blur={blur}
          left={
            placement === "center"
              ? canvasMode === "portrait"
                ? "80%"
                : "84%"
              : mirrorPercent(position.left)
          }
          top={position.top}
          width={size.width}
          height={size.height}
          transition={transition}
        />
      </div>
    );
  }

  if (effect === "streamer-room") {
    const sideSize = getStreamerGlowSize(canvasMode);

    return (
      <div className="pointer-events-none absolute inset-0 z-20">
        <SoftGlowStrip
          color={primaryColor}
          opacity={safeOpacity * 0.46}
          blur={blur}
          left={
            placement === "center"
              ? canvasMode === "portrait"
                ? "28%"
                : "24%"
              : position.left
          }
          top={
            placement === "top"
              ? canvasMode === "portrait"
                ? "22%"
                : "18%"
              : position.top
          }
          width={sideSize.width}
          height={sideSize.height}
          transition={transition}
        />

        <SoftGlowStrip
          color={secondaryColor}
          opacity={safeOpacity * 0.46}
          blur={blur}
          left={
            placement === "center"
              ? canvasMode === "portrait"
                ? "72%"
                : "76%"
              : mirrorPercent(position.left)
          }
          top={
            placement === "bottom"
              ? canvasMode === "portrait"
                ? "78%"
                : "82%"
              : position.top
          }
          width={sideSize.width}
          height={sideSize.height}
          transition={transition}
        />

        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-[999px]"
          style={{
            left: "50%",
            top: canvasMode === "portrait" ? "84%" : "88%",
            width: canvasMode === "portrait" ? "92%" : "72%",
            height: canvasMode === "portrait" ? "12%" : "16%",
            background: `linear-gradient(
              90deg,
              transparent 0%,
              ${hexToRgba(primaryColor, safeOpacity * 0.26)} 26%,
              ${hexToRgba(secondaryColor, safeOpacity * 0.26)} 74%,
              transparent 100%
            )`,
            filter: `blur(${Math.max(20, blur * 0.72)}px)`,
            mixBlendMode: "screen",
            transition,
          }}
        />
      </div>
    );
  }

  const softboxSize = getSoftboxSize(canvasMode);
  const softboxTop = getSoftboxTop(canvasMode, placement);

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-[50%]"
        style={{
          left: "50%",
          top:
            placement === "top"
              ? "16%"
              : placement === "bottom"
                ? "84%"
                : "20%",
          width: softboxSize.width,
          height: softboxSize.height,
          background: `
            radial-gradient(
              ellipse at 32% 34%,
              ${hexToRgba(primaryColor, safeOpacity)} 0%,
              ${hexToRgba(primaryColor, safeOpacity * 0.88)} 28%,
              ${hexToRgba(primaryColor, safeOpacity * 0.36)} 56%,
              ${hexToRgba(primaryColor, safeOpacity * 0.1)} 72%,
              transparent 90%
            ),
            radial-gradient(
              ellipse at 68% 34%,
              ${hexToRgba(secondaryColor, safeOpacity)} 0%,
              ${hexToRgba(secondaryColor, safeOpacity * 0.88)} 28%,
              ${hexToRgba(secondaryColor, safeOpacity * 0.36)} 56%,
              ${hexToRgba(secondaryColor, safeOpacity * 0.1)} 72%,
              transparent 90%
            ),
            radial-gradient(
              ellipse at 50% 46%,
              ${hexToRgba(primaryColor, safeOpacity * 0.24)} 0%,
              ${hexToRgba(secondaryColor, safeOpacity * 0.22)} 34%,
              transparent 76%
            ),
            linear-gradient(
              180deg,
              ${hexToRgba(primaryColor, safeOpacity * 0.2)} 0%,
              ${hexToRgba(secondaryColor, safeOpacity * 0.18)} 46%,
              transparent 100%
            )
          `,
          filter: `blur(${Math.max(48, blur * 0.82)}px)`,
          opacity: 1,
          transition,
        }}
      />
    </div>
  );
}

function SoftGlowStrip({
  color,
  opacity,
  blur,
  left,
  top,
  width,
  height,
  transition,
}: {
  color: string;
  opacity: number;
  blur: number;
  left: string;
  top: string;
  width: string;
  height: string;
  transition?: string;
}) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 rounded-[999px]"
      style={{
        left,
        top,
        width,
        height,
        background: `linear-gradient(
          90deg,
          transparent 0%,
          ${hexToRgba(color, opacity * 0.18)} 18%,
          ${hexToRgba(color, opacity * 0.52)} 48%,
          ${hexToRgba(color, opacity * 0.18)} 82%,
          transparent 100%
        )`,
        filter: `blur(${Math.max(20, blur * 0.8)}px)`,
        mixBlendMode: "screen",
        transition,
      }}
    />
  );
}

function getPlacementPosition(
  canvasMode: CanvasMode,
  placement: LightPlacement,
): { left: string; top: string } {
  const portrait = canvasMode === "portrait";

  if (placement === "left") {
    return {
      left: portrait ? "22%" : "18%",
      top: "50%",
    };
  }

  if (placement === "right") {
    return {
      left: portrait ? "78%" : "82%",
      top: "50%",
    };
  }

  if (placement === "top") {
    return {
      left: "50%",
      top: portrait ? "20%" : "18%",
    };
  }

  if (placement === "bottom") {
    return {
      left: "50%",
      top: portrait ? "80%" : "82%",
    };
  }

  return {
    left: "50%",
    top: "50%",
  };
}

function getSoftboxSize(canvasMode: CanvasMode): {
  width: string;
  height: string;
} {
  return canvasMode === "portrait"
    ? {
        width: "165%",
        height: "60%",
      }
    : {
        width: "132%",
        height: "58%",
      };
}

function getSoftboxTop(
  canvasMode: CanvasMode,
  placement: LightPlacement,
): string {
  const portrait = canvasMode === "portrait";

  if (placement === "bottom") {
    return portrait ? "82%" : "80%";
  }

  if (placement === "left") {
    return portrait ? "50%" : "50%";
  }

  if (placement === "right") {
    return portrait ? "50%" : "50%";
  }

  return portrait ? "20%" : "18%";
}

function getEdgeGlowSize(canvasMode: CanvasMode): {
  width: string;
  height: string;
} {
  return canvasMode === "portrait"
    ? { width: "48%", height: "22%" }
    : { width: "34%", height: "34%" };
}

function getStreamerGlowSize(canvasMode: CanvasMode): {
  width: string;
  height: string;
} {
  return canvasMode === "portrait"
    ? { width: "54%", height: "20%" }
    : { width: "38%", height: "28%" };
}

function getBeamSize(canvasMode: CanvasMode): {
  width: string;
  height: string;
} {
  return canvasMode === "portrait"
    ? { width: "28%", height: "82%" }
    : { width: "20%", height: "92%" };
}

function mirrorPercent(value: string): string {
  const numeric = Number.parseFloat(value);

  if (!Number.isFinite(numeric)) {
    return value;
  }

  return `${100 - numeric}%`;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function hexToRgba(hex: string, alpha: number): string {
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

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${safeAlpha})`;
}
