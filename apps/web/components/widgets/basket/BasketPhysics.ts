import { BasketRose } from "./BasketTypes";

export const MAX_PILE = 140;

export function getRoseCount(amount: number) {
  if (amount <= 1) return 10;
  if (amount <= 2) return 14;
  if (amount <= 5) return 22;
  if (amount <= 10) return 36;
  if (amount <= 20) return 60;

  return Math.min(100, amount * 4);
}

export function createPilePosition(index: number) {
  const layer = Math.floor(index / 18);
  const col = index % 18;

  const dome = Math.sin((col / 17) * Math.PI);

  const width = Math.max(180 - layer * 8, 70);

  const x =
    165 -
    width / 2 +
    (width / 17) * col +
    (Math.random() * 14 - 4);

  const y =
    78 +
    layer * 5 +
    dome * 18 +
    Math.random() * 8;

  return {
    x,
    y,
    scale:
      0.72 +
      dome * 0.22 -
      layer * 0.02 +
      Math.random() * 0.05,
    z: 60 + layer,
  };
}

export function rebuildPile(
  previous: BasketRose[],
  added: BasketRose[],
) {
  const total = Math.min(previous.length + added.length, MAX_PILE);

  return Array.from({ length: total }).map((_, index) => {
    const source =
      index < previous.length
        ? previous[index % previous.length]
        : added[(index - previous.length) % added.length];

    const p = createPilePosition(index);

    return {
      ...source,
      id: Date.now() + index,
      x: p.x,
      y: p.y,
      scale: p.scale,
      z: p.z,
    };
  });
}