import type { OxygenTankType } from '@/types/craft';

export interface OxygenTankConfig {
  type: OxygenTankType;
  price: number;
  capacity: number;
  space: number;
  nameRu: string;
  nameUk: string;
  nameEn: string;
  icon: string;
  color: string;
}

export const OXYGEN_TANK_CONFIGS: Record<OxygenTankType, OxygenTankConfig> = {
  oxygen_tank_small: {
    type: 'oxygen_tank_small',
    price: 2000,
    capacity: 20,
    space: 0.125,
    nameRu: 'Малый балон',
    nameUk: 'Малий балон',
    nameEn: 'Small Tank',
    icon: 'Wind',
    color: '#06b6d4',
  },
  oxygen_tank_medium: {
    type: 'oxygen_tank_medium',
    price: 5000,
    capacity: 45,
    space: 0.25,
    nameRu: 'Обычный балон',
    nameUk: 'Звичайний балон',
    nameEn: 'Medium Tank',
    icon: 'Wind',
    color: '#0891b2',
  },
  oxygen_tank_large: {
    type: 'oxygen_tank_large',
    price: 15000,
    capacity: 135,
    space: 0.5,
    nameRu: 'Большой балон',
    nameUk: 'Великий балон',
    nameEn: 'Large Tank',
    icon: 'Wind',
    color: '#0e7490',
  },
};

export function createOxygenTank(type: OxygenTankType): import('@/types/craft').OxygenTank {
  const cfg = OXYGEN_TANK_CONFIGS[type];
  return {
    id: `oxygen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    currentOxygen: cfg.capacity,
    capacity: cfg.capacity,
  };
}
