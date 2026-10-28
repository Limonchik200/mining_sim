import type { GameState } from '@/types';
import { getAutoCooldownMs, getBasketCapValue, getEnergyRegenValue, getEnergyRegenAmountValue, getDiamondChanceBonus } from '@/config/upgradesConfig';
import { getPickaxeTier } from '@/config/pickaxesConfig';
import { getRandomResourceForMine, getRandomMass, rollDiamondDrop } from '@/config/minesConfig';
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

  // Offline auto-mining: deterministic, bounded by whichever ends first —
  // the auto-lease end, or the basket filling up. We compute the exact number
  // of digs that fit and execute them in order, degrading the pickaxe and
  // swapping in spares just like live play. No partial ore is lost.
  const autoLeaseEndAt = next.autoMiningEndsAt;
  if (autoLeaseEndAt && autoLeaseEndAt > lastOnlineAt) {
    const autoCooldownSec = getAutoCooldownMs(next.upgrades.autoCooldownLvl) / 1000;
    const basketCap = getBasketCapValue(next.upgrades.basketCapLvl);
    const tier = getPickaxeTier(next.activePickaxeTierId);
    const yieldCount = Math.max(1, tier.yieldMultiplier);
    const itemEff = computeTotalItemEffects(next);

    // Effective auto-mining window: from when the player went offline until
    // either now (still active) or when the lease ended.
    const effectiveAutoEnd = Math.min(autoLeaseEndAt, now);
    const autoActiveSec = Math.max(0, (effectiveAutoEnd - lastOnlineAt) / 1000);
    // Upper bound on digs by time. The loop below further caps by basket cap
    // and pickaxe durability, so the player never gets more than they should.
    const maxDigsByTime = Math.floor(autoActiveSec / autoCooldownSec);

    let basket = [...next.autoBasket];
    let basketCases = [...next.autoBasketCases];
    let activePickaxe = next.activePickaxe ? { ...next.activePickaxe } : null;
    let sparePickaxes = [...next.sparePickaxes];
    let totalDigs = next.totalDigs;
    let gems = next.gems;
    let totalGemsEarned = next.totalGemsEarned;
    let basketMass = basket.reduce((s, it) => s + it.mass, 0);
    let digsDone = 0;

    for (let i = 0; i < maxDigsByTime; i++) {
      if (basketMass >= basketCap) break;
      if (!activePickaxe || activePickaxe.durability < tier.durabilityCost) break;

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
      totalDigs++;

      const newDur = Math.round(activePickaxe.durability - tier.durabilityCost * AUTO_DURABILITY_MULT);
      if (newDur <= 0) {
        if (sparePickaxes.length > 0) {
          activePickaxe = { ...sparePickaxes[0] };
          sparePickaxes = sparePickaxes.slice(1);
        } else {
          activePickaxe = { ...activePickaxe, durability: 0 };
          break;
        }
      } else {
        activePickaxe = { ...activePickaxe, durability: newDur };
      }

      if (rollAutoCaseDrop(next.upgrades.caseChanceLvl, next.autoLeaseMineId || 1)) {
        const rarity = rollCaseRarity();
        basketCases.push({ id: `case-offline-${now}-${i}-${Math.random()}`, rarity, opened: false });
      }

      const offlineDiamond = rollDiamondDrop(getDiamondChanceBonus(next.upgrades.diamondChanceLvl ?? 0), next.autoLeaseMineId || 1);
      if (offlineDiamond.dropped) {
        gems = gems + offlineDiamond.amount;
        totalGemsEarned = (totalGemsEarned || 0) + offlineDiamond.amount;
      }
    }

    if (digsDone > 0) {
      next.autoBasket = basket;
      next.autoBasketCases = basketCases;
      next.activePickaxe = activePickaxe;
      next.sparePickaxes = sparePickaxes;
      next.totalDigs = totalDigs;
      next.gems = gems;
      next.totalGemsEarned = totalGemsEarned;
      // Advance lastAutoDigAt by the time actually consumed so the live tick
      // resumes from the right point and doesn't re-process offline time.
      next.lastAutoDigAt = effectiveAutoEnd;
      changed = true;
    }
  }

  return changed ? next : prev;
}
