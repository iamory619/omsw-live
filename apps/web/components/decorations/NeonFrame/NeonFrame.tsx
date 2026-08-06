"use client";

import type { CSSProperties } from "react";
import type {
  NeonFrameSettings,
  NeonFrameStyle,
} from "@/app/dashboard/live-decorations/neon-frame/types";

type NeonFrameProps = {
  settings: NeonFrameSettings;
  className?: string;
};

type SafeFrameValues = {
  primaryColor: string;
  secondaryColor: string;
  thickness: number;
  blur: number;
  opacity: number;
  radius: number;
  duration: number;
};

export function NeonFrame({
  settings,
  className = "",
}: NeonFrameProps) {
  if (!settings.enabled) {
    return null;
  }

  const values: SafeFrameValues = {
    primaryColor: settings.primaryColor,
    secondaryColor: settings.secondaryColor,
    thickness: clamp(settings.thickness, 1, 40),
    blur: clamp(settings.blur, 0, 120),
    opacity: clamp(settings.opacity / 100, 0, 1),
    radius: clamp(settings.borderRadius, 0, 120),
    duration: getAnimationDuration(settings.speed),
  };

  return (
    <div
      aria-hidden="true"
      data-neon-frame-style={settings.frameStyle}
      data-canvas-mode={settings.canvasMode}
      className={[
        "pointer-events-none",
        "absolute",
        "inset-0",
        "z-30",
        "overflow-hidden",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <FrameRenderer
        style={settings.frameStyle}
        animation={settings.animation}
        smooth={settings.smooth}
        values={values}
      />
    </div>
  );
}

function FrameRenderer({
  style,
  animation,
  smooth,
  values,
}: {
  style: NeonFrameStyle;
  animation: boolean;
  smooth: boolean;
  values: SafeFrameValues;
}) {
  if (style === "double-line") {
    return (
      <DoubleLineFrame
        animation={animation}
        smooth={smooth}
        values={values}
      />
    );
  }

  if (style === "corner-glow") {
    return (
      <CornerGlowFrame
        animation={animation}
        smooth={smooth}
        values={values}
      />
    );
  }

  if (style === "gaming-rgb") {
    return (
      <GamingRgbFrame
        animation={animation}
        smooth={smooth}
        values={values}
      />
    );
  }

  if (style === "rounded-frame") {
    return (
      <RoundedFrame
        animation={animation}
        smooth={smooth}
        values={values}
      />
    );
  }

  return (
    <SoftNeonFrame
      animation={animation}
      smooth={smooth}
      values={values}
    />
  );
}

function SoftNeonFrame({
  animation,
  smooth,
  values,
}: {
  animation: boolean;
  smooth: boolean;
  values: SafeFrameValues;
}) {
  const {
    primaryColor,
    secondaryColor,
    thickness,
    blur,
    opacity,
    radius,
    duration,
  } = values;

  return (
    <>
      <div
        className="absolute inset-[3%]"
        style={{
          border: `${thickness}px solid ${primaryColor}`,
          borderRadius: `${radius}px`,
          opacity,
          boxShadow: `
            0 0 ${Math.max(4, blur * 0.35)}px ${primaryColor},
            0 0 ${Math.max(8, blur)}px ${primaryColor},
            inset 0 0 ${Math.max(4, blur * 0.65)}px ${secondaryColor}
          `,
          transition: smooth
            ? "all 700ms ease"
            : undefined,
          animation: animation
            ? `neonSoftPulse ${duration}s ease-in-out infinite`
            : undefined,
        }}
      />

      <div
        className="absolute inset-[3%]"
        style={{
          border: `1px solid ${mixWithWhite(
            secondaryColor,
            0.72,
          )}`,
          borderRadius: `${radius}px`,
          opacity: opacity * 0.72,
        }}
      />
    </>
  );
}

function DoubleLineFrame({
  animation,
  smooth,
  values,
}: {
  animation: boolean;
  smooth: boolean;
  values: SafeFrameValues;
}) {
  const {
    primaryColor,
    secondaryColor,
    thickness,
    blur,
    opacity,
    radius,
    duration,
  } = values;

  return (
    <>
      <div
        className="absolute inset-[3%]"
        style={{
          border: `${thickness}px solid ${primaryColor}`,
          borderRadius: `${radius}px`,
          opacity,
          boxShadow: `
            0 0 ${Math.max(4, blur * 0.45)}px ${primaryColor},
            0 0 ${Math.max(8, blur)}px ${primaryColor}
          `,
          transition: smooth
            ? "all 700ms ease"
            : undefined,
          animation: animation
            ? `neonLineFlow ${duration}s linear infinite`
            : undefined,
        }}
      />

      <div
        className="absolute inset-[5.5%]"
        style={{
          border: `${Math.max(
            1,
            thickness * 0.55,
          )}px solid ${secondaryColor}`,
          borderRadius: `${radius * 0.78}px`,
          opacity: opacity * 0.88,
          boxShadow: `
            0 0 ${Math.max(4, blur * 0.35)}px ${secondaryColor},
            inset 0 0 ${Math.max(4, blur * 0.45)}px ${secondaryColor}
          `,
        }}
      />
    </>
  );
}

function CornerGlowFrame({
  animation,
  smooth,
  values,
}: {
  animation: boolean;
  smooth: boolean;
  values: SafeFrameValues;
}) {
  const {
    primaryColor,
    secondaryColor,
    thickness,
    blur,
    opacity,
    radius,
    duration,
  } = values;

  const sharedStyle: CSSProperties = {
    width: "22%",
    height: "22%",
    opacity,
    filter: `drop-shadow(0 0 ${Math.max(
      5,
      blur * 0.55,
    )}px ${primaryColor})`,
    transition: smooth
      ? "all 700ms ease"
      : undefined,
    animation: animation
      ? `neonCornerPulse ${duration}s ease-in-out infinite`
      : undefined,
  };

  return (
    <>
      <div
        className="absolute left-[3%] top-[3%]"
        style={{
          ...sharedStyle,
          borderLeft: `${thickness}px solid ${primaryColor}`,
          borderTop: `${thickness}px solid ${primaryColor}`,
          borderTopLeftRadius: `${radius}px`,
        }}
      />

      <div
        className="absolute right-[3%] top-[3%]"
        style={{
          ...sharedStyle,
          borderRight: `${thickness}px solid ${secondaryColor}`,
          borderTop: `${thickness}px solid ${secondaryColor}`,
          borderTopRightRadius: `${radius}px`,
          animationDelay: "-0.35s",
        }}
      />

      <div
        className="absolute bottom-[3%] left-[3%]"
        style={{
          ...sharedStyle,
          borderBottom: `${thickness}px solid ${secondaryColor}`,
          borderLeft: `${thickness}px solid ${secondaryColor}`,
          borderBottomLeftRadius: `${radius}px`,
          animationDelay: "-0.7s",
        }}
      />

      <div
        className="absolute bottom-[3%] right-[3%]"
        style={{
          ...sharedStyle,
          borderBottom: `${thickness}px solid ${primaryColor}`,
          borderRight: `${thickness}px solid ${primaryColor}`,
          borderBottomRightRadius: `${radius}px`,
          animationDelay: "-1.05s",
        }}
      />
    </>
  );
}

function GamingRgbFrame({
  animation,
  smooth,
  values,
}: {
  animation: boolean;
  smooth: boolean;
  values: SafeFrameValues;
}) {
  const {
    primaryColor,
    secondaryColor,
    thickness,
    blur,
    opacity,
    radius,
    duration,
  } = values;

  return (
    <>
      <div
        className="absolute inset-[2.5%]"
        style={{
          padding: `${thickness}px`,
          borderRadius: `${radius}px`,
          opacity,
          background: `
            conic-gradient(
              from 0deg,
              ${primaryColor},
              ${secondaryColor},
              #38bdf8,
              #22c55e,
              #facc15,
              #fb7185,
              ${primaryColor}
            )
          `,
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          filter: `drop-shadow(0 0 ${Math.max(
            8,
            blur,
          )}px ${primaryColor})`,
          transition: smooth
            ? "all 700ms ease"
            : undefined,
          animation: animation
            ? `neonRgbShift ${duration}s linear infinite`
            : undefined,
        }}
      />

      <div
        className="absolute inset-[4%]"
        style={{
          border: `1px solid ${mixWithWhite(
            secondaryColor,
            0.65,
          )}`,
          borderRadius: `${radius * 0.82}px`,
          opacity: opacity * 0.5,
        }}
      />
    </>
  );
}

function RoundedFrame({
  animation,
  smooth,
  values,
}: {
  animation: boolean;
  smooth: boolean;
  values: SafeFrameValues;
}) {
  const {
    primaryColor,
    secondaryColor,
    thickness,
    blur,
    opacity,
    radius,
    duration,
  } = values;

  return (
    <>
      <div
        className="absolute inset-[4%]"
        style={{
          border: `${thickness}px solid transparent`,
          borderRadius: `${radius * 1.45}px`,
          background: `
            linear-gradient(transparent, transparent) padding-box,
            linear-gradient(
              135deg,
              ${primaryColor},
              ${secondaryColor}
            ) border-box
          `,
          opacity,
          boxShadow: `
            0 0 ${Math.max(5, blur * 0.55)}px ${primaryColor},
            0 0 ${Math.max(8, blur * 0.8)}px ${secondaryColor},
            inset 0 0 ${Math.max(4, blur * 0.35)}px ${secondaryColor}
          `,
          transition: smooth
            ? "all 700ms ease"
            : undefined,
          animation: animation
            ? `neonSoftPulse ${duration}s ease-in-out infinite`
            : undefined,
        }}
      />

      <div
        className="absolute inset-[5.5%]"
        style={{
          border: `1px solid ${mixWithWhite(
            primaryColor,
            0.55,
          )}`,
          borderRadius: `${radius * 1.2}px`,
          opacity: opacity * 0.55,
        }}
      />
    </>
  );
}

function getAnimationDuration(
  speed: number,
): number {
  const safeSpeed = clamp(speed, 10, 100);

  return Math.max(
    2.4,
    10 - (safeSpeed / 100) * 6.5,
  );
}

function mixWithWhite(
  hex: string,
  ratio: number,
): string {
  const rgb = hexToRgb(hex);

  if (!rgb) {
    return "#ffffff";
  }

  const safeRatio = clamp(ratio, 0, 1);
  const whiteRatio = 1 - safeRatio;

  const red = Math.round(
    rgb.red * safeRatio +
      255 * whiteRatio,
  );
  const green = Math.round(
    rgb.green * safeRatio +
      255 * whiteRatio,
  );
  const blue = Math.round(
    rgb.blue * safeRatio +
      255 * whiteRatio,
  );

  return `rgb(${red}, ${green}, ${blue})`;
}

function hexToRgb(
  hex: string,
): {
  red: number;
  green: number;
  blue: number;
} | null {
  const cleanHex = hex
    .replace("#", "")
    .trim();

  const normalized =
    cleanHex.length === 3
      ? cleanHex
          .split("")
          .map(
            (character) =>
              character + character,
          )
          .join("")
      : cleanHex;

  if (
    !/^[0-9a-fA-F]{6}$/.test(
      normalized,
    )
  ) {
    return null;
  }

  return {
    red: Number.parseInt(
      normalized.slice(0, 2),
      16,
    ),
    green: Number.parseInt(
      normalized.slice(2, 4),
      16,
    ),
    blue: Number.parseInt(
      normalized.slice(4, 6),
      16,
    ),
  };
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  if (!Number.isFinite(value)) {
    return minimum;
  }

  return Math.min(
    Math.max(value, minimum),
    maximum,
  );
}