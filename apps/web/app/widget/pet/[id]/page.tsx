"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { SERVER_URL } from "@/lib/core/server-url";
import { CatPet, type PetState } from "./components/CatPet";
import { HuskyPet } from "./components/HuskyPet";
import { TrexPet } from "./components/TrexPet";
import { PonyPet } from "./components/PonyPet";
import { getPetStage, isPetType, type PetType } from "./pet-config";

type GiftPayload = {
  user?: string;
  uniqueId?: string;
  giftName?: string;
  giftImage?: string;
  giftPictureUrl?: string;
  diamond?: number;
  repeatCount?: number;
  amount?: number;
};

type GiftEffect = {
  id: string;
  image: string;
  emoji: string;
  name: string;
  user: string;
};

const STATE_DURATION: Record<PetState, number> = {
  idle: 0,
  walk: 2400,
  eat: 1800,
  happy: 1900,
  sleep: 5200,
  evolve: 3200,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function xpFromGift(payload: GiftPayload) {
  const diamonds = Math.max(0, Number(payload.diamond) || 0);
  const repeat = Math.max(
    1,
    Number(payload.repeatCount ?? payload.amount ?? 1) || 1,
  );

  if (diamonds >= 1000) return 120 * repeat;
  if (diamonds >= 500) return 70 * repeat;
  if (diamonds >= 100) return 30 * repeat;
  if (diamonds >= 10) return 8 * repeat;
  return 3 * repeat;
}

function getPetFeedingName(petType: PetType) {
  if (petType === "husky") return "husky";
  if (petType === "trex") return "T-Rex";
  if (petType === "pony") return "pony";
  return "kitty";
}

export default function EvolutionPetWidget() {
  const params = useParams();
  const overlayId = String(params.id || "");
  const [petType, setPetType] = useState<PetType>("cat");

  useEffect(() => {
    const selectedPet = new URLSearchParams(window.location.search).get("pet");
    const resolvedPetType: PetType = isPetType(selectedPet)
      ? selectedPet
      : "cat";

    setPetType(resolvedPetType);
    petTypeReadyRef.current = true;
  }, []);

  const socketRef = useRef<Socket | null>(null);
  const actionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequenceTimersRef = useRef<number[]>([]);
  const previousStageRef = useRef(1);
  const petTypeReadyRef = useRef(false);

  const [xp, setXp] = useState(0);
  const [state, setState] = useState<PetState>("idle");
  const [giftEffect, setGiftEffect] = useState<GiftEffect | null>(null);
  const [lastSupporter, setLastSupporter] = useState("");
  const [message, setMessage] = useState("Waiting for a gift...");
  const [petX, setPetX] = useState(50);
  const [facing, setFacing] = useState<1 | -1>(1);

  const stage = useMemo(() => {
    return getPetStage(petType, xp);
  }, [petType, xp]);

  const progress =
    stage.stage === 5
      ? 100
      : clamp(
          ((xp - stage.minXp) / Math.max(1, stage.nextXp - stage.minXp)) * 100,
          0,
          100,
        );

  const stageXp = Math.max(0, xp - stage.minXp);

  const eggPhase = useMemo(() => {
    if (petType !== "trex" || stage.stage !== 1) return null;

    if (progress >= 80) return "almost-hatched" as const;
    if (progress >= 60) return "large-cracks" as const;
    if (progress >= 40) return "eyes-visible" as const;
    if (progress >= 20) return "glowing" as const;
    return "dormant" as const;
  }, [petType, progress, stage.stage]);

  useEffect(() => {
    if (!petTypeReadyRef.current) return;

    previousStageRef.current = stage.stage;
    setMessage("Waiting for a gift...");
  }, [petType, stage.stage]);

  const clearActionTimer = () => {
    if (actionTimerRef.current) {
      clearTimeout(actionTimerRef.current);
      actionTimerRef.current = null;
    }
  };

  const clearSequenceTimers = () => {
    sequenceTimersRef.current.forEach((timerId) => {
      window.clearTimeout(timerId);
    });

    sequenceTimersRef.current = [];
  };

  const scheduleSequence = (callback: () => void, delay: number) => {
    const timerId = window.setTimeout(callback, delay);
    sequenceTimersRef.current.push(timerId);
  };

  const playState = (nextState: PetState, duration?: number) => {
    clearActionTimer();
    setState(nextState);

    const stateDuration = duration ?? STATE_DURATION[nextState];

    if (stateDuration > 0) {
      actionTimerRef.current = setTimeout(() => {
        setState("idle");
        setGiftEffect(null);
        setMessage("Waiting for a gift...");
      }, stateDuration);
    }
  };

  useEffect(() => {
    if (!overlayId) return;

    const socket = io(SERVER_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
    });

    socketRef.current = socket;

    const receiveGift = (payload: GiftPayload = {}) => {
      clearActionTimer();
      clearSequenceTimers();

      const user = payload.user?.trim() || payload.uniqueId?.trim() || "Viewer";
      const giftName = payload.giftName?.trim() || "Gift";
      const gainedXp = xpFromGift(payload);

      setLastSupporter(user);
      setMessage(`${user} sent ${giftName} · +${gainedXp} XP`);

      setGiftEffect({
        id: crypto.randomUUID(),
        image:
          payload.giftImage?.trim() || payload.giftPictureUrl?.trim() || "",
        emoji: "🎁",
        name: giftName,
        user,
      });

      setFacing(1);
      setPetX(42);
      setState("walk");

      scheduleSequence(() => {
        setPetX(52);
        setState("eat");
        setMessage(`${user} is feeding the ${getPetFeedingName(petType)}...`);
      }, 900);

      scheduleSequence(() => {
        setXp((current) => current + gainedXp);
        setState("happy");
        setMessage(`${user} sent ${giftName} · +${gainedXp} XP`);
      }, 2500);

      scheduleSequence(() => {
        setGiftEffect(null);
        setPetX(50);
        setState("idle");
        setMessage("Waiting for a gift...");
      }, 4300);
    };

    const resetPet = () => {
      clearActionTimer();
      clearSequenceTimers();

      setXp(0);
      previousStageRef.current = 1;
      setState("idle");
      setGiftEffect(null);
      setLastSupporter("");
      setMessage("Waiting for a gift...");
      setPetX(50);
      setFacing(1);
    };

    const handleConnect = () => {
      socket.emit("join-overlay", overlayId);
    };

    const handleConnectError = (error: Error) => {
      console.error("Evolution Pet socket error:", error.message);
    };

    const handlePetGift = (payload: GiftPayload) => {
      receiveGift(payload);
    };

    const handleTestPet = (payload: GiftPayload) => {
      receiveGift(payload);
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("pet-gift", handlePetGift);
    socket.on("test-pet", handleTestPet);
    socket.on("reset-pet", resetPet);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("pet-gift", handlePetGift);
      socket.off("test-pet", handleTestPet);
      socket.off("reset-pet", resetPet);
      socket.disconnect();

      clearActionTimer();
      clearSequenceTimers();

      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }

      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [overlayId, petType]);

  useEffect(() => {
    if (stage.stage <= previousStageRef.current) return;

    const previousStage = previousStageRef.current;
    previousStageRef.current = stage.stage;

    if (petType === "trex" && previousStage === 1 && stage.stage === 2) {
      setMessage("The egg is hatching! 🐣");
      playState("evolve", 4200);
      return;
    }

    if (petType === "trex" && stage.stage === 5) {
      setMessage("Alpha Rex Unlocked! 👑");
      playState("evolve", 5200);
      return;
    }

    setMessage(`Evolution! ${stage.name}`);
    playState("evolve", STATE_DURATION.evolve);
  }, [petType, stage.name, stage.stage]);

  useEffect(() => {
    if (state !== "idle") return;

    /*
     * CatPet.tsx จัดการ Blink และ Idle Activity ของแมวเองแล้ว
     * จึงไม่ให้ page.tsx สุ่ม walk / sleep / happy ซ้ำ
     */
    if (petType === "cat") return;

    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    const delay = 7000 + Math.random() * 7000;

    idleTimerRef.current = setTimeout(() => {
      const random = Math.random();

      if (random < 0.34) {
        setFacing(Math.random() > 0.5 ? 1 : -1);
        setPetX(44 + Math.random() * 12);
        playState("walk");
      } else if (random < 0.62) {
        playState("sleep");
      } else {
        playState("happy");
      }
    }, delay);

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };
  }, [petType, state]);

  return (
    <main className="fixed inset-0 overflow-hidden bg-transparent text-white">
      <style jsx global>{`
        @keyframes petGiftFloat {
          0% {
            opacity: 0;
            transform: translate(-50%, 80px) scale(0.2) rotate(-15deg);
            filter: blur(8px);
          }
          45% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1.15) rotate(7deg);
            filter: blur(0);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -8px) scale(1) rotate(0);
          }
        }

        @keyframes petHeart {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.5);
          }
          35% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(-90px) scale(1.2);
          }
        }

        @keyframes petEvolution {
          0%,
          100% {
            opacity: 0.2;
            transform: translate(-50%, -50%) scale(0.7) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.3) rotate(180deg);
          }
        }
      `}</style>

      <div className="absolute inset-x-0 bottom-[7%] h-[48%]">
        {/* Gift is intentionally in front of the pet. */}
        {giftEffect && (
          <div
            key={giftEffect.id}
            className="absolute bottom-[17%] left-[25%] z-[45] h-24 w-24 pointer-events-none"
            style={{
              animation: "petGiftFloat 850ms cubic-bezier(.16,.9,.25,1) both",
            }}
          >
            {giftEffect.image ? (
              <img
                src={giftEffect.image}
                alt={giftEffect.name}
                className="h-full w-full object-contain drop-shadow-[0_0_14px_rgba(244,114,182,0.9)]"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-6xl">
                {giftEffect.emoji}
              </div>
            )}
          </div>
        )}

        <div
          className="absolute z-30 transition-[left] duration-700 ease-in-out"
          style={{
            left: `${petX}%`,
            bottom: petType === "cat" ? "-18px" : "0px",
            transform: `translateX(-50%) scaleX(${facing})`,
            transformOrigin: "bottom center",
          }}
        >
          {petType === "husky" ? (
            <HuskyPet
              state={state}
              scale={stage.scale}
              stage={stage.stage}
              xp={Math.max(0, xp - stage.minXp)}
            />
          ) : petType === "trex" ? (
            <TrexPet
              state={state}
              scale={stage.scale}
              stage={stage.stage}
              progress={progress}
              eggPhase={eggPhase}
            />
          ) : petType === "pony" ? (
            <PonyPet
              state={state}
              scale={stage.scale}
              stage={stage.stage}
              progress={progress}
              stageXp={stageXp}
            />
          ) : (
            <CatPet
              state={state}
              scale={stage.scale}
              stage={stage.stage}
              stageXp={stageXp}
            />
          )}
        </div>

        {state === "happy" && (
          <div className="absolute bottom-[72%] left-1/2 z-40 text-5xl">
            {["💖", "✨", "💗"].map((item, index) => (
              <span
                key={item}
                className="absolute"
                style={{
                  left: `${(index - 1) * 54}px`,
                  animation: `petHeart 1.5s ease-out ${index * 0.16}s both`,
                }}
              >
                {item}
              </span>
            ))}
          </div>
        )}

        {state === "sleep" && (
          <div className="absolute bottom-[73%] left-[56%] z-40 text-4xl text-cyan-200">
            <span className="animate-pulse">Z</span>
            <span className="ml-2 text-3xl opacity-70">Z</span>
            <span className="ml-2 text-2xl opacity-45">Z</span>
          </div>
        )}
      </div>

      {state === "evolve" && (
        <div className="pointer-events-none absolute inset-0 z-50">
          <div
            className="absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] rounded-full border-4 border-yellow-200/70"
            style={{
              boxShadow:
                "0 0 50px rgba(250,204,21,.8), inset 0 0 60px rgba(255,255,255,.55)",
              animation: "petEvolution 1.1s ease-in-out infinite",
            }}
          />
        </div>
      )}


    </main>
  );
}