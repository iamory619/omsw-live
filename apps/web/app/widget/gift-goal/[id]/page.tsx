"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useParams } from "next/navigation";
import { SERVER_URL } from "@/lib/core/server-url";

type GiftPayload = {
  user?: string;
  giftName?: string;
  amount?: number;
  diamond?: number;
  giftImage?: string;
};

type GiftGoalSettings = {
  title: string;
  gift_name: string;
  gift_emoji: string;
  gift_image: string | null;
  goal_amount: number;
  start_value: number;
  progress_color: string;
  theme: "cute-pink" | "neon" | "minimal" | "candy" | "cyber" | "glass";
  show_gift_icon: boolean;
  show_percentage: boolean;
  show_current_value: boolean;
  show_remaining: boolean;
  show_live_badge: boolean;
  enable_goal_animation: boolean;
  goal_complete_message: string;
};

const DEFAULT_SETTINGS: GiftGoalSettings = {
  title: "Gift Goal",
  gift_name: "Rose",
  gift_emoji: "🌹",
  gift_image: "/assets/rose.png",
  goal_amount: 100,
  start_value: 0,
  progress_color: "#ec4899",
  theme: "cute-pink",
  show_gift_icon: true,
  show_percentage: true,
  show_current_value: true,
  show_remaining: true,
  show_live_badge: true,
  enable_goal_animation: true,
  goal_complete_message: "🎉 Goal Complete! Thank you everyone!",
};

const THEME_CLASS: Record<GiftGoalSettings["theme"], string> = {
  "cute-pink":
    "border-pink-200/80 bg-gradient-to-br from-pink-500/90 via-fuchsia-600/90 to-rose-500/90 shadow-[0_0_55px_rgba(236,72,153,0.75)]",
  candy:
    "border-cyan-200/80 bg-gradient-to-br from-cyan-400/90 via-pink-500/90 to-yellow-400/90 shadow-[0_0_55px_rgba(34,211,238,0.65)]",
  glass:
    "border-white/35 bg-white/15 backdrop-blur-2xl shadow-[0_0_45px_rgba(255,255,255,0.25)]",
  neon:
    "border-cyan-300/80 bg-zinc-950/90 shadow-[0_0_55px_rgba(34,211,238,0.85)]",
  minimal:
    "border-zinc-300/70 bg-white/95 text-zinc-950 shadow-2xl",
  cyber:
    "border-violet-400/80 bg-gradient-to-br from-zinc-950/95 via-violet-950/95 to-cyan-950/95 shadow-[0_0_55px_rgba(139,92,246,0.75)]",
};

export default function GiftGoalWidget() {
  const params = useParams();
  const overlayId = params.id as string;

  const [settings, setSettings] =
    useState<GiftGoalSettings>(DEFAULT_SETTINGS);
  const [current, setCurrent] = useState(DEFAULT_SETTINGS.start_value);
  const [lastGifter, setLastGifter] = useState("");
  const [goalComplete, setGoalComplete] = useState(false);
  const completionShownRef = useRef(false);

  const goal = Math.max(1, Number(settings.goal_amount) || 1);
  const percent = Math.min((current / goal) * 100, 100);
  const remaining = Math.max(goal - current, 0);

  const cardTextClass = useMemo(
    () => (settings.theme === "minimal" ? "text-zinc-950" : "text-white"),
    [settings.theme],
  );

  useEffect(() => {
    if (!overlayId) return;

    let cancelled = false;

    const loadSettings = async () => {
      try {
        const response = await fetch(
          `/api/gift-goal/settings/${encodeURIComponent(overlayId)}`,
          { cache: "no-store" },
        );

        if (!response.ok) throw new Error("Unable to load settings.");

        const data = (await response.json()) as GiftGoalSettings;

        if (cancelled) return;

        setSettings({ ...DEFAULT_SETTINGS, ...data });
        setCurrent(Math.max(0, Number(data.start_value) || 0));
      } catch (error) {
        console.warn("Gift Goal settings fallback:", error);
      }
    };

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, [overlayId]);

  useEffect(() => {
    if (!overlayId) return;

    const socket = io(SERVER_URL, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    const joinOverlay = () => {
      socket.emit("join-overlay", overlayId);
    };

    const handleGoalGift = (gift: GiftPayload) => {
      const receivedGiftName = (gift.giftName || "").trim().toLowerCase();
      const selectedGiftName = settings.gift_name.trim().toLowerCase();

      if (receivedGiftName !== selectedGiftName) return;

      const amount = Math.max(1, Number(gift.amount) || 1);

      setLastGifter(gift.user || "Viewer");
      setCurrent((value) => Math.min(value + amount, goal));
    };

    const handleReset = () => {
      completionShownRef.current = false;
      setGoalComplete(false);
      setLastGifter("");
      setCurrent(Math.max(0, Number(settings.start_value) || 0));
    };

    socket.on("connect", joinOverlay);
    socket.on("goal-gift", handleGoalGift);
    socket.on("reset-goal", handleReset);

    if (socket.connected) joinOverlay();

    return () => {
      socket.off("connect", joinOverlay);
      socket.off("goal-gift", handleGoalGift);
      socket.off("reset-goal", handleReset);
      socket.disconnect();
    };
  }, [goal, overlayId, settings.gift_name, settings.start_value]);

  useEffect(() => {
    if (current < goal || completionShownRef.current) return;

    completionShownRef.current = true;
    setGoalComplete(true);

    const timer = window.setTimeout(() => {
      setGoalComplete(false);
    }, 6000);

    return () => window.clearTimeout(timer);
  }, [current, goal]);

  return (
    <main className="fixed inset-0 flex items-center justify-center overflow-hidden bg-transparent p-6">
      <div
        className={`relative w-[560px] max-w-[92vw] overflow-hidden rounded-[2rem] border-4 p-7 ${cardTextClass} ${THEME_CLASS[settings.theme]}`}
      >
        <div className="pointer-events-none absolute -right-10 -top-12 text-[130px] opacity-10">
          {settings.gift_emoji}
        </div>

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs font-black uppercase tracking-[0.22em] opacity-80">
                OMSW LIVE GOAL
              </div>
              <h1 className="mt-2 truncate text-3xl font-black">
                {settings.title}
              </h1>
            </div>

            {settings.show_live_badge && (
              <span className="shrink-0 rounded-full bg-white/20 px-3 py-1 text-xs font-black backdrop-blur">
                ● LIVE
              </span>
            )}
          </div>

          <div className="mt-6 flex items-center gap-4">
            {settings.show_gift_icon && (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-white/20 text-5xl shadow-inner backdrop-blur">
                {settings.gift_emoji}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="truncate text-xl font-black">
                {settings.gift_name}
              </div>

              {settings.show_current_value && (
                <div className="mt-1 text-3xl font-black">
                  {current.toLocaleString()} / {goal.toLocaleString()}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-full bg-black/25 p-1.5 shadow-inner">
            <div
              className="h-7 rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${percent}%`,
                backgroundColor: settings.progress_color,
                boxShadow: `0 0 18px ${settings.progress_color}`,
              }}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm font-bold">
            {settings.show_remaining && (
              <span>
                {remaining > 0
                  ? `อีก ${remaining.toLocaleString()} ชิ้นจะครบเป้า ✨`
                  : "ครบเป้าหมายแล้ว! 🎉"}
              </span>
            )}

            {settings.show_percentage && (
              <span className="rounded-full bg-black/20 px-3 py-1">
                {percent.toFixed(0)}%
              </span>
            )}
          </div>

          {lastGifter && (
            <div className="mt-4 rounded-2xl bg-black/20 px-4 py-3 text-center text-sm font-black">
              💖 Thank you, {lastGifter}!
            </div>
          )}
        </div>
      </div>

      {goalComplete && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-6 ${
            settings.enable_goal_animation ? "animate-goal-overlay" : ""
          }`}
        >
          <div className="animate-goal-card max-w-xl rounded-[2.5rem] border-4 border-yellow-200 bg-gradient-to-br from-pink-500 via-fuchsia-600 to-orange-500 px-10 py-8 text-center text-white shadow-[0_0_90px_rgba(250,204,21,0.95)]">
            <div className="text-7xl">🎉</div>
            <div className="mt-3 text-4xl font-black">GOAL COMPLETE!</div>
            <div className="mt-3 text-lg font-bold">
              {settings.goal_complete_message}
            </div>
            {lastGifter && (
              <div className="mt-4 rounded-full bg-white/20 px-5 py-2 font-black">
                Last gift from {lastGifter} 💖
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        :global(html),
        :global(body) {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: transparent !important;
        }

        @keyframes goalCard {
          0% {
            opacity: 0;
            transform: scale(0.4) rotate(-6deg);
          }
          65% {
            opacity: 1;
            transform: scale(1.08) rotate(2deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }

        @keyframes goalOverlay {
          0%,
          100% {
            backdrop-filter: brightness(1);
          }
          50% {
            backdrop-filter: brightness(1.5);
          }
        }

        .animate-goal-card {
          animation: goalCard 0.8s cubic-bezier(0.18, 0.9, 0.22, 1) both;
        }

        .animate-goal-overlay {
          animation: goalOverlay 0.8s ease-in-out 2;
        }
      `}</style>
    </main>
  );
}