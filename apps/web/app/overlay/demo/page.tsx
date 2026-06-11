"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function OverlayPage() {
  const [gift, setGift] = useState("");

  useEffect(() => {
    const socket = io("http://localhost:4000");

    socket.on("gift-alert", (message: string) => {
      setGift(message);

      setTimeout(() => {
        setGift("");
      }, 3000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <main className="h-screen w-screen bg-transparent">
      {gift && (
        <div className="absolute left-1/2 top-10 -translate-x-1/2 rounded-2xl bg-pink-500 px-8 py-5 text-2xl font-bold text-white shadow-2xl">
          🎁 {gift}
        </div>
      )}
    </main>
  );
}