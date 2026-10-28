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

  const canAfford = (cost: Record<string, number>) =>
    Object.entries(cost).every(([res, amt]) => (playerResources[res] || 0) >= amt);

  const formatCost = (cost: Record<string, number>) =>
    Object.entries(cost).map(([res, amt]) => `${amt} ${res}`).join(', ');

  const renderUpgradeCard = (
    title: string,
    colorClass: string,
    buttonClass: string,
    level: number,
    maxLevel: number,
    cost: Record<string, number>,
    description: string,
    type: 'hp' | 'regen' | 'dodge'
  ) => {
    const affordable = canAfford(cost);
    const maxed = level >= maxLevel;

    return (
      <div className="bg-slate-900/80 border border-slate-700 p-4 rounded-xl flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div>
            <h4 className={`font-extrabold text-sm ${colorClass}`}>{title}</h4>
            <p className="text-xs text-slate-400">{description}</p>
            <p className="text-xs text-slate-400 mt-0.5">Рівень: {level} / {maxLevel}</p>
          </div>
          <button
            onClick={() => onUpgrade(type)}
            disabled={maxed || !affordable}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-40 ${buttonClass}`}
          >
            {maxed ? 'Максимум' : affordable ? 'Прокачати' : 'Не вистачає'}
          </button>
        </div>
        <div className="text-xs text-slate-400 bg-slate-950/50 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
          <span className="font-bold text-slate-300">Ціна: </span>
          <span className={affordable ? 'text-emerald-400' : 'text-red-400'}>
            {formatCost(cost)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full gap-4 text-white overflow-y-auto pr-1">
      <h3 className="font-bold text-sm text-slate-300">Прокачка характеристик гравця</h3>

      {renderUpgradeCard(
        'Максимальне Здоров\'я (HP)',
        'text-emerald-400',
        'bg-emerald-600 hover:bg-emerald-500',
        hpLevel,
        PLAYER_CONFIG.maxHpLevel,
        hpCost,
        `+${PLAYER_CONFIG.hpPerLevel} HP за рівень`,
        'hp'
      )}

      {renderUpgradeCard(
        'Регенерація ХП',
        'text-amber-400',
        'bg-amber-600 hover:bg-amber-500',
        regenLevel,
        PLAYER_CONFIG.maxRegenLevel,
        regenCost,
        `+${PLAYER_CONFIG.regenPerLevel} ХП/тік (тік = 3с)`,
        'regen'
      )}

      {renderUpgradeCard(
        'Шанс ухилу від атаки',
        'text-cyan-400',
        'bg-cyan-600 hover:bg-cyan-500',
        dodgeLevel,
        PLAYER_CONFIG.maxDodgeLevel,
        dodgeCost,
        `+${PLAYER_CONFIG.dodgePerLevel}% за рівень`,
        'dodge'
      )}
    </div>
  );
};
