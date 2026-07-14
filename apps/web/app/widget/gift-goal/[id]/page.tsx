"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useParams } from "next/navigation";
import { SERVER_URL } from "@/lib/core/server-url";

export default function GiftGoalWidget() {
  const params = useParams();
  const overlayId = params.id as string;

  const [current, setCurrent] = useState(0);
  const [giftAlert, setGiftAlert] = useState("");

  const goal = 100;

  useEffect(() => {
    if (!overlayId) return;

    const socket = io(SERVER_URL);

    socket.emit("join-overlay", overlayId);

    socket.on("gift-progress", (amount: number) => {
      setCurrent(amount);
    });

    socket.on("gift-alert", (message: string) => {
      setGiftAlert(message);

      setTimeout(() => {
        setGiftAlert("");
      }, 3000);
    });

    return () => {
      socket.disconnect();
    };
  }, [overlayId]);

  const percent = Math.min((current / goal) * 100, 100);

  return (
    <main className="h-screen w-screen flex items-center justify-center bg-transparent">
      {/* Gift Alert */}
      {giftAlert && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 rounded-2xl bg-pink-600 px-6 py-4 text-xl font-bold text-white shadow-2xl">
          {giftAlert}
        </div>
      )}

      <div className="w-[500px] rounded-3xl bg-black/80 p-8 text-white shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold">🎁 Gift Goal</h1>

          <span className="rounded-full bg-pink-600 px-3 py-1 text-sm">
            LIVE
          </span>
        </div>

        <p className="mb-4 text-xl">
          Rose 🌹 {current} / {goal}
        </p>

        <div className="h-7 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-pink-500 transition-all duration-500"
            style={{
              width: `${percent}%`,
            }}
          />
        </div>

        <p className="mt-4 text-right text-sm text-zinc-400">
          {percent.toFixed(0)}%
        </p>
      </div>
    </main>
  );
}
