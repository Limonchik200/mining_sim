import {
  ENERGY_MAX,
  ENERGY_REGEN_SECONDS,
  BASE_AUTO_DIG_INTERVAL_MS,
  BASE_AUTO_BASKET_MAX,
  MINES,
} from './minesConfig';
import { progressionCost } from '@/config';

export const UPGRADE_CONFIG = {
  activeLeaseMult: { baseCost: 40, maxLevel: 100, stepPerLevel: 0.01 },
  autoLeaseMult: { baseCost: 50, maxLevel: 100, stepPerLevel: 0.01 },
  autoCooldown: { baseCost: 15, reductionPerLevel: 0.04, minCooldown: 1.0, maxLevel: 150 },
  basketCap: { baseCost: 35, maxLevel: 120 },
  caseChance: { baseCost: 18, maxLevel: 250 },
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
  if (!Number.isFinite(currentLevel) || currentLevel <= 0) return Math.floor(BASE_AUTO_BASKET_MAX);
  if (currentLevel <= 15) {
    return Math.floor(50 + (currentLevel - 1) * 30);
  }
  return Math.floor(470 * Math.pow(1.06, currentLevel - 15));
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
  if (!Number.isFinite(currentLevel) || currentLevel <= 0) return Math.floor(BASE_BACKPACK_WEIGHT_LIMIT);
  if (currentLevel <= 15) {
    return Math.floor(100 + (currentLevel - 1) * 50);
  }
  return Math.floor(800 * Math.pow(1.06, currentLevel - 15));
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

export type EquipmentType =
  | 'helmet'
  | 'flashlight'
  | 'gloves'
  | 'respirator'
  | 'lighting'
  | 'ventilation';

export interface EquipmentConfig {
  purchasePrice: number;
  upgradeBasePrice: number;
  maxLevel: number;
}

export const EQUIPMENT_CONFIG: Record<EquipmentType, EquipmentConfig> = {
  helmet:     { purchasePrice: 50,   upgradeBasePrice: 30,   maxLevel: 10 },
  flashlight: { purchasePrice: 150,  upgradeBasePrice: 90,   maxLevel: 10 },
  gloves:     { purchasePrice: 1400, upgradeBasePrice: 800,  maxLevel: 5 },
  respirator: { purchasePrice: 2500, upgradeBasePrice: 1500, maxLevel: 5 },
  lighting:   { purchasePrice: 1200, upgradeBasePrice: 800,  maxLevel: 10 },
  ventilation:{ purchasePrice: 0,    upgradeBasePrice: 150,  maxLevel: 10 },
};

export const RESPIRATOR_FILTER_PRICE = 5000;
export const CART_STATION_PRICE = 2000;
export const RAIL_UNIT_PRICE = 350;
export const WOODEN_BRACING_UNIT_PRICE = 600;

export function equipmentUpgradeCost(type: EquipmentType, currentLevel: number): number {
  const cfg = EQUIPMENT_CONFIG[type];
  const L = Math.max(0, currentLevel);
  return Math.round(cfg.upgradeBasePrice * (1 + L * 0.8 + Math.pow(L, 1.65)) * 100) / 100;
}

export function equipmentMaxLevelForMine(type: EquipmentType, highestUnlockedMine: number): number {
  let best = 0;
  for (const mine of MINES) {
    if (mine.id > highestUnlockedMine) break;
    const req = mine.unlockRequirements;
    if (!req) continue;
    const val =
      type === 'helmet' ? req.helmetLevel :
      type === 'flashlight' ? req.flashlightLevel :
      type === 'gloves' ? req.glovesLevel :
      type === 'respirator' ? req.respiratorLevel :
      type === 'lighting' ? req.lightingLevel :
      req.ventilationLevel;
    if (val !== undefined && val > best) best = val;
  }
  return best;
}

export function equipmentMaxLevelIncludingNextMine(type: EquipmentType, highestUnlockedMine: number): number {
  return equipmentMaxLevelForMine(type, highestUnlockedMine + 1);
}

export function mineRequiredForNextEquipmentLevel(type: EquipmentType, highestUnlockedMine: number): { mineId: number; neededLevel: number } | null {
  const currentCap = equipmentMaxLevelIncludingNextMine(type, highestUnlockedMine);
  for (const mine of MINES) {
    if (mine.id <= highestUnlockedMine + 1) continue;
    const req = mine.unlockRequirements;
    if (!req) continue;
    const val =
      type === 'helmet' ? req.helmetLevel :
      type === 'flashlight' ? req.flashlightLevel :
      type === 'gloves' ? req.glovesLevel :
      type === 'respirator' ? req.respiratorLevel :
      type === 'lighting' ? req.lightingLevel :
      req.ventilationLevel;
    if (val !== undefined && val > currentCap) {
      return { mineId: mine.id, neededLevel: val };
    }
  }
  return null;
}
