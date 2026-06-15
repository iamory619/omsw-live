"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useParams } from "next/navigation";
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
};

type Sparkle = {
  id: number;
  x: number;
  y: number;
  delay: number;
};

export default function GiftPlaneWidget() {
  const params = useParams();
  const overlayId = params.id as string;

  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [fallingGifts, setFallingGifts] = useState<GiftItem[]>([]);
  const [pileGifts, setPileGifts] = useState<GiftItem[]>([]);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  const playEffect = (gift: GiftPayload) => {
    setMessage(`ขอบคุณ ${gift.user} ส่ง ${gift.giftName} x${gift.amount}`);
    setShowMessage(true);

    const count = Math.min(Math.max((gift.amount || 1) * 4, 12), 80);
    const giftImage = gift.giftImage || "/assets/rose.png";

    const newGifts: GiftItem[] = Array.from({ length: count }).map(
      (_, index) => ({
        id: Date.now() + index,
        image: giftImage,
        name: gift.giftName,
        size: 28 + Math.random() * 24,
        x: -260 + Math.random() * 520,
        y: -20 - Math.random() * 180,
        rotate: -120 + Math.random() * 240,
        delay: Math.random() * 0.45,
      }),
    );

    const newSparkles: Sparkle[] = Array.from({ length: 22 }).map(
      (_, index) => ({
        id: Date.now() + 10000 + index,
        x: -260 + Math.random() * 520,
        y: -250 + Math.random() * 260,
        delay: Math.random() * 1.2,
      }),
    );

    setFallingGifts(newGifts);
    setSparkles(newSparkles);

    setTimeout(() => {
      setPileGifts((prev) => [...prev, ...newGifts].slice(-180));
    }, 1400);

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
  }, [overlayId]);

  return (
    <main className="fixed inset-0 h-screen w-screen overflow-hidden bg-transparent">
      {showMessage && (
        <div className="animate-message fixed left-1/2 top-[12vh] z-50 -translate-x-1/2 rounded-3xl border-4 border-pink-200 bg-pink-600/90 px-8 py-4 text-center text-2xl font-black text-white shadow-[0_0_35px_rgba(236,72,153,0.9)]">
          {message}
        </div>
      )}

      <div className="fixed bottom-8 left-1/2 z-40 h-[260px] w-[720px] -translate-x-1/2">
        {fallingGifts.map((gift) => (
          <img
            key={`fall-${gift.id}`}
            src={gift.image}
            alt={gift.name}
            className="animate-fall absolute left-1/2 top-0 z-30 drop-shadow-[0_0_12px_rgba(255,105,180,0.9)]"
            style={{
              width: `${gift.size}px`,
              height: `${gift.size}px`,
              animationDelay: `${gift.delay}s`,
              ["--gift-x" as string]: `${gift.x}px`,
              ["--gift-y" as string]: `${gift.y}px`,
              ["--gift-rotate" as string]: `${gift.rotate}deg`,
            }}
          />
        ))}

        {pileGifts.map((gift, index) => {
          const row = Math.floor(index / 18);
          const col = index % 18;
          const xJitter = ((index * 37) % 22) - 11;
          const yJitter = ((index * 19) % 12) - 6;

          return (
            <img
              key={`pile-${gift.id}-${index}`}
              src={gift.image}
              alt={gift.name}
              className="absolute z-20 drop-shadow-[0_0_10px_rgba(255,105,180,0.75)]"
              style={{
                left: `${95 + col * 30 + xJitter}px`,
                bottom: `${34 + row * 13 + yJitter}px`,
                width: `${gift.size}px`,
                height: `${gift.size}px`,
                transform: `rotate(${gift.rotate}deg)`,
              }}
            />
          );
        })}

        <Image
          src="/assets/gift-basket.png"
          alt="Gift basket"
          width={260}
          height={160}
          priority
          className="absolute bottom-0 left-1/2 z-30 w-[260px] -translate-x-1/2 drop-shadow-[0_0_30px_rgba(255,105,180,0.9)]"
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
              scale(0.6);
          }

          15% {
            opacity: 1;
          }

          75% {
            opacity: 1;
            transform: translate(
                calc(var(--gift-x) * 0.25),
                130px
              )
              rotate(calc(var(--gift-rotate) * 0.6)) scale(1);
          }

          100% {
            opacity: 1;
            transform: translate(0, 190px) rotate(var(--gift-rotate)) scale(1);
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
          animation: fall 1.6s cubic-bezier(0.2, 0.8, 0.25, 1) forwards;
        }

        .animate-twinkle {
          animation: twinkle 1.4s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}