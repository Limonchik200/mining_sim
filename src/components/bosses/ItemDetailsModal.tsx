import React from 'react';
import { BOSS_EQUIPMENT_CONFIG, EquipmentItemConfig } from '../../config/bossEquipment/equipmentConfig';
import { EquipmentManager } from '../../managers/EquipmentManager';
import { EQUIPMENT_UPGRADE_COSTS } from '../../config/bossEquipment/equipmentConfig';
import type { BossLang } from '../../config/bosses/bossI18n';
import { getBossT, RESOURCE_DISPLAY } from '../../config/bosses/bossI18n';

interface ItemDetailsModalProps {
  instanceId: string;
  itemId: string;
  level: number;
  durability: number;
  lang: BossLang;
  materials: Record<string, number>;
  onUpgrade: (instanceId: string) => void;
  onEquip: (instanceId: string, slot: string) => void;
  onClose: () => void;
}

const SLOT_NAMES_UK: Record<string, string> = {
  weapon: '⚔️ Зброя', helmet: '🪖 Каска', amulet: '📿 Амулет',
  chest: '👕 Нагрудник', pants: '👖 Штани', boots: '👢 Взуття',
};
const SLOT_NAMES_RU: Record<string, string> = {
  weapon: '⚔️ Оружие', helmet: '🪖 Каска', amulet: '📿 Амулет',
  chest: '👕 Нагрудник', pants: '👖 Штаны', boots: '👢 Обувь',
};
const SLOT_NAMES_EN: Record<string, string> = {
  weapon: '⚔️ Weapon', helmet: '🪖 Helmet', amulet: '📿 Amulet',
  chest: '👕 Chest', pants: '👖 Pants', boots: '👢 Boots',
};

const RARITY_COLORS: Record<string, string> = {
  common: 'text-gray-400 border-gray-500',
  good: 'text-green-400 border-green-500',
  great: 'text-blue-400 border-blue-500',
  epic: 'text-purple-400 border-purple-500',
  legendary: 'text-amber-400 border-amber-500',
  mythic: 'text-red-400 border-red-500',
  exotic: 'text-pink-400 border-pink-500',
};

export const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({
  instanceId, itemId, level, durability, lang, materials, onUpgrade, onEquip, onClose,
}) => {
  const t = getBossT(lang);
  const config: EquipmentItemConfig | undefined = BOSS_EQUIPMENT_CONFIG[itemId];
  if (!config) return null;

  const levelConfig = config.levels.find(l => l.level === level);
  if (!levelConfig) return null;

  const maxDur = EquipmentManager.getMaxDurability(level);
  const slotNames = lang === 'ru' ? SLOT_NAMES_RU : lang === 'en' ? SLOT_NAMES_EN : SLOT_NAMES_UK;
  const rarityColor = RARITY_COLORS[levelConfig.rarity] || 'text-gray-400 border-gray-500';

  const canUpgrade = level < config.levels.length;
  const nextLevel = level + 1;
  const upgradeCost = EQUIPMENT_UPGRADE_COSTS[nextLevel];
  const affordable = canUpgrade && upgradeCost
    ? Object.entries(upgradeCost).every(([resKey, amount]) => (materials[resKey] || 0) >= amount)
    : false;

  const costEntries = upgradeCost
    ? Object.entries(upgradeCost).map(([resKey, requiredAmount]) => {
        const haveAmount = materials[resKey] || 0;
        const enough = haveAmount >= requiredAmount;
        const display = RESOURCE_DISPLAY[resKey];
        const resName = display ? t(display.nameKey) : resKey;
        const icon = display?.icon || '📦';
        return { resKey, requiredAmount, haveAmount, enough, resName, icon };
      })
    : [];

  const stats: { label: string; value: string | undefined }[] = [
    { label: lang === 'ru' ? 'Урон' : lang === 'en' ? 'Damage' : 'Урон',
      value: levelConfig.damageMin !== undefined ? `${levelConfig.damageMin}-${levelConfig.damageMax}` : undefined },
    { label: lang === 'ru' ? 'Макс. HP' : lang === 'en' ? 'Max HP' : 'Макс. HP', value: levelConfig.maxHp ? `+${levelConfig.maxHp}` : undefined },
    { label: lang === 'ru' ? 'Регенерация' : lang === 'en' ? 'Regen' : 'Регенерація', value: levelConfig.regen ? `+${levelConfig.regen}` : undefined },
    { label: lang === 'ru' ? 'Защита' : lang === 'en' ? 'Defense' : 'Захист', value: levelConfig.defense ? `+${levelConfig.defense}` : undefined },
    { label: lang === 'ru' ? 'Крит шанс' : lang === 'en' ? 'Crit chance' : 'Крит шанс', value: levelConfig.critChance ? `+${levelConfig.critChance}%` : undefined },
    { label: 'Вампіризм', value: levelConfig.vampirism ? `+${levelConfig.vampirism}%` : undefined },
    { label: lang === 'ru' ? 'Истинный урон' : lang === 'en' ? 'True damage' : 'Істинний урон', value: levelConfig.trueDamage ? `+${levelConfig.trueDamage}` : undefined },
    { label: lang === 'ru' ? 'Оглушение' : lang === 'en' ? 'Stun' : 'Оглушення', value: levelConfig.stunChance ? `+${levelConfig.stunChance}%` : undefined },
    { label: lang === 'ru' ? 'Уклонение' : lang === 'en' ? 'Dodge' : 'Ухил', value: levelConfig.dodgeChance ? `+${levelConfig.dodgeChance}%` : undefined },
    { label: lang === 'ru' ? 'Блок' : lang === 'en' ? 'Block' : 'Блок', value: levelConfig.blockChance ? `+${levelConfig.blockChance}%` : undefined },
    { label: lang === 'ru' ? 'Отражение' : lang === 'en' ? 'Reflection' : 'Відображення', value: levelConfig.reflection ? `+${levelConfig.reflection}%` : undefined },
    { label: lang === 'ru' ? 'Починка при крит' : lang === 'en' ? 'Repair on crit' : 'Ремонт при крит', value: levelConfig.repairPerCrit ? `+${levelConfig.repairPerCrit}` : undefined },
  ];
  const activeStats = stats.filter(s => s.value !== undefined);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 flex flex-col max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
          <h3 className="font-extrabold text-lg text-white">{config.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-xl px-2">✕</button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <span className={`text-xs font-bold px-2 py-1 rounded border ${rarityColor}`}>
            {levelConfig.rarity.toUpperCase()}
          </span>
          <span className="text-xs text-slate-400">{t('itemLevel')}: {level} / {config.levels.length}</span>
          <span className="text-xs text-slate-400">{slotNames[config.slot]}</span>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
            <span>{t('itemDurability')}</span>
            <span>{durability} / {maxDur}</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-700">
            <div className={`h-full transition-all ${durability > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${Math.max(0, (durability / maxDur) * 100)}%` }} />
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('itemStats')}</h4>
          <div className="grid grid-cols-2 gap-2">
            {activeStats.map(stat => (
              <div key={stat.label} className="bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-xs">
                <span className="text-slate-400">{stat.label}</span>
                <span className="text-emerald-400 font-bold ml-1">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {canUpgrade && upgradeCost ? (
          <div className="mb-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('nextLevelCost')}</h4>
            <div className="space-y-1.5">
              {costEntries.map(({ resKey, requiredAmount, haveAmount, enough, resName, icon }) => (
                <div key={resKey} className={`flex items-center justify-between text-xs px-3 py-1.5 rounded-lg border ${enough ? 'bg-emerald-900/30 border-emerald-700/40' : 'bg-red-900/30 border-red-700/40'}`}>
                  <span className="text-slate-300 font-bold">
                    <span className="mr-1">{icon}</span>
                    {resName}
                  </span>
                  <span className={`font-bold ${enough ? 'text-emerald-400' : 'text-red-400'}`}>
                    {haveAmount}/{requiredAmount} {enough ? '✅' : '❌'}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => onUpgrade(instanceId)}
              disabled={!affordable}
              className="w-full mt-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl font-bold text-white text-sm transition-all shadow-md"
            >
              {affordable ? t('upgradeItem') : t('cantAfford')}
            </button>
          </div>
        ) : (
          <div className="text-center text-xs text-amber-400 font-bold mb-4 py-2 bg-amber-900/20 rounded-lg border border-amber-800/30">
            {t('maxItemLevel')}
          </div>
        )}

        <button
          onClick={() => onEquip(instanceId, config.slot)}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white transition-all shadow-lg"
        >
          {t('equip')}
        </button>
      </div>
    </div>
  );
};
