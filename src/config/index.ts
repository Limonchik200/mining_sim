export function formatMoney(amount: any): string {
  const safeAmount = Number(amount) || 0;
  return '$' + safeAmount.toFixed(2);
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
