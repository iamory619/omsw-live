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

type DropGift = {
  id: number;
  delay: number;
  size: number;
  image: string;
  name: string;
  rotate: number;
  drift: number;
  fallDistance: number;
  startLeft: number;
};

type Sparkle = {
  id: number;
  left: number;
  top: number;
  delay: number;
  size: number;
};

export default function GiftPlaneWidget() {
  const params = useParams();
  const overlayId = params.id as string;

  const [showPlane, setShowPlane] = useState(false);
  const [message, setMessage] = useState("");
  const [drops, setDrops] = useState<DropGift[]>([]);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  const playEffect = (text: string, gift: GiftPayload) => {
    setMessage(text);
    setShowPlane(true);

    const effectCount = Math.min(Math.max((gift.amount || 1) * 5, 25), 120);
    const giftImage = gift.giftImage || "/assets/rose.png";

    const newDrops = Array.from({ length: effectCount }).map((_, index) => ({
      id: Date.now() + index,
      delay: index * 0.035 + Math.random() * 0.2,
      size: 22 + Math.random() * 22,
      image: giftImage,
      name: gift.giftName,
      rotate: -180 + Math.random() * 360,
      drift: -190 + Math.random() * 380,
      fallDistance: 420 + Math.random() * 130,
      startLeft: 610 + Math.random() * 80,
    }));

    const newSparkles = Array.from({ length: 28 }).map((_, index) => ({
      id: Date.now() + 10000 + index,
      left: 28 + Math.random() * 48,
      top: 15 + Math.random() * 55,
      delay: Math.random() * 2,
      size: 12 + Math.random() * 14,
    }));

    setDrops((prev) => [...prev, ...newDrops].slice(-260));
    setSparkles(newSparkles);

    setTimeout(() => {
      setShowPlane(false);
      setMessage("");
      setSparkles([]);
    }, 7000);
  };

  useEffect(() => {
    if (!overlayId) return;

    const socket = io("https://server-production-b88b.up.railway.app");

    socket.emit("join-overlay", overlayId);

    socket.on("gift-plane", (gift: GiftPayload) => {
      playEffect(
        `ขอบคุณ ${gift.user} ส่ง ${gift.giftName} x${gift.amount}`,
        gift,
      );
    });

    socket.on("reset-gift", () => {
      setShowPlane(false);
      setMessage("");
      setDrops([]);
      setSparkles([]);
    });

    return () => {
      socket.disconnect();
    };
  }, [overlayId]);

  return (
    <main className="fixed inset-0 h-screen w-screen overflow-hidden bg-transparent">
      {showPlane && (
        <div className="animate-plane fixed left-0 top-0 z-50">
          <div className="relative h-[620px] w-[980px]">
            <div className="absolute left-[115px] top-[70px] z-20 w-[360px] rotate-[-3deg] rounded-3xl border-4 border-pink-200 bg-pink-600/90 px-5 py-3 text-center text-xl font-black text-white shadow-[0_0_30px_rgba(236,72,153,0.8)]">
              {message || "Thank you!"}
            </div>

            <div className="absolute left-[450px] top-[118px] z-10 h-[4px] w-[120px] bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.8)]" />

            <Image
              src="/assets/plane.png"
              alt="Gift plane"
              width={360}
              height={180}
              priority
              className="absolute left-[540px] top-[25px] z-50 w-[330px] drop-shadow-[0_0_24px_rgba(255,105,180,0.7)]"
            />

            <div className="absolute left-[575px] top-[128px] z-40 flex gap-1">
              <span className="animate-smoke h-4 w-4 rounded-full bg-white/50 blur-sm" />
              <span className="animate-smoke h-5 w-5 rounded-full bg-pink-200/40 blur-sm" />
              <span className="animate-smoke h-3 w-3 rounded-full bg-white/40 blur-sm" />
            </div>

            <div className="animate-sparkle absolute left-[545px] top-[150px] text-3xl">
              ✨✨✨
            </div>
          </div>
        </div>
      )}

      {drops.map((gift) => (
        <div
          key={gift.id}
          className="animate-gift-rain fixed top-[24vh] z-40 drop-shadow-xl"
          style={{
            left: `${gift.startLeft}px`,
            animationDelay: `${gift.delay}s`,
            ["--gift-drift" as string]: `${gift.drift}px`,
            ["--gift-rotate" as string]: `${gift.rotate}deg`,
            ["--gift-fall" as string]: `${gift.fallDistance}px`,
          }}
        >
          <img
            src={gift.image}
            alt={gift.name}
            style={{
              width: `${gift.size}px`,
              height: `${gift.size}px`,
            }}
          />
        </div>
      ))}

      {sparkles.map((item) => (
        <div
          key={item.id}
          className="animate-twinkle pointer-events-none fixed z-20 text-yellow-300"
          style={{
            left: `${item.left}%`,
            top: `${item.top}%`,
            fontSize: `${item.size}px`,
            animationDelay: `${item.delay}s`,
          }}
        >
          ✨
        </div>
      ))}

      <style jsx>{`
        :global(html),
        :global(body) {
          background: transparent !important;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }

        @keyframes plane {
          0% {
            transform: translateX(-980px) translateY(3vh) rotate(-2deg);
            opacity: 0;
          }

          10% {
            opacity: 1;
          }

          45% {
            transform: translateX(13vw) translateY(4vh) rotate(-1deg);
          }

          75% {
            transform: translateX(38vw) translateY(3vh) rotate(1deg);
          }

          100% {
            transform: translateX(120vw) translateY(4vh) rotate(2deg);
            opacity: 0;
          }
        }

        @keyframes giftRain {
          0% {
            transform: translate(0, 0) rotate(0deg) scale(0.35);
            opacity: 0;
          }

          12% {
            opacity: 1;
          }

          55% {
            transform: translate(
                calc(var(--gift-drift) * 0.45),
                calc(var(--gift-fall) * 0.55)
              )
              rotate(calc(var(--gift-rotate) * 0.45))
              scale(0.85);
          }

          100% {
            transform: translate(var(--gift-drift), var(--gift-fall))
              rotate(var(--gift-rotate))
              scale(1);
            opacity: 1;
          }
        }

        @keyframes sparkle {
          0%,
          100% {
            opacity: 0.35;
            transform: scale(0.8);
          }

          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }

        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.15;
            transform: scale(0.6);
          }

          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        @keyframes smoke {
          0% {
            opacity: 0.9;
            transform: translateX(0) scale(0.7);
          }

          100% {
            opacity: 0;
            transform: translateX(-35px) scale(1.5);
          }
        }

        .animate-plane {
          animation: plane 6.5s ease-in-out forwards;
        }

        .animate-gift-rain {
          animation: giftRain 3s cubic-bezier(0.2, 0.7, 0.35, 1) forwards;
        }

        .animate-sparkle {
          animation: sparkle 0.8s ease-in-out infinite;
        }

        .animate-twinkle {
          animation: twinkle 1.6s ease-in-out infinite;
        }

        .animate-smoke {
          animation: smoke 1.2s ease-out infinite;
        }
      `}</style>
    </main>
  );
}