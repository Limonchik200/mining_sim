export type Lang = 'uk' | 'en' | 'ru';
export type Theme = 'dark' | 'light';
export type Tab = 'mining' | 'shop' | 'upgrades' | 'expeditions' | 'settings';
export type TimeUnit = 'seconds' | 'minutes' | 'hours';

import type { OwnedItem, EquippedItems, ItemEffect } from './items';

export interface UpgradeState {
  activeLeaseMult: number;
  autoLeaseMult: number;
  autoCooldownLvl: number;
  basketCapLvl: number;
  caseChanceLvl: number;
  energyMaxLvl: number;
  energyRegenLvl: number;
  energyRegenAmountLvl?: number;
}

export interface GameState {
  balance: number;
  gems: number;
  energy: number;
  maxEnergy: number;
  activePickaxe: import('./inventory').InventoryItem | null;
  activePickaxeTierId: string;
  sparePickaxes: import('./inventory').InventoryItem[];
  inventory: Record<import('./inventory').ResourceType, { mass: number; count: number }>;
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
  itemBags: number;

  upgrades: UpgradeState;

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
