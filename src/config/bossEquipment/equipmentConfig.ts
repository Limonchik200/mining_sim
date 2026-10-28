export interface EquipmentItemConfig {
  id: string;
  name: string;
  slot: 'weapon' | 'helmet' | 'amulet' | 'chest' | 'pants' | 'boots';
  setName: 'medical' | 'summer' | 'juggernaut' | null;
  baseDurability: number; // 80 на 1 рівні, х2 на кожному наступному
  levels: {
    level: number;
    rarity: string;
    damageMin?: number;
    damageMax?: number;
    regen?: number;
    defense?: number;
    maxHp?: number;
    critChance?: number;
    vampirism?: number;
    trueDamage?: number;
    stunChance?: number;
    dodgeChance?: number;
    blockChance?: number;
    reflection?: number;
    medHealingBonus?: number;
    repairPerCrit?: number; // 0, якщо немає ремонту (1-5 рівні)
  }[];
}

export const BOSS_EQUIPMENT_CONFIG: Record<string, EquipmentItemConfig> = {
  // --- ЗБРОЯ ---
  vampiric_blade: {
    id: 'vampiric_blade',
    name: 'Вампірський клинок',
    slot: 'weapon',
    setName: 'medical',
    baseDurability: 80,
    levels: [
      { level: 1, rarity: 'common', damageMin: 10, damageMax: 14, regen: 0.4, critChance: 4, repairPerCrit: 0 },
      { level: 2, rarity: 'good', damageMin: 17, damageMax: 21, regen: 0.8, critChance: 5.5, repairPerCrit: 0 },
      { level: 3, rarity: 'great', damageMin: 26, damageMax: 30, regen: 1.2, critChance: 7, repairPerCrit: 0 },
      { level: 4, rarity: 'epic', damageMin: 35, damageMax: 39, regen: 1.7, critChance: 9, vampirism: 3.5, repairPerCrit: 0 },
      { level: 5, rarity: 'legendary', damageMin: 46, damageMax: 52, regen: 2.4, critChance: 12, vampirism: 7.5, repairPerCrit: 0 },
      { level: 6, rarity: 'mythic', damageMin: 60, damageMax: 66, regen: 3.3, critChance: 15, vampirism: 13, repairPerCrit: 1 },
      { level: 7, rarity: 'exotic', damageMin: 72, damageMax: 78, regen: 4.2, critChance: 19, vampirism: 20, repairPerCrit: 2 },
    ],
  },
  labrys_axe: {
    id: 'labrys_axe',
    name: 'Сокира Лабрис',
    slot: 'weapon',
    setName: 'summer',
    baseDurability: 80,
    levels: [
      { level: 1, rarity: 'common', damageMin: 24, damageMax: 28, regen: 0.1, critChance: 1.5, repairPerCrit: 0 },
      { level: 2, rarity: 'good', damageMin: 35, damageMax: 39, regen: 0.2, critChance: 2.5, repairPerCrit: 0 },
      { level: 3, rarity: 'great', damageMin: 45, damageMax: 49, regen: 0.3, critChance: 3.5, repairPerCrit: 0 },
      { level: 4, rarity: 'epic', damageMin: 56, damageMax: 62, regen: 0.4, critChance: 5, stunChance: 3, repairPerCrit: 0 },
      { level: 5, rarity: 'legendary', damageMin: 69, damageMax: 76, regen: 0.6, critChance: 6, stunChance: 7, repairPerCrit: 0 },
      { level: 6, rarity: 'mythic', damageMin: 86, damageMax: 92, regen: 0.8, critChance: 7.5, stunChance: 12, repairPerCrit: 1 },
      { level: 7, rarity: 'exotic', damageMin: 106, damageMax: 112, regen: 1.1, critChance: 9, stunChance: 18, repairPerCrit: 2 },
    ],
  },
  great_excalibur: {
    id: 'great_excalibur',
    name: 'Великий екскалібур',
    slot: 'weapon',
    setName: 'juggernaut',
    baseDurability: 80,
    levels: [
      { level: 1, rarity: 'common', damageMin: 18, damageMax: 22, regen: 0.2, critChance: 2.2, repairPerCrit: 0 },
      { level: 2, rarity: 'good', damageMin: 27, damageMax: 31, regen: 0.4, critChance: 3.6, repairPerCrit: 0 },
      { level: 3, rarity: 'great', damageMin: 36, damageMax: 40, regen: 0.6, critChance: 5, repairPerCrit: 0 },
      { level: 4, rarity: 'epic', damageMin: 47, damageMax: 52, regen: 0.8, critChance: 6.5, trueDamage: 8, repairPerCrit: 0 },
      { level: 5, rarity: 'legendary', damageMin: 58, damageMax: 63, regen: 1.2, critChance: 8, trueDamage: 13, repairPerCrit: 0 },
      { level: 6, rarity: 'mythic', damageMin: 69, damageMax: 75, regen: 1.6, critChance: 11, trueDamage: 18, repairPerCrit: 1 },
      { level: 7, rarity: 'exotic', damageMin: 86, damageMax: 92, regen: 2.0, critChance: 14, trueDamage: 25, repairPerCrit: 2 },
    ],
  },

  // --- КАСКИ ---
  medical_helmet: {
    id: 'medical_helmet',
    name: 'Медицинська каска',
    slot: 'helmet',
    setName: 'medical',
    baseDurability: 80,
    levels: [
      { level: 1, rarity: 'common', regen: 0.7, defense: 0.8, maxHp: 8, repairPerCrit: 0 },
      { level: 2, rarity: 'good', regen: 1.4, defense: 1.6, maxHp: 16, repairPerCrit: 0 },
      { level: 3, rarity: 'great', regen: 2.1, defense: 2.4, maxHp: 24, repairPerCrit: 0 },
      { level: 4, rarity: 'epic', regen: 2.8, defense: 3.2, maxHp: 32, repairPerCrit: 0 },
      { level: 5, rarity: 'legendary', regen: 3.6, defense: 4.2, maxHp: 42, repairPerCrit: 0 },
      { level: 6, rarity: 'mythic', regen: 4.4, defense: 5.5, maxHp: 55, repairPerCrit: 1 },
      { level: 7, rarity: 'exotic', regen: 5.4, defense: 7, maxHp: 70, repairPerCrit: 2 },
    ],
  },
  bandana: {
    id: 'bandana',
    name: 'Бандана',
    slot: 'helmet',
    setName: 'summer',
    baseDurability: 80,
    levels: [
      { level: 1, rarity: 'common', regen: 0.3, defense: 0.3, maxHp: 3, dodgeChance: 0.4, repairPerCrit: 0 },
      { level: 2, rarity: 'good', regen: 0.6, defense: 0.6, maxHp: 6, dodgeChance: 0.8, repairPerCrit: 0 },
      { level: 3, rarity: 'great', regen: 0.9, defense: 0.9, maxHp: 9, dodgeChance: 1.2, repairPerCrit: 0 },
      { level: 4, rarity: 'epic', regen: 1.2, defense: 1.2, maxHp: 12, dodgeChance: 1.6, repairPerCrit: 0 },
      { level: 5, rarity: 'legendary', regen: 1.6, defense: 1.6, maxHp: 16, dodgeChance: 2.1, repairPerCrit: 0 },
      { level: 6, rarity: 'mythic', regen: 2.2, defense: 2.2, maxHp: 22, dodgeChance: 2.7, repairPerCrit: 1 },
      { level: 7, rarity: 'exotic', regen: 3.2, defense: 3.2, maxHp: 32, dodgeChance: 3.5, repairPerCrit: 2 },
    ],
  },
  combat_helmet: {
    id: 'combat_helmet',
    name: 'Бронешолом',
    slot: 'helmet',
    setName: 'juggernaut',
    baseDurability: 80,
    levels: [
      { level: 1, rarity: 'common', defense: 1.5, regen: 0.2, maxHp: 15, repairPerCrit: 0 },
      { level: 2, rarity: 'good', defense: 3, regen: 0.4, maxHp: 30, repairPerCrit: 0 },
      { level: 3, rarity: 'great', defense: 4.5, regen: 0.6, maxHp: 45, repairPerCrit: 0 },
      { level: 4, rarity: 'epic', defense: 6, regen: 0.8, maxHp: 60, repairPerCrit: 0 },
      { level: 5, rarity: 'legendary', defense: 7.7, regen: 1.1, maxHp: 77, repairPerCrit: 0 },
      { level: 6, rarity: 'mythic', defense: 9.7, regen: 1.4, maxHp: 97, repairPerCrit: 1 },
      { level: 7, rarity: 'exotic', defense: 12.2, regen: 1.9, maxHp: 122, repairPerCrit: 2 },
    ],
  },

  // --- АМУЛЕТИ ---
  healing_necklace: {
    id: 'healing_necklace',
    name: 'Цілюще намисто',
    slot: 'amulet',
    setName: 'medical',
    baseDurability: 80,
    levels: [
      { level: 1, rarity: 'common', regen: 0.9, repairPerCrit: 0 },
      { level: 2, rarity: 'good', regen: 1.8, repairPerCrit: 0 },
      { level: 3, rarity: 'great', regen: 2.7, repairPerCrit: 0 },
      { level: 4, rarity: 'epic', regen: 3.6, repairPerCrit: 0 },
      { level: 5, rarity: 'legendary', regen: 4.5, medHealingBonus: 1, repairPerCrit: 0 },
      { level: 6, rarity: 'mythic', regen: 5.6, medHealingBonus: 3, repairPerCrit: 1 },
      { level: 7, rarity: 'exotic', regen: 7, medHealingBonus: 6, vampirism: 4, repairPerCrit: 2 },
    ],
  },
  shark_necklace: {
    id: 'shark_necklace',
    name: 'Акуляче кольє',
    slot: 'amulet',
    setName: 'summer',
    baseDurability: 80,
    levels: [
      { level: 1, rarity: 'common', dodgeChance: 0.6, repairPerCrit: 0 },
      { level: 2, rarity: 'good', dodgeChance: 1.2, repairPerCrit: 0 },
      { level: 3, rarity: 'great', dodgeChance: 1.8, repairPerCrit: 0 },
      { level: 4, rarity: 'epic', dodgeChance: 2.4, repairPerCrit: 0 },
      { level: 5, rarity: 'legendary', dodgeChance: 3.2, reflection: 1.5, repairPerCrit: 0 },
      { level: 6, rarity: 'mythic', dodgeChance: 4, reflection: 4, repairPerCrit: 1 },
      { level: 7, rarity: 'exotic', dodgeChance: 5, reflection: 8.5, repairPerCrit: 2 },
    ],
  },
  void_amulet: {
    id: 'void_amulet',
    name: 'Амулет войда',
    slot: 'amulet',
    setName: 'juggernaut',
    baseDurability: 80,
    levels: [
      { level: 1, rarity: 'common', defense: 1.6, repairPerCrit: 0 },
      { level: 2, rarity: 'good', defense: 3.2, repairPerCrit: 0 },
      { level: 3, rarity: 'great', defense: 4.8, repairPerCrit: 0 },
      { level: 4, rarity: 'epic', defense: 6.4, repairPerCrit: 0 },
      { level: 5, rarity: 'legendary', defense: 8.2, blockChance: 2, repairPerCrit: 0 },
      { level: 6, rarity: 'mythic', defense: 10.3, blockChance: 5, repairPerCrit: 1 },
      { level: 7, rarity: 'exotic', defense: 12.9, blockChance: 10, repairPerCrit: 2 },
    ],
  },

  // --- НАГРУДНИКИ ---
  medical_gown: {
    id: 'medical_gown',
    name: 'Медицинський халат',
    slot: 'chest',
    setName: 'medical',
    baseDurability: 80,
    levels: [
      { level: 1, rarity: 'common', regen: 1.3, defense: 1.6, maxHp: 16, repairPerCrit: 0 },
      { level: 2, rarity: 'good', regen: 2.6, defense: 3.2, maxHp: 32, repairPerCrit: 0 },
      { level: 3, rarity: 'great', regen: 3.9, defense: 5, maxHp: 50, repairPerCrit: 0 },
      { level: 4, rarity: 'epic', regen: 5.2, defense: 7, maxHp: 70, medHealingBonus: 1, repairPerCrit: 0 },
      { level: 5, rarity: 'legendary', regen: 6.6, defense: 9, maxHp: 90, medHealingBonus: 2.5, repairPerCrit: 0 },
      { level: 6, rarity: 'mythic', regen: 8.2, defense: 11.6, maxHp: 116, medHealingBonus: 4.5, vampirism: 1.5, repairPerCrit: 1 },
      { level: 7, rarity: 'exotic', regen: 10.2, defense: 14, maxHp: 140, medHealingBonus: 7, vampirism: 4, repairPerCrit: 2 },
    ],
  },
  tshirt: {
    id: 'tshirt',
    name: 'Футболка',
    slot: 'chest',
    setName: 'summer',
    baseDurability: 80,
    levels: [
      { level: 1, rarity: 'common', defense: 0.7, regen: 0.7, maxHp: 7, dodgeChance: 0.9, repairPerCrit: 0 },
      { level: 2, rarity: 'good', defense: 1.4, regen: 1.4, maxHp: 14, dodgeChance: 1.8, repairPerCrit: 0 },
      { level: 3, rarity: 'great', defense: 2.1, regen: 2.1, maxHp: 21, dodgeChance: 2.7, repairPerCrit: 0 },
      { level: 4, rarity: 'epic', defense: 2.8, regen: 2.8, maxHp: 28, dodgeChance: 3.6, repairPerCrit: 0 },
      { level: 5, rarity: 'legendary', defense: 3.9, regen: 3.9, maxHp: 39, dodgeChance: 4.7, reflection: 3, repairPerCrit: 0 },
      { level: 6, rarity: 'mythic', defense: 5.1, regen: 5.1, maxHp: 51, dodgeChance: 6.1, reflection: 7, repairPerCrit: 1 },
      { level: 7, rarity: 'exotic', defense: 6.5, regen: 6.5, maxHp: 65, dodgeChance: 8.1, reflection: 12, repairPerCrit: 2 },
    ],
  },
  body_armor: {
    id: 'body_armor',
    name: 'Бронежилет',
    slot: 'chest',
    setName: 'juggernaut',
    baseDurability: 80,
    levels: [
      { level: 1, rarity: 'common', defense: 1.9, regen: 0.6, maxHp: 19, repairPerCrit: 0 },
      { level: 2, rarity: 'good', defense: 3.8, regen: 1.2, maxHp: 38, repairPerCrit: 0 },
      { level: 3, rarity: 'great', defense: 5.7, regen: 1.8, maxHp: 57, repairPerCrit: 0 },
      { level: 4, rarity: 'epic', defense: 7.6, regen: 2.4, maxHp: 76, repairPerCrit: 0 },
      { level: 5, rarity: 'legendary', defense: 9.8, regen: 3.2, maxHp: 98, blockChance: 3, repairPerCrit: 0 },
      { level: 6, rarity: 'mythic', defense: 12.4, regen: 4.1, maxHp: 124, blockChance: 7, repairPerCrit: 1 },
      { level: 7, rarity: 'exotic', defense: 15.6, regen: 5.3, maxHp: 156, blockChance: 12, repairPerCrit: 2 },
    ],
  },

  // --- ШТАНИ ---
  medical_pants: {
    id: 'medical_pants',
    name: 'Медицинські штани',
    slot: 'pants',
    setName: 'medical',
    baseDurability: 80,
    levels: [
      { level: 1, rarity: 'common', regen: 1, defense: 1.3, maxHp: 13, repairPerCrit: 0 },
      { level: 2, rarity: 'good', regen: 2, defense: 2.6, maxHp: 26, repairPerCrit: 0 },
      { level: 3, rarity: 'great', regen: 3, defense: 3.9, maxHp: 39, repairPerCrit: 0 },
      { level: 4, rarity: 'epic', regen: 4, defense: 5.2, maxHp: 52, repairPerCrit: 0 },
      { level: 5, rarity: 'legendary', regen: 5.2, defense: 6.8, maxHp: 68, repairPerCrit: 0 },
      { level: 6, rarity: 'mythic', regen: 6.5, defense: 8.6, maxHp: 86, repairPerCrit: 1 },
      { level: 7, rarity: 'exotic', regen: 8, defense: 11, maxHp: 110, repairPerCrit: 2 },
    ],
  },
  shorts: {
    id: 'shorts',
    name: 'Шорти',
    slot: 'pants',
    setName: 'summer',
    baseDurability: 80,
    levels: [
      { level: 1, rarity: 'common', regen: 0.6, defense: 0.6, maxHp: 6, dodgeChance: 0.8, repairPerCrit: 0 },
      { level: 2, rarity: 'good', regen: 1.2, defense: 1.2, maxHp: 12, dodgeChance: 1.6, repairPerCrit: 0 },
      { level: 3, rarity: 'great', regen: 1.8, defense: 1.8, maxHp: 18, dodgeChance: 2.4, repairPerCrit: 0 },
      { level: 4, rarity: 'epic', regen: 2.4, defense: 2.4, maxHp: 24, dodgeChance: 3.2, repairPerCrit: 0 },
      { level: 5, rarity: 'legendary', regen: 3.2, defense: 3.2, maxHp: 32, dodgeChance: 4.3, repairPerCrit: 0 },
      { level: 6, rarity: 'mythic', regen: 4.2, defense: 4.2, maxHp: 42, dodgeChance: 5.7, repairPerCrit: 1 },
      { level: 7, rarity: 'exotic', regen: 5.4, defense: 5.4, maxHp: 54, dodgeChance: 7.3, repairPerCrit: 2 },
    ],
  },
  combat_pants: {
    id: 'combat_pants',
    name: 'Бронештани',
    slot: 'pants',
    setName: 'juggernaut',
    baseDurability: 80,
    levels: [
      { level: 1, rarity: 'common', defense: 1.7, regen: 0.4, maxHp: 17, repairPerCrit: 0 },
      { level: 2, rarity: 'good', defense: 3.4, regen: 0.8, maxHp: 34, repairPerCrit: 0 },
      { level: 3, rarity: 'great', defense: 5.1, regen: 1.2, maxHp: 51, repairPerCrit: 0 },
      { level: 4, rarity: 'epic', defense: 6.8, regen: 1.6, maxHp: 68, repairPerCrit: 0 },
      { level: 5, rarity: 'legendary', defense: 8.7, regen: 2.1, maxHp: 87, repairPerCrit: 0 },
      { level: 6, rarity: 'mythic', defense: 10.9, regen: 2.7, maxHp: 109, repairPerCrit: 1 },
      { level: 7, rarity: 'exotic', defense: 13.6, regen: 3.5, maxHp: 136, repairPerCrit: 2 },
    ],
  },

  // --- ВЗУТТЯ ---
  shoes: {
    id: 'shoes',
    name: 'Туфлі',
    slot: 'boots',
    setName: 'medical',
    baseDurability: 80,
    levels: [
      { level: 1, rarity: 'common', regen: 0.5, defense: 0.6, maxHp: 6, repairPerCrit: 0 },
      { level: 2, rarity: 'good', regen: 1, defense: 1.2, maxHp: 12, repairPerCrit: 0 },
      { level: 3, rarity: 'great', regen: 1.5, defense: 1.8, maxHp: 18, repairPerCrit: 0 },
      { level: 4, rarity: 'epic', regen: 2, defense: 2.4, maxHp: 24, repairPerCrit: 0 },
      { level: 5, rarity: 'legendary', regen: 2.6, defense: 3.2, maxHp: 32, repairPerCrit: 0 },
      { level: 6, rarity: 'mythic', regen: 3.4, defense: 4.2, maxHp: 42, repairPerCrit: 1 },
      { level: 7, rarity: 'exotic', regen: 4.5, defense: 5.6, maxHp: 56, repairPerCrit: 2 },
    ],
  },
  crocs: {
    id: 'crocs',
    name: 'Крокси',
    slot: 'boots',
    setName: 'summer',
    baseDurability: 80,
    levels: [
      { level: 1, rarity: 'common', regen: 0.2, defense: 0.2, maxHp: 2, dodgeChance: 0.3, repairPerCrit: 0 },
      { level: 2, rarity: 'good', regen: 0.4, defense: 0.4, maxHp: 4, dodgeChance: 0.6, repairPerCrit: 0 },
      { level: 3, rarity: 'great', regen: 0.6, defense: 0.6, maxHp: 6, dodgeChance: 0.9, repairPerCrit: 0 },
      { level: 4, rarity: 'epic', regen: 0.8, defense: 0.8, maxHp: 8, dodgeChance: 1.2, repairPerCrit: 0 },
      { level: 5, rarity: 'legendary', regen: 1.1, defense: 1.1, maxHp: 11, dodgeChance: 1.6, repairPerCrit: 0 },
      { level: 6, rarity: 'mythic', regen: 1.5, defense: 1.5, maxHp: 15, dodgeChance: 2.2, repairPerCrit: 1 },
      { level: 7, rarity: 'exotic', regen: 2.1, defense: 2.1, maxHp: 21, dodgeChance: 3, repairPerCrit: 2 },
    ],
  },
  boots: {
    id: 'boots',
    name: 'Берци',
    slot: 'boots',
    setName: 'juggernaut',
    baseDurability: 80,
    levels: [
      { level: 1, rarity: 'common', defense: 1.3, regen: 0.1, maxHp: 13, repairPerCrit: 0 },
      { level: 2, rarity: 'good', defense: 2.6, regen: 0.2, maxHp: 26, repairPerCrit: 0 },
      { level: 3, rarity: 'great', defense: 3.9, regen: 0.3, maxHp: 39, repairPerCrit: 0 },
      { level: 4, rarity: 'epic', defense: 5.2, regen: 0.4, maxHp: 52, repairPerCrit: 0 },
      { level: 5, rarity: 'legendary', defense: 6.7, regen: 0.6, maxHp: 67, repairPerCrit: 0 },
      { level: 6, rarity: 'mythic', defense: 8.5, regen: 0.8, maxHp: 84, repairPerCrit: 1 },
      { level: 7, rarity: 'exotic', defense: 10.8, regen: 1.3, maxHp: 108, repairPerCrit: 2 },
    ],
  },
};

// Вартість покращення екіпіровки між рівнями
export const EQUIPMENT_UPGRADE_COSTS: Record<number, Record<string, number>> = {
  2: { scroll: 20, rainbow_stone: 1, tokens: 20000 },
  3: { scroll: 50, rainbow_stone: 2, bone: 15, fire_rod: 5, tokens: 50000 },
  4: { scroll: 125, rainbow_stone: 2, bone: 50, fire_rod: 15, tokens: 150000 },
  5: { scroll: 300, rainbow_stone: 4, bone: 180, fire_rod: 50, basalt_slab: 10, tokens: 500000 },
  6: { scroll: 650, rainbow_stone: 10, bone: 450, fire_rod: 170, basalt_slab: 25, tokens: 1350000 },
  7: { scroll: 2000, rainbow_stone: 35, bone: 1100, fire_rod: 430, basalt_slab: 70, mutagen_capsule: 25, tokens: 3500000 },
};