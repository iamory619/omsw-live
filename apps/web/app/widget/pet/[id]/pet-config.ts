export type PetType =
  | "cat"
  | "husky"
  | "trex"
  | "pony"
  | "capybara";

export type PetStageConfig = {
  stage: number;
  name: string;
  minXp: number;
  nextXp: number;
  scale: number;
};

export type PetConfig = {
  type: PetType;
  displayName: string;
  stages: PetStageConfig[];
};

export const PET_CONFIG: Record<PetType, PetConfig> = {
  cat: {
    type: "cat",
    displayName: "Japanese Calico Cat",
    stages: [
      { stage: 1, name: "Box Lover", minXp: 0, nextXp: 25, scale: 0.78 },
      { stage: 2, name: "Curious Kitty", minXp: 25, nextXp: 100, scale: 0.78 },
      { stage: 3, name: "Sweet Kitty", minXp: 100, nextXp: 300, scale: 0.78 },
      { stage: 4, name: "Playful Kitty", minXp: 300, nextXp: 700, scale: 0.78 },
      { stage: 5, name: "Lucky Cat", minXp: 700, nextXp: 1200, scale: 0.78 },
    ],
  },

  husky: {
    type: "husky",
    displayName: "Siberian Husky",
    stages: [
      { stage: 1, name: "Tiny Husky", minXp: 0, nextXp: 25, scale: 0.72 },
      { stage: 2, name: "Baby Husky", minXp: 25, nextXp: 100, scale: 0.84 },
      { stage: 3, name: "Young Husky", minXp: 100, nextXp: 300, scale: 0.95 },
      { stage: 4, name: "Royal Husky", minXp: 300, nextXp: 700, scale: 1.05 },
      { stage: 5, name: "Legendary Husky", minXp: 700, nextXp: 1200, scale: 1.16 },
    ],
  },

  trex: {
    type: "trex",
    displayName: "Tiny T-Rex",
    stages: [
      { stage: 1, name: "Dormant Egg", minXp: 0, nextXp: 25, scale: 0.68 },
      { stage: 2, name: "Hatchling T-Rex", minXp: 25, nextXp: 100, scale: 0.65 },
      { stage: 3, name: "Juvenile T-Rex", minXp: 100, nextXp: 300, scale: 0.96 },
      { stage: 4, name: "Adult T-Rex", minXp: 300, nextXp: 700, scale: 0.82 },
      { stage: 5, name: "Alpha Rex", minXp: 700, nextXp: 1200, scale: 0.7 },
    ],
  },

  pony: {
    type: "pony",
    displayName: "Magic Pony",
    stages: [
      { stage: 1, name: "Mysterious Haystack", minXp: 0, nextXp: 25, scale: 0.72 },
      { stage: 2, name: "Baby Pony", minXp: 25, nextXp: 100, scale: 0.78 },
      { stage: 3, name: "Young Unicorn", minXp: 100, nextXp: 300, scale: 0.84 },
      { stage: 4, name: "Dream Unicorn", minXp: 300, nextXp: 700, scale: 0.88 },
      { stage: 5, name: "Legendary Alicorn", minXp: 700, nextXp: 1200, scale: 0.92 },
    ],
  },

  capybara: {
    type: "capybara",
    displayName: "Capybara",
    stages: [
      { stage: 1, name: "Baby Capybara", minXp: 0, nextXp: 25, scale: 0.78 },
      { stage: 2, name: "Curious Capybara", minXp: 25, nextXp: 100, scale: 0.84 },
      { stage: 3, name: "Happy Capybara", minXp: 100, nextXp: 300, scale: 0.9 },
      { stage: 4, name: "Onsen Capybara", minXp: 300, nextXp: 700, scale: 0.96 },
      { stage: 5, name: "Capybara King", minXp: 700, nextXp: 1200, scale: 1.02 },
    ],
  },
};

export function isPetType(value: string | null): value is PetType {
  return (
    value === "cat" ||
    value === "husky" ||
    value === "trex" ||
    value === "pony" ||
    value === "capybara"
  );
}

export function getPetConfig(petType: PetType): PetConfig {
  return PET_CONFIG[petType];
}

export function getPetStage(
  petType: PetType,
  xp: number,
): PetStageConfig {
  const config = getPetConfig(petType);

  let currentStage =
    config.stages[0];

  for (const stage of config.stages) {
    if (xp >= stage.minXp) {
      currentStage = stage;
    } else {
      break;
    }
  }

  return currentStage;
}