"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { DEFAULT_PRIZES } from "./GiftWheelConfig";
import { SERVER_URL } from "@/lib/core/server-url";

import type {
  GiftWheelPayload,
  WheelPrize,
  WheelResult,
} from "./GiftWheelTypes";

type GiftWheelEngineProps = {
  overlayId: string;
  prizes?: WheelPrize[];
};

type ConfettiPiece = {
  id: number;
  x: number;
  delay: number;
  duration: number;
  rotation: number;
  size: number;
  shape: "circle" | "square";
};

const SPIN_DURATION_MS = 5200;
const RESULT_VISIBLE_MS = 4200;
const EXTRA_ROTATIONS = 7;
const WHEEL_LIGHT_COUNT = 28;
const GIFTS_PER_SPIN = 10;

function getPrizeWeight(prize: WheelPrize) {
  return Math.max(0, Number(prize.weight) || 0);
}

function pickWeightedPrize(prizes: WheelPrize[]): WheelResult {
  const validPrizes = prizes.length > 0 ? prizes : DEFAULT_PRIZES;
  const totalWeight = validPrizes.reduce(
    (sum, prize) => sum + getPrizeWeight(prize),
    0,
  );

  if (totalWeight <= 0) {
    const index = Math.floor(Math.random() * validPrizes.length);

    return {
      prize: validPrizes[index],
      index,
    };
  }

  let random = Math.random() * totalWeight;

  for (let index = 0; index < validPrizes.length; index += 1) {
    random -= getPrizeWeight(validPrizes[index]);

    if (random <= 0) {
      return {
        prize: validPrizes[index],
        index,
      };
    }
  }

  const fallbackIndex = validPrizes.length - 1;

  return {
    prize: validPrizes[fallbackIndex],
    index: fallbackIndex,
  };
}

function getPrizeUnderPointer(
  rotation: number,
  prizes: WheelPrize[],
): WheelResult {
  const segmentAngle = 360 / prizes.length;
  const normalizedRotation = ((rotation % 360) + 360) % 360;

  // conic-gradient เริ่มที่ -90deg และลูกศรอยู่ด้านบนที่ 0deg
  const pointerAngle = (90 - normalizedRotation + 360) % 360;
  const index = Math.floor(pointerAngle / segmentAngle) % prizes.length;

  return {
    prize: prizes[index],
    index,
  };
}

function createConfetti(count = 60): ConfettiPiece[] {
  return Array.from({ length: count }, (_, index) => ({
    id: Date.now() + index,
    x: Math.random() * 100,
    delay: Math.random() * 0.7,
    duration: 2.6 + Math.random() * 2.3,
    rotation: -540 + Math.random() * 1080,
    size: 6 + Math.random() * 10,
    shape: Math.random() > 0.5 ? "circle" : "square",
  }));
}

export function GiftWheelEngine({
  overlayId,
  prizes = DEFAULT_PRIZES,
}: GiftWheelEngineProps) {
  const wheelPrizes = useMemo(
    () => (prizes.length >= 2 ? prizes : DEFAULT_PRIZES),
    [prizes],
  );

  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showWheel, setShowWheel] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<WheelResult | null>(null);
  const [gifterName, setGifterName] = useState("");
  const [giftLabel, setGiftLabel] = useState("");
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [runId, setRunId] = useState(0);
  const [stopBurst, setStopBurst] = useState(false);
  const [giftBalance, setGiftBalance] = useState(0);
  const [queuedSpins, setQueuedSpins] = useState(0);

  const rotationRef = useRef(0);
  const spinningRef = useRef(false);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const giftBalanceRef = useRef(0);
  const spinQueueRef = useRef<GiftWheelPayload[]>([]);
  const startNextSpinRef = useRef<() => void>(() => {});

  const segmentAngle = 360 / wheelPrizes.length;

  const wheelBackground = useMemo(() => {
    const palette = [
      "#ec4899",
      "#8b5cf6",
      "#06b6d4",
      "#f59e0b",
      "#22c55e",
      "#ef4444",
      "#3b82f6",
      "#a855f7",
    ];

    return wheelPrizes
      .map((_, index) => {
        const start = index * segmentAngle;
        const end = start + segmentAngle;
        const color = palette[index % palette.length];

        return `${color} ${start}deg ${end}deg`;
      })
      .join(", ");
  }, [segmentAngle, wheelPrizes]);

  const getAudioContext = () => {
    if (typeof window === "undefined") return null;

    if (!audioContextRef.current) {
      const AudioContextClass =
        window.AudioContext ||
        (
          window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;

      if (!AudioContextClass) return null;

      audioContextRef.current = new AudioContextClass();
    }

    if (audioContextRef.current.state === "suspended") {
      void audioContextRef.current.resume().catch(() => {
        // Browser may block audio until the overlay receives user interaction.
      });
    }

    return audioContextRef.current;
  };

  const playTickSound = (progress: number) => {
    const audioContext = getAudioContext();

    if (!audioContext || audioContext.state !== "running") return;

    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(1050 - progress * 360, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.04);
  };

  const stopTickLoop = () => {
    if (tickFrameRef.current !== null) {
      cancelAnimationFrame(tickFrameRef.current);
      tickFrameRef.current = null;
    }
  };

  const startTickLoop = (
    startRotation: number,
    endRotation: number,
  ) => {
    stopTickLoop();

    const startedAt = performance.now();
    let lastSegment = Math.floor(startRotation / segmentAngle);

    const animateTick = (now: number) => {
      const elapsed = now - startedAt;
      const progress = Math.min(elapsed / SPIN_DURATION_MS, 1);

      // Approximate the wheel's visual easing so each tick follows the pointer.
      const easedProgress = 1 - Math.pow(1 - progress, 4);
      const currentRotation =
        startRotation + (endRotation - startRotation) * easedProgress;
      const currentSegment = Math.floor(currentRotation / segmentAngle);

      if (currentSegment !== lastSegment) {
        const crossedSegments = Math.min(
          Math.abs(currentSegment - lastSegment),
          3,
        );

        for (let index = 0; index < crossedSegments; index += 1) {
          playTickSound(progress);
        }

        lastSegment = currentSegment;
      }

      if (progress < 1) {
        tickFrameRef.current = requestAnimationFrame(animateTick);
      } else {
        tickFrameRef.current = null;
      }
    };

    tickFrameRef.current = requestAnimationFrame(animateTick);
  };

  const clearTimers = () => {
    stopTickLoop();

    if (resultTimerRef.current) {
      clearTimeout(resultTimerRef.current);
      resultTimerRef.current = null;
    }

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const resetWheel = () => {
    clearTimers();

    rotationRef.current = 0;
    spinningRef.current = false;
    giftBalanceRef.current = 0;
    spinQueueRef.current = [];

    setRotation(0);
    setIsSpinning(false);
    setShowWheel(false);
    setShowResult(false);
    setResult(null);
    setGifterName("");
    setGiftLabel("");
    setConfetti([]);
    setRunId(0);
    setStopBurst(false);
    setGiftBalance(0);
    setQueuedSpins(0);
  };

  const performSpin = (payload: GiftWheelPayload) => {
    if (spinningRef.current) return;

    clearTimers();

    const selected = pickWeightedPrize(wheelPrizes);
    const segmentCenter = selected.index * segmentAngle + segmentAngle / 2;

    const normalizedCurrent = ((rotationRef.current % 360) + 360) % 360;

    // จัดกึ่งกลางช่องที่สุ่มได้ให้หยุดตรงใต้ลูกศร
    const targetNormalized = (90 - segmentCenter + 360) % 360;
    const delta =
      EXTRA_ROTATIONS * 360 +
      ((targetNormalized - normalizedCurrent + 360) % 360);

    const startRotation = rotationRef.current;
    const nextRotation = startRotation + delta;

    spinningRef.current = true;
    rotationRef.current = nextRotation;

    setRunId(Date.now());
    setResult(null);
    setShowResult(false);
    setConfetti([]);
    setStopBurst(false);
    setGifterName(payload.user || "Viewer");
    setGiftLabel(
      `${payload.giftName || "Gift"} x${Math.max(payload.amount || 1, 1)}`,
    );
    setShowWheel(true);
    setIsSpinning(true);

    // Prepare Web Audio as early as possible, then follow each segment crossing.
    getAudioContext();
    startTickLoop(startRotation, nextRotation);

    requestAnimationFrame(() => {
      setRotation(nextRotation);
    });

    resultTimerRef.current = setTimeout(() => {
      spinningRef.current = false;
      stopTickLoop();

      setIsSpinning(false);

      const landedResult = getPrizeUnderPointer(
        nextRotation,
        wheelPrizes,
      );

      setResult(landedResult);
      setShowResult(true);
      setConfetti(createConfetti());
      setStopBurst(true);

      window.setTimeout(() => {
        setStopBurst(false);
      }, 950);

      hideTimerRef.current = setTimeout(() => {
        setShowResult(false);
        setConfetti([]);

        // ถ้ามีสิทธิ์หมุนค้างอยู่ ให้เริ่มรอบถัดไปอัตโนมัติ
        startNextSpinRef.current();
      }, RESULT_VISIBLE_MS);
    }, SPIN_DURATION_MS);
  };

  const startNextSpin = () => {
    if (spinningRef.current) return;

    const nextPayload = spinQueueRef.current.shift();

    setQueuedSpins(spinQueueRef.current.length);

    if (!nextPayload) return;

    performSpin(nextPayload);
  };

  startNextSpinRef.current = startNextSpin;

  const addGiftToSpinQueue = (payload: GiftWheelPayload) => {
    const amount = Math.max(Number(payload.amount) || 0, 0);

    if (amount <= 0) return;

    const totalGifts = giftBalanceRef.current + amount;
    const spinsEarned = Math.floor(totalGifts / GIFTS_PER_SPIN);
    const remainder = totalGifts % GIFTS_PER_SPIN;

    giftBalanceRef.current = remainder;
    setGiftBalance(remainder);

    if (spinsEarned <= 0) {
      return;
    }

    const spinPayload: GiftWheelPayload = {
      ...payload,
      amount: GIFTS_PER_SPIN,
    };

    const newSpins = Array.from(
      { length: spinsEarned },
      () => ({ ...spinPayload }),
    );

    spinQueueRef.current.push(...newSpins);
    setQueuedSpins(spinQueueRef.current.length);

    startNextSpinRef.current();
  };

  useEffect(() => {
    if (!overlayId) return;

    const socket = io(SERVER_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    const joinOverlay = () => {
      socket.emit("join-overlay", overlayId);
    };

    const handleTestWheel = (payload?: GiftWheelPayload) => {
      addGiftToSpinQueue(
        payload ?? {
          user: "Test Viewer",
          giftName: "Rose",
          amount: GIFTS_PER_SPIN,
          diamond: GIFTS_PER_SPIN,
        },
      );
    };

    const handleWheelGift = (payload: GiftWheelPayload) => {
      addGiftToSpinQueue(payload);
    };

    const handleResetWheel = () => {
      resetWheel();
    };

    socket.on("connect", joinOverlay);
    socket.on("test-wheel", handleTestWheel);
    socket.on("wheel-gift", handleWheelGift);
    socket.on("reset-wheel", handleResetWheel);

    if (socket.connected) {
      joinOverlay();
    }

    return () => {
      clearTimers();

      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }

      socket.off("connect", joinOverlay);
      socket.off("test-wheel", handleTestWheel);
      socket.off("wheel-gift", handleWheelGift);
      socket.off("reset-wheel", handleResetWheel);
      socket.disconnect();
    };
  }, [overlayId, segmentAngle, wheelPrizes]);

  return (
    <main className="fixed inset-0 overflow-hidden bg-transparent text-white">
      {!showWheel && giftBalance > 0 && (
        <div className="fixed left-1/2 top-[8vh] z-30 -translate-x-1/2 rounded-full border border-pink-300/70 bg-zinc-950/85 px-5 py-2 text-sm font-black shadow-[0_0_24px_rgba(236,72,153,0.55)]">
          🎡 Saved {giftBalance}/{GIFTS_PER_SPIN} gifts
        </div>
      )}

      {showWheel && (
        <section
          key={runId}
          className="animate-wheel-stage fixed inset-0 z-40 flex flex-col items-center justify-center"
        >
          {!showResult && (
            <div className="mb-5 w-[420px] rounded-[2rem] border-4 border-pink-200 bg-gradient-to-r from-fuchsia-700/95 via-pink-600/95 to-orange-500/95 px-8 py-4 text-center shadow-[0_0_48px_rgba(236,72,153,0.9)]">
              <div className="text-sm font-black tracking-[0.22em] text-pink-100">
                🎁 GIFT JACKPOT WHEEL 🎁
              </div>
              <div className="mt-1 text-2xl font-black">{gifterName}</div>
              <div className="mt-1 text-sm font-bold text-yellow-100">
                {giftLabel}
              </div>
              <div className="mt-2 text-xs font-bold text-white/85">
                Every {GIFTS_PER_SPIN} gifts = 1 spin · Saved {giftBalance}/
                {GIFTS_PER_SPIN}
                {queuedSpins > 0 ? ` · Queue ${queuedSpins}` : ""}
              </div>
            </div>
          )}

          <div
            className={`relative h-[360px] w-[360px] ${
              stopBurst ? "animate-wheel-stop-burst" : ""
            }`}
          >
            <div className="absolute inset-[-12px] rounded-full bg-fuchsia-500/30 blur-3xl" />

            <div className="pointer-events-none absolute inset-[-7px] z-[70]">
              {Array.from({ length: WHEEL_LIGHT_COUNT }, (_, index) => {
                const angle = (360 / WHEEL_LIGHT_COUNT) * index;

                return (
                  <span
                    key={`wheel-light-${index}`}
                    className={`absolute left-1/2 top-1/2 h-[10px] w-[10px] rounded-full ${
                      isSpinning
                        ? "animate-wheel-light-run"
                        : showResult
                          ? "animate-wheel-light-win"
                          : "bg-yellow-200/75"
                    }`}
                    style={{
                      transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-181px)`,
                      animationDelay: `${index * 0.045}s`,
                    }}
                  />
                );
              })}
            </div>

            <div className="absolute left-1/2 top-[-18px] z-[80] -translate-x-1/2">
              <div className="h-0 w-0 border-l-[18px] border-r-[18px] border-t-[34px] border-l-transparent border-r-transparent border-t-yellow-300 drop-shadow-[0_4px_7px_rgba(0,0,0,0.65)]" />
            </div>

            <div className="absolute inset-0 rounded-full border-[14px] border-yellow-300 bg-zinc-950 shadow-[0_0_42px_rgba(250,204,21,0.9)]">
              <div
                className="absolute inset-[12px] overflow-hidden rounded-full"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning
                    ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.12, 0.72, 0.12, 1)`
                    : "none",
                }}
              >
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(from -90deg, ${wheelBackground})`,
                  }}
                />

                {wheelPrizes.map((prize, index) => {
                  /*
                   * CSS conic-gradient ใช้ 0deg ที่ด้านบน และหมุนตามเข็มนาฬิกา
                   * วงล้อเริ่มจาก -90deg จึงต้องคำนวณด้วย sin/cos แบบ CSS
                   * เพื่อให้ Emoji อยู่ตรงกึ่งกลางของแต่ละช่องสีจริง
                   */
                  const cssAngle =
                    -90 + index * segmentAngle + segmentAngle / 2;
                  const angleInRadians = (cssAngle * Math.PI) / 180;
                  const emojiRadiusPercent = 31;

                  const emojiX =
                    50 + Math.sin(angleInRadians) * emojiRadiusPercent;
                  const emojiY =
                    50 - Math.cos(angleInRadians) * emojiRadiusPercent;

                  return (
                    <div
                      key={prize.id}
                      className="absolute z-20 flex h-[64px] w-[64px] -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                      style={{
                        left: `${emojiX}%`,
                        top: `${emojiY}%`,
                      }}
                    >
                      <div className="text-5xl leading-none drop-shadow-[0_3px_5px_rgba(0,0,0,0.75)]">
                        {prize.emoji}
                      </div>
                    </div>
                  );
                })}

                <div className="absolute left-1/2 top-1/2 z-30 h-[54px] w-[54px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[5px] border-yellow-200 bg-gradient-to-br from-yellow-300 to-orange-500 shadow-[0_0_18px_rgba(250,204,21,0.95)]" />
              </div>
            </div>

            {isSpinning && (
              <div className="animate-spin-glow absolute inset-[-12px] rounded-full border-4 border-white/70" />
            )}
          </div>

          {showResult && result && (
            <div className="animate-winner-card relative mt-4 min-w-[360px] max-w-[480px] overflow-hidden rounded-[2rem] border-4 border-yellow-200 bg-gradient-to-r from-amber-700/95 via-yellow-500/95 to-orange-600/95 px-8 py-4 text-center shadow-[0_0_65px_rgba(250,204,21,1)]">
              <div className="pointer-events-none absolute inset-0 animate-winner-shine bg-[linear-gradient(110deg,transparent_20%,rgba(255,255,255,0.65)_46%,transparent_72%)]" />

              <div className="relative">
                <div className="text-sm font-black tracking-[0.22em] text-yellow-50">
                  🏆 WINNER 🏆
                </div>
                <div className="animate-winner-emoji mt-2 text-5xl">
                  {result.prize.emoji}
                </div>
                <div className="mt-1 text-2xl font-black drop-shadow-[0_3px_4px_rgba(0,0,0,0.35)]">
                  {result.prize.label}
                </div>
                <div className="mt-2 text-base font-bold text-yellow-50/90">
                  Congratulations, {gifterName}!
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {confetti.map((piece) => (
        <span
          key={piece.id}
          className="animate-confetti fixed top-[-30px] z-[100]"
          style={{
            left: `${piece.x}vw`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            borderRadius: piece.shape === "circle" ? "999px" : "2px",
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            ["--confetti-rotate" as string]: `${piece.rotation}deg`,
            background:
              piece.id % 5 === 0
                ? "#facc15"
                : piece.id % 5 === 1
                  ? "#ec4899"
                  : piece.id % 5 === 2
                    ? "#8b5cf6"
                    : piece.id % 5 === 3
                      ? "#22c55e"
                      : "#38bdf8",
          }}
        />
      ))}

      <style jsx>{`
        :global(html),
        :global(body) {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: transparent !important;
        }

        @keyframes wheelStage {
          0% {
            opacity: 0;
            transform: scale(0.72);
          }

          65% {
            opacity: 1;
            transform: scale(1.05);
          }

          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes wheelLightRun {
          0%,
          100% {
            opacity: 0.25;
            background: #fde68a;
            box-shadow: 0 0 5px rgba(250, 204, 21, 0.4);
          }

          45% {
            opacity: 1;
            background: #ffffff;
            box-shadow:
              0 0 8px rgba(255, 255, 255, 0.95),
              0 0 12px rgba(250, 204, 21, 0.9);
          }
        }

        @keyframes wheelLightWin {
          0%,
          100% {
            opacity: 0.4;
            background: #fde68a;
          }

          50% {
            opacity: 1;
            background: #ffffff;
            box-shadow:
              0 0 9px rgba(255, 255, 255, 1),
              0 0 15px rgba(250, 204, 21, 1);
          }
        }

        @keyframes wheelStopBurst {
          0% {
            transform: scale(1);
            filter: brightness(1);
          }

          35% {
            transform: scale(1.08);
            filter: brightness(1.65);
          }

          65% {
            transform: scale(0.97);
            filter: brightness(1.15);
          }

          100% {
            transform: scale(1);
            filter: brightness(1);
          }
        }

        @keyframes winnerCard {
          0% {
            opacity: 0;
            transform: translateY(28px) scale(0.55) rotate(-2deg);
          }

          58% {
            opacity: 1;
            transform: translateY(-7px) scale(1.09) rotate(1deg);
          }

          78% {
            transform: translateY(3px) scale(0.97) rotate(0deg);
          }

          100% {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(0deg);
          }
        }

        @keyframes winnerEmoji {
          0% {
            transform: scale(0.35) rotate(-24deg);
          }

          60% {
            transform: scale(1.25) rotate(10deg);
          }

          100% {
            transform: scale(1) rotate(0deg);
          }
        }

        @keyframes winnerShine {
          0% {
            transform: translateX(-130%);
          }

          100% {
            transform: translateX(130%);
          }
        }

        @keyframes resultPop {
          0% {
            opacity: 0;
            transform: translateY(22px) scale(0.7);
          }

          70% {
            opacity: 1;
            transform: translateY(-4px) scale(1.06);
          }

          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes spinGlow {
          0%,
          100% {
            opacity: 0.25;
            transform: scale(0.98);
          }

          50% {
            opacity: 1;
            transform: scale(1.04);
          }
        }

        @keyframes confettiFall {
          0% {
            opacity: 0;
            transform: translate3d(0, -30px, 0) rotate(0deg);
          }

          10% {
            opacity: 1;
          }

          100% {
            opacity: 0.95;
            transform: translate3d(
                calc((var(--confetti-rotate) / 12)),
                105vh,
                0
              )
              rotate(var(--confetti-rotate));
          }
        }

        .animate-wheel-stage {
          animation: wheelStage 0.8s cubic-bezier(0.18, 0.9, 0.22, 1) both;
        }

        .animate-wheel-light-run {
          animation: wheelLightRun 0.72s ease-in-out infinite;
        }

        .animate-wheel-light-win {
          animation: wheelLightWin 0.34s ease-in-out infinite;
        }

        .animate-wheel-stop-burst {
          animation: wheelStopBurst 0.9s cubic-bezier(0.18, 0.9, 0.22, 1)
            both;
        }

        .animate-winner-card {
          animation: winnerCard 0.72s cubic-bezier(0.18, 0.9, 0.22, 1)
            both;
        }

        .animate-winner-emoji {
          animation: winnerEmoji 0.72s cubic-bezier(0.18, 0.9, 0.22, 1)
            both;
        }

        .animate-winner-shine {
          animation: winnerShine 1.15s ease-out 0.15s both;
        }

        .animate-result-pop {
          animation: resultPop 0.55s cubic-bezier(0.18, 0.9, 0.22, 1) both;
        }

        .animate-spin-glow {
          animation: spinGlow 0.75s ease-in-out infinite;
        }

        .animate-confetti {
          animation-name: confettiFall;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
      `}</style>
    </main>
  );
}