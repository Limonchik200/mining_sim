import type { BatteryType } from '@/types/craft';

export interface BatteryConfig {
  type: BatteryType;
  price: number;
  capacity: number;
  space: number;
  maxRecharges: number;
  nameRu: string;
  nameUk: string;
  nameEn: string;
  icon: string;
  color: string;
}

export const BATTERY_CONFIGS: Record<BatteryType, BatteryConfig> = {
  battery_basic: {
    type: 'battery_basic',
    price: 400,
    capacity: 5,
    space: 0.1,
    maxRecharges: 0,
    nameRu: 'Батарейка',
    nameUk: 'Батарейка',
    nameEn: 'Basic Battery',
    icon: 'Battery',
    color: '#22c55e',
  },
  battery_weak: {
    type: 'battery_weak',
    price: 1000,
    capacity: 12,
    space: 0.2,
    maxRecharges: 0,
    nameRu: 'Слабый аккумулятор',
    nameUk: 'Слабкий акумулятор',
    nameEn: 'Weak Battery',
    icon: 'Battery',
    color: '#eab308',
  },
  battery_car: {
    type: 'battery_car',
    price: 5000,
    capacity: 55,
    space: 0.25,
    maxRecharges: 0,
    nameRu: 'Автомобильный аккумулятор',
    nameUk: 'Автомобільний акумулятор',
    nameEn: 'Car Battery',
    icon: 'Battery',
    color: '#3b82f6',
  },
  battery_lithium: {
    type: 'battery_lithium',
    price: 20000,
    capacity: 100,
    space: 0.5,
    maxRecharges: 3,
    nameRu: 'Литиевый аккумулятор',
    nameUk: 'Літієвий акумулятор',
    nameEn: 'Lithium Battery',
    icon: 'Battery',
    color: '#8b5cf6',
  },
};

export function createBattery(type: BatteryType): import('@/types/craft').BatteryInstance {
  const cfg = BATTERY_CONFIGS[type];
  return {
    id: `battery-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    currentCharge: cfg.capacity,
    capacity: cfg.capacity,
    rechargeCount: 0,
  };
}
