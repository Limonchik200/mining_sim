import type { Lang } from '@/types';

export const SPECIAL_OFFERS_REFRESH_MS = 6 * 60 * 60 * 1000;
export const SPECIAL_OFFERS_COUNT = 3;

export type SpecialOfferRewardType =
  | 'item_bag'
  | 'scroll'
  | 'ruby_dust'
  | 'essence'
  | 'oxygen_tank_small'
  | 'oxygen_tank_medium'
  | 'battery_weak'
  | 'case_rare'
  | 'case_epic';

export interface SpecialOfferReward {
  type: SpecialOfferRewardType;
  amount: number;
}

export interface SpecialOfferBundle {
  id: string;
  nameUk: string;
  nameRu: string;
  nameEn: string;
  basePriceGems: number;
  rewards: SpecialOfferReward[];
  icon: string;
  color: string;
}

export const SPECIAL_OFFER_BUNDLES: SpecialOfferBundle[] = [
  {
    id: 'new_items_pack',
    nameUk: 'Набір нових предметів',
    nameRu: 'Набор новых предметов',
    nameEn: 'New Items Pack',
    basePriceGems: 120,
    rewards: [
      { type: 'item_bag', amount: 1 },
      { type: 'scroll', amount: 4 },
    ],
    icon: 'ShoppingBag',
    color: '#f59e0b',
  },
  {
    id: 'materials_pack',
    nameUk: 'Набір матеріалів',
    nameRu: 'Набор материалов',
    nameEn: 'Materials Pack',
    basePriceGems: 300,
    rewards: [
      { type: 'scroll', amount: 35 },
      { type: 'ruby_dust', amount: 20 },
      { type: 'essence', amount: 15 },
    ],
    icon: 'Layers',
    color: '#a855f7',
  },
  {
    id: 'miners_combo',
    nameUk: "Шахтарське комбо",
    nameRu: 'Шахтерское комбо',
    nameEn: 'Miner Combo',
    basePriceGems: 75,
    rewards: [
      { type: 'oxygen_tank_small', amount: 4 },
      { type: 'oxygen_tank_medium', amount: 1 },
      { type: 'battery_weak', amount: 2 },
    ],
    icon: 'HardHat',
    color: '#3b82f6',
  },
  {
    id: 'small_cases_pack',
    nameUk: 'Малий набір кейсів',
    nameRu: 'Малый набор кейсов',
    nameEn: 'Small Cases Pack',
    basePriceGems: 50,
    rewards: [
      { type: 'case_rare', amount: 3 },
      { type: 'case_epic', amount: 1 },
    ],
    icon: 'Gift',
    color: '#ec4899',
  },
];

interface DiscountTier {
  pct: number;
  weight: number;
}

const DISCOUNT_TIERS: DiscountTier[] = [
  { pct: 0, weight: 49.9 },
  { pct: 10, weight: 25 },
  { pct: 15, weight: 15 },
  { pct: 20, weight: 10 },
  { pct: 95, weight: 0.1 },
];

function rollDiscount(): number {
  const total = DISCOUNT_TIERS.reduce((s, d) => s + d.weight, 0);
  let r = Math.random() * total;
  for (const d of DISCOUNT_TIERS) {
    r -= d.weight;
    if (r <= 0) return d.pct;
  }
  return 0;
}

export interface SpecialOfferInstance {
  bundleId: string;
  discountPct: number;
  purchased: boolean;
}

export interface SpecialOffersState {
  offers: SpecialOfferInstance[];
  refreshedAt: number;
  nextRefreshAt: number;
}

export function generateSpecialOffers(now: number): SpecialOffersState {
  const pool = [...SPECIAL_OFFER_BUNDLES];
  const selected: SpecialOfferBundle[] = [];

  for (let i = 0; i < SPECIAL_OFFERS_COUNT && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    selected.push(pool.splice(idx, 1)[0]);
  }

  return {
    offers: selected.map((bundle) => ({
      bundleId: bundle.id,
      discountPct: rollDiscount(),
      purchased: false,
    })),
    refreshedAt: now,
    nextRefreshAt: now + SPECIAL_OFFERS_REFRESH_MS,
  };
}

export function getOfferPriceGems(bundle: SpecialOfferBundle, discountPct: number): number {
  return Math.round(bundle.basePriceGems * (1 - discountPct / 100));
}

export function getBundleName(bundle: SpecialOfferBundle, lang: Lang): string {
  if (lang === 'ru') return bundle.nameRu;
  if (lang === 'uk') return bundle.nameUk;
  return bundle.nameEn;
}

export function getRewardDisplayName(type: SpecialOfferRewardType, lang: Lang): string {
  const names: Record<SpecialOfferRewardType, { ru: string; uk: string; en: string }> = {
    item_bag: { ru: 'Мешок предметов', uk: 'Мішок предметів', en: 'Item Bag' },
    scroll: { ru: 'Свиток', uk: 'Сувій', en: 'Scroll' },
    ruby_dust: { ru: 'Рубиновая пыль', uk: 'Рубіновий пил', en: 'Ruby Dust' },
    essence: { ru: 'Эссенция', uk: 'Есенція', en: 'Essence' },
    oxygen_tank_small: { ru: 'Малый балон', uk: 'Малий балон', en: 'Small Tank' },
    oxygen_tank_medium: { ru: 'Обычный балон', uk: 'Звичайний балон', en: 'Regular Tank' },
    battery_weak: { ru: 'Слабый аккумулятор', uk: 'Слабкий акумулятор', en: 'Weak Accumulator' },
    case_rare: { ru: 'Редкий кейс', uk: 'Рідкісний кейс', en: 'Rare Case' },
    case_epic: { ru: 'Эпический кейс', uk: 'Епічний кейс', en: 'Epic Case' },
  };
  const n = names[type];
  return lang === 'ru' ? n.ru : lang === 'uk' ? n.uk : n.en;
}
