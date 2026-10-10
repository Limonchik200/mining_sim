import type { ResourceType } from './inventory';

export interface MineDropTable {
  stone: number;
  coal: number;
  copper: number;
  iron: number;
}

export interface Mine {
  id: number;
  nameUk: string;
  nameEn: string;
  nameRu: string;
  reqLevel: number;
  drops: MineDropTable;
}
