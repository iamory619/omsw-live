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
  x: number;
  y: number;
  rotate: number;
  delay: number;
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
  const [pile, setPile] = useState<DropGift[]>([]);

  const playEffect = (gift: GiftPayload) => {
    setMessage(`ขอบคุณ ${gift.user} ส่ง ${gift.giftName} x${gift.amount}`);
    setShowVehicle(true);
    setDrops([]);

    const giftImage = gift.giftImage || "/assets/rose.png";
    const count = Math.min(Math.max(gift.amount || 1, 1), 80);

    const newDrops: DropGift[] = Array.from({ length: count }).map(
      (_, index) => ({
        id: Date.now() + index,
        image: giftImage,
        name: gift.giftName,
        size: 22 + Math.random() * 10,
        x: 420 + Math.random() * 170,
        y: -60 - Math.random() * 80,
        rotate: -90 + Math.random() * 180,
        delay: 0.8 + index * 0.045,
      }),
    );

    setTimeout(() => {
      setDrops(newDrops);
    }, 450);

    setTimeout(() => {
      setPile((prev) => [...prev, ...newDrops].slice(-180));
    }, 2200);

    setTimeout(() => {
      setShowVehicle(false);
      setDrops([]);
      setMessage("");
    }, 5200);
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
        <div className="animate-message fixed left-1/2 top-[9vh] z-50 -translate-x-1/2 rounded-3xl border-4 border-yellow-200 bg-yellow-500/90 px-8 py-4 text-center text-2xl font-black text-white shadow-[0_0_35px_rgba(234,179,8,0.9)]">
          {message}
        </div>
      )}

      <div className="fixed bottom-[80px] left-0 h-[360px] w-screen">
        {showVehicle && (
          <div className="animate-vehicle absolute bottom-[60px] left-0 z-40">
            <Image
              src={vehicleImage}
              alt="Gift vehicle"
              width={360}
              height={220}
              priority
              className="w-[340px] drop-shadow-[0_0_22px_rgba(250,204,21,0.8)]"
            />
          </div>
        )}

        {drops.map((gift) => (
          <img
            key={`drop-${gift.id}`}
            src={gift.image}
            alt={gift.name}
            className="animate-drop absolute z-30 drop-shadow-[0_0_10px_rgba(255,105,180,0.8)]"
            style={{
              left: `${gift.x}px`,
              top: `${gift.y}px`,
              width: `${gift.size}px`,
              height: `${gift.size}px`,
              animationDelay: `${gift.delay}s`,
              ["--gift-rotate" as string]: `${gift.rotate}deg`,
            }}
          />
        ))}

        {pile.map((gift, index) => {
          const row = Math.floor(index / 18);
          const col = index % 18;
          const xJitter = ((index * 31) % 18) - 9;
          const yJitter = ((index * 17) % 10) - 5;

          return (
            <img
              key={`pile-${gift.id}-${index}`}
              src={gift.image}
              alt={gift.name}
              className="absolute z-20 drop-shadow-[0_0_8px_rgba(255,105,180,0.75)]"
              style={{
                left: `calc(50vw - 260px + ${col * 28 + xJitter}px)`,
                bottom: `${10 + row * 12 + yJitter}px`,
                width: `${gift.size}px`,
                height: `${gift.size}px`,
                transform: `rotate(${gift.rotate}deg)`,
              }}
            />
          );
        })}
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
            transform: translateX(-420px) translateY(0) rotate(-1deg);
            opacity: 0;
          }

          10% {
            opacity: 1;
          }

          55% {
            transform: translateX(45vw) translateY(-4px) rotate(1deg);
            opacity: 1;
          }

          100% {
            transform: translateX(115vw) translateY(0) rotate(-1deg);
            opacity: 0;
          }
        }

        @keyframes drop {
          0% {
            opacity: 0;
            transform: translateY(0) scale(0.6) rotate(0deg);
          }

          15% {
            opacity: 1;
          }

          100% {
            opacity: 1;
            transform: translateY(245px) scale(1) rotate(var(--gift-rotate));
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
          animation: vehicle 5.2s ease-in-out forwards;
        }

        .animate-drop {
          animation: drop 1.7s ease-in forwards;
        }

        .animate-message {
          animation: message 3.2s ease-in-out forwards;
        }
      `}</style>
    </main>
  );
}