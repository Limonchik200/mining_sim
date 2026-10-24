import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  useState,
  useMemo,
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
  DIG_COOLDOWN_MS,
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
  rollAutoCaseDrop,
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
  getBackpackCost,
  getBackpackWeightLimit,
  getLuckCost,
  getLuckChance,
  getDiamondChanceCost,
  getDiamondChanceBonus,
  EQUIPMENT_CONFIG,
  RESPIRATOR_FILTER_PRICE,
  CART_STATION_PRICE,
  RAIL_UNIT_PRICE,
  WOODEN_BRACING_UNIT_PRICE,
  equipmentUpgradeCost,
  equipmentMaxLevelIncludingNextMine,
  mineRequiredForNextEquipmentLevel,
  type EquipmentType,
} from '@/config/upgradesConfig';
import { MINES, getMineById } from '@/config/minesConfig';
import type { MineUnlockRequirements, MineUnlockTimer, EquipmentUpgradeState } from '@/types';
import type { CraftRecipe, OxygenTankType, BatteryType, CoolerType, CoolerMode } from '@/types/craft';
import { CRAFT_RECIPES, canCraft as canCraftRecipe, craftRecipe as executeCraftRecipe, getCraftItemName } from '@/config/craftConfig';
import { generateMaterialsShopSlots, getSlotPrice, MATERIALS_SHOP_REFRESH_MS } from '@/config/materialsShopConfig';
import { generateSpecialOffers, getOfferPriceGems, SPECIAL_OFFER_BUNDLES, type SpecialOfferBundle } from '@/config/specialOffersConfig';
import {
  CANISTER_PRICE,
  createCanister,
  generateDiesel95Price,
  getAvailableFuelSpace,
  addFuel,
  DIESEL95_UPDATE_MS,
} from '@/config/fuelConfig';
import { OXYGEN_TANK_CONFIGS, createOxygenTank } from '@/config/oxygenConfig';
import { BATTERY_CONFIGS, createBattery } from '@/config/batteryConfig';
import { COOLER_CONFIGS, createCooler, getCoolerDegradationPerSec } from '@/config/coolerConfig';
import {
  GENERATOR_PRICE,
  GENERATOR_FUEL_PER_MIN,
  GENERATOR_LITHIUM_SLOTS,
  canActivateGenerator,
} from '@/config/generatorConfig';
import { getAvailableSpace, getBatterySpace, getOxygenTankSpace, getCanisterSpace, getGeneratorSpace, getTotalSpace, getUsedSpace, MAX_SHELVES, SHELF_SPACE } from '@/config/warehouseConfig';
import { DAILY_REWARDS, DAILY_CLAIM_COOLDOWN_MS, getDailyRewardScaled, type DailyReward } from '@/config/rewardsConfig';
import { convertToSeconds, formatMoney } from '@/config';
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
  UPGRADE_COSTS,
  getItemName,
  getItemLevelName,
  type MaterialCost,
} from '@/config/itemsConfig';
import type { OwnedItem, ItemEffect, ItemLevel } from '@/types/items';
import {
  STORAGE_KEY,
  EXPEDITION_REFRESH_MS,
  MAX_ACTIVE_EXPEDITIONS,
  generateExpeditionSlots,
  createInitialState,
  migrateState,
  loadState,
  saveState,
  applyXp,
  type XpResult,
} from './storage';
import { computeTotalItemEffects, computeItemEffectsForRegen } from './itemEffects';
import { processTick, processOfflineProgress } from './autoDig';

export type { CaseOpenResult };





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
  eatFood: (foodId: string) => void;
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
  upgradeBackpack: () => void;
  upgradeLuck: () => void;
  upgradeDiamondChance: () => void;
  openCase: (caseId: string) => CaseOpenResult | null;
  openAllCases: () => CaseOpenResult[];
  openCasesByRarity: (rarity: CaseRarity) => CaseOpenResult[];
  backpackOpen: boolean;
  setBackpackOpen: (open: boolean) => void;
  currentAutoCooldownMs: number;
  currentBasketCap: number;
  currentBackpackLimit: number;
  currentBackpackWeight: number;
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
  openItemBag: () => OwnedItem | null;
  equipItem: (uid: string, slot: number) => void;
  unequipItem: (slot: number) => void;
  upgradeItem: (uid: string) => void;
  recycleItem: (uid: string) => void;
  unlockSlot6: () => void;
  isSlotUnlocked: (slot: number) => boolean;
  totalItemEffects: ItemEffect;
  unlockedMines: number[];
  isMineUnlocked: (mineId: number) => boolean;
  startMineUnlock: (mineId: number) => void;
  speedUpMineUnlock: (mineId: number, minutes: number) => void;
  checkMineUnlockRequirements: (mineId: number) => { met: boolean; requirements: { label: string; current: string; required: string; met: boolean }[] };
  upgradeEquipment: (type: EquipmentType) => void;
  purchaseEquipment: (type: EquipmentType) => void;
  purchaseRespiratorFilter: () => void;
  purchaseCartStation: () => void;
  purchaseRails: (count: number) => void;
  purchaseWoodenBracing: (count: number) => void;
  highestUnlockedMine: number;
  highestAccessibleMine: number;
  craftItem: (recipeIndex: number) => void;
  buyMaterialSlot: (slotId: string) => void;
  buySpecialOffer: (offerIndex: number) => void;
  buyCanister: () => void;
  buyFuel: (liters: number) => void;
  buyOxygenTank: (type: OxygenTankType) => void;
  buyBattery: (type: BatteryType) => void;
  buyCooler: (type: CoolerType) => void;
  toggleCooler: (coolerId: string) => void;
  setCoolerMode: (coolerId: string, mode: CoolerMode) => void;
  switchCooler: (coolerId: string) => void;
  repairCooler: (coolerId: string) => void;
  buyGenerator: () => void;
  toggleGenerator: () => void;
  refuelGenerator: () => void;
  insertLithiumBattery: (batteryId: string) => void;
  removeLithiumBattery: (batteryId: string) => void;
  buyShelf: () => void;
  toggleOxygenValve: () => void;
  sellCanister: (canisterId: string) => void;
  usedWarehouseSpace: number;
  totalWarehouseSpace: number;
  levelUpData: number | null;
  setLevelUpData: (level: number | null) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

let notifIdCounter = 0;
let floatIdCounter = 0;



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
  const currentBackpackLimit = getBackpackWeightLimit(state.upgrades.backpackLvl ?? 0);
  const currentBackpackWeight = Math.round(
    Object.entries(state.inventory).reduce((sum, [type, entry]) => {
      if (!entry || !Number.isFinite(entry.mass)) return sum;
      const res = RESOURCES[type as ResourceType];
      const w = res?.weight ?? 1;
      return sum + entry.mass * w;
    }, 0) * 100
  ) / 100;
  const activeLeaseMult = getLeaseMultValue('activeLeaseMult', state.upgrades.activeLeaseMult);
  const autoLeaseMult = getLeaseMultValue('autoLeaseMult', state.upgrades.autoLeaseMult);
  const currentEnergyMaxBase = getEnergyMaxValue(state.upgrades.energyMaxLvl);
  const currentEnergyRegenSeconds = getEnergyRegenValue(state.upgrades.energyRegenLvl);
  const currentEnergyRegenAmountBase = getEnergyRegenAmountValue(state.upgrades.energyRegenAmountLvl ?? 0);

  const totalItemEffects: ItemEffect = computeTotalItemEffects(state);

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

      setState((prev) => processTick(prev, now, deltaSec, pushNotification, tr));
    }, 250);

    return () => clearInterval(interval);
  }, [pushNotification, tr]);

  useEffect(() => {
    const saved = stateRef.current;
    const now = Date.now();
    const lastSaved = saved.lastSavedAt;
    if (!lastSaved || now - lastSaved < 2000) return;

    const offlineSec = (now - lastSaved) / 1000;

    setState((prev) => processOfflineProgress(prev, now, offlineSec));
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

      // Oxygen check: mine 3+ requires active oxygen tank
      if (!dumpMine && mineId >= 3) {
        const ls = current.lifeSupport;
        const activeTank = ls.activeOxygenTankId
          ? ls.oxygenTanks.find((t) => t.id === ls.activeOxygenTankId)
          : ls.oxygenTanks.find((t) => t.currentOxygen > 0);
        if (!activeTank || activeTank.currentOxygen <= 0) {
          pushNotification({ message: lang === 'ru' ? 'Нет кислорода! Нужен кислородный балон.' : (lang === 'uk' ? 'Немає кисню! Потрібен кисневий балон.' : 'No oxygen! Need an oxygen tank.'), type: 'error' });
          return;
        }
      }

      // Temperature check: must be between 8°C and 18°C
      if (!dumpMine) {
        const mine = getMineById(mineId);
        const baseTemp = mine.environment?.baseTemperature ?? 15;
        const activeCoolers = current.lifeSupport.coolers.filter((c) => c.active && c.durability > 0);
        const tempReduction = activeCoolers.reduce((sum, c) => {
          const cfg = COOLER_CONFIGS[c.type];
          return sum + (cfg.modeConfigs[c.mode]?.tempReduction ?? 0);
        }, 0);
        const currentTemp = baseTemp - tempReduction;
        if (currentTemp < 8 || currentTemp > 18) {
          pushNotification({ message: lang === 'ru' ? `Температура ${currentTemp.toFixed(0)}°C вне нормы (8–18°C)!` : (lang === 'uk' ? `Температура ${currentTemp.toFixed(0)}°C поза нормою (8–18°C)!` : `Temperature ${currentTemp.toFixed(0)}°C out of range (8–18°C)!`), type: 'error' });
          return;
        }
      }

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
      const backpackLvl = current.upgrades.backpackLvl ?? 0;
      const backpackLimit = getBackpackWeightLimit(backpackLvl);
      const currentWeight = Math.round(
        Object.entries(current.inventory).reduce((sum, [type, entry]) => {
          if (!entry || !Number.isFinite(entry.mass)) return sum;
          const res = RESOURCES[type as ResourceType];
          const w = res?.weight ?? 1;
          return sum + entry.mass * w;
        }, 0) * 100
      ) / 100;
      if (currentWeight >= backpackLimit) {
        pushNotification({ message: tr('backpackFull'), type: 'error' });
        return;
      }

      const itemEff = computeTotalItemEffects(current);
      let yieldMult = 1;
      let nozzleTriggered = false;
      if (itemEff.oreYieldMultChance > 0 && Math.random() < itemEff.oreYieldMultChance) {
        yieldMult = itemEff.oreYieldMult;
        nozzleTriggered = true;
      }

      const baseRollCount = tier.yieldMultiplier;
      const totalRollCount = baseRollCount * yieldMult;
      const rolls: { resource: Resource; mass: number }[] = [];
      for (let i = 0; i < totalRollCount; i++) {
        const r = getRandomResourceForMine(mineId);
        const m = Math.round(getRandomMass(r) * 100) / 100;
        rolls.push({ resource: r, mass: m });
      }
      const totalMass = rolls.reduce((sum, r) => sum + r.mass, 0);
      const luckChance = getLuckChance(stateRef.current.upgrades.luckLvl ?? 0);
      const luckTriggered = Math.random() < luckChance;
      const totalXp = rolls.reduce((sum, r) => sum + r.resource.xp, 0) * (luckTriggered ? 2 : 1);

      const diamondBonusFromUpgrades = getDiamondChanceBonus(stateRef.current.upgrades.diamondChanceLvl ?? 0);
      const diamondBonusFromItems = itemEff.diamondDropBonus;
      let diamondDrop = rollDiamondDrop(diamondBonusFromUpgrades + diamondBonusFromItems, mineId);
      if (diamondDrop.dropped && itemEff.diamondMultChance > 0 && Math.random() < itemEff.diamondMultChance) {
        diamondDrop = { dropped: true, amount: diamondDrop.amount * itemEff.diamondMult };
      }

      setState((prev) => {
        let next = { ...prev };
        const pTier = getPickaxeTier(prev.activePickaxeTierId);
        next.energy = Math.max(0, prev.energy - pTier.energyCost);
        next.totalDigs = prev.totalDigs + 1;

        const durabilityCost = pTier.durabilityCost * yieldMult;
        const newDur = prev.activePickaxe!.durability - durabilityCost;
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
          setLevelUpData(xpRes.newLevel);
          for (const newLvl of xpRes.newLevels) {
            for (const tier of PICKAXE_TIERS) {
              if (tier.requiredLevel === newLvl && tier.id !== 'shovel') {
                const pxName = lang === 'ru' ? tier.nameRu : (lang === 'uk' ? tier.nameUk : tier.nameEn);
                pushNotification({ message: lang === 'ru' ? `Открыта: ${pxName}!` : (lang === 'uk' ? `Відкрито: ${pxName}!` : `Unlocked: ${pxName}!`), type: 'success' });
              }
            }
          }
        }

        if (rollCaseDrop(prev.upgrades.caseChanceLvl, mineId)) {
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

    },
    [pushNotification, tr, lang]
  );

  const collectBasket = useCallback(() => {
    setState((prev) => {
      if (prev.autoBasket.length === 0 && prev.autoBasketCases.length === 0) {
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
      const transferredCases = prev.autoBasketCases.length;
      let next: GameState = {
        ...prev,
        autoBasket: [],
        autoBasketCases: [],
        inventory: inv,
        cases: prev.autoBasketCases.length > 0
          ? [...prev.cases, ...prev.autoBasketCases]
          : prev.cases,
      };
      const xpRes = applyXp(next, totalXp);
      next = xpRes.state;
      if (xpRes.leveledUp) {
        pushNotification({ message: `${tr('notifLevelUp')} ${xpRes.newLevel}!`, type: 'success' });
        setLevelUpData(xpRes.newLevel);
        for (const newLvl of xpRes.newLevels) {
          for (const tier of PICKAXE_TIERS) {
            if (tier.requiredLevel === newLvl && tier.id !== 'shovel') {
              const pxName = lang === 'ru' ? tier.nameRu : (lang === 'uk' ? tier.nameUk : tier.nameEn);
              pushNotification({ message: lang === 'ru' ? `Открыта: ${pxName}!` : (lang === 'uk' ? `Відкрито: ${pxName}!` : `Unlocked: ${pxName}!`), type: 'success' });
            }
          }
        }
      }
      if (transferredCases > 0) {
        pushNotification({ message: `${tr('notifBasketCollected')} (+${transferredCases} ${tr('cases')})`, type: 'success' });
      } else {
        pushNotification({ message: tr('notifBasketCollected'), type: 'success' });
      }
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
      const hasCabinet = (stateRef.current.craftInventory?.food_cabinet ?? 0) > 0;
      const foodLimit = hasCabinet ? 100 : 5;
      const currentFoodCount = Object.values(stateRef.current.foodInventory ?? {}).reduce((sum, n) => sum + n, 0);
      if (currentFoodCount >= foodLimit) {
        pushNotification({ message: lang === 'ru' ? `Шкаф полон! Лимит: ${foodLimit} шт.` : (lang === 'uk' ? `Шафа повна! Ліміт: ${foodLimit} шт.` : `Cabinet full! Limit: ${foodLimit} items`), type: 'error' });
        return;
      }
      setState((prev) => ({
        ...prev,
        balance: Math.round((prev.balance - price) * 100) / 100,
        foodInventory: {
          ...prev.foodInventory,
          [foodId]: (prev.foodInventory?.[foodId] ?? 0) + 1,
        },
      }));
      pushNotification({ message: `${tr('notifBought')} ${food.name}`, type: 'success' });
    },
    [pushNotification, tr, lang]
  );

  const eatFood = useCallback(
    (foodId: string) => {
      const food = FOOD_ITEMS.find((f) => f.id === foodId);
      if (!food) return;
      const current = stateRef.current;
      const count = current.foodInventory?.[foodId] ?? 0;
      if (count <= 0) {
        pushNotification({ message: lang === 'ru' ? 'Нет еды в шкафу!' : (lang === 'uk' ? 'Немає їжі в шафі!' : 'No food in cabinet!'), type: 'error' });
        return;
      }

      setState((prev) => {
        let next = { ...prev };
        next.foodInventory = { ...prev.foodInventory, [foodId]: prev.foodInventory[foodId] - 1 };

        if (food.energyBoost > 0) {
          const effectiveMax = prev.maxEnergy + totalItemEffects.energyMaxBonus;
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
      pushNotification({ message: lang === 'ru' ? `Съедено: ${food.nameRu}` : (lang === 'uk' ? `З'їдено: ${food.nameUk}` : `Eaten: ${food.nameEn}`), type: 'success' });
    },
    [pushNotification, tr, lang, totalItemEffects]
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
              durability: oldPickaxe.durability,
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
    const now = Date.now();
    if (dc.lastClaimTimestamp && now - dc.lastClaimTimestamp < DAILY_CLAIM_COOLDOWN_MS) {
      pushNotification({ message: tr('locked'), type: 'warning' });
      return;
    }
    const nextDay = dc.lastClaimDay >= DAILY_REWARDS.length ? 1 : dc.lastClaimDay + 1;
    const reward: DailyReward = DAILY_REWARDS[nextDay - 1];
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
            setLevelUpData(xpRes.newLevel);
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
      let basketTriggered = false;
      if (Math.random() < (totalItemEffects.expeditionLootChance || 0)) {
        lootMult = totalItemEffects.expeditionLootMult || 1;
        basketTriggered = true;
      }
      const bonusCash = basketTriggered ? expedition.cashReward * (lootMult - 1) : 0;
      const bonusGems = basketTriggered ? Math.ceil(expedition.diamondReward * (lootMult - 1)) : 0;
      const bonusMaterials: Record<string, number> = {};
      for (const mat of expedition.materialsReward) {
        const baseAmount = mat.amount;
        const bonusAmount = basketTriggered ? Math.ceil(mat.amount * lootMult) - baseAmount : 0;
        if (bonusAmount > 0) bonusMaterials[mat.materialId] = bonusAmount;
        newMaterials[mat.materialId] = (newMaterials[mat.materialId] || 0) + Math.ceil(mat.amount * lootMult);
      }

      setState((prev) => {
        let next: GameState = {
          ...prev,
          balance: Math.round((prev.balance + expedition.cashReward + bonusCash) * 100) / 100,
          gems: prev.gems + expedition.diamondReward + bonusGems,
          totalEarned: Math.round((prev.totalEarned + expedition.cashReward + bonusCash) * 100) / 100,
          totalGemsEarned: prev.totalGemsEarned + expedition.diamondReward + bonusGems,
          materials: newMaterials,
          activeExpeditions: prev.activeExpeditions.filter((e) => e.id !== expeditionId),
          cases: [...prev.cases, ...newCases],
        };
        return next;
      });

      if (basketTriggered) {
        const bonusMatStr = Object.entries(bonusMaterials)
          .map(([id, amt]) => `${id} +${amt}`)
          .join(', ');
        pushNotification({
          message: lang === 'ru'
            ? `✨ Бонус: +${formatMoney(bonusCash)}${bonusGems > 0 ? `, +${bonusGems} 💎` : ''}${bonusMatStr ? `, ${bonusMatStr}` : ''}`
            : lang === 'uk'
            ? `✨ Бонус: +${formatMoney(bonusCash)}${bonusGems > 0 ? `, +${bonusGems} 💎` : ''}${bonusMatStr ? `, ${bonusMatStr}` : ''}`
            : `✨ Bonus: +${formatMoney(bonusCash)}${bonusGems > 0 ? `, +${bonusGems} 💎` : ''}${bonusMatStr ? `, ${bonusMatStr}` : ''}`,
          type: 'drop',
          color: '#FBBF24',
        });
      }
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

  const openItemBag = useCallback((): OwnedItem | null => {
    const current = stateRef.current;
    if ((current.itemBags || 0) <= 0) {
      pushNotification({ message: tr('noItemBags'), type: 'error' });
      return null;
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
    return newItem;
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

  const recycleItem = useCallback((uid: string) => {
    const current = stateRef.current;
    const item = current.ownedItems.find((o) => o.uid === uid);
    if (!item) return;

    if (item.level === 1) {
      setState((prev) => ({
        ...prev,
        gems: prev.gems + 3,
        materials: { ...prev.materials, scroll: (prev.materials.scroll || 0) + 2 },
        ownedItems: prev.ownedItems.filter((o) => o.uid !== uid),
        equippedItems: prev.equippedItems.map((eu) => (eu === uid ? null : eu)),
      }));
      pushNotification({ message: lang === 'ru' ? 'Предмет утилизирован! +3 💎 +2 📜' : (lang === 'uk' ? 'Предмет утилізовано! +3 💎 +2 📜' : 'Item recycled! +3 💎 +2 📜'), type: 'success' });
      return;
    }

    const returnedMaterials: Record<string, number> = {};
    let returnedGems = 0;
    for (let lvl = 1; lvl < item.level; lvl++) {
      const cost = UPGRADE_COSTS[lvl as ItemLevel];
      if (!cost) continue;
      for (const [matId, amount] of Object.entries(cost)) {
        if (matId === 'gems') {
          returnedGems += Math.floor((amount as number) * 0.4);
        } else {
          const val = Math.floor((amount as number) * 0.4);
          if (val > 1) {
            returnedMaterials[matId] = (returnedMaterials[matId] || 0) + val;
          }
        }
      }
    }

    setState((prev) => {
      const newMaterials = { ...prev.materials };
      for (const [matId, amount] of Object.entries(returnedMaterials)) {
        newMaterials[matId] = (newMaterials[matId] || 0) + amount;
      }
      return {
        ...prev,
        gems: prev.gems + returnedGems,
        materials: newMaterials,
        ownedItems: prev.ownedItems.filter((o) => o.uid !== uid),
        equippedItems: prev.equippedItems.map((eu) => (eu === uid ? null : eu)),
      };
    });
    pushNotification({ message: lang === 'ru' ? 'Предмет утилизирован!' : (lang === 'uk' ? 'Предмет утилізовано!' : 'Item recycled!'), type: 'success' });
  }, [pushNotification, lang]);

  const upgradeBackpack = useCallback(() => {
    const lvl = stateRef.current.upgrades.backpackLvl ?? 0;
    if (lvl >= UPGRADE_CONFIG.backpack.maxLevel) {
      pushNotification({ message: tr('notifUpgradeMaxed'), type: 'warning' });
      return;
    }
    const cost = getBackpackCost(lvl);
    if (stateRef.current.balance < cost) {
      pushNotification({ message: tr('notifNoMoney'), type: 'error' });
      return;
    }
    setState((prev) => ({
      ...prev,
      balance: Math.round((prev.balance - cost) * 100) / 100,
      upgrades: { ...prev.upgrades, backpackLvl: (prev.upgrades.backpackLvl ?? 0) + 1 },
    }));
  }, [pushNotification, tr]);

  const upgradeLuck = useCallback(() => {
    const lvl = stateRef.current.upgrades.luckLvl ?? 0;
    if (lvl >= UPGRADE_CONFIG.luck.maxLevel) {
      pushNotification({ message: tr('notifUpgradeMaxed'), type: 'warning' });
      return;
    }
    const cost = getLuckCost(lvl);
    if (stateRef.current.gems < cost) {
      pushNotification({ message: tr('notifNoGems'), type: 'error' });
      return;
    }
    setState((prev) => ({
      ...prev,
      gems: prev.gems - cost,
      upgrades: { ...prev.upgrades, luckLvl: (prev.upgrades.luckLvl ?? 0) + 1 },
    }));
  }, [pushNotification, tr]);

  const upgradeDiamondChance = useCallback(() => {
    const lvl = stateRef.current.upgrades.diamondChanceLvl ?? 0;
    if (lvl >= UPGRADE_CONFIG.diamondChance.maxLevel) {
      pushNotification({ message: tr('notifUpgradeMaxed'), type: 'warning' });
      return;
    }
    const cost = getDiamondChanceCost(lvl);
    if (stateRef.current.gems < cost) {
      pushNotification({ message: tr('notifNoGems'), type: 'error' });
      return;
    }
    setState((prev) => ({
      ...prev,
      gems: prev.gems - cost,
      upgrades: { ...prev.upgrades, diamondChanceLvl: (prev.upgrades.diamondChanceLvl ?? 0) + 1 },
    }));
  }, [pushNotification, tr]);

  const [backpackOpen, setBackpackOpen] = useState(false);
  const [itemsOpen, setItemsOpen] = useState(false);
  const [levelUpData, setLevelUpData] = useState<number | null>(null);

  const unlockedMines = state.unlockedMines || [0, 1];
  const isMineUnlocked = useCallback((mineId: number): boolean => {
    return unlockedMines.includes(mineId);
  }, [unlockedMines]);

  const highestUnlockedMine = useMemo(() => {
    return unlockedMines.reduce((max, id) => Math.max(max, id), 0);
  }, [unlockedMines]);

  const highestAccessibleMine = useMemo(() => {
    let best = highestUnlockedMine;
    const eq = state.equipment;
    for (const mine of MINES) {
      if (mine.id <= best) continue;
      const req = mine.unlockRequirements;
      if (!req) continue;
      const eqMet =
        (!req.helmetLevel || eq.helmetLevel >= req.helmetLevel) &&
        (!req.flashlightLevel || eq.flashlightLevel >= req.flashlightLevel) &&
        (!req.glovesLevel || eq.glovesLevel >= req.glovesLevel) &&
        (!req.respiratorLevel || eq.respiratorLevel >= req.respiratorLevel) &&
        (!req.lightingLevel || eq.lightingLevel >= req.lightingLevel) &&
        (!req.ventilationLevel || eq.ventilationLevel >= req.ventilationLevel) &&
        (!req.cartStation || eq.cartStationPurchased) &&
        state.level >= req.level;
      if (eqMet && mine.id > best) best = mine.id;
    }
    return best;
  }, [highestUnlockedMine, state.equipment, state.level]);

  const checkMineUnlockRequirements = useCallback((mineId: number) => {
    const mine = getMineById(mineId);
    const req = mine.unlockRequirements;
    const eq = state.equipment;
    const requirements: { label: string; current: string; required: string; met: boolean }[] = [];

    if (!req) return { met: true, requirements };

    requirements.push({
      label: lang === 'ru' ? 'Уровень' : (lang === 'uk' ? 'Рівень' : 'Level'),
      current: String(state.level),
      required: String(req.level),
      met: state.level >= req.level,
    });
    requirements.push({
      label: lang === 'ru' ? 'Деньги' : (lang === 'uk' ? 'Гроші' : 'Money'),
      current: formatMoney(state.balance),
      required: formatMoney(req.price),
      met: state.balance >= req.price,
    });
    if (req.helmetLevel) requirements.push({
      label: lang === 'ru' ? 'Каска' : (lang === 'uk' ? 'Каска' : 'Helmet'),
      current: `${eq.helmetLevel} р.`,
      required: `${req.helmetLevel} р.`,
      met: eq.helmetLevel >= req.helmetLevel,
    });
    if (req.flashlightLevel) requirements.push({
      label: lang === 'ru' ? 'Фонарик' : (lang === 'uk' ? 'Ліхтарик' : 'Flashlight'),
      current: `${eq.flashlightLevel} р.`,
      required: `${req.flashlightLevel} р.`,
      met: eq.flashlightLevel >= req.flashlightLevel,
    });
    if (req.glovesLevel) requirements.push({
      label: lang === 'ru' ? 'Перчатки' : (lang === 'uk' ? 'Рукавиці' : 'Gloves'),
      current: `${eq.glovesLevel} р.`,
      required: `${req.glovesLevel} р.`,
      met: eq.glovesLevel >= req.glovesLevel,
    });
    if (req.respiratorLevel) requirements.push({
      label: lang === 'ru' ? 'Противогаз' : (lang === 'uk' ? 'Протигаз' : 'Respirator'),
      current: `${eq.respiratorLevel} р.`,
      required: `${req.respiratorLevel} р.`,
      met: eq.respiratorLevel >= req.respiratorLevel,
    });
    if (req.ventilationLevel) requirements.push({
      label: lang === 'ru' ? 'Вентиляция' : (lang === 'uk' ? 'Вентиляція' : 'Ventilation'),
      current: `${eq.ventilationLevel} р.`,
      required: `${req.ventilationLevel} р.`,
      met: eq.ventilationLevel >= req.ventilationLevel,
    });
    if (req.lightingLevel) requirements.push({
      label: lang === 'ru' ? 'Освещение' : (lang === 'uk' ? 'Освітлення' : 'Lighting'),
      current: `${eq.lightingLevel} р.`,
      required: `${req.lightingLevel} р.`,
      met: eq.lightingLevel >= req.lightingLevel,
    });
    if (req.railsCount) {
      const totalRails = eq.railsCount + (state.craftInventory?.rails ?? 0);
      requirements.push({
        label: lang === 'ru' ? 'Рельсы' : (lang === 'uk' ? 'Рейки' : 'Rails'),
        current: `${totalRails} шт.`,
        required: `${req.railsCount} шт.`,
        met: totalRails >= req.railsCount,
      });
    }
    if (req.cartStation) requirements.push({
      label: lang === 'ru' ? 'Станция вагонетки' : (lang === 'uk' ? 'Станція вагонетки' : 'Cart Station'),
      current: eq.cartStationPurchased ? '✓' : '✗',
      required: '✓',
      met: eq.cartStationPurchased,
    });
    if (req.woodenBracingCount) {
      const totalBracing = eq.woodenBracingCount + (state.craftInventory?.wooden_bracing ?? 0);
      requirements.push({
        label: lang === 'ru' ? 'Дерев. крепление' : (lang === 'uk' ? 'Дерев. кріплення' : 'Wooden Bracing'),
        current: `${totalBracing} шт.`,
        required: `${req.woodenBracingCount} шт.`,
        met: totalBracing >= req.woodenBracingCount,
      });
    }

    const met = requirements.every((r) => r.met);
    return { met, requirements };
  }, [state.level, state.balance, state.equipment, lang]);

  const startMineUnlock = useCallback((mineId: number) => {
    // Sequential unlock: can't unlock mine N without mine N-1
    const unlocked = stateRef.current.unlockedMines || [0, 1];
    if (mineId > 1 && !unlocked.includes(mineId - 1)) {
      const prevMine = getMineById(mineId - 1);
      const prevName = lang === 'ru' ? prevMine.nameRu : (lang === 'uk' ? prevMine.nameUk : prevMine.nameEn);
      pushNotification({ message: lang === 'ru' ? `Сначала разблокируйте: ${prevName}` : (lang === 'uk' ? `Спочатку розблокуйте: ${prevName}` : `Unlock first: ${prevName}`), type: 'error' });
      return;
    }
    const check = checkMineUnlockRequirements(mineId);
    if (!check.met) {
      pushNotification({ message: lang === 'ru' ? 'Не выполнены условия разблокировки' : (lang === 'uk' ? 'Не виконані умови розблокування' : 'Unlock requirements not met'), type: 'error' });
      return;
    }
    const mine = getMineById(mineId);
    const req = mine.unlockRequirements;
    if (!req || req.unlockTimeMinutes <= 0) {
      setState((prev) => ({
        ...prev,
        unlockedMines: [...(prev.unlockedMines || []), mineId],
      }));
      pushNotification({ message: lang === 'ru' ? 'Шахта разблокирована!' : (lang === 'uk' ? 'Шахту розблоковано!' : 'Mine unlocked!'), type: 'success' });
      return;
    }
    const cost = req.price;
    const railsNeeded = req.railsCount ?? 0;
    const bracingNeeded = req.woodenBracingCount ?? 0;
    setState((prev) => {
      if (prev.balance < cost) {
        pushNotification({ message: tr('notifNoMoney'), type: 'error' });
        return prev;
      }
      const timer: MineUnlockTimer = {
        mineId,
        startedAt: Date.now(),
        durationMs: req.unlockTimeMinutes * 60 * 1000,
      };
      // Deduct rails: from craft inventory first, then equipment
      let remainingRails = railsNeeded;
      const craftRails = prev.craftInventory?.rails ?? 0;
      const railsFromCraft = Math.min(craftRails, remainingRails);
      remainingRails -= railsFromCraft;
      const railsFromEquip = Math.min(prev.equipment.railsCount, remainingRails);
      remainingRails -= railsFromEquip;
      // Deduct bracing: from craft inventory first, then equipment
      let remainingBracing = bracingNeeded;
      const craftBracing = prev.craftInventory?.wooden_bracing ?? 0;
      const bracingFromCraft = Math.min(craftBracing, remainingBracing);
      remainingBracing -= bracingFromCraft;
      const bracingFromEquip = Math.min(prev.equipment.woodenBracingCount, remainingBracing);
      remainingBracing -= bracingFromEquip;
      return {
        ...prev,
        balance: Math.round((prev.balance - cost) * 100) / 100,
        mineUnlockTimers: [...(prev.mineUnlockTimers || []), timer],
        craftInventory: {
          ...prev.craftInventory,
          rails: Math.max(0, craftRails - railsFromCraft),
          wooden_bracing: Math.max(0, craftBracing - bracingFromCraft),
        },
        equipment: {
          ...prev.equipment,
          railsCount: prev.equipment.railsCount - railsFromEquip,
          woodenBracingCount: prev.equipment.woodenBracingCount - bracingFromEquip,
        },
      };
    });
    pushNotification({ message: lang === 'ru' ? 'Разблокировка началась!' : (lang === 'uk' ? 'Розблокування почалось!' : 'Unlock started!'), type: 'success' });
  }, [checkMineUnlockRequirements, pushNotification, lang, tr]);

  const speedUpMineUnlock = useCallback((mineId: number, minutes: number) => {
    const gemCost = minutes;
    setState((prev) => {
      if (prev.gems < gemCost) {
        pushNotification({ message: lang === 'ru' ? 'Недостаточно алмазов' : (lang === 'uk' ? 'Недостатньо алмазів' : 'Not enough gems'), type: 'error' });
        return prev;
      }
      const timers = prev.mineUnlockTimers || [];
      const timer = timers.find((t) => t.mineId === mineId);
      if (!timer) return prev;
      const reduceMs = minutes * 60 * 1000;
      const newRemaining = timer.startedAt + timer.durationMs - Date.now() - reduceMs;
      if (newRemaining <= 0) {
        pushNotification({ message: lang === 'ru' ? 'Шахта открыта!' : (lang === 'uk' ? 'Шахту відкрито!' : 'Mine opened!'), type: 'success' });
        return {
          ...prev,
          gems: prev.gems - gemCost,
          mineUnlockTimers: timers.filter((t) => t.mineId !== mineId),
          unlockedMines: [...new Set([...(prev.unlockedMines || []), mineId])],
        };
      }
      return {
        ...prev,
        gems: prev.gems - gemCost,
        mineUnlockTimers: timers.map((t) =>
          t.mineId === mineId
            ? { ...t, durationMs: t.durationMs - reduceMs }
            : t
        ),
      };
    });
  }, [pushNotification, lang]);

  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        const timers = prev.mineUnlockTimers || [];
        if (timers.length === 0) return prev;
        const now = Date.now();
        const completed = timers.filter((t) => now >= t.startedAt + t.durationMs);
        if (completed.length === 0) return prev;
        const completedIds = completed.map((t) => t.mineId);
        const completedNames = completedIds.map(id => {
          const m = getMineById(id);
          return lang === 'ru' ? m.nameRu : (lang === 'uk' ? m.nameUk : m.nameEn);
        }).join(', ');
        pushNotification({ message: lang === 'ru' ? `Шахта открыта: ${completedNames}!` : (lang === 'uk' ? `Шахту відкрито: ${completedNames}!` : `Mine opened: ${completedNames}!`), type: 'success' });
        return {
          ...prev,
          mineUnlockTimers: timers.filter((t) => now < t.startedAt + t.durationMs),
          unlockedMines: [...new Set([...(prev.unlockedMines || []), ...completedIds])],
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pushNotification, lang]);

  const upgradeEquipment = useCallback((type: EquipmentType) => {
    const current = stateRef.current;
    const eq = current.equipment;
    const currentLevel =
      type === 'helmet' ? eq.helmetLevel :
      type === 'flashlight' ? eq.flashlightLevel :
      type === 'gloves' ? eq.glovesLevel :
      type === 'respirator' ? eq.respiratorLevel :
      type === 'lighting' ? eq.lightingLevel :
      eq.ventilationLevel;
    const maxForMine = equipmentMaxLevelIncludingNextMine(type, highestUnlockedMine);
    const maxLevel = Math.min(EQUIPMENT_CONFIG[type].maxLevel, maxForMine);
    if (currentLevel >= maxLevel) {
      pushNotification({ message: lang === 'ru' ? 'Максимальный уровень' : (lang === 'uk' ? 'Максимальний рівень' : 'Max level reached'), type: 'error' });
      return;
    }
    const cost = equipmentUpgradeCost(type, currentLevel);
    if (current.balance < cost) {
      pushNotification({ message: tr('notifNoMoney'), type: 'error' });
      return;
    }
    setState((prev) => ({
      ...prev,
      balance: Math.round((prev.balance - cost) * 100) / 100,
      equipment: {
        ...prev.equipment,
        [type === 'helmet' ? 'helmetLevel' :
         type === 'flashlight' ? 'flashlightLevel' :
         type === 'gloves' ? 'glovesLevel' :
         type === 'respirator' ? 'respiratorLevel' :
         type === 'lighting' ? 'lightingLevel' :
         'ventilationLevel']: currentLevel + 1,
      },
    }));
  }, [highestUnlockedMine, pushNotification, lang, tr]);

  const purchaseEquipment = useCallback((type: EquipmentType) => {
    const current = stateRef.current;
    const cfg = EQUIPMENT_CONFIG[type];
    if (current.ownedEquipment?.includes(type)) {
      pushNotification({ message: lang === 'ru' ? 'Уже куплено' : (lang === 'uk' ? 'Вже куплено' : 'Already owned'), type: 'info' });
      return;
    }
    const maxForMine = equipmentMaxLevelIncludingNextMine(type, highestUnlockedMine);
    if (maxForMine < 1) {
      const nextMine = mineRequiredForNextEquipmentLevel(type, highestUnlockedMine);
      const mineMsg = nextMine ? (lang === 'ru' ? `Откройте шахту ${nextMine.mineId}` : (lang === 'uk' ? `Відкрийте шахту ${nextMine.mineId}` : `Unlock Mine ${nextMine.mineId}`)) : '';
      pushNotification({ message: lang === 'ru' ? `Недоступно. ${mineMsg}` : (lang === 'uk' ? `Недоступно. ${mineMsg}` : `Not available. ${mineMsg}`), type: 'error' });
      return;
    }
    const price = cfg.purchasePrice;
    if (current.balance < price) {
      pushNotification({ message: tr('notifNoMoney'), type: 'error' });
      return;
    }
    setState((prev) => ({
      ...prev,
      balance: Math.round((prev.balance - price) * 100) / 100,
      ownedEquipment: [...(prev.ownedEquipment || []), type],
      equipment: {
        ...prev.equipment,
        [type === 'helmet' ? 'helmetLevel' :
         type === 'flashlight' ? 'flashlightLevel' :
         type === 'gloves' ? 'glovesLevel' :
         type === 'respirator' ? 'respiratorLevel' :
         type === 'lighting' ? 'lightingLevel' :
         'ventilationLevel']: 1,
      },
    }));
    pushNotification({ message: lang === 'ru' ? 'Куплено!' : (lang === 'uk' ? 'Куплено!' : 'Куплено!'), type: 'success' });
  }, [highestUnlockedMine, pushNotification, lang, tr]);

  const purchaseRespiratorFilter = useCallback(() => {
    const current = stateRef.current;
    if (current.equipment.respiratorFilterPurchased) {
      pushNotification({ message: lang === 'ru' ? 'Уже куплено' : (lang === 'uk' ? 'Вже куплено' : 'Already owned'), type: 'info' });
      return;
    }
    if (current.balance < RESPIRATOR_FILTER_PRICE) {
      pushNotification({ message: tr('notifNoMoney'), type: 'error' });
      return;
    }
    setState((prev) => ({
      ...prev,
      balance: Math.round((prev.balance - RESPIRATOR_FILTER_PRICE) * 100) / 100,
      equipment: { ...prev.equipment, respiratorFilterPurchased: true },
    }));
    pushNotification({ message: lang === 'ru' ? 'Дымовой фильтр куплен!' : (lang === 'uk' ? 'Димовий фільтр куплено!' : 'Smoke filter purchased!'), type: 'success' });
  }, [pushNotification, lang, tr]);

  const purchaseCartStation = useCallback(() => {
    const current = stateRef.current;
    if (current.equipment.cartStationPurchased) {
      pushNotification({ message: lang === 'ru' ? 'Уже куплено' : (lang === 'uk' ? 'Вже куплено' : 'Already owned'), type: 'info' });
      return;
    }
    if (current.balance < CART_STATION_PRICE) {
      pushNotification({ message: tr('notifNoMoney'), type: 'error' });
      return;
    }
    setState((prev) => ({
      ...prev,
      balance: Math.round((prev.balance - CART_STATION_PRICE) * 100) / 100,
      equipment: { ...prev.equipment, cartStationPurchased: true },
    }));
    pushNotification({ message: lang === 'ru' ? 'Станция вагонетки куплена!' : (lang === 'uk' ? 'Станцію вагонетки куплено!' : 'Cart station purchased!'), type: 'success' });
  }, [pushNotification, lang, tr]);

  const purchaseRails = useCallback((count: number) => {
    const current = stateRef.current;
    const totalCost = RAIL_UNIT_PRICE * count;
    if (current.balance < totalCost) {
      pushNotification({ message: tr('notifNoMoney'), type: 'error' });
      return;
    }
    setState((prev) => ({
      ...prev,
      balance: Math.round((prev.balance - totalCost) * 100) / 100,
      equipment: { ...prev.equipment, railsCount: prev.equipment.railsCount + count },
    }));
    pushNotification({ message: lang === 'ru' ? `Куплено ${count} рельсов` : (lang === 'uk' ? `Куплено ${count} рейок` : `Purchased ${count} rails`), type: 'success' });
  }, [pushNotification, lang, tr]);

  const purchaseWoodenBracing = useCallback((count: number) => {
    const current = stateRef.current;
    const totalCost = WOODEN_BRACING_UNIT_PRICE * count;
    if (current.balance < totalCost) {
      pushNotification({ message: tr('notifNoMoney'), type: 'error' });
      return;
    }
    setState((prev) => ({
      ...prev,
      balance: Math.round((prev.balance - totalCost) * 100) / 100,
      equipment: { ...prev.equipment, woodenBracingCount: prev.equipment.woodenBracingCount + count },
    }));
    pushNotification({ message: lang === 'ru' ? `Куплено ${count} креплений` : (lang === 'uk' ? `Куплено ${count} кріплень` : `Purchased ${count} bracing`), type: 'success' });
  }, [pushNotification, lang, tr]);

  const craftItem = useCallback((recipeIndex: number) => {
    const recipe = CRAFT_RECIPES[recipeIndex];
    if (!recipe) return;
    const current = stateRef.current;
    const inv = current.craftInventory || {};
    if (!canCraftRecipe(recipe, inv)) {
      pushNotification({ message: lang === 'ru' ? 'Недостаточно материалов' : (lang === 'uk' ? 'Недостатньо матеріалів' : 'Not enough materials'), type: 'error' });
      return;
    }
    const newInv = executeCraftRecipe(recipe, inv);
    if (!newInv) return;
    const resultName = getCraftItemName(recipe.result, lang);
    setState((prev) => ({ ...prev, craftInventory: newInv }));
    pushNotification({ message: lang === 'ru' ? `Скрафчено: ${resultName}` : (lang === 'uk' ? `Скрафчено: ${resultName}` : `Crafted: ${resultName}`), type: 'success' });
  }, [pushNotification, lang]);

  const buyMaterialSlot = useCallback((slotId: string) => {
    const current = stateRef.current;
    const shop = current.materialsShop;
    if (!shop) return;
    const slot = shop.slots.find((s) => s.id === slotId);
    if (!slot || slot.stock <= 0) {
      pushNotification({ message: lang === 'ru' ? 'Нет в наличии' : (lang === 'uk' ? 'Немає в наявності' : 'Out of stock'), type: 'error' });
      return;
    }
    const price = getSlotPrice(slot);
    if (current.balance < price) {
      pushNotification({ message: tr('notifNoMoney'), type: 'error' });
      return;
    }
    setState((prev) => ({
      ...prev,
      balance: Math.round((prev.balance - price) * 100) / 100,
      craftInventory: {
        ...prev.craftInventory,
        [slot.materialType]: (prev.craftInventory[slot.materialType] || 0) + slot.packSize,
      },
      materialsShop: {
        ...prev.materialsShop,
        slots: prev.materialsShop.slots.map((s) =>
          s.id === slotId ? { ...s, stock: s.stock - 1 } : s
        ),
      },
    }));
    pushNotification({ message: lang === 'ru' ? `Куплено ${slot.packSize} шт.` : (lang === 'uk' ? `Куплено ${slot.packSize} шт.` : `Purchased ${slot.packSize} pcs.`), type: 'success' });
  }, [pushNotification, lang, tr]);

  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        const now = Date.now();
        if (!prev.materialsShop || now < prev.materialsShop.nextRefreshAt) return prev;
        const gen = generateMaterialsShopSlots(now);
        return {
          ...prev,
          materialsShop: { slots: gen.slots, refreshedAt: now, nextRefreshAt: gen.nextRefreshAt },
        };
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        const now = Date.now();
        if (!prev.specialOffers || now < prev.specialOffers.nextRefreshAt) return prev;
        const gen = generateSpecialOffers(now);
        return {
          ...prev,
          specialOffers: gen,
        };
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const buySpecialOffer = useCallback((offerIndex: number) => {
    const current = stateRef.current;
    const offers = current.specialOffers?.offers ?? [];
    const offer = offers[offerIndex];
    if (!offer || offer.purchased) return;
    const bundle = SPECIAL_OFFER_BUNDLES.find((b) => b.id === offer.bundleId);
    if (!bundle) return;
    const price = getOfferPriceGems(bundle, offer.discountPct);
    if (current.gems < price) {
      pushNotification({ message: tr('notifNoGems'), type: 'error' });
      return;
    }
    setState((prev) => {
      const newOffers = (prev.specialOffers?.offers ?? []).map((o, i) =>
        i === offerIndex ? { ...o, purchased: true } : o
      );
      return {
        ...prev,
        gems: prev.gems - price,
        itemBags: prev.itemBags + bundle.rewards.filter((r) => r.type === 'item_bag').reduce((s, r) => s + r.amount, 0),
        materials: {
          ...prev.materials,
          scroll: (prev.materials.scroll ?? 0) + bundle.rewards.filter((r) => r.type === 'scroll').reduce((s, r) => s + r.amount, 0),
          ruby_dust: (prev.materials.ruby_dust ?? 0) + bundle.rewards.filter((r) => r.type === 'ruby_dust').reduce((s, r) => s + r.amount, 0),
          essence: (prev.materials.essence ?? 0) + bundle.rewards.filter((r) => r.type === 'essence').reduce((s, r) => s + r.amount, 0),
        },
        lifeSupport: {
          ...prev.lifeSupport,
          oxygenTanks: [
            ...prev.lifeSupport.oxygenTanks,
            ...bundle.rewards
              .filter((r) => r.type === 'oxygen_tank_small')
              .flatMap((r) => Array.from({ length: r.amount }, () => createOxygenTank('oxygen_tank_small'))),
            ...bundle.rewards
              .filter((r) => r.type === 'oxygen_tank_medium')
              .flatMap((r) => Array.from({ length: r.amount }, () => createOxygenTank('oxygen_tank_medium'))),
          ],
          batteries: [
            ...prev.lifeSupport.batteries,
            ...bundle.rewards
              .filter((r) => r.type === 'battery_weak')
              .flatMap((r) => Array.from({ length: r.amount }, () => createBattery('battery_weak'))),
          ],
        },
        cases: [
          ...prev.cases,
          ...bundle.rewards
            .filter((r) => r.type === 'case_rare')
            .flatMap((r) => Array.from({ length: r.amount }, () => ({
              id: `case-${Date.now()}-${Math.random()}`,
              rarity: 'rare' as const,
              opened: false,
            }))),
          ...bundle.rewards
            .filter((r) => r.type === 'case_epic')
            .flatMap((r) => Array.from({ length: r.amount }, () => ({
              id: `case-${Date.now()}-${Math.random()}`,
              rarity: 'epic' as const,
              opened: false,
            }))),
        ],
        specialOffers: { ...prev.specialOffers, offers: newOffers },
      };
    });
    pushNotification({ message: lang === 'ru' ? 'Предложение куплено!' : (lang === 'uk' ? 'Пропозицію куплено!' : 'Offer purchased!'), type: 'success' });
  }, [pushNotification, tr, lang]);

  const buyCanister = useCallback(() => {
    const current = stateRef.current;
    if (current.balance < CANISTER_PRICE) {
      pushNotification({ message: tr('notifNoMoney'), type: 'error' });
      return;
    }
    if (current.lifeSupport.shelfCount < 1) {
      pushNotification({ message: lang === 'ru' ? 'Купите стеллаж на складе!' : (lang === 'uk' ? 'Купіть стелаж на складі!' : 'Buy a shelf for the warehouse!'), type: 'error' });
      return;
    }
    const space = getAvailableSpace(current.lifeSupport, current.fuel);
    if (space < getCanisterSpace()) {
      pushNotification({ message: lang === 'ru' ? 'Недостаточно места на стеллажах!' : (lang === 'uk' ? 'Недостатньо місця на стелажах!' : 'Not enough shelf space!'), type: 'error' });
      return;
    }
    const canister = createCanister();
    setState((prev) => ({
      ...prev,
      balance: Math.round((prev.balance - CANISTER_PRICE) * 100) / 100,
      fuel: { ...prev.fuel, canisters: [...prev.fuel.canisters, canister] },
    }));
    pushNotification({ message: lang === 'ru' ? 'Канистра куплена!' : (lang === 'uk' ? 'Каністра куплена!' : 'Canister purchased!'), type: 'success' });
  }, [pushNotification, lang, tr]);

  const buyFuel = useCallback((liters: number) => {
    if (liters <= 0) return;
    const current = stateRef.current;
    const fuel = current.fuel;
    const availableSpace = getAvailableFuelSpace(fuel.canisters);
    if (availableSpace <= 0) {
      pushNotification({ message: lang === 'ru' ? 'Нет свободных канистр' : (lang === 'uk' ? 'Немає вільних каністр' : 'No free canisters'), type: 'error' });
      return;
    }
    const actualLiters = Math.min(liters, availableSpace);
    const totalCost = Math.round(actualLiters * fuel.diesel95Price * 100) / 100;
    if (current.balance < totalCost) {
      pushNotification({ message: tr('notifNoMoney'), type: 'error' });
      return;
    }
    const newCanisters = addFuel(fuel.canisters, actualLiters);
    setState((prev) => ({
      ...prev,
      balance: Math.round((prev.balance - totalCost) * 100) / 100,
      fuel: { ...prev.fuel, canisters: newCanisters },
    }));
    pushNotification({ message: lang === 'ru' ? `Заправлено ${actualLiters.toFixed(1)}Л за ${totalCost.toFixed(2)}$` : (lang === 'uk' ? `Заправлено ${actualLiters.toFixed(1)}Л за ${totalCost.toFixed(2)}$` : `Refueled ${actualLiters.toFixed(1)}L for ${totalCost.toFixed(2)}$`), type: 'success' });
  }, [pushNotification, lang, tr]);

  const buyOxygenTank = useCallback((type: OxygenTankType) => {
    const cfg = OXYGEN_TANK_CONFIGS[type];
    const current = stateRef.current;
    if (current.balance < cfg.price) {
      pushNotification({ message: tr('notifNoMoney'), type: 'error' });
      return;
    }
    if (current.lifeSupport.shelfCount < 1) {
      pushNotification({ message: lang === 'ru' ? 'Купите стеллаж на складе!' : (lang === 'uk' ? 'Купіть стелаж на складі!' : 'Buy a shelf for the warehouse!'), type: 'error' });
      return;
    }
    const space = getAvailableSpace(current.lifeSupport, current.fuel);
    if (space < getOxygenTankSpace(type)) {
      pushNotification({ message: lang === 'ru' ? 'Недостаточно места на стеллажах!' : (lang === 'uk' ? 'Недостатньо місця на стелажах!' : 'Not enough shelf space!'), type: 'error' });
      return;
    }
    const tank = createOxygenTank(type);
    setState((prev) => ({
      ...prev,
      balance: Math.round((prev.balance - cfg.price) * 100) / 100,
      lifeSupport: {
        ...prev.lifeSupport,
        oxygenTanks: [...prev.lifeSupport.oxygenTanks, tank],
        ownedOxygenTypes: prev.lifeSupport.ownedOxygenTypes.includes(type)
          ? prev.lifeSupport.ownedOxygenTypes
          : [...prev.lifeSupport.ownedOxygenTypes, type],
      },
    }));
    pushNotification({ message: lang === 'ru' ? 'Балон куплен!' : (lang === 'uk' ? 'Балон куплено!' : 'Tank purchased!'), type: 'success' });
  }, [pushNotification, lang, tr]);

  const buyBattery = useCallback((type: BatteryType) => {
    const cfg = BATTERY_CONFIGS[type];
    const current = stateRef.current;
    if (current.balance < cfg.price) {
      pushNotification({ message: tr('notifNoMoney'), type: 'error' });
      return;
    }
    if (current.lifeSupport.shelfCount < 1) {
      pushNotification({ message: lang === 'ru' ? 'Купите стеллаж на складе!' : (lang === 'uk' ? 'Купіть стелаж на складі!' : 'Buy a shelf for the warehouse!'), type: 'error' });
      return;
    }
    const space = getAvailableSpace(current.lifeSupport, current.fuel);
    if (space < getBatterySpace(type)) {
      pushNotification({ message: lang === 'ru' ? 'Недостаточно места на стеллажах!' : (lang === 'uk' ? 'Недостатньо місця на стелажах!' : 'Not enough shelf space!'), type: 'error' });
      return;
    }
    const battery = createBattery(type);
    setState((prev) => ({
      ...prev,
      balance: Math.round((prev.balance - cfg.price) * 100) / 100,
      lifeSupport: {
        ...prev.lifeSupport,
        batteries: [...prev.lifeSupport.batteries, battery],
        ownedBatteryTypes: prev.lifeSupport.ownedBatteryTypes.includes(type)
          ? prev.lifeSupport.ownedBatteryTypes
          : [...prev.lifeSupport.ownedBatteryTypes, type],
      },
    }));
    pushNotification({ message: lang === 'ru' ? 'Аккумулятор куплен!' : (lang === 'uk' ? 'Акумулятор куплено!' : 'Battery purchased!'), type: 'success' });
  }, [pushNotification, lang, tr]);

  const buyCooler = useCallback((type: CoolerType) => {
    const cfg = COOLER_CONFIGS[type];
    const current = stateRef.current;
    if (current.lifeSupport.coolers.some((c) => c.type === type)) {
      pushNotification({ message: lang === 'ru' ? 'Уже куплено!' : (lang === 'uk' ? 'Вже куплено!' : 'Already owned!'), type: 'info' });
      return;
    }
    if (current.balance < cfg.price) {
      pushNotification({ message: tr('notifNoMoney'), type: 'error' });
      return;
    }
    if (current.lifeSupport.shelfCount < 1) {
      pushNotification({ message: lang === 'ru' ? 'Купите стеллаж на складе!' : (lang === 'uk' ? 'Купіть стелаж на складі!' : 'Buy a shelf for the warehouse!'), type: 'error' });
      return;
    }
    const space = getAvailableSpace(current.lifeSupport, current.fuel);
    if (space < cfg.space) {
      pushNotification({ message: lang === 'ru' ? 'Недостаточно места на стеллажах!' : (lang === 'uk' ? 'Недостатньо місця на стелажах!' : 'Not enough shelf space!'), type: 'error' });
      return;
    }
    const cooler = createCooler(type);
    setState((prev) => ({
      ...prev,
      balance: Math.round((prev.balance - cfg.price) * 100) / 100,
      lifeSupport: {
        ...prev.lifeSupport,
        coolers: [...prev.lifeSupport.coolers, cooler],
        ownedCoolerTypes: prev.lifeSupport.ownedCoolerTypes.includes(type)
          ? prev.lifeSupport.ownedCoolerTypes
          : [...prev.lifeSupport.ownedCoolerTypes, type],
        activeCoolerId: prev.lifeSupport.activeCoolerId ?? cooler.id,
      },
    }));
    pushNotification({ message: lang === 'ru' ? 'Охладитель куплен!' : (lang === 'uk' ? 'Охолоджувач куплено!' : 'Cooler purchased!'), type: 'success' });
  }, [pushNotification, lang, tr]);

  const toggleCooler = useCallback((coolerId: string) => {
    const current = stateRef.current;
    const cooler = current.lifeSupport.coolers.find((c) => c.id === coolerId);
    if (!cooler || cooler.durability <= 0) return;
    if (!cooler.active) {
      const hasActiveLease = !!(current.activeLeaseEndsAt && current.activeLeaseEndsAt > Date.now());
      if (!hasActiveLease) {
        pushNotification({ message: lang === 'ru' ? 'Нужна активная аренда!' : (lang === 'uk' ? 'Потрібна активна оренда!' : 'Need an active lease!'), type: 'error' });
        return;
      }
      const hasChargedBattery = current.lifeSupport.batteries.some((b) => b.currentCharge > 0);
      if (!hasChargedBattery) {
        pushNotification({ message: lang === 'ru' ? 'Нет заряженного аккумулятора!' : (lang === 'uk' ? 'Немає зарядженого акумулятора!' : 'No charged battery available!'), type: 'error' });
        return;
      }
    }
    setState((prev) => {
      const turningOff = prev.lifeSupport.coolers.find((c) => c.id === coolerId)?.active;
      return {
        ...prev,
        lifeSupport: {
          ...prev.lifeSupport,
          activeCoolerId: turningOff ? coolerId : coolerId,
          coolers: prev.lifeSupport.coolers.map((c) => {
            if (c.durability <= 0) return c;
            if (c.id === coolerId) return { ...c, active: !c.active };
            return { ...c, active: false };
          }),
        },
      };
    });
  }, [pushNotification, lang]);

  const setCoolerMode = useCallback((coolerId: string, mode: CoolerMode) => {
    setState((prev) => ({
      ...prev,
      lifeSupport: {
        ...prev.lifeSupport,
        coolers: prev.lifeSupport.coolers.map((c) =>
          c.id === coolerId ? { ...c, mode } : c
        ),
      },
    }));
  }, []);

  const switchCooler = useCallback((coolerId: string) => {
    setState((prev) => {
      const cooler = prev.lifeSupport.coolers.find((c) => c.id === coolerId);
      if (!cooler || cooler.durability <= 0) return prev;
      return {
        ...prev,
        lifeSupport: {
          ...prev.lifeSupport,
          activeCoolerId: coolerId,
          coolers: prev.lifeSupport.coolers.map((c) => ({
            ...c,
            active: c.id === coolerId,
          })),
        },
      };
    });
    pushNotification({ message: lang === 'ru' ? 'Охладитель переключён!' : (lang === 'uk' ? 'Охолоджувач перемкнено!' : 'Cooler switched!'), type: 'success' });
  }, [pushNotification, lang]);

  const repairCooler = useCallback((coolerId: string) => {
    const current = stateRef.current;
    const cooler = current.lifeSupport.coolers.find((c) => c.id === coolerId);
    if (!cooler) return;
    const cfg = COOLER_CONFIGS[cooler.type];
    if (current.balance < cfg.repairPrice) {
      pushNotification({ message: tr('notifNoMoney'), type: 'error' });
      return;
    }
    setState((prev) => ({
      ...prev,
      balance: Math.round((prev.balance - cfg.repairPrice) * 100) / 100,
      lifeSupport: {
        ...prev.lifeSupport,
        coolers: prev.lifeSupport.coolers.map((c) =>
          c.id === coolerId ? { ...c, durability: c.maxDurability } : c
        ),
      },
    }));
    pushNotification({ message: lang === 'ru' ? 'Ремонт завершён!' : (lang === 'uk' ? 'Ремонт завершено!' : 'Repair complete!'), type: 'success' });
  }, [pushNotification, lang, tr]);

  const buyGenerator = useCallback(() => {
    const current = stateRef.current;
    if (current.lifeSupport.generator.purchased) {
      pushNotification({ message: lang === 'ru' ? 'Уже куплено' : (lang === 'uk' ? 'Вже куплено' : 'Already owned'), type: 'info' });
      return;
    }
    if (current.balance < GENERATOR_PRICE) {
      pushNotification({ message: tr('notifNoMoney'), type: 'error' });
      return;
    }
    if (current.lifeSupport.shelfCount < 1) {
      pushNotification({ message: lang === 'ru' ? 'Купите стеллаж на складе!' : (lang === 'uk' ? 'Купіть стелаж на складі!' : 'Buy a shelf for the warehouse!'), type: 'error' });
      return;
    }
    const space = getAvailableSpace(current.lifeSupport, current.fuel);
    if (space < getGeneratorSpace()) {
      pushNotification({ message: lang === 'ru' ? 'Недостаточно места на стеллажах!' : (lang === 'uk' ? 'Недостатньо місця на стелажах!' : 'Not enough shelf space!'), type: 'error' });
      return;
    }
    setState((prev) => ({
      ...prev,
      balance: Math.round((prev.balance - GENERATOR_PRICE) * 100) / 100,
      lifeSupport: {
        ...prev.lifeSupport,
        generator: { ...prev.lifeSupport.generator, purchased: true },
      },
    }));
    pushNotification({ message: lang === 'ru' ? 'Генератор куплен!' : (lang === 'uk' ? 'Генератор куплено!' : 'Generator purchased!'), type: 'success' });
  }, [pushNotification, lang, tr]);

  const toggleGenerator = useCallback(() => {
    const current = stateRef.current;
    const gen = current.lifeSupport.generator;
    if (!gen.purchased) return;
    if (!gen.active) {
      const hasVentilation = (current.equipment.ventilationLevel ?? 0) > 0;
      const hasSmokeFilter = !!current.equipment.respiratorFilterPurchased;
      if (!canActivateGenerator(hasVentilation, hasSmokeFilter)) {
        pushNotification({ message: lang === 'ru' ? 'Нужна вентиляция и дымовой фильтр!' : (lang === 'uk' ? 'Потрібна вентиляція та димовий фільтр!' : 'Ventilation and smoke filter required!'), type: 'error' });
        return;
      }
      if (gen.fuelLiters <= 0) {
        pushNotification({ message: lang === 'ru' ? 'Нет топлива!' : (lang === 'uk' ? 'Немає палива!' : 'No fuel!'), type: 'error' });
        return;
      }
    }
    setState((prev) => ({
      ...prev,
      lifeSupport: {
        ...prev.lifeSupport,
        generator: { ...prev.lifeSupport.generator, active: !prev.lifeSupport.generator.active },
      },
    }));
  }, [pushNotification, lang]);

  const sellCanister = useCallback((canisterId: string) => {
    const current = stateRef.current;
    const canister = current.fuel.canisters.find((c) => c.id === canisterId);
    if (!canister) return;
    if (canister.currentFuel > 0) {
      pushNotification({ message: lang === 'ru' ? 'Можно продать только пустую канистру!' : (lang === 'uk' ? 'Можна продати лише порожню каністру!' : 'You can only sell an empty canister!'), type: 'error' });
      return;
    }
    const sellPrice = Math.round(CANISTER_PRICE * 0.5 * 100) / 100;
    setState((prev) => ({
      ...prev,
      balance: Math.round((prev.balance + sellPrice) * 100) / 100,
      fuel: { ...prev.fuel, canisters: prev.fuel.canisters.filter((c) => c.id !== canisterId) },
    }));
    pushNotification({ message: lang === 'ru' ? `Канистра продана за ${sellPrice}$` : (lang === 'uk' ? `Каністра продана за ${sellPrice}$` : `Canister sold for ${sellPrice}$`), type: 'success' });
  }, [pushNotification, lang]);

  const refuelGenerator = useCallback(() => {
    const current = stateRef.current;
    const gen = current.lifeSupport.generator;
    if (!gen.purchased) return;
    const availableFuel = current.fuel.canisters.reduce((sum, c) => sum + c.currentFuel, 0);
    if (availableFuel <= 0) {
      pushNotification({ message: lang === 'ru' ? 'Нет дизеля в канистрах!' : (lang === 'uk' ? 'Немає дизеля в каністрах!' : 'No diesel in canisters!'), type: 'error' });
      return;
    }
    const space = gen.tankCapacity - gen.fuelLiters;
    if (space <= 0) {
      pushNotification({ message: lang === 'ru' ? 'Бак полон!' : (lang === 'uk' ? 'Бак повний!' : 'Tank is full!'), type: 'info' });
      return;
    }
    const toTransfer = Math.min(availableFuel, space);
    let remaining = toTransfer;
    const newCanisters = current.fuel.canisters.map((c) => {
      if (remaining <= 0) return c;
      const take = Math.min(c.currentFuel, remaining);
      remaining -= take;
      return { ...c, currentFuel: c.currentFuel - take };
    });
    setState((prev) => ({
      ...prev,
      fuel: { ...prev.fuel, canisters: newCanisters },
      lifeSupport: {
        ...prev.lifeSupport,
        generator: { ...prev.lifeSupport.generator, fuelLiters: prev.lifeSupport.generator.fuelLiters + toTransfer },
      },
    }));
    pushNotification({ message: lang === 'ru' ? `Залито ${toTransfer.toFixed(1)}Л` : (lang === 'uk' ? `Залито ${toTransfer.toFixed(1)}Л` : `Poured ${toTransfer.toFixed(1)}L`), type: 'success' });
  }, [pushNotification, lang]);

  const insertLithiumBattery = useCallback((batteryId: string) => {
    setState((prev) => {
      const gen = prev.lifeSupport.generator;
      if (gen.lithiumBatteryIds.length >= GENERATOR_LITHIUM_SLOTS) return prev;
      if (gen.lithiumBatteryIds.includes(batteryId)) return prev;
      return {
        ...prev,
        lifeSupport: {
          ...prev.lifeSupport,
          generator: { ...gen, lithiumBatteryIds: [...gen.lithiumBatteryIds, batteryId] },
        },
      };
    });
  }, []);

  const removeLithiumBattery = useCallback((batteryId: string) => {
    setState((prev) => ({
      ...prev,
      lifeSupport: {
        ...prev.lifeSupport,
        generator: {
          ...prev.lifeSupport.generator,
          lithiumBatteryIds: prev.lifeSupport.generator.lithiumBatteryIds.filter((id) => id !== batteryId),
        },
      },
    }));
  }, []);

  const buyShelf = useCallback(() => {
    const current = stateRef.current;
    if (current.lifeSupport.shelfCount >= MAX_SHELVES) {
      pushNotification({ message: lang === 'ru' ? 'Максимум стеллажей!' : (lang === 'uk' ? 'Максимум стелажів!' : 'Maximum shelves reached!'), type: 'info' });
      return;
    }
    const shelfCount = (current.craftInventory?.shelf ?? 0);
    if (shelfCount < 1) {
      pushNotification({ message: lang === 'ru' ? 'Нужен стеллаж из крафта!' : (lang === 'uk' ? 'Потрібен стелаж з крафту!' : 'Need a crafted shelf!'), type: 'error' });
      return;
    }
    setState((prev) => ({
      ...prev,
      craftInventory: { ...prev.craftInventory, shelf: (prev.craftInventory.shelf ?? 0) - 1 },
      lifeSupport: { ...prev.lifeSupport, shelfCount: prev.lifeSupport.shelfCount + 1 },
    }));
    pushNotification({ message: lang === 'ru' ? 'Стеллаж установлен!' : (lang === 'uk' ? 'Стелаж встановлено!' : 'Shelf installed!'), type: 'success' });
  }, [pushNotification, lang]);

  const toggleOxygenValve = useCallback(() => {
    setState((prev) => ({
      ...prev,
      lifeSupport: {
        ...prev.lifeSupport,
        oxygenValveOpen: !prev.lifeSupport.oxygenValveOpen,
      },
    }));
  }, []);

  const usedWarehouseSpace = getUsedSpace(state.lifeSupport, state.fuel);
  const totalWarehouseSpace = getTotalSpace(state.lifeSupport.shelfCount);

  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        const now = Date.now();
        if (now - prev.fuel.diesel95PriceUpdatedAt < DIESEL95_UPDATE_MS) return prev;
        return {
          ...prev,
          fuel: {
            ...prev.fuel,
            diesel95Price: generateDiesel95Price(),
            diesel95PriceUpdatedAt: now,
          },
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        const now = Date.now();
        const deltaSec = 1;

        const activeCoolers = prev.lifeSupport.coolers.filter((c) => c.active && c.durability > 0);
        const hasChargedBattery = prev.lifeSupport.batteries.some((b) => b.currentCharge > 0);
        const genActive = prev.lifeSupport.generator.active && prev.lifeSupport.generator.fuelLiters > 0;
        const mineId = prev.currentMineId ?? 0;
        const mineCfg = getMineById(mineId);
        const oxygenPerMin = mineCfg.environment?.oxygenConsumptionPerMin ?? 0;
        const needsOxygen = oxygenPerMin > 0;

        const hasActiveLease = !!(prev.activeLeaseEndsAt && prev.activeLeaseEndsAt > now);

        let newLifeSupport = prev.lifeSupport;
        let changed = false;

        if (!hasActiveLease) {
          if (activeCoolers.length > 0) {
            const newCoolers = newLifeSupport.coolers.map((c) =>
              c.active ? { ...c, active: false } : c
            );
            newLifeSupport = { ...newLifeSupport, coolers: newCoolers };
            changed = true;
          }
          return changed ? { ...prev, lifeSupport: newLifeSupport } : prev;
        }

        if (activeCoolers.length > 0 && !hasChargedBattery) {
          const newCoolers = newLifeSupport.coolers.map((c) =>
            c.active ? { ...c, active: false } : c
          );
          newLifeSupport = { ...newLifeSupport, coolers: newCoolers };
          changed = true;
        }

        const stillActiveCoolers = newLifeSupport.coolers.filter((c) => c.active && c.durability > 0);
        if (!changed && stillActiveCoolers.length === 0 && !genActive && !needsOxygen) return prev;

        if (activeCoolers.length > 0) {
          const coolersChanged = newLifeSupport.coolers.some((c) => c.active && c.durability > 0);
          if (coolersChanged) {
            const newCoolers = newLifeSupport.coolers.map((c) => {
              if (!c.active || c.durability <= 0) return c;
              const cfg = COOLER_CONFIGS[c.type];
              const degrade = getCoolerDegradationPerSec(cfg, c.mode);
              const newDurability = Math.max(0, c.durability - degrade * deltaSec);
              if (newDurability <= 0) {
                return { ...c, durability: 0, active: false };
              }
              return { ...c, durability: newDurability };
            });
            if (newCoolers.some((c, i) => c.durability !== newLifeSupport.coolers[i].durability)) {
              newLifeSupport = { ...newLifeSupport, coolers: newCoolers };
              changed = true;
            }
          }
        }

        if (activeCoolers.length > 0) {
          let activeBatteryId = newLifeSupport.activeBatteryId;
          let batteries = [...newLifeSupport.batteries];

          const totalPowerPerSec = activeCoolers.reduce((sum, c) => {
            const cfg = COOLER_CONFIGS[c.type];
            return sum + (cfg.modeConfigs[c.mode]?.powerPerMin ?? 0) / 60;
          }, 0);

          if (totalPowerPerSec > 0) {
            let activeBat = activeBatteryId ? batteries.find((b) => b.id === activeBatteryId) : null;
            if (!activeBat || activeBat.currentCharge <= 0) {
              const next = batteries.find((b) => b.currentCharge > 0);
              if (next) {
                activeBatteryId = next.id;
                activeBat = next;
                changed = true;
              }
            }

            if (activeBat && activeBat.currentCharge > 0) {
              const drain = totalPowerPerSec * deltaSec;
              const newCharge = Math.max(0, activeBat.currentCharge - drain);
              batteries = batteries.map((b) =>
                b.id === activeBat!.id ? { ...b, currentCharge: newCharge } : b
              );

              if (newCharge <= 0) {
                const batCfg = BATTERY_CONFIGS[activeBat.type];
                if (batCfg.maxRecharges > 0) {
                  activeBatteryId = null;
                } else {
                  batteries = batteries.filter((b) => b.id !== activeBat!.id);
                  activeBatteryId = null;
                }
              }
              changed = true;
            }
          }

          newLifeSupport = { ...newLifeSupport, batteries, activeBatteryId };
        }

        if (needsOxygen) {
          if (!newLifeSupport.oxygenValveOpen) {
            // Valve closed — oxygen consumption paused when idle
            newLifeSupport = { ...newLifeSupport, oxygenTanks: newLifeSupport.oxygenTanks, activeOxygenTankId: newLifeSupport.activeOxygenTankId };
          } else {
          let oxygenTanks = [...newLifeSupport.oxygenTanks];
          let activeOxygenId = newLifeSupport.activeOxygenTankId;

          const oxygenPerSec = oxygenPerMin / 60;
          let activeTank = activeOxygenId ? oxygenTanks.find((t) => t.id === activeOxygenId) : null;

          if (!activeTank || activeTank.currentOxygen <= 0) {
            const next = oxygenTanks.find((t) => t.currentOxygen > 0);
            if (next) {
              activeOxygenId = next.id;
              activeTank = next;
              changed = true;
            }
          }

          if (activeTank && activeTank.currentOxygen > 0) {
            const newOxy = Math.max(0, activeTank.currentOxygen - oxygenPerSec * deltaSec);
            oxygenTanks = oxygenTanks.map((t) =>
              t.id === activeTank!.id ? { ...t, currentOxygen: newOxy } : t
            );

            if (newOxy <= 0) {
              oxygenTanks = oxygenTanks.filter((t) => t.id !== activeTank!.id);
              activeOxygenId = null;
            }
            changed = true;
          }

          newLifeSupport = { ...newLifeSupport, oxygenTanks, activeOxygenTankId: activeOxygenId };
          }
        }

        if (genActive) {
          const fuelBurned = (GENERATOR_FUEL_PER_MIN / 60) * deltaSec;
          const newFuel = Math.max(0, newLifeSupport.generator.fuelLiters - fuelBurned);

          let batteries = [...newLifeSupport.batteries];
          const lithiumIds = newLifeSupport.generator.lithiumBatteryIds;
          if (lithiumIds.length > 0 && newFuel > 0) {
            const chargePerBattery = lithiumIds.length === 1 ? 5 / 60 : 2.5 / 60;
            let batChanged = false;
            batteries = batteries.map((b) => {
              if (!lithiumIds.includes(b.id)) return b;
              if (b.currentCharge >= b.capacity) return b;
              const newCharge = Math.min(b.capacity, b.currentCharge + chargePerBattery * deltaSec);
              if (newCharge !== b.currentCharge) {
                batChanged = true;
                return { ...b, currentCharge: newCharge };
              }
              return b;
            });
            if (batChanged) {
              newLifeSupport = { ...newLifeSupport, batteries };
              changed = true;
            }
          }

          newLifeSupport = {
            ...newLifeSupport,
            generator: {
              ...newLifeSupport.generator,
              fuelLiters: newFuel,
              active: newFuel > 0,
            },
          };
          changed = true;
        }

        return changed ? { ...prev, lifeSupport: newLifeSupport } : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
    eatFood,
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
    currentBackpackLimit,
    currentBackpackWeight,
    upgradeBackpack,
    upgradeLuck,
    upgradeDiamondChance,
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
    recycleItem,
    unlockSlot6,
    isSlotUnlocked,
    totalItemEffects,
    unlockedMines,
    isMineUnlocked,
    startMineUnlock,
    speedUpMineUnlock,
    checkMineUnlockRequirements,
    upgradeEquipment,
    purchaseEquipment,
    purchaseRespiratorFilter,
    purchaseCartStation,
    purchaseRails,
    purchaseWoodenBracing,
    highestUnlockedMine,
    highestAccessibleMine,
    craftItem,
    buyMaterialSlot,
    buySpecialOffer,
    buyCanister,
    buyFuel,
    buyOxygenTank,
    buyBattery,
    buyCooler,
    toggleCooler,
    setCoolerMode,
    switchCooler,
    repairCooler,
    buyGenerator,
    toggleGenerator,
    refuelGenerator,
    insertLithiumBattery,
    removeLithiumBattery,
    buyShelf,
    toggleOxygenValve,
    sellCanister,
    usedWarehouseSpace,
    totalWarehouseSpace,
    levelUpData,
    setLevelUpData,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
