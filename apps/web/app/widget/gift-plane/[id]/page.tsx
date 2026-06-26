"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";

type GiftPayload = {
  user: string;
  giftName: string;
  amount: number;
  diamond: number;
  giftImage: string;
};

type GiftItem = {
  id: number;
  image: string;
  name: string;
  size: number;
  startX: number;
  startY: number;
  rotate: number;
  delay: number;
  pileX: number;
  pileY: number;
  pileScale: number;
  z: number;
};

type Sparkle = {
  id: number;
  x: number;
  y: number;
  delay: number;
};

type PetalItem = {
  id: number;
  startX: number;
  startY: number;
  drift: number;
  rotate: number;
  delay: number;
  size: number;
};

export default function GiftPlaneWidget() {
  const params = useParams();
  const searchParams = useSearchParams();

  const overlayId = params.id as string;
  const basket = searchParams.get("basket") || "basket-1";

  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [fallingGifts, setFallingGifts] = useState<GiftItem[]>([]);
  const [pileGifts, setPileGifts] = useState<GiftItem[]>([]);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [petals, setPetals] = useState<PetalItem[]>([]);

  const createPilePosition = (index: number) => {
    const centerX = 360;

    if (index < 90) {
      const layer = Math.floor(index / 15);
      const pos = index % 15;
      const angle = (pos / 15) * Math.PI * 2;
      const radius = 18 + layer * 10;

      return {
        pileX:
          centerX +
          Math.cos(angle) * radius * (0.9 + Math.random() * 0.35) +
          (Math.random() * 18 - 9),
        pileY:
          36 + layer * 8 + Math.sin(angle) * radius * 0.16 + Math.random() * 8,
        pileScale: 0.85 + Math.random() * 0.35,
        z: 22 + layer,
      };
    }

    if (index < 140) {
      const overflowIndex = index - 90;
      const side = overflowIndex % 2 === 0 ? -1 : 1;
      const row = Math.floor(overflowIndex / 12);
      const pos = overflowIndex % 12;

      return {
        pileX: centerX + side * (38 + pos * 10 + Math.random() * 12),
        pileY: 22 + row * 6 + Math.random() * 10,
        pileScale: 0.76 + Math.random() * 0.22,
        z: 30 + row,
      };
    }

    const groundIndex = index - 140;
    const side = groundIndex % 2 === 0 ? -1 : 1;
    const row = Math.floor(groundIndex / 20);
    const pos = groundIndex % 20;

    return {
      pileX: centerX + side * (65 + pos * 15 + Math.random() * 18),
      pileY: 0 + row * 5 + Math.random() * 7,
      pileScale: 0.68 + Math.random() * 0.2,
      z: 12 + row,
    };
  };

  const playEffect = (gift: GiftPayload) => {
    setMessage(`ขอบคุณ ${gift.user} ส่ง ${gift.giftName} x${gift.amount}`);
    setShowMessage(true);

    const count = Math.min(Math.max((gift.amount || 1) * 5, 14), 90);
    const giftImage = gift.giftImage || "/assets/rose.png";
    const currentCount = pileGifts.length;

    const newGifts: GiftItem[] = Array.from({ length: count }).map(
      (_, index) => {
        const pile = createPilePosition(currentCount + index);

        return {
          id: Date.now() + index,
          image: giftImage,
          name: gift.giftName,
          size: 24 + Math.random() * 18,
          startX: -330 + Math.random() * 660,
          startY: -380 - Math.random() * 220,
          rotate: -180 + Math.random() * 360,
          delay: Math.random() * 0.8,
          pileX: pile.pileX,
          pileY: pile.pileY,
          pileScale: pile.pileScale,
          z: pile.z,
        };
      },
    );

    const newPetals: PetalItem[] = Array.from({ length: count * 2 }).map(
      (_, index) => ({
        id: Date.now() + 20000 + index,
        startX: Math.random() * 100,
        startY: -20 - Math.random() * 40,
        drift: -80 + Math.random() * 160,
        rotate: -360 + Math.random() * 720,
        delay: Math.random() * 1.4,
        size: 12 + Math.random() * 12,
      }),
    );

    setPetals(newPetals);

    const newSparkles: Sparkle[] = Array.from({ length: 22 }).map(
      (_, index) => ({
        id: Date.now() + 10000 + index,
        x: -300 + Math.random() * 600,
        y: -300 + Math.random() * 280,
        delay: Math.random() * 1.4,
      }),
    );

    setFallingGifts(newGifts);
    setSparkles(newSparkles);

    setTimeout(() => {
      setPileGifts((prev) => [...prev, ...newGifts].slice(-260));
    }, 1900);

    setTimeout(() => {
      setFallingGifts([]);
      setSparkles([]);
      setShowMessage(false);
      setPetals([]);
    }, 4200);
  };

  useEffect(() => {
    if (!overlayId) return;

    const socket = io("https://server-production-b88b.up.railway.app");

    socket.emit("join-overlay", overlayId);

    // ปุ่ม Test Basket จาก Dashboard
    socket.on("test-basket", (gift: GiftPayload) => {
      playEffect(gift);
    });

    // ของขวัญจริงจาก TikTok สำหรับ Basket
    socket.on("basket-gift", (gift: GiftPayload) => {
      playEffect(gift);
    });

    // Reset Basket
    socket.on("reset-basket", () => {
      setMessage("");
      setShowMessage(false);
      setFallingGifts([]);
      setPileGifts([]);
      setSparkles([]);
      setPetals([]);
    });

    return () => {
      socket.disconnect();
    };
  }, [overlayId, pileGifts.length]);

  return (
    <main className="fixed inset-0 h-screen w-screen overflow-hidden bg-transparent">
      {showMessage && (
        <div className="animate-message fixed left-1/2 top-[8vh] z-50 -translate-x-1/2 rounded-3xl border-4 border-pink-200 bg-pink-600/90 px-8 py-4 text-center text-2xl font-black text-white shadow-[0_0_35px_rgba(236,72,153,0.9)]">
          {message}
        </div>
      )}

      <div className="fixed bottom-8 left-1/2 z-40 h-[360px] w-[760px] -translate-x-1/2">
        <div className="absolute bottom-[6px] left-1/2 z-10 h-[58px] w-[580px] -translate-x-1/2 rounded-full bg-black/35 blur-2xl" />
        <div className="absolute bottom-[12px] left-1/2 z-10 h-[90px] w-[520px] -translate-x-1/2 rounded-full bg-pink-500/20 blur-3xl" />

        {fallingGifts.map((gift) => (
          <img
            key={`fall-${gift.id}`}
            src={gift.image}
            alt={gift.name}
            className="animate-rose-rain absolute left-1/2 top-0 z-50 drop-shadow-[0_0_14px_rgba(255,105,180,0.95)]"
            style={{
              width: `${gift.size}px`,
              height: `${gift.size}px`,
              animationDelay: `${gift.delay}s`,
              ["--start-x" as string]: `${gift.startX}px`,
              ["--start-y" as string]: `${gift.startY}px`,
              ["--target-x" as string]: `${gift.pileX - 360}px`,
              ["--target-y" as string]: `${260 - gift.pileY}px`,
              ["--gift-rotate" as string]: `${gift.rotate}deg`,
            }}
          />
        ))}

        {pileGifts.map((gift, index) => (
          <img
            key={`pile-${gift.id}-${index}`}
            src={gift.image}
            alt={gift.name}
            className="animate-pop absolute drop-shadow-[0_0_10px_rgba(255,105,180,0.75)]"
            style={{
              left: `${gift.pileX}px`,
              bottom: `${gift.pileY}px`,
              width: `${gift.size * gift.pileScale}px`,
              height: `${gift.size * gift.pileScale}px`,
              transform: `rotate(${gift.rotate}deg)`,
              zIndex: gift.z,
            }}
          />
        ))}

        <Image
          src={`/assets/baskets/${basket}.png`}
          alt="Gift basket"
          width={260}
          height={160}
          priority
          className="absolute bottom-0 left-1/2 z-40 w-[260px] -translate-x-1/2 drop-shadow-[0_0_30px_rgba(255,105,180,0.9)]"
        />

        {sparkles.map((sparkle) => (
          <span
            key={sparkle.id}
            className="animate-twinkle absolute left-1/2 top-[60px] z-50 text-yellow-300"
            style={{
              transform: `translate(${sparkle.x}px, ${sparkle.y}px)`,
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

        @keyframes message {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px) scale(0.85);
          }

          15% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }

          85% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }

          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px) scale(0.95);
          }
        }

        @keyframes roseRain {
          0% {
            opacity: 0;
            transform: translate(var(--start-x), var(--start-y)) rotate(0deg)
              scale(0.55);
          }

          10% {
            opacity: 1;
          }

          45% {
            transform: translate(
                calc(var(--target-x) * 0.45),
                calc(var(--target-y) * 0.52)
              )
              rotate(calc(var(--gift-rotate) * 0.45)) scale(0.9);
          }

          78% {
            transform: translate(
                calc(var(--target-x) * 0.92),
                calc(var(--target-y) * 1.04)
              )
              rotate(calc(var(--gift-rotate) * 0.9)) scale(1.05);
          }

          90% {
            transform: translate(
                calc(var(--target-x) * 0.98),
                calc(var(--target-y) * 0.98)
              )
              rotate(calc(var(--gift-rotate) * 0.96)) scale(0.96);
          }

          100% {
            opacity: 1;
            transform: translate(var(--target-x), var(--target-y))
              rotate(var(--gift-rotate)) scale(1);
          }
        }

        @keyframes pop {
          0% {
            opacity: 0;
            scale: 0.6;
          }

          100% {
            opacity: 1;
            scale: 1;
          }
        }

        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.2;
            scale: 0.7;
          }

          50% {
            opacity: 1;
            scale: 1.25;
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

        .animate-petal-rain {
          animation: petalRain 4.2s linear forwards;
        }

        .animate-message {
          animation: message 3.2s ease-in-out forwards;
        }

        .animate-rose-rain {
          animation: roseRain 2.15s cubic-bezier(0.18, 0.82, 0.28, 1) forwards;
        }

        .animate-pop {
          animation: pop 0.25s ease-out forwards;
        }

        .animate-twinkle {
          animation: twinkle 1.4s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}
