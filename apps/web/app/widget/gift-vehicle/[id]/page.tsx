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

type RoadGift = {
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
  const [road, setRoad] = useState<RoadGift[]>([]);

  const playEffect = (gift: GiftPayload) => {
    setMessage(`ขอบคุณ ${gift.user} ส่ง ${gift.giftName} x${gift.amount}`);

    const giftImage = gift.giftImage || "/assets/rose.png";
    const count = Math.min(Math.max(gift.amount || 1, 8), 80);

    const newRoad: RoadGift[] = Array.from({ length: count }).map(
      (_, index) => {
        const progress = count <= 1 ? 0 : index / (count - 1);

        return {
          id: Date.now() + index,
          image: giftImage,
          name: gift.giftName,
          size: 26 + Math.random() * 10,
          x: 40 + progress * 880,
          y: 255 + Math.sin(progress * Math.PI * 3) * 18 + Math.random() * 10,
          rotate: -35 + Math.random() * 70,
          delay: index * 0.025,
        };
      },
    );

    setRoad(newRoad);
    setShowVehicle(true);

    setTimeout(() => {
      setShowVehicle(false);
      setMessage("");
    }, 6000);
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
        <div className="absolute bottom-[35px] left-1/2 z-0 h-[90px] w-[900px] -translate-x-1/2 rounded-full bg-yellow-500/15 blur-2xl" />

        {road.map((gift) => (
          <img
            key={gift.id}
            src={gift.image}
            alt={gift.name}
            className="animate-road-gift absolute z-20 drop-shadow-[0_0_10px_rgba(255,105,180,0.85)]"
            style={{
              left: `${gift.x}px`,
              top: `${gift.y}px`,
              width: `${gift.size}px`,
              height: `${gift.size}px`,
              transform: `rotate(${gift.rotate}deg)`,
              animationDelay: `${gift.delay}s`,
            }}
          />
        ))}

        {showVehicle && (
          <div className="animate-vehicle absolute bottom-[68px] left-0 z-40">
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

        @keyframes roadGift {
          0% {
            opacity: 0;
            transform: translateY(18px) scale(0.5);
          }

          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
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
          animation: vehicle 5.8s ease-in-out forwards;
        }

        .animate-road-gift {
          animation: roadGift 0.45s ease-out forwards;
        }

        .animate-message {
          animation: message 3.2s ease-in-out forwards;
        }
      `}</style>
    </main>
  );
}