export interface ExchangeItemConfig {
  id: string;
  nameUk: string;
  priceTokens: number;
  discountFirstPurchase?: boolean;
  type: 'chest' | 'material' | 'booster' | 'gem';
  setRestriction?: 'medical' | 'summer' | 'juggernaut';
  bonusValue?: number;
}

export const EXCHANGE_SHOP_ITEMS: ExchangeItemConfig[] = [
  {
    id: 'equipment_chest',
    nameUk: 'Ящик з екіпіровкою',
    priceTokens: 60000,
    discountFirstPurchase: true,
    type: 'chest',
  },
  {
    id: 'black_shards',
    nameUk: 'Чорні осколки',
    priceTokens: 10000,
    type: 'material',
  },
  {
    id: 'mirror_plate',
    nameUk: 'Дзеркальна пластина (Літній сет)',
    priceTokens: 400000,
    type: 'booster',
    setRestriction: 'summer',
  },
  {
    id: 'medical_bandage',
    nameUk: 'Лікарський бандаж (Мед сет)',
    priceTokens: 300000,
    type: 'booster',
    setRestriction: 'medical',
  },
  {
    id: 'armor_plate',
    nameUk: 'Бронепластина (Бронесет)',
    priceTokens: 450000,
    type: 'booster',
    setRestriction: 'juggernaut',
  },
  {
    id: 'diamond',
    nameUk: 'Алмаз',
    priceTokens: 16000,
    type: 'gem',
  },
];

// Конфіг бустів (покращень бронювання за спеціальне спорядження)
export const SET_BOOSTERS_CONFIG = {
  summer: {
    requiredItem: 'mirror_plate',
    piecesRequired: 5,
    reflectionBonusPerPiece: 4.5,
  },
  medical: {
    requiredItem: 'medical_bandage',
    piecesRequired: 4,
    regenBonusPerPiece: 2,
    maxHpBonusPerPiece: 30,
  },
  juggernaut: {
    requiredItem: 'armor_plate',
    piecesRequired: 4,
    defenseBonusPerPiece: 2,
    maxHpBonusPerPiece: 50,
  },
};

// Конфіг кейса "Аптечка" та медикаментів
export const MEDKIT_CASE_CONFIG = {
  dropChances: {
    plaster: 0.60, // 3-5 шт
    nurofen: 0.30, // 2-3 шт
    adrenaline: 0.10, // 1-2 шт
  },
};

export const MEDICAMENTS_CONFIG = {
  plaster: {
    healPercent: 30,
    cooldownSec: 20,
  },
  nurofen: {
    healPercent: 80,
    regenBonus: 5,
    regenDurationSec: 35,
    cooldownSec: 60,
  },
  adrenaline: {
    defenseBoostPercent: 40,
    maxDefenseCap: 95,
    healPercent: 60,
    durationSec: 45,
    cooldownSec: 90,
  },
};