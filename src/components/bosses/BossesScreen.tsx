import React, { useState } from 'react';
import { BOSSES_CONFIG, BossConfig } from '../../config/bosses/bossesConfig';

interface BossesScreenProps {
  playerLevel: number;
  playerHp: number;
  playerMaxHp: number;
  playerTokens: number;
  playerMedals: number;
  onBackToMain: () => void;
}

export const BossesScreen: React.FC<BossesScreenProps> = ({
  playerLevel,
  playerHp,
  playerMaxHp,
  playerTokens,
  playerMedals,
  onBackToMain,
}) => {
  // Активна вкладка (bosses | equipment | upgrades | exchange)
  const [activeTab, setActiveTab] = useState<'bosses' | 'equipment' | 'upgrades' | 'exchange'>('bosses');
  
  // Вибраний бос (за замовчуванням перший доступний — Гнилий Мародер)
  const [selectedBossId, setSelectedBossId] = useState<string>(BOSSES_CONFIG[0].id);
  const [isBossModalOpen, setIsBossModalOpen] = useState<boolean>(false);

  const currentBoss = BOSSES_CONFIG.find(b => b.id === selectedBossId) || BOSSES_CONFIG[0];

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 text-white p-4 select-none">
      {/* Верхня панель навігації та валют */}
      <div className="flex justify-between items-center bg-slate-800 p-3 rounded-xl mb-4 border border-slate-700 shadow-lg">
        <button 
          onClick={onBackToMain}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-semibold transition-colors"
        >
          ⬅ Назад у шахту
        </button>
        <div className="flex gap-4 text-sm font-bold">
          <div className="flex items-center gap-1 text-amber-400">
            <span>🪙</span> <span>{playerTokens} жетонів</span>
          </div>
          <div className="flex items-center gap-1 text-cyan-400">
            <span>🏅</span> <span>{playerMedals} медалей</span>
          </div>
        </div>
      </div>

      {/* Перемикач 4-х вкладок режиму босів */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <button
          onClick={() => setActiveTab('bosses')}
          className={`py-2 px-3 rounded-lg font-bold text-sm transition-all ${
            activeTab === 'bosses' ? 'bg-red-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          👹 Боси
        </button>
        <button
          onClick={() => setActiveTab('equipment')}
          className={`py-2 px-3 rounded-lg font-bold text-sm transition-all ${
            activeTab === 'equipment' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          🛡 Екіпіровка
        </button>
        <button
          onClick={() => setActiveTab('upgrades')}
          className={`py-2 px-3 rounded-lg font-bold text-sm transition-all ${
            activeTab === 'upgrades' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          📈 Прокачка
        </button>
        <button
          onClick={() => setActiveTab('exchange')}
          className={`py-2 px-3 rounded-lg font-bold text-sm transition-all ${
            activeTab === 'exchange' ? 'bg-amber-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          🏪 Обмінник
        </button>
      </div>

      {/* ВМІСТ ВКЛАДОК */}
      <div className="flex-1 bg-slate-800 rounded-2xl p-4 border border-slate-700 flex flex-col overflow-y-auto">
        
        {/* 1. ВКЛАДКА БОСІВ */}
        {activeTab === 'bosses' && (
          <div className="flex flex-col h-full gap-4">
            {/* Велика кнопка вибору боса зверху */}
            <button
              onClick={() => setIsBossModalOpen(true)}
              className="w-full py-3 px-4 bg-gradient-to-r from-red-900 to-slate-800 border border-red-500/50 rounded-xl flex justify-between items-center hover:border-red-400 transition-all shadow-lg"
            >
              <div className="text-left">
                <span className="text-xs text-red-400 uppercase tracking-wider font-bold">Поточний супротивник</span>
                <h2 className="text-lg font-extrabold text-white">{currentBoss.name}</h2>
              </div>
              <span className="text-xl">⚔️ Змінити боса ➡</span>
            </button>

            {/* Візуальна арена боса */}
            <div className="flex-1 bg-slate-900/80 rounded-xl border border-slate-700 flex flex-col items-center justify-center p-6 relative">
              {/* Шкала здоров'я боса */}
              <div className="absolute top-4 w-3/4 bg-slate-800 rounded-full h-4 border border-slate-600 overflow-hidden">
                <div className="bg-red-600 h-full w-full transition-all duration-300"></div>
              </div>
              <span className="absolute top-9 text-xs text-slate-300 font-bold">HP Боса: {currentBoss.hp} / {currentBoss.hp}</span>

              {/* Моделька / Аватар боса */}
              <div className="text-6xl my-8 animate-pulse">
                {currentBoss.category === 'zombies' ? '🧟‍♂️' : 
                 currentBoss.category === 'mages' ? '🧙‍♂️' : 
                 currentBoss.category === 'demons' ? '🔥👹' : '🪨🗿'}
              </div>

              <div className="text-center">
                <p className="text-sm text-slate-400">Рівень виклику: <span className="text-amber-400 font-bold">{currentBoss.requiredPlayerLevel} ур.</span></p>
                <p className="text-xs text-slate-500 mt-1">Регенерація: {currentBoss.regen} ХП/тік | Броня: {currentBoss.armor}%</p>
              </div>
            </div>

            {/* Шкала здоров'я гравця знизу */}
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
              <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                <span>Ваше здоров'я</span>
                <span>{playerHp} / {playerMaxHp} HP</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-3 border border-slate-700 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (playerHp / playerMaxHp) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* 2. ВКЛАДКА ЕКІПІРОВКИ */}
        {activeTab === 'equipment' && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <span className="text-4xl mb-2">🛡️</span>
            <p className="font-bold text-white">Розділ екіпіровки та слотів</p>
            <p className="text-xs text-slate-500 mt-1">Тут буде управління 6 слотами та інвентарем.</p>
          </div>
        )}

        {/* 3. ВКЛАДКА ПРОКАЧКИ */}
        {activeTab === 'upgrades' && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <span className="text-4xl mb-2">📈</span>
            <p className="font-bold text-white">Розділ прокачки статів</p>
            <p className="text-xs text-slate-500 mt-1">Прокачка максимального ХП, регенерації та ухилу.</p>
          </div>
        )}

        {/* 4. ВКЛАДКА ОБМІННИКА */}
        {activeTab === 'exchange' && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <span className="text-4xl mb-2">🏪</span>
            <p className="font-bold text-white">Обмінник (Магазин жетонів)</p>
            <p className="text-xs text-slate-500 mt-1">Покупка ящиків, осколків, пластин та алмазів.</p>
          </div>
        )}

      </div>

      {/* Модальне вікно вибору боса */}
      {isBossModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-5 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Виберіть боса</h3>
              <button 
                onClick={() => setIsBossModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold px-2"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {BOSSES_CONFIG.map((boss) => {
                const isUnlocked = playerLevel >= boss.requiredPlayerLevel;
                return (
                  <button
                    key={boss.id}
                    disabled={!isUnlocked}
                    onClick={() => {
                      setSelectedBossId(boss.id);
                      setIsBossModalOpen(false);
                    }}
                    className={`w-full p-3 rounded-xl border flex justify-between items-center text-left transition-all ${
                      selectedBossId === boss.id 
                        ? 'bg-red-900/40 border-red-500 text-white' 
                        : isUnlocked 
                        ? 'bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-700/50' 
                        : 'bg-slate-900/20 border-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-sm">{boss.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Рівень: {boss.requiredPlayerLevel} | HP: {boss.hp}</p>
                    </div>
                    {!isUnlocked && <span className="text-xs text-red-400 font-bold">🔒 Заблоковано</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};