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
  x: number;
  y: number;
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

  const createPilePosition = (index: number) => {
    const centerX = 360;

    // 0-79: กองในตะกร้า
    if (index < 80) {
      const layer = Math.floor(index / 14);
      const pos = index % 14;
      const angle = (pos / 14) * Math.PI * 2;
      const radius = 18 + layer * 11;

      return {
        pileX:
          centerX +
          Math.cos(angle) * radius * (0.9 + Math.random() * 0.45) +
          (Math.random() * 18 - 9),
        pileY:
          38 + layer * 9 + Math.sin(angle) * radius * 0.16 + Math.random() * 8,
        pileScale: 0.85 + Math.random() * 0.38,
        z: 22 + layer,
      };
    }

    // 80-129: ล้นปากตะกร้า แต่ยังชิดตะกร้า
    if (index < 130) {
      const overflowIndex = index - 80;
      const side = overflowIndex % 2 === 0 ? -1 : 1;
      const row = Math.floor(overflowIndex / 12);
      const pos = overflowIndex % 12;

      return {
        pileX: centerX + side * (42 + pos * 11 + Math.random() * 12),
        pileY: 28 + row * 7 + Math.random() * 12,
        pileScale: 0.78 + Math.random() * 0.25,
        z: 32 + row,
      };
    }

    // 130+: หล่นพื้นซ้าย/ขวา
    const groundIndex = index - 130;
    const side = groundIndex % 2 === 0 ? -1 : 1;
    const row = Math.floor(groundIndex / 18);
    const pos = groundIndex % 18;

    return {
      pileX: centerX + side * (78 + pos * 17 + Math.random() * 18),
      pileY: 2 + row * 5 + Math.random() * 8,
      pileScale: 0.68 + Math.random() * 0.22,
      z: 12 + row,
    };
  };

  const playEffect = (gift: GiftPayload) => {
    setMessage(`ขอบคุณ ${gift.user} ส่ง ${gift.giftName} x${gift.amount}`);
    setShowMessage(true);

    const count = Math.min(Math.max((gift.amount || 1) * 4, 12), 80);
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
          x: -170 + Math.random() * 340,
          y: -60 - Math.random() * 180,
          rotate: -140 + Math.random() * 280,
          delay: Math.random() * 0.22,
          pileX: pile.pileX,
          pileY: pile.pileY,
          pileScale: pile.pileScale,
          z: pile.z,
        };
      },
    );

    const newSparkles: Sparkle[] = Array.from({ length: 18 }).map(
      (_, index) => ({
        id: Date.now() + 10000 + index,
        x: -220 + Math.random() * 440,
        y: -230 + Math.random() * 250,
        delay: Math.random() * 1.2,
      }),
    );

    setFallingGifts(newGifts);
    setSparkles(newSparkles);

    setTimeout(() => {
      setPileGifts((prev) => [...prev, ...newGifts].slice(-240));
    }, 1200);

    setTimeout(() => {
      setFallingGifts([]);
      setSparkles([]);
      setShowMessage(false);
    }, 3200);
  };

  useEffect(() => {
    if (!overlayId) return;

    const socket = io("https://server-production-b88b.up.railway.app");

    socket.emit("join-overlay", overlayId);

    socket.on("gift-plane", (gift: GiftPayload) => {
      playEffect(gift);
    });

    socket.on("reset-gift", () => {
      setMessage("");
      setShowMessage(false);
      setFallingGifts([]);
      setPileGifts([]);
      setSparkles([]);
    });

    return () => {
      socket.disconnect();
    };
  }, [overlayId, pileGifts.length]);

  return (
    <main className="fixed inset-0 h-screen w-screen overflow-hidden bg-transparent">
      {showMessage && (
        <div className="animate-message fixed left-1/2 top-[12vh] z-50 -translate-x-1/2 rounded-3xl border-4 border-pink-200 bg-pink-600/90 px-8 py-4 text-center text-2xl font-black text-white shadow-[0_0_35px_rgba(236,72,153,0.9)]">
          {message}
        </div>
      )}

      <div className="fixed bottom-8 left-1/2 z-40 h-[300px] w-[760px] -translate-x-1/2">
        <div className="absolute bottom-[6px] left-1/2 z-10 h-[58px] w-[560px] -translate-x-1/2 rounded-full bg-black/35 blur-2xl" />

        {fallingGifts.map((gift) => (
          <img
            key={`fall-${gift.id}`}
            src={gift.image}
            alt={gift.name}
            className="animate-fall absolute left-1/2 top-0 z-50 drop-shadow-[0_0_12px_rgba(255,105,180,0.9)]"
            style={{
              width: `${gift.size}px`,
              height: `${gift.size}px`,
              animationDelay: `${gift.delay}s`,
              ["--gift-x" as string]: `${gift.x}px`,
              ["--gift-y" as string]: `${gift.y}px`,
              ["--gift-target-x" as string]: `${gift.pileX - 360}px`,
              ["--gift-target-y" as string]: `${210 - gift.pileY}px`,
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

        @keyframes fall {
          0% {
            opacity: 0;
            transform: translate(var(--gift-x), var(--gift-y)) rotate(0deg)
              scale(0.45);
          }

          12% {
            opacity: 1;
          }

          35% {
            transform: translate(
                calc(var(--gift-target-x) * 0.25),
                calc(var(--gift-target-y) * 0.3)
              )
              rotate(calc(var(--gift-rotate) * 0.25)) scale(0.8);
          }

          70% {
            transform: translate(
                calc(var(--gift-target-x) * 0.78),
                calc(var(--gift-target-y) * 0.86)
              )
              rotate(calc(var(--gift-rotate) * 0.75)) scale(1.05);
          }

          86% {
            transform: translate(
                calc(var(--gift-target-x) * 0.96),
                calc(var(--gift-target-y) * 1.02)
              )
              rotate(calc(var(--gift-rotate) * 0.95)) scale(0.96);
          }

          100% {
            opacity: 1;
            transform: translate(var(--gift-target-x), var(--gift-target-y))
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

        .animate-message {
          animation: message 3.2s ease-in-out forwards;
        }

        .animate-fall {
          animation: fall 1.75s cubic-bezier(0.22, 0.9, 0.28, 1) forwards;
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
