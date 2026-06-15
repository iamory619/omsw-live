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

type FloatingGift = {
  id: number;
  image: string;
  name: string;
  size: number;
  x: number;
  y: number;
  rotate: number;
  delay: number;
};

export default function MagicLanternWidget() {
  const params = useParams();
  const overlayId = params.id as string;

  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [gifts, setGifts] = useState<FloatingGift[]>([]);

  const playEffect = (gift: GiftPayload) => {
    setMessage(`ขอบคุณ ${gift.user} ส่ง ${gift.giftName} x${gift.amount}`);
    setShowMessage(true);

    const count = Math.min(Math.max((gift.amount || 1) * 3, 8), 50);
    const giftImage = gift.giftImage || "/assets/rose.png";

    const newGifts: FloatingGift[] = Array.from({ length: count }).map(
      (_, index) => ({
        id: Date.now() + index,
        image: giftImage,
        name: gift.giftName,
        size: 18 + Math.random() * 20,
        x: 95 + Math.random() * 135,
        y: 150 + Math.random() * 210,
        rotate: -35 + Math.random() * 70,
        delay: Math.random() * 0.8,
      }),
    );

    setGifts((prev) => [...prev, ...newGifts].slice(-120));

    setTimeout(() => {
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
      setGifts([]);
    });

    return () => {
      socket.disconnect();
    };
  }, [overlayId]);

  return (
    <main className="fixed inset-0 h-screen w-screen overflow-hidden bg-transparent">
      {showMessage && (
        <div className="animate-message fixed left-1/2 top-[10vh] z-50 -translate-x-1/2 rounded-3xl border-4 border-purple-200 bg-purple-700/90 px-8 py-4 text-center text-2xl font-black text-white shadow-[0_0_35px_rgba(168,85,247,0.9)]">
          {message}
        </div>
      )}

      <div className="fixed bottom-8 left-1/2 h-[560px] w-[360px] -translate-x-1/2">
        <div className="absolute bottom-8 left-1/2 z-0 h-[360px] w-[260px] -translate-x-1/2 rounded-full bg-purple-500/25 blur-3xl" />

        <Image
          src="/assets/lantern/lantern-back.png"
          alt="Magic lantern back"
          width={360}
          height={560}
          priority
          className="absolute bottom-0 left-0 z-10 w-[360px]"
        />

        {gifts.map((gift) => (
          <img
            key={gift.id}
            src={gift.image}
            alt={gift.name}
            className="animate-float-gift absolute z-20 drop-shadow-[0_0_12px_rgba(168,85,247,0.9)]"
            style={{
              left: `${gift.x}px`,
              top: `${gift.y}px`,
              width: `${gift.size}px`,
              height: `${gift.size}px`,
              transform: `rotate(${gift.rotate}deg)`,
              animationDelay: `${gift.delay}s`,
            }}
          />
        ))}

        <Image
          src="/assets/lantern/lantern-front.png"
          alt="Magic lantern front"
          width={360}
          height={560}
          priority
          className="absolute bottom-0 left-0 z-30 w-[360px]"
        />

        <div className="animate-glow absolute bottom-[110px] left-1/2 z-40 h-[220px] w-[170px] -translate-x-1/2 rounded-full border border-purple-300/20 bg-white/5 blur-sm" />
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

        @keyframes floatGift {
          0% {
            opacity: 0;
            transform: translateY(30px) scale(0.5) rotate(-20deg);
          }

          20% {
            opacity: 1;
          }

          50% {
            transform: translateY(-8px) scale(1.05) rotate(10deg);
          }

          100% {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(0deg);
          }
        }

        @keyframes glow {
          0%,
          100% {
            opacity: 0.35;
            scale: 0.95;
          }

          50% {
            opacity: 0.8;
            scale: 1.05;
          }
        }

        .animate-message {
          animation: message 3.2s ease-in-out forwards;
        }

        .animate-float-gift {
          animation: floatGift 1.6s ease-out forwards;
        }

        .animate-glow {
          animation: glow 1.8s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}