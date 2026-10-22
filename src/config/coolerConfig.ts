import type { CoolerType, CoolerMode, CoolerInstance } from '@/types/craft';

export interface CoolerModeConfig {
  tempReduction: number;
  powerPerMin: number;
  durationSec: number;
}

export interface CoolerConfig {
  type: CoolerType;
  price: number;
  repairPrice: number;
  maxDurability: number;
  modes: CoolerMode[];
  modeConfigs: Record<CoolerMode, CoolerModeConfig>;
  hasModes: boolean;
  nameRu: string;
  nameUk: string;
  nameEn: string;
  icon: string;
  color: string;
}

export const COOLER_CONFIGS: Record<CoolerType, CoolerConfig> = {
  cooler_weak: {
    type: 'cooler_weak',
    price: 5000,
    repairPrice: 2000,
    maxDurability: 1000,
    modes: ['normal'],
    hasModes: false,
    modeConfigs: {
      eco: { tempReduction: 0, powerPerMin: 0, durationSec: 0 },
      normal: { tempReduction: 6, powerPerMin: 0.9, durationSec: 300 },
      full: { tempReduction: 0, powerPerMin: 0, durationSec: 0 },
    },
    nameRu: 'Слабый охладитель',
    nameUk: 'Слабкий охолоджувач',
    nameEn: 'Weak Cooler',
    icon: 'Snowflake',
    color: '#06b6d4',
  },
  cooler_normal: {
    type: 'cooler_normal',
    price: 35000,
    repairPrice: 15000,
    maxDurability: 1000,
    modes: ['normal'],
    hasModes: false,
    modeConfigs: {
      eco: { tempReduction: 0, powerPerMin: 0, durationSec: 0 },
      normal: { tempReduction: 11, powerPerMin: 1.6, durationSec: 600 },
      full: { tempReduction: 0, powerPerMin: 0, durationSec: 0 },
    },
    nameRu: 'Обычный охладитель',
    nameUk: 'Звичайний охолоджувач',
    nameEn: 'Normal Cooler',
    icon: 'Snowflake',
    color: '#0891b2',
  },
  cooler_industrial: {
    type: 'cooler_industrial',
    price: 250000,
    repairPrice: 100000,
    maxDurability: 1000,
    modes: ['eco', 'normal', 'full'],
    hasModes: true,
    modeConfigs: {
      eco: { tempReduction: 15, powerPerMin: 2.4, durationSec: 1680 },
      normal: { tempReduction: 21, powerPerMin: 3.8, durationSec: 1320 },
      full: { tempReduction: 29, powerPerMin: 5.6, durationSec: 960 },
    },
    nameRu: 'Промышленный охладитель',
    nameUk: 'Промисловий охолоджувач',
    nameEn: 'Industrial Cooler',
    icon: 'Snowflake',
    color: '#0e7490',
  },
};

export function getCoolerDurabilityLossPerSec(type: CoolerType, mode: CoolerMode): number {
  const cfg = COOLER_CONFIGS[type];
  return getCoolerDegradationPerSec(cfg, mode);
}

export function getCoolerDegradationPerSec(cooler: CoolerConfig, mode: CoolerMode): number {
  const modeCfg = cooler.modeConfigs[mode];
  if (!modeCfg || modeCfg.durationSec === 0) return 0;
  return cooler.maxDurability / modeCfg.durationSec;
}

export function createCooler(type: CoolerType): CoolerInstance {
  const cfg = COOLER_CONFIGS[type];
  return {
    id: `cooler-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    durability: cfg.maxDurability,
    maxDurability: cfg.maxDurability,
    mode: cfg.hasModes ? 'eco' : 'normal',
    active: false,
  };
}

export function getCoolerDurabilityPct(cooler: CoolerInstance): number {
  return Math.round((cooler.durability / cooler.maxDurability) * 100);
}

export function getCoolerRemainingSec(cooler: CoolerInstance): number {
  const cfg = COOLER_CONFIGS[cooler.type];
  const modeCfg = cfg.modeConfigs[cooler.mode];
  if (!modeCfg || modeCfg.durationSec === 0) return 0;
  const degradationPerSec = cfg.maxDurability / modeCfg.durationSec;
  if (degradationPerSec === 0) return 0;
  return Math.round(cooler.durability / degradationPerSec);
}
