"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "../styles/cat.css";

export type PetState =
  | "idle"
  | "walk"
  | "eat"
  | "happy"
  | "sleep"
  | "evolve";

type CatPetProps = {
  state: PetState;
  scale: number;
  stage: number;
  stageXp: number;
};

type StageAssets = {
  master: string;
  blinkFrames: readonly string[];
  giftFrames: readonly string[];
  idleSpecialFrames?: readonly (readonly string[])[];
};

type StageFivePose = {
  name: "Standup" | "Pung" | "Rabbit" | "Rat";
  master: string;
  blink: string;
  giftFrames: readonly string[];
};

const ASSET_ROOT = "/assets/pet/cat";

const BLINK_INTERVAL_MS = 5_000;
const BLINK_FRAME_DURATION_MS = 180;
const GIFT_FRAME_DURATION_MS = 700;

const SPECIAL_IDLE_MIN_DELAY_MS = 8_000;
const SPECIAL_IDLE_MAX_DELAY_MS = 14_000;
const SPECIAL_IDLE_FRAME_DURATION_MS = 550;
const SINGLE_SPECIAL_IDLE_DURATION_MS = 1_800;

const STAGE_FIVE_POSE_XP = 51;

const CAT_WIDTH = 500;
const CAT_HEIGHT = 500;

function isGiftState(state: PetState): boolean {
  return state !== "idle" && state !== "sleep";
}

function normalizeStage(stage: number): number {
  return Math.min(5, Math.max(1, Math.trunc(stage)));
}

function getStageFivePoses(): readonly StageFivePose[] {
  const stageBase = `${ASSET_ROOT}/stage-5`;

  return [
    {
      name: "Standup",
      master: `${stageBase}/stage-5-Standup-1.png`,
      blink: `${stageBase}/stage-5-Standup-1-1.png`,
      giftFrames: [
        `${stageBase}/stage-5-Standup-2.png`,
        `${stageBase}/stage-5-Standup-3.png`,
        `${stageBase}/stage-5-Standup-4.png`,
      ],
    },
    {
      name: "Pung",
      master: `${stageBase}/stage-5-Pung-1.png`,
      blink: `${stageBase}/stage-5-Pung-1-1.png`,
      giftFrames: [
        `${stageBase}/stage-5-Pung-2.png`,
        `${stageBase}/stage-5-Pung-3.png`,
        `${stageBase}/stage-5-Pung-4.png`,
        `${stageBase}/stage-5-Pung-5.png`,
      ],
    },
    {
      name: "Rabbit",
      master: `${stageBase}/stage-5-Rabbit-1.png`,
      blink: `${stageBase}/stage-5-Rabbit-1-1.png`,
      giftFrames: [
        `${stageBase}/stage-5-Rabbit-2.png`,
        `${stageBase}/stage-5-Rabbit-3.png`,
        `${stageBase}/stage-5-Rabbit-4.png`,
        `${stageBase}/stage-5-Rabbit-5.png`,
      ],
    },
    {
      name: "Rat",
      master: `${stageBase}/stage-5-Rat-1.png`,
      blink: `${stageBase}/stage-5-Rat-1-1.png`,
      giftFrames: [
        `${stageBase}/stage-5-Rat-2.png`,
        `${stageBase}/stage-5-Rat-3.png`,
        `${stageBase}/stage-5-Rat-4.png`,
        `${stageBase}/stage-5-Rat-5.png`,
      ],
    },
  ] as const;
}

function getStageFiveAssets(stageXp: number): StageAssets {
  const poses = getStageFivePoses();

  const safeXp = Math.max(0, Math.trunc(stageXp));

  const poseIndex =
    Math.floor(safeXp / STAGE_FIVE_POSE_XP) % poses.length;

  const pose = poses[poseIndex];

  return {
    master: pose.master,
    blinkFrames: [pose.blink],
    giftFrames: pose.giftFrames,
  };
}

function getStageAssets(
  stage: number,
  stageXp: number,
): StageAssets {
  const normalizedStage = normalizeStage(stage);

  const stageBase =
    `${ASSET_ROOT}/stage-${normalizedStage}`;

  if (normalizedStage === 5) {
    return getStageFiveAssets(stageXp);
  }

  if (normalizedStage === 4) {
    const activity1 =
      `${stageBase}/stage-4-idle-Activity1.png`;

    const activity2 =
      `${stageBase}/stage-4-idle-Activity2.png`;

    // const activity3 =
    //   `${stageBase}/stage-4-idle-Activity3.png`;

    // const activity4 =
    //   `${stageBase}/stage-4-idle-Activity4.png`;

    const activity5 =
      `${stageBase}/stage-4-idle-Activity5.png`;

    return {
      master: `${stageBase}/stage-4-master.png`,

      blinkFrames: [
        `${stageBase}/stage-4-idle-blink1.png`,
        `${stageBase}/stage-4-idle-blink2.png`,
      ],

      giftFrames: [
        activity1,
        activity2,
        // activity3,
        // activity4,
        activity5,
      ],

      idleSpecialFrames: [
        [activity1],
        [activity2],
        // [activity3],
        // [activity4],
        [activity5],
      ],
    };
  }

  if (normalizedStage === 3) {
    const pao1 =
      `${stageBase}/stage-3-idle-pao1.png`;

    const pao2 =
      `${stageBase}/stage-3-idle-pao2.png`;

    const pao3 =
      `${stageBase}/stage-3-idle-pao3.png`;

       const pao4 =
      `${stageBase}/stage-3-idle-pao4.png`;

    return {
      master: `${stageBase}/stage-3-master.png`,

      blinkFrames: [
        `${stageBase}/stage-3-idle-blink1.png`,
      ],

      giftFrames: [
        pao1,
        pao2,
        pao3,
        pao4,
      ],

      idleSpecialFrames: [
        [
          pao1,
          pao2,
          pao3,
          pao4,
        ],
        [
          `${stageBase}/stage-3-idle-flower.png`,
        ],
      ],
    };
  }

  if (normalizedStage === 2) {
    return {
      master:
        `${stageBase}/stage-2-master.png`,

      blinkFrames: [
        `${stageBase}/stage-2-idle-blink.png`,
      ],

      giftFrames: [
        `${stageBase}/stage-2-love1.png`,
       `${stageBase}/stage-2-love2.png`,
        // `${stageBase}/stage-2-love3.png`,
        // `${stageBase}/stage-2-love4.png`,
      ],
    };
  }

  return {
    master:
      `${stageBase}/stage-1-master.png`,

    blinkFrames: [
      `${stageBase}/stage-1-idle-blink.png`,
    ],

    giftFrames: [
      `${stageBase}/stage-1-box1.png`,
      `${stageBase}/stage-1-box2.png`,
      `${stageBase}/stage-1-box3.png`,
      `${stageBase}/stage-1-box4.png`,
    ],
  };
}

export function CatPet({
  state,
  scale,
  stage,
  stageXp,
}: CatPetProps) {
  const normalizedStage =
    normalizeStage(stage);

  const assets = useMemo(
    () =>
      getStageAssets(
        normalizedStage,
        stageXp,
      ),
    [
      normalizedStage,
      stageXp,
    ],
  );

  const [
    currentImage,
    setCurrentImage,
  ] = useState(assets.master);

  const [
    isSequencePlaying,
    setIsSequencePlaying,
  ] = useState(false);

  const previousStateRef =
    useRef<PetState>("idle");

  const blinkIndexRef =
    useRef(0);

  const blinkIntervalRef =
    useRef<number | null>(null);

  const blinkTimeoutsRef =
    useRef<number[]>([]);

  const actionTimeoutsRef =
    useRef<number[]>([]);

  const specialIdleTimeoutRef =
    useRef<number | null>(null);

  const clearBlinkTimers = () => {
    if (
      blinkIntervalRef.current !== null
    ) {
      window.clearInterval(
        blinkIntervalRef.current,
      );

      blinkIntervalRef.current = null;
    }

    blinkTimeoutsRef.current.forEach(
      (timeoutId) => {
        window.clearTimeout(timeoutId);
      },
    );

    blinkTimeoutsRef.current = [];
  };

  const clearActionTimers = () => {
    actionTimeoutsRef.current.forEach(
      (timeoutId) => {
        window.clearTimeout(timeoutId);
      },
    );

    actionTimeoutsRef.current = [];
  };

  const clearSpecialIdleTimer = () => {
    if (
      specialIdleTimeoutRef.current !==
      null
    ) {
      window.clearTimeout(
        specialIdleTimeoutRef.current,
      );

      specialIdleTimeoutRef.current =
        null;
    }
  };

  const playFrames = (
    frames: readonly string[],
    frameDuration: number,
    onComplete?: () => void,
  ) => {
    clearActionTimers();

    setIsSequencePlaying(true);

    frames.forEach(
      (image, index) => {
        const timeoutId =
          window.setTimeout(() => {
            setCurrentImage(image);
          }, index * frameDuration);

        actionTimeoutsRef.current.push(
          timeoutId,
        );
      },
    );

    const totalDuration =
      Math.max(1, frames.length) *
      frameDuration;

    const finishTimeoutId =
      window.setTimeout(() => {
        setCurrentImage(
          assets.master,
        );

        setIsSequencePlaying(false);

        actionTimeoutsRef.current = [];

        onComplete?.();
      }, totalDuration);

    actionTimeoutsRef.current.push(
      finishTimeoutId,
    );
  };

  useEffect(() => {
    clearBlinkTimers();
    clearActionTimers();
    clearSpecialIdleTimer();

    setIsSequencePlaying(false);
    setCurrentImage(assets.master);

    previousStateRef.current =
      "idle";

    blinkIndexRef.current = 0;
  }, [assets]);

  useEffect(() => {
    if (
      state !== "idle" ||
      isSequencePlaying ||
      assets.blinkFrames.length === 0
    ) {
      return;
    }

    clearBlinkTimers();

    blinkIntervalRef.current =
      window.setInterval(() => {
        const blinkFrame =
          assets.blinkFrames[
            blinkIndexRef.current %
              assets.blinkFrames.length
          ];

        blinkIndexRef.current =
          (
            blinkIndexRef.current + 1
          ) %
          assets.blinkFrames.length;

        setCurrentImage(blinkFrame);

        const returnTimeoutId =
          window.setTimeout(() => {
            setCurrentImage(
              assets.master,
            );
          }, BLINK_FRAME_DURATION_MS);

        blinkTimeoutsRef.current.push(
          returnTimeoutId,
        );
      }, BLINK_INTERVAL_MS);

    return clearBlinkTimers;
  }, [
    assets,
    isSequencePlaying,
    state,
  ]);

  useEffect(() => {
    if (
      state !== "idle" ||
      isSequencePlaying ||
      !assets.idleSpecialFrames?.length
    ) {
      return;
    }

    clearSpecialIdleTimer();

    const scheduleNext = () => {
      const delay =
        SPECIAL_IDLE_MIN_DELAY_MS +
        Math.random() *
          (
            SPECIAL_IDLE_MAX_DELAY_MS -
            SPECIAL_IDLE_MIN_DELAY_MS
          );

      specialIdleTimeoutRef.current =
        window.setTimeout(() => {
          const sequences =
            assets.idleSpecialFrames;

          if (!sequences?.length) {
            return;
          }

          const sequence =
            sequences[
              Math.floor(
                Math.random() *
                  sequences.length,
              )
            ];

          clearBlinkTimers();

          playFrames(
            sequence,
            sequence.length === 1
              ? SINGLE_SPECIAL_IDLE_DURATION_MS
              : SPECIAL_IDLE_FRAME_DURATION_MS,
            scheduleNext,
          );
        }, delay);
    };

    scheduleNext();

    return clearSpecialIdleTimer;
  }, [
    assets,
    isSequencePlaying,
    state,
  ]);

  useEffect(() => {
    const previousState =
      previousStateRef.current;

    previousStateRef.current = state;

    const shouldPlayGift =
      isGiftState(state) &&
      !isGiftState(previousState);

    if (!shouldPlayGift) {
      return;
    }

    clearBlinkTimers();
    clearSpecialIdleTimer();

    setCurrentImage(
      assets.master,
    );

    playFrames(
      assets.giftFrames,
      GIFT_FRAME_DURATION_MS,
    );
  }, [
    assets,
    state,
  ]);

  useEffect(() => {
    return () => {
      clearBlinkTimers();
      clearActionTimers();
      clearSpecialIdleTimer();
    };
  }, []);

  return (
    <div
      className={[
        "cat-pet-rig",
        `cat-pet-stage-${normalizedStage}`,
        `cat-pet-state-${state}`,
      ].join(" ")}
      style={{
        width: CAT_WIDTH,
        height: CAT_HEIGHT,
        transform: `scale(${scale})`,
        transformOrigin:
          "bottom center",
        background:
          "transparent",
      }}
    >
      <img
        src={currentImage}
        alt="Japanese calico cat"
        draggable={false}
        className="cat-pet-image pointer-events-none select-none"
        onError={(event) => {
          const image =
            event.currentTarget;

          const masterFileName =
            assets.master
              .split("/")
              .pop();

          if (
            masterFileName &&
            !image.src.endsWith(
              `/${masterFileName}`,
            )
          ) {
            image.src =
              assets.master;
          }
        }}
      />
    </div>
  );
}