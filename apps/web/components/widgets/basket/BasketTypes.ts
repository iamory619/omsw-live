export type GiftPayload = {
  user: string;
  giftName: string;
  amount: number;
  diamond: number;
  giftImage: string;
};

export type BasketRose = {
  id: number;
  image: string;
  name: string;
  size: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  rotate: number;
  delay: number;
  scale: number;
  z: number;
};

export type BasketSparkle = {
  id: number;
  x: number;
  y: number;
  delay: number;
};

export type BasketPetal = {
  id: number;
  startX: number;
  startY: number;
  drift: number;
  rotate: number;
  delay: number;
  size: number;
};

export type BasketVariant = {
  id: string;
  backImage: string;
  frontImage: string;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  roseBaseY: number;
  roseCenterX: number;
  maxPile: number;
};