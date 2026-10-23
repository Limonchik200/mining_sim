import { useGame } from '@/context/GameContext';
import { formatMoney } from '@/config';
import {
  EQUIPMENT_CONFIG,
  equipmentUpgradeCost,
  equipmentMaxLevelForMine,
  mineRequiredForNextEquipmentLevel,
  RESPIRATOR_FILTER_PRICE,
  type EquipmentType,
} from '@/config/upgradesConfig';
import { HardHat, Flashlight, Hand, Wind, Lightbulb, Fan, Coins, Lock, ChevronUp, Package, Filter, Mountain, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const EQUIP_META: Record<EquipmentType, { icon: LucideIcon; color: string; nameRu: string; nameUk: string; nameEn: string; descRu: string; descUk: string; descEn: string }> = {
  helmet:      { icon: HardHat,    color: '#f59e0b', nameRu: 'Каска',          nameUk: 'Каска',         nameEn: 'Helmet',      descRu: 'Защита от обвалов',     descUk: 'Захист від обвалів',     descEn: 'Cave-in protection' },
  flashlight:  { icon: Flashlight, color: '#3b82f6', nameRu: 'Фонарик',        nameUk: 'Ліхтарик',      nameEn: 'Flashlight',  descRu: 'Освещение шахты',       descUk: 'Освітлення шахти',       descEn: 'Mine illumination' },
  gloves:      { icon: Hand,       color: '#22c55e', nameRu: 'Перчатки',       nameUk: 'Рукавиці',      nameEn: 'Gloves',      descRu: 'Скорость копания',      descUk: 'Швидкість копання',      descEn: 'Digging speed' },
  respirator:  { icon: Wind,       color: '#06b6d4', nameRu: 'Респиратор',     nameUk: 'Респіратор',    nameEn: 'Respirator',  descRu: 'Защита от пыли',        descUk: 'Захист від пилу',        descEn: 'Dust protection' },
  lighting:    { icon: Lightbulb,  color: '#eab308', nameRu: 'Освещение',      nameUk: 'Освітлення',    nameEn: 'Lighting',    descRu: 'Стационарный свет',     descUk: 'Стаціонарне світло',     descEn: 'Stationary light' },
  ventilation: { icon: Fan,        color: '#8b5cf6', nameRu: 'Вентиляция',     nameUk: 'Вентиляція',    nameEn: 'Ventilation', descRu: 'Воздух в шахте',        descUk: 'Повітря у шахті',        descEn: 'Air flow in mine' },
};

const EQUIP_ORDER: EquipmentType[] = ['helmet', 'flashlight', 'gloves', 'respirator', 'lighting', 'ventilation'];

export default function EquipmentPanel() {
  const { state, lang, t, upgradeEquipment, purchaseEquipment, purchaseRespiratorFilter, highestAccessibleMine } = useGame();
  const eq = state.equipment;
  const owned = state.ownedEquipment || [];

  const getLevel = (type: EquipmentType): number =>
    type === 'helmet' ? eq.helmetLevel :
    type === 'flashlight' ? eq.flashlightLevel :
    type === 'gloves' ? eq.glovesLevel :
    type === 'respirator' ? eq.respiratorLevel :
    type === 'lighting' ? eq.lightingLevel :
    eq.ventilationLevel;

  const tr = (ru: string, uk: string, en: string) => lang === 'ru' ? ru : (lang === 'uk' ? uk : en);

  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
          <HardHat className="w-5 h-5 text-warning-500" />
          {tr('Спорядження', 'Спорядження', 'Equipment')}
        </h2>
        <div className="flex items-center gap-1.5">
          <Coins className="w-4 h-4 text-success-500" />
          <span className="text-sm font-bold text-success-500">{formatMoney(state.balance)}</span>
        </div>
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-4 h-4 text-warning-500" />
          <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
            {tr('Обладнання шахти', 'Обладнання шахти', 'Mine Equipment')}
          </h3>
          <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
        </div>

        {EQUIP_ORDER.map((type) => {
          const meta = EQUIP_META[type];
          const cfg = EQUIPMENT_CONFIG[type];
          const Icon = meta.icon;
          const isOwned = owned.includes(type) || cfg.purchasePrice === 0;
          const level = getLevel(type);
          const maxForMine = equipmentMaxLevelForMine(type, highestAccessibleMine);
          const effectiveMax = Math.min(cfg.maxLevel, maxForMine);
          const isAbsoluteMax = level >= cfg.maxLevel;
          const isMineLocked = !isAbsoluteMax && level >= effectiveMax;
          const isMaxed = isAbsoluteMax || isMineLocked;
          const upgradeCost = equipmentUpgradeCost(type, level);
          const canAffordUpgrade = state.balance >= upgradeCost;
          const canAffordBuy = state.balance >= cfg.purchasePrice;
          const nextMineReq = mineRequiredForNextEquipmentLevel(type, highestAccessibleMine);
          const name = tr(meta.nameRu, meta.nameUk, meta.nameEn);
          const desc = tr(meta.descRu, meta.descUk, meta.descEn);

          const levelPct = effectiveMax > 0 ? Math.min(100, (level / effectiveMax) * 100) : 0;

          return (
            <div
              key={type}
              className="group rounded-xl p-3 bg-neutral-50 dark:bg-neutral-850/50 border border-neutral-200 dark:border-neutral-800 transition-all duration-300 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-sm"
            >
              <div className="flex items-start justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: meta.color + '20' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: meta.color }} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{name}</div>
                    <div className="text-xs text-neutral-400">{desc}</div>
                  </div>
                </div>
                {isOwned && (
                  <div className="text-right">
                    <div className="text-[10px] text-neutral-400 uppercase">{t('level_')}</div>
                    <div className={`text-sm font-bold ${isMineLocked ? 'text-neutral-400' : 'text-primary-500'}`}>
                      {level}/{effectiveMax}
                    </div>
                  </div>
                )}
              </div>

              {isOwned && effectiveMax > 0 && (
                <div className="mb-2.5 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${levelPct}%`,
                      background: isMineLocked
                        ? 'linear-gradient(90deg, #94a3b8, #64748b)'
                        : `linear-gradient(90deg, ${meta.color}, ${meta.color}dd)`,
                    }}
                  />
                </div>
              )}

              {!isOwned ? (
                maxForMine < 1 ? (
                  <div className="w-full py-2 text-sm font-semibold text-center rounded-lg bg-neutral-100 dark:bg-neutral-800/50 text-neutral-400 flex flex-col items-center gap-1">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-4 h-4" />
                      {tr('Заблоковано', 'Заблоковано', 'Locked')}
                    </span>
                    {nextMineReq && (
                      <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                        <Mountain className="w-3 h-3" />
                        {tr(`Потрібна шахта ${nextMineReq.mineId}`, `Потрібна шахта ${nextMineReq.mineId}`, `Requires Mine ${nextMineReq.mineId}`)}
                      </span>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => purchaseEquipment(type)}
                    disabled={!canAffordBuy}
                    className={`btn w-full py-2 text-sm rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 ${
                      canAffordBuy
                        ? 'bg-warning-500 text-white hover:bg-warning-600 hover:shadow-md active:scale-[0.98]'
                        : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                    }`}
                  >
                    <Coins className="w-4 h-4" />
                    {tr('Купити', 'Купити', 'Buy')} · {formatMoney(cfg.purchasePrice)}
                  </button>
                )
              ) : isAbsoluteMax ? (
                <div className="w-full py-2 text-sm font-semibold text-center rounded-lg bg-success-500/10 text-success-500 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  {t('maxLevelReached')}
                </div>
              ) : isMineLocked ? (
                <div className="w-full py-2 text-sm font-semibold text-center rounded-lg bg-neutral-100 dark:bg-neutral-800/50 text-neutral-500 flex flex-col items-center gap-1">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-4 h-4" />
                    {tr('Потрібна шахта для підвищення', 'Потрібна шахта для підвищення', 'Mine required to upgrade')}
                  </span>
                  {nextMineReq && (
                    <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                      <Mountain className="w-3 h-3" />
                      {tr(
                        `Відкрийте шахту ${nextMineReq.mineId} для рівня ${nextMineReq.neededLevel}`,
                        `Відкрийте шахту ${nextMineReq.mineId} для рівня ${nextMineReq.neededLevel}`,
                        `Unlock Mine ${nextMineReq.mineId} for level ${nextMineReq.neededLevel}`
                      )}
                    </span>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => upgradeEquipment(type)}
                  disabled={!canAffordUpgrade}
                  className={`btn w-full py-2 text-sm rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 ${
                    canAffordUpgrade
                      ? 'bg-primary-500 text-white hover:bg-primary-600 hover:shadow-md active:scale-[0.98]'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                  }`}
                >
                  <ChevronUp className="w-4 h-4" />
                  {t('buyUpgrade')} · {formatMoney(upgradeCost)}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Smoke filter */}
      <div className="card p-4">
        <div className="rounded-xl p-3 bg-neutral-50 dark:bg-neutral-850/50 border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent-500/20">
                <Filter className="w-5 h-5 text-accent-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                  {tr('Димовий фільтр', 'Димовий фільтр', 'Smoke Filter')}
                </div>
                <div className="text-xs text-neutral-400">
                  {tr('Для генератора', 'Для генератора', 'Required for generator')}
                </div>
              </div>
            </div>
            {eq.respiratorFilterPurchased && (
              <span className="text-xs font-bold text-success-500 bg-success-500/10 px-2 py-0.5 rounded-md">
                {tr('Куплено', 'Куплено', 'Owned')}
              </span>
            )}
          </div>
          {!eq.respiratorFilterPurchased && (
            <button
              onClick={purchaseRespiratorFilter}
              disabled={state.balance < RESPIRATOR_FILTER_PRICE}
              className={`btn w-full py-2 text-sm rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 ${
                state.balance >= RESPIRATOR_FILTER_PRICE
                  ? 'bg-accent-500 text-white hover:bg-accent-600 hover:shadow-md active:scale-[0.98]'
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
              }`}
            >
              <Coins className="w-4 h-4" />
              {tr('Купити', 'Купити', 'Buy')} · {formatMoney(RESPIRATOR_FILTER_PRICE)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
