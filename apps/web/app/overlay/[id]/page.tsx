"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useParams } from "next/navigation";

export default function OverlayPage() {
  const params = useParams();
  const id = params.id as string;

  const [giftAlert, setGiftAlert] = useState("");
  const [current, setCurrent] = useState(0);

  const goal = 100;

  useEffect(() => {
    if (!id) return;

    const socket = io("https://server-production-b88b.up.railway.app");

    socket.emit("join-overlay", id);

    socket.on("gift-alert", (message: string) => {
      setGiftAlert(message);

      setTimeout(() => {
        setGiftAlert("");
      }, 3000);
    });

    socket.on("gift-progress", (amount: number) => {
      setCurrent(amount);
    });

    return () => {
      socket.disconnect();
    };
  }, [id]);

  const percent = Math.min((current / goal) * 100, 100);

  return (
    <main className="h-screen w-screen bg-transparent overflow-hidden">
      {/* Gift Alert */}
      {giftAlert && (
        <div className="absolute left-1/2 top-10 -translate-x-1/2 rounded-2xl bg-pink-500 px-8 py-5 text-2xl font-bold text-white shadow-2xl">
          {giftAlert}
        </div>
      )}

      {/* Gift Goal */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[500px] rounded-3xl bg-black/80 p-6 text-white shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">🎁 Gift Goal</h2>

          <span className="rounded-full bg-pink-600 px-3 py-1 text-sm">
            LIVE
          </span>
        </div>

        <p className="mb-3 text-lg">
          Rose 🌹 {current} / {goal}
        </p>

        <div className="h-6 overflow-hidden rounded-full bg-zinc-700">
          <div
            className="h-full rounded-full bg-pink-500 transition-all duration-500"
            style={{
              width: `${percent}%`,
            }}
          />
        </div>

        <p className="mt-2 text-right text-sm text-zinc-400">
          {percent.toFixed(0)}%
        </p>
      </div>
    </main>
  );
}
