import type { ResourceType } from './inventory';

export interface MineDropTable {
  stone: number;
  coal: number;
  copper: number;
  iron: number;
  silver?: number;
  gold?: number;
}

export interface MineUnlockRequirements {
  level: number;
  price: number;
  helmetLevel?: number;
  flashlightLevel?: number;
  glovesLevel?: number;
  respiratorLevel?: number;
  respiratorFilter?: boolean;
  railsCount?: number;
  cartStation?: boolean;
  ventilationLevel?: number;
  lightingLevel?: number;
  woodenBracingCount?: number;
  unlockTimeMinutes: number;
}

export interface MineEnvironment {
  baseTemperature: number;
  oxygenConsumptionPerMin: number;
}

export interface Mine {
  id: number;
  nameUk: string;
  nameEn: string;
  nameRu: string;
  reqLevel: number;
  drops: MineDropTable;
  unlockRequirements?: MineUnlockRequirements;
  environment?: MineEnvironment;
}
