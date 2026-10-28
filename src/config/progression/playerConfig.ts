export interface PlayerProgressionConfig {
  baseHp: number;
  maxHpLevel: number;
  hpPerLevel: number;
  baseRegen: number;
  maxRegenLevel: number;
  regenPerLevel: number; // хп за тік (тік = 3с)
  baseMissChance: number;
  baseDodgeChance: number;
  maxDodgeLevel: number;
  dodgePerLevel: number;
  baseDamageMin: number;
  baseDamageMax: number;
  deathPenaltyMinutes: number;
  deathTokenLossPercent: number;
  deathMedalsLoss: number;
  minAttackCooldownSec: number;
  combatScreenUnlockLevel: number;
  expPerDamage: number;
}

export const PLAYER_CONFIG: PlayerProgressionConfig = {
  baseHp: 50,
  maxHpLevel: 30,
  hpPerLevel: 50,
  baseRegen: 0.6,
  maxRegenLevel: 30,
  regenPerLevel: 0.6,
  baseMissChance: 10,
  baseDodgeChance: 0.5,
  maxDodgeLevel: 30,
  dodgePerLevel: 0.45,
  baseDamageMin: 1,
  baseDamageMax: 11,
  deathPenaltyMinutes: 2,
  deathTokenLossPercent: 9,
  deathMedalsLoss: 10,
  minAttackCooldownSec: 0.8,
  combatScreenUnlockLevel: 10,
  expPerDamage: 1.5,
};

// Вартість прокачки характеристик
export function getHpUpgradeCost(level: number): Record<string, number> {
  const cost: Record<string, number> = {};
  if (level <= 5) {
    cost.bones = 10 + (level - 1) * 10;
  } else if (level <= 10) {
    cost.bones = 50 + (level - 6) * 15;
  } else if (level <= 15) {
    cost.bones = 125 + (level - 11) * 20;
  } else if (level <= 20) {
    cost.bones = 225 + (level - 16) * 25;
    cost.basalt_slab = 1 * (level - 15);
  } else if (level <= 25) {
    cost.bones = 350 + (level - 21) * 30;
    cost.basalt_slab = 5 + 2 * (level - 21);
    cost.magma_stone = 1 * (level - 20);
  } else if (level <= 30) {
    cost.bones = 500 + (level - 26) * 40;
    cost.basalt_slab = 15 + 3 * (level - 26);
    cost.magma_stone = 6 + 2 * (level - 26);
    cost.solar_essence = 1 * (level - 25);
  }
  return cost;
}

export function getRegenUpgradeCost(level: number): Record<string, number> {
  const cost: Record<string, number> = {};
  if (level <= 5) {
    cost.fire_rod = 3 + (level - 1) * 2;
  } else if (level <= 10) {
    cost.fire_rod = 11 + (level - 6) * 3;
  } else if (level <= 15) {
    cost.fire_rod = 26 + (level - 11) * 4;
  } else if (level <= 20) {
    cost.fire_rod = 46 + (level - 16) * 5;
    cost.basalt_slab = 1 * (level - 15);
  } else if (level <= 25) {
    cost.fire_rod = 71 + (level - 21) * 6;
    cost.basalt_slab = 5 + 2 * (level - 21);
    cost.magma_stone = 1 * (level - 20);
  } else if (level <= 30) {
    cost.fire_rod = 101 + (level - 26) * 8;
    cost.basalt_slab = 15 + 3 * (level - 26);
    cost.magma_stone = 6 + 2 * (level - 26);
    cost.solar_essence = 1 * (level - 25);
  }
  return cost;
}

export function getDodgeUpgradeCost(level: number): Record<string, number> {
  return {
    black_shards: 20 + (level - 1) * 15,
  };
}