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
  floatX: number;
  floatY: number;
  delay: number;
  duration: number;
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

    const count = Math.min(Math.max((gift.amount || 1) * 3, 8), 60);
    const giftImage = gift.giftImage || "/assets/rose.png";

    const newGifts: FloatingGift[] = Array.from({ length: count }).map(
      (_, index) => ({
        id: Date.now() + index,
        image: giftImage,
        name: gift.giftName,
        size: 24 + Math.random() * 18,

        // ตำแหน่งในโหล
        x: 250 + Math.random() * 180,
        y: 300 + Math.random() * 170,

        rotate: -35 + Math.random() * 70,

        // ระยะลอยไปมา
        floatX: -18 + Math.random() * 36,
        floatY: -18 + Math.random() * 36,

        delay: Math.random() * 0.8,
        duration: 2.6 + Math.random() * 1.8,
      }),
    );

    setGifts((prev) => [...prev, ...newGifts].slice(-140));

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
        <div className="animate-message fixed left-1/2 top-[8vh] z-50 -translate-x-1/2 rounded-3xl border-4 border-purple-200 bg-purple-700/90 px-8 py-4 text-center text-2xl font-black text-white shadow-[0_0_35px_rgba(168,85,247,0.9)]">
          {message}
        </div>
      )}

      <div className="fixed bottom-0 left-1/2 h-[900px] w-[700px] -translate-x-1/2">
        <div className="absolute bottom-[160px] left-1/2 z-0 h-[430px] w-[360px] -translate-x-1/2 rounded-full bg-purple-500/30 blur-3xl" />

        <Image
          src="/assets/lantern/lantern-back.png"
          alt="Magic lantern back"
          width={700}
          height={900}
          priority
          className="absolute bottom-0 left-0 z-10 w-[700px]"
        />

        <div className="absolute left-[235px] top-[280px] z-30 h-[230px] w-[230px] overflow-hidden rounded-[45%]">
          {" "}
          {gifts.map((gift) => (
            <img
              key={gift.id}
              src={gift.image}
              alt={gift.name}
              className="animate-float-gift absolute drop-shadow-[0_0_12px_rgba(255,105,180,0.95)]"
              style={{
                left: `${gift.x - 235}px`,
                top: `${gift.y - 280}px`,
                width: `${gift.size}px`,
                height: `${gift.size}px`,
                animationDelay: `${gift.delay}s`,
                animationDuration: `${gift.duration}s`,
                ["--gift-float-x" as string]: `${gift.floatX}px`,
                ["--gift-float-y" as string]: `${gift.floatY}px`,
                ["--gift-rotate" as string]: `${gift.rotate}deg`,
              }}
            />
          ))}
        </div>

        <Image
          src="/assets/lantern/lantern-front.png"
          alt="Magic lantern front"
          width={700}
          height={900}
          priority
          className="absolute bottom-0 left-0 z-40 w-[700px]"
        />

        <div className="animate-glow pointer-events-none absolute left-[250px] top-[190px] z-50 h-[320px] w-[210px] rounded-full bg-white/5 blur-sm" />
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
          }

          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px) scale(0.95);
          }
        }

        @keyframes floatGift {
          0% {
            opacity: 0;
            transform: translateY(24px) scale(0.5) rotate(0deg);
          }

          20% {
            opacity: 1;
          }

          50% {
            transform: translate(var(--gift-float-x), var(--gift-float-y))
              scale(1.05) rotate(var(--gift-rotate));
          }

          100% {
            opacity: 1;
            transform: translate(
                calc(var(--gift-float-x) * -0.6),
                calc(var(--gift-float-y) * -0.6)
              )
              scale(1) rotate(calc(var(--gift-rotate) * -0.5));
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
          animation-name: floatGift;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-direction: alternate;
        }

        .animate-glow {
          animation: glow 1.8s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}
