export type QuestKind = 'daily' | 'weekly';

export type QuestId =
  | 'play_minutes'
  | 'open_cases'
  | 'expeditions'
  | 'mine_ore_kg'
  | 'eat_snickers'
  | 'eat_milka'
  | 'drink_juice'
  | 'claim_daily'
  | 'dig_cases'
  | 'repair_pickaxe'
  | 'collect_basket'
  | 'restore_energy'
  | 'make_purchase'
  | 'sell_ore'
  | 'make_clicks'
  | 'expedition_cases'
  | 'buy_material_pack'
  | 'farm_gems'
  | 'spend_oxygen'
  | 'spend_energy'
  | 'buy_fuel_liters'
  | 'produce_energy_mw';

export interface QuestDef {
  id: QuestId;
  target: number;
  /** Minimum player level to be eligible for this quest. */
  requiredLevel?: number;
}

export interface ActiveQuest {
  id: QuestId;
  /** Snapshot of the stat value at the moment the quest was generated. */
  startValue: number;
  target: number;
  claimed: boolean;
}

export interface QuestsState {
  daily: {
    generatedAt: number;
    cycleKey: string;
    quests: ActiveQuest[];
    allClaimedRewardClaimed: boolean;
  };
  weekly: {
    generatedAt: number;
    cycleKey: string;
    quests: ActiveQuest[];
    allClaimedRewardClaimed: boolean;
  };
}
