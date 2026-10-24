export type RawMaterialType = 'wood_log' | 'steel_plank';

export type ConstructionType = 'wooden_bracing' | 'rails' | 'shelf' | 'food_cabinet';

export type CraftItemType = RawMaterialType | ConstructionType;

export type CraftItemCategory = 'raw' | 'construction';

export interface CraftItem {
  type: CraftItemType;
  category: CraftItemCategory;
  nameUk: string;
  nameEn: string;
  nameRu: string;
  icon: string;
  color: string;
  weight: number;
  descriptionUk?: string;
  descriptionEn?: string;
  descriptionRu?: string;
}

export interface CraftRecipe {
  result: ConstructionType;
  resultNameUk: string;
  resultNameEn: string;
  resultNameRu: string;
  icon: string;
  color: string;
  ingredients: { type: RawMaterialType; amount: number }[];
  descriptionUk: string;
  descriptionEn: string;
  descriptionRu: string;
}

export interface FuelCanister {
  id: string;
  capacity: number;
  currentFuel: number;
  isEmpty?: boolean;
}

export interface FuelState {
  canisters: FuelCanister[];
  diesel95Price: number;
  diesel95PriceUpdatedAt: number;
  diesel100Available: boolean;
}

export interface MaterialsShopSlot {
  id: string;
  materialType: RawMaterialType;
  packSize: number;
  basePrice: number;
  discountPct: number;
  stock: number;
  maxStock: number;
}

export interface MaterialsShopState {
  slots: MaterialsShopSlot[];
  refreshedAt: number;
  nextRefreshAt: number;
}

export type OxygenTankType = 'oxygen_tank_small' | 'oxygen_tank_medium' | 'oxygen_tank_large';

export type BatteryType = 'battery_basic' | 'battery_weak' | 'battery_car' | 'battery_lithium';

export type CoolerType = 'cooler_weak' | 'cooler_normal' | 'cooler_industrial';

export type CoolerMode = 'eco' | 'normal' | 'full';

export interface OxygenTank {
  id: string;
  type: OxygenTankType;
  currentOxygen: number;
  capacity: number;
}

export interface BatteryInstance {
  id: string;
  type: BatteryType;
  currentCharge: number;
  capacity: number;
  rechargeCount: number;
}

export interface CoolerInstance {
  id: string;
  type: CoolerType;
  durability: number;
  maxDurability: number;
  mode: CoolerMode;
  active: boolean;
}

export interface GeneratorState {
  purchased: boolean;
  fuelLiters: number;
  tankCapacity: number;
  active: boolean;
  lithiumBatteryIds: string[];
}

export interface SpecialOffersState {
  offers: { bundleId: string; discountPct: number; purchased: boolean }[];
  refreshedAt: number;
  nextRefreshAt: number;
}

export interface LifeSupportState {
  oxygenTanks: OxygenTank[];
  batteries: BatteryInstance[];
  coolers: CoolerInstance[];
  generator: GeneratorState;
  ownedOxygenTypes: OxygenTankType[];
  ownedCoolerTypes: CoolerType[];
  ownedBatteryTypes: BatteryType[];
  shelfCount: number;
  activeBatteryId: string | null;
  activeOxygenTankId: string | null;
  activeCoolerId: string | null;
}
