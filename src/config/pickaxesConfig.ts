import type { PickaxeTier, FoodItem } from '@/types/inventory';

export const PICKAXE_TIERS: PickaxeTier[] = [
  {
    id: 'shovel',
    nameUk: 'Лопата',
    nameEn: 'Shovel',
    nameRu: 'Лопата',
    price: 0,
    requiredLevel: 1,
    yieldMultiplier: 1,
    energyCost: 1,
    durabilityCost: 0,
    maxDurability: 999999,
    color: '#a3a3a3',
    icon: 'Shovel',
  },
  {
    id: 'rusty',
    nameUk: 'Ржава кирка',
    nameEn: 'Rusty Pickaxe',
    nameRu: 'Ржавая кирка',
    price: 20,
    requiredLevel: 1,
    yieldMultiplier: 1,
    energyCost: 1,
    durabilityCost: 1,
    maxDurability: 600,
    color: '#94a3b8',
    icon: 'Pickaxe',
  },
  {
    id: 'stone',
    nameUk: 'Кам\'яна кирка',
    nameEn: 'Stone Pickaxe',
    nameRu: 'Каменная кирка',
    price: 55,
    requiredLevel: 2,
    yieldMultiplier: 2,
    energyCost: 2,
    durabilityCost: 2,
    maxDurability: 1000,
    color: '#a78bfa',
    icon: 'Pickaxe',
  },
  {
    id: 'reinforced_stone',
    nameUk: 'Укріплена кам\'яна кирка',
    nameEn: 'Reinforced Stone Pickaxe',
    nameRu: 'Укрепленная каменная кирка',
    price: 130,
    requiredLevel: 3,
    yieldMultiplier: 3,
    energyCost: 3,
    durabilityCost: 3,
    maxDurability: 1500,
    color: '#8b5cf6',
    icon: 'Pickaxe',
  },
  {
    id: 'iron',
    nameUk: 'Залізна кирка',
    nameEn: 'Iron Pickaxe',
    nameRu: 'Железная кирка',
    price: 320,
    requiredLevel: 5,
    yieldMultiplier: 5,
    energyCost: 5,
    durabilityCost: 5,
    maxDurability: 3000,
    color: '#60a5fa',
    icon: 'Pickaxe',
  },
  {
    id: 'reinforced_iron',
    nameUk: 'Укріплена залізна кирка',
    nameEn: 'Reinforced Iron Pickaxe',
    nameRu: 'Укрепленная железная кирка',
    price: 620,
    requiredLevel: 8,
    yieldMultiplier: 7,
    energyCost: 6,
    durabilityCost: 6,
    maxDurability: 5000,
    color: '#3b82f6',
    icon: 'Pickaxe',
  },
  {
    id: 'platinum',
    nameUk: 'Платинова кирка',
    nameEn: 'Platinum Pickaxe',
    nameRu: 'Платиновая кирка',
    price: 1000,
    requiredLevel: 11,
    yieldMultiplier: 9,
    energyCost: 8,
    durabilityCost: 8,
    maxDurability: 7000,
    color: '#e5e4e2',
    icon: 'Pickaxe',
  },
];

export function getPickaxeTier(id: string): PickaxeTier {
  return PICKAXE_TIERS.find((p) => p.id === id) || PICKAXE_TIERS[0];
}

export function getRepairCost(pickaxeTierId: string, currentDurability?: number): number {
  const tier = getPickaxeTier(pickaxeTierId);
  const dur = currentDurability ?? tier.maxDurability;
  const lostDurability = tier.maxDurability - dur;
  if (lostDurability <= 0) return 0;
  const costPerUnit = tier.price / tier.maxDurability;
  return Math.round(lostDurability * costPerUnit * 100) / 100;
}

export const FOOD_ITEMS: FoodItem[] = [
  {
    id: 'snickers',
    name: 'Snickers',
    nameUk: 'Snickers',
    nameEn: 'Snickers',
    nameRu: 'Snickers',
    price: 3.50,
    energyBoost: 45,
    regenMultiplier: 1,
    buffDuration: 0,
    icon: 'Candy',
    color: '#92400e',
  },
  {
    id: 'juice',
    name: 'Juice',
    nameUk: 'Сік',
    nameEn: 'Juice',
    nameRu: 'Сок',
    price: 3.80,
    energyBoost: 0,
    regenMultiplier: 20,
    buffDuration: 180,
    icon: 'CupSoda',
    color: '#f97316',
  },
  {
    id: 'milka',
    name: 'Milka',
    nameUk: 'Milka',
    nameEn: 'Milka',
    nameRu: 'Milka',
    price: 5.40,
    energyBoost: 80,
    regenMultiplier: 12,
    buffDuration: 120,
    icon: 'Cookie',
    color: '#d4a373',
  },
];

export const ACTIVE_LEASE_PRICE_PER_SEC = 0.25;
export const AUTO_LEASE_PRICE_PER_SEC = 0.05;
export const STARTER_GIFT_SECONDS = 300;

export function getActiveLeasePricePerSec(mineId: number): number {
  if (mineId === 0) return 0;
  const mineLevel = Math.max(1, mineId);
  return ACTIVE_LEASE_PRICE_PER_SEC * (1 + 0.45 * (mineLevel - 1));
}

export function getAutoLeasePricePerSec(mineId: number): number {
  if (mineId === 0) return 0;
  const mineLevel = Math.max(1, mineId);
  return AUTO_LEASE_PRICE_PER_SEC * (1 + 0.45 * (mineLevel - 1));
}

export function getFoodPrice(food: FoodItem, mineId: number): number {
  const mineLevel = Math.max(1, mineId);
  return Math.round(food.price * (1 + 0.30 * (mineLevel - 1)) * 100) / 100;
}

export function isUnlimitedDurability(pickaxeTierId: string): boolean {
  const tier = getPickaxeTier(pickaxeTierId);
  return tier.id === 'shovel';
}

export function isMineRestricted(pickaxeTierId: string): boolean {
  const tier = getPickaxeTier(pickaxeTierId);
  return tier.id === 'shovel';
}

export function canUseInMine(pickaxeTierId: string, mineId: number): boolean {
  if (pickaxeTierId === 'shovel') return mineId === 0;
  return true;
}
