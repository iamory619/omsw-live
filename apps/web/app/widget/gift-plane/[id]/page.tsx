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
  startX: number;
  startY: number;
  fallY: number;
};

export default function GiftPlaneWidget() {
  const params = useParams();
  const overlayId = params.id as string;

  const [showPlane, setShowPlane] = useState(false);
  const [message, setMessage] = useState("");
  const [drops, setDrops] = useState<DropGift[]>([]);
  const [landedDrops, setLandedDrops] = useState<DropGift[]>([]);

  const playEffect = (text: string, gift: GiftPayload) => {
    setMessage(text);
    setShowPlane(true);
    setDrops([]);

    const dropCount = Math.min(gift.amount || 1, 30);

    const driftRange = gift.amount <= 1 ? 18 : gift.amount <= 10 ? 60 : 120;

    const newDrops = Array.from({ length: dropCount }).map((_, index) => ({
      id: Date.now() + index,
      delay: index * 0.12 + Math.random() * 0.15,
      size: 26 + Math.random() * 10,
      image: gift.giftImage || "/assets/gift-box.png",
      name: gift.giftName,
      rotate: -90 + Math.random() * 180,
      drift: -driftRange / 2 + Math.random() * driftRange,
      startX: 60 + Math.random() * 2,
      startY: 28 + Math.random() * 2,
      fallY: 43 + Math.random() * 4,
    }));

    newDrops.forEach((drop, index) => {
      setTimeout(
        () => {
          setDrops((prev) => [...prev, drop]);
        },
        350 + index * 120,
      );

      setTimeout(
        () => {
          setLandedDrops((prev) => [...prev, drop].slice(-120));
          setDrops((prev) => prev.filter((item) => item.id !== drop.id));
        },
        3600 + index * 120,
      );
    });

    setTimeout(() => {
      setShowPlane(false);
      setMessage("");
      setDrops([]);
    }, 5600);
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
      setLandedDrops([]);
    });

    return () => {
      socket.disconnect();
    };
  }, [overlayId]);

  return (
    <main className="fixed inset-0 h-screen w-screen overflow-hidden bg-transparent">
      {showPlane && (
        <div className="animate-plane fixed left-0 top-0 z-50">
          <div className="relative h-[180px] w-[900px]">
            <div className="absolute left-[180px] top-[72px] z-20 w-[280px] rotate-[-3deg] rounded-full border-4 border-white bg-pink-500/90 px-4 py-2 text-center text-base font-black text-white shadow-2xl">
              {message || "Thank you!"}
            </div>

            <div className="absolute left-[420px] top-[112px] z-10 h-[3px] w-[95px] bg-white/80" />

            <Image
              src="/assets/plane.png"
              alt="Gift plane"
              width={300}
              height={150}
              priority
              className="absolute left-[450px] top-[30px] z-50 w-[260px]"
            />

            <div className="animate-sparkle absolute left-[460px] top-[130px] text-2xl">
              ✨✨✨
            </div>
          </div>
        </div>
      )}

      {drops.map((gift) => (
        <div
          key={gift.id}
          className="animate-gift-fall fixed z-10 drop-shadow-xl"
          style={{
            left: `${gift.startX}vw`,
            top: `${gift.startY}vh`,
            animationDelay: `${gift.delay}s`,
            ["--gift-rotate" as string]: `${gift.rotate}deg`,
            ["--gift-drift" as string]: `${gift.drift}px`,
            ["--gift-fall" as string]: `${gift.fallY}vh`,
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

      {landedDrops.map((gift) => (
        <img
          key={`landed-${gift.id}`}
          src={gift.image}
          alt={gift.name}
          className="fixed z-20 drop-shadow-xl"
          style={{
            left: `calc(${gift.startX}vw + ${gift.drift}px)`,
            top: `calc(${gift.startY}vh + ${gift.fallY}vh)`,
            width: `${gift.size}px`,
            height: `${gift.size}px`,
            transform: `rotate(${gift.rotate}deg)`,
          }}
        />
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
            transform: translateX(-900px) translateY(3vh) rotate(-2deg);
            opacity: 0;
          }

          10% {
            opacity: 1;
          }

          50% {
            transform: translateX(20vw) translateY(5vh) rotate(-1deg);
          }

          80% {
            transform: translateX(55vw) translateY(3vh) rotate(1deg);
          }

          100% {
            transform: translateX(120vw) translateY(4vh) rotate(2deg);
            opacity: 0;
          }
        }

        @keyframes giftFall {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg) scale(0.7);
            opacity: 0;
          }

          10% {
            opacity: 1;
          }

          45% {
            transform: translate3d(
                calc(var(--gift-drift) * 0.45),
                calc(var(--gift-fall) * 0.5),
                0
              )
              rotate(calc(var(--gift-rotate) * 0.45)) scale(0.9);
          }

          100% {
            transform: translate3d(var(--gift-drift), var(--gift-fall), 0)
              rotate(var(--gift-rotate)) scale(1);
            opacity: 1;
          }
        }

        @keyframes sparkle {
          0%,
          100% {
            opacity: 0.4;
            transform: scale(0.8);
          }

          50% {
            opacity: 1;
            transform: scale(1.1);
          }
        }

        .animate-plane {
          animation: plane 5.5s ease-in-out forwards;
        }

        .animate-gift-fall {
          animation-name: giftFall;
          animation-duration: 3.3s;
          animation-timing-function: cubic-bezier(0.22, 0.61, 0.36, 1);
          animation-fill-mode: forwards;
        }

        .animate-sparkle {
          animation: sparkle 0.8s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}
