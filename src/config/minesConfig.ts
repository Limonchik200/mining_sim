import type { Resource, ResourceType } from '@/types/inventory';
import type { Mine, MineDropTable } from '@/types/mines';

export const RESOURCES: Record<ResourceType, Resource> = {
  stone: {
    type: 'stone',
    nameUk: 'Камінь',
    nameEn: 'Stone',
    nameRu: 'Камень',
    color: '#94a3b8',
    bgColor: '#94a3b820',
    dropChance: 0.80,
    minMass: 0.30,
    maxMass: 0.70,
    pricePerKg: 0.20,
    xp: 1,
    weight: 1,
    icon: 'Mountain',
  },
  coal: {
    type: 'coal',
    nameUk: 'Вугілля',
    nameEn: 'Coal',
    nameRu: 'Уголь',
    color: '#475569',
    bgColor: '#47556920',
    dropChance: 0.15,
    minMass: 0.40,
    maxMass: 0.60,
    pricePerKg: 1.07,
    xp: 2,
    weight: 1,
    icon: 'Flame',
  },
  copper: {
    type: 'copper',
    nameUk: 'Мідь',
    nameEn: 'Copper',
    nameRu: 'Медь',
    color: '#ea6510',
    bgColor: '#ea651020',
    dropChance: 0.04,
    minMass: 0.20,
    maxMass: 0.40,
    pricePerKg: 3.80,
    xp: 4,
    weight: 1,
    icon: 'CircleDot',
  },
  iron: {
    type: 'iron',
    nameUk: 'Залізо',
    nameEn: 'Iron',
    nameRu: 'Железо',
    color: '#64748b',
    bgColor: '#64748b20',
    dropChance: 0.01,
    minMass: 0.30,
    maxMass: 0.50,
    pricePerKg: 10.60,
    xp: 8,
    weight: 1,
    icon: 'Hammer',
  },
  silver: {
    type: 'silver',
    nameUk: 'Срібло',
    nameEn: 'Silver',
    nameRu: 'Серебро',
    color: '#c0c0c0',
    bgColor: '#c0c0c020',
    dropChance: 0.015,
    minMass: 0.15,
    maxMass: 0.35,
    pricePerKg: 15.45,
    xp: 6,
    weight: 1,
    icon: 'CircleDollarSign',
  },
  gold: {
    type: 'gold',
    nameUk: 'Золото',
    nameEn: 'Gold',
    nameRu: 'Золото',
    color: '#fbbf24',
    bgColor: '#fbbf2420',
    dropChance: 0.015,
    minMass: 0.10,
    maxMass: 0.25,
    pricePerKg: 21.80,
    xp: 8,
    weight: 1,
    icon: 'Medal',
  },
};

export const RESOURCE_LIST = Object.values(RESOURCES);

export function getResourceWeight(type: ResourceType): number {
  return RESOURCES[type]?.weight ?? 1;
}

export const MINES: Mine[] = [
  {
    id: 0,
    nameUk: 'Звалище',
    nameEn: 'The Dump',
    nameRu: 'Свалка',
    reqLevel: 1,
    drops: { stone: 100, coal: 0, copper: 0, iron: 0 },
  },
  {
    id: 1,
    nameUk: 'Шахта 1',
    nameEn: 'Mine 1',
    nameRu: 'Шахта 1',
    reqLevel: 1,
    drops: { stone: 80, coal: 15, copper: 4, iron: 1 },
    unlockRequirements: {
      level: 1,
      price: 0,
      unlockTimeMinutes: 0,
    },
    environment: {
      baseTemperature: 15,
      oxygenConsumptionPerMin: 0,
    },
  },
  {
    id: 2,
    nameUk: 'Шахта 2',
    nameEn: 'Mine 2',
    nameRu: 'Шахта 2',
    reqLevel: 4,
    drops: { stone: 71, coal: 19.5, copper: 7.3, iron: 2.2 },
    unlockRequirements: {
      level: 4,
      price: 50,
      unlockTimeMinutes: 15,
    },
    environment: {
      baseTemperature: 16,
      oxygenConsumptionPerMin: 0,
    },
  },
  {
    id: 3,
    nameUk: 'Шахта 3',
    nameEn: 'Mine 3',
    nameRu: 'Шахта 3',
    reqLevel: 7,
    drops: { stone: 64, coal: 22.7, copper: 9.5, iron: 3.8 },
    unlockRequirements: {
      level: 7,
      price: 100,
      helmetLevel: 2,
      flashlightLevel: 1,
      unlockTimeMinutes: 30,
    },
    environment: {
      baseTemperature: 17,
      oxygenConsumptionPerMin: 0,
    },
  },
  {
    id: 4,
    nameUk: 'Шахта 4',
    nameEn: 'Mine 4',
    nameRu: 'Шахта 4',
    reqLevel: 7,
    drops: { stone: 57, coal: 26, copper: 11.3, iron: 5.7 },
    unlockRequirements: {
      level: 7,
      price: 150,
      helmetLevel: 4,
      flashlightLevel: 3,
      cartStation: true,
      ventilationLevel: 4,
      unlockTimeMinutes: 45,
    },
    environment: {
      baseTemperature: 18,
      oxygenConsumptionPerMin: 4,
    },
  },
  {
    id: 5,
    nameUk: 'Шахта 5',
    nameEn: 'Mine 5',
    nameRu: 'Шахта 5',
    reqLevel: 10,
    drops: { stone: 49, coal: 28.5, copper: 13.5, iron: 7.5, silver: 1.5 },
    unlockRequirements: {
      level: 10,
      price: 280,
      helmetLevel: 5,
      flashlightLevel: 4,
      railsCount: 3,
      ventilationLevel: 5,
      unlockTimeMinutes: 60,
    },
    environment: {
      baseTemperature: 19,
      oxygenConsumptionPerMin: 5,
    },
  },
  {
    id: 6,
    nameUk: 'Шахта 6',
    nameEn: 'Mine 6',
    nameRu: 'Шахта 6',
    reqLevel: 13,
    drops: { stone: 41, coal: 28.5, copper: 17.8, iron: 9.6, silver: 3.1 },
    unlockRequirements: {
      level: 13,
      price: 550,
      helmetLevel: 6,
      flashlightLevel: 5,
      glovesLevel: 1,
      railsCount: 3,
      ventilationLevel: 6,
      unlockTimeMinutes: 75,
    },
    environment: {
      baseTemperature: 20,
      oxygenConsumptionPerMin: 6,
    },
  },
  {
    id: 7,
    nameUk: 'Шахта 7',
    nameEn: 'Mine 7',
    nameRu: 'Шахта 7',
    reqLevel: 16,
    drops: { stone: 34.5, coal: 28, copper: 21, iron: 12.1, silver: 4.4 },
    unlockRequirements: {
      level: 16,
      price: 1200,
      helmetLevel: 7,
      flashlightLevel: 6,
      glovesLevel: 2,
      railsCount: 3,
      ventilationLevel: 7,
      lightingLevel: 1,
      unlockTimeMinutes: 90,
    },
    environment: {
      baseTemperature: 21,
      oxygenConsumptionPerMin: 7,
    },
  },
  {
    id: 8,
    nameUk: 'Шахта 8',
    nameEn: 'Mine 8',
    nameRu: 'Шахта 8',
    reqLevel: 20,
    drops: { stone: 27.5, coal: 26, copper: 24, iron: 14.3, silver: 6.7, gold: 1.5 },
    unlockRequirements: {
      level: 20,
      price: 2300,
      helmetLevel: 8,
      flashlightLevel: 7,
      glovesLevel: 3,
      railsCount: 3,
      ventilationLevel: 8,
      lightingLevel: 2,
      unlockTimeMinutes: 105,
    },
    environment: {
      baseTemperature: 22,
      oxygenConsumptionPerMin: 8,
    },
  },
  {
    id: 9,
    nameUk: 'Шахта 9',
    nameEn: 'Mine 9',
    nameRu: 'Шахта 9',
    reqLevel: 24,
    drops: { stone: 25, coal: 21.4, copper: 27, iron: 15.5, silver: 8.4, gold: 2.7 },
    unlockRequirements: {
      level: 24,
      price: 3500,
      helmetLevel: 9,
      flashlightLevel: 8,
      glovesLevel: 4,
      respiratorLevel: 1,
      woodenBracingCount: 1,
      railsCount: 3,
      ventilationLevel: 9,
      lightingLevel: 3,
      unlockTimeMinutes: 120,
    },
    environment: {
      baseTemperature: 23,
      oxygenConsumptionPerMin: 9,
    },
  },
  {
    id: 10,
    nameUk: 'Шахта 10',
    nameEn: 'Mine 10',
    nameRu: 'Шахта 10',
    reqLevel: 28,
    drops: { stone: 17, coal: 22, copper: 29, iron: 17.5, silver: 10.6, gold: 3.9 },
    unlockRequirements: {
      level: 28,
      price: 5000,
      helmetLevel: 10,
      flashlightLevel: 9,
      glovesLevel: 5,
      respiratorLevel: 2,
      woodenBracingCount: 2,
      railsCount: 3,
      ventilationLevel: 10,
      lightingLevel: 4,
      unlockTimeMinutes: 135,
    },
    environment: {
      baseTemperature: 24,
      oxygenConsumptionPerMin: 10,
    },
  },
];

export function getMineById(id: number): Mine {
  return MINES.find((m) => m.id === id) || MINES[0];
}

export function isDumpMine(mineId: number): boolean {
  return mineId === 0;
}

const RESOURCE_DROP_ORDER: ResourceType[] = ['stone', 'coal', 'copper', 'iron', 'silver', 'gold'];

export function getRandomResourceForMine(mineId: number): Resource {
  const mine = getMineById(mineId);
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const type of RESOURCE_DROP_ORDER) {
    const chance = mine.drops[type] ?? 0;
    if (chance <= 0) continue;
    cumulative += chance;
    if (roll < cumulative) return RESOURCES[type];
  }
  return RESOURCES.stone;
}

export function getRandomResource(): Resource {
  const roll = Math.random();
  let cumulative = 0;
  for (const res of RESOURCE_LIST) {
    cumulative += res.dropChance;
    if (roll < cumulative) return res;
  }
  return RESOURCES.stone;
}

export function getRandomMass(resource: Resource): number {
  const mass = resource.minMass + Math.random() * (resource.maxMass - resource.minMass);
  return Math.round(mass * 100) / 100;
}

export const ENERGY_MAX = 300;
export const ENERGY_REGEN_SECONDS = 60;
export const DIG_COOLDOWN_MS = 300;
export const BASE_AUTO_DIG_INTERVAL_MS = 10000;
export const BASE_AUTO_BASKET_MAX = 50;
export const MIN_LEASE_SECONDS = 100;

export const BASE_DIAMOND_DROP_CHANCE = 0.0001;
export const DIAMOND_DOUBLE_DROP_CHANCE = 0.15;
export const DIAMOND_BASE_AMOUNT = 1;

export function rollDiamondDrop(bonusChance: number = 0, mineId: number = -1): { dropped: boolean; amount: number } {
  if (mineId === 0) return { dropped: false, amount: 0 };
  const chance = BASE_DIAMOND_DROP_CHANCE + bonusChance;
  if (Math.random() >= chance) return { dropped: false, amount: 0 };
  const amount = Math.random() < DIAMOND_DOUBLE_DROP_CHANCE ? DIAMOND_BASE_AMOUNT + 1 : DIAMOND_BASE_AMOUNT;
  return { dropped: true, amount };
}
