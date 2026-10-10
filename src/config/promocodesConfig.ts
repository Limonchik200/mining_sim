export const ADMIN_CODE = 'admin2011';
export const ADMIN_CODE_REWARD = 10000000;
export const ADM_XP_CODE = 'adm_xp';
export const ADM_XP_REWARD = 10000000000;

export interface PromoCode {
  code: string;
  type: 'balance' | 'cases' | 'mixed';
  bonusBalance?: number;
  cases?: { rarity: 'common' | 'rare' | 'epic' | 'legendary'; count: number }[];
  messageUk: string;
  messageEn: string;
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
];

export function findPromoCode(code: string): PromoCode | null {
  const clean = code.trim().toLowerCase();
  return PROMO_CODES.find((p) => p.code === clean) || null;
}
