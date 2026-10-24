export type Lang = 'uk' | 'en' | 'ru';
export type Theme = 'dark' | 'light';
export type Tab = 'mining' | 'shop' | 'upgrades' | 'expeditions' | 'settings';
export type TimeUnit = 'seconds' | 'minutes' | 'hours';

import type { OwnedItem, EquippedItems, ItemEffect } from './items';
import type { FuelState, MaterialsShopState, LifeSupportState, SpecialOffersState } from './craft';

export interface UpgradeState {
  activeLeaseMult: number;
  autoLeaseMult: number;
  autoCooldownLvl: number;
  basketCapLvl: number;
  caseChanceLvl: number;
  energyMaxLvl: number;
  energyRegenLvl: number;
  energyRegenAmountLvl?: number;
  backpackLvl?: number;
  luckLvl?: number;
  diamondChanceLvl?: number;
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

export interface MineUnlockTimer {
  mineId: number;
  startedAt: number;
  durationMs: number;
}

export interface GameState {
  balance: number;
  gems: number;
  energy: number;
  maxEnergy: number;
  activePickaxe: import('./inventory').InventoryItem | null;
  activePickaxeTierId: string;
  sparePickaxes: import('./inventory').InventoryItem[];
  inventory: Record<string, { mass: number; count: number }>;
  autoBasket: import('./inventory').AutoBasketItem[];
  autoBasketMax: number;

  activeLeaseEndsAt: number | null;
  activeLeaseTotal: number;
  autoMiningEndsAt: number | null;
  autoMiningTotal: number;
  lastAutoDigAt: number;

  buffs: import('./inventory').ActiveBuff[];
  lastEnergyRegenAt: number;

  totalDigs: number;
  totalEarned: number;
  totalCasesOpened: number;
  totalGemsEarned: number;

  level: number;
  xp: number;

  cases: import('./inventory').CaseItem[];
  autoBasketCases: import('./inventory').CaseItem[];
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
    lastClaimDay: number;
    lastClaimTimestamp: number | null;
  };

  settings: {
    lang: Lang;
    theme: Theme;
  };

  materials: Record<string, number>;
  availableExpeditions: import('../config/expeditions').GeneratedExpedition[];
  activeExpeditions: import('../config/expeditions').GeneratedExpedition[];
  expeditionRefreshAt: number;

  ownedItems: OwnedItem[];
  equippedItems: EquippedItems;
  slot6Unlocked: boolean;

  craftInventory: Record<string, number>;
  foodInventory: Record<string, number>;
  fuel: FuelState;
  materialsShop: MaterialsShopState;
  lifeSupport: LifeSupportState;
  specialOffers: SpecialOffersState;

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
