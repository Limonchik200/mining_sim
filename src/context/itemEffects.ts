import type { ItemEffect, ItemType } from '@/types/items';
import type { GameState } from '@/types';
import { getItemEffect } from '@/config/itemsConfig';

const EMPTY_EFFECT: ItemEffect = {
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

export function computeTotalItemEffects(state: GameState): ItemEffect {
  const agg: ItemEffect = { ...EMPTY_EFFECT };
  const seenTypes = new Set<ItemType>();
  const equipped = Array.isArray(state.equippedItems) ? state.equippedItems : [];
  const ownedItems = Array.isArray(state.ownedItems) ? state.ownedItems : [];
  for (const uid of equipped) {
    if (!uid) continue;
    const item = ownedItems.find((o) => o.uid === uid);
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
}

export function computeItemEffectsForRegen(equippedItems: (string | null)[], ownedItems: GameState['ownedItems']): { energyMaxBonus: number; energyRegenBonus: number; foodBonusPct: number } {
  const seen = new Set<ItemType>();
  let energyMaxBonus = 0;
  let energyRegenBonus = 0;
  let foodBonusPct = 0;
  for (const eid of equippedItems) {
    if (!eid) continue;
    const it = ownedItems.find((o) => o.uid === eid);
    if (!it || seen.has(it.type)) continue;
    seen.add(it.type);
    const e = getItemEffect(it.type, it.level);
    energyMaxBonus += e.energyMaxBonus;
    energyRegenBonus += e.energyRegenBonus;
    foodBonusPct += e.foodBonusPct;
  }
  return { energyMaxBonus, energyRegenBonus, foodBonusPct };
}
