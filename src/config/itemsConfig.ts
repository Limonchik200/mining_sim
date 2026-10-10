import type { ItemType, ItemRarity, ItemLevel, ItemEffect } from '@/types/items';
import type { MaterialId } from '@/config/expeditions';
import type { Lang } from '@/types';

export interface ItemTypeInfo {
  type: ItemType;
  nameUk: string;
  nameEn: string;
  nameRu: string;
  icon: string;
  color: string;
  descUk: string;
  descEn: string;
  descRu: string;
}

export const ITEM_TYPES: Record<ItemType, ItemTypeInfo> = {
  stopwatch: {
    type: 'stopwatch',
    nameUk: 'Секундомір',
    nameEn: 'Stopwatch',
    nameRu: 'Секундомер',
    icon: 'Timer',
    color: '#3b82f6',
    descUk: 'Множник купівлі активної шахти',
    descEn: 'Active lease purchase multiplier',
    descRu: 'Множитель покупки активной шахты',
  },
  energizer: {
    type: 'energizer',
    nameUk: 'Енергетик',
    nameEn: 'Energizer',
    nameRu: 'Энергетик',
    icon: 'Zap',
    color: '#f59e0b',
    descUk: 'Ліміт енергії, регенерація, поповнення їжею',
    descEn: 'Energy limit, regen, food boost',
    descRu: 'Лимит энергии, регенерация, еда',
  },
  scales: {
    type: 'scales',
    nameUk: 'Ваги',
    nameEn: 'Scales',
    nameRu: 'Весы',
    icon: 'Scale',
    color: '#22c55e',
    descUk: 'Множник грошей з продажу руди',
    descEn: 'Sell multiplier for ore',
    descRu: 'Множитель денег за руду',
  },
  boots: {
    type: 'boots',
    nameUk: 'Чоботи скороходи',
    nameEn: 'Swift Boots',
    nameRu: 'Сапоги скороходы',
    icon: 'Footprints',
    color: '#06b6d4',
    descUk: 'Зменшення часу експедицій та оновлення',
    descEn: 'Expedition & refresh time reduction',
    descRu: 'Снижение времени экспедиций и обновления',
  },
  basket: {
    type: 'basket',
    nameUk: 'Кошик',
    nameEn: 'Basket',
    nameRu: 'Корзина',
    icon: 'ShoppingBasket',
    color: '#ef4444',
    descUk: 'Шанс отримати більше луту з експедицій',
    descEn: 'Chance for more expedition loot',
    descRu: 'Шанс получить больше лута с экспедиций',
  },
};

export const ITEM_RARITIES: Record<ItemRarity, { nameUk: string; nameEn: string; nameRu: string; color: string; glow: string }> = {
  1: { nameUk: 'Звичайний', nameEn: 'Common', nameRu: 'Обычный', color: '#94a3b8', glow: '#94a3b830' },
  2: { nameUk: 'Хороший', nameEn: 'Good', nameRu: 'Хороший', color: '#22c55e', glow: '#22c55e30' },
  3: { nameUk: 'Рідкісний', nameEn: 'Rare', nameRu: 'Редкий', color: '#3b82f6', glow: '#3b82f630' },
  4: { nameUk: 'Епічний', nameEn: 'Epic', nameRu: 'Эпический', color: '#a855f7', glow: '#a855f730' },
};

export const ITEM_LEVEL_NAMES: Record<ItemLevel, { nameUk: string; nameEn: string; nameRu: string; color: string }> = {
  1: { nameUk: 'Звичайний', nameEn: 'Common', nameRu: 'Обычный', color: '#ffffff' },
  2: { nameUk: 'Хороший', nameEn: 'Good', nameRu: 'Хороший', color: '#22c55e' },
  3: { nameUk: 'Рідкісний', nameEn: 'Rare', nameRu: 'Редкий', color: '#3b82f6' },
  4: { nameUk: 'Епічний', nameEn: 'Epic', nameRu: 'Эпический', color: '#a855f7' },
  5: { nameUk: 'Легендарний', nameEn: 'Legendary', nameRu: 'Легендарный', color: '#f59e0b' },
  6: { nameUk: 'Майстерний', nameEn: 'Master', nameRu: 'Мастерный', color: '#a16207' },
  7: { nameUk: 'Міфічний', nameEn: 'Mythic', nameRu: 'Мифический', color: '#ef4444' },
};

export const BAG_RARITY_CHANCES: Record<ItemRarity, number> = {
  1: 0.80,
  2: 0.15,
  3: 0.04,
  4: 0.01,
};

export type MaterialCost = Partial<Record<MaterialId, number>> & { gems?: number };

export const UPGRADE_COSTS: Record<ItemLevel, MaterialCost> = {
  1: { gems: 10, scroll: 10, rainbow_stone: 1 },
  2: { gems: 20, scroll: 30, ruby_powder: 15, rainbow_stone: 1 },
  3: { gems: 50, scroll: 70, ruby_powder: 35, essence: 15, rainbow_stone: 2 },
  4: { gems: 120, scroll: 180, ruby_powder: 80, essence: 40, magma_stone: 2, rainbow_stone: 4 },
  5: { gems: 300, scroll: 450, ruby_powder: 210, essence: 110, magma_stone: 5, rainbow_stone: 10 },
  6: { gems: 800, scroll: 1200, ruby_powder: 550, essence: 280, magma_stone: 15, solar_essence: 20, rainbow_stone: 50 },
  7: {},
};

export const ALL_ITEM_TYPES: ItemType[] = ['stopwatch', 'energizer', 'scales', 'boots', 'basket'];

function rollBagRarity(): ItemRarity {
  const roll = Math.random();
  let cum = 0;
  for (const r of [1, 2, 3, 4] as ItemRarity[]) {
    cum += BAG_RARITY_CHANCES[r];
    if (roll < cum) return r;
  }
  return 1;
}

export function rollItemFromBag(): { type: ItemType; rarity: ItemRarity } {
  const rarity = rollBagRarity();
  const type = ALL_ITEM_TYPES[Math.floor(Math.random() * ALL_ITEM_TYPES.length)];
  return { type, rarity };
}

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

type LevelEffectMap = Record<ItemLevel, Partial<ItemEffect>>;

const STOPWATCH_EFFECTS: LevelEffectMap = {
  1: { activeLeaseMultBonus: 0.05 },
  2: { activeLeaseMultBonus: 0.10 },
  3: { activeLeaseMultBonus: 0.15 },
  4: { activeLeaseMultBonus: 0.30 },
  5: { activeLeaseMultBonus: 0.50 },
  6: { activeLeaseMultBonus: 0.80 },
  7: { activeLeaseMultBonus: 1.50 },
};

const ENERGIZER_EFFECTS: LevelEffectMap = {
  1: { energyMaxBonus: 20 },
  2: { energyMaxBonus: 40 },
  3: { energyMaxBonus: 60, energyRegenBonus: 0.5 },
  4: { energyMaxBonus: 90, energyRegenBonus: 1 },
  5: { energyMaxBonus: 150, energyRegenBonus: 2, foodBonusPct: 0.10 },
  6: { energyMaxBonus: 250, energyRegenBonus: 3.5, foodBonusPct: 0.20 },
  7: { energyMaxBonus: 500, energyRegenBonus: 6, foodBonusPct: 0.35 },
};

const SCALES_EFFECTS: LevelEffectMap = {
  1: { sellMultBonus: 0.1 },
  2: { sellMultBonus: 0.2 },
  3: { sellMultBonus: 0.3 },
  4: { sellMultBonus: 0.5 },
  5: { sellMultBonus: 0.85 },
  6: { sellMultBonus: 1.50 },
  7: { sellMultBonus: 2.50 },
};

const BOOTS_EFFECTS: LevelEffectMap = {
  1: { expeditionTimeReductionPct: 1 },
  2: { expeditionTimeReductionPct: 2 },
  3: { expeditionTimeReductionPct: 3 },
  4: { expeditionTimeReductionPct: 5, expeditionRefreshReductionPct: 2 },
  5: { expeditionTimeReductionPct: 8, expeditionRefreshReductionPct: 4 },
  6: { expeditionTimeReductionPct: 13, expeditionRefreshReductionPct: 7 },
  7: { expeditionTimeReductionPct: 20, expeditionRefreshReductionPct: 12 },
};

const BASKET_EFFECTS: LevelEffectMap = {
  1: { expeditionLootChance: 0.05, expeditionLootMult: 1.25 },
  2: { expeditionLootChance: 0.10, expeditionLootMult: 1.25 },
  3: { expeditionLootChance: 0.10, expeditionLootMult: 1.30 },
  4: { expeditionLootChance: 0.15, expeditionLootMult: 1.35 },
  5: { expeditionLootChance: 0.20, expeditionLootMult: 1.50 },
  6: { expeditionLootChance: 0.30, expeditionLootMult: 1.75 },
  7: { expeditionLootChance: 0.50, expeditionLootMult: 2.00 },
};

const EFFECT_MAPS: Record<ItemType, LevelEffectMap> = {
  stopwatch: STOPWATCH_EFFECTS,
  energizer: ENERGIZER_EFFECTS,
  scales: SCALES_EFFECTS,
  boots: BOOTS_EFFECTS,
  basket: BASKET_EFFECTS,
};

export function getItemEffect(type: ItemType, level: ItemLevel): ItemEffect {
  const partial = EFFECT_MAPS[type][level] || {};
  return { ...EMPTY_EFFECT, ...partial };
}

export function getItemName(type: ItemType, lang: Lang): string {
  const info = ITEM_TYPES[type];
  return lang === 'ru' ? info.nameRu : (lang === 'uk' ? info.nameUk : info.nameEn);
}

export function getItemLevelName(level: ItemLevel, lang: Lang): string {
  const info = ITEM_LEVEL_NAMES[level];
  return lang === 'ru' ? info.nameRu : (lang === 'uk' ? info.nameUk : info.nameEn);
}

export function getItemRarityName(rarity: ItemRarity, lang: Lang): string {
  const info = ITEM_RARITIES[rarity];
  return lang === 'ru' ? info.nameRu : (lang === 'uk' ? info.nameUk : info.nameEn);
}
