import type { GameState } from '@/types';
import { getAutoCooldownMs, getBasketCapValue, getEnergyRegenValue, getEnergyRegenAmountValue, getDiamondChanceBonus } from '@/config/upgradesConfig';
import { getPickaxeTier } from '@/config/pickaxesConfig';
import { getRandomResourceForMine, getRandomMass, rollDiamondDrop } from '@/config/minesConfig';
import { rollAutoCaseDrop, rollCaseRarity } from '@/config/casesConfig';
import { computeItemEffectsForRegen, computeTotalItemEffects } from './itemEffects';
import type { Notification } from '@/types';

type PushNotif = (notif: Omit<Notification, 'id'>) => void;
type TrFn = (key: any) => string;

export interface AutoDigResult {
  state: GameState;
  changed: boolean;
  notifications: Omit<Notification, 'id'>[];
}

const AUTO_DURABILITY_MULT = 1.15;

export function processTick(
  prev: GameState,
  now: number,
  deltaSec: number,
  pushNotification: PushNotif,
  tr: TrFn,
): GameState {
  let next = { ...prev };
  let changed = false;

  next.stats = { ...next.stats, playSeconds: (next.stats.playSeconds ?? 0) + deltaSec };
  changed = true;

  const { energyMaxBonus, energyRegenBonus } = computeItemEffectsForRegen(
    prev.equippedItems, prev.ownedItems
  );

  const effectiveMaxEnergy = prev.maxEnergy + energyMaxBonus;
  if (prev.energy < effectiveMaxEnergy) {
    const activeBuffs = next.buffs.filter((b) => b.expiresAt > now);
    let totalRegenMult = 1;
    for (const buff of activeBuffs) totalRegenMult += buff.regenMultiplier;
    if (activeBuffs.length !== next.buffs.length) {
      next.buffs = activeBuffs;
      changed = true;
    }
    const regenSeconds = getEnergyRegenValue(next.upgrades.energyRegenLvl);
    const regenMult = getEnergyRegenAmountValue(next.upgrades.energyRegenAmountLvl ?? 0) + energyRegenBonus;
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

  // v9.4.0 lazy lifecycle: expedition refresh no longer happens during the
  // global tick or on app init. It is triggered exclusively when the player
  // navigates to the Expeditions tab (refreshExpeditionsOnTabFocus).

  if (next.autoMiningEndsAt) {
    const digged = processAutoDig(next, Math.min(now, next.autoMiningEndsAt), pushNotification, tr);
    if (digged !== next) {
      next = digged;
      changed = true;
    }
  }

  if (next.autoMiningEndsAt && now > next.autoMiningEndsAt) {
    next.autoMiningEndsAt = null;
    next.autoMiningTotal = 0;
    changed = true;
    pushNotification({ message: tr('notifAutoLeaseExpired'), type: 'warning' });
  }

  return changed ? next : prev;
}

export function processAutoDig(
  state: GameState,
  now: number,
  pushNotification: PushNotif,
  tr: TrFn,
): GameState {
  let next = { ...state };
  const autoCooldown = getAutoCooldownMs(next.upgrades.autoCooldownLvl);
  const basketCap = getBasketCapValue(next.upgrades.basketCapLvl);
  const tier = getPickaxeTier(next.activePickaxeTierId);
  const elapsedSinceDig = now - next.lastAutoDigAt;
  const yieldCount = Math.max(1, tier.yieldMultiplier);

  const currentMass = next.autoBasket.reduce((s, it) => s + it.mass, 0);

  if (
    elapsedSinceDig < autoCooldown ||
    currentMass >= basketCap ||
    !next.activePickaxe ||
    next.activePickaxe.durability < tier.durabilityCost
  ) {
    return state;
  }

  const missedDigs = Math.floor(elapsedSinceDig / autoCooldown);
  let basket = [...next.autoBasket];
  let basketCases = [...next.autoBasketCases];
  let activePickaxe = { ...next.activePickaxe };
  let sparePickaxes = [...next.sparePickaxes];
  let totalDigs = next.totalDigs;
  let pickaxeBroken = false;
  let gems = next.gems;
  let totalGemsEarned = next.totalGemsEarned;
  const itemEff = computeTotalItemEffects(next);

  let basketMass = currentMass;
  for (let i = 0; i < missedDigs; i++) {
    if (basketMass >= basketCap) break;
    if (!activePickaxe || activePickaxe.durability < tier.durabilityCost) {
      pickaxeBroken = true;
      break;
    }

    let yieldMult = 1;
    if (itemEff.oreYieldMultChance > 0 && Math.random() < itemEff.oreYieldMultChance) {
      yieldMult = itemEff.oreYieldMult;
    }
    const rollsThisDig = Math.max(1, Math.round(yieldCount * yieldMult));
    for (let j = 0; j < rollsThisDig && basketMass < basketCap; j++) {
      const resource = getRandomResourceForMine(next.autoLeaseMineId || 1);
      const mass = Math.round(getRandomMass(resource) * 100) / 100;
      basket.push({ resource: resource.type, mass, xp: resource.xp, timestamp: now });
      basketMass += mass;
    }
    totalDigs++;

    const newDur = Math.round(activePickaxe.durability - tier.durabilityCost * AUTO_DURABILITY_MULT);
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

    if (rollAutoCaseDrop(next.upgrades.caseChanceLvl, next.autoLeaseMineId || 1)) {
      const rarity = rollCaseRarity();
      basketCases.push({ id: `case-${now}-${i}-${Math.random()}`, rarity, opened: false });
    }

    const autoDiamond = rollDiamondDrop(getDiamondChanceBonus(next.upgrades.diamondChanceLvl ?? 0), next.autoLeaseMineId || 1);
    if (autoDiamond.dropped) {
      gems = gems + autoDiamond.amount;
      totalGemsEarned = (totalGemsEarned || 0) + autoDiamond.amount;
    }
  }

  next.autoBasket = basket;
  next.autoBasketCases = basketCases;
  next.activePickaxe = activePickaxe;
  next.sparePickaxes = sparePickaxes;
  next.totalDigs = totalDigs;
  next.lastAutoDigAt = now;
  next.gems = gems;
  next.totalGemsEarned = totalGemsEarned;

  if (pickaxeBroken && !sparePickaxes.length) {
    pushNotification({ message: tr('notifNoSparePickaxe'), type: 'error' });
  }
  if (basketMass >= basketCap) {
    pushNotification({ message: tr('notifBasketFull'), type: 'warning' });
  }

  return next;
}

export function processOfflineProgress(
  prev: GameState,
  now: number,
  offlineSec: number,
  pushNotification: PushNotif,
  tr: TrFn,
): GameState {
  let next = { ...prev };
  let changed = false;

  if (next.energy < next.maxEnergy) {
    const { energyMaxBonus, energyRegenBonus } = computeItemEffectsForRegen(
      prev.equippedItems, prev.ownedItems
    );
    const effectiveMax = next.maxEnergy + energyMaxBonus;
    if (next.energy < effectiveMax) {
      const activeBuffs = next.buffs.filter((b) => b.expiresAt > now);
      let totalRegenMult = 1;
      for (const buff of activeBuffs) totalRegenMult += buff.regenMultiplier;
      next.buffs = activeBuffs;
      const regenSeconds = getEnergyRegenValue(next.upgrades.energyRegenLvl);
      const regenMult = getEnergyRegenAmountValue(next.upgrades.energyRegenAmountLvl ?? 0) + energyRegenBonus;
      const regenAmount = (offlineSec / regenSeconds) * totalRegenMult * regenMult;
      next.energy = Math.min(effectiveMax, next.energy + regenAmount);
      changed = true;
    }
  }

  next.buffs = next.buffs.filter((b) => b.expiresAt > now);
  if (next.buffs.length !== prev.buffs.length) changed = true;

  // Auto-mining is credited from the last dig up to the lease end (or now),
  // so ore mined before a lease expired is kept even if the game was closed.
  if (next.autoMiningEndsAt) {
    const digged = processAutoDig(next, Math.min(now, next.autoMiningEndsAt), pushNotification, tr);
    if (digged !== next) {
      next = digged;
      changed = true;
    }
  }

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

  return changed ? next : prev;
}
