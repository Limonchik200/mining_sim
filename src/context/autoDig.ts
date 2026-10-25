import type { GameState } from '@/types';
import { getAutoCooldownMs, getBasketCapValue, getEnergyRegenValue, getEnergyRegenAmountValue, getDiamondChanceBonus } from '@/config/upgradesConfig';
import { getPickaxeTier } from '@/config/pickaxesConfig';
import { getRandomResourceForMine, getRandomMass, rollDiamondDrop, getMineById, isDumpMine } from '@/config/minesConfig';
import { rollAutoCaseDrop, rollCaseRarity } from '@/config/casesConfig';
import { computeItemEffectsForRegen, computeTotalItemEffects } from './itemEffects';
import { generateExpeditionSlots, EXPEDITION_REFRESH_MS } from './storage';
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
    next = processAutoDig(next, now, pushNotification, tr);
    if (next !== prev) changed = true;
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

  const autoMineId = next.autoLeaseMineId || 1;
  const autoMine = getMineById(autoMineId);
  const autoDump = isDumpMine(autoMineId);
  const autoOxygenPerMin = autoMine.environment?.oxygenConsumptionPerMin ?? 0;
  const autoNeedsOxygen = !autoDump && autoOxygenPerMin > 0;
  if (autoNeedsOxygen) {
    const activeTank = next.lifeSupport.activeOxygenTankId
      ? next.lifeSupport.oxygenTanks.find((t) => t.id === next.lifeSupport.activeOxygenTankId)
      : next.lifeSupport.oxygenTanks.find((t) => t.currentOxygen > 0);
    if (!activeTank || activeTank.currentOxygen <= 0) return state;
    if (!next.lifeSupport.oxygenValveOpen) return state;
    const activeCoolers = next.lifeSupport.coolers.filter((c) => c.active && c.durability > 0);
    if (activeCoolers.length === 0) return state;
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

  const autoLeaseEndAt = next.autoMiningEndsAt;
  const lastOnlineAt = now - offlineSec * 1000;

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

  if (autoLeaseEndAt && autoLeaseEndAt > lastOnlineAt) {
    const autoCooldown = getAutoCooldownMs(next.upgrades.autoCooldownLvl) / 1000;
    const basketCap = getBasketCapValue(next.upgrades.basketCapLvl);
    const yieldCount = Math.max(1, getPickaxeTier(next.activePickaxeTierId).yieldMultiplier);
    let basket = [...next.autoBasket];
    let basketCases = [...next.autoBasketCases];
    let digsDone = 0;
    const tier = getPickaxeTier(next.activePickaxeTierId);
    let basketMass = basket.reduce((s, it) => s + it.mass, 0);
    const itemEff = computeTotalItemEffects(next);
    const effectiveAutoEnd = Math.min(autoLeaseEndAt, now);
    const autoActiveSec = Math.max(0, (effectiveAutoEnd - lastOnlineAt) / 1000);
    const cappedMaxDigs = Math.floor(autoActiveSec / autoCooldown);

    const offMineId = next.autoLeaseMineId || 1;
    const offMine = getMineById(offMineId);
    const offDump = isDumpMine(offMineId);
    const offOxygenPerMin = offMine.environment?.oxygenConsumptionPerMin ?? 0;
    const offNeedsOxygen = !offDump && offOxygenPerMin > 0;
    let oxygenBlocked = false;
    if (offNeedsOxygen) {
      const activeTank = next.lifeSupport.activeOxygenTankId
        ? next.lifeSupport.oxygenTanks.find((t) => t.id === next.lifeSupport.activeOxygenTankId)
        : next.lifeSupport.oxygenTanks.find((t) => t.currentOxygen > 0);
      if (!activeTank || activeTank.currentOxygen <= 0) oxygenBlocked = true;
      if (!next.lifeSupport.oxygenValveOpen) oxygenBlocked = true;
      const activeCoolers = next.lifeSupport.coolers.filter((c) => c.active && c.durability > 0);
      if (activeCoolers.length === 0) oxygenBlocked = true;
    }
    if (oxygenBlocked) {
      return changed ? next : prev;
    }

    for (let i = 0; i < cappedMaxDigs && basketMass < basketCap; i++) {
      if (!next.activePickaxe || next.activePickaxe.durability < tier.durabilityCost) break;

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
      digsDone++;

      const newDur = Math.round(next.activePickaxe.durability - tier.durabilityCost * AUTO_DURABILITY_MULT);
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

      if (rollAutoCaseDrop(next.upgrades.caseChanceLvl, next.autoLeaseMineId || 1)) {
        const rarity = rollCaseRarity();
        basketCases.push({ id: `case-${now}-${i}-${Math.random()}`, rarity, opened: false });
      }

      const offlineDiamond = rollDiamondDrop(getDiamondChanceBonus(next.upgrades.diamondChanceLvl ?? 0), next.autoLeaseMineId || 1);
      if (offlineDiamond.dropped) {
        next.gems = next.gems + offlineDiamond.amount;
        next.totalGemsEarned = (next.totalGemsEarned || 0) + offlineDiamond.amount;
      }
    }

    if (digsDone > 0) {
      next.autoBasket = basket;
      next.autoBasketCases = basketCases;
      next.totalDigs = next.totalDigs + digsDone;
      next.lastAutoDigAt = now;
      changed = true;
    }
  }

  return changed ? next : prev;
}
