import { WheelPrize } from "./GiftWheelTypes";

export const DEFAULT_PRIZES: WheelPrize[] = [
  {
    id: "dance",
    emoji: "💃",
    label: "Dance 10 sec",
    weight: 10,
  },
  {
    id: "sing",
    emoji: "🎤",
    label: "Sing a song",
    weight: 10,
  },
  {
    id: "thank",
    emoji: "💖",
    label: "Special Thanks",
    weight: 18,
  },
  {
    id: "funny",
    emoji: "😂",
    label: "Funny Face",
    weight: 18,
  },
  {
    id: "again",
    emoji: "🎁",
    label: "Spin Again",
    weight: 30,
  },
  {
    id: "jackpot",
    emoji: "⭐",
    label: "JACKPOT",
    weight: 4,
  },
];