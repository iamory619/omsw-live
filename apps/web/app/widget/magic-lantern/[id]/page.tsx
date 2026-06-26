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
  delay: number;
  duration: number;
  orbit: number;
  depth: number;
};

type Dust = {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  orbit: number;
};

const JAR = {
  left: 550,
  top: 600,
  width: 214,
  height: 150,
};

export default function MagicLanternWidget() {
  const params = useParams();
  const searchParams = useSearchParams();

  const overlayId = params.id as string;
  const lantern = searchParams.get("lantern") || "phoenix";

  const lanternBack = `/assets/lantern/${lantern}-back.png`;
  const lanternFront = `/assets/lantern/${lantern}-front.gif`;

  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [gifts, setGifts] = useState<FloatingGift[]>([]);
  const [dusts, setDusts] = useState<Dust[]>([]);
  const [power, setPower] = useState(0);

  const playEffect = (gift: GiftPayload) => {
    setMessage(`ขอบคุณ ${gift.user} ส่ง ${gift.giftName} x${gift.amount}`);
    setShowMessage(true);

    const count = Math.min(Math.max((gift.amount || 1) * 3, 8), 80);
    const giftImage = gift.giftImage || "/assets/rose.png";

    const newGifts: FloatingGift[] = Array.from({ length: count }).map(
      (_, index) => {
        const row = index % 5;
        const col = Math.floor(index / 5) % 8;

        return {
          id: Date.now() + index,
          image: giftImage,
          name: gift.giftName,
          size: 11 + Math.random() * 6,

          x: 32 + col * 18 + Math.random() * 8,
          y: 74 + row * 13 + Math.random() * 8,

          rotate: -35 + Math.random() * 70,
          delay: Math.random() * 0.8,
          duration: 3 + Math.random() * 2,
          orbit: 6 + Math.random() * 10,
          depth: 0.85 + Math.random() * 0.25,
        };
      },
    );

    const newDusts: Dust[] = Array.from({ length: 120 }).map((_, index) => ({
      id: Date.now() + 5000 + index,
      x: 40 + Math.random() * 130,
      y: 35 + Math.random() * 95,
      size: 1.2 + Math.random() * 2.8,
      delay: Math.random() * 2,
      duration: 2.4 + Math.random() * 2.4,
      orbit: 8 + Math.random() * 18,
    }));

    setPower((prev) => Math.min(prev + count, 220));
    setGifts((prev) => [...prev, ...newGifts].slice(-220));
    setDusts(newDusts);

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
      setDusts([]);
      setPower(0);
    });

    return () => {
      socket.disconnect();
    };
  }, [overlayId, lantern]);

  return (
    <main className="fixed inset-0 h-screen w-screen overflow-hidden bg-transparent">
      {showMessage && (
        <div className="animate-message fixed left-1/2 top-[8vh] z-50 -translate-x-1/2 rounded-3xl border-4 border-purple-200 bg-purple-700/90 px-8 py-4 text-center text-2xl font-black text-white shadow-[0_0_35px_rgba(168,85,247,0.9)]">
          {message}
        </div>
      )}

      <div className="fixed bottom-[100px] left-1/2 h-[900px] w-[900px] -translate-x-1/2">
        <div
          className="absolute z-0 rounded-[38px] blur-[42px] pointer-events-none"
          style={{
            left: `${JAR.left - 8}px`,
            top: `${JAR.top + 4}px`,
            width: `${JAR.width + 16}px`,
            height: `${JAR.height}px`,
            opacity: 0.45 + Math.min(power / 300, 0.35),
            background:
              "radial-gradient(circle at 50% 58%, rgba(236,72,153,0.18) 0%, rgba(168,85,247,0.42) 42%, rgba(79,70,229,0.22) 72%, transparent 100%)",
          }}
        />

        <div
          className="absolute z-0 rounded-full blur-[38px] pointer-events-none"
          style={{
            left: `${JAR.left - 4}px`,
            top: `${JAR.top + 88}px`,
            width: `${JAR.width + 20}px`,
            height: "72px",
            background:
              "radial-gradient(circle, rgba(59,130,246,0.42) 0%, rgba(168,85,247,0.18) 48%, transparent 76%)",
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
          className="absolute z-30 overflow-hidden rounded-[34px]"
          style={{
            left: `${JAR.left}px`,
            top: `${JAR.top}px`,
            width: `${JAR.width}px`,
            height: `${JAR.height}px`,
            clipPath:
              "polygon(8% 0%, 92% 0%, 92% 76%, 82% 100%, 18% 100%, 8% 76%)",
          }}
        >
          <div
            className="animate-breath absolute inset-0 blur-xl"
            style={{
              background:
                "radial-gradient(circle at 50% 68%, rgba(168,85,247,0.2), transparent 72%)",
            }}
          />

          {dusts.map((dust) => (
            <span
              key={dust.id}
              className="animate-orbit-dust absolute rounded-full bg-yellow-200 shadow-[0_0_12px_rgba(250,204,21,0.95)]"
              style={{
                left: `${dust.x}px`,
                top: `${dust.y}px`,
                width: `${dust.size}px`,
                height: `${dust.size}px`,
                animationDelay: `${dust.delay}s`,
                animationDuration: `${dust.duration}s`,
                ["--dust-orbit" as string]: `${dust.orbit}px`,
              }}
            />
          ))}

          {gifts.map((gift) => (
            <img
              key={gift.id}
              src={gift.image}
              alt={gift.name}
              className="animate-orbit-gift absolute drop-shadow-[0_0_7px_rgba(255,105,180,0.85)]"
              style={{
                left: `${gift.x}px`,
                top: `${gift.y}px`,
                width: `${gift.size}px`,
                height: `${gift.size}px`,
                animationDelay: `${gift.delay}s`,
                animationDuration: `${gift.duration}s`,
                ["--gift-rotate" as string]: `${gift.rotate}deg`,
                ["--gift-orbit" as string]: `${gift.orbit}px`,
                ["--gift-depth" as string]: `${gift.depth}`,
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
          className="animate-glow pointer-events-none absolute z-50 rounded-[34px] blur-xl"
          style={{
            left: `${JAR.left + 16}px`,
            top: `${JAR.top + 18}px`,
            width: `${JAR.width - 34}px`,
            height: `${JAR.height - 32}px`,
            background:
              "radial-gradient(circle at 50% 65%, rgba(255,255,255,0.07) 0%, rgba(168,85,247,0.07) 52%, transparent 76%)",
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

        @keyframes orbitGift {
          0% {
            opacity: 0;
            transform: translateY(8px) scale(0.6) rotate(0deg);
          }

          20% {
            opacity: 1;
          }

          50% {
            transform: translate(
                var(--gift-orbit),
                calc(var(--gift-orbit) * -0.45)
              )
              scale(var(--gift-depth)) rotate(var(--gift-rotate));
          }

          100% {
            opacity: 1;
            transform: translate(
                calc(var(--gift-orbit) * -0.8),
                calc(var(--gift-orbit) * 0.35)
              )
              scale(0.95) rotate(calc(var(--gift-rotate) * -0.5));
          }
        }

        @keyframes orbitDust {
          0% {
            opacity: 0;
            transform: translate(0, 8px) scale(0.5);
          }

          35% {
            opacity: 1;
          }

          100% {
            opacity: 0.35;
            transform: translate(
                calc(var(--dust-orbit) * -0.7),
                calc(var(--dust-orbit) * -1)
              )
              scale(1);
          }
        }

        @keyframes breath {
          0%,
          100% {
            opacity: 0.35;
            scale: 0.95;
          }

          50% {
            opacity: 0.75;
            scale: 1.05;
          }
        }

        @keyframes glow {
          0%,
          100% {
            opacity: 0.25;
            scale: 0.95;
          }

          50% {
            opacity: 0.55;
            scale: 1.03;
          }
        }

        .animate-message {
          animation: message 3.2s ease-in-out forwards;
        }

        .animate-orbit-gift {
          animation-name: orbitGift;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-direction: alternate;
        }

        .animate-orbit-dust {
          animation-name: orbitDust;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-direction: alternate;
        }

        .animate-breath {
          animation: breath 2.6s ease-in-out infinite;
        }

        .animate-glow {
          animation: glow 1.8s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}