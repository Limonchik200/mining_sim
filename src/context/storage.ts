import type { GameState, GameStats } from '@/types/player';
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
import { generateSpecialOffers } from '@/config/specialOffersConfig';
import { GENERATOR_TANK_CAPACITY } from '@/config/generatorConfig';
import { gemsForLevel } from '@/config/levelUnlocks';
import {
  dailyCycleKey,
  weeklyCycleKey,
  generateDailyQuests,
  generateWeeklyQuests,
  DAILY_LEVEL_REQUIRED,
  WEEKLY_LEVEL_REQUIRED,
  readStat,
} from '@/features/quests/questData';
import type { QuestsState } from '@/features/quests/types';

export const STORAGE_KEY = 'mining-sim-v3-save';
export const EXPEDITION_REFRESH_MS = 3 * 60 * 60 * 1000;
export const EXPEDITION_SLOTS = 4;
export const MAX_ACTIVE_EXPEDITIONS = 1;

export function generateExpeditionSlots(playerLevel: number): GeneratedExpedition[] {
  // Tier 6 is hidden — only reachable via the Road Map item's
  // expeditionTier6Chance when claiming a completed expedition.
  const availableTiers = Object.values(EXPEDITION_TIERS)
    .filter((t) => t.tier !== 6 && playerLevel >= t.requiredPlayerLevel)
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
    suitcases: 0,
    chronoCapsules: 0,
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
      luckLvl: 0,
      diamondChanceLvl: 0,
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
      oxygenValveOpen: false,
    },
    specialOffers: (() => {
      const gen = generateSpecialOffers(Date.now());
      return gen;
    })(),
    stats: createInitialStats(),
    quests: createInitialQuests(),
    lastSavedAt: Date.now(),
  };
}

export function createInitialQuests(): QuestsState {
  const now = Date.now();
  const emptyStats = createInitialStats();
  return {
    daily: {
      generatedAt: now,
      cycleKey: dailyCycleKey(),
      quests: generateDailyQuests(emptyStats),
      allClaimedRewardClaimed: false,
    },
    weekly: {
      generatedAt: now,
      cycleKey: weeklyCycleKey(),
      quests: generateWeeklyQuests(emptyStats, 1),
      allClaimedRewardClaimed: false,
    },
  };
}

export function createInitialStats(): GameStats {
  return {
    casesCommonOpened: 0,
    casesRareOpened: 0,
    casesEpicOpened: 0,
    casesLegendaryOpened: 0,
    casesEnergyOpened: 0,
    itemBagsOpened: 0,
    itemsOwned: 0,
    itemsRecycled: 0,
    foodSnickersEaten: 0,
    foodJuiceDrunk: 0,
    foodMilkaEaten: 0,
    oreMinedKg: 0,
    moneyEarned: 0,
    totalCasesOpened: 0,
    moneySpentUpgrades: 0,
    moneySpentRepairs: 0,
    gemsSpentSpecialOffers: 0,
    gemsSpentUpgrades: 0,
    daysPlayed: 1,
    energySpent: 0,
    oxygenSpent: 0,
    planksBought: 0,
    logsBought: 0,
    specialOffersBought: 0,
    totalClicks: 0,
    gemsEarned: 0,
    expeditionsTier1: 0,
    expeditionsTier2: 0,
    expeditionsTier3: 0,
    expeditionsTier4: 0,
    expeditionsTier5: 0,
    casesDugCommon: 0,
    casesDugRare: 0,
    casesDugEpic: 0,
    casesDugLegendary: 0,
    lastDayKey: 0,
    repairsMade: 0,
    basketCollected: 0,
    sellsCount: 0,
    purchasesCount: 0,
    energyRestored: 0,
    fuelBoughtLiters: 0,
    generatorEnergyProduced: 0,
    playSeconds: 0,
    dailyRewardsClaimed: 0,
    expeditionCasesEarned: 0,
    materialPacksBought: 0,
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

  if (saved.specialOffers && Array.isArray(saved.specialOffers.offers)) {
    merged.specialOffers = saved.specialOffers;
  } else {
    merged.specialOffers = generateSpecialOffers(Date.now());
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
        oxygenValveOpen: saved.lifeSupport.oxygenValveOpen ?? false,
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
  merged.upgrades.luckLvl = Math.min(merged.upgrades.luckLvl ?? 0, UPGRADE_CONFIG.luck.maxLevel);
  merged.upgrades.diamondChanceLvl = Math.min(merged.upgrades.diamondChanceLvl ?? 0, UPGRADE_CONFIG.diamondChance.maxLevel);

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
  merged.suitcases = saved.suitcases ?? 0;
  merged.chronoCapsules = saved.chronoCapsules ?? 0;

  merged.materials = saved.materials ?? {};
  merged.activeExpeditions = Array.isArray(saved.activeExpeditions)
    ? saved.activeExpeditions.filter((e) => EXPEDITION_TIERS[e.tier] !== undefined)
    : [];
  merged.expeditionRefreshAt = saved.expeditionRefreshAt ?? (Date.now() + EXPEDITION_REFRESH_MS);
  if (!saved.availableExpeditions || saved.availableExpeditions.length === 0) {
    merged.availableExpeditions = generateExpeditionSlots(merged.level);
  } else {
    merged.availableExpeditions = saved.availableExpeditions.filter((e) => EXPEDITION_TIERS[e.tier] !== undefined);
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

  merged.stats = { ...createInitialStats(), ...(saved.stats || {}) };

  // v9.0.0 migration: sync advanced stats with legacy top-level counters.
  // Legacy counters are authoritative — use them directly so the inflated
  // stats from the earlier additive-migration bug are corrected, and both
  // displays stay in sync going forward.
  if (typeof saved.totalDigs === 'number') merged.stats.totalClicks = saved.totalDigs;
  if (typeof saved.totalGemsEarned === 'number') merged.stats.gemsEarned = saved.totalGemsEarned;
  if (typeof saved.totalEarned === 'number') merged.stats.moneyEarned = saved.totalEarned;
  if (typeof saved.totalCasesOpened === 'number') merged.stats.totalCasesOpened = saved.totalCasesOpened;

  const fixQuestStartValues = (quests: any[], stats: GameStats) =>
    quests.map((q) => {
      const currentVal = readStat(stats, q.id);
      // Fix stale placeholder quests that were generated with emptyStats
      // (startValue=0) — re-snapshot so progress only counts from now on.
      if (q.startValue === 0 && currentVal > 0) {
        return { ...q, startValue: currentVal };
      }
      // Clamp startValue if it exceeds current stat (e.g. after a reset).
      if (q.startValue > currentVal) {
        return { ...q, startValue: currentVal };
      }
      return q;
    });

  merged.quests = saved.quests
    ? {
        daily: {
          generatedAt: saved.quests.daily?.generatedAt ?? Date.now(),
          cycleKey: saved.quests.daily?.cycleKey ?? dailyCycleKey(),
          quests: Array.isArray(saved.quests.daily?.quests) && merged.level >= DAILY_LEVEL_REQUIRED
            ? fixQuestStartValues(saved.quests.daily.quests, merged.stats)
            : generateDailyQuests(merged.stats),
          allClaimedRewardClaimed: saved.quests.daily?.allClaimedRewardClaimed ?? false,
        },
        weekly: {
          generatedAt: saved.quests.weekly?.generatedAt ?? Date.now(),
          cycleKey: saved.quests.weekly?.cycleKey ?? weeklyCycleKey(),
          quests: Array.isArray(saved.quests.weekly?.quests) && merged.level >= WEEKLY_LEVEL_REQUIRED
            ? fixQuestStartValues(saved.quests.weekly.quests, merged.stats)
            : generateWeeklyQuests(merged.stats, merged.level),
          allClaimedRewardClaimed: saved.quests.weekly?.allClaimedRewardClaimed ?? false,
        },
      }
    : createInitialQuests();

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
    try {
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
    } catch (migrateErr) {
      console.error('[GameContext] Migration failed, preserving raw save.', migrateErr);
      // Fallback: merge raw saved data as-is onto a fresh base so the player
      // keeps their progress even if a migration step is broken.
      return { ...createInitialState(), ...saved };
    }
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
  gemsEarned?: number;
  newLevels?: number[];
}

export function applyXp(state: GameState, xpGain: number): XpResult {
  let next = { ...state, xp: state.xp + xpGain };
  let leveledUp = false;
  let gemsEarned = 0;
  const newLevels: number[] = [];
  while (next.xp >= xpForLevel(next.level)) {
    next.xp -= xpForLevel(next.level);
    next.level += 1;
    leveledUp = true;
    newLevels.push(next.level);
    const reward = gemsForLevel(next.level);
    gemsEarned += reward;
  }
  if (leveledUp) {
    next.gems += gemsEarned;
    next.totalGemsEarned = (next.totalGemsEarned || 0) + gemsEarned;
  }
  return { state: next, leveledUp, newLevel: next.level, gemsEarned, newLevels };
}
