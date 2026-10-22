import type { BatteryType, OxygenTankType, LifeSupportState, FuelState } from '@/types/craft';

export const SHELF_SPACE = 4;
export const MAX_SHELVES = 6;
export const MAX_WAREHOUSE_SPACE = SHELF_SPACE * MAX_SHELVES;

export const GENERATOR_SPACE = 1.0;

export const ITEM_SPACES: Record<string, number> = {
  generator: GENERATOR_SPACE,
  battery_basic: 0.1,
  battery_weak: 0.2,
  battery_car: 0.25,
  battery_lithium: 0.5,
  fuel_canister: 0.1,
  oxygen_tank_small: 0.125,
  oxygen_tank_medium: 0.25,
  oxygen_tank_large: 0.5,
};

export function getBatterySpace(type: BatteryType): number {
  return ITEM_SPACES[type] ?? 0.1;
}

export function getOxygenTankSpace(type: OxygenTankType): number {
  return ITEM_SPACES[type] ?? 0.125;
}

export function getGeneratorSpace(): number {
  return GENERATOR_SPACE;
}

export function getCanisterSpace(): number {
  return ITEM_SPACES.fuel_canister;
}

export function getUsedSpace(ls: LifeSupportState, fuel: FuelState): number {
  let total = 0;
  if (ls.generator.purchased) total += getGeneratorSpace();
  for (const b of ls.batteries) total += getBatterySpace(b.type);
  for (const t of ls.oxygenTanks) total += getOxygenTankSpace(t.type);
  for (const c of fuel.canisters) total += getCanisterSpace();
  return Math.round(total * 1000) / 1000;
}

export function getTotalSpace(shelfCount: number): number {
  return SHELF_SPACE * Math.min(Math.max(shelfCount, 1), MAX_SHELVES);
}

export function getAvailableSpace(ls: LifeSupportState, fuel: FuelState): number {
  const total = getTotalSpace(ls.shelfCount);
  return Math.round((total - getUsedSpace(ls, fuel)) * 1000) / 1000;
}
