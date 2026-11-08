import type { SpecialOfferBundle, SpecialOfferRewardType } from '@/config/specialOffersConfig';

export const HYPER_BUNDLE_REFRESH_MS = 2 * 24 * 60 * 60 * 1000;

export const HYPER_BUNDLES: SpecialOfferBundle[] = [
  {
    id: 'hyper_giant_items',
    nameUk: 'Гігантський набір предметів',
    nameRu: 'Гигантский набор предметов',
    nameEn: 'Giant Items Set',
    basePriceGems: 1000,
    rewards: [{ type: 'item_case_suitcase', amount: 3 }],
    icon: 'Briefcase',
    color: '#f59e0b',
  },
  {
    id: 'hyper_giant_materials',
    nameUk: 'Гігантський набір матеріалів',
    nameRu: 'Гигантский набор материалов',
    nameEn: 'Giant Materials Set',
    basePriceGems: 1400,
    rewards: [
      { type: 'scroll', amount: 150 },
      { type: 'ruby_dust', amount: 75 },
      { type: 'essence', amount: 50 },
      { type: 'magma_stone', amount: 3 },
    ],
    icon: 'Layers',
    color: '#06b6d4',
  },
  {
    id: 'hyper_super_cases',
    nameUk: 'Суперкейси',
    nameRu: 'Суперкейсы',
    nameEn: 'Super Cases',
    basePriceGems: 2000,
    rewards: [{ type: 'case_energy', amount: 1 }],
    icon: 'Package',
    color: '#22c55e',
  },
];

interface HyperDiscountTier {
  pct: number;
  weight: number;
}

const HYPER_DISCOUNT_TIERS: HyperDiscountTier[] = [
  { pct: 0, weight: 40 },
  { pct: 10, weight: 30 },
  { pct: 20, weight: 30 },
];

function rollHyperDiscount(): number {
  const total = HYPER_DISCOUNT_TIERS.reduce((s, d) => s + d.weight, 0);
  let r = Math.random() * total;
  for (const d of HYPER_DISCOUNT_TIERS) {
    r -= d.weight;
    if (r <= 0) return d.pct;
  }
  return 0;
}

export interface HyperBundleState {
  bundleId: string;
  discountPct: number;
  purchased: boolean;
  refreshedAt: number;
  nextRefreshAt: number;
}

export function generateHyperBundle(now: number): HyperBundleState {
  const bundle = HYPER_BUNDLES[Math.floor(Math.random() * HYPER_BUNDLES.length)];
  return {
    bundleId: bundle.id,
    discountPct: rollHyperDiscount(),
    purchased: false,
    refreshedAt: now,
    nextRefreshAt: now + HYPER_BUNDLE_REFRESH_MS,
  };
}

export function findHyperBundle(bundleId: string): SpecialOfferBundle | undefined {
  return HYPER_BUNDLES.find((b) => b.id === bundleId);
}

export function getRewardAmount(bundle: SpecialOfferBundle, type: SpecialOfferRewardType): number {
  return bundle.rewards.filter((r) => r.type === type).reduce((s, r) => s + r.amount, 0);
}
