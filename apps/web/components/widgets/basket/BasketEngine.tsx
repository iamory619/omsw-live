"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import type {
  BasketPetal,
  BasketRose,
  BasketSparkle,
  BasketVariant,
  GiftPayload,
} from "./BasketTypes";
import { createPilePosition, getRoseCount, rebuildPile } from "./BasketPhysics";

const SERVER_URL = "https://server-production-b88b.up.railway.app";

type BasketEngineProps = {
  overlayId: string;
  basketId: string;
};

const BASKET_VARIANTS: Record<string, BasketVariant> = {
  "basket-1": {
    id: "basket-1",
    backImage: "/assets/baskets/basket-1-back.png",
    frontImage: "/assets/baskets/basket-1-front.png",
    width: 330,
    height: 190,
    offsetX: 90,
    offsetY: 70,
    roseBaseY: 78,
    roseCenterX: 165,
    maxPile: 140,
  },
  "basket-2": {
    id: "basket-2",
    backImage: "/assets/baskets/basket-2-back.png",
    frontImage: "/assets/baskets/basket-2-front.png",
    width: 330,
    height: 190,
    offsetX: 90,
    offsetY: 70,
    roseBaseY: 78,
    roseCenterX: 165,
    maxPile: 140,
  },
  "chest-1": {
    id: "chest-1",
    backImage: "/assets/baskets/chest-1-back.png",
    frontImage: "/assets/baskets/chest-1-front.png",
    width: 330,
    height: 190,
    offsetX: 90,
    offsetY: 70,
    roseBaseY: 78,
    roseCenterX: 165,
    maxPile: 140,
  },
};

export function BasketEngine({ overlayId, basketId }: BasketEngineProps) {
  const basket = BASKET_VARIANTS[basketId] ?? BASKET_VARIANTS["basket-1"];
  const isChest = basket.id.startsWith("chest");

  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [runId, setRunId] = useState(0);

  const [fallingRoses, setFallingRoses] = useState<BasketRose[]>([]);
  const [pileRoses, setPileRoses] = useState<BasketRose[]>([]);
  const [sparkles, setSparkles] = useState<BasketSparkle[]>([]);
  const [petals, setPetals] = useState<BasketPetal[]>([]);

  const createRose = (
    gift: GiftPayload,
    index: number,
    pileIndex: number,
  ): BasketRose => {
    const position = createPilePosition(pileIndex);
    const image = gift.giftImage || "/assets/rose.png";

    return {
      id: Date.now() + index,
      image,
      name: gift.giftName,
      size: 22 + Math.random() * 14,
      x: position.x,
      y: position.y,
      startX: -60 + Math.random() * 120,
      startY: -115 + Math.random() * 60,
      rotate: -150 + Math.random() * 300,
      delay: index * 0.03 + Math.random() * 0.16,
      scale: position.scale,
      z: position.z,
    };
  };

  const playEffect = (gift: GiftPayload) => {
    const amount = gift.amount || 1;
    const count = getRoseCount(amount);

    setMessage(`ขอบคุณ ${gift.user} ส่ง ${gift.giftName} x${amount}`);
    setShowMessage(true);
    setRunId(Date.now());

    const newRoses = Array.from({ length: count }).map((_, index) =>
      createRose(gift, index, pileRoses.length + index),
    );

    const newSparkles: BasketSparkle[] = Array.from({ length: 24 }).map(
      (_, index) => ({
        id: Date.now() + 10000 + index,
        x: 270 + Math.random() * 190,
        y: 120 + Math.random() * 105,
        delay: Math.random() * 1.4,
      }),
    );

    const newPetals: BasketPetal[] = Array.from({ length: count }).map(
      (_, index) => ({
        id: Date.now() + 20000 + index,
        startX: Math.random() * 100,
        startY: -30 - Math.random() * 60,
        drift: -80 + Math.random() * 160,
        rotate: -360 + Math.random() * 720,
        delay: Math.random() * 1.7,
        size: 10 + Math.random() * 10,
      }),
    );

    setFallingRoses(newRoses);
    setSparkles(newSparkles);
    setPetals(newPetals);

    setTimeout(() => {
      setPileRoses((prev) => rebuildPile(prev, newRoses));
    }, 1900);

    setTimeout(() => {
      setFallingRoses([]);
      setSparkles([]);
      setPetals([]);
      setShowMessage(false);
    }, 4600);
  };

  useEffect(() => {
    if (!overlayId) return;

    const socket = io(SERVER_URL);

    socket.emit("join-overlay", overlayId);

    socket.on("test-basket", playEffect);
    socket.on("basket-gift", playEffect);

    socket.on("reset-basket", () => {
      setMessage("");
      setShowMessage(false);
      setRunId(0);
      setFallingRoses([]);
      setPileRoses([]);
      setSparkles([]);
      setPetals([]);
    });

    return () => {
      socket.disconnect();
    };
  }, [overlayId, pileRoses.length]);

  return (
    <main className="fixed inset-0 h-screen w-screen overflow-hidden bg-transparent">
      {showMessage && (
        <div
          className="animate-basket-banner fixed top-[10vh] z-50 -translate-x-1/2 rounded-[2rem] border-4 border-pink-200 bg-gradient-to-r from-pink-600/95 via-fuchsia-500/95 to-rose-500/95 px-10 py-5 text-center text-white shadow-[0_0_45px_rgba(236,72,153,0.95)]"
          style={{ left: `calc(50% + ${basket.offsetX}px)` }}
        >
          <div className="text-sm font-black text-pink-100">
            💖 THANK YOU 💖
          </div>
          <div className="mt-1 text-3xl font-black">{message}</div>
        </div>
      )}

      <div className="fixed left-1/2 top-1/2 z-40 h-[390px] w-[760px] -translate-x-1/2 -translate-y-1/2">
        <div
          className="absolute bottom-[110px] z-10 h-[62px] w-[310px] -translate-x-1/2 rounded-full bg-black/35 blur-2xl"
          style={{ left: `calc(50% + ${basket.offsetX}px)` }}
        />

        <div
          className="absolute bottom-[122px] z-10 h-[110px] w-[330px] -translate-x-1/2 rounded-full bg-pink-500/25 blur-3xl"
          style={{ left: `calc(50% + ${basket.offsetX}px)` }}
        />

        <div
          key={runId}
          className={`absolute z-40 h-[190px] w-[330px] -translate-x-1/2 ${
            isChest ? "animate-chest-bounce" : "animate-basket-enter"
          }`}
          style={{
            left: `calc(50% + ${basket.offsetX}px)`,
            bottom: `${basket.offsetY}px`,
          }}
        >
          <img
            src={basket.backImage}
            alt="Basket back"
            className="absolute bottom-0 left-1/2 z-20 w-[330px] -translate-x-1/2"
          />

          {isChest && (
            <div className="animate-chest-glow absolute left-1/2 top-[64px] z-30 h-[90px] w-[220px] -translate-x-1/2 rounded-full bg-yellow-300/35 blur-2xl" />
          )}

          {pileRoses.map((rose, index) => (
            <img
              key={`pile-${rose.id}-${index}`}
              src={rose.image}
              alt={rose.name}
              className="animate-pop absolute drop-shadow-[0_0_10px_rgba(255,105,180,0.75)]"
              style={{
                left: `${rose.x}px`,
                bottom: `${rose.y}px`,
                width: `${rose.size * rose.scale}px`,
                height: `${rose.size * rose.scale}px`,
                transform: `translateX(-50%) rotate(${rose.rotate}deg)`,
                zIndex: rose.z,
              }}
            />
          ))}

          {fallingRoses.map((rose) => (
            <img
              key={`fall-${rose.id}`}
              src={rose.image}
              alt={rose.name}
              className="animate-rose-burst absolute left-0 top-0 drop-shadow-[0_0_14px_rgba(255,105,180,0.95)]"
              style={{
                width: `${rose.size}px`,
                height: `${rose.size}px`,
                zIndex: rose.z + 10,
                animationDelay: `${rose.delay}s`,
                ["--start-x" as string]: `${basket.width / 2 + rose.startX}px`,
                ["--start-y" as string]: `${78 + rose.startY}px`,
                ["--target-x" as string]: `${rose.x}px`,
                ["--target-y" as string]: `${190 - rose.y}px`,
                ["--rose-rotate" as string]: `${rose.rotate}deg`,
                ["--rose-scale" as string]: `${rose.scale}`,
              }}
            />
          ))}

          <img
            src={basket.frontImage}
            alt="Basket front"
            className="absolute bottom-0 left-1/2 z-50 w-[330px] -translate-x-1/2 drop-shadow-[0_0_35px_rgba(255,105,180,0.95)]"
          />
        </div>

        {sparkles.map((sparkle) => (
          <span
            key={sparkle.id}
            className="animate-twinkle absolute z-50 text-yellow-300"
            style={{
              left: `${sparkle.x + basket.offsetX}px`,
              top: `${sparkle.y}px`,
              animationDelay: `${sparkle.delay}s`,
            }}
          >
            ✨
          </span>
        ))}
      </div>

      {petals.map((petal) => (
        <img
          key={petal.id}
          src="/assets/petal.png"
          alt="petal"
          className="animate-petal-rain fixed z-40 drop-shadow-[0_0_8px_rgba(255,105,180,0.8)]"
          style={{
            left: `${petal.startX}vw`,
            top: `${petal.startY}px`,
            width: `${petal.size}px`,
            height: `${petal.size}px`,
            animationDelay: `${petal.delay}s`,
            ["--petal-drift" as string]: `${petal.drift}px`,
            ["--petal-rotate" as string]: `${petal.rotate}deg`,
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

        @keyframes basketEnter {
          0% {
            opacity: 0;
            transform: translateX(760px) translateY(42px) scale(0.72)
              rotate(8deg);
          }

          42% {
            opacity: 1;
            transform: translateX(-50%) translateY(-22px) scale(1.08)
              rotate(-4deg);
          }

          68% {
            transform: translateX(-50%) translateY(7px) scale(0.97) rotate(2deg);
          }

          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1) rotate(0deg);
          }
        }

        @keyframes chestBounce {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(70px) scale(0.62)
              rotate(4deg);
          }

          45% {
            opacity: 1;
            transform: translateX(-50%) translateY(-20px) scale(1.08)
              rotate(-3deg);
          }

          68% {
            transform: translateX(-50%) translateY(8px) scale(0.97) rotate(2deg);
          }

          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1) rotate(0deg);
          }
        }

        @keyframes chestGlow {
          0%,
          100% {
            opacity: 0.35;
            scale: 0.9;
          }

          50% {
            opacity: 0.9;
            scale: 1.2;
          }
        }

        @keyframes basketBanner {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(-28px) scale(0.75);
          }

          18% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1.04);
          }

          82% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }

          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-14px) scale(0.92);
          }
        }

        @keyframes roseBurst {
          0% {
            opacity: 0;
            transform: translate(var(--start-x), var(--start-y)) rotate(0deg)
              scale(0.45);
          }

          12% {
            opacity: 1;
          }

          35% {
            transform: translate(
                calc((var(--start-x) + var(--target-x)) / 2),
                calc(var(--start-y) - 18px)
              )
              rotate(calc(var(--rose-rotate) * 0.35)) scale(1.05);
          }

          72% {
            transform: translate(var(--target-x), calc(var(--target-y) - 8px))
              rotate(calc(var(--rose-rotate) * 0.85)) scale(1.02);
          }

          88% {
            transform: translate(var(--target-x), calc(var(--target-y) + 4px))
              rotate(calc(var(--rose-rotate) * 0.95)) scale(0.95);
          }

          100% {
            opacity: 1;
            transform: translate(var(--target-x), var(--target-y))
              rotate(var(--rose-rotate)) scale(var(--rose-scale));
          }
        }

        @keyframes pop {
          0% {
            opacity: 0;
            scale: 0.55;
          }

          100% {
            opacity: 1;
            scale: 1;
          }
        }

        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.15;
            scale: 0.7;
          }

          50% {
            opacity: 1;
            scale: 1.3;
          }
        }

        @keyframes petalRain {
          0% {
            opacity: 0;
            transform: translate3d(0, -60px, 0) rotate(0deg) scale(0.7);
          }

          10% {
            opacity: 1;
          }

          100% {
            opacity: 0.95;
            transform: translate3d(var(--petal-drift), 92vh, 0)
              rotate(var(--petal-rotate)) scale(1);
          }
        }

        .animate-basket-enter {
          animation: basketEnter 0.95s cubic-bezier(0.18, 0.9, 0.22, 1) both;
        }

        .animate-chest-bounce {
          animation: chestBounce 0.95s cubic-bezier(0.18, 0.9, 0.22, 1) both;
        }

        .animate-chest-glow {
          animation: chestGlow 1.35s ease-in-out infinite;
        }

        .animate-basket-banner {
          animation: basketBanner 3.4s ease-in-out forwards;
        }

        .animate-rose-burst {
          animation: roseBurst 1.95s cubic-bezier(0.18, 0.82, 0.28, 1)
            forwards;
        }

        .animate-pop {
          animation: pop 0.25s ease-out forwards;
        }

        .animate-twinkle {
          animation: twinkle 1.4s ease-in-out infinite;
        }

        .animate-petal-rain {
          animation: petalRain 4.2s linear forwards;
        }
      `}</style>
    </main>
  );
}