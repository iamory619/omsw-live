"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  useWidgetSettings,
  useWidgetSocket,
  WIDGET_EVENTS,
} from "@omsw/widget-core";
import { SERVER_URL } from "@/lib/core/server-url";

type GiftPayload = {
  user?: string;
  uniqueId?: string;
  giftName?: string;
  amount?: number;
  repeatCount?: number;
  diamond?: number;
  giftImage?: string;
  giftPictureUrl?: string;
};

type LanternTheme = "phoenix" | "rat" | "cat" | "rabbit";
type PetalEffect = "sakura" | "hearts" | "stars" | "sparkles" | "none";

type MagicLanternSettings = {
  lantern: LanternTheme;
  gift_name: string;
  gift_emoji: string;
  gift_image: string | null;
  target_amount: number;
  start_value: number;
  glow_color: string;
  petal_effect: PetalEffect;
  full_message: string;
  show_progress: boolean;
  show_gift_name: boolean;
  show_last_gifter: boolean;
  enable_fill_animation: boolean;
  enable_complete_animation: boolean;
  enable_sound: boolean;
};

type FloatingGift = {
  id: string;
  image: string;
  emoji: string;
  name: string;
  user: string;
  slotIndex: number;
  size: number;
  rotation: number;
  duration: number;
  delay: number;
};

type ThankYouMessage = {
  id: string;
  user: string;
  giftName: string;
};

const DEFAULT_SETTINGS: MagicLanternSettings = {
  lantern: "phoenix",
  gift_name: "All Gifts",
  gift_emoji: "🎁",
  gift_image: "/assets/rose.png",
  target_amount: 12,
  start_value: 0,
  glow_color: "#a855f7",
  petal_effect: "sparkles",
  full_message: "Thank you for the gift!",
  show_progress: false,
  show_gift_name: true,
  show_last_gifter: true,
  enable_fill_animation: true,
  enable_complete_animation: false,
  enable_sound: false,
};

const PARTICLES: Record<PetalEffect, string[]> = {
  sakura: ["🌸", "🌸", "🌺", "🌸"],
  hearts: ["💖", "💗", "💕", "💖"],
  stars: ["⭐", "🌟", "⭐", "🌟"],
  sparkles: ["✨", "💫", "✨", "💫"],
  none: [],
};

/*
  ตำแหน่งคงที่ภายในกระจก
  ช่วยให้ของขวัญกระจายสวยและไม่กองทับกันมากเกินไป
*/
const GIFT_SLOTS = [
  { x: 23, y: 24, dx: 8, dy: -7 },
  { x: 50, y: 20, dx: -7, dy: 8 },
  { x: 76, y: 26, dx: 6, dy: 7 },
  { x: 34, y: 43, dx: -8, dy: -5 },
  { x: 66, y: 45, dx: 7, dy: -6 },
  { x: 20, y: 63, dx: 6, dy: 7 },
  { x: 48, y: 61, dx: -7, dy: 6 },
  { x: 78, y: 65, dx: -6, dy: -7 },
  { x: 34, y: 79, dx: 7, dy: -5 },
  { x: 66, y: 80, dx: -7, dy: -5 },
  { x: 14, y: 42, dx: 5, dy: 6 },
  { x: 86, y: 44, dx: -5, dy: 6 },
];

function normalizeSettings(data: unknown): MagicLanternSettings {
  const raw =
    data && typeof data === "object"
      ? (data as Partial<MagicLanternSettings>)
      : {};

  const lantern: LanternTheme =
    raw.lantern === "rat" || raw.lantern === "cat" || raw.lantern === "rabbit"
      ? raw.lantern
      : "phoenix";

  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    lantern,
    target_amount: Math.min(16, Math.max(5, Number(raw.target_amount) || 12)),
    show_progress: false,
    enable_complete_animation: false,
  };
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createFloatingGift(
  payload: GiftPayload,
  settings: MagicLanternSettings,
  slotIndex: number,
): FloatingGift {
  const image =
    payload.giftImage?.trim() ||
    payload.giftPictureUrl?.trim() ||
    settings.gift_image?.trim() ||
    "";

  return {
    id: `${Date.now()}-${slotIndex}-${crypto.randomUUID()}`,
    image,
    emoji: settings.gift_emoji || "🎁",
    name: payload.giftName?.trim() || "Gift",
    user: payload.user?.trim() || payload.uniqueId?.trim() || "Viewer",
    slotIndex,
    size: randomBetween(30, 40),
    rotation: randomBetween(-8, 8),
    duration: randomBetween(6, 9),
    delay: randomBetween(-2.4, 0),
  };
}

export default function MagicLanternWidget() {
  const params = useParams();
  const overlayId = String(params.id || "");

  const { settings } = useWidgetSettings<MagicLanternSettings>({
    endpoint: overlayId
      ? `/api/magic-lantern/settings/${encodeURIComponent(overlayId)}`
      : "",
    fallback: DEFAULT_SETTINGS,
    enabled: Boolean(overlayId),
    transform: normalizeSettings,
  });

  const { socket } = useWidgetSocket({
    serverUrl: SERVER_URL,
    overlayId,
  });

  const [gifts, setGifts] = useState<FloatingGift[]>([]);
  const [thankYou, setThankYou] = useState<ThankYouMessage | null>(null);
  const thankYouTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextSlotRef = useRef(0);

  const maxItems = Math.min(
    16,
    Math.max(5, Number(settings.target_amount) || 12),
  );

  const lanternBack = `/assets/lantern/${settings.lantern}-back.png`;
  const lanternFront = `/assets/lantern/${settings.lantern}-front.gif`;
  const particles = PARTICLES[settings.petal_effect] || [];

  useEffect(() => {
    setGifts((current) => current.slice(-maxItems));
  }, [maxItems]);

  useEffect(() => {
    return () => {
      if (thankYouTimer.current) {
        clearTimeout(thankYouTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const showThankYou = (payload: GiftPayload) => {
      if (!settings.show_last_gifter) return;

      setThankYou({
        id: crypto.randomUUID(),
        user: payload.user?.trim() || payload.uniqueId?.trim() || "Viewer",
        giftName: payload.giftName?.trim() || "Gift",
      });

      if (thankYouTimer.current) {
        clearTimeout(thankYouTimer.current);
      }

      thankYouTimer.current = setTimeout(() => {
        setThankYou(null);
      }, 2600);
    };

    const addGift = (payload: GiftPayload) => {
      const gift = payload || {};
      const amount = Math.min(
        4,
        Math.max(1, Number(gift.repeatCount ?? gift.amount ?? 1) || 1),
      );

      const incoming = Array.from({ length: amount }, () => {
        const slotIndex = nextSlotRef.current % GIFT_SLOTS.length;
        nextSlotRef.current += 1;
        return createFloatingGift(gift, settings, slotIndex);
      });

      setGifts((current) => [...current, ...incoming].slice(-maxItems));
      showThankYou(gift);
    };

    const reset = () => {
      setGifts([]);
      setThankYou(null);
      nextSlotRef.current = 0;

      if (thankYouTimer.current) {
        clearTimeout(thankYouTimer.current);
      }
    };

    socket.on(WIDGET_EVENTS.TEST_LANTERN, addGift);
    socket.on(WIDGET_EVENTS.LANTERN_GIFT, addGift);
    socket.on(WIDGET_EVENTS.RESET_LANTERN, reset);

    return () => {
      socket.off(WIDGET_EVENTS.TEST_LANTERN, addGift);
      socket.off(WIDGET_EVENTS.LANTERN_GIFT, addGift);
      socket.off(WIDGET_EVENTS.RESET_LANTERN, reset);
    };
  }, [maxItems, settings, socket]);

  return (
    <main className="fixed inset-0 overflow-hidden bg-transparent">
      <style jsx global>{`
        @keyframes omswLanternIdle {
          0%,
          100% {
            transform: translate(-50%, -50%) translateY(0) scale(1);
          }
          50% {
            transform: translate(-50%, -50%) translateY(-9px) scale(1.008);
          }
        }

        @keyframes omswJarPulse {
          0%,
          100% {
            opacity: 0.52;
            transform: scale(0.96);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.04);
          }
        }

        @keyframes omswGiftSummon {
          0% {
            opacity: 0;
            transform:
              translate(-50%, 92px)
              scale(0.05)
              rotate(-12deg);
            filter: blur(10px) brightness(1.8);
          }

          55% {
            opacity: 1;
            transform:
              translate(-50%, -58%)
              scale(1.18)
              rotate(4deg);
            filter: blur(0) brightness(1.7);
          }

          78% {
            opacity: 1;
            transform:
              translate(-50%, -50%)
              scale(0.94)
              rotate(-1deg);
            filter: blur(0) brightness(1.25);
          }

          100% {
            opacity: 1;
            transform:
              translate(-50%, -50%)
              scale(1)
              rotate(0deg);
            filter: blur(0) brightness(1);
          }
        }

        @keyframes omswGiftSpirit {
          0% {
            transform: translate3d(0, 4px, 0) rotate(var(--gift-rotation))
              scale(0.94);
          }

          35% {
            transform: translate3d(
                calc(var(--gift-drift-x) * 0.65),
                calc(var(--gift-drift-y) * -0.8),
                0
              )
              rotate(calc(var(--gift-rotation) + 4deg)) scale(1.04);
          }

          70% {
            transform: translate3d(
                calc(var(--gift-drift-x) * -0.55),
                calc(var(--gift-drift-y) * 0.5),
                0
              )
              rotate(calc(var(--gift-rotation) - 3deg)) scale(0.98);
          }

          100% {
            transform: translate3d(
                calc(var(--gift-drift-x) * 0.25),
                calc(var(--gift-drift-y) * -0.35),
                0
              )
              rotate(calc(var(--gift-rotation) + 2deg)) scale(0.96);
          }
        }

        @keyframes omswMagicBreath {
          0%,
          100% {
            opacity: 0.45;
            filter: blur(7px);
            transform: scale(0.96);
          }

          50% {
            opacity: 0.9;
            filter: blur(11px);
            transform: scale(1.05);
          }
        }

        @keyframes omswParticleFloat {
          0%,
          100% {
            opacity: 0.12;
            transform: translateY(5px) scale(0.82);
          }
          50% {
            opacity: 0.62;
            transform: translateY(-9px) scale(1);
          }
        }

        @keyframes omswThankYou {
          0% {
            opacity: 0;
            transform: translate(-50%, 12px) scale(0.88);
          }
          18%,
          76% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -12px) scale(0.96);
          }
        }
      `}</style>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 62%, ${settings.glow_color}3d 0%, ${settings.glow_color}16 27%, transparent 62%)`,
        }}
      />

      <div
        className="pointer-events-none absolute left-1/2 top-[58%] aspect-[4/5]"
        style={{
          width: "clamp(800px, 115vmin, 1500px)",
          animation: "omswLanternIdle 5.8s ease-in-out infinite",
        }}
      >
        <div
          className="absolute left-[63.5%] top-[45%] h-[36%] w-[22%] -translate-x-1/2 -translate-y-1/2 rounded-[28%]"
          style={{
            background: `radial-gradient(circle, ${settings.glow_color}55 0%, ${settings.glow_color}20 48%, transparent 76%)`,
            filter: "blur(12px)",
            animation: "omswJarPulse 3.8s ease-in-out infinite",
          }}
        />

        <img
          src={lanternBack}
          alt=""
          className="absolute inset-0 h-full w-full object-contain"
        />

        <div
          className="absolute left-[53.3%] top-[27.5%] h-[35.5%] w-[20.5%] overflow-hidden rounded-[22%]"
          style={{ clipPath: "inset(0 round 22%)" }}
        >
          <div
            className="absolute inset-0 origin-center"
            style={{
              background: `radial-gradient(circle at 50% 52%, ${settings.glow_color}48, transparent 74%)`,
              animation: "omswMagicBreath 3.6s ease-in-out infinite",
            }}
          />

          {particles.map((particle, index) => (
            <span
              key={`${particle}-${index}`}
              className="absolute select-none"
              style={{
                left: `${18 + ((index * 22) % 58)}%`,
                top: `${17 + ((index * 25) % 62)}%`,
                fontSize: "clamp(9px, 1vmin, 15px)",
                animation: `omswParticleFloat ${4.5 + index * 0.45}s ease-in-out ${index * 0.3}s infinite`,
                filter: `drop-shadow(0 0 5px ${settings.glow_color})`,
              }}
            >
              {particle}
            </span>
          ))}

          {gifts.map((gift) => {
            const slot = GIFT_SLOTS[gift.slotIndex];

            return (
              <div
                key={gift.id}
                className="absolute"
                style={
                  {
                    left: `${slot.x}%`,
                    top: `${slot.y}%`,
                    width: `clamp(24px, ${gift.size / 13}vmin, ${gift.size}px)`,
                    height: `clamp(24px, ${gift.size / 13}vmin, ${gift.size}px)`,
                    animation:
                      "omswGiftSummon 760ms cubic-bezier(.14,.85,.24,1) both",
                    "--gift-drift-x": `${slot.dx}px`,
                    "--gift-drift-y": `${slot.dy}px`,
                    "--gift-rotation": `${gift.rotation}deg`,
                  } as React.CSSProperties
                }
              >
                <div
                  className="h-full w-full"
                  style={{
                    animation: `omswGiftSpirit ${gift.duration}s ease-in-out ${gift.delay}s infinite alternate`,
                    filter: `
                      drop-shadow(0 0 5px ${settings.glow_color})
                      drop-shadow(0 0 11px ${settings.glow_color}99)
                    `,
                  }}
                >
                  {gift.image ? (
                    <>
                      <img
                        src={gift.image}
                        alt={gift.name}
                        className="h-full w-full object-contain"
                        referrerPolicy="no-referrer"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                          const fallback = event.currentTarget
                            .nextElementSibling as HTMLElement | null;
                          if (fallback) fallback.style.display = "grid";
                        }}
                      />
                      <span className="hidden h-full w-full place-items-center text-2xl">
                        {gift.emoji}
                      </span>
                    </>
                  ) : (
                    <span className="grid h-full w-full place-items-center text-2xl">
                      {gift.emoji}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <img
          src={lanternFront}
          alt=""
          className="absolute inset-0 z-50 h-full w-full object-contain"
        />
      </div>

      {thankYou && (
        <div
          key={thankYou.id}
          className="pointer-events-none absolute left-1/2 top-[7%] z-[100] whitespace-nowrap rounded-full border bg-black/58 px-5 py-2.5 text-center text-white backdrop-blur-md"
          style={{
            borderColor: `${settings.glow_color}75`,
            boxShadow: `0 0 18px ${settings.glow_color}45`,
            animation: "omswThankYou 2.6s ease-in-out both",
          }}
        >
          <span className="text-sm font-black">
            ✨ {thankYou.user} sent {thankYou.giftName}
          </span>
        </div>
      )}
    </main>
  );
}