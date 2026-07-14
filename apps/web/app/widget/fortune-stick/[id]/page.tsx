"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useParams } from "next/navigation";
import { fortunes } from "@/lib/fortune";
import { SERVER_URL } from "@/lib/core/server-url";


type GiftPayload = {
  user: string;
  giftName: string;
  amount: number;
  diamond: number;
  giftImage: string;
};

type Fortune = {
  id: number;
  title: string;
  text: string;
  color: string;
  user?: string;
};

export default function FortuneStickWidget() {
  const params = useParams();
  const overlayId = params.id as string;

  const [fortune, setFortune] = useState<Fortune | null>(null);
  const [showFortune, setShowFortune] = useState(false);

  const showRandomFortune = (gift: GiftPayload) => {
    if ((gift.diamond || 0) < 1) return;

    const random = fortunes[Math.floor(Math.random() * fortunes.length)];

    setFortune({
      ...random,
      user: gift.user,
    });

    setShowFortune(true);

    setTimeout(() => {
      setShowFortune(false);
    }, 12000);
  };

  useEffect(() => {
    if (!overlayId) return;

   const socket = io(SERVER_URL);

    socket.emit("join-overlay", overlayId);

    // ปุ่ม Test Fortune จาก Dashboard
    socket.on("test-fortune", (gift: GiftPayload) => {
      showRandomFortune(gift);
    });

    // ของขวัญจริงจาก TikTok สำหรับ Fortune
    socket.on("fortune-gift", (gift: GiftPayload) => {
      showRandomFortune(gift);
    });

    // Reset Fortune
    socket.on("reset-fortune", () => {
      setFortune(null);
      setShowFortune(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [overlayId]);

  return (
    <main className="fixed inset-0 h-screen w-screen overflow-hidden bg-transparent">
      {showFortune && fortune && (
        <div className="animate-fortune fixed inset-0 z-[999] flex items-center justify-center">
          <div
            className="relative w-[560px] rounded-3xl border-8 bg-gradient-to-b from-amber-50 to-white p-8 text-center text-zinc-900 shadow-[0_0_60px_rgba(250,204,21,0.8)]"
            style={{
              borderColor: fortune.color,
            }}
          >
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 rounded-full bg-red-600 px-6 py-3 text-xl font-black text-yellow-200 shadow-2xl">
              🎋 เซียมซีมาแล้ว
            </div>

            <div className="mb-4 mt-4 text-xl font-black text-red-700">
              ใบเซียมซีเลข {fortune.id}
            </div>

            <div className="mb-5 text-4xl font-black text-zinc-950">
              {fortune.title}
            </div>

            <div className="mx-auto mb-6 h-1 w-32 rounded-full bg-yellow-400" />

            <div className="text-xl leading-relaxed text-zinc-700">
              {fortune.text}
            </div>

            <div className="mt-8 rounded-2xl bg-yellow-100 px-5 py-3 text-lg font-bold text-yellow-700">
              คุณ {fortune.user}
            </div>

            <div className="pointer-events-none absolute -left-8 top-8 text-5xl">
              🏮
            </div>

            <div className="pointer-events-none absolute -right-8 bottom-8 text-5xl">
              ✨
            </div>
          </div>
        </div>
      )}

      <style>{`
        html,
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: transparent !important;
        }

        @keyframes fortune {
          0% {
            opacity: 0;
            transform: scale(0.35) rotate(-10deg) translateY(80px);
          }

          18% {
            opacity: 1;
            transform: scale(1.08) rotate(3deg) translateY(0);
          }

          35% {
            transform: scale(0.98) rotate(-1deg);
          }

          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }

        .animate-fortune {
          animation: fortune 0.9s ease-out forwards;
        }
      `}</style>
    </main>
  );
}
