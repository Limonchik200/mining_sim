import {
  ENERGY_MAX,
  ENERGY_REGEN_SECONDS,
  BASE_AUTO_DIG_INTERVAL_MS,
  BASE_AUTO_BASKET_MAX,
} from './minesConfig';

export const UPGRADE_CONFIG = {
  activeLeaseMult: {
    baseCost: 24,
    maxLevel: 50,
    stepPerLevel: 0.03,
  },
  autoLeaseMult: {
    baseCost: 42,
    maxLevel: 50,
    stepPerLevel: 0.03,
  },
  autoCooldown: {
    baseCost: 11,
    costGrowth: 0.25,
    reductionPerLevel: 0.2,
    minCooldown: 4.0,
    maxLevel: 30,
  },
  basketCap: {
    baseCost: 25,
    costGrowth: 2,
    maxLevel: 30,
  },
  caseChance: {
    baseCost: 22,
    costGrowth: 0.40,
    maxLevel: 30,
  },
  energyMax: {
    baseCost: 30,
    costGrowth: 0.20,
    maxLevel: 30,
    bonusPerLevel: 50,
  },
  energyRegen: {
    baseCost: 25,
    costGrowth: 0.25,
    maxLevel: 20,
    reductionPerLevel: 1,
    minRegenSeconds: 10,
  },
  energyRegenAmount: {
    baseCost: 20,
    costGrowth: 0.20,
    maxLevel: 20,
    bonusPerLevel: 0.5,
  },
} as const;

function tieredCostGrowth(level: number): number {
  if (level < 10) return 0.05;
  if (level < 20) return 0.075;
  if (level < 30) return 0.10;
  if (level < 40) return 0.125;
  return 0.15;
}

export function getLeaseMultCost(upgrade: 'activeLeaseMult' | 'autoLeaseMult', currentLevel: number): number {
  const cfg = UPGRADE_CONFIG[upgrade];
  let cost = cfg.baseCost;
  for (let i = 0; i < currentLevel; i++) {
    cost *= 1 + tieredCostGrowth(i);
  }
  return Math.round(cost * 100) / 100;
}

export function getLeaseMultValue(upgrade: 'activeLeaseMult' | 'autoLeaseMult', currentLevel: number): number {
  const cfg = UPGRADE_CONFIG[upgrade];
  return Math.round((1 + currentLevel * cfg.stepPerLevel) * 1000) / 1000;
}

export function getAutoCooldownCost(currentLevel: number): number {
  const cfg = UPGRADE_CONFIG.autoCooldown;
  return Math.round(cfg.baseCost * Math.pow(1 + cfg.costGrowth, currentLevel) * 100) / 100;
}

export function getAutoCooldownMs(currentLevel: number): number {
  const cfg = UPGRADE_CONFIG.autoCooldown;
  const reduction = currentLevel * cfg.reductionPerLevel;
  return Math.max(cfg.minCooldown, BASE_AUTO_DIG_INTERVAL_MS / 1000 - reduction) * 1000;
}

export function getBasketCapCost(currentLevel: number): number {
  const cfg = UPGRADE_CONFIG.basketCap;
  return Math.round(cfg.baseCost * Math.pow(cfg.costGrowth, currentLevel) * 100) / 100;
}

export function getBasketCapValue(currentLevel: number): number {
  return BASE_AUTO_BASKET_MAX * Math.pow(2, currentLevel);
}

export function getCaseChanceCost(currentLevel: number): number {
  const cfg = UPGRADE_CONFIG.caseChance;
  return Math.round(cfg.baseCost * Math.pow(1 + cfg.costGrowth, currentLevel) * 100) / 100;
}

export function getEnergyMaxCost(currentLevel: number): number {
  const cfg = UPGRADE_CONFIG.energyMax;
  return Math.round(cfg.baseCost * Math.pow(1 + cfg.costGrowth, currentLevel) * 100) / 100;
}

export function getEnergyMaxValue(currentLevel: number): number {
  return ENERGY_MAX + currentLevel * UPGRADE_CONFIG.energyMax.bonusPerLevel;
}

export function getEnergyRegenCost(currentLevel: number): number {
  const cfg = UPGRADE_CONFIG.energyRegen;
  return Math.round(cfg.baseCost * Math.pow(1 + cfg.costGrowth, currentLevel) * 100) / 100;
}

export function getEnergyRegenValue(currentLevel: number): number {
  const cfg = UPGRADE_CONFIG.energyRegen;
  return Math.max(cfg.minRegenSeconds, ENERGY_REGEN_SECONDS - currentLevel * cfg.reductionPerLevel);
}

export function getEnergyRegenAmountCost(currentLevel: number): number {
  const cfg = UPGRADE_CONFIG.energyRegenAmount;
  return Math.round(cfg.baseCost * Math.pow(1 + cfg.costGrowth, currentLevel) * 100) / 100;
}

export function getEnergyRegenAmountValue(currentLevel: number): number {
  return 1 + currentLevel * UPGRADE_CONFIG.energyRegenAmount.bonusPerLevel;
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
