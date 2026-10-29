export interface BossConfig {
  id: string;
  name: string;
  emoji: string;
  category: 'zombies' | 'mages' | 'demons' | 'trolls';
  isLord: boolean;
  hp: number;
  regen: number;
  armor: number; // відсоток захисту
  missChance: number;
  dodgeChance: number;
  critChance: number;
  damageMin: number;
  damageMax: number;
  respawnTimeSeconds: number;
  requiredPlayerLevel: number;
  tokenMultiplier: number; // жетони за 1 од. урону
  drops: {
    materials?: { item: string; min: number; max: number; chance: number }[];
    cases?: { type: string; min: number; max: number; chance: number }[];
    equipmentChestChance: number;
    medalsChance: number;
  };
}

export const BOSSES_CONFIG: BossConfig[] = [
  // --- ЗОМБІ (Кістки) ---
  {
    id: 'rotten_marauder',
    name: 'Гнилий Мародер',
    emoji: '🧟',
    category: 'zombies',
    isLord: false,
    hp: 900,
    regen: 0.1,
    armor: 3,
    missChance: 5,
    dodgeChance: 5,
    critChance: 10,
    damageMin: 3,
    damageMax: 3,
    respawnTimeSeconds: 600, // 10 хв
    requiredPlayerLevel: 10,
    tokenMultiplier: 4,
    drops: {
      materials: [{ item: 'bone', min: 1, max: 4, chance: 0.3 }],
      cases: [{ type: 'common', min: 1, max: 1, chance: 0.1 }],
      equipmentChestChance: 0.03,
      medalsChance: 0.3,
    },
  },
  {
    id: 'necrotic_catacat',
    name: 'Некротичний Катакат',
    emoji: '🐱‍👤',
    category: 'zombies',
    isLord: false,
    hp: 1200,
    regen: 0.2,
    armor: 3,
    missChance: 5,
    dodgeChance: 5,
    critChance: 10,
    damageMin: 4,
    damageMax: 4,
    respawnTimeSeconds: 1200, // 20 хв
    requiredPlayerLevel: 10,
    tokenMultiplier: 4,
    drops: {
      materials: [{ item: 'bone', min: 1, max: 4, chance: 0.3 }],
      cases: [{ type: 'common', min: 1, max: 1, chance: 0.1 }],
      equipmentChestChance: 0.03,
      medalsChance: 0.3,
    },
  },
  {
    id: 'plague_general',
    name: 'Генерал Чуми',
    emoji: '🤢',
    category: 'zombies',
    isLord: false,
    hp: 1650,
    regen: 0.3,
    armor: 4,
    missChance: 5,
    dodgeChance: 5,
    critChance: 10,
    damageMin: 4,
    damageMax: 5,
    respawnTimeSeconds: 1800, // 30 хв
    requiredPlayerLevel: 15,
    tokenMultiplier: 4,
    drops: {
      materials: [{ item: 'bone', min: 1, max: 4, chance: 0.3 }],
      cases: [{ type: 'common', min: 1, max: 1, chance: 0.1 }],
      equipmentChestChance: 0.03,
      medalsChance: 0.3,
    },
  },
  {
    id: 'titan_gravedigger',
    name: 'Титан Могильник [ЛОРД]',
    emoji: '💀⛏️',
    category: 'zombies',
    isLord: true,
    hp: 4500,
    regen: 0.5,
    armor: 10,
    missChance: 5,
    dodgeChance: 5,
    critChance: 10,
    damageMin: 7,
    damageMax: 8,
    respawnTimeSeconds: 2400, // 40 хв
    requiredPlayerLevel: 20,
    tokenMultiplier: 4,
    drops: {
      materials: [{ item: 'bone', min: 3, max: 6, chance: 0.5 }],
      cases: [{ type: 'common', min: 1, max: 1, chance: 0.2 }],
      equipmentChestChance: 0.05,
      medalsChance: 0.3,
    },
  },

  // --- ЧАКЛУНИ (Сувої) ---
  {
    id: 'eclipse_occultist',
    name: 'Окультист Затемнення',
    emoji: '🌑🔮',
    category: 'mages',
    isLord: false,
    hp: 3100,
    regen: 1.0,
    armor: 7,
    missChance: 5,
    dodgeChance: 10,
    critChance: 10,
    damageMin: 6,
    damageMax: 8,
    respawnTimeSeconds: 3600, // 1 год
    requiredPlayerLevel: 25,
    tokenMultiplier: 4,
    drops: {
      materials: [{ item: 'scroll', min: 3, max: 5, chance: 0.2 }],
      cases: [
        { type: 'common', min: 1, max: 1, chance: 0.2 },
        { type: 'rare', min: 1, max: 1, chance: 0.05 },
      ],
      equipmentChestChance: 0.05,
      medalsChance: 0.3,
    },
  },
  {
    id: 'dark_ritual_priest',
    name: 'Жрець Темних Ритуалів',
    emoji: '🕯️🩸',
    category: 'mages',
    isLord: false,
    hp: 4350,
    regen: 1.5,
    armor: 8,
    missChance: 5,
    dodgeChance: 10,
    critChance: 10,
    damageMin: 9,
    damageMax: 11,
    respawnTimeSeconds: 4800, // 1 год 20 хв
    requiredPlayerLevel: 30,
    tokenMultiplier: 4,
    drops: {
      materials: [{ item: 'scroll', min: 3, max: 5, chance: 0.2 }],
      cases: [
        { type: 'common', min: 1, max: 1, chance: 0.2 },
        { type: 'rare', min: 1, max: 1, chance: 0.05 },
      ],
      equipmentChestChance: 0.05,
      medalsChance: 0.3,
    },
  },
  {
    id: 'forbidden_runes_master',
    name: 'Майстер Заборонених Рун',
    emoji: '🔺✨',
    category: 'mages',
    isLord: false,
    hp: 6000,
    regen: 1.5,
    armor: 7,
    missChance: 5,
    dodgeChance: 10,
    critChance: 10,
    damageMin: 12,
    damageMax: 14,
    respawnTimeSeconds: 6000, // 1 год 40 хв
    requiredPlayerLevel: 35,
    tokenMultiplier: 4,
    drops: {
      materials: [{ item: 'scroll', min: 3, max: 5, chance: 0.2 }],
      cases: [
        { type: 'common', min: 1, max: 1, chance: 0.2 },
        { type: 'rare', min: 1, max: 1, chance: 0.05 },
      ],
      equipmentChestChance: 0.05,
      medalsChance: 0.3,
    },
  },
  {
    id: 'abyss_lord',
    name: 'Повелитель Безодні [ЛОРД]',
    emoji: '🌀👁️',
    category: 'mages',
    isLord: true,
    hp: 10500,
    regen: 2.0,
    armor: 15,
    missChance: 2,
    dodgeChance: 10,
    critChance: 10,
    damageMin: 18,
    damageMax: 22,
    respawnTimeSeconds: 7200, // 2 год
    requiredPlayerLevel: 40,
    tokenMultiplier: 4,
    drops: {
      materials: [{ item: 'scroll', min: 5, max: 8, chance: 0.35 }],
      cases: [{ type: 'common', min: 1, max: 1, chance: 0.3 }],
      equipmentChestChance: 0.10,
      medalsChance: 0.3,
    },
  },

  // --- ДЕМОНИ (Вогняні стержні) ---
  {
    id: 'ignis_imp',
    name: 'Ігніс-Імпець',
    emoji: '👺🔥',
    category: 'demons',
    isLord: false,
    hp: 9900,
    regen: 4.0,
    armor: 10,
    missChance: 3,
    dodgeChance: 5,
    critChance: 10,
    damageMin: 16,
    damageMax: 20,
    respawnTimeSeconds: 9000, // 2 год 30 хв
    requiredPlayerLevel: 50,
    tokenMultiplier: 5,
    drops: {
      materials: [{ item: 'fire_rod', min: 1, max: 2, chance: 0.2 }],
      cases: [
        { type: 'common', min: 1, max: 3, chance: 0.2 },
        { type: 'rare', min: 1, max: 1, chance: 0.05 },
      ],
      equipmentChestChance: 0.08,
      medalsChance: 0.3,
    },
  },
  {
    id: 'flame_prince',
    name: "Князь Полум'я",
    emoji: '🔥👑',
    category: 'demons',
    isLord: false,
    hp: 13200,
    regen: 5.0,
    armor: 10,
    missChance: 3,
    dodgeChance: 10,
    critChance: 10,
    damageMin: 24,
    damageMax: 28,
    respawnTimeSeconds: 10800, // 3 год
    requiredPlayerLevel: 60,
    tokenMultiplier: 5,
    drops: {
      materials: [{ item: 'fire_rod', min: 1, max: 2, chance: 0.2 }],
      cases: [
        { type: 'common', min: 1, max: 3, chance: 0.2 },
        { type: 'rare', min: 1, max: 1, chance: 0.05 },
      ],
      equipmentChestChance: 0.08,
      medalsChance: 0.3,
    },
  },
  {
    id: 'hell_executioner',
    name: 'Пекельний Кат',
    emoji: '⚔️💀',
    category: 'demons',
    isLord: false,
    hp: 20800,
    regen: 6.0,
    armor: 11,
    missChance: 3,
    dodgeChance: 10,
    critChance: 10,
    damageMin: 32,
    damageMax: 36,
    respawnTimeSeconds: 12600, // 3 год 30 хв
    requiredPlayerLevel: 70,
    tokenMultiplier: 5,
    drops: {
      materials: [{ item: 'fire_rod', min: 1, max: 2, chance: 0.2 }],
      cases: [
        { type: 'common', min: 1, max: 3, chance: 0.2 },
        { type: 'rare', min: 1, max: 1, chance: 0.05 },
      ],
      equipmentChestChance: 0.08,
      medalsChance: 0.3,
    },
  },
  {
    id: 'archdemon_vulcan',
    name: 'Архідемон Вулкан [ЛОРД]',
    emoji: '🌋😈',
    category: 'demons',
    isLord: true,
    hp: 32500,
    regen: 8.0,
    armor: 17,
    missChance: 2,
    dodgeChance: 10,
    critChance: 18,
    damageMin: 52,
    damageMax: 58,
    respawnTimeSeconds: 14400, // 4 год
    requiredPlayerLevel: 80,
    tokenMultiplier: 5,
    drops: {
      materials: [{ item: 'fire_rod', min: 2, max: 4, chance: 0.35 }],
      cases: [
        { type: 'common', min: 1, max: 3, chance: 0.3 },
        { type: 'rare', min: 1, max: 2, chance: 0.1 },
      ],
      equipmentChestChance: 0.12,
      medalsChance: 0.3,
    },
  },

  // --- КАМ'ЯНІ ТРОЛІ (Базальтові пластини) ---
  {
    id: 'granite_destroyer',
    name: 'Гранітний Руйнівник',
    emoji: '🪨💥',
    category: 'trolls',
    isLord: false,
    hp: 28000,
    regen: 8.0,
    armor: 20,
    missChance: 13,
    dodgeChance: 2,
    critChance: 20,
    damageMin: 50,
    damageMax: 56,
    respawnTimeSeconds: 17100, // 4 год 45 хв
    requiredPlayerLevel: 90,
    tokenMultiplier: 6.5,
    drops: {
      materials: [{ item: 'basalt_slab', min: 1, max: 2, chance: 0.05 }],
      cases: [
        { type: 'common', min: 1, max: 3, chance: 0.4 },
        { type: 'rare', min: 1, max: 2, chance: 0.2 },
      ],
      equipmentChestChance: 0.24, // 1-2 ящики (по 12%)
      medalsChance: 0.3,
    },
  },
  {
    id: 'orevein_breaker',
    name: 'Рудожильний Брейкер',
    emoji: '⛏️🪨',
    category: 'trolls',
    isLord: false,
    hp: 37800,
    regen: 9.0,
    armor: 22,
    missChance: 13,
    dodgeChance: 2,
    critChance: 20,
    damageMin: 62,
    damageMax: 68,
    respawnTimeSeconds: 19800, // 5 год 30 хв
    requiredPlayerLevel: 100,
    tokenMultiplier: 6.5,
    drops: {
      materials: [{ item: 'basalt_slab', min: 1, max: 2, chance: 0.05 }],
      cases: [
        { type: 'common', min: 1, max: 3, chance: 0.4 },
        { type: 'rare', min: 1, max: 2, chance: 0.2 },
      ],
      equipmentChestChance: 0.24,
      medalsChance: 0.3,
    },
  },
  {
    id: 'obsidian_guard',
    name: 'Обсидіановий Страж',
    emoji: '🛡️⚫',
    category: 'trolls',
    isLord: false,
    hp: 49300,
    regen: 10.0,
    armor: 22,
    missChance: 13,
    dodgeChance: 2,
    critChance: 20,
    damageMin: 74,
    damageMax: 80,
    respawnTimeSeconds: 22500, // 6 год 15 хв
    requiredPlayerLevel: 110,
    tokenMultiplier: 6.5,
    drops: {
      materials: [{ item: 'basalt_slab', min: 1, max: 2, chance: 0.05 }],
      cases: [
        { type: 'common', min: 1, max: 3, chance: 0.4 },
        { type: 'rare', min: 1, max: 2, chance: 0.2 },
      ],
      equipmentChestChance: 0.24,
      medalsChance: 0.3,
    },
  },
  {
    id: 'tectonic_colossus',
    name: 'Тектонічний Колос [ЛОРД]',
    emoji: '🗿⛰️',
    category: 'trolls',
    isLord: true,
    hp: 72000,
    regen: 12.0,
    armor: 30,
    missChance: 15,
    dodgeChance: 0,
    critChance: 26,
    damageMin: 92,
    damageMax: 108,
    respawnTimeSeconds: 25200, // 7 год
    requiredPlayerLevel: 120,
    tokenMultiplier: 6.5,
    drops: {
      materials: [{ item: 'basalt_slab', min: 2, max: 3, chance: 0.08 }],
      cases: [
        { type: 'rare', min: 1, max: 3, chance: 0.3 },
        { type: 'epic', min: 1, max: 1, chance: 0.15 },
      ],
      equipmentChestChance: 0.36, // 1-2 ящики (по 18%)
      medalsChance: 0.3,
    },
  },
];