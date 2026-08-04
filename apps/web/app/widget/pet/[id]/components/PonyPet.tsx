"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { PetState } from "./CatPet";
import "../styles/pony-pet.css";

type PonyPetProps = {
  state: PetState;
  scale?: number;
  stage?: number;
  progress?: number;
  stageXp?: number;
};

type Stage1Phase = "haystack" | "peek";
type Stage2Reaction = "normal" | "dance" | "kiss";
type Stage3Reaction = "normal" | "butt" | "shy";
type Stage3TransformState = "idle" | "transforming";
type Stage4Reaction = "normal" | "heartEyes" | "hornLove";
type Stage4TransformState = "idle" | "transforming";
type Stage5Reaction = "normal" | "training" | "fly";
type Stage5TransformState = "idle" | "transforming";

function clampStage(stage: number) {
  return Math.min(5, Math.max(1, stage));
}

function clampProgress(progress: number) {
  return Math.min(100, Math.max(0, progress));
}

function getStage1Phase(progress: number): Stage1Phase {
  return progress >= 50 ? "peek" : "haystack";
}

/*
 * Stage 3 uses the EXACT XP earned inside Stage 3.
 *
 * 0–9 XP   = brown young pony
 * 10+ XP   = magical pastel pony
 */
function isEarlyStage3(stageXp: number) {
  return stageXp < 10;
}

function isEarlyStage4(stageXp: number) {
  return stageXp < 21;
}

function isEarlyStage5(stageXp: number) {
  return stageXp < 28;
}

function getPonyImage(stage: number, state: PetState) {
  const basePath = `/assets/pet/pony/stage-${stage}`;

  if (state === "happy") {
    return {
      primary: `${basePath}/pony-happy.png`,
      fallback: `${basePath}/pony.png`,
    };
  }

  if (state === "eat") {
    return {
      primary: `${basePath}/pony-eat.png`,
      fallback: `${basePath}/pony.png`,
    };
  }

  if (state === "sleep") {
    return {
      primary: `${basePath}/pony-sleep.png`,
      fallback: `${basePath}/pony.png`,
    };
  }

  return {
    primary: `${basePath}/pony.png`,
    fallback: `${basePath}/pony.png`,
  };
}

export function PonyPet({
  state,
  scale = 1,
  stage = 1,
  progress = 0,
  stageXp = 0,
}: PonyPetProps) {
  const safeStage = clampStage(stage);
  const normalizedProgress = clampProgress(progress);
  const stage1Phase = getStage1Phase(normalizedProgress);

  const [stage2Reaction, setStage2Reaction] =
    useState<Stage2Reaction>("normal");

  const [stage3Reaction, setStage3Reaction] =
    useState<Stage3Reaction>("normal");

  const [stage3TransformState, setStage3TransformState] =
    useState<Stage3TransformState>("idle");
  const [stage4Reaction, setStage4Reaction] =
    useState<Stage4Reaction>("normal");
  const [stage4TransformState, setStage4TransformState] =
    useState<Stage4TransformState>("idle");

  const [stage5Reaction, setStage5Reaction] =
    useState<Stage5Reaction>("normal");

  const [stage5TransformState, setStage5TransformState] =
    useState<Stage5TransformState>("idle");

  const stage2KissTimerRef = useRef<number | null>(null);
  const stage2NormalTimerRef = useRef<number | null>(null);

  const stage3NormalTimerRef = useRef<number | null>(null);
  const stage3TransformTimerRef = useRef<number | null>(null);
  const previousStage3XpRef = useRef(stageXp);
  const stage3JustCrossedRef = useRef(false);
  const stage4NormalTimerRef = useRef<number | null>(null);
  const stage4TransformTimerRef = useRef<number | null>(null);
  const previousStage4XpRef = useRef(stageXp);
  const stage4JustCrossedRef = useRef(false);

  const stage5NormalTimerRef = useRef<number | null>(null);
  const stage5TransformTimerRef = useRef<number | null>(null);
  const previousStage5XpRef = useRef(stageXp);
  const stage5JustCrossedRef = useRef(false);

  const previousStateRef = useRef<PetState>(state);

  const clearStage2ReactionTimers = () => {
    if (stage2KissTimerRef.current !== null) {
      window.clearTimeout(stage2KissTimerRef.current);
      stage2KissTimerRef.current = null;
    }

    if (stage2NormalTimerRef.current !== null) {
      window.clearTimeout(stage2NormalTimerRef.current);
      stage2NormalTimerRef.current = null;
    }
  };

  const clearStage3ReactionTimer = () => {
    if (stage3NormalTimerRef.current !== null) {
      window.clearTimeout(stage3NormalTimerRef.current);
      stage3NormalTimerRef.current = null;
    }
  };

  const clearStage3TransformTimer = () => {
    if (stage3TransformTimerRef.current !== null) {
      window.clearTimeout(stage3TransformTimerRef.current);
      stage3TransformTimerRef.current = null;
    }
  };

  const clearStage4ReactionTimer = () => {
    if (stage4NormalTimerRef.current !== null) {
      window.clearTimeout(stage4NormalTimerRef.current);
      stage4NormalTimerRef.current = null;
    }
  };

  const clearStage4TransformTimer = () => {
    if (stage4TransformTimerRef.current !== null) {
      window.clearTimeout(stage4TransformTimerRef.current);
      stage4TransformTimerRef.current = null;
    }
  };

  const clearStage5ReactionTimer = () => {
    if (stage5NormalTimerRef.current !== null) {
      window.clearTimeout(stage5NormalTimerRef.current);
      stage5NormalTimerRef.current = null;
    }
  };

  const clearStage5TransformTimer = () => {
    if (stage5TransformTimerRef.current !== null) {
      window.clearTimeout(stage5TransformTimerRef.current);
      stage5TransformTimerRef.current = null;
    }
  };

  /*
   * Stage 3 color transformation:
   *
   * When XP inside Stage 3 crosses from below 10 to 10 or more:
   * brown pony -> bright white/pink/purple flash -> magical pastel pony.
   */
  useEffect(() => {
    if (safeStage !== 3) {
      previousStage3XpRef.current = stageXp;
      stage3JustCrossedRef.current = false;
      clearStage3TransformTimer();
      setStage3TransformState("idle");
      return;
    }

    const previousStageXp = previousStage3XpRef.current;
    const crossedThreshold =
      previousStageXp < 10 && stageXp >= 10;

    previousStage3XpRef.current = stageXp;
    stage3JustCrossedRef.current = crossedThreshold;

    if (!crossedThreshold) {
      return;
    }

    clearStage3ReactionTimer();
    clearStage3TransformTimer();
    setStage3Reaction("normal");
    setStage3TransformState("transforming");

    stage3TransformTimerRef.current = window.setTimeout(() => {
      setStage3TransformState("idle");
      stage3JustCrossedRef.current = false;
      stage3TransformTimerRef.current = null;
    }, 2400);
  }, [safeStage, stageXp]);

  /* Stage 4: at 21 XP, transform into the horned form. */
  useEffect(() => {
    if (safeStage !== 4) {
      previousStage4XpRef.current = stageXp;
      stage4JustCrossedRef.current = false;
      clearStage4TransformTimer();
      setStage4TransformState("idle");
      return;
    }

    const previousXp = previousStage4XpRef.current;
    const crossed = previousXp < 21 && stageXp >= 21;
    previousStage4XpRef.current = stageXp;
    stage4JustCrossedRef.current = crossed;

    if (!crossed) return;

    clearStage4ReactionTimer();
    clearStage4TransformTimer();
    setStage4Reaction("normal");
    setStage4TransformState("transforming");

    stage4TransformTimerRef.current = window.setTimeout(() => {
      setStage4TransformState("idle");
      stage4JustCrossedRef.current = false;
      stage4TransformTimerRef.current = null;
    }, 3200);
  }, [safeStage, stageXp]);

  /*
   * Stage 5 final evolution:
   * 0–27 XP = horned pony
   * crossing 28 XP = final Alicorn transformation
   */
  useEffect(() => {
    if (safeStage !== 5) {
      previousStage5XpRef.current = stageXp;
      stage5JustCrossedRef.current = false;
      clearStage5TransformTimer();
      setStage5TransformState("idle");
      return;
    }

    const previousXp = previousStage5XpRef.current;
    const crossed = previousXp < 28 && stageXp >= 28;

    previousStage5XpRef.current = stageXp;
    stage5JustCrossedRef.current = crossed;

    if (!crossed) return;

    clearStage5ReactionTimer();
    clearStage5TransformTimer();
    setStage5Reaction("normal");
    setStage5TransformState("transforming");

    stage5TransformTimerRef.current = window.setTimeout(() => {
      setStage5TransformState("idle");
      stage5JustCrossedRef.current = false;
      stage5TransformTimerRef.current = null;
    }, 4400);
  }, [safeStage, stageXp]);

  /*
   * Gift reactions are detected when state ENTERS "happy".
   *
   * Stage 2:
   * pony-kiss.png dances 4 sec
   * -> kiss + hearts 1.5 sec
   * -> normal
   *
   * Stage 3:
   * pony-shy.png runs around shyly 3.8 sec
   * -> normal
   *
   * These reactions continue independently even if the main widget
   * changes state back to idle before the animation has finished.
   */
  useEffect(() => {
    const previousState = previousStateRef.current;
    previousStateRef.current = state;

    const enteredHappy =
      previousState !== "happy" && state === "happy";

    if (!enteredHappy) {
      return;
    }

    if (safeStage === 2) {
      clearStage2ReactionTimers();
      clearStage3ReactionTimer();

      setStage3Reaction("normal");
      setStage2Reaction("dance");

      stage2KissTimerRef.current = window.setTimeout(() => {
        setStage2Reaction("kiss");
        stage2KissTimerRef.current = null;
      }, 4000);

      stage2NormalTimerRef.current = window.setTimeout(() => {
        setStage2Reaction("normal");
        stage2NormalTimerRef.current = null;
      }, 5500);

      return;
    }

    if (safeStage === 3) {
      clearStage2ReactionTimers();
      clearStage3ReactionTimer();

      setStage2Reaction("normal");

      if (
        stage3JustCrossedRef.current ||
        stage3TransformState === "transforming"
      ) {
        setStage3Reaction("normal");
        return;
      }

      if (isEarlyStage3(stageXp)) {
        setStage3Reaction("butt");

        stage3NormalTimerRef.current = window.setTimeout(() => {
          setStage3Reaction("normal");
          stage3NormalTimerRef.current = null;
        }, 4000);

        return;
      }

      setStage3Reaction("shy");

      stage3NormalTimerRef.current = window.setTimeout(() => {
        setStage3Reaction("normal");
        stage3NormalTimerRef.current = null;
      }, 3800);
      return;
    }

    if (safeStage === 4) {
      clearStage4ReactionTimer();

      if (
        stage4JustCrossedRef.current ||
        stage4TransformState === "transforming"
      ) {
        setStage4Reaction("normal");
        return;
      }

      const early = isEarlyStage4(stageXp);
      setStage4Reaction(early ? "heartEyes" : "hornLove");

      stage4NormalTimerRef.current = window.setTimeout(() => {
        setStage4Reaction("normal");
        stage4NormalTimerRef.current = null;
      }, early ? 3800 : 4500);

      return;
    }

    if (safeStage === 5) {
      clearStage5ReactionTimer();

      if (
        stage5JustCrossedRef.current ||
        stage5TransformState === "transforming"
      ) {
        setStage5Reaction("normal");
        return;
      }

      const early = isEarlyStage5(stageXp);

      setStage5Reaction(early ? "training" : "fly");

      stage5NormalTimerRef.current = window.setTimeout(() => {
        setStage5Reaction("normal");
        stage5NormalTimerRef.current = null;
      }, early ? 4400 : 5600);
    }
  }, [
    safeStage,
    state,
    stageXp,
    stage3TransformState,
    stage4TransformState,
    stage5TransformState,
  ]);

  /*
   * Reset reactions when changing stages.
   */
  useEffect(() => {
    if (safeStage !== 2) {
      clearStage2ReactionTimers();
      setStage2Reaction("normal");
    }

    if (safeStage !== 3) {
      clearStage3ReactionTimer();
      clearStage3TransformTimer();
      setStage3Reaction("normal");
      setStage3TransformState("idle");
    }

    if (safeStage !== 4) {
      clearStage4ReactionTimer();
      clearStage4TransformTimer();
      setStage4Reaction("normal");
      setStage4TransformState("idle");
    }

    if (safeStage !== 5) {
      clearStage5ReactionTimer();
      clearStage5TransformTimer();
      setStage5Reaction("normal");
      setStage5TransformState("idle");
    }
  }, [safeStage]);

  /*
   * Cleanup on unmount only.
   */
  useEffect(() => {
    return () => {
      clearStage2ReactionTimers();
      clearStage3ReactionTimer();
      clearStage3TransformTimer();
      clearStage4ReactionTimer();
      clearStage4TransformTimer();
      clearStage5ReactionTimer();
      clearStage5TransformTimer();
    };
  }, []);

  const image = getPonyImage(safeStage, state);

  const rigStyle: CSSProperties = {
    width: 460,
    height: 390,
    transform: `scale(${scale})`,
    transformOrigin: "center bottom",
  };

  /*
   * =========================
   * STAGE 1 — MYSTERIOUS HAYSTACK
   *
   * 0–49%  = haystack only
   * 50–99% = pony peeks from behind haystack
   * =========================
   */
  if (safeStage === 1) {
    return (
      <div
        className={[
          "pony-pet-rig",
          "pony-pet-stage-1",
          `pony-pet-state-${state}`,
        ].join(" ")}
        style={rigStyle}
        aria-label={`Magic Pony Stage 1 ${Math.round(
          normalizedProgress,
        )} percent`}
      >
        <div
          className={[
            "pony-stage1-rig",
            `pony-stage1-phase-${stage1Phase}`,
          ].join(" ")}
        >
          <div
            className="pony-stage1-magic"
            aria-hidden="true"
          />

          {stage1Phase === "peek" && (
            <img
              src="/assets/pet/pony/stage-1/peek.png"
              alt="Tiny magic pony peeking from the haystack"
              className="pony-stage1-peek"
              draggable={false}
            />
          )}

          <img
            src="/assets/pet/pony/stage-1/haystack.png"
            alt="Mysterious magical haystack"
            className="pony-stage1-haystack"
            draggable={false}
          />
        </div>
      </div>
    );
  }

  /*
   * =========================
   * STAGE 2 — BABY PONY
   *
   * normal = pony sitting on haystack
   * dance  = pony-kiss.png dances for 4 sec
   * kiss   = pony-kiss.png + hearts for 1.5 sec
   * =========================
   */
  if (safeStage === 2) {
    const reactionMode = stage2Reaction !== "normal";
    const kissMode = stage2Reaction === "kiss";

    return (
      <div
        className={[
          "pony-pet-rig",
          "pony-pet-stage-2",
          `pony-pet-state-${state}`,
        ].join(" ")}
        style={rigStyle}
        aria-label="Baby Magic Pony Stage 2"
      >
        <div
          className={[
            "pony-stage2-rig",
            reactionMode ? "pony-stage2-mode-reaction" : "",
            kissMode ? "pony-stage2-mode-kiss" : "",
            stage2Reaction === "dance"
              ? "pony-stage2-mode-dance"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {!reactionMode && (
            <>
              <img
                src="/assets/pet/pony/stage-2/haystack.png"
                alt=""
                className="pony-stage2-haystack"
                draggable={false}
                aria-hidden="true"
              />

              <img
                src="/assets/pet/pony/stage-2/pony.png"
                alt="Baby Magic Pony sitting on a haystack"
                className="pony-stage2-pony"
                draggable={false}
              />
            </>
          )}

          {reactionMode && (
            <>
              <img
                src="/assets/pet/pony/stage-2/pony-kiss.png"
                alt="Baby Magic Pony dancing and sending a kiss"
                className="pony-stage2-kiss"
                draggable={false}
              />

              {kissMode && (
                <div
                  className="pony-stage2-mouth-hearts"
                  aria-hidden="true"
                >
                  <span className="pony-stage2-mouth-heart pony-stage2-mouth-heart-1">
                    💗
                  </span>
                  <span className="pony-stage2-mouth-heart pony-stage2-mouth-heart-2">
                    💕
                  </span>
                  <span className="pony-stage2-mouth-heart pony-stage2-mouth-heart-3">
                    💖
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  /*
   * =========================
   * STAGE 3 — YOUNG PONY
   *
   * First 10 XP inside Stage 3:
   *   normal = pony-brown.png
   *   gift   = pony-butt.png
   *
   * Crossing 10 XP:
   *   bright magical transformation
   *   brown -> white flash -> pastel pony
   *
   * After 10 XP:
   *   normal = pony.png
   *   gift   = pony-shy.png
   * =========================
   */
  if (safeStage === 3) {
    const earlyStage3 = isEarlyStage3(stageXp);
    const buttMode = stage3Reaction === "butt";
    const shyMode = stage3Reaction === "shy";
    const transforming =
      stage3TransformState === "transforming";

    return (
      <div
        className={[
          "pony-pet-rig",
          "pony-pet-stage-3",
          `pony-pet-state-${state}`,
          buttMode ? "pony-stage3-mode-butt" : "",
          shyMode ? "pony-stage3-mode-shy" : "",
          transforming ? "pony-stage3-transforming" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={rigStyle}
        aria-label={
          transforming
            ? "Young Pony magical transformation"
            : earlyStage3
              ? "Young Brown Pony Stage 3"
              : "Young Magic Pony Stage 3"
        }
      >
        <div className="pony-pet-glow" aria-hidden="true" />

        {transforming ? (
          <>
            <img
              src="/assets/pet/pony/stage-3/pony-brown.png"
              alt=""
              className="pony-stage3-transform-brown"
              draggable={false}
              aria-hidden="true"
            />

            <img
              src="/assets/pet/pony/stage-3/pony.png"
              alt="Young Magic Pony"
              className="pony-stage3-transform-magic"
              draggable={false}
            />

            <div
              className="pony-stage3-transform-aura"
              aria-hidden="true"
            />

            <div
              className="pony-stage3-transform-flash"
              aria-hidden="true"
            />

            <div
              className="pony-stage3-transform-sparkles"
              aria-hidden="true"
            >
              <span>✦</span>
              <span>✧</span>
              <span>✦</span>
              <span>✧</span>
              <span>✦</span>
              <span>✧</span>
            </div>
          </>
        ) : earlyStage3 ? (
          buttMode ? (
            <>
              <img
                src="/assets/pet/pony/stage-3/pony-butt.png"
                alt="Young brown pony happily wiggling after receiving a gift"
                className="pony-stage3-butt"
                draggable={false}
              />

              <div
                className="pony-stage3-butt-sparkles"
                aria-hidden="true"
              >
                <span className="pony-stage3-butt-sparkle sparkle-1">✦</span>
                <span className="pony-stage3-butt-sparkle sparkle-2">✧</span>
                <span className="pony-stage3-butt-sparkle sparkle-3">✦</span>
                <span className="pony-stage3-butt-sparkle sparkle-4">✧</span>
                <span className="pony-stage3-butt-sparkle sparkle-5">✦</span>
                <span className="pony-stage3-butt-sparkle sparkle-6">✧</span>
              </div>
            </>
          ) : (
            <img
              src="/assets/pet/pony/stage-3/pony-brown.png"
              alt="Young brown pony"
              className="pony-stage3-brown"
              draggable={false}
            />
          )
        ) : shyMode ? (
          <img
            src="/assets/pet/pony/stage-3/pony-shy.png"
            alt="Young Magic Pony feeling shy after receiving a gift"
            className="pony-stage3-shy"
            draggable={false}
          />
        ) : (
          <img
            src="/assets/pet/pony/stage-3/pony.png"
            alt="Young Magic Pony"
            className="pony-pet-image"
            draggable={false}
          />
        )}
      </div>
    );
  }

  if (safeStage === 4) {
    const early = isEarlyStage4(stageXp);
    const heartEyes = stage4Reaction === "heartEyes";
    const hornLove = stage4Reaction === "hornLove";
    const transforming = stage4TransformState === "transforming";

    return (
      <div
        className={[
          "pony-pet-rig",
          "pony-pet-stage-4",
          `pony-pet-state-${state}`,
          heartEyes ? "pony-stage4-mode-heart-eyes" : "",
          hornLove ? "pony-stage4-mode-horn-love" : "",
          transforming ? "pony-stage4-transforming" : "",
        ].filter(Boolean).join(" ")}
        style={rigStyle}
        aria-label={transforming ? "Dream Pony magical transformation" : "Dream Pony Stage 4"}
      >
        <div className="pony-pet-glow" aria-hidden="true" />

        {transforming ? (
          <>
            <img src="/assets/pet/pony/stage-4/pony.png" alt="" className="pony-stage4-transform-before" draggable={false} />
            <img src="/assets/pet/pony/stage-4/pony-horn.png" alt="Dream Unicorn" className="pony-stage4-transform-after" draggable={false} />
            <div className="pony-stage4-transform-aura" aria-hidden="true" />
            <div className="pony-stage4-mist" aria-hidden="true">
              <span className="pony-stage4-mist-cloud mist-1" />
              <span className="pony-stage4-mist-cloud mist-2" />
              <span className="pony-stage4-mist-cloud mist-3" />
              <span className="pony-stage4-mist-cloud mist-4" />
            </div>
            <div className="pony-stage4-transform-flash" aria-hidden="true" />
            <div className="pony-stage4-transform-sparkles" aria-hidden="true">
              <span>✦</span><span>✧</span><span>✦</span><span>✧</span>
              <span>✦</span><span>✧</span><span>✦</span><span>✧</span>
            </div>
          </>
        ) : heartEyes ? (
          <img src="/assets/pet/pony/stage-4/pony-heart-eyes.png" alt="Dream Pony with heart eyes" className="pony-stage4-heart-eyes" draggable={false} />
        ) : hornLove ? (
          <>
            <img src="/assets/pet/pony/stage-4/pony-horn-love.png" alt="Dream Unicorn playful gift reaction" className="pony-stage4-horn-love" draggable={false} />
            <div className="pony-stage4-love-effects" aria-hidden="true">
              <span className="pony-stage4-love-heart heart-1">💗</span>
              <span className="pony-stage4-love-heart heart-2">💕</span>
              <span className="pony-stage4-love-heart heart-3">💖</span>
              <span className="pony-stage4-love-sparkle love-sparkle-1">✦</span>
              <span className="pony-stage4-love-sparkle love-sparkle-2">✧</span>
              <span className="pony-stage4-love-sparkle love-sparkle-3">✦</span>
              <span className="pony-stage4-love-sparkle love-sparkle-4">✧</span>
            </div>
          </>
        ) : (
          <img
            src={early ? "/assets/pet/pony/stage-4/pony.png" : "/assets/pet/pony/stage-4/pony-horn.png"}
            alt={early ? "Dream Pony" : "Dream Unicorn"}
            className={early ? "pony-stage4-normal" : "pony-stage4-horn"}
            draggable={false}
          />
        )}
      </div>
    );
  }

  /*
   * =========================
   * STAGE 5 — LEGENDARY ALICORN
   *
   * 0–27 XP:
   * normal = pony.png
   * gift = pony-flight-training.png
   *
   * 28 XP:
   * pony-transform.png + magical transformation effects
   *
   * 28+ XP:
   * pony-winged.png + wing-left.png + wing-right.png
   * gift = fly + fast wing flapping
   * =========================
   */
  if (safeStage === 5) {
    const early = isEarlyStage5(stageXp);
    const training = stage5Reaction === "training";
    const flying = stage5Reaction === "fly";
    const transforming = stage5TransformState === "transforming";

    return (
      <div
        className={[
          "pony-pet-rig",
          "pony-pet-stage-5",
          `pony-pet-state-${state}`,
          training ? "pony-stage5-mode-training" : "",
          flying ? "pony-stage5-mode-fly" : "",
          transforming ? "pony-stage5-transforming" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={rigStyle}
        aria-label={
          transforming
            ? "Legendary Alicorn final transformation"
            : early
              ? "Stage 5 horned pony"
              : "Legendary Winged Alicorn"
        }
      >
        <div className="pony-pet-glow" aria-hidden="true" />

        {transforming ? (
          <>
            <img
              src="/assets/pet/pony/stage-5/pony-transform.png"
              alt="Magic Pony transforming into a Legendary Alicorn"
              className="pony-stage5-transform-pony"
              draggable={false}
            />

            <div
              className="pony-stage5-transform-aura"
              aria-hidden="true"
            />

            <div
              className="pony-stage5-transform-mist"
              aria-hidden="true"
            >
              <span className="pony-stage5-mist mist-1" />
              <span className="pony-stage5-mist mist-2" />
              <span className="pony-stage5-mist mist-3" />
              <span className="pony-stage5-mist mist-4" />
            </div>

            <div
              className="pony-stage5-wing-light"
              aria-hidden="true"
            >
              <span className="pony-stage5-wing-light-left" />
              <span className="pony-stage5-wing-light-right" />
            </div>

            <div
              className="pony-stage5-transform-flash"
              aria-hidden="true"
            />

            <div
              className="pony-stage5-transform-sparkles"
              aria-hidden="true"
            >
              <span>✦</span>
              <span>✧</span>
              <span>✦</span>
              <span>✧</span>
              <span>✦</span>
              <span>✧</span>
              <span>✦</span>
              <span>✧</span>
            </div>

            <div
              className="pony-stage5-final-reveal"
              aria-hidden="true"
            >
              <img
                src="/assets/pet/pony/stage-5/wing-left.png"
                alt=""
                className="pony-stage5-wing pony-stage5-wing-left"
                draggable={false}
              />

              <img
                src="/assets/pet/pony/stage-5/wing-right.png"
                alt=""
                className="pony-stage5-wing pony-stage5-wing-right"
                draggable={false}
              />

              <img
                src="/assets/pet/pony/stage-5/pony-winged.png"
                alt=""
                className="pony-stage5-winged-body"
                draggable={false}
              />
            </div>
          </>
        ) : early ? (
          training ? (
            <>
              <img
                src="/assets/pet/pony/stage-5/pony-flight-training.png"
                alt="Horned Magic Pony practicing how to fly"
                className="pony-stage5-flight-training"
                draggable={false}
              />

              <div
                className="pony-stage5-training-sparkles"
                aria-hidden="true"
              >
                <span>✦</span>
                <span>✧</span>
                <span>✦</span>
                <span>✧</span>
              </div>
            </>
          ) : (
            <img
              src="/assets/pet/pony/stage-5/pony.png"
              alt="Stage 5 horned Magic Pony"
              className="pony-stage5-normal"
              draggable={false}
            />
          )
        ) : (
          <div
            className={[
              "pony-stage5-alicorn-rig",
              flying ? "pony-stage5-alicorn-flying" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <img
              src="/assets/pet/pony/stage-5/wing-left.png"
              alt=""
              className="pony-stage5-wing pony-stage5-wing-left"
              draggable={false}
              aria-hidden="true"
            />

            <img
              src="/assets/pet/pony/stage-5/wing-right.png"
              alt=""
              className="pony-stage5-wing pony-stage5-wing-right"
              draggable={false}
              aria-hidden="true"
            />

            <img
              src="/assets/pet/pony/stage-5/pony-winged.png"
              alt="Legendary Winged Alicorn"
              className="pony-stage5-winged-body"
              draggable={false}
            />

            {flying && (
              <div
                className="pony-stage5-flight-effects"
                aria-hidden="true"
              >
                <span className="pony-stage5-flight-sparkle flight-sparkle-1">
                  ✦
                </span>
                <span className="pony-stage5-flight-sparkle flight-sparkle-2">
                  ✧
                </span>
                <span className="pony-stage5-flight-sparkle flight-sparkle-3">
                  ✦
                </span>
                <span className="pony-stage5-flight-heart flight-heart-1">
                  💗
                </span>
                <span className="pony-stage5-flight-heart flight-heart-2">
                  💕
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  /*
   * =========================
   * STAGE 4–5
   * =========================
   */
  return (
    <div
      className={[
        "pony-pet-rig",
        `pony-pet-stage-${safeStage}`,
        `pony-pet-state-${state}`,
      ].join(" ")}
      style={rigStyle}
      aria-label={`Magic Pony Stage ${safeStage}`}
    >
      <div
        className="pony-pet-glow"
        aria-hidden="true"
      />

      {safeStage >= 4 && (
        <div
          className="pony-pet-sparkles"
          aria-hidden="true"
        >
          <span className="pony-pet-sparkle pony-pet-sparkle-1">
            ✦
          </span>
          <span className="pony-pet-sparkle pony-pet-sparkle-2">
            ✧
          </span>
          <span className="pony-pet-sparkle pony-pet-sparkle-3">
            ✦
          </span>
          <span className="pony-pet-sparkle pony-pet-sparkle-4">
            ♡
          </span>
        </div>
      )}

      <img
        key={`${safeStage}-${state}`}
        src={image.primary}
        alt={`Magic Pony Stage ${safeStage}`}
        className="pony-pet-image"
        draggable={false}
        onError={(event) => {
          const target = event.currentTarget;

          if (target.src.endsWith(image.fallback)) {
            return;
          }

          target.src = image.fallback;
        }}
      />
    </div>
  );
}