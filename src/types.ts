export type Lang = 'uk' | 'en';
export type Theme = 'dark' | 'light';
export type Tab = 'mining' | 'shop' | 'upgrades' | 'expeditions' | 'settings';
export type TimeUnit = 'seconds' | 'minutes' | 'hours';

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

export interface UpgradeState {
  activeLeaseMult: number;
  autoLeaseMult: number;
  autoCooldownLvl: number;
  basketCapLvl: number;
  caseChanceLvl: number;
  energyMaxLvl: number;
  energyRegenLvl: number;
  energyRegenAmountLvl: number;
}

export interface GameState {
  balance: number;
  gems: number;
  energy: number;
  maxEnergy: number;
  activePickaxe: InventoryItem | null;
  activePickaxeTierId: string;
  sparePickaxes: InventoryItem[];
  inventory: Record<ResourceType, { mass: number; count: number }>;
  autoBasket: AutoBasketItem[];
  autoBasketMax: number;

  activeLeaseEndsAt: number | null;
  activeLeaseTotal: number;
  activeLeaseMineId: number;
  autoMiningEndsAt: number | null;
  autoMiningTotal: number;
  autoLeaseMineId: number;
  lastAutoDigAt: number;

  buffs: ActiveBuff[];
  lastEnergyRegenAt: number;

  totalDigs: number;
  totalEarned: number;
  totalCasesOpened: number;
  totalGemsEarned: number;

  level: number;
  xp: number;

  cases: CaseItem[];
  itemBags: number;

  upgrades: UpgradeState;

  starterGiftClaimed: boolean;
  redeemedPromoCodes: string[];
  ownedPickaxes: string[];
  currentMineId: number;

  dailyCalendar: {
    lastClaimDay: number;       // 0 = nothing claimed
    lastClaimTimestamp: number | null;
  };

  settings: {
    lang: Lang;
    theme: Theme;
  };

  materials: Record<string, number>;
  availableExpeditions: import('./config/expeditions').GeneratedExpedition[];
  activeExpeditions: import('./config/expeditions').GeneratedExpedition[];
  expeditionRefreshAt: number;

  lastSavedAt: number;
}

export interface Notification {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning' | 'drop' | 'case';
  icon?: string;
  color?: string;
}

export interface FloatText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
}

export interface CaseOpenResult {
  rarity: CaseRarity;
  loot: { type: 'cash' | 'gems' | 'itembag'; amount: number; label: string };
}
