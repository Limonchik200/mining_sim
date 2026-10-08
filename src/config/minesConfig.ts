import type { Resource, ResourceType } from '@/types/inventory';
import type { Mine, MineDropTable } from '@/types/mines';

export const RESOURCES: Record<ResourceType, Resource> = {
  stone: {
    type: 'stone',
    nameUk: 'Камінь',
    nameEn: 'Stone',
    color: '#94a3b8',
    bgColor: '#94a3b820',
    dropChance: 0.80,
    minMass: 0.30,
    maxMass: 0.70,
    pricePerKg: 0.23,
    xp: 1,
    icon: 'Mountain',
  },
  coal: {
    type: 'coal',
    nameUk: 'Вугілля',
    nameEn: 'Coal',
    color: '#475569',
    bgColor: '#47556920',
    dropChance: 0.15,
    minMass: 0.40,
    maxMass: 0.60,
    pricePerKg: 1.15,
    xp: 2,
    icon: 'Flame',
  },
  copper: {
    type: 'copper',
    nameUk: 'Мідь',
    nameEn: 'Copper',
    color: '#ea6510',
    bgColor: '#ea651020',
    dropChance: 0.04,
    minMass: 0.20,
    maxMass: 0.40,
    pricePerKg: 4.03,
    xp: 4,
    icon: 'CircleDot',
  },
  iron: {
    type: 'iron',
    nameUk: 'Залізо',
    nameEn: 'Iron',
    color: '#64748b',
    bgColor: '#64748b20',
    dropChance: 0.01,
    minMass: 0.30,
    maxMass: 0.50,
    pricePerKg: 11.50,
    xp: 8,
    icon: 'Hammer',
  },
};

export const RESOURCE_LIST = Object.values(RESOURCES);

export const MINES: Mine[] = [
  {
    id: 1,
    nameUk: 'Шахта 1',
    nameEn: 'Mine 1',
    reqLevel: 1,
    drops: { stone: 80, coal: 15, copper: 4, iron: 1 },
  },
  {
    id: 2,
    nameUk: 'Шахта 2',
    nameEn: 'Mine 2',
    reqLevel: 4,
    drops: { stone: 55, coal: 30, copper: 12, iron: 3 },
  },
  {
    id: 3,
    nameUk: 'Шахта 3',
    nameEn: 'Mine 3',
    reqLevel: 7,
    drops: { stone: 30, coal: 45, copper: 18, iron: 7 },
  },
];

export function getMineById(id: number): Mine {
  return MINES.find((m) => m.id === id) || MINES[0];
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
