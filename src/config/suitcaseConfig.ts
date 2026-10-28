import type { ItemType, ItemRarity, ItemLevel, OwnedItem } from '@/types/items';
import { ALL_ITEM_TYPES, ITEM_RARITIES, ITEM_LEVEL_NAMES } from '@/config/itemsConfig';
import type { Lang } from '@/types';

// ==========================================
// v9.2.0 — "Експедиційний прорив"
// Suitcase case: drops an item whose rarity/level is rolled from the loot table.
// Sources: EXPEDITION_TIER_6, SPECIAL_OFFERS.
// ==========================================

export type SuitcaseLootTier = 'good' | 'rare' | 'epic' | 'legendary' | 'master';

export interface SuitcaseLootEntry {
  tier: SuitcaseLootTier;
  chance: number; // percentage 0-100
  itemRarity: ItemRarity;
  itemLevel: ItemLevel;
}

export interface SuitcaseOpenResult {
  item: OwnedItem;
  lootTier: SuitcaseLootTier;
  label: string;
  labelEn: string;
  labelRu: string;
  color: string;
}

export const SUITCASE_LOOT_TABLE: SuitcaseLootEntry[] = [
  { tier: 'good',      chance: 50.0, itemRarity: 2, itemLevel: 2 },
  { tier: 'rare',      chance: 30.0, itemRarity: 3, itemLevel: 3 },
  { tier: 'epic',      chance: 15.0, itemRarity: 4, itemLevel: 4 },
  { tier: 'legendary', chance: 4.5,  itemRarity: 4, itemLevel: 5 },
  { tier: 'master',    chance: 0.5,  itemRarity: 4, itemLevel: 7 },
];

export const SUITCASE_META: Record<SuitcaseLootTier, { nameUk: string; nameEn: string; nameRu: string; color: string }> = {
  good:      { nameUk: 'Хороший',   nameEn: 'Good',      nameRu: 'Хороший',    color: '#22c55e' },
  rare:      { nameUk: 'Рідкісний', nameEn: 'Rare',      nameRu: 'Редкий',     color: '#3b82f6' },
  epic:      { nameUk: 'Епічний',   nameEn: 'Epic',      nameRu: 'Эпический',  color: '#a855f7' },
  legendary: { nameUk: 'Легендарний', nameEn: 'Legendary', nameRu: 'Легендарный', color: '#f59e0b' },
  master:    { nameUk: 'Майстерний',  nameEn: 'Master',    nameRu: 'Мастер', color: '#ef4444' },
};

export const SUITCASE_NAME = {
  nameUk: 'Чемодан з предметами',
  nameEn: 'Item Suitcase',
  nameRu: 'Чемодан с предметами',
};

export function getSuitcaseName(lang: Lang): string {
  return lang === 'ru' ? SUITCASE_NAME.nameRu : lang === 'uk' ? SUITCASE_NAME.nameUk : SUITCASE_NAME.nameEn;
}

function rollLootTier(): SuitcaseLootEntry {
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const entry of SUITCASE_LOOT_TABLE) {
    cumulative += entry.chance;
    if (roll <= cumulative) return entry;
  }
  return SUITCASE_LOOT_TABLE[0];
}

function pickItemType(): ItemType {
  return ALL_ITEM_TYPES[Math.floor(Math.random() * ALL_ITEM_TYPES.length)];
}

/**
 * Rolls the suitcase loot table and produces an OwnedItem with the rarity/level
 * dictated by the rolled tier. The caller is responsible for persisting the
 * returned item into state.ownedItems.
 */
export function openSuitcase(): SuitcaseOpenResult {
  const entry = rollLootTier();
  const type = pickItemType();
  const item: OwnedItem = {
    uid: `suitcase_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    rarity: entry.itemRarity,
    level: entry.itemLevel,
  };
  const meta = SUITCASE_META[entry.tier];
  const rarityName = ITEM_RARITIES[entry.itemRarity];
  const levelName = ITEM_LEVEL_NAMES[entry.itemLevel];
  return {
    item,
    lootTier: entry.tier,
    label: `${meta.nameUk} (${levelName.nameUk})`,
    labelEn: `${meta.nameEn} (${levelName.nameEn})`,
    labelRu: `${meta.nameRu} (${levelName.nameRu})`,
    color: meta.color,
  };
}
