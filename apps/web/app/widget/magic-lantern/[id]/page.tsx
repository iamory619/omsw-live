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

type Dust = {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
};

const JAR = {
  left: 450,
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
        size: 10 + Math.random() * 5,

        x: 28 + Math.random() * 150,
       y: 70 + Math.random() * 55,

        rotate: -40 + Math.random() * 80,
        floatX: -4 + Math.random() * 8,
        floatY: -4 + Math.random() * 8,
        delay: Math.random() * 0.5,
        duration: 2.8 + Math.random() * 1.6,
      }),
    );

    const newDusts: Dust[] = Array.from({ length: 90 }).map((_, index) => ({
      id: Date.now() + 5000 + index,
      x: 20 + Math.random() * 170,
      y: 55 + Math.random() * 65,
      size: 1.3 + Math.random() * 2.4,
      delay: Math.random() * 1.8,
      duration: 2 + Math.random() * 2.5,
    }));

    setGifts((prev) => [...prev, ...newGifts].slice(-160));
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
            left: `${JAR.left - 6}px`,
            top: `${JAR.top + 2}px`,
            width: `${JAR.width + 10}px`,
            height: `${JAR.height}px`,
            background:
              "radial-gradient(circle at 50% 52%, rgba(236,72,153,0.18) 0%, rgba(168,85,247,0.34) 42%, rgba(79,70,229,0.18) 72%, transparent 100%)",
          }}
        />

        <div
          className="absolute z-0 rounded-full blur-[42px] pointer-events-none"
          style={{
            left: `${JAR.left - 10}px`,
            top: `${JAR.top + 78}px`,
            width: `${JAR.width + 30}px`,
            height: "92px",
            background:
              "radial-gradient(circle, rgba(59,130,246,0.45) 0%, rgba(168,85,247,0.18) 48%, transparent 76%)",
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
            className="absolute inset-0 blur-xl"
            style={{
              background:
                "radial-gradient(circle at 50% 62%, rgba(168,85,247,0.14), transparent 72%)",
            }}
          />

          {dusts.map((dust) => (
            <span
              key={dust.id}
              className="animate-magic-dust absolute rounded-full bg-yellow-200 shadow-[0_0_10px_rgba(250,204,21,0.9)]"
              style={{
                left: `${dust.x}px`,
                top: `${dust.y}px`,
                width: `${dust.size}px`,
                height: `${dust.size}px`,
                animationDelay: `${dust.delay}s`,
                animationDuration: `${dust.duration}s`,
              }}
            />
          ))}

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
          className="animate-glow pointer-events-none absolute z-50 rounded-[34px] blur-xl"
          style={{
            left: `${JAR.left + 16}px`,
            top: `${JAR.top + 12}px`,
            width: `${JAR.width - 34}px`,
            height: `${JAR.height - 20}px`,
            background:
              "radial-gradient(circle at 50% 62%, rgba(255,255,255,0.07) 0%, rgba(168,85,247,0.07) 52%, transparent 76%)",
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
                calc(var(--gift-y) * -0.6)
              )
              scale(0.95) rotate(calc(var(--gift-rotate) * -0.5));
          }
        }

        @keyframes magicDust {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.5);
          }

          35% {
            opacity: 1;
          }

          100% {
            opacity: 0.25;
            transform: translateY(-18px) scale(1);
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

        .animate-float-gift {
          animation-name: floatGift;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-direction: alternate;
        }

        .animate-magic-dust {
          animation-name: magicDust;
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