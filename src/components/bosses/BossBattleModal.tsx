import React from 'react';

interface BossBattleModalProps {
  isOpen: boolean;
  bossName: string;
  bossHp: number;
  bossMaxHp: number;
  playerHp: number;
  playerMaxHp: number;
  battleLog: string[];
  isFighting: boolean;
  onAttack: () => void;
  onClose: () => void;
  lootData?: Record<string, number> | null;
  onClaimLoot?: () => void;
}

export const BossBattleModal: React.FC<BossBattleModalProps> = ({
  isOpen,
  bossName,
  bossHp,
  bossMaxHp,
  playerHp,
  playerMaxHp,
  battleLog,
  isFighting,
  onAttack,
  onClose,
  lootData,
  onClaimLoot,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 flex flex-col max-h-[90vh] shadow-2xl">
        
        {/* Шапка битви */}
        <div className="flex justify-between items-center mb-4 border-b border-e-slate-800 pb-3">
          <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
            <span>⚔️</span> Битва з босом: <span className="text-red-400">{bossName}</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-xl px-2">✕</button>
        </div>

        {/* Якщо випав лут */}
        {lootData ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
            <span className="text-5xl animate-bounce">🎁</span>
            <h4 className="text-xl font-extrabold text-amber-400">Перемога! Ви здобули лут:</h4>
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 w-full space-y-2 text-left">
              {Object.entries(lootData).map(([itemKey, qty]) => (
                <div key={itemKey} className="flex justify-between text-sm">
                  <span className="text-slate-300 capitalize">{itemKey.replace('_', ' ')}:</span>
                  <span className="text-amber-400 font-bold">+{qty}</span>
                </div>
              ))}
            </div>
            <button
              onClick={onClaimLoot}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white transition-all shadow-lg"
            >
              Забрати нагороду
            </button>
          </div>
        ) : (
          /* Процес бою */
          <div className="flex flex-col gap-4 flex-1">
            {/* Шкали здоров'я */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-xs text-red-400 font-bold">Бос ({bossHp}/{bossMaxHp})</span>
                <div className="w-full bg-slate-900 rounded-full h-2.5 mt-1 overflow-hidden border border-slate-800">
                  <div className="bg-red-600 h-full transition-all duration-200" style={{ width: `${Math.max(0, (bossHp / bossMaxHp) * 100)}%` }}></div>
                </div>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-xs text-emerald-400 font-bold">Ви ({playerHp}/{playerMaxHp})</span>
                <div className="w-full bg-slate-900 rounded-full h-2.5 mt-1 overflow-hidden border border-slate-800">
                  <div className="bg-emerald-500 h-full transition-all duration-200" style={{ width: `${Math.max(0, (playerHp / playerMaxHp) * 100)}%` }}></div>
                </div>
              </div>
            </div>

            {/* Лог бою */}
            <div className="flex-1 bg-slate-950/70 border border-slate-800 rounded-xl p-3 overflow-y-auto space-y-1.5 h-48 font-mono text-xs">
              {battleLog.length === 0 ? (
                <p className="text-slate-500 text-center italic mt-12">Бій розпочато! Натисніть кнопку атаки нижче...</p>
              ) : (
                battleLog.map((log, idx) => (
                  <p key={idx} className="text-slate-300">{log}</p>
                ))
              )}
            </div>

            {/* Кнопка удару / атаки */}
            <button
              onClick={onAttack}
              disabled={!isFighting || playerHp <= 0 || bossHp <= 0}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-50 rounded-xl font-extrabold text-white text-base shadow-xl transition-all uppercase tracking-wider"
            >
              {playerHp <= 0 ? 'Ви загинули...' : bossHp <= 0 ? 'Боса переможено!' : '⚡ Вдарити боса'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};