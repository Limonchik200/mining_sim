export const ADMIN_CODE = 'admin2011';
export const ADMIN_CODE_REWARD = 10000000;
export const ADM_XP_CODE = 'adm_xp';
export const ADM_XP_REWARD = 10000000000;

export type CaseRarityType = 'common' | 'rare' | 'epic' | 'legendary' | 'energy';

export interface PromoCode {
  code: string;
  type: 'balance' | 'cases' | 'mixed' | 'materials' | 'items';
  bonusBalance?: number;
  gems?: number;
  cases?: { rarity: CaseRarityType; count: number }[];
  itemBags?: number;
  materials?: Record<string, number>;
  messageUk: string;
  messageEn: string;
  messageRu?: string;
}

export const PROMO_CODES: PromoCode[] = [
  {
    code: 'admin2011',
    type: 'balance',
    bonusBalance: 10000000,
    messageUk: 'Адмін код активовано!',
    messageEn: 'Admin code activated!',
  },
  {
    code: 'adm_case',
    type: 'cases',
    cases: [
      { rarity: 'common', count: 10 },
      { rarity: 'rare', count: 10 },
      { rarity: 'epic', count: 10 },
      { rarity: 'legendary', count: 10 },
    ],
    messageUk: 'Отримано по 10 кейсів кожного виду!',
    messageEn: 'Received 10 cases of each rarity!',
  },
  {
    code: 'start',
    type: 'mixed',
    bonusBalance: 100,
    cases: [{ rarity: 'common', count: 1 }],
    messageUk: '+$100 та 1 Звичайний кейс!',
    messageEn: '+$100 and 1 Common case!',
  },
  {
    code: 'megafixes',
    type: 'mixed',
    bonusBalance: 50,
    cases: [
      { rarity: 'common', count: 1 },
      { rarity: 'rare', count: 1 },
      { rarity: 'epic', count: 1 },
      { rarity: 'legendary', count: 1 },
    ],
    messageUk: '+$50 та по 1 кейсу кожного виду!',
    messageEn: '+$50 and 1 case of each rarity!',
  },
  {
    code: 'adm_items',
    type: 'items',
    cases: [
      { rarity: 'common', count: 10 },
      { rarity: 'rare', count: 10 },
      { rarity: 'epic', count: 20 },
      { rarity: 'legendary', count: 20 },
      { rarity: 'energy', count: 10 },
    ],
    itemBags: 50,
    messageUk: 'Отримано кейси, 50 сумок та 10 енергетичних кейсів!',
    messageEn: 'Received cases, 50 item bags and 10 energy cases!',
    messageRu: 'Получены кейсы, 50 сумок и 10 энергетических кейсов!',
  },
  {
    code: 'adm_mat',
    type: 'materials',
    gems: 20000,
    materials: {
      scroll: 30000,
      rainbow_stone: 2000,
      essence: 10000,
      magma_stone: 500,
      solar_essence: 500,
      ruby_powder: 10000,
    },
    messageUk: 'Отримано повний набір матеріалів для прокачки!',
    messageEn: 'Received a full set of upgrade materials!',
    messageRu: 'Получен полный набор материалов для прокачки!',
  },
];

export function findPromoCode(code: string): PromoCode | null {
  const clean = code.trim().toLowerCase();
  return PROMO_CODES.find((p) => p.code === clean) || null;
}
