// ==========================================
// TYPES & INTERFACES
// ==========================================

export type MaterialId = 
  | 'rainbow_stone'
  | 'ruby_powder'
  | 'essence'
  | 'magma_stone'
  | 'solar_essence'
  | 'scroll';

export interface MaterialInfo {
  id: MaterialId;
  name: string;
  description: string;
  icon: string;
}

export interface MaterialRewardOption {
  materialId: MaterialId;
  chance: number; // percentage, e.g. 60 = 60%
  minAmount: number;
  maxAmount: number;
}

export interface CaseRewardOption {
  caseType: 'common' | 'rare' | 'epic' | 'legendary';
  chance: number; // percentage
  minAmount: number;
  maxAmount: number;
}

export interface ExpeditionTierConfig {
  tier: number;
  requiredPlayerLevel: number;
  minDurationMinutes: number;
  maxDurationMinutes: number;
  minCash: number;
  maxCash: number;
  diamondDrop?: {
    chance: number; // percentage
    minAmount: number;
    maxAmount: number;
  };
  guaranteedDiamonds?: {
    minAmount: number;
    maxAmount: number;
  };
  materialSlots: MaterialRewardOption[][]; // array of slots, each slot has material options
  caseRewards: CaseRewardOption[];
}

export interface GeneratedExpedition {
  id: string;
  tier: number;
  durationSeconds: number;
  cashReward: number;
  diamondReward: number;
  materialsReward: { materialId: MaterialId; amount: number; name: string }[];
  caseChances: CaseRewardOption[];
  startTime?: number;
  completedAt?: number;
}

// ==========================================
// 1. MATERIALS CONFIGURATION
// ==========================================

export const MATERIALS_CONFIG: Record<MaterialId, MaterialInfo> = {
  rainbow_stone: {
    id: 'rainbow_stone',
    name: 'Райдужний камінь',
    description: 'Потрібен для прокачки предметів на вищі рівні',
    icon: '🌈'
  },
  ruby_powder: {
    id: 'ruby_powder',
    name: 'Рубіновий порох',
    description: 'Необхідний для прокачки предметів',
    icon: '✨'
  },
  essence: {
    id: 'essence',
    name: 'Есенція',
    description: 'Необхідна для прокачки предметів',
    icon: '🧪'
  },
  magma_stone: {
    id: 'magma_stone',
    name: 'Магмовий камінь',
    description: 'Необхідний для прокачки предметів',
    icon: '🔥'
  },
  solar_essence: {
    id: 'solar_essence',
    name: 'Сонячна есенція',
    description: 'Необхідна для прокачки сонячної сили та предметів',
    icon: '☀️'
  },
  scroll: {
    id: 'scroll',
    name: 'Сувої',
    description: 'Базовий матеріал для покращень',
    icon: '📜'
  }
};

// ==========================================
// 2. EXPEDITION TIERS CONFIGURATION
// ==========================================

export const EXPEDITION_TIERS: Record<number, ExpeditionTierConfig> = {
  // --- TIER 1 ---
  1: {
    tier: 1,
    requiredPlayerLevel: 3,
    minDurationMinutes: 10,
    maxDurationMinutes: 15,
    minCash: 20,
    maxCash: 35,
    materialSlots: [
      [
        { materialId: 'scroll', chance: 100, minAmount: 1, maxAmount: 5 }
      ]
    ],
    caseRewards: [
      { caseType: 'common', chance: 20, minAmount: 1, maxAmount: 1 }
    ]
  },

  // --- TIER 2 ---
  2: {
    tier: 2,
    requiredPlayerLevel: 5,
    minDurationMinutes: 25,
    maxDurationMinutes: 33,
    minCash: 50,
    maxCash: 70,
    materialSlots: [
      [
        { materialId: 'scroll', chance: 60, minAmount: 3, maxAmount: 7 },
        { materialId: 'rainbow_stone', chance: 40, minAmount: 1, maxAmount: 2 }
      ]
    ],
    caseRewards: [
      { caseType: 'common', chance: 20, minAmount: 1, maxAmount: 1 },
      { caseType: 'rare', chance: 5, minAmount: 1, maxAmount: 1 }
    ]
  },

  // --- TIER 3 ---
  3: {
    tier: 3,
    requiredPlayerLevel: 9,
    minDurationMinutes: 70, // 1h 10m
    maxDurationMinutes: 90, // 1h 30m
    minCash: 140,
    maxCash: 175,
    materialSlots: [
      [
        { materialId: 'scroll', chance: 40, minAmount: 5, maxAmount: 9 },
        { materialId: 'rainbow_stone', chance: 40, minAmount: 1, maxAmount: 2 },
        { materialId: 'ruby_powder', chance: 20, minAmount: 3, maxAmount: 5 }
      ]
    ],
    caseRewards: [
      { caseType: 'common', chance: 25, minAmount: 1, maxAmount: 1 },
      { caseType: 'rare', chance: 10, minAmount: 1, maxAmount: 1 }
    ]
  },

  // --- TIER 4 ---
  4: {
    tier: 4,
    requiredPlayerLevel: 15,
    minDurationMinutes: 180, // 3h
    maxDurationMinutes: 240, // 4h
    minCash: 350,
    maxCash: 420,
    diamondDrop: {
      chance: 40,
      minAmount: 1,
      maxAmount: 3
    },
    materialSlots: [
      [
        { materialId: 'scroll', chance: 30, minAmount: 8, maxAmount: 12 },
        { materialId: 'rainbow_stone', chance: 30, minAmount: 1, maxAmount: 3 },
        { materialId: 'ruby_powder', chance: 25, minAmount: 5, maxAmount: 8 },
        { materialId: 'essence', chance: 15, minAmount: 2, maxAmount: 4 }
      ]
    ],
    caseRewards: [
      { caseType: 'common', chance: 35, minAmount: 2, maxAmount: 4 },
      { caseType: 'rare', chance: 15, minAmount: 1, maxAmount: 2 },
      { caseType: 'epic', chance: 5, minAmount: 1, maxAmount: 1 }
    ]
  },

  // --- TIER 5 ---
  5: {
    tier: 5,
    requiredPlayerLevel: 27,
    minDurationMinutes: 630, // 10h 30m
    maxDurationMinutes: 765, // 12h 45m
    minCash: 0, // Cash not primary, relies on diamonds + high materials
    maxCash: 0,
    guaranteedDiamonds: {
      minAmount: 3,
      maxAmount: 5
    },
    materialSlots: [
      // Slot 1: Scrolls vs Rainbow Stone (50 / 50)
      [
        { materialId: 'scroll', chance: 50, minAmount: 12, maxAmount: 18 },
        { materialId: 'rainbow_stone', chance: 50, minAmount: 3, maxAmount: 5 }
      ],
      // Slot 2: Ruby Powder vs Essence vs Magma Stone (55 / 30 / 15)
      [
        { materialId: 'ruby_powder', chance: 55, minAmount: 8, maxAmount: 12 },
        { materialId: 'essence', chance: 30, minAmount: 5, maxAmount: 8 },
        { materialId: 'magma_stone', chance: 15, minAmount: 1, maxAmount: 3 }
      ]
    ],
    caseRewards: [
      { caseType: 'common', chance: 100, minAmount: 3, maxAmount: 5 },
      { caseType: 'rare', chance: 45, minAmount: 2, maxAmount: 4 },
      { caseType: 'epic', chance: 20, minAmount: 1, maxAmount: 3 },
      { caseType: 'legendary', chance: 10, minAmount: 1, maxAmount: 2 }
    ]
  }
};

// ==========================================
// 3. GENERATION UTILITY FUNCTIONS
// ==========================================

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a single Expedition instance based on Tier Config
 */
export function generateExpedition(tierNumber: number): GeneratedExpedition {
  const config = EXPEDITION_TIERS[tierNumber];
  if (!config) throw new Error(`Invalid Expedition Tier: ${tierNumber}`);

  // 1. Generate precise duration in seconds
  const minSec = config.minDurationMinutes * 60;
  const maxSec = config.maxDurationMinutes * 60;
  const durationSeconds = getRandomInt(minSec, maxSec);

  // 2. Generate Cash
  const cashReward = config.maxCash > 0 ? getRandomInt(config.minCash, config.maxCash) : 0;

  // 3. Generate Diamonds
  let diamondReward = 0;
  if (config.guaranteedDiamonds) {
    diamondReward = getRandomInt(config.guaranteedDiamonds.minAmount, config.guaranteedDiamonds.maxAmount);
  } else if (config.diamondDrop) {
    if (Math.random() * 100 <= config.diamondDrop.chance) {
      diamondReward = getRandomInt(config.diamondDrop.minAmount, config.diamondDrop.maxAmount);
    }
  }

  // 4. Generate Materials for each slot
  const materialsReward: { materialId: MaterialId; amount: number; name: string }[] = [];

  config.materialSlots.forEach((slot) => {
    const roll = Math.random() * 100;
    let accumulated = 0;

    for (const option of slot) {
      accumulated += option.chance;
      if (roll <= accumulated) {
        const amount = getRandomInt(option.minAmount, option.maxAmount);
        materialsReward.push({
          materialId: option.materialId,
          amount,
          name: MATERIALS_CONFIG[option.materialId].name
        });
        break;
      }
    }
  });

  return {
    id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tier: tierNumber,
    durationSeconds,
    cashReward,
    diamondReward,
    materialsReward,
    caseChances: config.caseRewards
  };
}