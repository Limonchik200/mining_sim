import type { CaseRarity, CaseLootResult, CaseLootTableEntry } from '@/types/inventory';

export const BASE_CASE_DROP_CHANCE = 0.001;
export const CASE_CHANCE_PER_LEVEL = 0.0005;
export const CASE_CHANCE_MAX_LEVEL = 30;

export const CASE_RARITIES: Record<CaseRarity, { nameUk: string; nameEn: string; chance: number; color: string; glowColor: string }> = {
  common: { nameUk: 'Звичайний', nameEn: 'Common', chance: 0.69, color: '#94a3b8', glowColor: '#94a3b840' },
  rare: { nameUk: 'Рідкісний', nameEn: 'Rare', chance: 0.25, color: '#3b82f6', glowColor: '#3b82f640' },
  epic: { nameUk: 'Епічний', nameEn: 'Epic', chance: 0.05, color: '#a855f7', glowColor: '#a855f740' },
  legendary: { nameUk: 'Легендарний', nameEn: 'Legendary', chance: 0.01, color: '#f59e0b', glowColor: '#f59e0b40' },
};

export const CASE_LOOT_TABLES: Record<CaseRarity, CaseLootTableEntry[]> = {
  common: [
    { chance: 90, type: 'cash', label: 'Гроші ($30 × рівень)', labelEn: 'Cash ($30 × level)' },
    { chance: 10, type: 'gems', label: 'Алмази (1-3 💎)', labelEn: 'Gems (1-3 💎)' },
  ],
  rare: [
    { chance: 74, type: 'cash', label: 'Гроші ($80 × рівень)', labelEn: 'Cash ($80 × level)' },
    { chance: 25, type: 'gems', label: 'Алмази (3-6 💎)', labelEn: 'Gems (3-6 💎)' },
    { chance: 1, type: 'itembag', label: 'Сумка з предметом', labelEn: 'Item Bag' },
  ],
  epic: [
    { chance: 40, type: 'cash', label: 'Гроші ($190 × рівень)', labelEn: 'Cash ($190 × level)' },
    { chance: 50, type: 'gems', label: 'Алмази (8-18 💎)', labelEn: 'Gems (8-18 💎)' },
    { chance: 10, type: 'itembag', label: 'Сумка з предметом', labelEn: 'Item Bag' },
  ],
  legendary: [
    { chance: 60, type: 'gems', label: 'Алмази (25-40 💎)', labelEn: 'Gems (25-40 💎)' },
    { chance: 40, type: 'itembag', label: 'Сумка з предметом', labelEn: 'Item Bag' },
  ],
};

export function getCaseChanceValue(currentLevel: number): number {
  return BASE_CASE_DROP_CHANCE + currentLevel * CASE_CHANCE_PER_LEVEL;
}

export function rollCaseDrop(caseChanceLevel: number): boolean {
  const base = getCaseChanceValue(caseChanceLevel);
  const dampened = base / (1 + base * 0.5);
  return Math.random() < dampened;
}

export function rollCaseRarity(): CaseRarity {
  const roll = Math.random();
  let cumulative = 0;
  for (const key of ['common', 'rare', 'epic', 'legendary'] as CaseRarity[]) {
    cumulative += CASE_RARITIES[key].chance;
    if (roll < cumulative) return key;
  }
  return 'common';
}

export function openCaseLoot(rarity: CaseRarity, playerLevel: number): CaseLootResult {
  const roll = Math.random();
  const levelMultiplier = 1 + 0.1 * (playerLevel - 1);

  const cashResult = (base: number): CaseLootResult => {
    const cash = Math.round(base * levelMultiplier * 100) / 100;
    return { type: 'cash', amount: cash, label: `Гроші ${cash.toFixed(2)}`, labelEn: `Cash ${cash.toFixed(2)}` };
  };
  const gemResult = (min: number, max: number): CaseLootResult => {
    const gems = min + Math.floor(Math.random() * (max - min + 1));
    return { type: 'gems', amount: gems, label: `${gems} 💎`, labelEn: `${gems} 💎` };
  };
  const itemBagResult = (): CaseLootResult => ({
    type: 'itembag', amount: 1, label: 'Сумка з предметом', labelEn: 'Item Bag',
  });

  switch (rarity) {
    case 'common':
      if (roll < 0.90) return cashResult(30);
      return gemResult(1, 3);
    case 'rare':
      if (roll < 0.74) return cashResult(80);
      if (roll < 0.99) return gemResult(3, 6);
      return itemBagResult();
    case 'epic':
      if (roll < 0.40) return cashResult(190);
      if (roll < 0.90) return gemResult(8, 18);
      return itemBagResult();
    case 'legendary':
      if (roll < 0.60) return gemResult(25, 40);
      return itemBagResult();
    default:
      return cashResult(30);
  }
}
