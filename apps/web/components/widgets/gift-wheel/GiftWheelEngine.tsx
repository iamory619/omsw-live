"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { DEFAULT_PRIZES } from "./GiftWheelConfig";
import type {
  GiftWheelPayload,
  WheelPrize,
  WheelResult,
} from "./GiftWheelTypes";

const SERVER_URL = "https://server-production-b88b.up.railway.app";

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

  const rotationRef = useRef(0);
  const spinningRef = useRef(false);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const clearTimers = () => {
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

    setRotation(0);
    setIsSpinning(false);
    setShowWheel(false);
    setShowResult(false);
    setResult(null);
    setGifterName("");
    setGiftLabel("");
    setConfetti([]);
    setRunId(0);
  };

  const spinWheel = (payload: GiftWheelPayload) => {
    if (spinningRef.current) return;

    clearTimers();

    const selected = pickWeightedPrize(wheelPrizes);
    const segmentCenter = selected.index * segmentAngle + segmentAngle / 2;

    const normalizedCurrent =
      ((rotationRef.current % 360) + 360) % 360;

    const targetNormalized = (360 - segmentCenter) % 360;
    const delta =
      EXTRA_ROTATIONS * 360 +
      ((targetNormalized - normalizedCurrent + 360) % 360);

    const nextRotation = rotationRef.current + delta;

    spinningRef.current = true;
    rotationRef.current = nextRotation;

    setRunId(Date.now());
    setResult(null);
    setShowResult(false);
    setConfetti([]);
    setGifterName(payload.user || "Viewer");
    setGiftLabel(
      `${payload.giftName || "Gift"} x${Math.max(payload.amount || 1, 1)}`,
    );
    setShowWheel(true);
    setIsSpinning(true);

    requestAnimationFrame(() => {
      setRotation(nextRotation);
    });

    resultTimerRef.current = setTimeout(() => {
      spinningRef.current = false;

      setIsSpinning(false);
      setResult(selected);
      setShowResult(true);
      setConfetti(createConfetti());

      hideTimerRef.current = setTimeout(() => {
        setShowResult(false);
        setConfetti([]);
      }, RESULT_VISIBLE_MS);
    }, SPIN_DURATION_MS);
  };

  useEffect(() => {
    if (!overlayId) return;

    const socket = io(SERVER_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    const joinOverlay = () => {
      socket.emit("join-overlay", overlayId);
    };

    const handleTestWheel = (payload?: GiftWheelPayload) => {
      spinWheel(
        payload ?? {
          user: "Test Viewer",
          giftName: "Rose",
          amount: 10,
          diamond: 10,
        },
      );
    };

    const handleWheelGift = (payload: GiftWheelPayload) => {
      spinWheel(payload);
    };

    const handleResetWheel = () => {
      resetWheel();
    };

    socket.on("connect", joinOverlay);
    socket.on("test-wheel", handleTestWheel);
    socket.on("wheel-gift", handleWheelGift);
    socket.on("reset-wheel", handleResetWheel);

    socket.on("connect_error", (error) => {
      console.error("Gift Wheel socket error:", error);
    });

    if (socket.connected) {
      joinOverlay();
    }

    return () => {
      clearTimers();
      socket.off("connect", joinOverlay);
      socket.off("test-wheel", handleTestWheel);
      socket.off("wheel-gift", handleWheelGift);
      socket.off("reset-wheel", handleResetWheel);
      socket.disconnect();
    };
  }, [overlayId, segmentAngle, wheelPrizes]);

  return (
    <main className="fixed inset-0 overflow-hidden bg-transparent text-white">
      {showWheel && (
        <section
          key={runId}
          className="animate-wheel-stage fixed left-1/2 top-1/2 z-40 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
        >
          <div className="mb-5 rounded-[2rem] border-4 border-pink-200 bg-gradient-to-r from-fuchsia-700/95 via-pink-600/95 to-orange-500/95 px-8 py-4 text-center shadow-[0_0_48px_rgba(236,72,153,0.9)]">
            <div className="text-sm font-black tracking-[0.22em] text-pink-100">
              🎁 GIFT JACKPOT WHEEL 🎁
            </div>
            <div className="mt-1 text-2xl font-black">{gifterName}</div>
            <div className="mt-1 text-sm font-bold text-yellow-100">
              {giftLabel}
            </div>
          </div>

          <div className="relative h-[430px] w-[430px]">
            <div className="absolute inset-[-22px] rounded-full bg-fuchsia-500/30 blur-3xl" />

            <div className="absolute left-1/2 top-[-24px] z-[80] -translate-x-1/2">
              <div className="h-0 w-0 border-l-[24px] border-r-[24px] border-t-[46px] border-l-transparent border-r-transparent border-t-yellow-300 drop-shadow-[0_5px_8px_rgba(0,0,0,0.65)]" />
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
                  const angle = index * segmentAngle + segmentAngle / 2;

                  return (
                    <div
                      key={prize.id}
                      className="absolute left-1/2 top-1/2 h-1/2 w-[112px] origin-bottom -translate-x-1/2 -translate-y-full"
                      style={{
                        transform: `rotate(${angle}deg)`,
                      }}
                    >
                      <div
                        className="flex h-full flex-col items-center pt-6 text-center"
                        style={{
                          transform: `rotate(${-angle}deg)`,
                        }}
                      >
                        <div className="text-4xl drop-shadow-lg">
                          {prize.emoji}
                        </div>
                        <div className="mt-1 max-w-[100px] text-sm font-black leading-tight text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">
                          {prize.label}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="absolute left-1/2 top-1/2 h-[84px] w-[84px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[8px] border-yellow-200 bg-gradient-to-br from-yellow-300 to-orange-500 shadow-[0_0_24px_rgba(250,204,21,0.95)]" />
              </div>
            </div>

            {isSpinning && (
              <div className="animate-spin-glow absolute inset-[-12px] rounded-full border-4 border-white/70" />
            )}
          </div>

          {showResult && result && (
            <div className="animate-result-pop mt-6 min-w-[360px] rounded-[2rem] border-4 border-yellow-200 bg-gradient-to-r from-amber-700/95 via-yellow-500/95 to-orange-600/95 px-9 py-6 text-center shadow-[0_0_55px_rgba(250,204,21,0.95)]">
              <div className="text-sm font-black tracking-[0.2em] text-yellow-50">
                🏆 WINNER 🏆
              </div>
              <div className="mt-3 text-6xl">{result.prize.emoji}</div>
              <div className="mt-2 text-3xl font-black">
                {result.prize.label}
              </div>
              <div className="mt-2 text-base font-bold text-yellow-50/90">
                Congratulations, {gifterName}!
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
            transform: translate(-50%, -42%) scale(0.72);
          }

          65% {
            opacity: 1;
            transform: translate(-50%, -52%) scale(1.05);
          }

          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
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
          animation: wheelStage 0.8s cubic-bezier(0.18, 0.9, 0.22, 1)
            both;
        }

        .animate-result-pop {
          animation: resultPop 0.55s cubic-bezier(0.18, 0.9, 0.22, 1)
            both;
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