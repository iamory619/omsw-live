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

    const newDrops = Array.from({ length: dropCount }).map((_, index) => ({
      id: Date.now() + index,
      delay: index * 0.12,
      size: 28 + Math.random() * 8,
      image: gift.giftImage || "/assets/rose.png",
      name: gift.giftName,
      rotate: -80 + Math.random() * 160,
      drift: -25 + Math.random() * 50,
    }));

    setTimeout(() => {
      setDrops(newDrops);
    }, 300);

    setTimeout(() => {
      setLandedDrops((prev) => [...prev, ...newDrops].slice(-120));
    }, 3300);

    setTimeout(() => {
      setShowPlane(false);
      setMessage("");
      setDrops([]);
    }, 9000);
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
          <div className="relative h-[520px] w-[900px]">
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

            {drops.map((gift) => (
              <div
                key={gift.id}
                className="animate-gift-drop absolute left-[545px] top-[125px] z-40 drop-shadow-xl"
                style={{
                  animationDelay: `${gift.delay}s`,
                  ["--gift-drift" as string]: `${gift.drift}px`,
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
          </div>
        </div>
      )}

      {landedDrops.map((gift, index) => (
        <img
          key={`landed-${gift.id}`}
          src={gift.image}
          alt={gift.name}
          className="fixed z-[998] drop-shadow-xl"
          style={{
            left: `calc(55vw + ${gift.drift}px + ${(index % 8) * 4}px)`,
            top: `calc(72vh - ${Math.floor(index / 8) * 10}px)`,
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

        @keyframes giftDrop {
          0% {
            transform: translate(0, 0) rotate(0deg) scale(0.7);
            opacity: 0;
          }

          15% {
            opacity: 1;
          }

          75% {
            transform: translate(calc(var(--gift-drift) * 0.7), 310px)
              rotate(calc(var(--gift-rotate) * 0.7))
              scale(0.95);
            opacity: 1;
          }

          100% {
            transform: translate(var(--gift-drift), 360px)
              rotate(var(--gift-rotate))
              scale(1);
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

        .animate-gift-drop {
          animation: giftDrop 2.8s ease-in forwards;
          animation-fill-mode: forwards;
        }

        .animate-sparkle {
          animation: sparkle 0.8s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}