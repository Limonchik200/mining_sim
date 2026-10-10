export type ItemType = 'stopwatch' | 'energizer' | 'scales' | 'boots' | 'basket';

export type ItemRarity = 1 | 2 | 3 | 4;

export type ItemLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface OwnedItem {
  uid: string;
  type: ItemType;
  rarity: ItemRarity;
  level: ItemLevel;
}

export type EquipSlot = 0 | 1 | 2 | 3 | 4 | 5;

export type EquippedItems = (string | null)[];

export interface ItemEffect {
  activeLeaseMultBonus: number;
  energyMaxBonus: number;
  energyRegenBonus: number;
  foodBonusPct: number;
  sellMultBonus: number;
  expeditionTimeReductionPct: number;
  expeditionRefreshReductionPct: number;
  expeditionLootChance: number;
  expeditionLootMult: number;
}
