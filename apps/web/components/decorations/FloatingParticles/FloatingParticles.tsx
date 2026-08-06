"use client";

import type { CSSProperties } from "react";
import { useMemo } from "react";
import type {
  FloatingParticlesSettings,
  ParticleDirection,
  ParticleType,
} from "@/app/dashboard/live-decorations/floating-particles/types";

type FloatingParticlesProps = {
  settings: FloatingParticlesSettings;
  className?: string;
};

type ParticleItem = {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  rotation: number;
  color: string;
};

export function FloatingParticles({
  settings,
  className = "",
}: FloatingParticlesProps) {
  const particles = useMemo(
    () => createParticles(settings),
    [settings],
  );

  if (!settings.enabled) {
    return null;
  }

  const containerClassName = [
    "pointer-events-none",
    "absolute",
    "inset-0",
    "overflow-hidden",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      aria-hidden="true"
      data-particle-type={settings.particleType}
      data-canvas-mode={settings.canvasMode}
      className={containerClassName}
    >
      {particles.map((particle) => (
        <Particle
          key={particle.id}
          particle={particle}
          type={settings.particleType}
          direction={settings.direction}
          glow={settings.glow}
          randomRotation={
            settings.randomRotation
          }
          animation={settings.animation}
          smooth={settings.smooth}
          opacity={settings.opacity}
        />
      ))}
    </div>
  );
}

function Particle({
  particle,
  type,
  direction,
  glow,
  randomRotation,
  animation,
  smooth,
  opacity,
}: {
  particle: ParticleItem;
  type: ParticleType;
  direction: ParticleDirection;
  glow: boolean;
  randomRotation: boolean;
  animation: boolean;
  smooth: boolean;
  opacity: number;
}) {
  const symbol = getParticleSymbol(type);
  const animationName =
    getAnimationName(direction);

  const style: CSSProperties = {
    left: `${particle.left}%`,
    top: `${particle.top}%`,
    width: `${particle.size}px`,
    height: `${particle.size}px`,
    color: particle.color,
    opacity: clamp(
      opacity / 100,
      0.1,
      1,
    ),
    fontSize: `${particle.size}px`,
    lineHeight: 1,
    transform: randomRotation
      ? `rotate(${particle.rotation}deg)`
      : undefined,
    filter: glow
      ? `drop-shadow(0 0 ${Math.max(
          4,
          particle.size * 0.42,
        )}px ${particle.color})`
      : undefined,
    transition: smooth
      ? "filter 600ms ease, opacity 600ms ease, transform 600ms ease"
      : undefined,
    animation: animation
      ? `${animationName} ${particle.duration}s linear ${particle.delay}s infinite`
      : undefined,
    ["--particle-drift" as string]: `${particle.drift}px`,
    ["--particle-rotation" as string]: `${particle.rotation}deg`,
  };

  if (type === "confetti") {
    return (
      <span
        className="absolute block rounded-sm"
        style={{
          ...style,
          background: particle.color,
          width: `${Math.max(
            4,
            particle.size * 0.45,
          )}px`,
          height: `${Math.max(
            8,
            particle.size,
          )}px`,
        }}
      />
    );
  }

  if (type === "bubbles") {
    return (
      <span
        className="absolute block rounded-full border border-white/60"
        style={{
          ...style,
          background: `radial-gradient(
            circle at 30% 28%,
            rgba(255,255,255,.75) 0%,
            ${hexToRgba(
              particle.color,
              0.28,
            )} 22%,
            ${hexToRgba(
              particle.color,
              0.12,
            )} 58%,
            transparent 100%
          )`,
        }}
      />
    );
  }

  return (
    <span
      className="absolute flex items-center justify-center select-none"
      style={style}
    >
      {symbol}
    </span>
  );
}

function createParticles(
  settings: FloatingParticlesSettings,
): ParticleItem[] {
  const count = clamp(
    settings.particleCount,
    1,
    120,
  );

  const minSize = clamp(
    settings.minSize,
    4,
    120,
  );

  const maxSize = clamp(
    settings.maxSize,
    minSize,
    160,
  );

  const durationBase = Math.max(
    4,
    18 -
      (clamp(
        settings.speed,
        10,
        100,
      ) /
        100) *
        11,
  );

  return Array.from(
    { length: count },
    (_, index) => {
      const random = seededRandom(
        index + count * 13,
      );

      const size =
        minSize +
        random() * (maxSize - minSize);

      const duration =
        durationBase *
        (0.78 + random() * 0.52);

      return {
        id: index,
        left: random() * 100,
        top: random() * 100,
        size,
        delay: -random() * duration,
        duration,
        drift: -40 + random() * 80,
        rotation:
          -180 + random() * 360,
        color:
          random() > 0.5
            ? settings.primaryColor
            : settings.secondaryColor,
      };
    },
  );
}

function getParticleSymbol(
  type: ParticleType,
): string {
  if (type === "hearts") {
    return "♥";
  }

  if (type === "sparkles") {
    return "✦";
  }

  if (type === "snow") {
    return "❄";
  }

  if (type === "sakura") {
    return "🌸";
  }

  if (type === "leaves") {
    return "🍃";
  }

  if (type === "coins") {
    return "🪙";
  }

  return "★";
}

function getAnimationName(
  direction: ParticleDirection,
): string {
  if (direction === "up") {
    return "floatingParticleUp";
  }

  if (direction === "left") {
    return "floatingParticleLeft";
  }

  if (direction === "right") {
    return "floatingParticleRight";
  }

  if (direction === "float") {
    return "floatingParticleFloat";
  }

  return "floatingParticleDown";
}

function seededRandom(
  seed: number,
): () => number {
  let value = seed % 2147483647;

  if (value <= 0) {
    value += 2147483646;
  }

  return () => {
    value =
      (value * 16807) % 2147483647;

    return (
      (value - 1) / 2147483646
    );
  };
}

function hexToRgba(
  hex: string,
  alpha: number,
): string {
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
    return `rgba(255,255,255,${clamp(
      alpha,
      0,
      1,
    )})`;
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

  return `rgba(${red},${green},${blue},${clamp(
    alpha,
    0,
    1,
  )})`;
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