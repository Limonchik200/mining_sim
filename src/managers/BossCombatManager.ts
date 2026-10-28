import { BossConfig } from '../config/bosses/bossesConfig';
import { PLAYER_CONFIG } from '../config/progression/playerConfig';
import { BOSS_EQUIPMENT_CONFIG, EquipmentItemConfig } from '../config/bossEquipment/equipmentConfig';

export interface PlayerStats {
  level: number;
  hp: number;
  maxHp: number;
  regen: number; // ХП за тік (тік = 3с)
  tokens: number;
  medals: number;
  experience: number;
  equipped: Record<string, { itemId: string; level: number; durability: number }>; // 6 слотів
  upgrades: {
    hpLevel: number;
    regenLevel: number;
    dodgeLevel: number;
  };
}

export interface CombatResult {
  playerDamage: number;
  bossDamage: number;
  isPlayerCrit: boolean;
  isBossCrit: boolean;
  playerMissed: boolean;
  bossMissed: boolean;
  playerDodge: boolean;
  bossDodge: boolean;
  playerStunnedBoss: boolean;
  bossBlocked: boolean;
  vampireHeal: number;
  reflectionDamage: number;
  durabilityLost: Record<string, number>;
  tokensEarned: number;
  expEarned: number;
  battleEnded: boolean;
  playerWon: boolean;
}

export class BossCombatManager {
  /**
   * Розрахунок сумарних бонусів від екіпіровки та прокачки гравця
   */
  public static calculatePlayerTotalStats(player: PlayerStats) {
    let totalMaxHp = PLAYER_CONFIG.baseHp + player.upgrades.hpLevel * PLAYER_CONFIG.hpPerLevel;
    let totalRegen = PLAYER_CONFIG.baseRegen + player.upgrades.regenLevel * PLAYER_CONFIG.regenPerLevel;
    let totalDefense = 0;
    let totalCritChance = 0;
    let totalVampirism = 0;
    let totalTrueDamage = 0;
    let totalStunChance = 0;
    let totalDodge = PLAYER_CONFIG.baseDodgeChance + player.upgrades.dodgeLevel * PLAYER_CONFIG.dodgePerLevel;
    let totalBlock = 0;
    let totalReflection = 0;
    let weaponDamageMin = PLAYER_CONFIG.baseDamageMin;
    let weaponDamageMax = PLAYER_CONFIG.baseDamageMax;

    // Перевіряємо надіту екіпіровку
    for (const [slot, eqData] of Object.entries(player.equipped)) {
      if (!eqData) continue;
      const itemConfig = BOSS_EQUIPMENT_CONFIG[eqData.itemId];
      if (!itemConfig) continue;
      
      const levelConfig = itemConfig.levels.find(l => l.level === eqData.level);
      if (!levelConfig) continue;

      // Якщо міцність більша за 0, бонуси діють (якщо зламана — бонуси нульові)
      if (eqData.durability > 0) {
        if (levelConfig.maxHp) totalMaxHp += levelConfig.maxHp;
        if (levelConfig.regen) totalRegen += levelConfig.regen;
        if (levelConfig.defense) totalDefense += levelConfig.defense;
        if (levelConfig.critChance) totalCritChance += levelConfig.critChance;
        if (levelConfig.vampirism) totalVampirism += levelConfig.vampirism;
        if (levelConfig.trueDamage) totalTrueDamage += levelConfig.trueDamage;
        if (levelConfig.stunChance) totalStunChance += levelConfig.stunChance;
        if (levelConfig.dodgeChance) totalDodge += levelConfig.dodgeChance;
        if (levelConfig.blockChance) totalBlock += levelConfig.blockChance;
        if (levelConfig.reflection) totalReflection += levelConfig.reflection;

        // Зброя замінює базовий урон
        if (slot === 'weapon' && levelConfig.damageMin !== undefined && levelConfig.damageMax !== undefined) {
          weaponDamageMin = levelConfig.damageMin;
          weaponDamageMax = levelConfig.damageMax;
        }
      }
    }

    return {
      maxHp: Number(totalMaxHp.toFixed(1)),
      regen: Number(totalRegen.toFixed(1)),
      defense: Number(totalDefense.toFixed(1)),
      critChance: Number(totalCritChance.toFixed(1)),
      vampirism: Number(totalVampirism.toFixed(1)),
      trueDamage: Number(totalTrueDamage.toFixed(1)),
      stunChance: Number(totalStunChance.toFixed(1)),
      dodge: Number(totalDodge.toFixed(1)),
      block: Number(totalBlock.toFixed(1)),
      reflection: Number(totalReflection.toFixed(1)),
      damageMin: weaponDamageMin,
      damageMax: weaponDamageMax,
    };
  }

  /**
   * Один раунд бою (1 удар гравця -> 1 удар боса)
   */
  public static processAttackRound(
    player: PlayerStats,
    boss: BossConfig,
    currentBossHp: number
  ): { result: CombatResult; newBossHp: number; newPlayerHp: number } {
    const pStats = this.calculatePlayerTotalStats(player);
    let playerHp = player.hp;
    let bossHp = currentBossHp;

    const durabilityLost: Record<string, number> = {};
    let tokensEarned = 0;
    let expEarned = 0;

    // --- 1. АТАКА ГРАВЦЯ ---
    let playerMissed = Math.random() * 100 < PLAYER_CONFIG.baseMissChance;
    let bossDodge = Math.random() * 100 < boss.dodgeChance;

    let rawPlayerDamage = 0;
    let isPlayerCrit = false;
    let playerStunnedBoss = false;
    let vampireHeal = 0;

    if (!playerMissed && !bossDodge) {
      // Базовий урон у діапазоні
      const baseDmg = Math.floor(Math.random() * (pStats.damageMax - pStats.damageMin + 1)) + pStats.damageMin;
      
      // Перевірка на крит (х2 урона)
      isPlayerCrit = Math.random() * 100 < pStats.critChance;
      rawPlayerDamage = isPlayerCrit ? baseDmg * 2 : baseDmg;

      // Перевірка на оглушення (якщо є на зброї)
      if (pStats.stunChance > 0) {
        playerStunnedBoss = Math.random() * 100 < pStats.stunChance;
        if (playerStunnedBoss) {
          rawPlayerDamage = Math.round(rawPlayerDamage * 1.3); // +30% урона при стані
        }
      }

      // Розрахунок бронювання боса та істинного урона
      const armorReduction = (rawPlayerDamage * boss.armor) / 100;
      let finalBossDamage = rawPlayerDamage - armorReduction;
      
      if (pStats.trueDamage > 0) {
        const mitigated = armorReduction;
        const appliedTrue = Math.min(pStats.trueDamage, mitigated);
        finalBossDamage += appliedTrue;
      }

      bossHp = Math.max(0, Number((bossHp - finalBossDamage).toFixed(1)));

      // Досвід за урон (1 урон = 1.5 досвіду)
      expEarned = Number((finalBossDamage * PLAYER_CONFIG.expPerDamage).toFixed(1));

      // Розрахунок бойових жетонів залежно від категорії боса
      if (boss.category === 'zombies' || boss.category === 'mages') {
        tokensEarned = Math.floor(finalBossDamage * boss.tokenMultiplier);
      } else if (boss.category === 'demons') {
        tokensEarned = Math.floor(finalBossDamage * boss.tokenMultiplier);
      } else if (boss.category === 'trolls') {
        // Заокруглення в меншу сторону при нельотному числі
        tokensEarned = Math.floor(finalBossDamage * boss.tokenMultiplier);
      }

      // Вампіризм
      if (pStats.vampirism > 0) {
        vampireHeal = Number(((finalBossDamage * pStats.vampirism) / 100).toFixed(1));
        playerHp = Math.min(pStats.maxHp, Number((playerHp + vampireHeal).toFixed(1)));
      }

      // Ремонт екіпіровки від критичних ударів
      if (isPlayerCrit) {
        for (const [slot, eqData] of Object.entries(player.equipped)) {
          if (!eqData) continue;
          const itemConfig = BOSS_EQUIPMENT_CONFIG[eqData.itemId];
          if (!itemConfig) continue;
          const levelConfig = itemConfig.levels.find(l => l.level === eqData.level);
          
          if (levelConfig && levelConfig.repairPerCrit && levelConfig.repairPerCrit > 0) {
            durabilityLost[slot] = -levelConfig.repairPerCrit; // від'ємне значення означає ремонт (відновлення міцності)
          }
        }
      }
    } else {
      // Якщо гравець промахнувся, міцність зі зброї не знімається
      // (логіка захисту міцності вже закладена у відсутності атаки зброї)
    }

    // --- 2. АТАКА БОСА (якщо він не оглушений) ---
    let bossDamage = 0;
    let isBossCrit = false;
    let bossMissed = false;
    let playerDodge = false;
    let bossBlocked = false;
    let reflectionDamage = 0;

    if (bossHp > 0 && !playerStunnedBoss) {
      bossMissed = Math.random() * 100 < boss.missChance;
      playerDodge = Math.random() * 100 < pStats.dodge;

      if (!bossMissed && !playerDodge) {
        const bBaseDmg = Math.floor(Math.random() * (boss.damageMax - boss.damageMin + 1)) + boss.damageMin;
        isBossCrit = Math.random() * 100 < boss.critChance;
        bossDamage = isBossCrit ? bBaseDmg * 2 : bBaseDmg;

        // Перевірка на блок щитом/бронею
        bossBlocked = Math.random() * 100 < pStats.block;
        if (bossBlocked) {
          bossDamage = 0;
        } else {
          // Зменшення урону від захисту гравця
          const playerArmorRed = (bossDamage * pStats.defense) / 100;
          bossDamage = Math.max(1, Math.round(bossDamage - playerArmorRed));

          playerHp = Math.max(0, Number((playerHp - bossDamage).toFixed(1)));
        }

        // Отраженія урона (працює на чистий урон боса)
        if (pStats.reflection > 0 && bossDamage > 0) {
          reflectionDamage = Number(((bBaseDmg * pStats.reflection) / 100).toFixed(1));
          bossHp = Math.max(0, Number((bossHp - reflectionDamage).toFixed(1)));
        }

        // Зняття міцності з екіпіровки від ударів боса
        const durDmg = isBossCrit ? 2 : 1;
        for (const slot of Object.keys(player.equipped)) {
          if (player.equipped[slot]) {
            durabilityLost[slot] = (durabilityLost[slot] || 0) + durDmg;
          }
        }
      }
    }

    const battleEnded = bossHp <= 0 || playerHp <= 0;
    const playerWon = bossHp <= 0;

    return {
      result: {
        playerDamage: Number(rawPlayerDamage.toFixed(1)),
        bossDamage,
        isPlayerCrit,
        isBossCrit,
        playerMissed,
        bossMissed,
        playerDodge,
        bossDodge,
        playerStunnedBoss,
        bossBlocked,
        vampireHeal,
        reflectionDamage,
        durabilityLost,
        tokensEarned,
        expEarned,
        battleEnded,
        playerWon,
      },
      newBossHp: bossHp,
      newPlayerHp: playerHp,
    };
  }
}