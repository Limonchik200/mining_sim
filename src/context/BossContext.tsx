import React, { createContext, useContext, useState } from 'react';
import { BOSSES_CONFIG } from '../config/bosses/bossesConfig';
import { BossCombatManager, PlayerStats } from '../managers/BossCombatManager';
import { EquipmentManager } from '../managers/EquipmentManager';
import { PLAYER_CONFIG } from '../config/progression/playerConfig';

interface BossContextType {
  playerStats: PlayerStats;
  equipped: Record<string, { itemId: string; level: number; durability: number } | null>;
  inventory: Array<{ instanceId: string; itemId: string; level: number; durability: number }>;
  activeBossId: string;
  bossHpMap: Record<string, number>;
  battleLog: string[];
  isFighting: boolean;
  lootData: Record<string, number> | null;
  setActiveBossId: (id: string) => void;
  startBattle: () => void;
  processAttack: () => void;
  claimLoot: () => void;
  equipItem: (instanceId: string, slot: string) => void;
  repairItem: (slot: string) => void;
  repairAll: () => void;
  buyExchangeItem: (itemId: string, price: number) => void;
  upgradePlayerStat: (type: 'hp' | 'regen' | 'dodge') => void;
  hasUsedChestDiscount: boolean;
}

const BossContext = createContext<BossContextType | undefined>(undefined);

export const BossProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Базовий стейт гравця
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    level: 10, // Режим босів з 10 рівня
    hp: 50,
    maxHp: 50,
    regen: 0.6,
    tokens: 100000, // Початкові жетони для тесту
    medals: 50,
    experience: 0,
    equipped: {
      weapon: null,
      helmet: null,
      amulet: null,
      chest: null,
      pants: null,
      boots: null,
    },
    upgrades: {
      hpLevel: 0,
      regenLevel: 0,
      dodgeLevel: 0,
    },
  });

  // Інвентар екіпіровки
  const [inventory, setInventory] = useState<Array<{ instanceId: string; itemId: string; level: number; durability: number }>>([
    { instanceId: 'init_weapon_1', itemId: 'vampire_blade', level: 1, durability: 80 },
  ]);

  const [activeBossId, setActiveBossId] = useState<string>(BOSSES_CONFIG[0].id);
  const [bossHpMap, setBossHpMap] = useState<Record<string, number>>(() => {
    const initialMap: Record<string, number> = {};
    BOSSES_CONFIG.forEach(b => { initialMap[b.id] = b.hp; });
    return initialMap;
  });

  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [isFighting, setIsFighting] = useState<boolean>(false);
  const [lootData, setLootData] = useState<Record<string, number> | null>(null);
  const [hasUsedChestDiscount, setHasUsedChestDiscount] = useState<boolean>(false);

  // Функція початку бою
  const startBattle = () => {
    const pStats = BossCombatManager.calculatePlayerTotalStats(playerStats);
    setPlayerStats(prev => ({ ...prev, maxHp: pStats.maxHp, hp: pStats.maxHp }));
    setIsFighting(true);
    setBattleLog([`Бій розпочато проти супротивника!`]);
  };

  // Процес атаки (1 удар гравця -> 1 удар боса)
  const processAttack = () => {
    const currentBoss = BOSSES_CONFIG.find(b => b.id === activeBossId) || BOSSES_CONFIG[0];
    const currentBossHp = bossHpMap[activeBossId] ?? currentBoss.hp;

    const { result, newBossHp, newPlayerHp } = BossCombatManager.processAttackRound(
      { ...playerStats, equipped: playerStats.equipped },
      currentBoss,
      currentBossHp
    );

    // Оновлюємо ХП боса та гравця
    setBossHpMap(prev => ({ ...prev, [activeBossId]: newBossHp }));
    setPlayerStats(prev => ({ ...prev, hp: newPlayerHp }));

    // Формуємо лог бою
    const logEntries: string[] = [];
    if (result.playerMissed) {
      logEntries.push(`Ви промахнулися по босу!`);
    } else if (result.bossDodge) {
      logEntries.push(`Бос ухилився від вашої атаки!`);
    } else {
      logEntries.push(`Ви завдали ${result.playerDamage} урону босу${result.isPlayerCrit ? ' (КРИТ 🔥)' : ''}.`);
      if (result.vampireHeal > 0) logEntries.push(`Вампіризм відновив вам ${result.vampireHeal} HP.`);
    }

    if (newBossHp > 0) {
      if (result.bossMissed) {
        logEntries.push(`Бос промахнувся по вам!`);
      } else if (result.playerDodge) {
        logEntries.push(`Ви успішно ухилилися від атаки боса!`);
      } else if (result.bossBlocked) {
        logEntries.push(`Ви заблокували атаку боса щитом!`);
      } else {
        logEntries.push(`Бос завдав вам ${result.bossDamage} урону${result.isBossCrit ? ' (КРИТ 💀)' : ''}.`);
      }
    }

    setBattleLog(prev => [...logEntries, ...prev].slice(0, 50));

    // Перевірка перемоги
    if (newBossHp <= 0) {
      setIsFighting(false);
      // Нагороди за перемогу
      const earnedTokens = result.tokensEarned + 100;
      const earnedExp = result.expEarned + 50;
      setLootData({
        tokens: earnedTokens,
        experience: earnedExp,
        bones: 3,
      });
      setPlayerStats(prev => ({
        ...prev,
        tokens: prev.tokens + earnedTokens,
        experience: prev.experience + earnedExp,
      }));
    } else if (newPlayerHp <= 0) {
      // Гравець загинув — штраф та завершення бою
      setIsFighting(false);
      const lostTokens = Math.floor(playerStats.tokens * (PLAYER_CONFIG.deathTokenLossPercent / 100));
      setPlayerStats(prev => ({
        ...prev,
        tokens: Math.max(0, prev.tokens - lostTokens),
        medals: Math.max(0, prev.medals - PLAYER_CONFIG.deathMedalsLoss),
      }));
      setBattleLog(prev => [`Ви загинули! Втрачено ${lostTokens} жетонів та ${PLAYER_CONFIG.deathMedalsLoss} медалей.`, ...prev].slice(0, 50));
    }
  };

  const claimLoot = () => {
    setLootData(null);
    // Відновлюємо ХП боса для наступного бою
    const currentBoss = BOSSES_CONFIG.find(b => b.id === activeBossId);
    if (currentBoss) {
      setBossHpMap(prev => ({ ...prev, [activeBossId]: currentBoss.hp }));
    }
  };

  // Надягання екіпіровки
  const equipItem = (instanceId: string, slot: string) => {
    const itemToEquip = inventory.find(i => i.instanceId === instanceId);
    if (!itemToEquip) return;

    const currentEquippedInSlot = playerStats.equipped[slot];

    setPlayerStats(prev => ({
      ...prev,
      equipped: { ...prev.equipped, [slot]: { itemId: itemToEquip.itemId, level: itemToEquip.level, durability: itemToEquip.durability } }
    }));

    // Видаляємо з інвентаря надітий предмет і повертаємо старий (якщо був)
    setInventory(prev => {
      const filtered = prev.filter(i => i.instanceId !== instanceId);
      if (currentEquippedInSlot) {
        filtered.push({
          instanceId: 'eq_' + Date.now(),
          itemId: currentEquippedInSlot.itemId,
          level: currentEquippedInSlot.level,
          durability: currentEquippedInSlot.durability,
        });
      }
      return filtered;
    });
  };

  const repairItem = (slot: string) => {
    const eq = playerStats.equipped[slot];
    if (!eq) return;
    const maxDur = EquipmentManager.getMaxDurability(eq.level);
    const cost = EquipmentManager.getRepairCost(eq.durability, maxDur);

    if (playerStats.tokens >= cost.tokenCost) {
      setPlayerStats(prev => ({
        ...prev,
        tokens: prev.tokens - cost.tokenCost,
        equipped: {
          ...prev.equipped,
          [slot]: eq ? { ...eq, durability: maxDur } : null
        }
      }));
    }
  };

  const repairAll = () => {
    let totalCost = 0;
    const newEquipped = { ...playerStats.equipped };

    for (const [slot, eq] of Object.entries(newEquipped)) {
      if (!eq) continue;
      const maxDur = EquipmentManager.getMaxDurability(eq.level);
      const cost = EquipmentManager.getRepairCost(eq.durability, maxDur);
      totalCost += cost.tokenCost;
      newEquipped[slot] = { ...eq, durability: maxDur };
    }

    if (playerStats.tokens >= totalCost) {
      setPlayerStats(prev => ({
        ...prev,
        tokens: prev.tokens - totalCost,
        equipped: newEquipped,
      }));
    }
  };

  const buyExchangeItem = (itemId: string, price: number) => {
    if (playerStats.tokens >= price) {
      setPlayerStats(prev => ({ ...prev, tokens: prev.tokens - price }));
      if (itemId === 'equipment_chest') {
        setHasUsedChestDiscount(true);
        // Додаємо випадковий предмет екіпіровки в інвентар
        setInventory(prev => [
          ...prev,
          { instanceId: 'chest_item_' + Date.now(), itemId: 'medical_helmet', level: 1, durability: 80 }
        ]);
      }
    }
  };

  const upgradePlayerStat = (type: 'hp' | 'regen' | 'dodge') => {
    setPlayerStats(prev => {
      if (type === 'hp') {
        return { ...prev, upgrades: { ...prev.upgrades, hpLevel: prev.upgrades.hpLevel + 1 } };
      }
      if (type === 'regen') {
        return { ...prev, upgrades: { ...prev.upgrades, regenLevel: prev.upgrades.regenLevel + 1 } };
      }
      return { ...prev, upgrades: { ...prev.upgrades, dodgeLevel: prev.upgrades.dodgeLevel + 1 } };
    });
  };

  return (
    <BossContext.Provider value={{
      playerStats,
      equipped: playerStats.equipped,
      inventory,
      activeBossId,
      bossHpMap,
      battleLog,
      isFighting,
      lootData,
      setActiveBossId,
      startBattle,
      processAttack,
      claimLoot,
      equipItem,
      repairItem,
      repairAll,
      buyExchangeItem,
      upgradePlayerStat,
      hasUsedChestDiscount,
    }}>
      {children}
    </BossContext.Provider>
  );
};

export const useBossContext = () => {
  const context = useContext(BossContext);
  if (!context) throw new Error('useBossContext must be used within a BossProvider');
  return context;
};