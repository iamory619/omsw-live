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
  left: number;
  delay: number;
  size: number;
  image: string;
  name: string;
  bottom: number;
  rotate: number;
};

export default function GiftPlaneWidget() {
  const params = useParams();
  const overlayId = params.id as string;

  const [showPlane, setShowPlane] = useState(false);
  const [message, setMessage] = useState("");
  const [drops, setDrops] = useState<DropGift[]>([]);

  const playEffect = (text: string, gift: GiftPayload) => {
    setMessage(text);
    setShowPlane(true);

    const newDrops = Array.from({ length: 10 }).map((_, index) => ({
      id: Date.now() + index,
      left: 35 + Math.random() * 30,
      delay: Math.random() * 1.8,
      size: 32 + Math.random() * 16,
      image: gift.giftImage || "/assets/gift-box.png",
      name: gift.giftName,
      bottom: 10 + Math.random() * 70,
      rotate: -25 + Math.random() * 50,
    }));

    setDrops((prev) => [...prev, ...newDrops].slice(-120));

    setTimeout(() => {
      setShowPlane(false);
      setMessage("");
    }, 5500);
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

    return () => {
      socket.disconnect();
    };
  }, [overlayId]);

  return (
    <main className="fixed inset-0 h-screen w-screen overflow-hidden bg-transparent">
      {showPlane && (
        <div className="animate-plane fixed left-0 top-0 z-50">
          <div className="relative h-[180px] w-[900px]">
            <Image
              src="/assets/plane.png"
              alt="Gift plane"
              width={300}
              height={150}
              className="absolute left-[40px] top-[40px] z-30 w-[260px]"
            />

            <div className="absolute left-[240px] top-[100px] z-10 h-[3px] w-[70px] bg-white" />
            <div className="absolute left-[300px] top-[55px]  z-20 w-[360px] rotate-[-4deg] rounded-full border-4 border-white bg-pink-500/90 px-6 py-3 text-center text-xl font-black text-white shadow-2xl">
              {" "}
              {message || "Thank you!"}
            </div>

            <div className="animate-sparkle absolute left-[40px] top-[130px] text-2xl">
              ✨✨✨
            </div>
          </div>
        </div>
      )}
      {drops.map((gift) => (
        <div
          key={gift.id}
          className="animate-gift-fall absolute top-0 drop-shadow-xl"
          style={{
            left: `${gift.left}%`,
            animationDelay: `${gift.delay}s`,
            ["--gift-bottom" as string]: `${gift.bottom}px`,
            ["--gift-rotate" as string]: `${gift.rotate}deg`,
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
            transform: translateX(-700px) translateY(8vh) rotate(-3deg);
            opacity: 0;
          }

          10% {
            opacity: 1;
          }

          50% {
            transform: translateX(35vw) translateY(10vh) rotate(0deg);
          }

          80% {
            transform: translateX(65vw) translateY(12vh) rotate(2deg);
          }

          100% {
            transform: translateX(120vw) translateY(10vh) rotate(3deg);
            opacity: 0;
          }
        }

        @keyframes giftFall {
          0% {
            transform: translateY(10vh) rotate(0deg) scale(0.8);
            opacity: 0;
          }

          15% {
            opacity: 1;
          }

          100% {
            transform: translateY(85vh) rotate(var(--gift-rotate)) scale(1);
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
          animation-duration: 4.2s;
          animation-timing-function: ease-in;
          animation-fill-mode: forwards;
        }

        .animate-sparkle {
          animation: sparkle 0.8s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}
