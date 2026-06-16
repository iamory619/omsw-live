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

    /*
      ถ้ามีรูปกลีบกุหลาบ แนะนำวางไว้ที่:
      /public/assets/rose-petal.png
      แล้วเปลี่ยนบรรทัดนี้เป็น:
      const giftImage = "/assets/rose-petal.png";
    */
    const giftImage = gift.giftImage || "/assets/rose.png";

    const baseCount = Math.min(Math.max(gift.amount || 1, 8), 80);
    const roadCount = Math.min(baseCount * 12, 600);

   const roadWidth = 900;
const roadHeight = 130;

const newRoad: RoadGift[] = Array.from(
  { length: roadCount },
  (_, index) => ({
    id: Date.now() + index,

    image: giftImage,
    name: gift.giftName,

    size: 10 + Math.random() * 8,

    x: 40 + Math.random() * roadWidth,

    y: 250 + Math.random() * roadHeight,

    rotate: Math.random() * 360,

    delay: index * 0.002,
  })
);

    setRoad((prev) => [...prev, ...newRoad].slice(-2500));
    setShowVehicle(true);

    setTimeout(() => {
      setShowVehicle(false);
      setMessage("");
    }, 6500);
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
       <div
  className="
    absolute
    bottom-[15px]
    left-1/2
    h-[180px]
    w-[980px]
    -translate-x-1/2
    rounded-full
    bg-pink-500/15
    blur-[90px]
    z-0
  "
/>        <div className="absolute bottom-[26px] left-1/2 z-0 h-[90px] w-[920px] -translate-x-1/2 rounded-full bg-yellow-400/15 blur-[45px]" />

        {road.map((gift) => (
          <img
            key={gift.id}
            src={gift.image}
            alt={gift.name}
            className="animate-road-gift absolute z-20 drop-shadow-[0_0_8px_rgba(255,105,180,0.8)]"
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
          <div className="animate-vehicle absolute bottom-[72px] left-0 z-40">
            <Image
              src={vehicleImage}
              alt="Gift vehicle"
              width={520}
              height={320}
              priority
              className="w-[440px] scale-x-[-1] drop-shadow-[0_0_30px_rgba(250,204,21,0.9)]"
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
            transform: translateX(-470px) translateY(0) rotate(-1deg);
            opacity: 0;
          }

          8% {
            opacity: 1;
          }

          25% {
            transform: translateX(18vw) translateY(-5px) rotate(1deg);
          }

          50% {
            transform: translateX(42vw) translateY(4px) rotate(-0.5deg);
          }

          75% {
            transform: translateX(66vw) translateY(-4px) rotate(1deg);
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
          animation: vehicle 6.2s ease-in-out forwards;
        }

        .animate-road-gift {
          animation: roadGift 0.5s ease-out forwards;
        }

        .animate-message {
          animation: message 3.2s ease-in-out forwards;
        }
      `}</style>
    </main>
  );
}