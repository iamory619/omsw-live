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

type Item = {
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
  vespa: "/assets/vehicles/vespa.png",
};

const ROSE_IMAGE = "/assets/rose.png";
const PETAL_IMAGE = "/assets/petal.png";

export default function GiftVehicleWidget() {
  const params = useParams();
  const searchParams = useSearchParams();

  const overlayId = params.id as string;
  const vehicle = searchParams.get("vehicle") || "tuktuk";
  const vehicleImage = VEHICLES[vehicle] || VEHICLES.tuktuk;

  const [message, setMessage] = useState("");
  const [showVehicle, setShowVehicle] = useState(false);
  const [road, setRoad] = useState<Item[]>([]);
  const [falling, setFalling] = useState<Item[]>([]);

  const playEffect = (gift: GiftPayload) => {
    setMessage(`ขอบคุณ ${gift.user} ส่ง ${gift.giftName} x${gift.amount}`);

    const baseCount = Math.min(Math.max(gift.amount || 1, 8), 80);

    // ถนนใช้ดอกกุหลาบเต็มดอก
    const roadCount = Math.min(baseCount * 8, 700);

    // กลีบโปรยใช้รูป petal.png
    const fallCount = Math.min(baseCount * 6, 320);

    const newRoad: Item[] = Array.from({ length: roadCount }).map(
      (_, index) => ({
        id: Date.now() + index,
        image: gift.giftImage || ROSE_IMAGE,
        size: 22 + Math.random() * 18,
        x: Math.random() * 980,
        y: 350 + Math.random() * 145,
        rotate: Math.random() * 360,
        delay: Math.random() * 0.7,
        fallX: 0,
        fallY: 0,
      }),
    );

    const newFalling: Item[] = Array.from({ length: fallCount }).map(
      (_, index) => ({
        id: Date.now() + 10000 + index,
        image: PETAL_IMAGE,
        size: 18 + Math.random() * 26,
        x: Math.random() * 980,
        y: -120 - Math.random() * 220,
        rotate: Math.random() * 360,
        delay: Math.random() * 1.8,
        fallX: -120 + Math.random() * 240,
        fallY: 520 + Math.random() * 220,
      }),
    );

    setRoad((prev) => [...prev, ...newRoad].slice(-1500));
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
        <div className="absolute bottom-[0px] left-1/2 z-0 h-[250px] w-[1150px] -translate-x-1/2 rounded-full bg-pink-500/30 blur-[90px]" />
        <div className="absolute bottom-[35px] left-1/2 z-0 h-[120px] w-[1000px] -translate-x-1/2 rounded-full bg-yellow-400/20 blur-[55px]" />

        {road.map((item) => (
          <img
            key={`road-${item.id}`}
            src={item.image}
            alt="rose"
            className="animate-road-petal absolute z-20 drop-shadow-[0_0_12px_rgba(255,105,180,0.95)]"
            style={{
              left: `${item.x}px`,
              top: `${item.y}px`,
              width: `${item.size}px`,
              height: `${item.size}px`,
              transform: `rotate(${item.rotate}deg)`,
              animationDelay: `${item.delay}s`,
            }}
          />
        ))}

        {falling.map((item) => (
          <img
            key={`fall-${item.id}`}
            src={item.image}
            alt="petal"
            className="animate-falling-petal absolute z-30 drop-shadow-[0_0_18px_rgba(255,105,180,1)]"
            style={{
              left: `${item.x}px`,
              top: `${item.y}px`,
              width: `${item.size}px`,
              height: `${item.size}px`,
              animationDelay: `${item.delay}s`,
              ["--petal-x" as string]: `${item.fallX}px`,
              ["--petal-y" as string]: `${item.fallY}px`,
              ["--petal-rotate" as string]: `${item.rotate}deg`,
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
    transform: translate(0, -60px) rotate(0deg) scale(0.6);
  }

  8% {
    opacity: 1;
  }

  22% {
    transform: translate(
        calc(var(--petal-x) * -0.35),
        calc(var(--petal-y) * 0.2)
      )
      rotate(90deg)
      scale(0.85);
  }

  45% {
    transform: translate(
        calc(var(--petal-x) * 0.45),
        calc(var(--petal-y) * 0.45)
      )
      rotate(210deg)
      scale(1);
  }

  70% {
    transform: translate(
        calc(var(--petal-x) * -0.15),
        calc(var(--petal-y) * 0.72)
      )
      rotate(330deg)
      scale(0.95);
  }

  100% {
    opacity: 0.9;
    transform: translate(var(--petal-x), var(--petal-y))
      rotate(calc(var(--petal-rotate) + 520deg))
      scale(0.85);
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
  animation: fallingPetal 3.0s cubic-bezier(0.22, 0.72, 0.25, 1) forwards;
}

        .animate-message {
          animation: message 3.2s ease-in-out forwards;
        }
      `}</style>
    </main>
  );
}
