import type { FuelCanister } from '@/types/craft';

export const CANISTER_PRICE = 1000;
export const CANISTER_CAPACITY_L = 10;
export const CANISTER_WEIGHT = 0.1;

export const DIESEL95_MIN_PRICE = 30.0;
export const DIESEL95_MAX_PRICE = 40.0;
export const DIESEL95_UPDATE_MS = 30000;

export function generateDiesel95Price(): number {
  const price = DIESEL95_MIN_PRICE + Math.random() * (DIESEL95_MAX_PRICE - DIESEL95_MIN_PRICE);
  return Math.round(price * 100) / 100;
}

export function createCanister(): FuelCanister {
  return {
    id: `canister-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    capacity: CANISTER_CAPACITY_L,
    currentFuel: 0,
  };
}

export function getTotalFuelCapacity(canisters: FuelCanister[]): number {
  return canisters.reduce((sum, c) => sum + c.capacity, 0);
}

export function getTotalFuel(canisters: FuelCanister[]): number {
  return canisters.reduce((sum, c) => sum + c.currentFuel, 0);
}

export function getAvailableFuelSpace(canisters: FuelCanister[]): number {
  return canisters.reduce((sum, c) => sum + (c.capacity - c.currentFuel), 0);
}

export function addFuel(canisters: FuelCanister[], liters: number): FuelCanister[] {
  let remaining = liters;
  return canisters.map((c) => {
    if (remaining <= 0) return c;
    const space = c.capacity - c.currentFuel;
    const toFill = Math.min(space, remaining);
    remaining -= toFill;
    return { ...c, currentFuel: c.currentFuel + toFill };
  });
}
