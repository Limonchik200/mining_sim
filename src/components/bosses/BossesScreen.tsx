import React, { useState } from 'react';
import { BOSSES_CONFIG } from '../../config/bosses/bossesConfig';
import { useBossContext } from '../../context/BossContext';
import { useGame } from '@/context/GameContext';
import { EquipmentScreen } from './EquipmentScreen';
import { UpgradesScreen } from './UpgradesScreen';
import { ExchangeScreen } from './ExchangeScreen';
import { BossSelectionModal } from './BossSelectionModal';
import { BossBattleModal } from './BossBattleModal';
import { InventoryScreen } from './InventoryScreen';
import { getBossT } from '../../config/bosses/bossI18n';
import type { BossLang } from '../../config/bosses/bossI18n';

interface BossesScreenProps {
  onBackToMain: () => void;
}

export const BossesScreen: React.FC<BossesScreenProps> = ({ onBackToMain }) => {
  const {
    playerStats,
    equipped,
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
    materials,
    attackCooldown,
    openChest,
    upgradeEquipmentItem,
    upgradeEquippedItem,
    chestResult,
    dismissChestResult,
    deathCooldownEndsAt,
    deathCooldownRemaining,
  } = useBossContext();
  const { lang: gameLang } = useGame();
  const lang = (gameLang === 'ru' ? 'ru' : gameLang === 'uk' ? 'uk' : 'en') as BossLang;
  const t = getBossT(lang);

  // Активна вкладка (bosses | equipment | upgrades | exchange)
  const [activeTab, setActiveTab] = useState<'bosses' | 'inventory' | 'equipment' | 'upgrades' | 'exchange'>('bosses');
  
  // Модалки
  const [isBossSelectionOpen, setIsBossSelectionOpen] = useState<boolean>(false);
  const [isBattleModalOpen, setIsBattleModalOpen] = useState<boolean>(false);

  const currentBoss = BOSSES_CONFIG.find(b => b.id === activeBossId) || BOSSES_CONFIG[0];
  const currentBossHp = bossHpMap[activeBossId] ?? currentBoss.hp;

  const handleStartBattleClick = () => {
    const started = startBattle();
    if (started) {
      setIsBattleModalOpen(true);
    }
  };

  const isOnDeathCooldown = deathCooldownEndsAt !== null && Date.now() < deathCooldownEndsAt;

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 text-white p-4 select-none">
      {/* Верхня панель навігації та валют */}
      <div className="flex justify-between items-center bg-slate-800 p-3 rounded-xl mb-4 border border-slate-700 shadow-lg">
        <button 
          onClick={onBackToMain}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-semibold transition-colors"
        >
          ⬅ {t('backToMine')}
        </button>
        <div className="flex gap-4 text-sm font-bold">
          <div className="flex items-center gap-1 text-amber-400">
            <span>🪙</span> <span>{playerStats.tokens} {t('tokens')}</span>
          </div>
          <div className="flex items-center gap-1 text-cyan-400">
            <span>🏅</span> <span>{playerStats.medals} {t('medals')}</span>
          </div>
        </div>
      </div>

      {/* Перемикач 5-ти вкладок режиму босів */}
      <div className="grid grid-cols-5 gap-1.5 mb-4">
        <button
          onClick={() => setActiveTab('bosses')}
          className={`py-2 px-2 rounded-lg font-bold text-xs sm:text-sm transition-all ${
            activeTab === 'bosses' ? 'bg-red-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          👹 {t('tabBosses')}
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`py-2 px-2 rounded-lg font-bold text-xs sm:text-sm transition-all ${
            activeTab === 'inventory' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          🎒 {t('tabInventory')}
        </button>
        <button
          onClick={() => setActiveTab('equipment')}
          className={`py-2 px-2 rounded-lg font-bold text-xs sm:text-sm transition-all ${
            activeTab === 'equipment' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          🛡 {t('tabEquipment')}
        </button>
        <button
          onClick={() => setActiveTab('upgrades')}
          className={`py-2 px-2 rounded-lg font-bold text-xs sm:text-sm transition-all ${
            activeTab === 'upgrades' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          📈 {t('tabUpgrades')}
        </button>
        <button
          onClick={() => setActiveTab('exchange')}
          className={`py-2 px-2 rounded-lg font-bold text-xs sm:text-sm transition-all ${
            activeTab === 'exchange' ? 'bg-amber-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          🏪 {t('tabExchange')}
        </button>
      </div>

      {/* ВМІСТ ВКЛАДОК */}
      <div className="flex-1 bg-slate-800 rounded-2xl p-4 border border-slate-700 flex flex-col overflow-y-auto">
        
        {/* 1. ВКЛАДКА БОСІВ */}
        {activeTab === 'bosses' && (
          <div className="flex flex-col h-full gap-4">
            {/* Велика кнопка вибору боса зверху */}
            <button
              onClick={() => setIsBossSelectionOpen(true)}
              className="w-full py-3 px-4 bg-gradient-to-r from-red-900 to-slate-800 border border-red-500/50 rounded-xl flex justify-between items-center hover:border-red-400 transition-all shadow-lg"
            >
              <div className="text-left">
                <span className="text-xs text-red-400 uppercase tracking-wider font-bold">{t('currentOpponent')}</span>
                <h2 className="text-lg font-extrabold text-white">{currentBoss.name} {currentBoss.isLord && '👑'}</h2>
              </div>
              <span className="text-xl">⚔️ {t('changeBoss')} ➡</span>
            </button>

            {/* Візуальна арена боса */}
            <div className="flex-1 bg-slate-900/80 rounded-xl border border-slate-700 flex flex-col items-center justify-center p-6 relative">
              {/* Шкала здоров'я боса */}
              <div className="absolute top-4 w-3/4 bg-slate-800 rounded-full h-4 border border-slate-600 overflow-hidden">
                <div 
                  className="bg-red-600 h-full transition-all duration-300"
                  style={{ width: `${Math.max(0, (currentBossHp / currentBoss.hp) * 100)}%` }}
                ></div>
              </div>
              <span className="absolute top-9 text-xs text-slate-300 font-bold">{t('bossHealth')}: {currentBossHp} / {currentBoss.hp}</span>

              {/* Моделька / Аватар боса */}
              <div className="text-6xl my-8 animate-pulse">
                {currentBoss.emoji}
              </div>

              <div className="text-center mb-4">
                <p className="text-sm text-slate-400">{t('challengeLevel')}: <span className="text-amber-400 font-bold">{currentBoss.requiredPlayerLevel}</span></p>
                <p className="text-xs text-slate-500 mt-1">{t('regen')}: {currentBoss.regen} | {t('armor')}: {currentBoss.armor}%</p>
              </div>

              {/* Кнопка вступу в бій або повідомлення про кулдаун*/}
              {isOnDeathCooldown ? (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-red-400 font-bold text-sm text-center">
                    {t('deathCooldown', { time: Math.ceil(deathCooldownRemaining / 1000) + t('recoveringSec') })}
                  </p>
                  <button
                    disabled
                    className="py-3 px-8 bg-slate-700 text-slate-500 rounded-xl font-extrabold uppercase tracking-wider text-sm cursor-not-allowed"
                  >
                    {t('recovering')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleStartBattleClick}
                  className="py-3 px-8 bg-red-600 hover:bg-red-500 text-white font-extrabold rounded-xl shadow-xl transition-all uppercase tracking-wider text-sm"
                >
                  ⚔️ {t('startBattle')}
                </button>
              )}
            </div>

            {/* Шкала здоров'я гравця знизу */}
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
              <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                <span>{t('yourHealth')}</span>
                <span>{playerStats.hp} / {playerStats.maxHp} HP</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-3 border border-slate-700 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (playerStats.hp / playerStats.maxHp) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* 2. ВКЛАДКА ІНВЕНТАРЯ */}
        {activeTab === 'inventory' && (
          <InventoryScreen
            inventory={inventory}
            materials={materials}
            chestResult={chestResult}
            onOpenChest={openChest}
            onDismissChestResult={dismissChestResult}
            onEquipItem={equipItem}
            lang={lang}
          />
        )}

        {/* 3. ВКЛАДКА ЕКІПІРОВКИ */}
        {activeTab === 'equipment' && (
          <EquipmentScreen
            equipped={equipped}
            inventory={inventory}
            playerTokens={playerStats.tokens}
            materials={materials}
            lang={lang}
            onEquipItem={equipItem}
            onRepairItem={repairItem}
            onRepairAll={repairAll}
            onOpenChest={openChest}
            onUpgradeItem={upgradeEquipmentItem}
            onUpgradeEquipped={upgradeEquippedItem}
            chestResult={chestResult}
            onDismissChestResult={dismissChestResult}
          />
        )}

        {/* 3. ВКЛАДКА ПРОКАЧКИ */}
        {activeTab === 'upgrades' && (
          <UpgradesScreen
            hpLevel={playerStats.upgrades.hpLevel}
            regenLevel={playerStats.upgrades.regenLevel}
            dodgeLevel={playerStats.upgrades.dodgeLevel}
            playerResources={{ ...materials, tokens: playerStats.tokens, medals: playerStats.medals }}
            onUpgrade={upgradePlayerStat}
            lang={lang}
          />
        )}

        {/* 4. ВКЛАДКА ОБМІННИКА */}
        {activeTab === 'exchange' && (
          <ExchangeScreen
            playerTokens={playerStats.tokens}
            hasUsedChestDiscount={hasUsedChestDiscount}
            onBuyItem={buyExchangeItem}
            lang={lang}
          />
        )}

      </div>

      {/* Модальне вікно вибору боса */}
      <BossSelectionModal
        isOpen={isBossSelectionOpen}
        playerLevel={playerStats.level}
        selectedBossId={activeBossId}
        onSelectBoss={setActiveBossId}
        onClose={() => setIsBossSelectionOpen(false)}
        lang={lang}
      />

      {/* Модальне вікно битви з босом */}
      <BossBattleModal
        isOpen={isBattleModalOpen}
        bossName={currentBoss.name}
        bossHp={currentBossHp}
        bossMaxHp={currentBoss.hp}
        playerHp={playerStats.hp}
        playerMaxHp={playerStats.maxHp}
        battleLog={battleLog}
        isFighting={isFighting}
        attackCooldown={attackCooldown}
        onAttack={processAttack}
        onClose={() => setIsBattleModalOpen(false)}
        lootData={lootData}
        onClaimLoot={() => {
          claimLoot();
          setIsBattleModalOpen(false);
        }}
        lang={lang}
        playerDied={playerStats.hp <= 0}
      />

    </div>
  );
};