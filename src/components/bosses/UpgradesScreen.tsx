import React from 'react';
import { PLAYER_CONFIG, getHpUpgradeCost, getRegenUpgradeCost, getDodgeUpgradeCost } from '../../config/progression/playerConfig';

interface UpgradesScreenProps {
  hpLevel: number;
  regenLevel: number;
  dodgeLevel: number;
  playerResources: Record<string, number>;
  onUpgrade: (type: 'hp' | 'regen' | 'dodge') => void;
}

export const UpgradesScreen: React.FC<UpgradesScreenProps> = ({
  hpLevel,
  regenLevel,
  dodgeLevel,
  playerResources,
  onUpgrade,
}) => {
  const hpCost = getHpUpgradeCost(hpLevel + 1);
  const regenCost = getRegenUpgradeCost(regenLevel + 1);
  const dodgeCost = getDodgeUpgradeCost(dodgeLevel + 1);

  return (
    <div className="flex flex-col h-full gap-4 text-white overflow-y-auto pr-1">
      <h3 className="font-bold text-sm text-slate-300">Прокачка характеристик гравця</h3>

      {/* 1. ХП */}
      <div className="bg-slate-900/80 border border-slate-700 p-4 rounded-xl flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-extrabold text-sm text-emerald-400">Максимальне Здоров'я (HP)</h4>
            <p className="text-xs text-slate-400">Рівень: {hpLevel} / {PLAYER_CONFIG.maxHpLevel}</p>
          </div>
          <button
            onClick={() => onUpgrade('hp')}
            disabled={hpLevel >= PLAYER_CONFIG.maxHpLevel}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl text-xs font-bold transition-all shadow-md"
          >
            Прокачати
          </button>
        </div>
        <div className="text-xs text-slate-400 bg-slate-950/50 p-2 rounded-lg border border-slate-800">
          <span className="font-bold text-slate-300">Ціна наступного рівня: </span>
          {Object.entries(hpCost).map(([res, amt]) => `${amt} ${res}`).join(', ')}
        </div>
      </div>

      {/* 2. РЕГЕНЕРАЦІЯ ХП */}
      <div className="bg-slate-900/80 border border-slate-700 p-4 rounded-xl flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-extrabold text-sm text-amber-400">Регенерація ХП</h4>
            <p className="text-xs text-slate-400">Рівень: {regenLevel} / {PLAYER_CONFIG.maxRegenLevel} (тік = 3с)</p>
          </div>
          <button
            onClick={() => onUpgrade('regen')}
            disabled={regenLevel >= PLAYER_CONFIG.maxRegenLevel}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-xl text-xs font-bold transition-all shadow-md"
          >
            Прокачати
          </button>
        </div>
        <div className="text-xs text-slate-400 bg-slate-950/50 p-2 rounded-lg border border-slate-800">
          <span className="font-bold text-slate-300">Ціна наступного рівня: </span>
          {Object.entries(regenCost).map(([res, amt]) => `${amt} ${res}`).join(', ')}
        </div>
      </div>

      {/* 3. УХИЛ */}
      <div className="bg-slate-900/80 border border-slate-700 p-4 rounded-xl flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-extrabold text-sm text-cyan-400">Шанс ухилу від атаки</h4>
            <p className="text-xs text-slate-400">Рівень: {dodgeLevel} / {PLAYER_CONFIG.maxDodgeLevel}</p>
          </div>
          <button
            onClick={() => onUpgrade('dodge')}
            disabled={dodgeLevel >= PLAYER_CONFIG.maxDodgeLevel}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 rounded-xl text-xs font-bold transition-all shadow-md"
          >
            Прокачати
          </button>
        </div>
        <div className="text-xs text-slate-400 bg-slate-950/50 p-2 rounded-lg border border-slate-800">
          <span className="font-bold text-slate-300">Ціна наступного рівня: </span>
          {Object.entries(dodgeCost).map(([res, amt]) => `${amt} ${res}`).join(', ')}
        </div>
      </div>
    </div>
  );
};