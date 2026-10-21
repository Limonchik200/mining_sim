import {
  ENERGY_MAX,
  ENERGY_REGEN_SECONDS,
  BASE_AUTO_DIG_INTERVAL_MS,
  BASE_AUTO_BASKET_MAX,
} from './minesConfig';
import { progressionCost } from '@/config';

export const UPGRADE_CONFIG = {
  activeLeaseMult: { baseCost: 40, maxLevel: 100, stepPerLevel: 0.01 },
  autoLeaseMult: { baseCost: 50, maxLevel: 100, stepPerLevel: 0.01 },
  autoCooldown: { baseCost: 15, reductionPerLevel: 0.04, minCooldown: 4.0, maxLevel: 150 },
  basketCap: { baseCost: 25, maxLevel: 30 },
  caseChance: { baseCost: 18, maxLevel: 40 },
  energyMax: { baseCost: 30, maxLevel: 30, bonusPerLevel: 50 },
  energyRegen: { baseCost: 25, maxLevel: 30, reductionPerLevel: 1, minRegenSeconds: 10 },
  energyRegenAmount: { baseCost: 50, maxLevel: 20, bonusPerLevel: 0.5 },
  backpack: { baseCost: 50, maxLevel: 100, bonusPerLevel: 0.60 },
} as const;

export function getLeaseMultCost(upgrade: 'activeLeaseMult' | 'autoLeaseMult', currentLevel: number): number {
  return progressionCost(UPGRADE_CONFIG[upgrade].baseCost, currentLevel + 1);
}

export function getLeaseMultValue(upgrade: 'activeLeaseMult' | 'autoLeaseMult', currentLevel: number): number {
  const cfg = UPGRADE_CONFIG[upgrade];
  return Math.round((1 + currentLevel * cfg.stepPerLevel) * 1000) / 1000;
}

export function getAutoCooldownCost(currentLevel: number): number {
  return progressionCost(UPGRADE_CONFIG.autoCooldown.baseCost, currentLevel + 1);
}

export function getAutoCooldownMs(currentLevel: number): number {
  const cfg = UPGRADE_CONFIG.autoCooldown;
  const reduction = currentLevel * cfg.reductionPerLevel;
  return Math.max(cfg.minCooldown, BASE_AUTO_DIG_INTERVAL_MS / 1000 - reduction) * 1000;
}

export function getBasketCapCost(currentLevel: number): number {
  return progressionCost(UPGRADE_CONFIG.basketCap.baseCost, currentLevel + 1);
}

export function getBasketCapValue(currentLevel: number): number {
  return BASE_AUTO_BASKET_MAX * Math.pow(2, currentLevel);
}

export function getCaseChanceCost(currentLevel: number): number {
  return progressionCost(UPGRADE_CONFIG.caseChance.baseCost, currentLevel + 1);
}

export function getEnergyMaxCost(currentLevel: number): number {
  return progressionCost(UPGRADE_CONFIG.energyMax.baseCost, currentLevel + 1);
}

export function getEnergyMaxValue(currentLevel: number): number {
  return ENERGY_MAX + currentLevel * UPGRADE_CONFIG.energyMax.bonusPerLevel;
}

export function getEnergyRegenCost(currentLevel: number): number {
  return progressionCost(UPGRADE_CONFIG.energyRegen.baseCost, currentLevel + 1);
}

export function getEnergyRegenValue(currentLevel: number): number {
  const cfg = UPGRADE_CONFIG.energyRegen;
  return Math.max(cfg.minRegenSeconds, ENERGY_REGEN_SECONDS - currentLevel * cfg.reductionPerLevel);
}

export function getEnergyRegenAmountCost(currentLevel: number): number {
  return progressionCost(UPGRADE_CONFIG.energyRegenAmount.baseCost, currentLevel + 1);
}

export function getEnergyRegenAmountValue(currentLevel: number): number {
  return 1 + currentLevel * UPGRADE_CONFIG.energyRegenAmount.bonusPerLevel;
}

export const BASE_BACKPACK_WEIGHT_LIMIT = 100;

export function getBackpackCost(currentLevel: number): number {
  return progressionCost(UPGRADE_CONFIG.backpack.baseCost, currentLevel + 1);
}

export function getBackpackWeightLimit(currentLevel: number): number {
  const cfg = UPGRADE_CONFIG.backpack;
  return Math.round(BASE_BACKPACK_WEIGHT_LIMIT * Math.pow(1 + cfg.bonusPerLevel, currentLevel) * 100) / 100;
}

export const ENERGY_UPGRADE_DIAMOND_THRESHOLD = 5;

export function getEnergyUpgradeDiamondCost(currentLevel: number): number {
  return currentLevel + 1;
}

export function isEnergyUpgradeDiamond(level: number): boolean {
  return level >= ENERGY_UPGRADE_DIAMOND_THRESHOLD;
}

export function xpForLevel(level: number): number {
  return 50 * (level * level) + 50 * level - 50;
}
