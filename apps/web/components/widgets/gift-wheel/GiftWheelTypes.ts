export type WheelPrize = {
  id: string;
  label: string;
  emoji: string;
  weight: number;
};

export type GiftWheelPayload = {
  user: string;
  giftName: string;
  amount: number;
  diamond: number;
  giftImage?: string;
};

export type WheelResult = {
  prize: WheelPrize;
  index: number;
};