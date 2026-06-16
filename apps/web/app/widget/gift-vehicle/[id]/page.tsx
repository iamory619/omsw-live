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

const PETAL_IMAGE = "/assets/rose-petal.png";

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

    const baseCount = Math.min(Math.max(gift.amount || 1, 8), 80);
    const roadCount = Math.min(baseCount * 22, 1400);
    const fallCount = Math.min(baseCount * 6, 320);

    const newRoad: Petal[] = Array.from({ length: roadCount }).map(
      (_, index) => ({
        id: Date.now() + index,
        size: 22 + Math.random() * 22,
        x: Math.random() * 980,
        y: 220 + Math.random() * 185,
        rotate: Math.random() * 360,
        delay: Math.random() * 0.8,
        fallX: 0,
        fallY: 0,
      }),
    );

    const newFalling: Petal[] = Array.from({ length: fallCount }).map(
      (_, index) => ({
        id: Date.now() + 10000 + index,
        size: 26 + Math.random() * 34,
        x: Math.random() * 980,
        y: -120 - Math.random() * 260,
        rotate: Math.random() * 360,
        delay: Math.random() * 2.8,
        fallX: -130 + Math.random() * 260,
        fallY: 430 + Math.random() * 240,
      }),
    );

    setRoad((prev) => [...prev, ...newRoad].slice(-2400));
    setFalling(newFalling);
    setShowVehicle(true);

    setTimeout(() => {
      setShowVehicle(false);
      setMessage("");
      setFalling([]);
    }, 7500);
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

      <div className="fixed bottom-[55px] left-1/2 h-[560px] w-[980px] -translate-x-1/2">
        <div className="absolute bottom-[0px] left-1/2 z-0 h-[260px] w-[1150px] -translate-x-1/2 rounded-full bg-pink-500/35 blur-[95px]" />
        <div className="absolute bottom-[35px] left-1/2 z-0 h-[130px] w-[1000px] -translate-x-1/2 rounded-full bg-yellow-400/20 blur-[55px]" />

        {road.map((petal) => (
          <img
            key={`road-${petal.id}`}
            src={PETAL_IMAGE}
            alt="petal"
            className="animate-road-petal absolute z-20 drop-shadow-[0_0_14px_rgba(255,105,180,1)]"
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

        {falling.map((petal) => (
          <img
            key={`fall-${petal.id}`}
            src={PETAL_IMAGE}
            alt="petal"
            className="animate-falling-petal absolute z-30 drop-shadow-[0_0_18px_rgba(255,105,180,1)]"
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

        {showVehicle && (
          <div className="animate-vehicle absolute bottom-[115px] left-0 z-40">
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
          animation: fallingPetal 5s cubic-bezier(0.16, 0.75, 0.28, 1)
            forwards;
        }

        .animate-message {
          animation: message 3.2s ease-in-out forwards;
        }
      `}</style>
    </main>
  );
}