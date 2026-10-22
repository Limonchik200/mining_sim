export const GENERATOR_PRICE = 100000;
export const GENERATOR_SPACE = 1;
export const GENERATOR_POWER_PER_MIN = 5;
export const GENERATOR_TANK_CAPACITY = 100;
export const GENERATOR_FUEL_PER_MIN = 12.5;
export const GENERATOR_LITHIUM_SLOTS = 2;

export function getGeneratorLithiumBoost(batteryCount: number): number {
  if (batteryCount === 0) return 0;
  if (batteryCount === 1) return 5;
  if (batteryCount >= 2) return 5;
  return 0;
}

export function getGeneratorTotalPower(lithiumCount: number): number {
  return GENERATOR_POWER_PER_MIN + getGeneratorLithiumBoost(lithiumCount);
}

export function canActivateGenerator(hasVentilation: boolean, hasSmokeFilter: boolean): boolean {
  return hasVentilation && hasSmokeFilter;
}
