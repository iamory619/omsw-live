"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "../styles/capybara.css";

export type PetState =
  | "idle"
  | "walk"
  | "eat"
  | "happy"
  | "sleep"
  | "evolve";

type CapybaraPetProps = {
  state: PetState;
  scale: number;
  stage: number;
  stageXp: number;
};

type StageAssets = {
  master: string;
  blinkFrames: readonly string[];
  giftFrames: readonly string[];
  idleSpecialFrames?: readonly (
    readonly string[]
  )[];
};

const ASSET_ROOT =
  "/assets/pet/capybara";

const BLINK_INTERVAL_MS = 5_000;
const BLINK_FRAME_DURATION_MS = 800;

const GIFT_FRAME_DURATION_MS = 700;

const SPECIAL_IDLE_MIN_DELAY_MS = 7_000;
const SPECIAL_IDLE_MAX_DELAY_MS = 12_000;

const SPECIAL_IDLE_FRAME_DURATION_MS = 900;
const SINGLE_SPECIAL_IDLE_DURATION_MS = 1_800;

const CAPYBARA_WIDTH = 500;
const CAPYBARA_HEIGHT = 500;

function normalizeStage(
  stage: number,
): number {
  return Math.min(
    5,
    Math.max(
      1,
      Math.trunc(stage),
    ),
  );
}

function isGiftState(
  state: PetState,
): boolean {
  return (
    state !== "idle" &&
    state !== "sleep"
  );
}

function getStageAssets(
  stage: number,
): StageAssets {
  const normalizedStage =
    normalizeStage(stage);

  const stageBase =
    `${ASSET_ROOT}/stage-${normalizedStage}`;

  /*
   * ============================
   * STAGE 1
   * ============================
   */

  if (normalizedStage === 1) {
    const activity1 =
      `${stageBase}/stage-1-idle-Activity1.png`;

    const activity2 =
      `${stageBase}/stage-1-idle-Activity2.png`;

    const activity3 =
      `${stageBase}/stage-1-idle-Activity3.png`;

    const activity4 =
      `${stageBase}/stage-1-idle-Activity4.png`;

    const activity5 =
      `${stageBase}/stage-1-idle-Activity5.png`;

    return {
      master:
        `${stageBase}/stage-1-master.png`,

      blinkFrames: [
        `${stageBase}/stage-1-idle-blink.png`,
      ],

      giftFrames: [
        activity1,
        activity2,
        activity3,
        activity4,
        activity5,
      ],

      idleSpecialFrames: [
        [activity1],
        [activity2],
        [activity3],
        [activity4],
        [activity5],
      ],
    };
  }

  /*
   * ============================
   * STAGE 2
   * ============================
   */

  if (normalizedStage === 2) {
    const activity1 =
      `${stageBase}/stage-2-idle-Activity1.png`;

    const activity2 =
      `${stageBase}/stage-2-idle-Activity2.png`;

    const activity3 =
      `${stageBase}/stage-2-idle-Activity3.png`;

    const activity4 =
      `${stageBase}/stage-2-idle-Activity4.png`;

    return {
      master:
        `${stageBase}/stage-2-master.png`,

      blinkFrames: [
        `${stageBase}/stage-2-idle-blink.png`,
      ],

      giftFrames: [
        activity1,
        activity2,
        activity3,
        activity4,
      ],

      idleSpecialFrames: [
        [activity1],
        [activity2],
        [activity3],
        [activity4],
      ],
    };
  }

  /*
   * ============================
   * STAGE 3
   * ============================
   */

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
      master:
        `${stageBase}/stage-3-master.png`,

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
        [pao1],
        [pao2],
        [pao3],
        [pao4],
      ],
    };
  }

  /*
   * ============================
   * STAGE 4
   * ============================
   */

  if (normalizedStage === 4) {
    const activity1 =
      `${stageBase}/stage-4-idle-activity1.png`;

    const activity2 =
      `${stageBase}/stage-4-idle-activity2.png`;

    const activity3 =
      `${stageBase}/stage-4-idle-activity3.png`;

    const activity4 =
      `${stageBase}/stage-4-idle-activity4.png`;

    return {
      master:
        `${stageBase}/stage-4-master.png`,

      blinkFrames: [
        `${stageBase}/stage-4-idle-blink1.png`,
      ],

      /*
       * ตอนมี Gift / Action
       * activity1 → activity2 → activity3 → activity4
       */
      giftFrames: [
        activity1,
        activity2,
        activity3,
        activity4,
      ],

      /*
       * ตอน Idle
       * สุ่ม activity1 - activity4
       */
      idleSpecialFrames: [
        [activity1],
        [activity2],
        [activity3],
        [activity4],
      ],
    };
  }

  /*
   * ============================
   * STAGE 5
   * ============================
   */

  if (normalizedStage === 5) {
    const activity1 =
      `${stageBase}/stage-5-idle-activity1.png`;

    const activity2 =
      `${stageBase}/stage-5-idle-activity2.png`;

    const activity3 =
      `${stageBase}/stage-5-idle-activity3.png`;

    const activity4 =
      `${stageBase}/stage-5-idle-activity4.png`;

    const activity5 =
      `${stageBase}/stage-5-idle-activity5.png`;

    return {
      master:
        `${stageBase}/stage-5-master.png`,

      blinkFrames: [
        `${stageBase}/stage-5-idle-blink1.png`,
      ],

      giftFrames: [
        activity1,
        activity2,
        activity3,
        activity4,
        activity5,
      ],

      idleSpecialFrames: [
        [activity1],
        [activity2],
        [activity3],
        [activity4],
        [activity5],
      ],
    };
  }

  /*
   * fallback
   */

  return {
    master:
      `${stageBase}/stage-${normalizedStage}-master.png`,

    blinkFrames: [],

    giftFrames: [],
  };
}

export function CapybaraPet({
  state,
  scale,
  stage,
  stageXp: _stageXp,
}: CapybaraPetProps) {
  const normalizedStage =
    normalizeStage(stage);

  const assets = useMemo(
    () =>
      getStageAssets(
        normalizedStage,
      ),
    [
      normalizedStage,
    ],
  );

  const [
    currentImage,
    setCurrentImage,
  ] = useState(
    assets.master,
  );

  const [
    isSequencePlaying,
    setIsSequencePlaying,
  ] = useState(false);

  const previousStateRef =
    useRef<PetState>(
      "idle",
    );

  const blinkIndexRef =
    useRef(0);

  const blinkIntervalRef =
    useRef<number | null>(
      null,
    );

  const blinkTimeoutsRef =
    useRef<number[]>([]);

  const actionTimeoutsRef =
    useRef<number[]>([]);

  const specialIdleTimeoutRef =
    useRef<number | null>(
      null,
    );

  const clearBlinkTimers = () => {
    if (
      blinkIntervalRef.current !==
      null
    ) {
      window.clearInterval(
        blinkIntervalRef.current,
      );

      blinkIntervalRef.current =
        null;
    }

    blinkTimeoutsRef.current.forEach(
      (timeoutId) => {
        window.clearTimeout(
          timeoutId,
        );
      },
    );

    blinkTimeoutsRef.current = [];
  };

  const clearActionTimers = () => {
    actionTimeoutsRef.current.forEach(
      (timeoutId) => {
        window.clearTimeout(
          timeoutId,
        );
      },
    );

    actionTimeoutsRef.current = [];
  };

  const clearSpecialIdleTimer =
    () => {
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

    if (frames.length === 0) {
      setCurrentImage(
        assets.master,
      );

      setIsSequencePlaying(
        false,
      );

      onComplete?.();

      return;
    }

    setIsSequencePlaying(
      true,
    );

    frames.forEach(
      (
        image,
        index,
      ) => {
        const timeoutId =
          window.setTimeout(
            () => {
              setCurrentImage(
                image,
              );
            },
            index *
              frameDuration,
          );

        actionTimeoutsRef.current.push(
          timeoutId,
        );
      },
    );

    const totalDuration =
      Math.max(
        1,
        frames.length,
      ) *
      frameDuration;

    const finishTimeoutId =
      window.setTimeout(
        () => {
          setCurrentImage(
            assets.master,
          );

          setIsSequencePlaying(
            false,
          );

          actionTimeoutsRef.current =
            [];

          onComplete?.();
        },
        totalDuration,
      );

    actionTimeoutsRef.current.push(
      finishTimeoutId,
    );
  };

  /*
   * ============================
   * RESET เมื่อเปลี่ยน Stage
   * ============================
   */

  useEffect(() => {
    clearBlinkTimers();
    clearActionTimers();
    clearSpecialIdleTimer();

    setIsSequencePlaying(
      false,
    );

    setCurrentImage(
      assets.master,
    );

    previousStateRef.current =
      "idle";

    blinkIndexRef.current = 0;
  }, [assets]);

  /*
   * ============================
   * BLINK
   * ============================
   */

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
      window.setInterval(
        () => {
          const blinkFrame =
            assets.blinkFrames[
              blinkIndexRef.current %
                assets.blinkFrames.length
            ];

          blinkIndexRef.current =
            (
              blinkIndexRef.current +
              1
            ) %
            assets.blinkFrames.length;

          setCurrentImage(
            blinkFrame,
          );

          const returnTimeoutId =
            window.setTimeout(
              () => {
                setCurrentImage(
                  assets.master,
                );
              },
              BLINK_FRAME_DURATION_MS,
            );

          blinkTimeoutsRef.current.push(
            returnTimeoutId,
          );
        },
        BLINK_INTERVAL_MS,
      );

    return clearBlinkTimers;
  }, [
    assets,
    isSequencePlaying,
    state,
  ]);

  /*
   * ============================
   * RANDOM IDLE ACTIVITY
   * ============================
   */

  useEffect(() => {
    if (
      state !== "idle" ||
      isSequencePlaying ||
      !assets.idleSpecialFrames?.length
    ) {
      return;
    }

    clearSpecialIdleTimer();

    const scheduleNext =
      () => {
        const delay =
          SPECIAL_IDLE_MIN_DELAY_MS +
          Math.random() *
            (
              SPECIAL_IDLE_MAX_DELAY_MS -
              SPECIAL_IDLE_MIN_DELAY_MS
            );

        specialIdleTimeoutRef.current =
          window.setTimeout(
            () => {
              const sequences =
                assets
                  .idleSpecialFrames;

              if (
                !sequences?.length
              ) {
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
            },
            delay,
          );
      };

    scheduleNext();

    return clearSpecialIdleTimer;
  }, [
    assets,
    isSequencePlaying,
    state,
  ]);

  /*
   * ============================
   * GIFT / ACTION
   * ============================
   */

  useEffect(() => {
    const previousState =
      previousStateRef.current;

    previousStateRef.current =
      state;

    const shouldPlayGift =
      isGiftState(
        state,
      ) &&
      !isGiftState(
        previousState,
      );

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

  /*
   * ============================
   * CLEANUP
   * ============================
   */

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
        "capybara-pet-rig",
        `capybara-pet-stage-${normalizedStage}`,
        `capybara-pet-state-${state}`,
      ].join(" ")}
      style={{
        width:
          CAPYBARA_WIDTH,

        height:
          CAPYBARA_HEIGHT,

        transform:
          `scale(${scale})`,

        transformOrigin:
          "bottom center",

        background:
          "transparent",
      }}
    >
      <img
        src={currentImage}
        alt="Capybara"
        draggable={false}
        className="capybara-pet-image pointer-events-none select-none"
        onError={(
          event,
        ) => {
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