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
  const searchParams = useSearchParams();
  const overlayId = params.id as string;
  const lantern =   searchParams.get("lantern") || "phoenix";
  const lanternBack = `/assets/lantern/${lantern}-back.png`;
  const lanternFront = `/assets/lantern/${lantern}-front.gif`; 

  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [gifts, setGifts] = useState<FloatingGift[]>([]);

  const playEffect = (gift: GiftPayload) => {
    setMessage(`ขอบคุณ ${gift.user} ส่ง ${gift.giftName} x${gift.amount}`);
    setShowMessage(true);

    const count = Math.min(Math.max((gift.amount || 1) * 4, 10), 80);
    const giftImage = gift.giftImage || "/assets/rose.png";

    const newGifts: FloatingGift[] = Array.from({ length: count }).map(
      (_, index) => ({
        id: Date.now() + index,
        image: giftImage,
        name: gift.giftName,
        size: 11 + Math.random() * 5,

        x: 30 + Math.random() * 150,
        y: 40 + Math.random() * 170,

        rotate: -40 + Math.random() * 80,
        floatX: -5 + Math.random() * 10,
        floatY: -5 + Math.random() * 10,
        delay: Math.random() * 0.5,
        duration: 2.8 + Math.random() * 1.6,
      }),
    );

    setGifts((prev) => [...prev, ...newGifts].slice(-160));

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

      <div className="fixed bottom-[100px] left-1/2 h-[900px] w-[900px] -translate-x-1/2">
        <div
          className="absolute left-[320px] top-[500px] z-0 h-[300px] w-[270px] rounded-[40px] blur-[70px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 35%, rgba(236,72,153,0.28) 0%, rgba(168,85,247,0.5) 28%, rgba(79,70,229,0.35) 62%, transparent 100%)",
          }}
        />

        <div
          className="absolute left-[350px] top-[575px] z-0 h-[170px] w-[210px] rounded-full blur-[45px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(59,130,246,0.55) 0%, rgba(168,85,247,0.25) 48%, transparent 75%)",
          }}
        />

        <Image
          src={lanternBack}
          alt="Magic lantern back"
          width={900}
          height={1100} 
          priority
          className="absolute bottom-[-50px] left-1/2 z-10 w-[820px] -translate-x-1/2 pointer-events-none"
        />

        <div
          className="absolute left-[350px] top-[510px] z-30 h-[235px] w-[220px] overflow-hidden rounded-[34px]"
          style={{
            clipPath:
              "polygon(8% 0%, 92% 0%, 92% 76%, 82% 100%, 18% 100%, 8% 76%)",
          }}
        >
          <div
            className="absolute inset-0 blur-xl"
            style={{
              background:
                "radial-gradient(circle at 50% 45%, rgba(168,85,247,0.22), transparent 72%)",
            }}
          />

          {gifts.map((gift) => (
            <img
              key={gift.id}
              src={gift.image}
              alt={gift.name}
              className="animate-float-gift absolute drop-shadow-[0_0_6px_rgba(255,105,180,0.75)]"
              style={{
                left: `${gift.x}px`,
                top: `${gift.y}px`,
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
          src={lanternFront}
          alt="Magic lantern front"
          width={900}
          height={1100}
          priority
          className="absolute bottom-[-50px] left-1/2 z-40 w-[820px] -translate-x-1/2 pointer-events-none"
        />

        <div
          className="animate-glow pointer-events-none absolute left-[360px] top-[515px] z-50 h-[220px] w-[200px] rounded-[34px] blur-xl"
          style={{
            background:
              "radial-gradient(circle at 50% 55%, rgba(255,255,255,0.08) 0%, rgba(168,85,247,0.08) 50%, transparent 76%)",
          }}
        />
      </div>

      <style>{`
        html,
        body {
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
            transform: translateY(8px) scale(0.7) rotate(0deg);
          }

          20% {
            opacity: 1;
          }

          50% {
            transform: translate(var(--gift-float-x), var(--gift-float-y))
              scale(1) rotate(var(--gift-rotate));
          }

          100% {
            opacity: 1;
            transform: translate(
                calc(var(--gift-float-x) * -0.6),
                calc(var(--gift-float-y) * -0.6)
              )
              scale(0.95) rotate(calc(var(--gift-rotate) * -0.5));
          }
        }

        @keyframes glow {
          0%,
          100% {
            opacity: 0.3;
            scale: 0.95;
          }

          50% {
            opacity: 0.65;
            scale: 1.03;
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