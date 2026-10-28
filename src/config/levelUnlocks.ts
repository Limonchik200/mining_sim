import type { Lang } from '@/types';

export function gemsForLevel(level: number): number {
  if (level >= 201) return 15;
  if (level >= 151) return 11;
  if (level >= 101) return 9;
  if (level >= 76) return 7;
  if (level >= 61) return 5;
  if (level >= 46) return 4;
  if (level >= 31) return 3;
  if (level >= 16) return 2;
  return 1;
}

export interface LevelMilestone {
  level: number;
  unlockName: { ru: string; uk: string; en: string };
}

export const LEVEL_MILESTONES: LevelMilestone[] = [
  { level: 2, unlockName: { ru: 'Прокачка', uk: 'Прокачка', en: 'Upgrades Tab' } },
  { level: 3, unlockName: { ru: 'Спорядження', uk: 'Спорядження', en: 'Gear Tab' } },
  { level: 4, unlockName: { ru: 'Щоденний календар', uk: 'Щоденний календар', en: 'Daily Calendar' } },
  { level: 5, unlockName: { ru: 'Предмети', uk: 'Предмети', en: 'Items' } },
  { level: 6, unlockName: { ru: 'Щоденні завдання', uk: 'Щоденні завдання', en: 'Daily Quests' } },
  { level: 7, unlockName: { ru: 'Малий балон · Батарейка · Слабкий охолоджувач · Шахта 3-4', uk: 'Малий балон · Батарейка · Слабкий охолоджувач · Шахта 3-4', en: 'Small Tank · Battery · Weak Cooler · Mine 3-4' } },
  { level: 8, unlockName: { ru: 'Крафт · Деревина', uk: 'Крафт · Деревина', en: 'Crafting · Wood' } },
  { level: 9, unlockName: { ru: 'Щотижневі завдання', uk: 'Щотижневі завдання', en: 'Weekly Quests' } },
  { level: 10, unlockName: { ru: 'Планки · Крафт рейок · Шахта 5', uk: 'Планки · Крафт рейок · Шахта 5', en: 'Planks · Rail Crafting · Mine 5' } },
  { level: 12, unlockName: { ru: 'Спеціальні пропозиції', uk: 'Спеціальні пропозиції', en: 'Special Offers' } },
  { level: 13, unlockName: { ru: 'Шахта 6', uk: 'Шахта 6', en: 'Mine 6' } },
  { level: 16, unlockName: { ru: 'Звичайний балон · Слабкий акумулятор · Шахта 7', uk: 'Звичайний балон · Слабкий акумулятор · Шахта 7', en: 'Regular Tank · Weak Accumulator · Mine 7' } },
  { level: 20, unlockName: { ru: 'Шахта 8', uk: 'Шахта 8', en: 'Mine 8' } },
  { level: 24, unlockName: { ru: 'Сапфировая кирка · Экспедиции Тір 5 · Звичайний охолоджувач · Шахта 9', uk: 'Сапфірова кирка · Експедиції Тір 5 · Звичайний охолоджувач · Шахта 9', en: 'Sapphire Pickaxe · Expedition Tier 5 · Regular Cooler · Mine 9' } },
  { level: 27, unlockName: { ru: 'Аметистовая кирка', uk: 'Аметистова кирка', en: 'Amethyst Pickaxe' } },
  { level: 28, unlockName: { ru: 'Автомобільний акумулятор · Шахта 10', uk: 'Автомобільний акумулятор · Шахта 10', en: 'Car Battery · Mine 10' } },
  { level: 32, unlockName: { ru: 'Великий балон', uk: 'Великий балон', en: 'Large Tank' } },
  { level: 45, unlockName: { ru: 'Літієвий акумулятор', uk: 'Літієвий акумулятор', en: 'Lithium Battery' } },
  { level: 50, unlockName: { ru: 'Промисловий охолоджувач · Дизельний генератор · Заправка', uk: 'Промисловий охолоджувач · Дизельний генератор · Заправка', en: 'Industrial Cooler · Diesel Generator · Fuel Station' } },
];

export function getMilestoneForLevel(level: number): LevelMilestone | null {
  return LEVEL_MILESTONES.find((m) => m.level === level) || null;
}

export function getMilestoneName(milestone: LevelMilestone | null, lang: Lang): string {
  if (!milestone) return '';
  if (lang === 'ru') return milestone.unlockName.ru;
  if (lang === 'uk') return milestone.unlockName.uk;
  return milestone.unlockName.en;
}

export function isFeatureUnlocked(feature: string, level: number): boolean {
  const req: Record<string, number> = {
    upgrades: 2,
    gear: 3,
    dailyCalendar: 4,
    items: 5,
    craft: 8,
    rawMaterials: 8,
    planks: 10,
    railCraft: 10,
    specialOffers: 12,
    fuel: 50,
  };
  return level >= (req[feature] ?? 0);
}

export function isItemUnlocked(itemId: string, level: number): boolean {
  const req: Record<string, number> = {
    oxygen_tank_small: 7,
    oxygen_tank_medium: 16,
    oxygen_tank_large: 32,
    battery_basic: 7,
    battery_weak: 16,
    battery_car: 28,
    battery_lithium: 45,
    cooler_weak: 7,
    cooler_normal: 24,
    cooler_industrial: 50,
  };
  return level >= (req[itemId] ?? 0);
}

export function isCraftItemUnlocked(itemId: string, level: number): boolean {
  const req: Record<string, number> = {
    wood_log: 8,
    steel_plank: 10,
    rails: 10,
    wooden_bracing: 8,
    shelf: 10,
    food_cabinet: 10,
  };
  return level >= (req[itemId] ?? 0);
}
