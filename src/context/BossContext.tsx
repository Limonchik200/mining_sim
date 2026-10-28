import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { BOSSES_CONFIG } from '../config/bosses/bossesConfig';
import { BossCombatManager, PlayerStats } from '../managers/BossCombatManager';
import { EquipmentManager } from '../managers/EquipmentManager';
import { PLAYER_CONFIG, getHpUpgradeCost, getRegenUpgradeCost, getDodgeUpgradeCost } from '../config/progression/playerConfig';

const BOSS_SAVE_KEY = 'mining-sim-boss-mode-v10';
const REGEN_TICK_MS = 3000; // 3 секунди
const ATTACK_COOLDOWN_MS = 1000; // 1 секунда
const LOG_AUTO_CLEAR_MS = 1000; // 1 секунда

interface BossSaveData {
  playerStats: PlayerStats;
  inventory: Array<{ instanceId: string; itemId: string; level: number; durability: number }>;
  activeBossId: string;
  bossHpMap: Record<string, number>;
  hasUsedChestDiscount: boolean;
  materials: Record<string, number>;
}

interface BossContextType {
  playerStats: PlayerStats;
  equipped: Record<string, { itemId: string; level: number; durability: number } | null>;
  inventory: Array<{ instanceId: string; itemId: string; level: number; durability: number }>;
  activeBossId: string;
  bossHpMap: Record<string, number>;
  battleLog: string[];
  isFighting: boolean;
  lootData: Record<string, number> | null;
  materials: Record<string, number>;
  attackCooldown: boolean;
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

function loadBossSave(): BossSaveData | null {
  try {
    const raw = localStorage.getItem(BOSS_SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BossSaveData;
  } catch {
    return null;
  }
}

function saveBossState(data: BossSaveData) {
  try {
    localStorage.setItem(BOSS_SAVE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export const BossProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const saved = useRef<BossSaveData | null>(loadBossSave());

  const [playerStats, setPlayerStats] = useState<PlayerStats>(() =>
    saved.current?.playerStats ?? {
      level: 10,
      hp: 50,
      maxHp: 50,
      regen: 0.6,
      tokens: 100000,
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
    }
  );

  const [inventory, setInventory] = useState<Array<{ instanceId: string; itemId: string; level: number; durability: number }>>(() =>
    saved.current?.inventory ?? [
      { instanceId: 'init_weapon_1', itemId: 'vampire_blade', level: 1, durability: 80 },
    ]
  );

  const [activeBossId, setActiveBossId] = useState<string>(() => saved.current?.activeBossId ?? BOSSES_CONFIG[0].id);
  const [bossHpMap, setBossHpMap] = useState<Record<string, number>>(() => {
    if (saved.current?.bossHpMap) return saved.current.bossHpMap;
    const initialMap: Record<string, number> = {};
    BOSSES_CONFIG.forEach(b => { initialMap[b.id] = b.hp; });
    return initialMap;
  });

  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [isFighting, setIsFighting] = useState<boolean>(false);
  const [lootData, setLootData] = useState<Record<string, number> | null>(null);
  const [hasUsedChestDiscount, setHasUsedChestDiscount] = useState<boolean>(() => saved.current?.hasUsedChestDiscount ?? false);
  const [materials, setMaterials] = useState<Record<string, number>>(() => saved.current?.materials ?? {
    bones: 0,
    fire_rod: 0,
    basalt_slab: 0,
    black_shards: 0,
    scroll: 0,
    magma_stone: 0,
    solar_essence: 0,
    rainbow_stone: 0,
    mutagen_capsule: 0,
  });
  const [attackCooldown, setAttackCooldown] = useState<boolean>(false);

  // --- Persistence: save whenever key state changes ---
  useEffect(() => {
    saveBossState({
      playerStats,
      inventory,
      activeBossId,
      bossHpMap,
      hasUsedChestDiscount,
      materials,
    });
  }, [playerStats, inventory, activeBossId, bossHpMap, hasUsedChestDiscount, materials]);

  // --- Auto-save on page hide ---
  useEffect(() => {
    const onHide = () => {
      saveBossState({ playerStats, inventory, activeBossId, bossHpMap, hasUsedChestDiscount, materials });
    };
    window.addEventListener('pagehide', onHide);
    return () => window.removeEventListener('pagehide', onHide);
  }, [playerStats, inventory, activeBossId, bossHpMap, hasUsedChestDiscount, materials]);

  // --- Battle log auto-clear after 1 second ---
  const logTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pushLog = useCallback((entries: string[]) => {
    setBattleLog(entries);
    if (logTimerRef.current) clearTimeout(logTimerRef.current);
    logTimerRef.current = setTimeout(() => {
      setBattleLog([]);
      logTimerRef.current = null;
    }, LOG_AUTO_CLEAR_MS);
  }, []);

  // --- Real-time regen during combat (3s tick) ---
  useEffect(() => {
    if (!isFighting) return;
    const interval = setInterval(() => {
      const currentBoss = BOSSES_CONFIG.find(b => b.id === activeBossId) || BOSSES_CONFIG[0];
      const currentBossHp = bossHpMap[activeBossId] ?? currentBoss.hp;

      // Skip regen if someone is dead
      if (currentBossHp <= 0 || playerStats.hp <= 0) return;

      // Boss regen
      if (currentBoss.regen > 0 && currentBossHp < currentBoss.hp) {
        setBossHpMap(prev => ({
          ...prev,
          [activeBossId]: Math.min(currentBoss.hp, (prev[activeBossId] ?? currentBoss.hp) + currentBoss.regen),
        }));
      }

      // Player regen
      const pStats = BossCombatManager.calculatePlayerTotalStats(playerStats);
      if (pStats.regen > 0 && playerStats.hp < pStats.maxHp) {
        setPlayerStats(prev => ({
          ...prev,
          hp: Math.min(pStats.maxHp, prev.hp + pStats.regen),
        }));
      }
    }, REGEN_TICK_MS);
    return () => clearInterval(interval);
  }, [isFighting, activeBossId, bossHpMap, playerStats]);

  // --- Start battle ---
  const startBattle = () => {
    const pStats = BossCombatManager.calculatePlayerTotalStats(playerStats);
    setPlayerStats(prev => ({ ...prev, maxHp: pStats.maxHp, hp: pStats.maxHp }));
    setIsFighting(true);
    setAttackCooldown(false);
    pushLog([`Бій розпочато проти супротивника!`]);
  };

  // --- Process attack (1 hit player -> 1 hit boss) with cooldown ---
  const processAttack = () => {
    if (attackCooldown || !isFighting) return;
    setAttackCooldown(true);
    setTimeout(() => setAttackCooldown(false), ATTACK_COOLDOWN_MS);

    const currentBoss = BOSSES_CONFIG.find(b => b.id === activeBossId) || BOSSES_CONFIG[0];
    const currentBossHp = bossHpMap[activeBossId] ?? currentBoss.hp;

    const { result, newBossHp, newPlayerHp } = BossCombatManager.processAttackRound(
      { ...playerStats, equipped: playerStats.equipped },
      currentBoss,
      currentBossHp
    );

    setBossHpMap(prev => ({ ...prev, [activeBossId]: newBossHp }));
    setPlayerStats(prev => ({ ...prev, hp: newPlayerHp }));

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

    pushLog(logEntries);

    if (newBossHp <= 0) {
      setIsFighting(false);
      const earnedTokens = result.tokensEarned + 100;
      const earnedExp = result.expEarned + 50;
      const earnedBones = Math.floor(Math.random() * 4) + 1;
      setLootData({
        tokens: earnedTokens,
        experience: earnedExp,
        bones: earnedBones,
      });
      setPlayerStats(prev => ({
        ...prev,
        tokens: prev.tokens + earnedTokens,
        experience: prev.experience + earnedExp,
      }));
      setMaterials(prev => ({ ...prev, bones: (prev.bones || 0) + earnedBones }));
    } else if (newPlayerHp <= 0) {
      setIsFighting(false);
      const lostTokens = Math.floor(playerStats.tokens * (PLAYER_CONFIG.deathTokenLossPercent / 100));
      setPlayerStats(prev => ({
        ...prev,
        tokens: Math.max(0, prev.tokens - lostTokens),
        medals: Math.max(0, prev.medals - PLAYER_CONFIG.deathMedalsLoss),
      }));
      pushLog([`Ви загинули! Втрачено ${lostTokens} жетонів та ${PLAYER_CONFIG.deathMedalsLoss} медалей.`]);
    }
  };

  const claimLoot = () => {
    setLootData(null);
    const currentBoss = BOSSES_CONFIG.find(b => b.id === activeBossId);
    if (currentBoss) {
      setBossHpMap(prev => ({ ...prev, [activeBossId]: currentBoss.hp }));
    }
  };

  const equipItem = (instanceId: string, slot: string) => {
    const itemToEquip = inventory.find(i => i.instanceId === instanceId);
    if (!itemToEquip) return;

    const currentEquippedInSlot = playerStats.equipped[slot];

    setPlayerStats(prev => ({
      ...prev,
      equipped: { ...prev.equipped, [slot]: { itemId: itemToEquip.itemId, level: itemToEquip.level, durability: itemToEquip.durability } }
    }));

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
        setInventory(prev => [
          ...prev,
          { instanceId: 'chest_item_' + Date.now(), itemId: 'medical_helmet', level: 1, durability: 80 }
        ]);
      } else if (itemId === 'black_shards') {
        setMaterials(prev => ({ ...prev, black_shards: (prev.black_shards || 0) + 50 }));
      } else if (itemId === 'diamond') {
        setMaterials(prev => ({ ...prev, diamond: (prev.diamond || 0) + 1 }));
      } else {
        setMaterials(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
      }
    }
  };

  const upgradePlayerStat = (type: 'hp' | 'regen' | 'dodge') => {
    const currentLevel =
      type === 'hp' ? playerStats.upgrades.hpLevel :
      type === 'regen' ? playerStats.upgrades.regenLevel :
      playerStats.upgrades.dodgeLevel;

    const maxLevel =
      type === 'hp' ? PLAYER_CONFIG.maxHpLevel :
      type === 'regen' ? PLAYER_CONFIG.maxRegenLevel :
      PLAYER_CONFIG.maxDodgeLevel;

    if (currentLevel >= maxLevel) return;

    const cost =
      type === 'hp' ? getHpUpgradeCost(currentLevel + 1) :
      type === 'regen' ? getRegenUpgradeCost(currentLevel + 1) :
      getDodgeUpgradeCost(currentLevel + 1);

    // Check if player has all required materials
    const canAfford = Object.entries(cost).every(([resKey, amount]) => (materials[resKey] || 0) >= amount);
    if (!canAfford) return;

    // Deduct materials
    setMaterials(prev => {
      const updated = { ...prev };
      for (const [resKey, amount] of Object.entries(cost)) {
        updated[resKey] = (updated[resKey] || 0) - amount;
      }
      return updated;
    });

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
      materials,
      attackCooldown,
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
