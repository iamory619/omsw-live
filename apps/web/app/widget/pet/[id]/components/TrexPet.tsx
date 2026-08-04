"use client";

import type { CSSProperties } from "react";
import type { PetState } from "./CatPet";
import "../styles/trex-pet.css";

export type TrexEggPhase =
  | "dormant"
  | "glowing"
  | "eyes-visible"
  | "large-cracks"
  | "almost-hatched";

type TrexPetProps = {
  state: PetState;
  scale?: number;
  stage?: number;
  progress?: number;
  eggPhase?: TrexEggPhase | null;
};

function clampProgress(progress: number) {
  return Math.min(100, Math.max(0, progress));
}

function getEggPhase(progress: number): TrexEggPhase {
  if (progress >= 80) return "almost-hatched";
  if (progress >= 60) return "large-cracks";
  if (progress >= 40) return "eyes-visible";
  if (progress >= 20) return "glowing";

  return "dormant";
}

function getEggImage(progress: number) {
  if (progress >= 80) {
    return "/assets/pet/trex/stage-1/egg-80.png";
  }

  if (progress >= 60) {
    return "/assets/pet/trex/stage-1/egg-60.png";
  }

  if (progress >= 40) {
    return "/assets/pet/trex/stage-1/egg-40.png";
  }

  if (progress >= 20) {
    return "/assets/pet/trex/stage-1/egg-20.png";
  }

  return "/assets/pet/trex/stage-1/egg-0.png";
}

function getEggAltText(phase: TrexEggPhase, progress: number) {
  const roundedProgress = Math.round(progress);

  switch (phase) {
    case "almost-hatched":
      return `Living T-Rex egg almost ready to hatch, ${roundedProgress} percent`;

    case "large-cracks":
      return `Living T-Rex egg with large cracks, ${roundedProgress} percent`;

    case "eyes-visible":
      return `Living T-Rex egg with visible eyes, ${roundedProgress} percent`;

    case "glowing":
      return `Glowing Living T-Rex egg, ${roundedProgress} percent`;

    default:
      return `Dormant Living T-Rex egg, ${roundedProgress} percent`;
  }
}

function getHeadImage(state: PetState) {
  if (state === "happy") return "head-happy.png";
  if (state === "eat") return "head-eat.png";
  if (state === "sleep") return "head-sleep.png";

  return "head.png";
}

export function TrexPet({
  state,
  scale = 1,
  stage = 1,
  progress = 0,
  eggPhase = null,
}: TrexPetProps) {
  const normalizedProgress = clampProgress(progress);

  /*
   * ตอนนี้มีชุดชิ้นส่วน T-Rex ถึง Stage 2
   * Stage 3–5 จะใช้ภาพ Stage 2 ชั่วคราว
   *
   * เมื่อสร้าง Asset ครบ Stage 3–5 แล้ว ให้เปลี่ยนเป็น:
   *
   * const safeStage = Math.min(5, Math.max(2, stage));
   */
  const safeStage = Math.min(5, Math.max(1, stage));

  const normalizedEggPhase =
    eggPhase ?? getEggPhase(normalizedProgress);

  const eggImage = getEggImage(normalizedProgress);

  const rigStyle: CSSProperties = {
    width: 460,
    height: 390,
    transform: `scale(${scale})`,
    transformOrigin: "center bottom",
  };

  /*
   * Stage 1 — Living Egg
   */
  if (stage === 1) {
    return (
      <div
        className={[
          "trex-pet-rig",
          "trex-pet-stage-1",
          "trex-pet-egg-rig",
          `trex-pet-egg-${normalizedEggPhase}`,
          `trex-pet-state-${state}`,
        ].join(" ")}
        style={rigStyle}
        aria-label={getEggAltText(
          normalizedEggPhase,
          normalizedProgress,
        )}
      >
        <div
          className="trex-pet-egg-glow"
          aria-hidden="true"
        />

        <img
          key={eggImage}
          src={eggImage}
          alt={getEggAltText(
            normalizedEggPhase,
            normalizedProgress,
          )}
          className="trex-pet-egg-layer"
          draggable={false}
        />

        {normalizedEggPhase !== "dormant" && (
          <div
            className="trex-pet-egg-sparkles"
            aria-hidden="true"
          >
            <span className="trex-pet-egg-sparkle trex-pet-egg-sparkle-1">
              ✦
            </span>

            <span className="trex-pet-egg-sparkle trex-pet-egg-sparkle-2">
              ✦
            </span>

            <span className="trex-pet-egg-sparkle trex-pet-egg-sparkle-3">
              ✧
            </span>
          </div>
        )}

        {normalizedEggPhase === "almost-hatched" && (
          <div
            className="trex-pet-egg-hatch-light"
            aria-hidden="true"
          />
        )}
      </div>
    );
  }

  /*
   * Stage 2–5 — T-Rex
   *
   * ตอนนี้ Stage 3–5 ใช้ Asset ของ Stage 2 ชั่วคราว
   */
  const basePath = `/assets/pet/trex/stage-${safeStage}`;

  return (
    <div
      className={[
        "trex-pet-rig",
        `trex-pet-stage-${stage}`,
        `trex-pet-asset-stage-${safeStage}`,
        `trex-pet-state-${state}`,
      ].join(" ")}
      style={rigStyle}
      aria-label={`Tiny T-Rex Stage ${stage}`}
    >
      {/* Tail อยู่หลัง Body */}
      <img
        src={`${basePath}/tail.png`}
        alt=""
        className="trex-pet-tail-layer"
        draggable={false}
      />

      {/* Body */}
      <img
        src={`${basePath}/body.png`}
        alt=""
        className="trex-pet-body-layer"
        draggable={false}
      />

      {/* Head */}
      <div className="trex-pet-head-group">
      <img
  src={`${basePath}/${getHeadImage(state)}`}
  alt={`Tiny T-Rex Stage ${stage}`}
  className="trex-pet-head-layer"
  draggable={false}
/>
      </div>
    </div>
  );
}