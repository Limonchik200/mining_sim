export type ResourceType = 'stone' | 'coal' | 'copper' | 'iron';
export type CaseRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Resource {
  type: ResourceType;
  nameUk: string;
  nameEn: string;
  color: string;
  bgColor: string;
  dropChance: number;
  minMass: number;
  maxMass: number;
  pricePerKg: number;
  xp: number;
  icon: string;
}

export interface PickaxeTier {
  id: string;
  nameUk: string;
  nameEn: string;
  price: number;
  requiredLevel: number;
  yieldMultiplier: number;
  energyCost: number;
  durabilityCost: number;
  maxDurability: number;
  color: string;
  icon: string;
}

export interface InventoryItem {
  id: string;
  pickaxeTierId: string;
  name: string;
  durability: number;
  maxDurability: number;
}

export interface AutoBasketItem {
  resource: ResourceType;
  mass: number;
  xp: number;
  timestamp: number;
}

export interface ActiveBuff {
  id: string;
  type: 'juice' | 'milka';
  regenMultiplier: number;
  expiresAt: number;
  name: string;
}

export interface FoodItem {
  id: string;
  name: string;
  nameUk: string;
  nameEn: string;
  price: number;
  energyBoost: number;
  regenMultiplier: number;
  buffDuration: number;
  icon: string;
  color: string;
}

export interface CaseItem {
  id: string;
  rarity: CaseRarity;
  opened: boolean;
}

export interface CaseLootResult {
  type: 'cash' | 'gems' | 'itembag';
  amount: number;
  label: string;
  labelEn: string;
}

export interface CaseLootTableEntry {
  chance: number;
  type: 'cash' | 'gems' | 'itembag';
  label: string;
  labelEn: string;
}

export interface CaseOpenResult {
  rarity: CaseRarity;
  loot: { type: 'cash' | 'gems' | 'itembag'; amount: number; label: string };
}
