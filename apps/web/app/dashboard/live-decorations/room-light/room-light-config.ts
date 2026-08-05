import type {
  EffectOption,
  LightPreset,
  RoomLightSettings,
} from "./types";

export const STORAGE_KEY =
  "omsw-room-light-settings";

export const DEFAULT_SETTINGS: RoomLightSettings = {
  enabled: true,
  preset: "custom",
  canvasMode: "portrait",
  placement: "center",
  multiLightEnabled: false,
  lights: [
    {
      id: "light-1",
      enabled: true,
      color: "#ff2d95",
      placement: "left",
      intensity: 72,
      blur: 100,
      size: 76,
    },
    {
      id: "light-2",
      enabled: true,
      color: "#38bdf8",
      placement: "right",
      intensity: 72,
      blur: 100,
      size: 76,
    },
    {
      id: "light-3",
      enabled: false,
      color: "#a855f7",
      placement: "top",
      intensity: 60,
      blur: 110,
      size: 64,
    },
  ],
  effect: "studio-softbox",
  primaryColor: "#ff4da6",
  secondaryColor: "#7c3aed",
  intensity: 70,
  blur: 90,
  speed: 45,
  opacity: 65,
  animation: true,
  smooth: true,
};

export const EFFECT_OPTIONS: EffectOption[] = [
  {
    id: "studio-softbox",
    name: "Studio Softbox",
    description:
      "ไฟนุ่มซ้าย–ขวา เหมาะกับไลฟ์ขายของและพูดคุย",
    icon: "💡",
  },
  {
    id: "rgb-studio",
    name: "RGB Studio",
    description:
      "ไฟสีสองฝั่งแบบห้องเกม สตรีมเพลง และไลฟ์วัยรุ่น",
    icon: "🌈",
  },
  {
    id: "streamer-room",
    name: "Streamer Room",
    description:
      "ไฟหลังฉาก ไฟโต๊ะ และแสงบรรยากาศแบบสตรีมเมอร์",
    icon: "🎮",
  },
  {
    id: "stage-light",
    name: "Stage Light",
    description:
      "ลำแสงด้านบนและแสงพื้น เหมาะกับร้องเพลงและโชว์",
    icon: "🎤",
  },
  {
    id: "aurora",
    name: "Aurora",
    description:
      "ริ้วแสงเหนือเคลื่อนไหว เหมาะกับไลฟ์เพลง เกม และบรรยากาศแฟนตาซี",
    icon: "🌌",
  },
];

export const LIGHT_PRESETS: LightPreset[] = [
  {
    id: "tiktok-pink",
    name: "TikTok Pink",
    description:
      "ชมพู–ม่วง สดใส เหมาะกับไลฟ์บิวตี้",
    icon: "🩷",
    settings: {
      primaryColor: "#ff2d95",
      secondaryColor: "#7c3aed",
      intensity: 78,
      blur: 105,
      speed: 38,
      opacity: 72,
    },
  },
  {
    id: "gaming-neon",
    name: "Gaming Neon",
    description:
      "ฟ้า–ม่วง เข้มคมแบบห้องเกม",
    icon: "🎮",
    settings: {
      primaryColor: "#00d9ff",
      secondaryColor: "#8b5cf6",
      intensity: 82,
      blur: 88,
      speed: 48,
      opacity: 76,
    },
  },
  {
    id: "warm-studio",
    name: "Warm Studio",
    description:
      "แสงอุ่นนุ่ม ดูผิวสวยและเป็นธรรมชาติ",
    icon: "🧡",
    settings: {
      primaryColor: "#ffd3a1",
      secondaryColor: "#ff8a4c",
      intensity: 68,
      blur: 120,
      speed: 22,
      opacity: 62,
    },
  },
  {
    id: "cool-blue",
    name: "Cool Blue",
    description:
      "สะอาด โมเดิร์น เหมาะกับไลฟ์เทคและพูดคุย",
    icon: "🩵",
    settings: {
      primaryColor: "#8be9ff",
      secondaryColor: "#3b82f6",
      intensity: 72,
      blur: 110,
      speed: 28,
      opacity: 64,
    },
  },
  {
    id: "concert-stage",
    name: "Concert Stage",
    description:
      "ลำแสงม่วง–ชมพูสำหรับร้องเพลงและโชว์",
    icon: "🎤",
    settings: {
      primaryColor: "#ff3cac",
      secondaryColor: "#784ba0",
      intensity: 90,
      blur: 70,
      speed: 58,
      opacity: 80,
    },
  },
  {
    id: "aurora-blue",
    name: "Aurora Blue",
    description:
      "แสงเหนือฟ้า–เขียว ดูสะอาดและลึกลับ",
    icon: "🌌",
    settings: {
      primaryColor: "#52f7d4",
      secondaryColor: "#38bdf8",
      intensity: 82,
      blur: 95,
      speed: 40,
      opacity: 76,
    },
  },
  {
    id: "aurora-purple",
    name: "Aurora Purple",
    description:
      "แสงเหนือม่วง–ชมพู แฟนตาซีและโรแมนติก",
    icon: "💜",
    settings: {
      primaryColor: "#a855f7",
      secondaryColor: "#ff4da6",
      intensity: 84,
      blur: 100,
      speed: 46,
      opacity: 78,
    },
  },
];
