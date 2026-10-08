import type { PickaxeTier, FoodItem } from '@/types/inventory';

export const PICKAXE_TIERS: PickaxeTier[] = [
  {
    id: 'rusty',
    nameUk: 'Ржава кирка',
    nameEn: 'Rusty Pickaxe',
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
    price: 320,
    requiredLevel: 5,
    yieldMultiplier: 5,
    energyCost: 5,
    durabilityCost: 5,
    maxDurability: 3000,
    color: '#60a5fa',
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
    price: 5.40,
    energyBoost: 80,
    regenMultiplier: 12,
    buffDuration: 120,
    icon: 'Cookie',
    color: '#d4a373',
  },
];

export const ACTIVE_LEASE_PRICE_PER_SEC = 0.25;
export const AUTO_LEASE_PRICE_PER_SEC = 0.015;
export const STARTER_GIFT_SECONDS = 300;
