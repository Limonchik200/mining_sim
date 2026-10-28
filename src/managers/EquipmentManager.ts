import { BOSS_EQUIPMENT_CONFIG } from '../config/bossEquipment/equipmentConfig';
import { EQUIPMENT_UPGRADE_COSTS } from '../config/bossEquipment/equipmentConfig';
import { SET_BOOSTERS_CONFIG } from '../config/shop/exchangeConfig';

export interface InventoryItemInstance {
  instanceId: string;
  itemId: string;
  level: number;
  durability: number;
  maxDurability: number;
}

export class EquipmentManager {
  /**
   * Обчислює максимальну міцність предмета для заданого рівня (80 на 1 рівні, х2 на кожному наступному)
   */
  public static getMaxDurability(level: number): number {
    let base = 80;
    for (let i = 2; i <= level; i++) {
      base *= 2;
    }
    return base;
  }

  /**
   * Перевірка чи вистачає ресурсів та жетонів для прокачки екіпіровки на наступний рівень
   */
  public static canUpgradeEquipment(
    currentLevel: number,
    playerResources: Record<string, number>
  ): { success: boolean; missing: Record<string, number> } {
    const nextLevel = currentLevel + 1;
    const costs = EQUIPMENT_UPGRADE_COSTS[nextLevel];
    
    if (!costs) {
      return { success: false, missing: { maxLevelReached: 1 } };
    }

    const missing: Record<string, number> = {};
    let hasAll = true;

    for (const [resKey, requiredAmount] of Object.entries(costs)) {
      const playerAmount = playerResources[resKey] || 0;
      if (playerAmount < requiredAmount) {
        missing[resKey] = requiredAmount - playerAmount;
        hasAll = false;
      }
    }

    return { success: hasAll, missing };
  }

  /**
   * Вартість ремонту шмотки за бойові жетони (25 жетонів за 1 од. міцності)
   */
  public static getRepairCost(currentDurability: number, maxDurability: number): { missingDurability: number; tokenCost: number } {
    const missingDurability = Math.max(0, maxDurability - currentDurability);
    const tokenCost = missingDurability * 25;
    return { missingDurability, tokenCost };
  }

  /**
   * Перевірка активації сетів та бустів
   */
  public static checkSetBonuses(
    equippedItems: Record<string, { itemId: string; level: number; durability: number } | null>,
    boostsApplied: Record<string, boolean> // чи активований буст для сету
  ) {
    const setCounts: Record<string, number> = { medical: 0, summer: 0, juggernaut: 0 };

    for (const eqData of Object.values(equippedItems)) {
      if (!eqData || eqData.durability <= 0) continue; // Зламана шмотка не дає бонусів сету
      const itemConfig = BOSS_EQUIPMENT_CONFIG[eqData.itemId];
      if (itemConfig && itemConfig.setName) {
        setCounts[itemConfig.setName] = (setCounts[itemConfig.setName] || 0) + 1;
      }
    }

    let activeBonuses = {
      extraRegen: 0,
      extraMaxHp: 0,
      extraDefense: 0,
      extraReflection: 0,
    };

    // Літній сет / буст дзеркальної пластини
    if (setCounts.summer >= SET_BOOSTERS_CONFIG.summer.piecesRequired && boostsApplied.summer) {
      activeBonuses.extraReflection += setCounts.summer * SET_BOOSTERS_CONFIG.summer.reflectionBonusPerPiece;
    }

    // Медичний сет / буст бандажа
    if (setCounts.medical >= SET_BOOSTERS_CONFIG.medical.piecesRequired && boostsApplied.medical) {
      activeBonuses.extraRegen += setCounts.medical * SET_BOOSTERS_CONFIG.medical.regenBonusPerPiece;
      activeBonuses.extraMaxHp += setCounts.medical * SET_BOOSTERS_CONFIG.medical.maxHpBonusPerPiece;
    }

    // Бронесет (джаггернаут) / буст бронепластини
    if (setCounts.juggernaut >= SET_BOOSTERS_CONFIG.juggernaut.piecesRequired && boostsApplied.juggernaut) {
      activeBonuses.extraDefense += setCounts.juggernaut * SET_BOOSTERS_CONFIG.juggernaut.defenseBonusPerPiece;
      activeBonuses.extraMaxHp += setCounts.juggernaut * SET_BOOSTERS_CONFIG.juggernaut.maxHpBonusPerPiece;
    }

    return activeBonuses;
  }
}