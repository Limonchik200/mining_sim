import type { GameState } from '@/types';
import { ENERGY_MAX, BASE_AUTO_BASKET_MAX } from '@/config/minesConfig';
import { getPickaxeTier } from '@/config/pickaxesConfig';
import {
  UPGRADE_CONFIG,
  getEnergyMaxValue,
  getBasketCapValue,
  xpForLevel,
} from '@/config/upgradesConfig';
import {
  EXPEDITION_TIERS,
  generateExpedition,
  type GeneratedExpedition,
} from '@/config/expeditions';
import { generateDiesel95Price } from '@/config/fuelConfig';
import { generateMaterialsShopSlots } from '@/config/materialsShopConfig';
import { GENERATOR_TANK_CAPACITY } from '@/config/generatorConfig';

export const STORAGE_KEY = 'mining-sim-v3-save';
export const EXPEDITION_REFRESH_MS = 3 * 60 * 60 * 1000;
export const EXPEDITION_SLOTS = 4;
export const MAX_ACTIVE_EXPEDITIONS = 1;

export function generateExpeditionSlots(playerLevel: number): GeneratedExpedition[] {
  const availableTiers = Object.values(EXPEDITION_TIERS)
    .filter((t) => playerLevel >= t.requiredPlayerLevel)
    .map((t) => t.tier);
  if (availableTiers.length === 0) availableTiers.push(1);
  const slots: GeneratedExpedition[] = [];
  for (let i = 0; i < EXPEDITION_SLOTS; i++) {
    const tier = availableTiers[Math.floor(Math.random() * availableTiers.length)];
    slots.push(generateExpedition(tier));
  }
  return slots;
}

export function createInitialState(): GameState {
  return {
    balance: 0,
    gems: 0,
    energy: ENERGY_MAX,
    maxEnergy: ENERGY_MAX,
    activePickaxe: {
      id: 'starter-rusty',
      pickaxeTierId: 'rusty',
      name: 'Rusty Pickaxe',
      durability: 600,
      maxDurability: 600,
    },
    activePickaxeTierId: 'rusty',
    sparePickaxes: [],
    inventory: {
      stone: { mass: 0, count: 0 },
      coal: { mass: 0, count: 0 },
      copper: { mass: 0, count: 0 },
      iron: { mass: 0, count: 0 },
      silver: { mass: 0, count: 0 },
      gold: { mass: 0, count: 0 },
    },
    autoBasket: [],
    autoBasketMax: BASE_AUTO_BASKET_MAX,
    activeLeaseEndsAt: null,
    activeLeaseTotal: 0,
    activeLeaseMineId: 1,
    autoMiningEndsAt: null,
    autoMiningTotal: 0,
    autoLeaseMineId: 1,
    lastAutoDigAt: Date.now(),
    buffs: [],
    lastEnergyRegenAt: Date.now(),
    totalDigs: 0,
    totalEarned: 0,
    totalCasesOpened: 0,
    totalGemsEarned: 0,
    level: 1,
    xp: 0,
    cases: [],
    autoBasketCases: [],
    itemBags: 0,
    upgrades: {
      activeLeaseMult: 0,
      autoLeaseMult: 0,
      autoCooldownLvl: 0,
      basketCapLvl: 0,
      caseChanceLvl: 0,
      energyMaxLvl: 0,
      energyRegenLvl: 0,
      energyRegenAmountLvl: 0,
      backpackLvl: 0,
    },
    starterGiftClaimed: false,
    redeemedPromoCodes: [],
    ownedPickaxes: ['shovel', 'rusty'],
    currentMineId: 1,
    dailyCalendar: {
      lastClaimDay: 0,
      lastClaimTimestamp: null,
    },
    settings: {
      lang: 'uk',
      theme: 'dark',
    },
    materials: {},
    availableExpeditions: [],
    activeExpeditions: [],
    expeditionRefreshAt: Date.now() + EXPEDITION_REFRESH_MS,
    ownedItems: [],
    equippedItems: [null, null, null, null, null, null],
    slot6Unlocked: false,
    equipment: {
      helmetLevel: 0,
      flashlightLevel: 0,
      glovesLevel: 0,
      respiratorLevel: 0,
      respiratorFilterPurchased: false,
      lightingLevel: 0,
      ventilationLevel: 1,
      railsCount: 0,
      cartStationPurchased: false,
      woodenBracingCount: 0,
    },
    unlockedMines: [0, 1],
    mineUnlockTimers: [],
    ownedEquipment: [],
    craftInventory: {},
    foodInventory: {},
    fuel: {
      canisters: [],
      diesel95Price: generateDiesel95Price(),
      diesel95PriceUpdatedAt: Date.now(),
      diesel100Available: false,
    },
    materialsShop: (() => {
      const gen = generateMaterialsShopSlots(Date.now());
      return { slots: gen.slots, refreshedAt: Date.now(), nextRefreshAt: gen.nextRefreshAt };
    })(),
    lifeSupport: {
      oxygenTanks: [],
      batteries: [],
      coolers: [],
      generator: {
        purchased: false,
        fuelLiters: 0,
        tankCapacity: GENERATOR_TANK_CAPACITY,
        active: false,
        lithiumBatteryIds: [],
      },
      ownedOxygenTypes: [],
      ownedCoolerTypes: [],
      ownedBatteryTypes: [],
      shelfCount: 1,
      activeBatteryId: null,
      activeOxygenTankId: null,
      activeCoolerId: null,
    },
    lastSavedAt: Date.now(),
  };
}

export function migrateState(saved: Partial<GameState>): GameState {
  const base = createInitialState();
  const merged: GameState = {
    ...base,
    ...saved,
    settings: { ...base.settings, ...saved.settings },
    inventory: { ...base.inventory, ...saved.inventory },
    upgrades: { ...base.upgrades, ...(saved.upgrades || {}) },
    equipment: {
      ...base.equipment,
      ...(saved.equipment || {}),
      ventilationLevel: saved.equipment?.ventilationLevel ?? 1,
    },
  };

  merged.unlockedMines = Array.isArray(saved.unlockedMines) && saved.unlockedMines.length > 0
    ? saved.unlockedMines
    : [0, 1];
  merged.mineUnlockTimers = Array.isArray(saved.mineUnlockTimers) ? saved.mineUnlockTimers : [];
  merged.ownedEquipment = Array.isArray(saved.ownedEquipment) ? saved.ownedEquipment : [];

  merged.craftInventory = (saved.craftInventory && typeof saved.craftInventory === 'object') ? saved.craftInventory : {};
  merged.foodInventory = (saved.foodInventory && typeof saved.foodInventory === 'object') ? saved.foodInventory : {};
  merged.fuel = saved.fuel
    ? {
        canisters: Array.isArray(saved.fuel.canisters) ? saved.fuel.canisters : [],
        diesel95Price: typeof saved.fuel.diesel95Price === 'number' ? saved.fuel.diesel95Price : generateDiesel95Price(),
        diesel95PriceUpdatedAt: saved.fuel.diesel95PriceUpdatedAt ?? Date.now(),
        diesel100Available: false,
      }
    : base.fuel;
  if (saved.materialsShop && Array.isArray(saved.materialsShop.slots)) {
    merged.materialsShop = saved.materialsShop;
  } else {
    const gen = generateMaterialsShopSlots(Date.now());
    merged.materialsShop = { slots: gen.slots, refreshedAt: Date.now(), nextRefreshAt: gen.nextRefreshAt };
  }

  merged.lifeSupport = saved.lifeSupport
    ? {
        oxygenTanks: Array.isArray(saved.lifeSupport.oxygenTanks) ? saved.lifeSupport.oxygenTanks : [],
        batteries: Array.isArray(saved.lifeSupport.batteries) ? saved.lifeSupport.batteries : [],
        coolers: Array.isArray(saved.lifeSupport.coolers) ? saved.lifeSupport.coolers : [],
        generator: {
          purchased: saved.lifeSupport.generator?.purchased ?? false,
          fuelLiters: saved.lifeSupport.generator?.fuelLiters ?? 0,
          tankCapacity: GENERATOR_TANK_CAPACITY,
          active: saved.lifeSupport.generator?.active ?? false,
          lithiumBatteryIds: Array.isArray(saved.lifeSupport.generator?.lithiumBatteryIds) ? saved.lifeSupport.generator.lithiumBatteryIds : [],
        },
        ownedOxygenTypes: Array.isArray(saved.lifeSupport.ownedOxygenTypes) ? saved.lifeSupport.ownedOxygenTypes : [],
        ownedCoolerTypes: Array.isArray(saved.lifeSupport.ownedCoolerTypes) ? saved.lifeSupport.ownedCoolerTypes : [],
        ownedBatteryTypes: Array.isArray(saved.lifeSupport.ownedBatteryTypes) ? saved.lifeSupport.ownedBatteryTypes : [],
        shelfCount: typeof saved.lifeSupport.shelfCount === 'number' ? Math.min(Math.max(saved.lifeSupport.shelfCount, 1), 6) : 1,
        activeBatteryId: saved.lifeSupport.activeBatteryId ?? null,
        activeOxygenTankId: saved.lifeSupport.activeOxygenTankId ?? null,
        activeCoolerId: saved.lifeSupport.activeCoolerId ?? null,
      }
    : base.lifeSupport;

  merged.activeLeaseMineId = saved.activeLeaseMineId ?? base.activeLeaseMineId;
  merged.autoLeaseMineId = saved.autoLeaseMineId ?? base.autoLeaseMineId;

  merged.upgrades.activeLeaseMult = Math.min(merged.upgrades.activeLeaseMult, UPGRADE_CONFIG.activeLeaseMult.maxLevel);
  merged.upgrades.autoLeaseMult = Math.min(merged.upgrades.autoLeaseMult, UPGRADE_CONFIG.autoLeaseMult.maxLevel);
  merged.upgrades.autoCooldownLvl = Math.min(merged.upgrades.autoCooldownLvl, UPGRADE_CONFIG.autoCooldown.maxLevel);
  merged.upgrades.basketCapLvl = Math.min(merged.upgrades.basketCapLvl, UPGRADE_CONFIG.basketCap.maxLevel);
  merged.upgrades.caseChanceLvl = Math.min(merged.upgrades.caseChanceLvl, UPGRADE_CONFIG.caseChance.maxLevel);
  merged.upgrades.energyMaxLvl = Math.min(merged.upgrades.energyMaxLvl, UPGRADE_CONFIG.energyMax.maxLevel);
  merged.upgrades.energyRegenLvl = Math.min(merged.upgrades.energyRegenLvl, UPGRADE_CONFIG.energyRegen.maxLevel);
  merged.upgrades.energyRegenAmountLvl = Math.min(merged.upgrades.energyRegenAmountLvl ?? 0, UPGRADE_CONFIG.energyRegenAmount.maxLevel);
  merged.upgrades.backpackLvl = Math.min(merged.upgrades.backpackLvl ?? 0, UPGRADE_CONFIG.backpack.maxLevel);

  merged.maxEnergy = getEnergyMaxValue(merged.upgrades.energyMaxLvl);
  if (merged.energy > merged.maxEnergy) merged.energy = merged.maxEnergy;

  merged.autoBasketMax = getBasketCapValue(merged.upgrades.basketCapLvl);

  merged.autoBasket = Array.isArray(saved.autoBasket) ? saved.autoBasket : [];
  merged.autoBasketCases = Array.isArray(saved.autoBasketCases) ? saved.autoBasketCases : [];
  merged.cases = Array.isArray(saved.cases) ? saved.cases : [];
  merged.sparePickaxes = Array.isArray(merged.sparePickaxes) ? merged.sparePickaxes : [];

  const ownedSet = new Set(merged.ownedPickaxes || []);
  ownedSet.add('rusty');
  ownedSet.add('shovel');
  merged.ownedPickaxes = Array.from(ownedSet);
  merged.itemBags = saved.itemBags ?? 0;

  merged.materials = saved.materials ?? {};
  merged.activeExpeditions = saved.activeExpeditions ?? [];
  merged.expeditionRefreshAt = saved.expeditionRefreshAt ?? (Date.now() + EXPEDITION_REFRESH_MS);
  if (!saved.availableExpeditions || saved.availableExpeditions.length === 0) {
    merged.availableExpeditions = generateExpeditionSlots(merged.level);
  } else {
    merged.availableExpeditions = saved.availableExpeditions;
  }

  if (merged.activePickaxe) {
    if (merged.activePickaxeTierId === 'shovel') {
      merged.activePickaxeTierId = 'rusty';
    }
    const tier = getPickaxeTier(merged.activePickaxeTierId);
    merged.activePickaxe.maxDurability = tier.maxDurability;
    merged.activePickaxe.name = merged.settings.lang === 'ru' ? tier.nameRu : (merged.settings.lang === 'uk' ? tier.nameUk : tier.nameEn);
    if (merged.activePickaxe.durability > tier.maxDurability) {
      merged.activePickaxe.durability = tier.maxDurability;
    }
    if (merged.activePickaxe.pickaxeTierId === 'shovel') {
      merged.activePickaxe.pickaxeTierId = 'rusty';
      merged.activePickaxe.durability = tier.maxDurability;
    }
  }

  merged.ownedItems = saved.ownedItems ?? [];
  merged.equippedItems = saved.equippedItems ?? [null, null, null, null, null, null];
  while (merged.equippedItems.length < 6) merged.equippedItems.push(null);
  merged.slot6Unlocked = saved.slot6Unlocked ?? false;

  merged.sparePickaxes = merged.sparePickaxes.map((px) => {
    const tier = getPickaxeTier(px.pickaxeTierId);
    return {
      ...px,
      maxDurability: tier.maxDurability,
      name: merged.settings.lang === 'ru' ? tier.nameRu : (merged.settings.lang === 'uk' ? tier.nameUk : tier.nameEn),
      durability: Math.min(px.durability, tier.maxDurability),
    };
  });

  return merged;
}

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      console.log('[GameContext] No save found, starting fresh.');
      return createInitialState();
    }
    const saved = JSON.parse(raw) as Partial<GameState>;
    const migrated = migrateState(saved);
    console.log('[GameContext] Save loaded.', {
      level: migrated.level,
      balance: migrated.balance,
      gems: migrated.gems,
      ownedItems: migrated.ownedItems.length,
      equippedItems: migrated.equippedItems.filter(Boolean).length,
      savedAt: new Date(migrated.lastSavedAt).toISOString(),
    });
    return migrated;
  } catch (e) {
    console.error('[GameContext] Failed to load save, starting fresh.', e);
    return createInitialState();
  }
}

export function saveState(state: GameState) {
  try {
    const toSave = { ...state, lastSavedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error('[GameContext] Failed to save state.', e);
  }
}

export interface XpResult {
  state: GameState;
  leveledUp: boolean;
  newLevel: number;
}

export function applyXp(state: GameState, xpGain: number): XpResult {
  let next = { ...state, xp: state.xp + xpGain };
  let leveledUp = false;
  while (next.xp >= xpForLevel(next.level)) {
    next.xp -= xpForLevel(next.level);
    next.level += 1;
    leveledUp = true;
  }
  return { state: next, leveledUp, newLevel: next.level };
}
