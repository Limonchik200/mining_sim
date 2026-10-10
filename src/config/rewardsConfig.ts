import { formatNumber } from '@/config';

export type DailyRewardType = 'cash' | 'gems' | 'case';

export interface DailyReward {
  type: DailyRewardType;
  baseAmount?: number;
  caseRarity?: 'common' | 'epic';
  gems?: number;
}

export const DAILY_REWARDS: DailyReward[] = [
  { type: 'cash', baseAmount: 100 },
  { type: 'case', caseRarity: 'common' },
  { type: 'cash', baseAmount: 200 },
  { type: 'gems', gems: 5 },
  { type: 'cash', baseAmount: 300 },
  { type: 'gems', gems: 8 },
  { type: 'case', caseRarity: 'epic' },
];

export const DAILY_RESET_HOUR_UTC = 0;
export const DAILY_CLAIM_COOLDOWN_MS = 20 * 3600 * 1000;

export function getDailyRewardScaled(reward: DailyReward, playerLevel: number): { type: DailyRewardType; amount: number; caseRarity?: string } {
  const L = playerLevel;
  const levelMultiplier = 1 + (0.8 * L) + (0.02 * Math.pow(L, 1.4));
  if (reward.type === 'cash') {
    return { type: 'cash', amount: Math.round((reward.baseAmount || 0) * levelMultiplier * 100) / 100 };
  }
  if (reward.type === 'gems') {
    return { type: 'gems', amount: reward.gems || 0 };
  }
  return { type: 'case', amount: 1, caseRarity: reward.caseRarity };
}

export function getDailyRewardLabel(reward: DailyReward, playerLevel: number, lang: 'uk' | 'en' | 'ru'): string {
  const scaled = getDailyRewardScaled(reward, playerLevel);
  if (scaled.type === 'cash') {
    return '$' + formatNumber(scaled.amount);
  }
  if (scaled.type === 'gems') {
    return `${scaled.amount} 💎`;
  }
  if (scaled.type === 'case') {
    const rarityName = scaled.caseRarity === 'epic'
      ? (lang === 'uk' ? 'Епічний кейс' : (lang === 'ru' ? 'Эпический кейс' : 'Epic Case'))
      : (lang === 'uk' ? 'Звичайний кейс' : (lang === 'ru' ? 'Обычный кейс' : 'Common Case'));
    return rarityName;
  }
  return '';
}
