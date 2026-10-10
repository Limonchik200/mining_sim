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
    icon: 'Hammer',
  },
};

export const RESOURCE_LIST = Object.values(RESOURCES);

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
  },
  {
    id: 2,
    nameUk: 'Шахта 2',
    nameEn: 'Mine 2',
    nameRu: 'Шахта 2',
    reqLevel: 4,
    drops: { stone: 71, coal: 19.5, copper: 7.3, iron: 2.2 },
  },
  {
    id: 3,
    nameUk: 'Шахта 3',
    nameEn: 'Mine 3',
    nameRu: 'Шахта 3',
    reqLevel: 7,
    drops: { stone: 64, coal: 22.7, copper: 9.5, iron: 3.8 },
  },
];

export function getMineById(id: number): Mine {
  return MINES.find((m) => m.id === id) || MINES[0];
}

export function isDumpMine(mineId: number): boolean {
  return mineId === 0;
}

export function getRandomResourceForMine(mineId: number): Resource {
  const mine = getMineById(mineId);
  const roll = Math.random() * 100;
  let cumulative = 0;
  const entries: Array<[ResourceType, number]> = [
    ['stone', mine.drops.stone],
    ['coal', mine.drops.coal],
    ['copper', mine.drops.copper],
    ['iron', mine.drops.iron],
  ];
  for (const [type, chance] of entries) {
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

export const BASE_DIAMOND_DROP_CHANCE = 0.00001;
export const DIAMOND_DOUBLE_DROP_CHANCE = 0.15;
export const DIAMOND_BASE_AMOUNT = 1;

export function rollDiamondDrop(bonusChance: number = 0): { dropped: boolean; amount: number } {
  const chance = BASE_DIAMOND_DROP_CHANCE + bonusChance;
  if (Math.random() >= chance) return { dropped: false, amount: 0 };
  const amount = Math.random() < DIAMOND_DOUBLE_DROP_CHANCE ? DIAMOND_BASE_AMOUNT + 1 : DIAMOND_BASE_AMOUNT;
  return { dropped: true, amount };
}
