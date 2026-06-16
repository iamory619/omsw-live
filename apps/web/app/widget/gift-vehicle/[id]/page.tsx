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

type DropGift = {
  id: number;
  image: string;
  name: string;
  size: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  rotate: number;
  delay: number;
};

type PileGift = {
  id: number;
  image: string;
  name: string;
  size: number;
  x: number;
  y: number;
  rotate: number;
};

const VEHICLES: Record<string, string> = {
  tuktuk: "/assets/vehicles/tuktuk.png",
  pickup: "/assets/vehicles/pickup.png",
  car: "/assets/vehicles/car.png",
  saleng: "/assets/vehicles/saleng.png",
};

export default function GiftVehicleWidget() {
  const params = useParams();
  const searchParams = useSearchParams();

  const overlayId = params.id as string;
  const vehicle = searchParams.get("vehicle") || "tuktuk";
  const vehicleImage = VEHICLES[vehicle] || VEHICLES.tuktuk;

  const [message, setMessage] = useState("");
  const [showVehicle, setShowVehicle] = useState(false);
  const [drops, setDrops] = useState<DropGift[]>([]);
  const [pile, setPile] = useState<PileGift[]>([]);

  const playEffect = (gift: GiftPayload) => {
    setMessage(`ขอบคุณ ${gift.user} ส่ง ${gift.giftName} x${gift.amount}`);
    setShowVehicle(true);
    setDrops([]);

    const giftImage = gift.giftImage || "/assets/rose.png";
    const count = Math.min(Math.max(gift.amount || 1, 1), 80);

    const newDrops: DropGift[] = Array.from({ length: count }).map(
      (_, index) => {
        const progress = count <= 1 ? 0.5 : index / (count - 1);

        // ให้ของขวัญออกจากท้ายรถ ไม่ใช่หน้ารถ
        const startX = 0 + progress * 500 + Math.random() * 18;
        const startY = 165 + Math.random() * 20;

        const endX = startX - 35 + Math.random() * 70;
        const endY = 265 + Math.random() * 35;

        return {
          id: Date.now() + index,
          image: giftImage,
          name: gift.giftName,
          size: 22 + Math.random() * 12,
          startX,
          startY,
          endX,
          endY,
          rotate: -100 + Math.random() * 200,
          delay: 0.65 + index * 0.055,
        };
      },
    );

    setTimeout(() => {
      setDrops(newDrops);
    }, 350);

    newDrops.forEach((item) => {
      setTimeout(() => {
        setPile((prev) =>
          [
            ...prev,
            {
              id: item.id,
              image: item.image,
              name: item.name,
              size: item.size,
              x: item.endX,
              y: item.endY,
              rotate: item.rotate,
            },
          ].slice(-180),
        );
      }, (item.delay + 1.25) * 1000);
    });

    setTimeout(() => {
      setShowVehicle(false);
      setDrops([]);
      setMessage("");
    }, 5800);
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
      setShowVehicle(false);
      setDrops([]);
      setPile([]);
    });

    return () => {
      socket.disconnect();
    };
  }, [overlayId, vehicle]);

  return (
    <main className="fixed inset-0 h-screen w-screen overflow-hidden bg-transparent">
      {showVehicle && (
        <div className="animate-message fixed left-1/2 top-[8vh] z-50 -translate-x-1/2 rounded-3xl border-4 border-yellow-200 bg-yellow-500/90 px-8 py-4 text-center text-2xl font-black text-white shadow-[0_0_35px_rgba(234,179,8,0.9)]">
          {message}
        </div>
      )}

      <div className="fixed bottom-[70px] left-1/2 h-[430px] w-[980px] -translate-x-1/2">
        <div className="absolute bottom-[10px] left-1/2 z-0 h-[70px] w-[760px] -translate-x-1/2 rounded-full bg-yellow-500/15 blur-2xl" />

        {showVehicle && (
          <div className="animate-vehicle absolute bottom-[82px] left-0 z-40">
            <Image
              src={vehicleImage}
              alt="Gift vehicle"
              width={500}
              height={300}
              priority
              className="w-[430px] scale-x-[-1] drop-shadow-[0_0_28px_rgba(250,204,21,0.85)]"
            />
          </div>
        )}

        {drops.map((gift) => (
          <img
            key={`drop-${gift.id}`}
            src={gift.image}
            alt={gift.name}
            className="animate-drop absolute z-30 drop-shadow-[0_0_10px_rgba(255,105,180,0.85)]"
            style={{
              left: `${gift.startX}px`,
              top: `${gift.startY}px`,
              width: `${gift.size}px`,
              height: `${gift.size}px`,
              animationDelay: `${gift.delay}s`,
              ["--gift-x" as string]: `${gift.endX - gift.startX}px`,
              ["--gift-y" as string]: `${gift.endY - gift.startY}px`,
              ["--gift-rotate" as string]: `${gift.rotate}deg`,
            }}
          />
        ))}

        {pile.map((gift) => (
          <img
            key={`pile-${gift.id}`}
            src={gift.image}
            alt={gift.name}
            className="absolute z-20 drop-shadow-[0_0_8px_rgba(255,105,180,0.75)]"
            style={{
              left: `${gift.x}px`,
              top: `${gift.y}px`,
              width: `${gift.size}px`,
              height: `${gift.size}px`,
              transform: `rotate(${gift.rotate}deg)`,
            }}
          />
        ))}
      </div>

      <style>{`
        html,
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: transparent !important;
        }

        @keyframes vehicle {
          0% {
            transform: translateX(-460px) translateY(0) rotate(-1deg);
            opacity: 0;
          }

          8% {
            opacity: 1;
          }

          50% {
            transform: translateX(36vw) translateY(-6px) rotate(1deg);
            opacity: 1;
          }

          100% {
            transform: translateX(1080px) translateY(0) rotate(-1deg);
            opacity: 0;
          }
        }

        @keyframes drop {
          0% {
            opacity: 0;
            transform: translate(0, 0) scale(0.55) rotate(0deg);
          }

          12% {
            opacity: 1;
          }

          65% {
            opacity: 1;
            transform: translate(
                calc(var(--gift-x) * 0.7),
                calc(var(--gift-y) * 0.75)
              )
              scale(1) rotate(calc(var(--gift-rotate) * 0.75));
          }

          100% {
            opacity: 1;
            transform: translate(var(--gift-x), var(--gift-y)) scale(1)
              rotate(var(--gift-rotate));
          }
        }

        @keyframes message {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(-18px) scale(0.85);
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

        .animate-vehicle {
          animation: vehicle 5.4s ease-in-out forwards;
        }

        .animate-drop {
  animation: drop 1.55s cubic-bezier(0.16, 0.8, 0.28, 1) forwards;
}

        .animate-message {
          animation: message 3.2s ease-in-out forwards;
        }
      `}</style>
    </main>
  );
}