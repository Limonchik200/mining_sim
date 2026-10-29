import React from 'react';
import { PLAYER_CONFIG, getHpUpgradeCost, getRegenUpgradeCost, getDodgeUpgradeCost } from '../../config/progression/playerConfig';
import type { BossLang } from '../../config/bosses/bossI18n';
import { getBossT, RESOURCE_DISPLAY } from '../../config/bosses/bossI18n';

interface UpgradesScreenProps {
  hpLevel: number;
  regenLevel: number;
  dodgeLevel: number;
  playerResources: Record<string, number>;
  onUpgrade: (type: 'hp' | 'regen' | 'dodge') => void;
  lang: BossLang;
}

export const UpgradesScreen: React.FC<UpgradesScreenProps> = ({
  hpLevel, regenLevel, dodgeLevel, playerResources, onUpgrade, lang,
}) => {
  const t = getBossT(lang);
  const hpCost = getHpUpgradeCost(hpLevel + 1);
  const regenCost = getRegenUpgradeCost(regenLevel + 1);
  const dodgeCost = getDodgeUpgradeCost(dodgeLevel + 1);

  const canAfford = (cost: Record<string, number>) =>
    Object.entries(cost).every(([res, amt]) => (playerResources[res] || 0) >= amt);

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
            <p className="text-xs text-slate-400 mt-0.5">{t('itemLevel')}: {level} / {maxLevel}</p>
          </div>
          <button
            onClick={() => onUpgrade(type)}
            disabled={maxed || !affordable}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-40 ${buttonClass}`}
          >
            {maxed ? t('maxLevelShort') : affordable ? t('upgradeButton') : t('cantAfford')}
          </button>
        </div>
        <div className="text-xs text-slate-400 bg-slate-950/50 p-2 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-slate-300">{t('costLabel')}</span>
          </div>
          <div className="space-y-1">
            {Object.entries(cost).map(([resKey, amt]) => {
              const have = playerResources[resKey] || 0;
              const enough = have >= amt;
              const display = RESOURCE_DISPLAY[resKey];
              const name = display ? t(display.nameKey) : resKey;
              const icon = display?.icon || '';
              return (
                <div key={resKey} className={`flex items-center justify-between px-2 py-1 rounded-md border ${enough ? 'bg-emerald-900/30 border-emerald-700/40' : 'bg-red-900/30 border-red-700/40'}`}>
                  <span className="text-slate-300 font-bold">{icon} {name}</span>
                  <span className={`font-bold ${enough ? 'text-emerald-400' : 'text-red-400'}`}>{have}/{amt}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full gap-4 text-white overflow-y-auto pr-1">
      <h3 className="font-bold text-sm text-slate-300">{t('upgradeTitle')}</h3>

      {renderUpgradeCard(
        t('upgradeHP'), 'text-emerald-400', 'bg-emerald-600 hover:bg-emerald-500',
        hpLevel, PLAYER_CONFIG.maxHpLevel, hpCost,
        `+${PLAYER_CONFIG.hpPerLevel} HP ${t('perLevel')}`, 'hp'
      )}

      {renderUpgradeCard(
        t('upgradeRegen'), 'text-amber-400', 'bg-amber-600 hover:bg-amber-500',
        regenLevel, PLAYER_CONFIG.maxRegenLevel, regenCost,
        `+${PLAYER_CONFIG.regenPerLevel} ${t('perTick')}`, 'regen'
      )}

      {renderUpgradeCard(
        t('upgradeDodge'), 'text-cyan-400', 'bg-cyan-600 hover:bg-cyan-500',
        dodgeLevel, PLAYER_CONFIG.maxDodgeLevel, dodgeCost,
        `+${PLAYER_CONFIG.dodgePerLevel}% ${t('perLevel')}`, 'dodge'
      )}
    </div>
  );
};
