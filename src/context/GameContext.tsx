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
} from '@/config/minesConfig';
import {
  ACTIVE_LEASE_PRICE_PER_SEC,
  AUTO_LEASE_PRICE_PER_SEC,
  STARTER_GIFT_SECONDS,
  PICKAXE_TIERS,
  getPickaxeTier,
  FOOD_ITEMS,
  getRepairCost,
} from '@/config/pickaxesConfig';
import { ADMIN_CODE, ADMIN_CODE_REWARD } from '@/config/promocodesConfig';
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
} from '@/config/upgradesConfig';
import { DAILY_REWARDS, DAILY_CLAIM_COOLDOWN_MS } from '@/config/rewardsConfig';
import { convertToSeconds } from '@/config';
import { translations, type TranslationKey } from '@/i18n';

export type { CaseOpenResult };

const STORAGE_KEY = 'mining-sim-v3-save';

function createInitialState(): GameState {
  return {
    balance: 0,
    gems: 0,
    energy: ENERGY_MAX,
    maxEnergy: ENERGY_MAX,
    activePickaxe: {
      id: 'starter-pickaxe',
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
    },
    autoBasket: [],
    autoBasketMax: BASE_AUTO_BASKET_MAX,
    activeLeaseEndsAt: null,
    activeLeaseTotal: 0,
    autoMiningEndsAt: null,
    autoMiningTotal: 0,
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
    upgrades: {
      activeLeaseMult: 0,
      autoLeaseMult: 0,
      autoCooldownLvl: 0,
      basketCapLvl: 0,
      caseChanceLvl: 0,
      energyMaxLvl: 0,
      energyRegenLvl: 0,
    },
    starterGiftClaimed: false,
    redeemedPromoCodes: [],
    ownedPickaxes: ['rusty'],
    currentMineId: 1,
    dailyCalendar: {
      lastClaimDay: 0,
      lastClaimTimestamp: null,
    },
    settings: {
      lang: 'uk',
      theme: 'dark',
    },
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

  merged.maxEnergy = getEnergyMaxValue(merged.upgrades.energyMaxLvl);
  if (merged.energy > merged.maxEnergy) merged.energy = merged.maxEnergy;

  const ownedSet = new Set(merged.ownedPickaxes || []);
  ownedSet.add('rusty');
  merged.ownedPickaxes = Array.from(ownedSet);

  if (merged.activePickaxe) {
    const tier = getPickaxeTier(merged.activePickaxeTierId);
    merged.activePickaxe.maxDurability = tier.maxDurability;
    merged.activePickaxe.name = merged.settings.lang === 'uk' ? tier.nameUk : tier.nameEn;
    if (merged.activePickaxe.durability > tier.maxDurability) {
      merged.activePickaxe.durability = tier.maxDurability;
    }
  }

  merged.sparePickaxes = merged.sparePickaxes.map((px) => {
    const tier = getPickaxeTier(px.pickaxeTierId);
    return {
      ...px,
      maxDurability: tier.maxDurability,
      name: merged.settings.lang === 'uk' ? tier.nameUk : tier.nameEn,
      durability: Math.min(px.durability, tier.maxDurability),
    };
  });

  return merged;
}

function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const saved = JSON.parse(raw) as Partial<GameState>;
    return migrateState(saved);
  } catch {
    return createInitialState();
  }
}

function saveState(state: GameState) {
  try {
    const toSave = { ...state, lastSavedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // ignore
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
  redeemPromoCode: (code: string) => void;
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
  claimDailyReward: () => void;
  currentEnergyMax: number;
  currentEnergyRegenSeconds: number;
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
    const handler = () => saveState(stateRef.current);
    window.addEventListener('beforeunload', handler);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) saveState(stateRef.current);
    });
    return () => {
      window.removeEventListener('beforeunload', handler);
      saveState(stateRef.current);
    };
  }, []);

  const currentAutoCooldownMs = getAutoCooldownMs(state.upgrades.autoCooldownLvl);
  const currentBasketCap = getBasketCapValue(state.upgrades.basketCapLvl);
  const activeLeaseMult = getLeaseMultValue('activeLeaseMult', state.upgrades.activeLeaseMult);
  const autoLeaseMult = getLeaseMultValue('autoLeaseMult', state.upgrades.autoLeaseMult);
  const currentEnergyMax = getEnergyMaxValue(state.upgrades.energyMaxLvl);
  const currentEnergyRegenSeconds = getEnergyRegenValue(state.upgrades.energyRegenLvl);
  const [currentMineIdState, setCurrentMineIdState] = useState<number>(state.currentMineId || 1);

  const setCurrentMineId = useCallback((id: number) => {
    setCurrentMineIdState(id);
    setState((prev) => ({ ...prev, currentMineId: id }));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const prev = lastTickRef.current;
      lastTickRef.current = now;
      const deltaSec = (now - prev) / 1000;

      setState((prev) => {
        let next = { ...prev };
        let changed = false;

        if (next.energy < next.maxEnergy) {
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
          const regenAmount = (deltaSec / regenSeconds) * totalRegenMult;
          const newEnergy = Math.min(next.maxEnergy, next.energy + regenAmount);
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

        const autoCooldown = getAutoCooldownMs(next.upgrades.autoCooldownLvl);
        const basketCap = getBasketCapValue(next.upgrades.basketCapLvl);

        if (next.autoMiningEndsAt && now < next.autoMiningEndsAt) {
          const elapsedSinceDig = now - next.lastAutoDigAt;
          if (elapsedSinceDig >= autoCooldown && next.autoBasket.length < basketCap) {
            const resource = getRandomResourceForMine(next.currentMineId || 1);
            const tier = getPickaxeTier(next.activePickaxeTierId);
            const mass = Math.round(getRandomMass(resource) * tier.yieldMultiplier * 100) / 100;
            const xp = resource.xp;
            next.autoBasket = [...next.autoBasket, { resource: resource.type, mass, xp, timestamp: now }];
            next.lastAutoDigAt = now;
            next.totalDigs = next.totalDigs + 1;

            if (next.activePickaxe) {
              const newDur = next.activePickaxe.durability - tier.durabilityCost;
              if (newDur <= 0) {
                if (next.sparePickaxes.length > 0) {
                  const spare = next.sparePickaxes[0];
                  next.activePickaxe = { ...spare };
                  next.sparePickaxes = next.sparePickaxes.slice(1);
                  pushNotification({ message: tr('notifPickaxeSwapped'), type: 'info' });
                } else {
                  next.activePickaxe = null;
                  pushNotification({ message: tr('notifNoSparePickaxe'), type: 'error' });
                }
              } else {
                next.activePickaxe = { ...next.activePickaxe, durability: newDur };
              }
            }

            if (rollCaseDrop(next.upgrades.caseChanceLvl)) {
              const rarity = rollCaseRarity();
              next.cases = [...next.cases, { id: `case-${now}-${Math.random()}`, rarity, opened: false }];
              pushNotification({ message: tr('notifCaseDropped'), type: 'case', color: CASE_RARITIES[rarity].color });
              changed = true;
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
        const activeBuffs = next.buffs.filter((b) => b.expiresAt > now);
        let totalRegenMult = 1;
        for (const buff of activeBuffs) totalRegenMult += buff.regenMultiplier;
        next.buffs = activeBuffs;
        const regenAmount = (offlineSec / ENERGY_REGEN_SECONDS) * totalRegenMult;
        next.energy = Math.min(next.maxEnergy, next.energy + regenAmount);
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
          const resource = getRandomResourceForMine(next.currentMineId || 1);
          const mass = Math.round(getRandomMass(resource) * tier.yieldMultiplier * 100) / 100;
          basket.push({ resource: resource.type, mass, xp: resource.xp, timestamp: now });
          digsDone++;

          if (next.activePickaxe) {
            const newDur = next.activePickaxe.durability - tier.durabilityCost;
            if (newDur <= 0) {
              if (next.sparePickaxes.length > 0) {
                const spare = next.sparePickaxes[0];
                next.activePickaxe = { ...spare };
                next.sparePickaxes = next.sparePickaxes.slice(1);
              } else {
                next.activePickaxe = null;
                break;
              }
            } else {
              next.activePickaxe = { ...next.activePickaxe, durability: newDur };
            }
          } else {
            break;
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
          name: lang === 'uk' ? fallbackTier.nameUk : fallbackTier.nameEn,
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

      if (!current.activeLeaseEndsAt || current.activeLeaseEndsAt <= now) {
        pushNotification({ message: tr('notifNoLease'), type: 'error' });
        return;
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
      const mineId = stateRef.current.currentMineId || 1;
      for (let i = 0; i < tier.yieldMultiplier; i++) {
        const r = getRandomResourceForMine(mineId);
        const m = Math.round(getRandomMass(r) * 100) / 100;
        rolls.push({ resource: r, mass: m });
      }
      const totalMass = rolls.reduce((sum, r) => sum + r.mass, 0);
      const totalXp = rolls.reduce((sum, r) => sum + r.resource.xp, 0);

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
            next.activePickaxe = null;
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

        return next;
      });

      const fx = x ?? window.innerWidth / 2;
      const fy = y ?? window.innerHeight / 2;
      for (const roll of rolls) {
        const resName = lang === 'uk' ? roll.resource.nameUk : roll.resource.nameEn;
        pushFloatText(`+${roll.mass.toFixed(2)} kg ${resName}`, fx, fy, roll.resource.color);
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
      const mult = getLeaseMultValue('activeLeaseMult', stateRef.current.upgrades.activeLeaseMult);
      const seconds = Math.floor(rawSeconds * mult);
      const cost = rawSeconds * ACTIVE_LEASE_PRICE_PER_SEC;
      if (stateRef.current.balance < cost) {
        pushNotification({ message: tr('notifNoMoney'), type: 'error' });
        return;
      }
      const now = Date.now();
      const baseEnd = stateRef.current.activeLeaseEndsAt && stateRef.current.activeLeaseEndsAt > now ? stateRef.current.activeLeaseEndsAt : now;
      setState((prev) => ({
        ...prev,
        balance: Math.round((prev.balance - cost) * 100) / 100,
        activeLeaseEndsAt: baseEnd + seconds * 1000,
        activeLeaseTotal: (prev.activeLeaseTotal || 0) + seconds,
      }));
      pushNotification({ message: tr('leasePurchased'), type: 'success' });
    },
    [pushNotification, tr]
  );

  const buyAutoLease = useCallback(
    (value: number, unit: TimeUnit) => {
      const rawSeconds = convertToSeconds(value, unit);
      if (rawSeconds < MIN_LEASE_SECONDS) {
        pushNotification({ message: tr('notifMinLease'), type: 'error' });
        return;
      }
      const mult = getLeaseMultValue('autoLeaseMult', stateRef.current.upgrades.autoLeaseMult);
      const seconds = Math.floor(rawSeconds * mult);
      const cost = rawSeconds * AUTO_LEASE_PRICE_PER_SEC;
      if (stateRef.current.balance < cost) {
        pushNotification({ message: tr('notifNoMoney'), type: 'error' });
        return;
      }
      const now = Date.now();
      const baseEnd = stateRef.current.autoMiningEndsAt && stateRef.current.autoMiningEndsAt > now ? stateRef.current.autoMiningEndsAt : now;
      const prevLastDig = stateRef.current.lastAutoDigAt;
      const autoCooldown = getAutoCooldownMs(stateRef.current.upgrades.autoCooldownLvl);
      setState((prev) => ({
        ...prev,
        balance: Math.round((prev.balance - cost) * 100) / 100,
        autoMiningEndsAt: baseEnd + seconds * 1000,
        autoMiningTotal: (prev.autoMiningTotal || 0) + seconds,
        lastAutoDigAt: prevLastDig < now - autoCooldown ? now : prevLastDig,
      }));
      pushNotification({ message: tr('leasePurchased'), type: 'success' });
    },
    [pushNotification, tr]
  );

  const buyFood = useCallback(
    (foodId: string) => {
      const food = FOOD_ITEMS.find((f) => f.id === foodId);
      if (!food) return;
      if (stateRef.current.balance < food.price) {
        pushNotification({ message: tr('notifNoMoney'), type: 'error' });
        return;
      }
      setState((prev) => {
        let next = { ...prev };
        next.balance = Math.round((prev.balance - food.price) * 100) / 100;

        if (food.energyBoost > 0) {
          if (prev.energy >= prev.maxEnergy) {
            pushNotification({ message: tr('notifEnergyFull'), type: 'info' });
          }
          next.energy = Math.min(prev.maxEnergy, prev.energy + food.energyBoost);
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
    [pushNotification, tr]
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
              name: lang === 'uk' ? tier.nameUk : tier.nameEn,
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
              name: lang === 'uk' ? tier.nameUk : tier.nameEn,
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
      const name = lang === 'uk' ? tier.nameUk : tier.nameEn;
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
        name: lang === 'uk' ? tier.nameUk : tier.nameEn,
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
      const name = lang === 'uk' ? tier.nameUk : tier.nameEn;
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
      const name = lang === 'uk' ? getPickaxeTier(stateRef.current.activePickaxeTierId).nameUk : getPickaxeTier(stateRef.current.activePickaxeTierId).nameEn;
      pushNotification({ message: `${tr('switchPickaxe')}: ${name}`, type: 'info' });
    },
    [pushNotification, tr, lang]
  );

  const repairActivePickaxe = useCallback(() => {
    const current = stateRef.current;
    if (!current.activePickaxe) {
      const fallbackTier = PICKAXE_TIERS[0];
      setState((prev) => ({
        ...prev,
        activePickaxe: {
          id: `pickaxe-fallback-${Date.now()}`,
          pickaxeTierId: fallbackTier.id,
          name: lang === 'uk' ? fallbackTier.nameUk : fallbackTier.nameEn,
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
  }, [pushNotification, tr]);

  const upgradeEnergyRegen = useCallback(() => {
    const lvl = stateRef.current.upgrades.energyRegenLvl;
    if (lvl >= UPGRADE_CONFIG.energyRegen.maxLevel) {
      pushNotification({ message: tr('notifUpgradeMaxed'), type: 'warning' });
      return;
    }
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
  }, [pushNotification, tr]);

  const claimDailyReward = useCallback(() => {
    const current = stateRef.current;
    const dc = current.dailyCalendar || { lastClaimDay: 0, lastClaimTimestamp: null };
    const nextDay = dc.lastClaimDay + 1;
    if (nextDay > DAILY_REWARDS.length) {
      pushNotification({ message: tr('claimed'), type: 'info' });
      return;
    }
    const reward = DAILY_REWARDS[nextDay - 1];
    const now = Date.now();
    if (dc.lastClaimTimestamp && now - dc.lastClaimTimestamp < DAILY_CLAIM_COOLDOWN_MS) {
      pushNotification({ message: tr('locked'), type: 'warning' });
      return;
    }
    setState((prev) => ({
      ...prev,
      balance: Math.round((prev.balance + reward) * 100) / 100,
      dailyCalendar: { lastClaimDay: nextDay, lastClaimTimestamp: now },
    }));
    pushNotification({ message: `${tr('dailyReward')}: +${reward}`, type: 'success' });
  }, [pushNotification, tr]);

  const sellResource = useCallback(
    (type: ResourceType) => {
      const current = stateRef.current;
      const entry = current.inventory[type];
      if (entry.mass <= 0) return;
      const res = RESOURCES[type];
      const earned = Math.round(entry.mass * res.pricePerKg * 100) / 100;
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
    [pushNotification, tr]
  );

  const sellAll = useCallback(() => {
    const current = stateRef.current;
    let total = 0;
    const inv = { ...current.inventory };
    for (const res of RESOURCE_LIST) {
      const entry = inv[res.type];
      if (entry.mass > 0) {
        total += entry.mass * res.pricePerKg;
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
  }, [pushNotification, tr]);

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
    }));
    pushNotification({ message: tr('giftClaimed'), type: 'success' });
  }, [pushNotification, tr]);

  const redeemPromoCode = useCallback(
    (code: string) => {
      const cleanCode = code.trim().toLowerCase();
      if (!cleanCode) return;

      const current = stateRef.current;
      const usedCodes = current.redeemedPromoCodes || [];

      if (usedCodes.includes(cleanCode)) {
        pushNotification({ message: tr('promoUsed'), type: 'error' });
        return;
      }

      let success = false;
      let message = '';
      let bonusBalance = 0;
      const newCases: Array<{ id: string; rarity: CaseRarity; opened: boolean }> = [];
      const allRarities: CaseRarity[] = ['common', 'rare', 'epic', 'legendary'];

      if (cleanCode === ADMIN_CODE) {
        bonusBalance = ADMIN_CODE_REWARD;
        message = tr('promoSuccess');
        success = true;
      } else if (cleanCode === 'adm_case') {
        allRarities.forEach((r) => {
          for (let i = 0; i < 10; i++) {
            newCases.push({ id: `adm_${r}_${i}_${Date.now()}`, rarity: r, opened: false });
          }
        });
        message = lang === 'uk' ? 'Отримано по 10 кейсів кожного виду!' : 'Received 10 cases of each rarity!';
        success = true;
      } else if (cleanCode === 'start') {
        bonusBalance = 100;
        newCases.push({ id: `start_${Date.now()}`, rarity: 'common', opened: false });
        message = lang === 'uk' ? '+$100 та 1 Звичайний кейс!' : '+$100 and 1 Common case!';
        success = true;
      } else if (cleanCode === 'megafixes') {
        bonusBalance = 50;
        allRarities.forEach((r) => {
          newCases.push({ id: `mega_${r}_${Date.now()}`, rarity: r, opened: false });
        });
        message = lang === 'uk' ? '+$50 та по 1 кейсу кожного виду!' : '+$50 and 1 case of each rarity!';
        success = true;
      }

      if (!success) {
        pushNotification({ message: tr('promoInvalid'), type: 'error' });
        return;
      }

      setState((prev) => ({
        ...prev,
        balance: Math.round(((Number(prev.balance) || 0) + bonusBalance) * 100) / 100,
        cases: [...(prev.cases || []), ...newCases],
        redeemedPromoCodes: [...(prev.redeemedPromoCodes || []), cleanCode],
      }));

      pushNotification({ message, type: 'success' });
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
        loot: { type: loot.type, amount: loot.amount, label: lang === 'uk' ? loot.label : loot.labelEn },
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
        }

        return next;
      });

      pushNotification({
        message: `${tr('caseOpened')} ${lang === 'uk' ? CASE_RARITIES[caseItem.rarity].nameUk : CASE_RARITIES[caseItem.rarity].nameEn}: ${result.loot.label}`,
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

    for (const caseItem of unopened) {
      const loot = openCaseLoot(caseItem.rarity, current.level);
      results.push({
        rarity: caseItem.rarity,
        loot: { type: loot.type, amount: loot.amount, label: lang === 'uk' ? loot.label : loot.labelEn },
      });
      if (loot.type === 'cash') totalCash += loot.amount;
      else if (loot.type === 'gems') totalGems += loot.amount;
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

    for (const caseItem of matching) {
      const loot = openCaseLoot(caseItem.rarity, current.level);
      results.push({
        rarity: caseItem.rarity,
        loot: { type: loot.type, amount: loot.amount, label: lang === 'uk' ? loot.label : loot.labelEn },
      });
      if (loot.type === 'cash') totalCash += loot.amount;
      else if (loot.type === 'gems') totalGems += loot.amount;
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
      return next;
    });

    pushNotification({
      message: `${tr('caseOpened')} ${matching.length}x`,
      type: 'case',
    });

    return results;
  }, [pushNotification, tr, lang]);

  const [backpackOpen, setBackpackOpen] = useState(false);

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
    claimDailyReward,
    currentEnergyMax,
    currentEnergyRegenSeconds,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
