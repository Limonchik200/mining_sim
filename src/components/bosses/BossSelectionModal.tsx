import React, { useState } from 'react';
import { BOSSES_CONFIG, BossConfig } from '../../config/bosses/bossesConfig';

interface BossSelectionModalProps {
  isOpen: boolean;
  playerLevel: number;
  selectedBossId: string;
  onSelectBoss: (bossId: string) => void;
  onClose: () => void;
}

const CATEGORIES = [
  { key: 'zombies', name: '🧟 Зомбі (Кістки)' },
  { key: 'mages', name: '📜 Чаклуни (Сувої)' },
  { key: 'demons', name: '🔥 Демони (Стержні)' },
  { key: 'trolls', name: '🪨 Тролі (Пластини)' },
];

export const BossSelectionModal: React.FC<BossSelectionModalProps> = ({
  isOpen,
  playerLevel,
  selectedBossId,
  onSelectBoss,
  onClose,
}) => {
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number>(0);

  if (!isOpen) return null;

  const currentCategoryKey = CATEGORIES[activeCategoryIndex].key;
  const filteredBosses = BOSSES_CONFIG.filter(b => b.category === currentCategoryKey);

  const handlePrevCategory = () => {
    setActiveCategoryIndex((prev) => (prev === 0 ? CATEGORIES.length - 1 : prev - 1));
  };

  const handleNextCategory = () => {
    setActiveCategoryIndex((prev) => (prev === CATEGORIES.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 flex flex-col max-h-[90vh] shadow-2xl">
        
        {/* Шапка модалки */}
        <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
          <h3 className="font-extrabold text-lg text-white">Вибір супротивника</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-xl px-2">✕</button>
        </div>

        {/* Перемикач розділів зі стрілочками вліво/вправо */}
        <div className="flex items-center justify-between bg-slate-800 p-2 rounded-xl border border-slate-700 mb-4">
          <button 
            onClick={handlePrevCategory}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-bold transition-all"
          >
            ◀
          </button>
          <span className="font-extrabold text-sm text-amber-400">{CATEGORIES[activeCategoryIndex].name}</span>
          <button 
            onClick={handleNextCategory}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-bold transition-all"
          >
            ▶
          </button>
        </div>

        {/* Список босів вибраної категорії */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredBosses.map((boss) => {
            const isUnlocked = playerLevel >= boss.requiredPlayerLevel;
            const isSelected = selectedBossId === boss.id;

            return (
              <button
                key={boss.id}
                disabled={!isUnlocked}
                onClick={() => {
                  onSelectBoss(boss.id);
                  onClose();
                }}
                className={`w-full p-4 rounded-xl border text-left transition-all flex flex-col gap-2 ${
                  isSelected 
                    ? 'bg-red-950/60 border-red-500 shadow-lg' 
                    : isUnlocked 
                    ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-700/60' 
                    : 'bg-slate-950/40 border-slate-900 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex justify-between items-center">
                  <h4 className={`font-extrabold text-sm ${boss.isLord ? 'text-amber-400' : 'text-white'}`}>
                    {boss.name} {boss.isLord && '👑'}
                  </h4>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    isUnlocked ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'
                  }`}>
                    {isUnlocked ? `Доступно (${boss.requiredPlayerLevel} ур.)` : `Потрібен ${boss.requiredPlayerLevel} ур.`}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-slate-400">
                  <span>❤️ HP: {boss.hp}</span>
                  <span>🛡️ Броня: {boss.armor}%</span>
                  <span>⚔️ Урон: {boss.damageMin === boss.damageMax ? boss.damageMin : `${boss.damageMin}-${boss.damageMax}`}</span>
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};