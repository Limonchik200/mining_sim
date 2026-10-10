import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  useState,
  type ReactNode,
} from 'react';
import type {
  GameState,
  Notification,
  FloatText,
  Lang,
  Theme,
  TimeUnit,
  ResourceType,
  Tab,
  CaseRarity,
  Resource,
  CaseOpenResult,
} from '@/types';
import {
  ENERGY_MAX,
  ENERGY_REGEN_SECONDS,
  DIG_COOLDOWN_MS,
  BASE_AUTO_BASKET_MAX,
  MIN_LEASE_SECONDS,
  RESOURCES,
  RESOURCE_LIST,
  getRandomResourceForMine,
  getRandomMass,
  rollDiamondDrop,
} from '@/config/minesConfig';
import {
  ACTIVE_LEASE_PRICE_PER_SEC,
  AUTO_LEASE_PRICE_PER_SEC,
  STARTER_GIFT_SECONDS,
  PICKAXE_TIERS,
  getPickaxeTier,
  FOOD_ITEMS,
  getRepairCost,
  getActiveLeasePricePerSec,
  getAutoLeasePricePerSec,
  getFoodPrice,
} from '@/config/pickaxesConfig';
import { ADM_XP_CODE, ADM_XP_REWARD, findPromoCode } from '@/config/promocodesConfig';
import { isDumpMine } from '@/config/minesConfig';
import {
  CASE_RARITIES,
  rollCaseDrop,
  rollCaseRarity,
  openCaseLoot,
} from '@/config/casesConfig';
import {
  UPGRADE_CONFIG,
  xpForLevel,
  getLeaseMultValue,
  getLeaseMultCost,
  getAutoCooldownCost,
  getAutoCooldownMs,
  getBasketCapCost,
  getBasketCapValue,
  getCaseChanceCost,
  getEnergyMaxCost,
  getEnergyMaxValue,
  getEnergyRegenCost,
  getEnergyRegenValue,
  getEnergyRegenAmountCost,
  getEnergyRegenAmountValue,
  isEnergyUpgradeDiamond,
  getEnergyUpgradeDiamondCost,
} from '@/config/upgradesConfig';
import { DAILY_REWARDS, DAILY_CLAIM_COOLDOWN_MS, getDailyRewardScaled, type DailyReward } from '@/config/rewardsConfig';
import { convertToSeconds } from '@/config';
import { translations, type TranslationKey } from '@/i18n';
import {
  EXPEDITION_TIERS,
  generateExpedition,
  MATERIALS_CONFIG,
  type GeneratedExpedition,
  type MaterialId,
} from '@/config/expeditions';
import {
  ITEM_TYPES,
  rollItemFromBag,
  getItemEffect,
  UPGRADE_COSTS,
  getItemName,
  getItemLevelName,
  type MaterialCost,
} from '@/config/itemsConfig';
import type { OwnedItem, EquippedItems, ItemEffect, ItemType, ItemLevel } from '@/types/items';

export type { CaseOpenResult };

const STORAGE_KEY = 'mining-sim-v3-save';
const EXPEDITION_REFRESH_MS = 3 * 60 * 60 * 1000;
const EXPEDITION_SLOTS = 4;
const MAX_ACTIVE_EXPEDITIONS = 1;

function generateExpeditionSlots(playerLevel: number): GeneratedExpedition[] {
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

function createInitialState(): GameState {
  return {
    balance: 0,
    gems: 0,
    energy: ENERGY_MAX,
    maxEnergy: ENERGY_MAX,
    activePickaxe: {
      id: 'starter-shovel',
      pickaxeTierId: 'shovel',
      name: 'Shovel',
      durability: 999999,
      maxDurability: 999999,
    },
    activePickaxeTierId: 'shovel',
    sparePickaxes: [],
    inventory: {
      stone: { mass: 0, count: 0 },
      coal: { mass: 0, count: 0 },
      copper: { mass: 0, count: 0 },
      iron: { mass: 0, count: 0 },
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
    },
    starterGiftClaimed: false,
    redeemedPromoCodes: [],
    ownedPickaxes: ['shovel', 'rusty'],
    currentMineId: 0,
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
    lastSavedAt: Date.now(),
  };
}

function migrateState(saved: Partial<GameState>): GameState {
  const base = createInitialState();
  const merged: GameState = {
    ...base,
    ...saved,
    settings: { ...base.settings, ...saved.settings },
    inventory: { ...base.inventory, ...saved.inventory },
    upgrades: { ...base.upgrades, ...(saved.upgrades || {}) },
  };

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

  merged.maxEnergy = getEnergyMaxValue(merged.upgrades.energyMaxLvl);
  if (merged.energy > merged.maxEnergy) merged.energy = merged.maxEnergy;

  merged.autoBasketMax = getBasketCapValue(merged.upgrades.basketCapLvl);

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
    const tier = getPickaxeTier(merged.activePickaxeTierId);
    merged.activePickaxe.maxDurability = tier.maxDurability;
    merged.activePickaxe.name = merged.settings.lang === 'ru' ? tier.nameRu : (merged.settings.lang === 'uk' ? tier.nameUk : tier.nameEn);
    if (merged.activePickaxe.durability > tier.maxDurability) {
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

function loadState(): GameState {
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

function saveState(state: GameState) {
  try {
    const toSave = { ...state, lastSavedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error('[GameContext] Failed to save state.', e);
  }
}

interface GameContextValue {
  state: GameState;
  notifications: Notification[];
  floatTexts: FloatText[];
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  dig: (x?: number, y?: number) => void;
  collectBasket: () => void;
  buyActiveLease: (value: number, unit: TimeUnit) => void;
  buyAutoLease: (value: number, unit: TimeUnit) => void;
  confirmLeasePurchase: () => void;
  cancelLeasePurchase: () => void;
  pendingLeasePurchase: { type: 'active' | 'auto'; value: number; unit: TimeUnit } | null;
  buyFood: (foodId: string) => void;
  buyPickaxe: (tierId: string) => void;
  switchPickaxe: (pickaxeId: string) => void;
  equipPickaxe: (tierId: string) => void;
  sellResource: (type: ResourceType) => void;
  sellAll: () => void;
  setLang: (lang: Lang) => void;
  setTheme: (theme: Theme) => void;
  resetGame: () => void;
  t: (key: TranslationKey) => string;
  lang: Lang;
  theme: Theme;
  claimStarterGift: () => void;
  redeemPromoCode: (code: string) => string | null;
  upgradeActiveLeaseMult: () => void;
  upgradeAutoLeaseMult: () => void;
  upgradeAutoCooldown: () => void;
  upgradeBasketCap: () => void;
  upgradeCaseChance: () => void;
  openCase: (caseId: string) => CaseOpenResult | null;
  openAllCases: () => CaseOpenResult[];
  openCasesByRarity: (rarity: CaseRarity) => CaseOpenResult[];
  backpackOpen: boolean;
  setBackpackOpen: (open: boolean) => void;
  currentAutoCooldownMs: number;
  currentBasketCap: number;
  activeLeaseMult: number;
  autoLeaseMult: number;
  currentMineId: number;
  setCurrentMineId: (id: number) => void;
  repairActivePickaxe: () => void;
  upgradeEnergyMax: () => void;
  upgradeEnergyRegen: () => void;
  upgradeEnergyRegenAmount: () => void;
  currentEnergyRegenAmount: number;
  claimDailyReward: () => void;
  currentEnergyMax: number;
  currentEnergyRegenSeconds: number;
  startExpedition: (expeditionId: string) => void;
  claimExpedition: (expeditionId: string) => void;
  refreshExpeditions: () => void;
  itemsOpen: boolean;
  setItemsOpen: (open: boolean) => void;
  openItemBag: () => void;
  equipItem: (uid: string, slot: number) => void;
  unequipItem: (slot: number) => void;
  upgradeItem: (uid: string) => void;
  unlockSlot6: () => void;
  isSlotUnlocked: (slot: number) => boolean;
  totalItemEffects: ItemEffect;
}

const GameContext = createContext<GameContextValue | null>(null);

let notifIdCounter = 0;
let floatIdCounter = 0;

interface XpResult {
  state: GameState;
  leveledUp: boolean;
  newLevel: number;
}

function applyXp(state: GameState, xpGain: number): XpResult {
  let next = { ...state, xp: state.xp + xpGain };
  let leveledUp = false;
  while (next.xp >= xpForLevel(next.level)) {
    next.xp -= xpForLevel(next.level);
    next.level += 1;
    leveledUp = true;
  }
  return { state: next, leveledUp, newLevel: next.level };
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(loadState);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [floatTexts, setFloatTexts] = useState<FloatText[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('mining');
  const [pendingLeasePurchase, setPendingLeasePurchase] = useState<{ type: 'active' | 'auto'; value: number; unit: TimeUnit } | null>(null);
  const stateRef = useRef(state);
  const lastTickRef = useRef(Date.now());
  const lastDigRef = useRef(0);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const lang = state.settings.lang;
  const theme = state.settings.theme;

  const tr = useCallback(
    (key: TranslationKey) => translations[lang][key] || translations.en[key] || key,
    [lang]
  );

  const notifThrottleRef = useRef<Record<string, number>>({});
  const pushNotification = useCallback((notif: Omit<Notification, 'id'>) => {
    const now = Date.now();
    const key = notif.type + ':' + notif.message;
    const last = notifThrottleRef.current[key] || 0;
    if (now - last < 300) return;
    notifThrottleRef.current[key] = now;

    const id = ++notifIdCounter;
    setNotifications((prev) => [...prev.slice(-4), { ...notif, id }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3500);
  }, []);

  const pushFloatText = useCallback((text: string, x: number, y: number, color: string) => {
    const id = ++floatIdCounter;
    setFloatTexts((prev) => [...prev.slice(-8), { id, text, x, y, color }]);
    setTimeout(() => {
      setFloatTexts((prev) => prev.filter((f) => f.id !== id));
    }, 1500);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  useEffect(() => {
    const interval = setInterval(() => saveState(stateRef.current), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = () => {
      if (!document.hidden) {
        lastTickRef.current = Date.now() - 1000;
      }
      if (document.hidden) saveState(stateRef.current);
    };
    document.addEventListener('visibilitychange', handler);
    window.addEventListener('pagehide', () => saveState(stateRef.current));
    return () => {
      document.removeEventListener('visibilitychange', handler);
      saveState(stateRef.current);
    };
  }, []);

  const currentAutoCooldownMs = getAutoCooldownMs(state.upgrades.autoCooldownLvl);
  const currentBasketCap = getBasketCapValue(state.upgrades.basketCapLvl);
  const activeLeaseMult = getLeaseMultValue('activeLeaseMult', state.upgrades.activeLeaseMult);
  const autoLeaseMult = getLeaseMultValue('autoLeaseMult', state.upgrades.autoLeaseMult);
  const currentEnergyMaxBase = getEnergyMaxValue(state.upgrades.energyMaxLvl);
  const currentEnergyRegenSeconds = getEnergyRegenValue(state.upgrades.energyRegenLvl);
  const currentEnergyRegenAmountBase = getEnergyRegenAmountValue(state.upgrades.energyRegenAmountLvl ?? 0);

  const totalItemEffects: ItemEffect = (() => {
    const agg: ItemEffect = {
      activeLeaseMultBonus: 0,
      energyMaxBonus: 0,
      energyRegenBonus: 0,
      foodBonusPct: 0,
      sellMultBonus: 0,
      expeditionTimeReductionPct: 0,
      expeditionRefreshReductionPct: 0,
      expeditionLootChance: 0,
      expeditionLootMult: 1,
    };
    const seenTypes = new Set<ItemType>();
    for (const uid of state.equippedItems) {
      if (!uid) continue;
      const item = state.ownedItems.find((o) => o.uid === uid);
      if (!item) continue;
      if (seenTypes.has(item.type)) continue;
      seenTypes.add(item.type);
      const eff = getItemEffect(item.type, item.level);
      agg.activeLeaseMultBonus += eff.activeLeaseMultBonus;
      agg.energyMaxBonus += eff.energyMaxBonus;
      agg.energyRegenBonus += eff.energyRegenBonus;
      agg.foodBonusPct += eff.foodBonusPct;
      agg.sellMultBonus += eff.sellMultBonus;
      agg.expeditionTimeReductionPct += eff.expeditionTimeReductionPct;
      agg.expeditionRefreshReductionPct += eff.expeditionRefreshReductionPct;
      agg.expeditionLootChance = Math.max(agg.expeditionLootChance, eff.expeditionLootChance);
      agg.expeditionLootMult = Math.max(agg.expeditionLootMult, eff.expeditionLootMult);
    }
    return agg;
  })();

  const currentEnergyMax = currentEnergyMaxBase + totalItemEffects.energyMaxBonus;
  const currentEnergyRegenAmount = currentEnergyRegenAmountBase + totalItemEffects.energyRegenBonus;
  const [currentMineIdState, setCurrentMineIdState] = useState<number>(state.currentMineId || 1);

  const setCurrentMineId = useCallback((id: number) => {
    const current = stateRef.current;
    const now = Date.now();
    if (
      current.activeLeaseEndsAt && current.activeLeaseEndsAt > now &&
      (current.activeLeaseMineId || 1) !== id
    ) {
      pushNotification({ message: lang === 'ru' ? 'Активная аренда на другой шахте — копать не получится. Купите аренду здесь.' : (lang === 'uk' ? 'Активна аренда на іншій шахті — копати не вийде. Купіть аренду тут.' : 'Active lease is on another mine — you cannot dig here. Buy a lease for this mine.'), type: 'warning' });
    }
    if (
      current.autoMiningEndsAt && current.autoMiningEndsAt > now &&
      (current.autoLeaseMineId || 1) !== id
    ) {
      pushNotification({ message: lang === 'ru' ? 'Авто-аренда работает на другой шахте.' : (lang === 'uk' ? 'Авто-оренда працює на іншій шахті.' : 'Auto-lease is running on another mine.'), type: 'warning' });
    }
    setCurrentMineIdState(id);
    setState((prev) => ({ ...prev, currentMineId: id }));
  }, [pushNotification, lang]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const prev = lastTickRef.current;
      lastTickRef.current = now;
      const deltaSec = (now - prev) / 1000;

      setState((prev) => {
        let next = { ...prev };
        let changed = false;

        const tickItemEffects: ItemEffect = (() => {
          const agg: ItemEffect = {
            activeLeaseMultBonus: 0, energyMaxBonus: 0, energyRegenBonus: 0,
            foodBonusPct: 0, sellMultBonus: 0, expeditionTimeReductionPct: 0,
            expeditionRefreshReductionPct: 0, expeditionLootChance: 0, expeditionLootMult: 1,
          };
          const seen = new Set<ItemType>();
          for (const eid of prev.equippedItems) {
            if (!eid) continue;
            const it = prev.ownedItems.find((o) => o.uid === eid);
            if (!it || seen.has(it.type)) continue;
            seen.add(it.type);
            const e = getItemEffect(it.type, it.level);
            agg.energyMaxBonus += e.energyMaxBonus;
            agg.energyRegenBonus += e.energyRegenBonus;
            agg.foodBonusPct += e.foodBonusPct;
          }
          return agg;
        })();

        const effectiveMaxEnergy = prev.maxEnergy + tickItemEffects.energyMaxBonus;
        if (prev.energy < effectiveMaxEnergy) {
          const activeBuffs = next.buffs.filter((b) => b.expiresAt > now);
          let totalRegenMult = 1;
          for (const buff of activeBuffs) {
            totalRegenMult += buff.regenMultiplier;
          }
          if (activeBuffs.length !== next.buffs.length) {
            next.buffs = activeBuffs;
            changed = true;
          }
          const regenSeconds = getEnergyRegenValue(next.upgrades.energyRegenLvl);
          const regenMult = getEnergyRegenAmountValue(next.upgrades.energyRegenAmountLvl ?? 0) + tickItemEffects.energyRegenBonus;
          const regenAmount = (deltaSec / regenSeconds) * totalRegenMult * regenMult;
          const newEnergy = Math.min(effectiveMaxEnergy, next.energy + regenAmount);
          if (newEnergy !== next.energy) {
            next.energy = newEnergy;
            changed = true;
          }
        }

        if (next.activeLeaseEndsAt && now > next.activeLeaseEndsAt) {
          next.activeLeaseEndsAt = null;
          next.activeLeaseTotal = 0;
          changed = true;
          pushNotification({ message: tr('notifLeaseExpired'), type: 'warning' });
        }
        if (next.autoMiningEndsAt && now > next.autoMiningEndsAt) {
          next.autoMiningEndsAt = null;
          next.autoMiningTotal = 0;
          changed = true;
          pushNotification({ message: tr('notifAutoLeaseExpired'), type: 'warning' });
        }

        if (next.expeditionRefreshAt && now > next.expeditionRefreshAt) {
          next.availableExpeditions = generateExpeditionSlots(next.level);
          next.expeditionRefreshAt = now + EXPEDITION_REFRESH_MS;
          changed = true;
          pushNotification({ message: tr('expeditionsRefreshed'), type: 'info' });
        }

        if (next.level >= 3 && next.availableExpeditions.length === 0) {
          next.availableExpeditions = generateExpeditionSlots(next.level);
          next.expeditionRefreshAt = now + EXPEDITION_REFRESH_MS;
          changed = true;
        }

        if (next.autoMiningEndsAt && now < next.autoMiningEndsAt) {
          const autoCooldown = getAutoCooldownMs(next.upgrades.autoCooldownLvl);
          const basketCap = getBasketCapValue(next.upgrades.basketCapLvl);
          const tier = getPickaxeTier(next.activePickaxeTierId);
          const elapsedSinceDig = now - next.lastAutoDigAt;

          if (
            elapsedSinceDig >= autoCooldown &&
            next.autoBasket.length < basketCap &&
            next.activePickaxe &&
            next.activePickaxe.durability >= tier.durabilityCost
          ) {
            const missedDigs = Math.min(
              Math.floor(elapsedSinceDig / autoCooldown),
              basketCap - next.autoBasket.length
            );
            let basket = [...next.autoBasket];
            let activePickaxe = { ...next.activePickaxe };
            let sparePickaxes = [...next.sparePickaxes];
            let totalDigs = next.totalDigs;
            let pickaxeBroken = false;

            for (let i = 0; i < missedDigs; i++) {
              if (basket.length >= basketCap) break;
              if (!activePickaxe || activePickaxe.durability < tier.durabilityCost) {
                pickaxeBroken = true;
                break;
              }

              const resource = getRandomResourceForMine(next.autoLeaseMineId || 1);
              const mass = Math.round(getRandomMass(resource) * tier.yieldMultiplier * 100) / 100;
              basket.push({ resource: resource.type, mass, xp: resource.xp, timestamp: now });
              totalDigs++;

              const newDur = activePickaxe.durability - tier.durabilityCost;
              if (newDur <= 0) {
                if (sparePickaxes.length > 0) {
                  const spare = sparePickaxes[0];
                  activePickaxe = { ...spare };
                  sparePickaxes = sparePickaxes.slice(1);
                } else {
                  activePickaxe = { ...activePickaxe, durability: 0 };
                  pickaxeBroken = true;
                  break;
                }
              } else {
                activePickaxe = { ...activePickaxe, durability: newDur };
              }

              if (rollCaseDrop(next.upgrades.caseChanceLvl)) {
                const rarity = rollCaseRarity();
                next.cases = [...next.cases, { id: `case-${now}-${i}-${Math.random()}`, rarity, opened: false }];
              }
            }

            next.autoBasket = basket;
            next.activePickaxe = activePickaxe;
            next.sparePickaxes = sparePickaxes;
            next.totalDigs = totalDigs;
            next.lastAutoDigAt = now;

            if (pickaxeBroken && !sparePickaxes.length) {
              pushNotification({ message: tr('notifNoSparePickaxe'), type: 'error' });
            }
            if (next.autoBasket.length >= basketCap) {
              pushNotification({ message: tr('notifBasketFull'), type: 'warning' });
            }
            changed = true;
          }
        }

        return changed ? next : prev;
      });
    }, 250);

    return () => clearInterval(interval);
  }, [pushNotification, tr]);

  useEffect(() => {
    const saved = stateRef.current;
    const now = Date.now();
    const lastSaved = saved.lastSavedAt;
    if (!lastSaved || now - lastSaved < 2000) return;

    const offlineSec = (now - lastSaved) / 1000;
    let changed = false;

    setState((prev) => {
      let next = { ...prev };

      if (next.energy < next.maxEnergy) {
        const offlineItemEffects: ItemEffect = (() => {
          const agg: ItemEffect = {
            activeLeaseMultBonus: 0, energyMaxBonus: 0, energyRegenBonus: 0,
            foodBonusPct: 0, sellMultBonus: 0, expeditionTimeReductionPct: 0,
            expeditionRefreshReductionPct: 0, expeditionLootChance: 0, expeditionLootMult: 1,
          };
          const seen = new Set<ItemType>();
          for (const eid of prev.equippedItems) {
            if (!eid) continue;
            const it = prev.ownedItems.find((o) => o.uid === eid);
            if (!it || seen.has(it.type)) continue;
            seen.add(it.type);
            const e = getItemEffect(it.type, it.level);
            agg.energyMaxBonus += e.energyMaxBonus;
            agg.energyRegenBonus += e.energyRegenBonus;
          }
          return agg;
        })();
        const effectiveMax = next.maxEnergy + offlineItemEffects.energyMaxBonus;
        const activeBuffs = next.buffs.filter((b) => b.expiresAt > now);
        let totalRegenMult = 1;
        for (const buff of activeBuffs) totalRegenMult += buff.regenMultiplier;
        next.buffs = activeBuffs;
        const regenSeconds = getEnergyRegenValue(next.upgrades.energyRegenLvl);
        const regenMult = getEnergyRegenAmountValue(next.upgrades.energyRegenAmountLvl ?? 0) + offlineItemEffects.energyRegenBonus;
        const regenAmount = (offlineSec / regenSeconds) * totalRegenMult * regenMult;
        next.energy = Math.min(effectiveMax, next.energy + regenAmount);
        changed = true;
      }

      next.buffs = next.buffs.filter((b) => b.expiresAt > now);
      if (next.buffs.length !== prev.buffs.length) changed = true;

      if (next.activeLeaseEndsAt && now > next.activeLeaseEndsAt) {
        next.activeLeaseEndsAt = null;
        next.activeLeaseTotal = 0;
        changed = true;
      }
      if (next.autoMiningEndsAt && now > next.autoMiningEndsAt) {
        next.autoMiningEndsAt = null;
        next.autoMiningTotal = 0;
        changed = true;
      }

      if (next.autoMiningEndsAt && now < next.autoMiningEndsAt) {
        const autoCooldown = getAutoCooldownMs(next.upgrades.autoCooldownLvl) / 1000;
        const maxDigs = Math.floor(offlineSec / autoCooldown);
        const basketCap = getBasketCapValue(next.upgrades.basketCapLvl);
        let basket = [...next.autoBasket];
        let digsDone = 0;
        const tier = getPickaxeTier(next.activePickaxeTierId);

        for (let i = 0; i < maxDigs && basket.length < basketCap; i++) {
          if (!next.activePickaxe || next.activePickaxe.durability < tier.durabilityCost) {
            break;
          }

          const resource = getRandomResourceForMine(next.autoLeaseMineId || 1);
          const mass = Math.round(getRandomMass(resource) * tier.yieldMultiplier * 100) / 100;
          basket.push({ resource: resource.type, mass, xp: resource.xp, timestamp: now });
          digsDone++;

          const newDur = next.activePickaxe.durability - tier.durabilityCost;
          if (newDur <= 0) {
            if (next.sparePickaxes.length > 0) {
              const spare = next.sparePickaxes[0];
              next.activePickaxe = { ...spare };
              next.sparePickaxes = next.sparePickaxes.slice(1);
            } else {
              next.activePickaxe = { ...next.activePickaxe, durability: 0 };
              break;
            }
          } else {
            next.activePickaxe = { ...next.activePickaxe, durability: newDur };
          }

          if (rollCaseDrop(next.upgrades.caseChanceLvl)) {
            const rarity = rollCaseRarity();
            next.cases = [...next.cases, { id: `case-${now}-${i}-${Math.random()}`, rarity, opened: false }];
          }
        }

        if (digsDone > 0) {
          next.autoBasket = basket;
          next.totalDigs = next.totalDigs + digsDone;
          next.lastAutoDigAt = now;
          changed = true;
        }
      }

      return changed ? next : prev;
    });
    lastTickRef.current = now;
  }, []);

  const dig = useCallback(
    (x?: number, y?: number) => {
      const now = Date.now();
      if (now - lastDigRef.current < DIG_COOLDOWN_MS) return;
      lastDigRef.current = now;

      let current = stateRef.current;

      if (!current.activePickaxe) {
        const fallbackTier = PICKAXE_TIERS[0];
        const fallbackPickaxe = {
          id: `pickaxe-fallback-${now}`,
          pickaxeTierId: fallbackTier.id,
          name: lang === 'ru' ? fallbackTier.nameRu : (lang === 'uk' ? fallbackTier.nameUk : fallbackTier.nameEn),
          durability: fallbackTier.maxDurability,
          maxDurability: fallbackTier.maxDurability,
        };
        setState((prev) => ({
          ...prev,
          activePickaxe: fallbackPickaxe,
          activePickaxeTierId: fallbackTier.id,
          ownedPickaxes: [...(prev.ownedPickaxes || []), fallbackTier.id],
        }));
        stateRef.current = { ...stateRef.current, activePickaxe: fallbackPickaxe, activePickaxeTierId: fallbackTier.id };
        current = stateRef.current;
      }

      const tier = getPickaxeTier(current.activePickaxeTierId);
      const mineId = current.currentMineId ?? 0;
      const dumpMine = isDumpMine(mineId);

      if (current.activePickaxeTierId === 'shovel' && !dumpMine) {
        pushNotification({ message: lang === 'ru' ? 'Лопату можно использовать только на Свалке!' : (lang === 'uk' ? 'Лопату можна використовувати лише на Звалищі!' : 'Shovel can only be used at The Dump!'), type: 'error' });
        return;
      }

      if (!dumpMine) {
        if (!current.activeLeaseEndsAt || current.activeLeaseEndsAt <= now) {
          pushNotification({ message: tr('notifNoLease'), type: 'error' });
          return;
        }
        if ((current.activeLeaseMineId || 1) !== (current.currentMineId || 1)) {
          pushNotification({ message: lang === 'ru' ? 'Аренда на другой шахте. Купите новую аренду здесь.' : (lang === 'uk' ? 'Аренда на іншій шахті. Купіть нову аренду тут.' : 'Lease is for a different mine. Buy a new lease here.'), type: 'error' });
          return;
        }
      }
      if (current.energy < tier.energyCost) {
        pushNotification({ message: tr('noEnergy'), type: 'error' });
        return;
      }
      if (!current.activePickaxe || current.activePickaxe.durability < tier.durabilityCost) {
        pushNotification({ message: tr('noDurability'), type: 'error' });
        return;
      }

      const rolls: { resource: Resource; mass: number }[] = [];
      for (let i = 0; i < tier.yieldMultiplier; i++) {
        const r = getRandomResourceForMine(mineId);
        const m = Math.round(getRandomMass(r) * 100) / 100;
        rolls.push({ resource: r, mass: m });
      }
      const totalMass = rolls.reduce((sum, r) => sum + r.mass, 0);
      const totalXp = rolls.reduce((sum, r) => sum + r.resource.xp, 0);
      const diamondDrop = rollDiamondDrop(0);

      setState((prev) => {
        let next = { ...prev };
        const pTier = getPickaxeTier(prev.activePickaxeTierId);
        next.energy = Math.max(0, prev.energy - pTier.energyCost);
        next.totalDigs = prev.totalDigs + 1;

        const newDur = prev.activePickaxe!.durability - pTier.durabilityCost;
        if (newDur <= 0) {
          if (prev.sparePickaxes.length > 0) {
            const spare = prev.sparePickaxes[0];
            next.activePickaxe = { ...spare };
            next.sparePickaxes = prev.sparePickaxes.slice(1);
            pushNotification({ message: tr('notifPickaxeSwapped'), type: 'info' });
          } else {
            next.activePickaxe = { ...prev.activePickaxe!, durability: 0 };
            pushNotification({ message: tr('notifNoSparePickaxe'), type: 'error' });
          }
        } else {
          next.activePickaxe = { ...prev.activePickaxe!, durability: newDur };
        }

        const inv = { ...prev.inventory };
        for (const roll of rolls) {
          inv[roll.resource.type] = {
            mass: Math.round((inv[roll.resource.type].mass + roll.mass) * 100) / 100,
            count: inv[roll.resource.type].count + 1,
          };
        }
        next.inventory = inv;

        const xpRes = applyXp(next, totalXp);
        next = xpRes.state;
        if (xpRes.leveledUp) {
          pushNotification({ message: `${tr('notifLevelUp')} ${xpRes.newLevel}!`, type: 'success' });
        }

        if (rollCaseDrop(prev.upgrades.caseChanceLvl)) {
          const rarity = rollCaseRarity();
          next.cases = [...prev.cases, { id: `case-${Date.now()}-${Math.random()}`, rarity, opened: false }];
          pushNotification({ message: tr('notifCaseDropped'), type: 'case', color: CASE_RARITIES[rarity].color });
        }

        const diamondResult = diamondDrop;
        if (diamondResult.dropped) {
          next.gems = prev.gems + diamondResult.amount;
          next.totalGemsEarned = (prev.totalGemsEarned || 0) + diamondResult.amount;
          pushNotification({
            message: `${lang === 'ru' ? 'Найден алмаз!' : (lang === 'uk' ? 'Знайдено алмаз!' : 'Diamond found!')} +${diamondResult.amount} 💎`,
            type: 'drop',
            color: '#06b6d4',
          });
        }

        return next;
      });

      const fx = x ?? window.innerWidth / 2;
      const fy = y ?? window.innerHeight / 2;
      for (const roll of rolls) {
        const resName = lang === 'ru' ? roll.resource.nameRu : (lang === 'uk' ? roll.resource.nameUk : roll.resource.nameEn);
        pushFloatText(`+${roll.mass.toFixed(2)} kg ${resName}`, fx, fy, roll.resource.color);
      }
      if (diamondDrop.dropped) {
        pushFloatText(`+${diamondDrop.amount} 💎`, fx, fy - 30, '#06b6d4');
      }
    },
    [pushNotification, pushFloatText, tr, lang]
  );

  const collectBasket = useCallback(() => {
    setState((prev) => {
      if (prev.autoBasket.length === 0) {
        pushNotification({ message: tr('notifNothingToCollect'), type: 'info' });
        return prev;
      }
      const inv = { ...prev.inventory };
      let totalXp = 0;
      for (const item of prev.autoBasket) {
        inv[item.resource] = {
          mass: Math.round((inv[item.resource].mass + item.mass) * 100) / 100,
          count: inv[item.resource].count + 1,
        };
        totalXp += item.xp;
      }
      let next: GameState = { ...prev, autoBasket: [], inventory: inv };
      const xpRes = applyXp(next, totalXp);
      next = xpRes.state;
      if (xpRes.leveledUp) {
        pushNotification({ message: `${tr('notifLevelUp')} ${xpRes.newLevel}!`, type: 'success' });
      }
      pushNotification({ message: tr('notifBasketCollected'), type: 'success' });
      return next;
    });
  }, [pushNotification, tr]);

  const buyActiveLease = useCallback(
    (value: number, unit: TimeUnit) => {
      const rawSeconds = convertToSeconds(value, unit);
      if (rawSeconds < MIN_LEASE_SECONDS) {
        pushNotification({ message: tr('notifMinLease'), type: 'error' });
        return;
      }
      const now = Date.now();
      const hasActiveLease = stateRef.current.activeLeaseEndsAt && stateRef.current.activeLeaseEndsAt > now;
      const leaseMineId = stateRef.current.activeLeaseMineId || 1;
      const currentMineId = stateRef.current.currentMineId || 1;

      if (hasActiveLease && leaseMineId !== currentMineId) {
        setPendingLeasePurchase({ type: 'active', value, unit });
        return;
      }

      const pricePerSec = getActiveLeasePricePerSec(currentMineId);
      const mult = getLeaseMultValue('activeLeaseMult', stateRef.current.upgrades.activeLeaseMult) + totalItemEffects.activeLeaseMultBonus;
      const seconds = Math.floor(rawSeconds * mult);
      const cost = rawSeconds * pricePerSec;
      if (stateRef.current.balance < cost) {
        pushNotification({ message: tr('notifNoMoney'), type: 'error' });
        return;
      }
      const baseEnd = hasActiveLease ? stateRef.current.activeLeaseEndsAt! : now;
      setState((prev) => ({
        ...prev,
        balance: Math.round((prev.balance - cost) * 100) / 100,
        activeLeaseEndsAt: baseEnd + seconds * 1000,
        activeLeaseTotal: (prev.activeLeaseTotal || 0) + seconds,
        activeLeaseMineId: prev.currentMineId || 1,
      }));
      pushNotification({ message: tr('leasePurchased'), type: 'success' });
    },
    [pushNotification, tr, totalItemEffects]
  );

  const buyAutoLease = useCallback(
    (value: number, unit: TimeUnit) => {
      const rawSeconds = convertToSeconds(value, unit);
      if (rawSeconds < MIN_LEASE_SECONDS) {
        pushNotification({ message: tr('notifMinLease'), type: 'error' });
        return;
      }
      const now = Date.now();
      const hasAutoLease = stateRef.current.autoMiningEndsAt && stateRef.current.autoMiningEndsAt > now;
      const leaseMineId = stateRef.current.autoLeaseMineId || 1;
      const currentMineId = stateRef.current.currentMineId || 1;

      if (hasAutoLease && leaseMineId !== currentMineId) {
        setPendingLeasePurchase({ type: 'auto', value, unit });
        return;
      }

      const pricePerSec = getAutoLeasePricePerSec(currentMineId);
      const mult = getLeaseMultValue('autoLeaseMult', stateRef.current.upgrades.autoLeaseMult);
      const seconds = Math.floor(rawSeconds * mult);
      const cost = rawSeconds * pricePerSec;
      if (stateRef.current.balance < cost) {
        pushNotification({ message: tr('notifNoMoney'), type: 'error' });
        return;
      }
      const baseEnd = hasAutoLease ? stateRef.current.autoMiningEndsAt! : now;
      const prevLastDig = stateRef.current.lastAutoDigAt;
      const autoCooldown = getAutoCooldownMs(stateRef.current.upgrades.autoCooldownLvl);
      setState((prev) => ({
        ...prev,
        balance: Math.round((prev.balance - cost) * 100) / 100,
        autoMiningEndsAt: baseEnd + seconds * 1000,
        autoMiningTotal: (prev.autoMiningTotal || 0) + seconds,
        autoLeaseMineId: prev.currentMineId || 1,
        lastAutoDigAt: prevLastDig < now - autoCooldown ? now : prevLastDig,
      }));
      pushNotification({ message: tr('leasePurchased'), type: 'success' });
    },
    [pushNotification, tr]
  );

  const confirmLeasePurchase = useCallback(() => {
    const pending = pendingLeasePurchase;
    setPendingLeasePurchase(null);
    if (!pending) return;

    const now = Date.now();
    const currentMineId = stateRef.current.currentMineId || 1;
    const rawSeconds = convertToSeconds(pending.value, pending.unit);

    if (pending.type === 'active') {
      const pricePerSec = getActiveLeasePricePerSec(currentMineId);
      const mult = getLeaseMultValue('activeLeaseMult', stateRef.current.upgrades.activeLeaseMult);
      const seconds = Math.floor(rawSeconds * mult);
      const cost = rawSeconds * pricePerSec;
      if (stateRef.current.balance < cost) {
        pushNotification({ message: tr('notifNoMoney'), type: 'error' });
        return;
      }
      setState((prev) => ({
        ...prev,
        balance: Math.round((prev.balance - cost) * 100) / 100,
        activeLeaseEndsAt: now + seconds * 1000,
        activeLeaseTotal: (prev.activeLeaseTotal || 0) + seconds,
        activeLeaseMineId: currentMineId,
      }));
      pushNotification({ message: tr('leasePurchased'), type: 'success' });
    } else {
      const pricePerSec = getAutoLeasePricePerSec(currentMineId);
      const mult = getLeaseMultValue('autoLeaseMult', stateRef.current.upgrades.autoLeaseMult);
      const seconds = Math.floor(rawSeconds * mult);
      const cost = rawSeconds * pricePerSec;
      if (stateRef.current.balance < cost) {
        pushNotification({ message: tr('notifNoMoney'), type: 'error' });
        return;
      }
      const autoCooldown = getAutoCooldownMs(stateRef.current.upgrades.autoCooldownLvl);
      setState((prev) => ({
        ...prev,
        balance: Math.round((prev.balance - cost) * 100) / 100,
        autoMiningEndsAt: now + seconds * 1000,
        autoMiningTotal: (prev.autoMiningTotal || 0) + seconds,
        autoLeaseMineId: currentMineId,
        lastAutoDigAt: prev.lastAutoDigAt < now - autoCooldown ? now : prev.lastAutoDigAt,
      }));
      pushNotification({ message: tr('leasePurchased'), type: 'success' });
    }
  }, [pendingLeasePurchase, pushNotification, tr]);

  const cancelLeasePurchase = useCallback(() => {
    setPendingLeasePurchase(null);
  }, []);

  const buyFood = useCallback(
    (foodId: string) => {
      const food = FOOD_ITEMS.find((f) => f.id === foodId);
      if (!food) return;
      const mineId = stateRef.current.currentMineId || 1;
      const price = getFoodPrice(food, mineId);
      if (stateRef.current.balance < price) {
        pushNotification({ message: tr('notifNoMoney'), type: 'error' });
        return;
      }
      setState((prev) => {
        let next = { ...prev };
        next.balance = Math.round((prev.balance - price) * 100) / 100;

        if (food.energyBoost > 0) {
          const effectiveMax = prev.maxEnergy + totalItemEffects.energyMaxBonus;
          if (prev.energy >= effectiveMax) {
            pushNotification({ message: tr('notifEnergyFull'), type: 'info' });
          }
          const boost = food.energyBoost * (1 + totalItemEffects.foodBonusPct);
          next.energy = Math.min(effectiveMax, prev.energy + boost);
        }

        if (food.buffDuration > 0) {
          const now = Date.now();
          const existing = next.buffs.find((b) => b.id === food.id && b.expiresAt > now);
          if (existing) {
            next.buffs = next.buffs.map((b) =>
              b.id === food.id
                ? { ...b, expiresAt: b.expiresAt + food.buffDuration * 1000 }
                : b
            );
          } else {
            next.buffs = [
              ...next.buffs,
              {
                id: food.id,
                type: food.id as 'juice' | 'milka',
                regenMultiplier: food.regenMultiplier,
                expiresAt: now + food.buffDuration * 1000,
                name: food.name,
              },
            ];
          }
        }

        return next;
      });
      pushNotification({ message: `${tr('notifBought')} ${food.name}`, type: 'success' });
    },
    [pushNotification, tr, totalItemEffects]
  );

  const equipPickaxe = useCallback(
    (tierId: string) => {
      const tier = getPickaxeTier(tierId);
      const current = stateRef.current;

      if (!current.ownedPickaxes?.includes(tierId)) return;
      if (current.activePickaxeTierId === tierId && current.activePickaxe) return;

      setState((prev) => {
        const oldPickaxe = prev.activePickaxe;
        const owned = prev.sparePickaxes.find((p) => p.pickaxeTierId === tierId);

        if (!owned && !oldPickaxe) {
          return {
            ...prev,
            activePickaxe: {
              id: `pickaxe-${tierId}-${Date.now()}`,
              pickaxeTierId: tierId,
              name: lang === 'ru' ? tier.nameRu : (lang === 'uk' ? tier.nameUk : tier.nameEn),
              durability: tier.maxDurability,
              maxDurability: tier.maxDurability,
            },
            activePickaxeTierId: tierId,
          };
        }

        if (!owned && oldPickaxe) {
          return {
            ...prev,
            activePickaxe: {
              id: `pickaxe-${tierId}-${Date.now()}`,
              pickaxeTierId: tierId,
              name: lang === 'ru' ? tier.nameRu : (lang === 'uk' ? tier.nameUk : tier.nameEn),
              durability: tier.maxDurability,
              maxDurability: tier.maxDurability,
            },
            activePickaxeTierId: tierId,
            sparePickaxes: [...prev.sparePickaxes, { ...oldPickaxe }],
          };
        }

        const newSpare = oldPickaxe
          ? [...prev.sparePickaxes.filter((p) => p.pickaxeTierId !== tierId), { ...oldPickaxe }]
          : prev.sparePickaxes.filter((p) => p.pickaxeTierId !== tierId);

        return {
          ...prev,
          activePickaxe: { ...owned! },
          activePickaxeTierId: tierId,
          sparePickaxes: newSpare,
        };
      });
      const name = lang === 'ru' ? tier.nameRu : (lang === 'uk' ? tier.nameUk : tier.nameEn);
      pushNotification({ message: `${tr('switchPickaxe')}: ${name}`, type: 'info' });
    },
    [pushNotification, tr, lang]
  );

  const buyPickaxe = useCallback(
    (tierId: string) => {
      const tier = getPickaxeTier(tierId);
      const current = stateRef.current;

      if (current.ownedPickaxes?.includes(tierId)) {
        equipPickaxe(tierId);
        return;
      }

      if (current.level < tier.requiredLevel) {
        pushNotification({ message: tr('notifNeedHigherLevel'), type: 'error' });
        return;
      }
      if (current.balance < tier.price) {
        pushNotification({ message: tr('notifNoMoney'), type: 'error' });
        return;
      }
      const newPickaxe = {
        id: `pickaxe-${tierId}-${Date.now()}`,
        pickaxeTierId: tierId,
        name: lang === 'ru' ? tier.nameRu : (lang === 'uk' ? tier.nameUk : tier.nameEn),
        durability: tier.maxDurability,
        maxDurability: tier.maxDurability,
      };
      setState((prev) => {
        if (!prev.activePickaxe) {
          return {
            ...prev,
            balance: Math.round((prev.balance - tier.price) * 100) / 100,
            activePickaxe: newPickaxe,
            activePickaxeTierId: tierId,
            ownedPickaxes: [...(prev.ownedPickaxes || []), tierId],
          };
        }
        const oldPickaxe = prev.activePickaxe;
        return {
          ...prev,
          balance: Math.round((prev.balance - tier.price) * 100) / 100,
          activePickaxe: newPickaxe,
          activePickaxeTierId: tierId,
          sparePickaxes: [...prev.sparePickaxes, oldPickaxe],
          ownedPickaxes: [...(prev.ownedPickaxes || []), tierId],
        };
      });
      const name = lang === 'ru' ? tier.nameRu : (lang === 'uk' ? tier.nameUk : tier.nameEn);
      pushNotification({ message: `${tr('notifBought')} ${name}`, type: 'success' });
    },
    [pushNotification, tr, lang, equipPickaxe]
  );

  const switchPickaxe = useCallback(
    (pickaxeId: string) => {
      setState((prev) => {
        const spare = prev.sparePickaxes.find((p) => p.id === pickaxeId);
        if (!spare) return prev;
        const current = prev.activePickaxe;
        const newSpare = current
          ? [...prev.sparePickaxes.filter((p) => p.id !== pickaxeId), { ...current }]
          : prev.sparePickaxes.filter((p) => p.id !== pickaxeId);
        return {
          ...prev,
          activePickaxe: { ...spare },
          activePickaxeTierId: spare.pickaxeTierId,
          sparePickaxes: newSpare,
        };
      });
      const name = lang === 'ru' ? getPickaxeTier(stateRef.current.activePickaxeTierId).nameRu : (lang === 'uk' ? getPickaxeTier(stateRef.current.activePickaxeTierId).nameUk : getPickaxeTier(stateRef.current.activePickaxeTierId).nameEn);
      pushNotification({ message: `${tr('switchPickaxe')}: ${name}`, type: 'info' });
    },
    [pushNotification, tr, lang]
  );

  const repairActivePickaxe = useCallback(() => {
    const current = stateRef.current;
    if (!current.activePickaxe) {
      const fallbackTier = PICKAXE_TIERS[0];
      const repairCost = getRepairCost(fallbackTier.id, 0);
      if (current.balance < repairCost) {
        pushNotification({ message: tr('notifNoMoney'), type: 'error' });
        return;
      }
      setState((prev) => ({
        ...prev,
        balance: Math.round((prev.balance - repairCost) * 100) / 100,
        activePickaxe: {
          id: `pickaxe-fallback-${Date.now()}`,
          pickaxeTierId: fallbackTier.id,
          name: lang === 'ru' ? fallbackTier.nameRu : (lang === 'uk' ? fallbackTier.nameUk : fallbackTier.nameEn),
          durability: fallbackTier.maxDurability,
          maxDurability: fallbackTier.maxDurability,
        },
        activePickaxeTierId: fallbackTier.id,
        ownedPickaxes: [...(prev.ownedPickaxes || []), fallbackTier.id],
      }));
      pushNotification({ message: tr('repaired'), type: 'success' });
      return;
    }
    const tier = getPickaxeTier(current.activePickaxeTierId);
    const lostDurability = tier.maxDurability - current.activePickaxe.durability;
    if (lostDurability <= 0) return;
    const cost = getRepairCost(current.activePickaxeTierId, current.activePickaxe.durability);
    if (current.balance < cost) {
      pushNotification({ message: tr('notifNoMoney'), type: 'error' });
      return;
    }
    setState((prev) => ({
      ...prev,
      balance: Math.round((prev.balance - cost) * 100) / 100,
      activePickaxe: { ...prev.activePickaxe!, durability: tier.maxDurability },
    }));
    pushNotification({ message: tr('repaired'), type: 'success' });
  }, [pushNotification, tr, lang]);

  const upgradeEnergyMax = useCallback(() => {
    const lvl = stateRef.current.upgrades.energyMaxLvl;
    if (lvl >= UPGRADE_CONFIG.energyMax.maxLevel) {
      pushNotification({ message: tr('notifUpgradeMaxed'), type: 'warning' });
      return;
    }
    if (isEnergyUpgradeDiamond(lvl)) {
      const gemCost = getEnergyUpgradeDiamondCost(lvl);
      if (stateRef.current.gems < gemCost) {
        pushNotification({ message: tr('notifNoGems'), type: 'error' });
        return;
      }
      setState((prev) => ({
        ...prev,
        gems: prev.gems - gemCost,
        maxEnergy: getEnergyMaxValue(prev.upgrades.energyMaxLvl + 1),
        upgrades: { ...prev.upgrades, energyMaxLvl: prev.upgrades.energyMaxLvl + 1 },
      }));
    } else {
      const cost = getEnergyMaxCost(lvl);
      if (stateRef.current.balance < cost) {
        pushNotification({ message: tr('notifNoMoney'), type: 'error' });
        return;
      }
      setState((prev) => ({
        ...prev,
        balance: Math.round((prev.balance - cost) * 100) / 100,
        maxEnergy: getEnergyMaxValue(prev.upgrades.energyMaxLvl + 1),
        upgrades: { ...prev.upgrades, energyMaxLvl: prev.upgrades.energyMaxLvl + 1 },
      }));
    }
  }, [pushNotification, tr]);

  const upgradeEnergyRegen = useCallback(() => {
    const lvl = stateRef.current.upgrades.energyRegenLvl;
    if (lvl >= UPGRADE_CONFIG.energyRegen.maxLevel) {
      pushNotification({ message: tr('notifUpgradeMaxed'), type: 'warning' });
      return;
    }
    if (isEnergyUpgradeDiamond(lvl)) {
      const gemCost = getEnergyUpgradeDiamondCost(lvl);
      if (stateRef.current.gems < gemCost) {
        pushNotification({ message: tr('notifNoGems'), type: 'error' });
        return;
      }
      setState((prev) => ({
        ...prev,
        gems: prev.gems - gemCost,
        upgrades: { ...prev.upgrades, energyRegenLvl: prev.upgrades.energyRegenLvl + 1 },
      }));
    } else {
      const cost = getEnergyRegenCost(lvl);
      if (stateRef.current.balance < cost) {
        pushNotification({ message: tr('notifNoMoney'), type: 'error' });
        return;
      }
      setState((prev) => ({
        ...prev,
        balance: Math.round((prev.balance - cost) * 100) / 100,
        upgrades: { ...prev.upgrades, energyRegenLvl: prev.upgrades.energyRegenLvl + 1 },
      }));
    }
  }, [pushNotification, tr]);

  const upgradeEnergyRegenAmount = useCallback(() => {
    const lvl = stateRef.current.upgrades.energyRegenAmountLvl ?? 0;
    if (lvl >= UPGRADE_CONFIG.energyRegenAmount.maxLevel) {
      pushNotification({ message: tr('notifUpgradeMaxed'), type: 'warning' });
      return;
    }
    if (isEnergyUpgradeDiamond(lvl)) {
      const gemCost = getEnergyUpgradeDiamondCost(lvl);
      if (stateRef.current.gems < gemCost) {
        pushNotification({ message: tr('notifNoGems'), type: 'error' });
        return;
      }
      setState((prev) => ({
        ...prev,
        gems: prev.gems - gemCost,
        upgrades: { ...prev.upgrades, energyRegenAmountLvl: (prev.upgrades.energyRegenAmountLvl ?? 0) + 1 },
      }));
    } else {
      const cost = getEnergyRegenAmountCost(lvl);
      if (stateRef.current.balance < cost) {
        pushNotification({ message: tr('notifNoMoney'), type: 'error' });
        return;
      }
      setState((prev) => ({
        ...prev,
        balance: Math.round((prev.balance - cost) * 100) / 100,
        upgrades: { ...prev.upgrades, energyRegenAmountLvl: (prev.upgrades.energyRegenAmountLvl ?? 0) + 1 },
      }));
    }
  }, [pushNotification, tr]);

  const claimDailyReward = useCallback(() => {
    const current = stateRef.current;
    const dc = current.dailyCalendar || { lastClaimDay: 0, lastClaimTimestamp: null };
    const nextDay = dc.lastClaimDay + 1;
    if (nextDay > DAILY_REWARDS.length) {
      pushNotification({ message: tr('claimed'), type: 'info' });
      return;
    }
    const reward: DailyReward = DAILY_REWARDS[nextDay - 1];
    const now = Date.now();
    if (dc.lastClaimTimestamp && now - dc.lastClaimTimestamp < DAILY_CLAIM_COOLDOWN_MS) {
      pushNotification({ message: tr('locked'), type: 'warning' });
      return;
    }
    const scaled = getDailyRewardScaled(reward, current.level);
    let rewardLabel = '';
    if (scaled.type === 'cash') {
      rewardLabel = `+${scaled.amount.toFixed(2)}`;
    } else if (scaled.type === 'gems') {
      rewardLabel = `+${scaled.amount} 💎`;
    } else if (scaled.type === 'case') {
      const rarityName = scaled.caseRarity === 'epic'
        ? (lang === 'ru' ? 'Эпический кейс' : (lang === 'uk' ? 'Епічний кейс' : 'Epic Case'))
        : (lang === 'ru' ? 'Обычный кейс' : (lang === 'uk' ? 'Звичайний кейс' : 'Common Case'));
      rewardLabel = rarityName;
    }
    setState((prev) => {
      const next: GameState = { ...prev, dailyCalendar: { lastClaimDay: nextDay, lastClaimTimestamp: now } };
      if (scaled.type === 'cash') {
        next.balance = Math.round((prev.balance + scaled.amount) * 100) / 100;
        next.totalEarned = Math.round((prev.totalEarned + scaled.amount) * 100) / 100;
      } else if (scaled.type === 'gems') {
        next.gems = prev.gems + scaled.amount;
        next.totalGemsEarned = prev.totalGemsEarned + scaled.amount;
      } else if (scaled.type === 'case') {
        const caseRarity = (scaled.caseRarity as CaseRarity) || 'common';
        next.cases = [...(prev.cases || []), { id: `daily_${nextDay}_${Date.now()}`, rarity: caseRarity, opened: false }];
      }
      return next;
    });
    pushNotification({ message: `${tr('dailyReward')}: ${rewardLabel}`, type: 'success' });
  }, [pushNotification, tr, lang]);

  const sellResource = useCallback(
    (type: ResourceType) => {
      const current = stateRef.current;
      const entry = current.inventory[type];
      if (entry.mass <= 0) return;
      const res = RESOURCES[type];
      const earned = Math.round(entry.mass * res.pricePerKg * (1 + totalItemEffects.sellMultBonus) * 100) / 100;
      setState((prev) => {
        const inv = { ...prev.inventory };
        inv[type] = { mass: 0, count: 0 };
        return {
          ...prev,
          inventory: inv,
          balance: Math.round((prev.balance + earned) * 100) / 100,
          totalEarned: Math.round((prev.totalEarned + earned) * 100) / 100,
        };
      });
      pushNotification({ message: `${tr('notifSold')} ${earned.toFixed(2)}`, type: 'success' });
    },
    [pushNotification, tr, totalItemEffects]
  );

  const sellAll = useCallback(() => {
    const current = stateRef.current;
    let total = 0;
    const inv = { ...current.inventory };
    for (const res of RESOURCE_LIST) {
      const entry = inv[res.type];
      if (entry.mass > 0) {
        total += entry.mass * res.pricePerKg * (1 + totalItemEffects.sellMultBonus);
        inv[res.type] = { mass: 0, count: 0 };
      }
    }
    if (total <= 0) {
      pushNotification({ message: tr('noResources'), type: 'info' });
      return;
    }
    total = Math.round(total * 100) / 100;
    setState((prev) => ({
      ...prev,
      inventory: inv,
      balance: Math.round((prev.balance + total) * 100) / 100,
      totalEarned: Math.round((prev.totalEarned + total) * 100) / 100,
    }));
    pushNotification({ message: `${tr('notifSold')} ${total.toFixed(2)}`, type: 'success' });
  }, [pushNotification, tr, totalItemEffects]);

  const setLang = useCallback((l: Lang) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, lang: l } }));
  }, []);

  const setTheme = useCallback((th: Theme) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, theme: th } }));
  }, []);

  const resetGame = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(createInitialState());
    pushNotification({ message: tr('notifReset'), type: 'info' });
  }, [pushNotification, tr]);

  const claimStarterGift = useCallback(() => {
    if (stateRef.current.starterGiftClaimed) return;
    const now = Date.now();
    const baseEnd = stateRef.current.activeLeaseEndsAt && stateRef.current.activeLeaseEndsAt > now ? stateRef.current.activeLeaseEndsAt : now;
    setState((prev) => ({
      ...prev,
      starterGiftClaimed: true,
      activeLeaseEndsAt: baseEnd + STARTER_GIFT_SECONDS * 1000,
      activeLeaseTotal: (prev.activeLeaseTotal || 0) + STARTER_GIFT_SECONDS,
      activeLeaseMineId: prev.currentMineId || 1,
    }));
    pushNotification({ message: tr('giftClaimed'), type: 'success' });
  }, [pushNotification, tr]);

  const redeemPromoCode = useCallback(
    (code: string): string | null => {
      const cleanCode = code.trim().toLowerCase();
      if (!cleanCode) return null;

      const current = stateRef.current;
      const usedCodes = current.redeemedPromoCodes || [];

      if (usedCodes.includes(cleanCode)) {
        pushNotification({ message: tr('promoUsed'), type: 'error' });
        return tr('promoUsed');
      }

      if (cleanCode === ADM_XP_CODE) {
        let xpGained = ADM_XP_REWARD;
        setState((prev) => {
          let next = { ...prev };
          const xpRes = applyXp(next, xpGained);
          next = xpRes.state;
          if (xpRes.leveledUp) {
            pushNotification({ message: `${tr('notifLevelUp')} ${xpRes.newLevel}!`, type: 'success' });
          }
          return next;
        });
        setState((prev) => ({
          ...prev,
          redeemedPromoCodes: [...(prev.redeemedPromoCodes || []), cleanCode],
        }));
        const xpMsg = lang === 'ru' ? `+${xpGained.toLocaleString('ru')} XP!` : (lang === 'uk' ? `${xpGained.toLocaleString('uk')} XP!` : `${xpGained.toLocaleString('en')} XP!`);
        pushNotification({ message: xpMsg, type: 'success' });
        return xpMsg;
      }

      const promo = findPromoCode(cleanCode);
      if (!promo) {
        pushNotification({ message: tr('promoInvalid'), type: 'error' });
        return tr('promoInvalid');
      }

      const newCases: Array<{ id: string; rarity: CaseRarity; opened: boolean }> = [];
      if (promo.cases) {
        for (const c of promo.cases) {
          for (let i = 0; i < c.count; i++) {
            newCases.push({ id: `promo_${c.rarity}_${i}_${Date.now()}_${Math.random()}`, rarity: c.rarity as CaseRarity, opened: false });
          }
        }
      }

      const bonusBalance = promo.bonusBalance || 0;
      const bonusGems = promo.gems || 0;
      const itemBags = promo.itemBags || 0;
      const materials = promo.materials || {};

      setState((prev) => {
        const newMaterials = { ...prev.materials };
        for (const [matId, amount] of Object.entries(materials)) {
          newMaterials[matId] = (newMaterials[matId] || 0) + amount;
        }
        return {
          ...prev,
          balance: Math.round(((Number(prev.balance) || 0) + bonusBalance) * 100) / 100,
          gems: prev.gems + bonusGems,
          totalGemsEarned: prev.totalGemsEarned + bonusGems,
          cases: [...(prev.cases || []), ...newCases],
          itemBags: (prev.itemBags || 0) + itemBags,
          materials: newMaterials,
          redeemedPromoCodes: [...(prev.redeemedPromoCodes || []), cleanCode],
        };
      });

      const msg = lang === 'ru' ? (promo.messageRu || promo.messageEn) : (lang === 'uk' ? promo.messageUk : promo.messageEn);
      pushNotification({ message: msg, type: 'success' });
      return msg;
    },
    [pushNotification, tr, lang]
  );

  const upgradeActiveLeaseMult = useCallback(() => {
    const lvl = stateRef.current.upgrades.activeLeaseMult;
    if (lvl >= UPGRADE_CONFIG.activeLeaseMult.maxLevel) {
      pushNotification({ message: tr('notifUpgradeMaxed'), type: 'warning' });
      return;
    }
    const cost = getLeaseMultCost('activeLeaseMult', lvl);
    if (stateRef.current.balance < cost) {
      pushNotification({ message: tr('notifNoMoney'), type: 'error' });
      return;
    }
    setState((prev) => ({
      ...prev,
      balance: Math.round((prev.balance - cost) * 100) / 100,
      upgrades: { ...prev.upgrades, activeLeaseMult: prev.upgrades.activeLeaseMult + 1 },
    }));
  }, [pushNotification, tr]);

  const upgradeAutoLeaseMult = useCallback(() => {
    const lvl = stateRef.current.upgrades.autoLeaseMult;
    if (lvl >= UPGRADE_CONFIG.autoLeaseMult.maxLevel) {
      pushNotification({ message: tr('notifUpgradeMaxed'), type: 'warning' });
      return;
    }
    const cost = getLeaseMultCost('autoLeaseMult', lvl);
    if (stateRef.current.balance < cost) {
      pushNotification({ message: tr('notifNoMoney'), type: 'error' });
      return;
    }
    setState((prev) => ({
      ...prev,
      balance: Math.round((prev.balance - cost) * 100) / 100,
      upgrades: { ...prev.upgrades, autoLeaseMult: prev.upgrades.autoLeaseMult + 1 },
    }));
  }, [pushNotification, tr]);

  const upgradeAutoCooldown = useCallback(() => {
    const lvl = stateRef.current.upgrades.autoCooldownLvl;
    if (lvl >= UPGRADE_CONFIG.autoCooldown.maxLevel) {
      pushNotification({ message: tr('notifUpgradeMaxed'), type: 'warning' });
      return;
    }
    const cost = getAutoCooldownCost(lvl);
    if (stateRef.current.balance < cost) {
      pushNotification({ message: tr('notifNoMoney'), type: 'error' });
      return;
    }
    setState((prev) => ({
      ...prev,
      balance: Math.round((prev.balance - cost) * 100) / 100,
      upgrades: { ...prev.upgrades, autoCooldownLvl: prev.upgrades.autoCooldownLvl + 1 },
    }));
  }, [pushNotification, tr]);

  const upgradeBasketCap = useCallback(() => {
    const lvl = stateRef.current.upgrades.basketCapLvl;
    if (lvl >= UPGRADE_CONFIG.basketCap.maxLevel) {
      pushNotification({ message: tr('notifUpgradeMaxed'), type: 'warning' });
      return;
    }
    const cost = getBasketCapCost(lvl);
    if (stateRef.current.balance < cost) {
      pushNotification({ message: tr('notifNoMoney'), type: 'error' });
      return;
    }
    setState((prev) => ({
      ...prev,
      balance: Math.round((prev.balance - cost) * 100) / 100,
      upgrades: { ...prev.upgrades, basketCapLvl: prev.upgrades.basketCapLvl + 1 },
    }));
  }, [pushNotification, tr]);

  const upgradeCaseChance = useCallback(() => {
    const lvl = stateRef.current.upgrades.caseChanceLvl;
    if (lvl >= UPGRADE_CONFIG.caseChance.maxLevel) {
      pushNotification({ message: tr('notifUpgradeMaxed'), type: 'warning' });
      return;
    }
    const cost = getCaseChanceCost(lvl);
    if (stateRef.current.balance < cost) {
      pushNotification({ message: tr('notifNoMoney'), type: 'error' });
      return;
    }
    setState((prev) => ({
      ...prev,
      balance: Math.round((prev.balance - cost) * 100) / 100,
      upgrades: { ...prev.upgrades, caseChanceLvl: prev.upgrades.caseChanceLvl + 1 },
    }));
  }, [pushNotification, tr]);

  const openCase = useCallback(
    (caseId: string): CaseOpenResult | null => {
      const current = stateRef.current;
      const caseItem = current.cases.find((c) => c.id === caseId && !c.opened);
      if (!caseItem) return null;

      const loot = openCaseLoot(caseItem.rarity, current.level);
      const result: CaseOpenResult = {
        rarity: caseItem.rarity,
        loot: { type: loot.type, amount: loot.amount, label: lang === 'ru' ? loot.labelRu : (lang === 'uk' ? loot.label : loot.labelEn) },
      };

      setState((prev) => {
        let next = { ...prev };
        next.cases = prev.cases.filter((c) => c.id !== caseId);
        next.totalCasesOpened = prev.totalCasesOpened + 1;

        if (loot.type === 'cash') {
          next.balance = Math.round((prev.balance + loot.amount) * 100) / 100;
          next.totalEarned = Math.round((prev.totalEarned + loot.amount) * 100) / 100;
        } else if (loot.type === 'gems') {
          next.gems = prev.gems + loot.amount;
          next.totalGemsEarned = prev.totalGemsEarned + loot.amount;
        } else if (loot.type === 'itembag') {
          next.itemBags = (prev.itemBags || 0) + loot.amount;
        } else if (loot.type === 'solar_essence') {
          next.materials = { ...next.materials, solar_essence: (next.materials.solar_essence || 0) + loot.amount };
        }

        return next;
      });

      pushNotification({
        message: `${tr('caseOpened')} ${lang === 'ru' ? CASE_RARITIES[caseItem.rarity].nameRu : (lang === 'uk' ? CASE_RARITIES[caseItem.rarity].nameUk : CASE_RARITIES[caseItem.rarity].nameEn)}: ${result.loot.label}`,
        type: 'case',
        color: CASE_RARITIES[caseItem.rarity].color,
      });

      return result;
    },
    [pushNotification, tr, lang]
  );

  const openAllCases = useCallback((): CaseOpenResult[] => {
    const current = stateRef.current;
    const unopened = current.cases.filter((c) => !c.opened);
    if (unopened.length === 0) return [];

    const results: CaseOpenResult[] = [];
    let totalCash = 0;
    let totalGems = 0;
    let totalItemBags = 0;
    let totalSolarEssence = 0;

    for (const caseItem of unopened) {
      const loot = openCaseLoot(caseItem.rarity, current.level);
      results.push({
        rarity: caseItem.rarity,
        loot: { type: loot.type, amount: loot.amount, label: lang === 'ru' ? loot.labelRu : (lang === 'uk' ? loot.label : loot.labelEn) },
      });
      if (loot.type === 'cash') totalCash += loot.amount;
      else if (loot.type === 'gems') totalGems += loot.amount;
      else if (loot.type === 'itembag') totalItemBags += loot.amount;
      else if (loot.type === 'solar_essence') totalSolarEssence += loot.amount;
    }

    setState((prev) => {
      let next = { ...prev };
      next.cases = [];
      next.totalCasesOpened = prev.totalCasesOpened + unopened.length;
      if (totalCash > 0) {
        next.balance = Math.round((prev.balance + totalCash) * 100) / 100;
        next.totalEarned = Math.round((prev.totalEarned + totalCash) * 100) / 100;
      }
      if (totalGems > 0) {
        next.gems = prev.gems + totalGems;
        next.totalGemsEarned = prev.totalGemsEarned + totalGems;
      }
      if (totalItemBags > 0) {
        next.itemBags = (prev.itemBags || 0) + totalItemBags;
      }
      if (totalSolarEssence > 0) {
        next.materials = { ...next.materials, solar_essence: (next.materials.solar_essence || 0) + totalSolarEssence };
      }
      return next;
    });

    pushNotification({
      message: `${tr('caseOpened')} ${unopened.length}x`,
      type: 'case',
    });

    return results;
  }, [pushNotification, tr, lang]);

  const openCasesByRarity = useCallback((rarity: CaseRarity): CaseOpenResult[] => {
    const current = stateRef.current;
    const matching = current.cases.filter((c) => !c.opened && c.rarity === rarity);
    if (matching.length === 0) return [];

    const results: CaseOpenResult[] = [];
    let totalCash = 0;
    let totalGems = 0;
    let totalItemBags = 0;
    let totalSolarEssence = 0;

    for (const caseItem of matching) {
      const loot = openCaseLoot(caseItem.rarity, current.level);
      results.push({
        rarity: caseItem.rarity,
        loot: { type: loot.type, amount: loot.amount, label: lang === 'ru' ? loot.labelRu : (lang === 'uk' ? loot.label : loot.labelEn) },
      });
      if (loot.type === 'cash') totalCash += loot.amount;
      else if (loot.type === 'gems') totalGems += loot.amount;
      else if (loot.type === 'itembag') totalItemBags += loot.amount;
      else if (loot.type === 'solar_essence') totalSolarEssence += loot.amount;
    }

    setState((prev) => {
      let next = { ...prev };
      next.cases = prev.cases.filter((c) => c.opened || c.rarity !== rarity);
      next.totalCasesOpened = prev.totalCasesOpened + matching.length;
      if (totalCash > 0) {
        next.balance = Math.round((prev.balance + totalCash) * 100) / 100;
        next.totalEarned = Math.round((prev.totalEarned + totalCash) * 100) / 100;
      }
      if (totalGems > 0) {
        next.gems = prev.gems + totalGems;
        next.totalGemsEarned = prev.totalGemsEarned + totalGems;
      }
      if (totalItemBags > 0) {
        next.itemBags = (prev.itemBags || 0) + totalItemBags;
      }
      if (totalSolarEssence > 0) {
        next.materials = { ...next.materials, solar_essence: (next.materials.solar_essence || 0) + totalSolarEssence };
      }
      return next;
    });

    pushNotification({
      message: `${tr('caseOpened')} ${matching.length}x`,
      type: 'case',
    });

    return results;
  }, [pushNotification, tr, lang]);

  const startExpedition = useCallback(
    (expeditionId: string) => {
      const current = stateRef.current;
      if (current.activeExpeditions.length >= MAX_ACTIVE_EXPEDITIONS) {
        pushNotification({ message: tr('expeditionsMaxActive'), type: 'warning' });
        return;
      }
      const expedition = current.availableExpeditions.find((e) => e.id === expeditionId);
      if (!expedition) return;

      const now = Date.now();
      const reducedDuration = Math.round(expedition.durationSeconds * 1000 * (1 - totalItemEffects.expeditionTimeReductionPct / 100));
      const active: GeneratedExpedition = {
        ...expedition,
        startTime: now,
        completedAt: now + reducedDuration,
      };

      setState((prev) => ({
        ...prev,
        availableExpeditions: prev.availableExpeditions.filter((e) => e.id !== expeditionId),
        activeExpeditions: [...prev.activeExpeditions, active],
      }));
      pushNotification({ message: tr('expeditionsStarted'), type: 'success' });
    },
    [pushNotification, tr, totalItemEffects]
  );

  const claimExpedition = useCallback(
    (expeditionId: string) => {
      const current = stateRef.current;
      const expedition = current.activeExpeditions.find((e) => e.id === expeditionId);
      if (!expedition || !expedition.completedAt) return;

      const now = Date.now();
      if (now < expedition.completedAt) return;

      const newCases: Array<{ id: string; rarity: CaseRarity; opened: boolean }> = [];
      for (const caseChance of expedition.caseChances) {
        if (Math.random() * 100 <= caseChance.chance) {
          const amount = caseChance.minAmount + Math.floor(Math.random() * (caseChance.maxAmount - caseChance.minAmount + 1));
          for (let i = 0; i < amount; i++) {
            newCases.push({
              id: `exp_${expedition.id}_${caseChance.caseType}_${i}_${Date.now()}`,
              rarity: caseChance.caseType,
              opened: false,
            });
          }
        }
      }

      const newMaterials = { ...current.materials };
      let lootMult = 1;
      if (Math.random() < totalItemEffects.expeditionLootChance) {
        lootMult = totalItemEffects.expeditionLootMult;
      }
      for (const mat of expedition.materialsReward) {
        newMaterials[mat.materialId] = (newMaterials[mat.materialId] || 0) + Math.ceil(mat.amount * lootMult);
      }

      setState((prev) => {
        let next: GameState = {
          ...prev,
          balance: Math.round((prev.balance + expedition.cashReward) * 100) / 100,
          gems: prev.gems + expedition.diamondReward,
          totalEarned: Math.round((prev.totalEarned + expedition.cashReward) * 100) / 100,
          totalGemsEarned: prev.totalGemsEarned + expedition.diamondReward,
          materials: newMaterials,
          activeExpeditions: prev.activeExpeditions.filter((e) => e.id !== expeditionId),
          cases: [...prev.cases, ...newCases],
        };
        return next;
      });

      pushNotification({ message: tr('expeditionsClaimed'), type: 'success' });
    },
    [pushNotification, tr, totalItemEffects]
  );

  const refreshExpeditions = useCallback(() => {
    const refreshMs = Math.round(EXPEDITION_REFRESH_MS * (1 - totalItemEffects.expeditionRefreshReductionPct / 100));
    setState((prev) => ({
      ...prev,
      availableExpeditions: generateExpeditionSlots(prev.level),
      expeditionRefreshAt: Date.now() + refreshMs,
    }));
    pushNotification({ message: tr('expeditionsRefreshed'), type: 'info' });
  }, [pushNotification, tr, totalItemEffects]);

  const openItemBag = useCallback(() => {
    const current = stateRef.current;
    if ((current.itemBags || 0) <= 0) {
      pushNotification({ message: tr('noItemBags'), type: 'error' });
      return;
    }
    const { type, rarity } = rollItemFromBag();
    const newItem: OwnedItem = {
      uid: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      rarity,
      level: rarity as ItemLevel,
    };
    setState((prev) => ({
      ...prev,
      itemBags: (prev.itemBags || 0) - 1,
      ownedItems: [...prev.ownedItems, newItem],
    }));
    const name = getItemName(type, lang);
    const levelName = getItemLevelName(rarity as ItemLevel, lang);
    pushNotification({ message: `${tr('itemReceived')}: ${name} (${levelName})`, type: 'drop', color: ITEM_TYPES[type].color });
  }, [pushNotification, tr, lang]);

  const isSlotUnlocked = useCallback((slot: number): boolean => {
    const level = stateRef.current.level;
    if (slot === 0) return true;
    if (slot === 1) return level >= 10;
    if (slot === 2) return level >= 20;
    if (slot === 3) return level >= 30;
    if (slot === 4) return level >= 40;
    if (slot === 5) return level >= 40 && stateRef.current.slot6Unlocked;
    return false;
  }, []);

  const SLOT6_UNLOCK_COST = 100;

  const unlockSlot6 = useCallback(() => {
    const current = stateRef.current;
    if (current.slot6Unlocked) return;
    if (current.level < 40) {
      pushNotification({ message: tr('notifNeedHigherLevel'), type: 'error' });
      return;
    }
    if (current.gems < SLOT6_UNLOCK_COST) {
      pushNotification({ message: tr('notifNoGems'), type: 'error' });
      return;
    }
    setState((prev) => ({
      ...prev,
      gems: prev.gems - SLOT6_UNLOCK_COST,
      slot6Unlocked: true,
    }));
    pushNotification({
      message: lang === 'ru' ? 'Слот 6 разблокирован!' : (lang === 'uk' ? 'Слот 6 розблоковано!' : 'Slot 6 unlocked!'),
      type: 'success',
    });
  }, [pushNotification, tr, lang]);

  const equipItem = useCallback((uid: string, slot: number) => {
    if (slot < 0 || slot > 5) return;
    if (!isSlotUnlocked(slot)) return;
    setState((prev) => {
      const item = prev.ownedItems.find((o) => o.uid === uid);
      if (!item) return prev;
      const equipped = [...prev.equippedItems];
      for (let i = 0; i < equipped.length; i++) {
        if (equipped[i] === uid) equipped[i] = null;
      }
      const existingSlot = equipped.findIndex((eid) => {
        if (!eid) return false;
        const existing = prev.ownedItems.find((o) => o.uid === eid);
        return existing && existing.type === item.type;
      });
      if (existingSlot >= 0 && existingSlot !== slot) {
        equipped[existingSlot] = null;
      }
      equipped[slot] = uid;
      return { ...prev, equippedItems: equipped };
    });
    const item = stateRef.current.ownedItems.find((o) => o.uid === uid);
    if (item) {
      const equipped = stateRef.current.equippedItems;
      const existing = equipped.find((eid) => {
        if (!eid || eid === uid) return false;
        const ex = stateRef.current.ownedItems.find((o) => o.uid === eid);
        return ex && ex.type === item.type;
      });
      if (existing) {
        pushNotification({
          message: lang === 'ru' ? 'Предыдущий предмет заменён на этот!' : (lang === 'uk' ? 'Попередній предмет замінено на цей!' : 'Previous item replaced with this one!'),
          type: 'info',
        });
      }
    }
  }, [pushNotification, lang]);

  const unequipItem = useCallback((slot: number) => {
    if (slot < 0 || slot > 5) return;
    setState((prev) => {
      const equipped = [...prev.equippedItems];
      equipped[slot] = null;
      return { ...prev, equippedItems: equipped };
    });
  }, []);

  const upgradeItem = useCallback((uid: string) => {
    const current = stateRef.current;
    const item = current.ownedItems.find((o) => o.uid === uid);
    if (!item) return;
    if (item.level >= 7) {
      pushNotification({ message: tr('itemMaxLevel'), type: 'warning' });
      return;
    }
    const cost: MaterialCost = UPGRADE_COSTS[item.level];
    const newLevel = (item.level + 1) as ItemLevel;
    const nextCost = UPGRADE_COSTS[newLevel];
    if (!nextCost) {
      pushNotification({ message: tr('itemMaxLevel'), type: 'warning' });
      return;
    }
    if (cost.gems && current.gems < cost.gems) {
      pushNotification({ message: tr('notifNoGems'), type: 'error' });
      return;
    }
    for (const [matId, amount] of Object.entries(cost)) {
      if (matId === 'gems') continue;
      if ((current.materials[matId] || 0) < (amount as number)) {
        pushNotification({ message: tr('itemNotEnoughMaterials'), type: 'error' });
        return;
      }
    }
    setState((prev) => {
      const newMaterials = { ...prev.materials };
      for (const [matId, amount] of Object.entries(cost)) {
        if (matId === 'gems') continue;
        newMaterials[matId] = (newMaterials[matId] || 0) - (amount as number);
      }
      const newGems = cost.gems ? prev.gems - cost.gems : prev.gems;
      return {
        ...prev,
        gems: newGems,
        materials: newMaterials,
        ownedItems: prev.ownedItems.map((o) =>
          o.uid === uid ? { ...o, level: newLevel } : o
        ),
      };
    });
    const name = getItemName(item.type, lang);
    const levelName = getItemLevelName(newLevel, lang);
    pushNotification({ message: `${name} → ${levelName}!`, type: 'success' });
  }, [pushNotification, tr, lang]);

  const [backpackOpen, setBackpackOpen] = useState(false);
  const [itemsOpen, setItemsOpen] = useState(false);

  const value: GameContextValue = {
    state,
    notifications,
    floatTexts,
    activeTab,
    setActiveTab,
    dig,
    collectBasket,
    buyActiveLease,
    buyAutoLease,
    confirmLeasePurchase,
    cancelLeasePurchase,
    pendingLeasePurchase,
    buyFood,
    buyPickaxe,
    switchPickaxe,
    equipPickaxe,
    sellResource,
    sellAll,
    setLang,
    setTheme,
    resetGame,
    t: tr,
    lang,
    theme,
    claimStarterGift,
    redeemPromoCode,
    upgradeActiveLeaseMult,
    upgradeAutoLeaseMult,
    upgradeAutoCooldown,
    upgradeBasketCap,
    upgradeCaseChance,
    openCase,
    openAllCases,
    openCasesByRarity,
    backpackOpen,
    setBackpackOpen,
    currentAutoCooldownMs,
    currentBasketCap,
    activeLeaseMult,
    autoLeaseMult,
    currentMineId: currentMineIdState,
    setCurrentMineId,
    repairActivePickaxe,
    upgradeEnergyMax,
    upgradeEnergyRegen,
    upgradeEnergyRegenAmount,
    claimDailyReward,
    currentEnergyMax,
    currentEnergyRegenSeconds,
    currentEnergyRegenAmount,
    startExpedition,
    claimExpedition,
    refreshExpeditions,
    itemsOpen,
    setItemsOpen,
    openItemBag,
    equipItem,
    unequipItem,
    upgradeItem,
    unlockSlot6,
    isSlotUnlocked,
    totalItemEffects,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
