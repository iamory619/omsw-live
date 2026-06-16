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

type Petal = {
  id: number;
  image: string;
  size: number;
  x: number;
  y: number;
  rotate: number;
  delay: number;
  fallX: number;
  fallY: number;
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
  const [road, setRoad] = useState<Petal[]>([]);
  const [falling, setFalling] = useState<Petal[]>([]);

  const playEffect = (gift: GiftPayload) => {
    setMessage(`ขอบคุณ ${gift.user} ส่ง ${gift.giftName} x${gift.amount}`);

    const petalImage = "/assets/rose-petal.png";
    const fallbackImage = gift.giftImage || "/assets/rose.png";
    const image = petalImage || fallbackImage;

    const baseCount = Math.min(Math.max(gift.amount || 1, 8), 80);
    const roadCount = Math.min(baseCount * 16, 900);
    const fallCount = Math.min(baseCount * 5, 260);

    const newRoad: Petal[] = Array.from({ length: roadCount }).map(
      (_, index) => ({
        id: Date.now() + index,
        image,
        size: 10 + Math.random() * 12,
        x: Math.random() * 980,
        y: 245 + Math.random() * 135,
        rotate: Math.random() * 360,
        delay: Math.random() * 0.8,
        fallX: 0,
        fallY: 0,
      }),
    );

    const newFalling: Petal[] = Array.from({ length: fallCount }).map(
      (_, index) => ({
        id: Date.now() + 10000 + index,
        image,
        size: 16 + Math.random() * 22,
        x: Math.random() * 980,
        y: -80 - Math.random() * 220,
        rotate: Math.random() * 360,
        delay: Math.random() * 2.8,
        fallX: -80 + Math.random() * 160,
        fallY: 360 + Math.random() * 180,
      }),
    );

    setRoad((prev) => [...prev, ...newRoad].slice(-1800));
    setFalling(newFalling);
    setShowVehicle(true);

    setTimeout(() => {
      setShowVehicle(false);
      setMessage("");
      setFalling([]);
    }, 7000);
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
      setRoad([]);
      setFalling([]);
    });

    return () => {
      socket.disconnect();
    };
  }, [overlayId, vehicle]);

  return (
    <main className="fixed inset-0 h-screen w-screen overflow-hidden bg-transparent">
      {showVehicle && (
        <div className="animate-message fixed left-1/2 top-[7vh] z-50 -translate-x-1/2 rounded-3xl border-4 border-yellow-200 bg-yellow-500/90 px-8 py-4 text-center text-2xl font-black text-white shadow-[0_0_35px_rgba(234,179,8,0.95)]">
          {message}
        </div>
      )}

      <div className="fixed bottom-[60px] left-1/2 h-[520px] w-[980px] -translate-x-1/2">
        <div className="absolute bottom-[20px] left-1/2 z-0 h-[190px] w-[1080px] -translate-x-1/2 rounded-full bg-pink-500/25 blur-[90px]" />
        <div className="absolute bottom-[40px] left-1/2 z-0 h-[90px] w-[960px] -translate-x-1/2 rounded-full bg-yellow-400/20 blur-[55px]" />

        {falling.map((petal) => (
          <img
            key={`fall-${petal.id}`}
            src={petal.image}
            alt="petal"
            className="animate-falling-petal absolute z-30 drop-shadow-[0_0_12px_rgba(255,105,180,0.9)]"
            style={{
              left: `${petal.x}px`,
              top: `${petal.y}px`,
              width: `${petal.size}px`,
              height: `${petal.size}px`,
              animationDelay: `${petal.delay}s`,
              ["--petal-x" as string]: `${petal.fallX}px`,
              ["--petal-y" as string]: `${petal.fallY}px`,
              ["--petal-rotate" as string]: `${petal.rotate}deg`,
            }}
          />
        ))}

        {road.map((petal) => (
          <img
            key={`road-${petal.id}`}
            src={petal.image}
            alt="petal"
            className="animate-road-petal absolute z-20 drop-shadow-[0_0_8px_rgba(255,105,180,0.85)]"
            style={{
              left: `${petal.x}px`,
              top: `${petal.y}px`,
              width: `${petal.size}px`,
              height: `${petal.size}px`,
              transform: `rotate(${petal.rotate}deg)`,
              animationDelay: `${petal.delay}s`,
            }}
          />
        ))}

        {showVehicle && (
          <div className="animate-vehicle absolute bottom-[100px] left-0 z-40">
            <Image
              src={vehicleImage}
              alt="Gift vehicle"
              width={540}
              height={330}
              priority
              className="w-[460px] scale-x-[-1] drop-shadow-[0_0_35px_rgba(250,204,21,0.95)]"
            />
          </div>
        )}
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
            transform: translateX(-500px) translateY(0) rotate(-1deg);
            opacity: 0;
          }

          8% {
            opacity: 1;
          }

          25% {
            transform: translateX(18vw) translateY(-5px) rotate(1deg);
          }

          50% {
            transform: translateX(42vw) translateY(5px) rotate(-0.5deg);
          }

          75% {
            transform: translateX(66vw) translateY(-4px) rotate(1deg);
            opacity: 1;
          }

          100% {
            transform: translateX(1100px) translateY(0) rotate(-1deg);
            opacity: 0;
          }
        }

        @keyframes roadPetal {
          0% {
            opacity: 0;
            transform: translateY(18px) scale(0.35);
          }

          70% {
            opacity: 1;
            transform: translateY(-2px) scale(1.08);
          }

          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes fallingPetal {
          0% {
            opacity: 0;
            transform: translate(0, 0) rotate(0deg) scale(0.55);
          }

          12% {
            opacity: 1;
          }

          100% {
            opacity: 1;
            transform: translate(var(--petal-x), var(--petal-y))
              rotate(var(--petal-rotate)) scale(1);
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
          animation: vehicle 6.5s ease-in-out forwards;
        }

        .animate-road-petal {
          animation: roadPetal 0.5s ease-out forwards;
        }

        .animate-falling-petal {
          animation: fallingPetal 4.8s cubic-bezier(0.16, 0.75, 0.28, 1)
            forwards;
        }

        .animate-message {
          animation: message 3.2s ease-in-out forwards;
        }
      `}</style>
    </main>
  );
}