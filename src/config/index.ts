import type { Lang } from '@/types';

export function langName(lang: Lang, uk: string, en: string, ru: string): string {
  if (lang === 'uk') return uk;
  if (lang === 'ru') return ru;
  return en;
}

export function formatNumber(amount: any): string {
  const safeAmount = Number(amount) || 0;
  if (Math.abs(safeAmount) >= 1e15) {
    return safeAmount.toExponential(2).replace('e+', 'e');
  }
  if (Math.abs(safeAmount) >= 1e9) {
    const billions = safeAmount / 1e9;
    return billions.toFixed(2) + 'B';
  }
  if (Math.abs(safeAmount) >= 1e6) {
    const millions = safeAmount / 1e6;
    return millions.toFixed(2) + 'M';
  }
  if (Math.abs(safeAmount) >= 1e4) {
    return Math.round(safeAmount).toLocaleString('en-US');
  }
  return safeAmount.toFixed(2);
}

export function formatMoney(amount: any): string {
  return '$' + formatNumber(amount);
}

export function formatMass(mass: number): string {
  return mass.toFixed(2) + ' kg';
}

export function formatTime(seconds: number): string {
  if (seconds <= 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function convertToSeconds(value: number, unit: string): number {
  switch (unit) {
    case 'seconds':
      return value;
    case 'minutes':
      return value * 60;
    case 'hours':
      return value * 3600;
    default:
      return value;
  }
}
