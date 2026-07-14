"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { SERVER_URL } from "@/lib/core/server-url";
import type {
  BasketPetal,
  BasketRose,
  BasketSparkle,
  BasketVariant,
  GiftPayload,
} from "./BasketTypes";
import {
  createPilePosition,
  getRoseCount,
  rebuildPile,
} from "./BasketPhysics";

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
    backImage: "/assets/baskets/chest-body.png",
    frontImage: "/assets/baskets/chest-body.png",
    width: 350,
    height: 220,
    offsetX: 90,
    offsetY: 55,
    roseBaseY: 70,
    roseCenterX: 175,
    maxPile: 120,
  },
};

const CHEST_BODY = "/assets/baskets/chest-body.png";
const CHEST_LID = "/assets/baskets/chest-lid.png";
const CHEST_CAT = "/assets/baskets/cat-black.png";

export function BasketEngine({
  overlayId,
  basketId,
}: BasketEngineProps) {
  const basket =
    BASKET_VARIANTS[basketId] ?? BASKET_VARIANTS["basket-1"];

  const isChest = basket.id === "chest-1";

  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [runId, setRunId] = useState(0);

  const [fallingRoses, setFallingRoses] = useState<BasketRose[]>([]);
  const [pileRoses, setPileRoses] = useState<BasketRose[]>([]);
  const [sparkles, setSparkles] = useState<BasketSparkle[]>([]);
  const [petals, setPetals] = useState<BasketPetal[]>([]);

  const pileLengthRef = useRef(0);
  const clearEffectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    pileLengthRef.current = pileRoses.length;
  }, [pileRoses.length]);

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
      startY: isChest ? -30 - Math.random() * 55 : -115 + Math.random() * 60,
      rotate: -150 + Math.random() * 300,
      delay: index * 0.03 + Math.random() * 0.16,
      scale: position.scale,
      z: position.z,
    };
  };

  const playEffect = (gift: GiftPayload) => {
    const amount = Math.max(gift.amount || 1, 1);
    const count = getRoseCount(amount);

    setMessage(`ขอบคุณ ${gift.user} ส่ง ${gift.giftName} x${amount}`);
    setShowMessage(true);
    setRunId(Date.now());

    const newRoses = Array.from({ length: count }, (_, index) =>
      createRose(gift, index, pileLengthRef.current + index),
    );

    const sparkleCount = isChest ? 34 : 24;

    const newSparkles: BasketSparkle[] = Array.from(
      { length: sparkleCount },
      (_, index) => ({
        id: Date.now() + 10000 + index,
        x: 275 + Math.random() * 200,
        y: isChest ? 112 + Math.random() * 130 : 120 + Math.random() * 105,
        delay: Math.random() * 1.4,
      }),
    );

    const newPetals: BasketPetal[] = Array.from(
      { length: count },
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

    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    if (clearEffectTimerRef.current) clearTimeout(clearEffectTimerRef.current);

    settleTimerRef.current = setTimeout(() => {
      setPileRoses((previous) => {
        const next = rebuildPile(previous, newRoses);
        pileLengthRef.current = next.length;
        return next;
      });
    }, isChest ? 1750 : 1900);

    clearEffectTimerRef.current = setTimeout(() => {
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
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      if (clearEffectTimerRef.current) clearTimeout(clearEffectTimerRef.current);

      pileLengthRef.current = 0;
      setMessage("");
      setShowMessage(false);
      setRunId(0);
      setFallingRoses([]);
      setPileRoses([]);
      setSparkles([]);
      setPetals([]);
    });

    return () => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      if (clearEffectTimerRef.current) clearTimeout(clearEffectTimerRef.current);
      socket.disconnect();
    };
  }, [overlayId, isChest]);

  return (
    <main className="fixed inset-0 h-screen w-screen overflow-hidden bg-transparent">
      {showMessage && (
        <div
          className={`fixed top-[10vh] z-[100] -translate-x-1/2 rounded-[2rem] border-4 px-10 py-5 text-center text-white ${
            isChest
              ? "animate-chest-banner border-yellow-200 bg-gradient-to-r from-amber-700/95 via-yellow-500/95 to-orange-600/95 shadow-[0_0_50px_rgba(250,204,21,0.95)]"
              : "animate-basket-banner border-pink-200 bg-gradient-to-r from-pink-600/95 via-fuchsia-500/95 to-rose-500/95 shadow-[0_0_45px_rgba(236,72,153,0.95)]"
          }`}
          style={{ left: `calc(50% + ${basket.offsetX}px)` }}
        >
          <div className={`text-sm font-black ${isChest ? "text-yellow-50" : "text-pink-100"}`}>
            {isChest ? "✨ MYSTERY CAT BOX ✨" : "💖 THANK YOU 💖"}
          </div>
          <div className="mt-1 text-3xl font-black">{message}</div>
        </div>
      )}

      <div className="fixed left-1/2 top-1/2 z-40 h-[410px] w-[780px] -translate-x-1/2 -translate-y-1/2">
        <div
          className={`absolute z-10 -translate-x-1/2 rounded-full blur-2xl ${
            isChest
              ? "bottom-[82px] h-[70px] w-[340px] bg-black/45"
              : "bottom-[110px] h-[62px] w-[310px] bg-black/35"
          }`}
          style={{ left: `calc(50% + ${basket.offsetX}px)` }}
        />

        <div
          className={`absolute z-10 -translate-x-1/2 rounded-full blur-3xl ${
            isChest
              ? "bottom-[92px] h-[150px] w-[380px] bg-yellow-400/25"
              : "bottom-[122px] h-[110px] w-[330px] bg-pink-500/25"
          }`}
          style={{ left: `calc(50% + ${basket.offsetX}px)` }}
        />

        <div
          key={runId}
          className={`absolute z-40 -translate-x-1/2 ${
            isChest
              ? "animate-chest-enter h-[260px] w-[380px]"
              : "animate-basket-enter h-[190px] w-[330px]"
          }`}
          style={{
            left: `calc(50% + ${basket.offsetX}px)`,
            bottom: `${basket.offsetY}px`,
          }}
        >
          {isChest ? (
            <>
              {/* แสงอยู่ด้านหลังทุกชิ้น */}
              <div className="animate-chest-glow absolute bottom-[86px] left-1/2 z-10 h-[170px] w-[300px] -translate-x-1/2 rounded-full bg-yellow-300/45 blur-3xl" />

              <div className="animate-gold-ray absolute bottom-[104px] left-1/2 z-10 h-[170px] w-[16px] -translate-x-1/2 origin-bottom rounded-full bg-yellow-200/45 blur-md" />
              <div className="animate-gold-ray gold-ray-left absolute bottom-[104px] left-1/2 z-10 h-[160px] w-[13px] -translate-x-1/2 origin-bottom rounded-full bg-amber-200/35 blur-md" />
              <div className="animate-gold-ray gold-ray-right absolute bottom-[104px] left-1/2 z-10 h-[160px] w-[13px] -translate-x-1/2 origin-bottom rounded-full bg-amber-200/35 blur-md" />

              {/* ฝาอยู่หลังแมวและดอกไม้ และขยับให้ชิดบานพับของตัวหีบ */}
              <img
                src={CHEST_LID}
                alt="Treasure chest lid"
                className="animate-chest-lid absolute bottom-[88px] z-20 w-[330px] -translate-x-1/2 drop-shadow-[0_0_28px_rgba(250,204,21,0.8)]"
                style={{ left: "calc(50% + 112px)" }}
              />

              {/* ตัวหีบ */}
              <img
                src={CHEST_BODY}
                alt="Treasure chest body"
                className="absolute bottom-0 left-1/2 z-40 w-[350px] -translate-x-1/2 drop-shadow-[0_0_35px_rgba(250,204,21,0.72)]"
              />

              {/* แมวต้องอยู่หน้าตัวหีบ จึงมองเห็นและดูเหมือนโผล่จากด้านใน */}
              <img
                src={CHEST_CAT}
                alt="Black cat"
                className="animate-cat-rise absolute bottom-[116px] left-1/2 z-[65] w-[150px] -translate-x-1/2 drop-shadow-[0_0_24px_rgba(250,204,21,0.65)]"
              />

              {/* กุหลาบที่ตกอยู่ด้านหน้าหีบและลงที่บริเวณปากหีบ */}
              {fallingRoses.map((rose) => (
                <img
                  key={`fall-${rose.id}`}
                  src={rose.image}
                  alt={rose.name}
                  className="animate-chest-rose-burst absolute left-0 top-0 drop-shadow-[0_0_14px_rgba(255,105,180,0.95)]"
                  style={{
                    width: `${rose.size}px`,
                    height: `${rose.size}px`,
                    zIndex: 72,
                    animationDelay: `${rose.delay}s`,
                    ["--start-x" as string]: `${190 + rose.startX}px`,
                    ["--start-y" as string]: `${92 + rose.startY}px`,
                    ["--target-x" as string]: `${rose.x + 25}px`,
                    ["--target-y" as string]: `${280 - Math.max(rose.y + 42, 112)}px`,
                    ["--rose-rotate" as string]: `${rose.rotate}deg`,
                    ["--rose-scale" as string]: `${rose.scale}`,
                  }}
                />
              ))}

              {/* กองกุหลาบอยู่เหนือขอบตัวหีบ ไม่ถูกภาพ body บัง */}
              {pileRoses.map((rose, index) => (
                <img
                  key={`pile-${rose.id}-${index}`}
                  src={rose.image}
                  alt={rose.name}
                  className="animate-pop absolute drop-shadow-[0_0_10px_rgba(255,105,180,0.75)]"
                  style={{
                    left: `${rose.x + 25}px`,
                    bottom: `${Math.max(rose.y + 42, 112)}px`,
                    width: `${rose.size * rose.scale}px`,
                    height: `${rose.size * rose.scale}px`,
                    transform: `translateX(-50%) rotate(${rose.rotate}deg)`,
                    zIndex: 70 + Math.min(rose.z - 60, 8),
                  }}
                />
              ))}
            </>
          ) : (
            <>
              <img
                src={basket.backImage}
                alt="Basket back"
                className="absolute bottom-0 left-1/2 z-20 w-[330px] -translate-x-1/2"
              />

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
            </>
          )}
        </div>

        {sparkles.map((sparkle) => (
          <span
            key={sparkle.id}
            className={`animate-twinkle absolute z-[90] ${isChest ? "text-yellow-200" : "text-yellow-300"}`}
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
          0% { opacity: 0; transform: translateX(760px) translateY(42px) scale(0.72) rotate(8deg); }
          42% { opacity: 1; transform: translateX(-50%) translateY(-22px) scale(1.08) rotate(-4deg); }
          68% { transform: translateX(-50%) translateY(7px) scale(0.97) rotate(2deg); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1) rotate(0deg); }
        }

        @keyframes chestEnter {
          0% { opacity: 0; transform: translateX(-50%) translateY(95px) scale(0.62) rotate(5deg); }
          48% { opacity: 1; transform: translateX(-50%) translateY(-20px) scale(1.07) rotate(-3deg); }
          72% { transform: translateX(-50%) translateY(8px) scale(0.97) rotate(2deg); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1) rotate(0deg); }
        }

        @keyframes chestLid {
          0%,
          18% {
            opacity: 1;
            transform: translateX(-50%) translateY(32px) rotate(0deg)
              scale(0.96);
          }

          48% {
            transform: translateX(-50%) translateY(-4px) rotate(-2deg)
              scale(1.02);
          }

          72%,
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) rotate(-3deg)
              scale(1);
          }
        }

        @keyframes catRise {
          0%, 30% { opacity: 0; transform: translateX(-50%) translateY(80px) scale(0.72); }
          58% { opacity: 1; transform: translateX(-50%) translateY(-10px) scale(1.07); }
          76% { transform: translateX(-50%) translateY(4px) scale(0.98); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }

        @keyframes chestGlow {
          0%, 100% { opacity: 0.35; transform: translateX(-50%) scale(0.85); }
          50% { opacity: 0.95; transform: translateX(-50%) scale(1.22); }
        }

        @keyframes goldRay {
          0%, 20% { opacity: 0; transform: translateX(-50%) scaleY(0.2); }
          50% { opacity: 0.9; transform: translateX(-50%) scaleY(1); }
          100% { opacity: 0.22; transform: translateX(-50%) scaleY(0.82); }
        }

        @keyframes basketBanner {
          0% { opacity: 0; transform: translateX(-50%) translateY(-28px) scale(0.75); }
          18% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1.04); }
          82% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-14px) scale(0.92); }
        }

        @keyframes chestBanner {
          0% { opacity: 0; transform: translateX(-50%) translateY(-30px) scale(0.72); }
          20% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1.05); }
          82% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-12px) scale(0.94); }
        }

        @keyframes roseBurst {
          0% { opacity: 0; transform: translate(var(--start-x), var(--start-y)) rotate(0deg) scale(0.45); }
          12% { opacity: 1; }
          35% { transform: translate(calc((var(--start-x) + var(--target-x)) / 2), calc(var(--start-y) - 18px)) rotate(calc(var(--rose-rotate) * 0.35)) scale(1.05); }
          72% { transform: translate(var(--target-x), calc(var(--target-y) - 8px)) rotate(calc(var(--rose-rotate) * 0.85)) scale(1.02); }
          88% { transform: translate(var(--target-x), calc(var(--target-y) + 4px)) rotate(calc(var(--rose-rotate) * 0.95)) scale(0.95); }
          100% { opacity: 1; transform: translate(var(--target-x), var(--target-y)) rotate(var(--rose-rotate)) scale(var(--rose-scale)); }
        }

        @keyframes chestRoseBurst {
          0% { opacity: 0; transform: translate(var(--start-x), var(--start-y)) rotate(0deg) scale(0.35); }
          18% { opacity: 1; }
          42% { transform: translate(calc((var(--start-x) + var(--target-x)) / 2), calc(var(--start-y) - 68px)) rotate(calc(var(--rose-rotate) * 0.4)) scale(1.1); }
          76% { transform: translate(var(--target-x), calc(var(--target-y) - 10px)) rotate(calc(var(--rose-rotate) * 0.85)) scale(1.02); }
          100% { opacity: 1; transform: translate(var(--target-x), var(--target-y)) rotate(var(--rose-rotate)) scale(var(--rose-scale)); }
        }

        @keyframes pop {
          0% { opacity: 0; scale: 0.55; }
          100% { opacity: 1; scale: 1; }
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.15; scale: 0.7; }
          50% { opacity: 1; scale: 1.3; }
        }

        @keyframes petalRain {
          0% { opacity: 0; transform: translate3d(0, -60px, 0) rotate(0deg) scale(0.7); }
          10% { opacity: 1; }
          100% { opacity: 0.95; transform: translate3d(var(--petal-drift), 92vh, 0) rotate(var(--petal-rotate)) scale(1); }
        }

        .animate-basket-enter { animation: basketEnter 0.95s cubic-bezier(0.18, 0.9, 0.22, 1) both; }
        .animate-chest-enter { animation: chestEnter 1.05s cubic-bezier(0.18, 0.9, 0.22, 1) both; }
        .animate-chest-lid { animation: chestLid 1.2s cubic-bezier(0.18, 0.9, 0.22, 1) both; transform-origin: 50% 100%; }
        .animate-cat-rise { animation: catRise 1.35s cubic-bezier(0.18, 0.9, 0.22, 1) both; }
        .animate-chest-glow { animation: chestGlow 1.4s ease-in-out infinite; }
        .animate-gold-ray { animation: goldRay 1.6s ease-out both; }
        .gold-ray-left { rotate: -18deg; }
        .gold-ray-right { rotate: 18deg; }
        .animate-basket-banner { animation: basketBanner 3.4s ease-in-out forwards; }
        .animate-chest-banner { animation: chestBanner 3.4s ease-in-out forwards; }
        .animate-rose-burst { animation: roseBurst 1.95s cubic-bezier(0.18, 0.82, 0.28, 1) forwards; }
        .animate-chest-rose-burst { animation: chestRoseBurst 1.85s cubic-bezier(0.18, 0.82, 0.28, 1) forwards; }
        .animate-pop { animation: pop 0.25s ease-out forwards; }
        .animate-twinkle { animation: twinkle 1.4s ease-in-out infinite; }
        .animate-petal-rain { animation: petalRain 4.2s linear forwards; }
      `}</style>
    </main>
  );
}