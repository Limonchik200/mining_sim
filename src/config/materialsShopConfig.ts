import type { MaterialsShopSlot, RawMaterialType } from '@/types/craft';

export const MATERIALS_SHOP_REFRESH_MS = 60 * 60 * 1000;

interface PackConfig {
  packSize: number;
  basePrice: number;
  discounts: { pct: number; weight: number }[];
  stockRange: [number, number];
}

const WOOD_PACKS: PackConfig[] = [
  {
    packSize: 1,
    basePrice: 800,
    discounts: [{ pct: 0, weight: 1 }],
    stockRange: [7, 10],
  },
  {
    packSize: 5,
    basePrice: 4000,
    discounts: [
      { pct: 0, weight: 50 },
      { pct: 5, weight: 25 },
      { pct: 10, weight: 15 },
      { pct: 15, weight: 10 },
    ],
    stockRange: [2, 4],
  },
  {
    packSize: 10,
    basePrice: 8000,
    discounts: [
      { pct: 0, weight: 30 },
      { pct: 5, weight: 25 },
      { pct: 10, weight: 20 },
      { pct: 15, weight: 15 },
      { pct: 20, weight: 10 },
    ],
    stockRange: [1, 2],
  },
];

const STEEL_PACKS: PackConfig[] = [
  {
    packSize: 1,
    basePrice: 1500,
    discounts: [{ pct: 0, weight: 1 }],
    stockRange: [7, 10],
  },
  {
    packSize: 3,
    basePrice: 4500,
    discounts: [
      { pct: 0, weight: 50 },
      { pct: 5, weight: 25 },
      { pct: 10, weight: 15 },
      { pct: 15, weight: 10 },
    ],
    stockRange: [2, 4],
  },
  {
    packSize: 5,
    basePrice: 7500,
    discounts: [
      { pct: 0, weight: 30 },
      { pct: 10, weight: 25 },
      { pct: 15, weight: 20 },
      { pct: 20, weight: 15 },
      { pct: 25, weight: 10 },
    ],
    stockRange: [1, 2],
  },
];

function pickDiscount(config: PackConfig): number {
  const totalWeight = config.discounts.reduce((s, d) => s + d.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const d of config.discounts) {
    roll -= d.weight;
    if (roll <= 0) return d.pct;
  }
  return 0;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSlot(id: string, materialType: RawMaterialType, config: PackConfig): MaterialsShopSlot {
  const discountPct = pickDiscount(config);
  const stock = randInt(config.stockRange[0], config.stockRange[1]);
  return {
    id,
    materialType,
    packSize: config.packSize,
    basePrice: config.basePrice,
    discountPct,
    stock,
    maxStock: stock,
  };
}

export function generateMaterialsShopSlots(now: number): { slots: MaterialsShopSlot[]; nextRefreshAt: number } {
  const slots: MaterialsShopSlot[] = [];
  WOOD_PACKS.forEach((cfg, i) => {
    slots.push(generateSlot(`wood_${cfg.packSize}`, 'wood_log', cfg));
  });
  STEEL_PACKS.forEach((cfg, i) => {
    slots.push(generateSlot(`steel_${cfg.packSize}`, 'steel_plank', cfg));
  });
  return {
    slots,
    nextRefreshAt: now + MATERIALS_SHOP_REFRESH_MS,
  };
}

export function getSlotPrice(slot: MaterialsShopSlot): number {
  return Math.round(slot.basePrice * (1 - slot.discountPct / 100) * 100) / 100;
}
