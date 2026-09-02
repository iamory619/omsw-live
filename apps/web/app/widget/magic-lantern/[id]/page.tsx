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

type PetalEffect =
  | "sakura"
  | "hearts"
  | "stars"
  | "sparkles"
  | "none";

type MagicLanternSettings = {
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
  coins: number;
  isSpecial: boolean;
};

const ACTIVE_LANTERN =
  "/assets/lantern/magic-lantern-active.png";

/*
  Gift มูลค่า 5,000 coins ขึ้นไป
  จะเปิด Legendary effect ด้วยโค้ด
  โดยยังใช้รูปโคม ACTIVE รูปเดิม
*/
const SPECIAL_GIFT_THRESHOLD = 5000;

/*
  ระยะเวลาที่ Special Lantern แสดง
  หลังได้รับของขวัญ 5,000+ coins
*/
const SPECIAL_DURATION = 9000;

const DEFAULT_SETTINGS: MagicLanternSettings = {
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
  ตำแหน่ง Gift ภายในกระจก

  ถ้าภาพโคมใหม่มีช่องกระจกต่างจากนี้
  เราค่อยปรับ x/y ทีหลังได้
*/
const GIFT_SLOTS = [
  { x: 24, y: 20, dx: 5, dy: -4 },
  { x: 40, y: 17, dx: -4, dy: 5 },
  { x: 58, y: 18, dx: 4, dy: 4 },
  { x: 76, y: 22, dx: -5, dy: 4 },

  { x: 18, y: 36, dx: 4, dy: -4 },
  { x: 34, y: 34, dx: -5, dy: 4 },
  { x: 50, y: 32, dx: 5, dy: -4 },
  { x: 66, y: 35, dx: -4, dy: 4 },
  { x: 82, y: 38, dx: -4, dy: -4 },

  { x: 22, y: 53, dx: 4, dy: 4 },
  { x: 38, y: 51, dx: -4, dy: -4 },
  { x: 54, y: 50, dx: 4, dy: 4 },
  { x: 70, y: 53, dx: -4, dy: -4 },

  { x: 18, y: 69, dx: 4, dy: -4 },
  { x: 34, y: 67, dx: -4, dy: 4 },
  { x: 50, y: 66, dx: 4, dy: -4 },
  { x: 66, y: 68, dx: -4, dy: 4 },
  { x: 82, y: 70, dx: -4, dy: -4 },

  { x: 40, y: 82, dx: 4, dy: -3 },
  { x: 60, y: 81, dx: -4, dy: -3 },
];

function normalizeSettings(
  data: unknown,
): MagicLanternSettings {
  const raw =
    data && typeof data === "object"
      ? (data as Partial<MagicLanternSettings>)
      : {};

  return {
    ...DEFAULT_SETTINGS,
    ...raw,

    /*
      ยังใช้ target_amount เป็นจำนวน Gift
      สูงสุดที่โชว์ในโคม
    */
    target_amount: Math.min(
      20,
      Math.max(
        5,
        Number(raw.target_amount) || 12,
      ),
    ),

    show_progress: false,
    enable_complete_animation: false,
  };
}

function randomBetween(
  min: number,
  max: number,
) {
  return min + Math.random() * (max - min);
}

/*
  คำนวณมูลค่า Gift

  diamond = มูลค่าต่อ Gift
  repeatCount = จำนวนครั้งใน combo
*/
function getGiftCoins(
  payload: GiftPayload,
) {
  const diamond = Math.max(
    0,
    Number(payload.diamond) || 0,
  );

  const repeatCount = Math.max(
    1,
    Number(
      payload.repeatCount ??
        payload.amount ??
        1,
    ) || 1,
  );

  return diamond * repeatCount;
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
    emoji:
      settings.gift_emoji || "🎁",
    name:
      payload.giftName?.trim() ||
      "Gift",
    user:
      payload.user?.trim() ||
      payload.uniqueId?.trim() ||
      "Viewer",
    slotIndex,

    /*
      Gift ใหญ่พอให้เห็นชัด
      แต่ไม่กินพื้นที่ในโคมเกินไป
    */
    size: randomBetween(30, 39),

    rotation: randomBetween(-8, 8),
    duration: randomBetween(6, 8.5),
    delay: randomBetween(-1.6, 0),
  };
}

export default function MagicLanternWidget() {
  const params = useParams();
  const overlayId = String(
    params.id || "",
  );

  const { settings } =
    useWidgetSettings<MagicLanternSettings>({
      endpoint: overlayId
        ? `/api/magic-lantern/settings/${encodeURIComponent(
            overlayId,
          )}`
        : "",
      fallback: DEFAULT_SETTINGS,
      enabled: Boolean(overlayId),
      transform: normalizeSettings,
    });

  const { socket } = useWidgetSocket({
    serverUrl: SERVER_URL,
    overlayId,
  });

  const [gifts, setGifts] = useState<
    FloatingGift[]
  >([]);

  const [thankYou, setThankYou] =
    useState<ThankYouMessage | null>(
      null,
    );

  /*
    true = เปิด Legendary effect
    false = โหมดปกติ

    ใช้รูปโคม ACTIVE รูปเดียวตลอด
  */
  const [isSpecial, setIsSpecial] =
    useState(false);

  /*
    ใช้ key เพื่อ trigger animation
    ใหม่ทุกครั้งที่ Gift เข้า
  */
  const [giftPulseKey, setGiftPulseKey] =
    useState(0);

  const thankYouTimer =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  const specialTimer =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  const nextSlotRef = useRef(0);

  const maxItems = Math.min(
    20,
    Math.max(
      5,
      Number(settings.target_amount) ||
        12,
    ),
  );

  const particles =
    PARTICLES[
      settings.petal_effect
    ] || [];

  const lanternImage = ACTIVE_LANTERN;

  useEffect(() => {
    setGifts((current) =>
      current.slice(-maxItems),
    );
  }, [maxItems]);

  useEffect(() => {
    return () => {
      if (thankYouTimer.current) {
        clearTimeout(
          thankYouTimer.current,
        );
      }

      if (specialTimer.current) {
        clearTimeout(
          specialTimer.current,
        );
      }
    };
  }, []);

  useEffect(() => {
    const showThankYou = (
      payload: GiftPayload,
      coins: number,
      special: boolean,
    ) => {
      if (
        !settings.show_last_gifter
      ) {
        return;
      }

      setThankYou({
        id: crypto.randomUUID(),
        user:
          payload.user?.trim() ||
          payload.uniqueId?.trim() ||
          "Viewer",
        giftName:
          payload.giftName?.trim() ||
          "Gift",
        coins,
        isSpecial: special,
      });

      if (
        thankYouTimer.current
      ) {
        clearTimeout(
          thankYouTimer.current,
        );
      }

      thankYouTimer.current =
        setTimeout(() => {
          setThankYou(null);
        }, special ? 5000 : 2800);
    };

    const triggerSpecial = () => {
      setIsSpecial(true);

      if (
        specialTimer.current
      ) {
        clearTimeout(
          specialTimer.current,
        );
      }

      specialTimer.current =
        setTimeout(() => {
          setIsSpecial(false);
        }, SPECIAL_DURATION);
    };

    const addGift = (
      payload: GiftPayload,
    ) => {
      const gift = payload || {};

      /*
        มูลค่ารวม Gift
      */
      const coins =
        getGiftCoins(gift);

      const special =
        coins >=
        SPECIAL_GIFT_THRESHOLD;

      /*
        จำนวน Gift ที่เติมเข้าโคม
        จำกัดครั้งละไม่เกิน 4
        เพื่อไม่ให้จอระเบิดเวลา combo มาเยอะ
      */
      const amount = Math.min(
        4,
        Math.max(
          1,
          Number(
            gift.repeatCount ??
              gift.amount ??
              1,
          ) || 1,
        ),
      );

      const incoming =
        Array.from(
          { length: amount },
          () => {
            const slotIndex =
              nextSlotRef.current %
              GIFT_SLOTS.length;

            nextSlotRef.current += 1;

            return createFloatingGift(
              gift,
              settings,
              slotIndex,
            );
          },
        );

      /*
        ของเก่าที่สุดหาย
        ของใหม่เข้ามาแทน
      */
      setGifts((current) =>
        [
          ...current,
          ...incoming,
        ].slice(-maxItems),
      );

      /*
        ทำให้โคม pulse ทุกครั้ง
        ที่ Gift เข้า
      */
      setGiftPulseKey(
        (current) => current + 1,
      );

      /*
        Gift >= 5,000
        เปิด Legendary effect ด้วยโค้ด
        โดยไม่เปลี่ยนรูปโคม
      */
      if (special) {
        triggerSpecial();
      }

      showThankYou(
        gift,
        coins,
        special,
      );
    };

    const reset = () => {
      setGifts([]);
      setThankYou(null);
      setIsSpecial(false);
      nextSlotRef.current = 0;

      if (
        thankYouTimer.current
      ) {
        clearTimeout(
          thankYouTimer.current,
        );
      }

      if (
        specialTimer.current
      ) {
        clearTimeout(
          specialTimer.current,
        );
      }
    };

    socket.on(
      WIDGET_EVENTS.TEST_LANTERN,
      addGift,
    );

    socket.on(
      WIDGET_EVENTS.LANTERN_GIFT,
      addGift,
    );

    socket.on(
      WIDGET_EVENTS.RESET_LANTERN,
      reset,
    );

    return () => {
      socket.off(
        WIDGET_EVENTS.TEST_LANTERN,
        addGift,
      );

      socket.off(
        WIDGET_EVENTS.LANTERN_GIFT,
        addGift,
      );

      socket.off(
        WIDGET_EVENTS.RESET_LANTERN,
        reset,
      );
    };
  }, [
    maxItems,
    settings,
    socket,
  ]);

  return (
    <main className="fixed inset-0 overflow-hidden bg-transparent">
      <style jsx global>{`
        @keyframes omswLanternIdle {
          0%,
          100% {
            transform:
              translateY(0)
              scale(1);
          }

          50% {
            transform:
              translateY(-7px)
              scale(1.006);
          }
        }

        /*
          Gift เข้า:
          โคมเด้ง + flash เล็กน้อย
        */
        @keyframes omswLanternGiftPulse {
          0% {
            transform: scale(1);
            filter:
              brightness(1)
              saturate(1);
          }

          35% {
            transform: scale(1.035);
            filter:
              brightness(1.3)
              saturate(1.25);
          }

          70% {
            transform: scale(0.99);
            filter:
              brightness(1.08)
              saturate(1.12);
          }

          100% {
            transform: scale(1);
            filter:
              brightness(1)
              saturate(1);
          }
        }

        /*
          Legendary 5,000+
        */
        @keyframes omswLegendaryPulse {
          0%,
          100% {
            filter:
              brightness(1.02)
              saturate(1.06)
              drop-shadow(
                0 0 14px rgba(
                  168,
                  85,
                  247,
                  0.28
                )
              );
          }

          50% {
            filter:
              brightness(1.12)
              saturate(1.14)
              drop-shadow(
                0 0 24px rgba(
                  168,
                  85,
                  247,
                  0.52
                )
              )
              drop-shadow(
                0 0 30px rgba(
                  250,
                  204,
                  21,
                  0.18
                )
              );
          }
        }

        @keyframes omswLegendaryAura {
          0%,
          100% {
            opacity: 0.18;
            transform:
              translate(-50%, -50%)
              scale(0.96);
          }

          50% {
            opacity: 0.42;
            transform:
              translate(-50%, -50%)
              scale(1.03);
          }
        }

        @keyframes omswGiftSummon {
          0% {
            opacity: 0;

            transform:
              translate(
                -50%,
                80px
              )
              scale(0.08)
              rotate(-12deg);

            filter:
              blur(9px)
              brightness(1.7);
          }

          55% {
            opacity: 1;

            transform:
              translate(
                -50%,
                -58%
              )
              scale(1.2)
              rotate(5deg);

            filter:
              blur(0)
              brightness(1.6);
          }

          78% {
            transform:
              translate(
                -50%,
                -50%
              )
              scale(0.94)
              rotate(-2deg);
          }

          100% {
            opacity: 1;

            transform:
              translate(
                -50%,
                -50%
              )
              scale(1)
              rotate(0deg);

            filter:
              blur(0)
              brightness(1);
          }
        }

        @keyframes omswGiftSpirit {
          0% {
            transform:
              translate3d(
                0,
                4px,
                0
              )
              rotate(
                var(
                  --gift-rotation
                )
              )
              scale(0.95);
          }

          35% {
            transform:
              translate3d(
                calc(
                  var(
                      --gift-drift-x
                    ) *
                    0.65
                ),
                calc(
                  var(
                      --gift-drift-y
                    ) *
                    -0.8
                ),
                0
              )
              rotate(
                calc(
                  var(
                      --gift-rotation
                    ) +
                    4deg
                )
              )
              scale(1.05);
          }

          70% {
            transform:
              translate3d(
                calc(
                  var(
                      --gift-drift-x
                    ) *
                    -0.55
                ),
                calc(
                  var(
                      --gift-drift-y
                    ) *
                    0.5
                ),
                0
              )
              rotate(
                calc(
                  var(
                      --gift-rotation
                    ) -
                    3deg
                )
              )
              scale(0.98);
          }

          100% {
            transform:
              translate3d(
                calc(
                  var(
                      --gift-drift-x
                    ) *
                    0.25
                ),
                calc(
                  var(
                      --gift-drift-y
                    ) *
                    -0.35
                ),
                0
              )
              rotate(
                calc(
                  var(
                      --gift-rotation
                    ) +
                    2deg
                )
              )
              scale(0.96);
          }
        }

        @keyframes omswMagicBreath {
          0%,
          100% {
            opacity: 0.16;
            transform: scale(0.96);
          }

          50% {
            opacity: 0.42;
            transform: scale(1.04);
          }
        }

        @keyframes omswParticleFloat {
          0%,
          100% {
            opacity: 0.18;
            transform:
              translateY(6px)
              scale(0.8);
          }

          50% {
            opacity: 0.75;
            transform:
              translateY(-10px)
              scale(1.05);
          }
        }

        @keyframes omswThankYou {
          0% {
            opacity: 0;
            transform:
              translate(
                -50%,
                15px
              )
              scale(0.88);
          }

          18%,
          76% {
            opacity: 1;
            transform:
              translate(
                -50%,
                0
              )
              scale(1);
          }

          100% {
            opacity: 0;
            transform:
              translate(
                -50%,
                -15px
              )
              scale(0.96);
          }
        }

        @keyframes omswSpecialText {
          0% {
            opacity: 0;
            transform:
              translateX(-50%)
              scale(0.7);
          }

          18% {
            opacity: 1;
            transform:
              translateX(-50%)
              scale(1.08);
          }

          30%,
          75% {
            opacity: 1;
            transform:
              translateX(-50%)
              scale(1);
          }

          100% {
            opacity: 0;
            transform:
              translateX(-50%)
              scale(0.94);
          }
        }
      `}</style>

      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: isSpecial
            ? `
              radial-gradient(
                ellipse at 50% 60%,
                rgba(168,85,247,0.12) 0%,
                rgba(99,102,241,0.06) 30%,
                transparent 58%
              )
            `
            : `
              radial-gradient(
                ellipse at 50% 62%,
                ${settings.glow_color}22 0%,
                ${settings.glow_color}0d 30%,
                transparent 62%
              )
            `,
        }}
      />

      {/* Legendary aura */}
      {isSpecial && (
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[58vmin] w-[58vmin] rounded-full"
          style={{
            background: `
              radial-gradient(
                circle,
                rgba(168,85,247,0.13) 0%,
                rgba(99,102,241,0.08) 34%,
                rgba(250,204,21,0.035) 55%,
                transparent 70%
              )
            `,
            filter: "blur(24px)",
            animation:
              "omswLegendaryAura 2.4s ease-in-out infinite",
          }}
        />
      )}

      {/* Lantern - true center of the OBS canvas */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="relative aspect-square"
          style={{
            width:
              "clamp(360px, 60vmin, 760px)",
            animation:
              "omswLanternIdle 5.8s ease-in-out infinite",
          }}
        >
        {/*
          Gift Chamber

          อยู่ "หลัง" รูปโคม
          เพราะช่องกระจกของ PNG โปร่งใส
        */}
        <div
          className="absolute left-1/2 top-[49%] z-10 h-[46%] w-[46%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[28%]"
          style={{
            clipPath:
              "inset(0 round 28%)",
          }}
        >
          {/* subtle magical atmosphere */}
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(
                  circle at 50% 55%,
                  ${settings.glow_color}18,
                  transparent 70%
                )
              `,
              animation:
                "omswMagicBreath 4s ease-in-out infinite",
            }}
          />

          {/* particles */}
          {particles.map(
            (particle, index) => (
              <span
                key={`${particle}-${index}`}
                className="absolute select-none"
                style={{
                  left: `${
                    18 +
                    ((index * 22) %
                      58)
                  }%`,
                  top: `${
                    15 +
                    ((index * 29) %
                      65)
                  }%`,
                  fontSize:
                    "clamp(8px, 1.1vmin, 15px)",
                  animation: `
                    omswParticleFloat
                    ${
                      4.2 +
                      index * 0.5
                    }s
                    ease-in-out
                    ${
                      index * 0.35
                    }s
                    infinite
                  `,
                  filter: `
                    drop-shadow(
                      0 0 5px
                      ${settings.glow_color}
                    )
                  `,
                }}
              >
                {particle}
              </span>
            ),
          )}

          {/* Gifts */}
          {gifts.map((gift) => {
            const slot =
              GIFT_SLOTS[
                gift.slotIndex
              ];

            return (
              <div
                key={gift.id}
                className="absolute"
                style={
                  {
                    left: `${slot.x}%`,
                    top: `${slot.y}%`,

                    width: `clamp(
                      30px,
                      ${
                        gift.size /
                        10
                      }vmin,
                      ${gift.size}px
                    )`,

                    height: `clamp(
                      30px,
                      ${
                        gift.size /
                        10
                      }vmin,
                      ${gift.size}px
                    )`,

                    animation:
                      "omswGiftSummon 760ms cubic-bezier(.14,.85,.24,1) both",

                    "--gift-drift-x":
                      `${slot.dx}px`,

                    "--gift-drift-y":
                      `${slot.dy}px`,

                    "--gift-rotation":
                      `${gift.rotation}deg`,
                  } as React.CSSProperties
                }
              >
                <div
                  className="h-full w-full"
                  style={{
                    animation: `
                      omswGiftSpirit
                      ${gift.duration}s
                      ease-in-out
                      ${gift.delay}s
                      infinite
                      alternate
                    `,
                    filter: `
                      drop-shadow(
                        0 0 5px
                        ${settings.glow_color}
                      )
                      drop-shadow(
                        0 0 10px
                        ${settings.glow_color}88
                      )
                    `,
                  }}
                >
                  {gift.image ? (
                    <>
                      <img
                        src={
                          gift.image
                        }
                        alt={
                          gift.name
                        }
                        className="h-full w-full object-contain"
                        referrerPolicy="no-referrer"
                        onError={(
                          event,
                        ) => {
                          event.currentTarget.style.display =
                            "none";

                          const fallback =
                            event
                              .currentTarget
                              .nextElementSibling as HTMLElement | null;

                          if (
                            fallback
                          ) {
                            fallback.style.display =
                              "grid";
                          }
                        }}
                      />

                      <span className="hidden h-full w-full place-items-center text-3xl">
                        {
                          gift.emoji
                        }
                      </span>
                    </>
                  ) : (
                    <span className="grid h-full w-full place-items-center text-3xl">
                      {gift.emoji}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/*
          ภาพโคม

          z-30 อยู่หน้าของ Gift
          ช่องกระจกต้องโปร่งใส
        */}
        <div
          key={`${lanternImage}-${giftPulseKey}`}
          className="absolute inset-0 z-30"
          style={{
            animation: isSpecial
              ? "omswLegendaryPulse 1.8s ease-in-out infinite"
              : giftPulseKey > 0
                ? "omswLanternGiftPulse 850ms ease-out"
                : undefined,
          }}
        >
          <img
            src={lanternImage}
            alt="OMSW Live Magic Lantern"
            className="h-full w-full object-contain"
            draggable={false}
          />
        </div>
        </div>
      </div>

      {/* Special headline */}
      {isSpecial && (
        <div
          className="pointer-events-none absolute left-1/2 top-[9%] z-[100] whitespace-nowrap text-center"
          style={{
            animation:
              "omswSpecialText 5s ease-in-out both",
          }}
        >
          <div
            className="text-sm font-black tracking-[0.22em] text-yellow-100"
            style={{
              textShadow: `
                0 0 7px rgba(250,204,21,.65),
                0 0 14px rgba(168,85,247,.55)
              `,
            }}
          >
            ✦ LEGENDARY GIFT ✦
          </div>
        </div>
      )}

      {/* Thank you */}
      {thankYou && (
        <div
          key={thankYou.id}
          className="pointer-events-none absolute left-1/2 top-[13%] z-[110] whitespace-nowrap rounded-full border px-5 py-2.5 text-center text-white backdrop-blur-md"
          style={{
            background:
              thankYou.isSpecial
                ? "rgba(24,18,36,.66)"
                : "rgba(0,0,0,.58)",

            borderColor:
              thankYou.isSpecial
                ? "rgba(250,204,21,.48)"
                : `${settings.glow_color}75`,

            boxShadow:
              thankYou.isSpecial
                ? `
                  0 0 12px rgba(250,204,21,.18),
                  0 0 20px rgba(168,85,247,.24)
                `
                : `
                  0 0 18px
                  ${settings.glow_color}45
                `,

            animation:
              thankYou.isSpecial
                ? "omswThankYou 5s ease-in-out both"
                : "omswThankYou 2.8s ease-in-out both",
          }}
        >
          <span className="text-sm font-black">
            {thankYou.isSpecial
              ? "👑"
              : "✨"}{" "}
            {thankYou.user} sent{" "}
            {thankYou.giftName}
          </span>

          {thankYou.isSpecial &&
            thankYou.coins >
              0 && (
              <span className="ml-2 font-black text-yellow-200">
                •{" "}
                {thankYou.coins.toLocaleString()}{" "}
                coins
              </span>
            )}
        </div>
      )}
    </main>
  );
}