import type { GameStats } from '@/types/player';
import type { ActiveQuest, QuestDef, QuestId, QuestKind } from './types';

export const DAILY_QUEST_DEFS: QuestDef[] = [
  { id: 'play_minutes', target: 20 },
  { id: 'open_cases', target: 2 },
  { id: 'expeditions', target: 2 },
  { id: 'mine_ore_kg', target: 200 },
  { id: 'eat_snickers', target: 20 },
  { id: 'eat_milka', target: 3 },
  { id: 'drink_juice', target: 3 },
  { id: 'claim_daily', target: 1 },
  { id: 'dig_cases', target: 1 },
  { id: 'repair_pickaxe', target: 10 },
  { id: 'collect_basket', target: 10 },
  { id: 'restore_energy', target: 500 },
  { id: 'make_purchase', target: 1 },
  { id: 'sell_ore', target: 10 },
  { id: 'make_clicks', target: 200 },
];

export const WEEKLY_QUEST_DEFS: QuestDef[] = [
  { id: 'play_minutes', target: 100 },
  { id: 'open_cases', target: 10 },
  { id: 'expeditions', target: 10 },
  { id: 'mine_ore_kg', target: 1000 },
  { id: 'eat_snickers', target: 100 },
  { id: 'eat_milka', target: 20 },
  { id: 'drink_juice', target: 15 },
  { id: 'claim_daily', target: 5 },
  { id: 'dig_cases', target: 5 },
  { id: 'repair_pickaxe', target: 50 },
  { id: 'collect_basket', target: 50 },
  { id: 'restore_energy', target: 2500 },
  { id: 'make_purchase', target: 5 },
  { id: 'sell_ore', target: 50 },
  { id: 'make_clicks', target: 1000 },
  { id: 'expedition_cases', target: 5 },
  { id: 'buy_material_pack', target: 2 },
  { id: 'farm_gems', target: 20 },
  { id: 'spend_oxygen', target: 100 },
  { id: 'spend_energy', target: 15 },
  { id: 'buy_fuel_liters', target: 200, requiredLevel: 50 },
  { id: 'produce_energy_mw', target: 250, requiredLevel: 50 },
];

export const DAILY_QUEST_COUNT = 3;
export const WEEKLY_QUEST_COUNT = 5;
export const DAILY_LEVEL_REQUIRED = 6;
export const WEEKLY_LEVEL_REQUIRED = 9;
export const DAILY_GEM_REWARD = 1;
export const WEEKLY_GEM_REWARD = 3;
export const DAILY_ALL_CASE_RARITY = 'common' as const;
export const WEEKLY_ALL_CASE_RARITY = 'rare' as const;
export const WEEKLY_ALL_CASE_COUNT = 3;

/** Maps a quest id to the live stat value it tracks. */
export function readStat(stats: GameStats, id: QuestId): number {
  switch (id) {
    case 'play_minutes': return Math.floor((stats.playSeconds ?? 0) / 60);
    case 'open_cases': return stats.totalCasesOpened;
    case 'expeditions':
      return (stats.expeditionsTier1 ?? 0) + (stats.expeditionsTier2 ?? 0)
        + (stats.expeditionsTier3 ?? 0) + (stats.expeditionsTier4 ?? 0)
        + (stats.expeditionsTier5 ?? 0);
    case 'mine_ore_kg': return stats.oreMinedKg;
    case 'eat_snickers': return stats.foodSnickersEaten;
    case 'eat_milka': return stats.foodMilkaEaten;
    case 'drink_juice': return stats.foodJuiceDrunk;
    case 'claim_daily': return stats.dailyRewardsClaimed ?? 0;
    case 'dig_cases':
      return (stats.casesDugCommon ?? 0) + (stats.casesDugRare ?? 0)
        + (stats.casesDugEpic ?? 0) + (stats.casesDugLegendary ?? 0);
    case 'repair_pickaxe': return stats.repairsMade ?? 0;
    case 'collect_basket': return stats.basketCollected ?? 0;
    case 'restore_energy': return stats.energyRestored ?? 0;
    case 'make_purchase': return stats.purchasesCount ?? 0;
    case 'sell_ore': return stats.sellsCount ?? 0;
    case 'make_clicks': return stats.totalClicks;
    case 'expedition_cases': return stats.expeditionCasesEarned ?? 0;
    case 'buy_material_pack': return stats.materialPacksBought ?? 0;
    case 'farm_gems': return stats.gemsEarned;
    case 'spend_oxygen': return stats.oxygenSpent;
    case 'spend_energy': return stats.energySpent;
    case 'buy_fuel_liters': return stats.fuelBoughtLiters ?? 0;
    case 'produce_energy_mw': return stats.generatorEnergyProduced ?? 0;
  }
}

/** Stable cycle key: YYYY-MM-DD for daily, local-week (Monday-based) for weekly. */
export function dailyCycleKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `D-${y}-${m}-${day}`;
}

export function weeklyCycleKey(d: Date = new Date()): string {
  const dayNum = (d.getDay() + 6) % 7;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dayNum);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const day = String(monday.getDate()).padStart(2, '0');
  return `W-${y}-${m}-${day}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function nextDailyRefreshMs(from: number = Date.now()): number {
  const d = new Date(from);
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
  return next.getTime() - from;
}

export function nextWeeklyRefreshMs(from: number = Date.now()): number {
  const d = new Date(from);
  const dayNum = (d.getDay() + 6) % 7;
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dayNum + 7, 0, 0, 0, 0);
  return next.getTime() - from;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateDailyQuests(stats: GameStats): ActiveQuest[] {
  const eligible = DAILY_QUEST_DEFS;
  const picked = shuffle(eligible).slice(0, Math.min(DAILY_QUEST_COUNT, eligible.length));
  return picked.map((def) => ({
    id: def.id,
    startValue: readStat(stats, def.id),
    target: def.target,
    claimed: false,
  }));
}

export function generateWeeklyQuests(stats: GameStats, level: number): ActiveQuest[] {
  const eligible = WEEKLY_QUEST_DEFS.filter(
    (def) => def.requiredLevel === undefined || level >= def.requiredLevel
  );
  const picked = shuffle(eligible).slice(0, Math.min(WEEKLY_QUEST_COUNT, eligible.length));
  return picked.map((def) => ({
    id: def.id,
    startValue: readStat(stats, def.id),
    target: def.target,
    claimed: false,
  }));
}

export function questProgress(stats: GameStats, quest: ActiveQuest): number {
  return Math.max(0, readStat(stats, quest.id) - quest.startValue);
}

export function questComplete(stats: GameStats, quest: ActiveQuest): boolean {
  return questProgress(stats, quest) >= quest.target;
}

export function allQuestsClaimed(stats: GameStats, quests: ActiveQuest[]): boolean {
  return quests.length > 0 && quests.every((q) => q.claimed || questComplete(stats, q));
}

export interface QuestLabel {
  uk: string;
  en: string;
  ru: string;
}

export const QUEST_LABELS: Record<QuestId, (target: number) => QuestLabel> = {
  play_minutes: (t) => ({
    uk: `Зіграй ${t} хв`,
    en: `Play for ${t} min`,
    ru: `Играй ${t} мин`,
  }),
  open_cases: (t) => ({
    uk: `Відкрий ${t} кейси`,
    en: `Open ${t} cases`,
    ru: `Открой ${t} кейсов`,
  }),
  expeditions: (t) => ({
    uk: `Відправся в ${t} експедиції`,
    en: `Go on ${t} expeditions`,
    ru: `Отправься в ${t} экспедиции`,
  }),
  mine_ore_kg: (t) => ({
    uk: `Викопай ${t} кг руди`,
    en: `Mine ${t} kg of ore`,
    ru: `Выкопай ${t} кг руды`,
  }),
  eat_snickers: (t) => ({
    uk: `З'їж ${t} снікерсів`,
    en: `Eat ${t} Snickers`,
    ru: `Съешь ${t} сникерсов`,
  }),
  eat_milka: (t) => ({
    uk: `З'їж ${t} мілки`,
    en: `Eat ${t} Milka`,
    ru: `Съешь ${t} милок`,
  }),
  drink_juice: (t) => ({
    uk: `Випий ${t} соки`,
    en: `Drink ${t} juices`,
    ru: `Выпей ${t} соков`,
  }),
  claim_daily: (t) => ({
    uk: `Забери щоденну нагороду ${t} раз`,
    en: `Claim daily reward ${t} time(s)`,
    ru: `Забери ежедневную награду ${t} раз`,
  }),
  dig_cases: (t) => ({
    uk: `Викопай ${t} кейс`,
    en: `Dig up ${t} case(s)`,
    ru: `Выкопай ${t} кейс(ов)`,
  }),
  repair_pickaxe: (t) => ({
    uk: `Полагодь кирку ${t} разів`,
    en: `Repair pickaxe ${t} times`,
    ru: `Почини кирку ${t} раз`,
  }),
  collect_basket: (t) => ({
    uk: `Збери авто-кошик ${t} разів`,
    en: `Collect auto-basket ${t} times`,
    ru: `Собери авто-корзину ${t} раз`,
  }),
  restore_energy: (t) => ({
    uk: `Віднови енергію: ${t}`,
    en: `Restore energy: ${t}`,
    ru: `Восстанови энергию: ${t}`,
  }),
  make_purchase: (t) => ({
    uk: `Зроби ${t} покупку у магазині/прокачці`,
    en: `Make ${t} purchase(s) in shop/upgrades`,
    ru: `Сделай ${t} покупку в магазине/прокачке`,
  }),
  sell_ore: (t) => ({
    uk: `Продай руду ${t} разів`,
    en: `Sell ore ${t} times`,
    ru: `Продай руду ${t} раз`,
  }),
  make_clicks: (t) => ({
    uk: `Зроби ${t} кліків`,
    en: `Make ${t} clicks`,
    ru: `Сделай ${t} кликов`,
  }),
  expedition_cases: (t) => ({
    uk: `Зароби ${t} кейсів з експедиції`,
    en: `Earn ${t} cases from expeditions`,
    ru: `Заработай ${t} кейсов из экспедиции`,
  }),
  buy_material_pack: (t) => ({
    uk: `Купи ${t} набори сировини`,
    en: `Buy ${t} material packs`,
    ru: `Купи ${t} набора сырья`,
  }),
  farm_gems: (t) => ({
    uk: `Нафарми ${t} гемів`,
    en: `Farm ${t} gems`,
    ru: `Нафарми ${t} гемов`,
  }),
  spend_oxygen: (t) => ({
    uk: `Витрать ${t} л кисню`,
    en: `Spend ${t} L of oxygen`,
    ru: `Потрать ${t} л кислорода`,
  }),
  spend_energy: (t) => ({
    uk: `Витрать ${t} МВт енергії`,
    en: `Spend ${t} MWh of energy`,
    ru: `Потрать ${t} МВт энергии`,
  }),
  buy_fuel_liters: (t) => ({
    uk: `Купи ${t} л бензину`,
    en: `Buy ${t} L of fuel`,
    ru: `Купи ${t} л бензина`,
  }),
  produce_energy_mw: (t) => ({
    uk: `Вироби ${t} МВт енергії`,
    en: `Produce ${t} MWh of energy`,
    ru: `Произведи ${t} МВт энергии`,
  }),
};

export function questLabel(id: QuestId, target: number, kind: QuestKind, lang: 'uk' | 'en' | 'ru'): string {
  const label = QUEST_LABELS[id](target);
  return label[lang];
}
