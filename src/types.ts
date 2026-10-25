export type Lang = 'uk' | 'en' | 'ru';
export type Theme = 'dark' | 'light';
export type Tab = 'mining' | 'shop' | 'upgrades' | 'expeditions' | 'settings' | 'equipment';
export type TimeUnit = 'seconds' | 'minutes' | 'hours';

export type ResourceType = 'stone' | 'coal' | 'copper' | 'iron' | 'silver' | 'gold';
export type CaseRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'energy';

export interface Resource {
  type: ResourceType;
  nameUk: string;
  nameEn: string;
  nameRu: string;
  color: string;
  bgColor: string;
  dropChance: number;
  minMass: number;
  maxMass: number;
  pricePerKg: number;
  xp: number;
  weight: number;
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
  backpackLvl?: number;
  luckLvl?: number;
  diamondChanceLvl?: number;
}

export interface MineUnlockRequirements {
  level: number;
  price: number;
  helmetLevel?: number;
  flashlightLevel?: number;
  glovesLevel?: number;
  respiratorLevel?: number;
  respiratorFilter?: boolean;
  railsCount?: number;
  cartStation?: boolean;
  ventilationLevel?: number;
  lightingLevel?: number;
  woodenBracingCount?: number;
  unlockTimeMinutes: number;
}

export interface MineEnvironment {
  baseTemperature: number;
  oxygenConsumptionPerMin: number;
}

export interface Mine {
  id: number;
  nameUk: string;
  nameEn: string;
  nameRu: string;
  reqLevel: number;
  drops: Record<string, number>;
  unlockRequirements?: MineUnlockRequirements;
  environment?: MineEnvironment;
}

export interface MineUnlockTimer {
  mineId: number;
  startedAt: number;
  durationMs: number;
}

export interface EquipmentUpgradeState {
  helmetLevel: number;
  flashlightLevel: number;
  glovesLevel: number;
  respiratorLevel: number;
  respiratorFilterPurchased: boolean;
  lightingLevel: number;
  ventilationLevel: number;
  railsCount: number;
  cartStationPurchased: boolean;
  woodenBracingCount: number;
}

export interface GameState {
  balance: number;
  gems: number;
  energy: number;
  maxEnergy: number;
  activePickaxe: InventoryItem | null;
  activePickaxeTierId: string;
  sparePickaxes: InventoryItem[];
  inventory: Record<string, { mass: number; count: number }>;
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
  autoBasketCases: CaseItem[];
  itemBags: number;

  upgrades: UpgradeState;
  equipment: EquipmentUpgradeState;
  unlockedMines: number[];
  mineUnlockTimers: MineUnlockTimer[];
  ownedEquipment: string[];

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

  ownedItems: import('./types/items').OwnedItem[];
  equippedItems: import('./types/items').EquippedItems;
  slot6Unlocked: boolean;

  craftInventory: Record<string, number>;
  foodInventory: Record<string, number>;
  fuel: import('./types/craft').FuelState;
  materialsShop: import('./types/craft').MaterialsShopState;
  lifeSupport: import('./types/craft').LifeSupportState;
  specialOffers: import('./config/specialOffersConfig').SpecialOffersState;

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

export type CaseLootType = 'cash' | 'gems' | 'itembag' | 'solar_essence';

export interface CaseLootResult {
  type: CaseLootType;
  amount: number;
  label: string;
  labelEn: string;
  labelRu: string;
}

export interface CaseLootTableEntry {
  chance: number;
  type: CaseLootType;
  label: string;
  labelEn: string;
  labelRu: string;
}

export interface CaseOpenResult {
  rarity: CaseRarity;
  loot: { type: CaseLootType; amount: number; label: string };
}
