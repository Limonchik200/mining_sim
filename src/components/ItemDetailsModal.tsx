import {
  X,
  Timer,
  Zap,
  Scale,
  Footprints,
  ShoppingBasket,
  Package,
  ChevronRight,
  Wrench,
  Plus,
  ArrowDownToLine,
  Gem,
  CheckCircle2,
  XCircle,
  Lock,
  Sparkles,
} from 'lucide-react';
import {
  ITEM_TYPES,
  ITEM_LEVEL_NAMES,
  UPGRADE_COSTS,
  getItemEffect,
  getItemName,
  getItemLevelName,
  getItemRarityName,
} from '@/config/itemsConfig';
import { MATERIALS_CONFIG } from '@/config/expeditions';
import type { ItemType, OwnedItem, ItemLevel, ItemEffect } from '@/types/items';
import type { Lang } from '@/types';
import type { MaterialId } from '@/config/expeditions';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Timer,
  Zap,
  Scale,
  Footprints,
  ShoppingBasket,
};

interface EffectLine {
  label: string;
  current: string;
  next: string;
}

function getEffectLines(type: ItemType, level: ItemLevel, nextLevel: ItemLevel, lang: Lang): EffectLine[] {
  const cur = getItemEffect(type, level);
  const next = getItemEffect(type, nextLevel);
  const lines: EffectLine[] = [];

  const compare = (key: keyof ItemEffect, label: string, fmt: (v: number) => string) => {
    if (cur[key] === next[key] && cur[key] === 0) return;
    if (cur[key] !== next[key] || cur[key] !== 0) {
      lines.push({ label, current: fmt(cur[key] as number), next: fmt(next[key] as number) });
    }
  };

  compare('activeLeaseMultBonus', lang === 'ru' ? 'Множитель аренды' : (lang === 'uk' ? 'Множник оренди' : 'Lease mult'), (v) => `+${v}x`);
  compare('energyMaxBonus', lang === 'ru' ? 'Лимит энергии' : (lang === 'uk' ? 'Ліміт енергії' : 'Energy limit'), (v) => `+${v}`);
  compare('energyRegenBonus', lang === 'ru' ? 'Регенерация' : (lang === 'uk' ? 'Регенерація' : 'Regen'), (v) => `+${v}`);
  compare('foodBonusPct', lang === 'ru' ? 'Бонус еды' : (lang === 'uk' ? 'Бонус їжі' : 'Food bonus'), (v) => `+${Math.round(v * 100)}%`);
  compare('sellMultBonus', lang === 'ru' ? 'Множитель продажи' : (lang === 'uk' ? 'Множник продажу' : 'Sell mult'), (v) => `+${v}x`);
  compare('expeditionTimeReductionPct', lang === 'ru' ? 'Время экспедиций' : (lang === 'uk' ? 'Час експедицій' : 'Expedition time'), (v) => `-${v}%`);
  compare('expeditionRefreshReductionPct', lang === 'ru' ? 'Обновление эксп.' : (lang === 'uk' ? 'Оновлення експ.' : 'Expedition refresh'), (v) => `-${v}%`);
  compare('expeditionLootChance', lang === 'ru' ? 'Шанс лута' : (lang === 'uk' ? 'Шанс луту' : 'Loot chance'), (v) => `${Math.round(v * 100)}%`);
  compare('expeditionLootMult', lang === 'ru' ? 'Множитель лута' : (lang === 'uk' ? 'Множник луту' : 'Loot mult'), (v) => `x${v}`);

  return lines;
}

function getMaterialName(matId: string, lang: Lang): string {
  const mat = MATERIALS_CONFIG[matId as MaterialId];
  if (!mat) return matId;
  return lang === 'ru' ? (mat.nameRu || mat.name) : (lang === 'uk' ? mat.name : (mat.nameEn || mat.name));
}

function getMaterialIcon(matId: string): string {
  const mat = MATERIALS_CONFIG[matId as MaterialId];
  return mat?.icon || '?';
}

interface ItemDetailsModalProps {
  item: OwnedItem;
  lang: Lang;
  isEquipped: boolean;
  equipSlot: number | null;
  availableSlots: number[];
  materials: Record<string, number>;
  gems: number;
  onEquip: (uid: string, slot: number) => void;
  onUnequip: (slot: number) => void;
  onUpgrade: (uid: string) => void;
  onClose: () => void;
  t: (k: any) => string;
}

export default function ItemDetailsModal({
  item,
  lang,
  isEquipped,
  equipSlot,
  availableSlots,
  materials,
  gems,
  onEquip,
  onUnequip,
  onUpgrade,
  onClose,
  t,
}: ItemDetailsModalProps) {
  const info = ITEM_TYPES[item.type];
  const Icon = ICON_MAP[info.icon] || Package;
  const levelInfo = ITEM_LEVEL_NAMES[item.level];
  const isMaxLevel = item.level >= 7;
  const cost = UPGRADE_COSTS[item.level];
  const hasCost = cost && Object.keys(cost).length > 0;

  const nextLevel = Math.min(item.level + 1, 7) as ItemLevel;
  const effectLines = getEffectLines(item.type, item.level, nextLevel, lang);

  const desc = lang === 'ru' ? info.descRu : (lang === 'uk' ? info.descUk : info.descEn);

  const costEntries = hasCost
    ? Object.entries(cost).filter(([k]) => k !== 'gems')
    : [];
  const gemCost = cost?.gems || 0;

  const hasGems = gems >= gemCost;
  const materialsCheck = costEntries.map(([matId, amount]) => {
    const have = materials[matId] || 0;
    return { matId, amount: amount as number, have, enough: have >= amount };
  });
  const allMaterialsOk = materialsCheck.every((m) => m.enough) && hasGems;
  const canUpgrade = !isMaxLevel && hasCost && allMaterialsOk;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-sm max-h-[92vh] overflow-y-auto p-5 animate-drop-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: info.color + '20' }}
            >
              <Icon className="w-6 h-6" style={{ color: info.color }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: info.color }}>
                {getItemName(item.type, lang)}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                  style={{ backgroundColor: levelInfo.color + '20', color: levelInfo.color }}
                >
                  {getItemLevelName(item.level, lang)}
                </span>
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                  style={{ backgroundColor: ITEM_LEVEL_NAMES[1].color + '15', color: '#94a3b8' }}
                >
                  {getItemRarityName(item.rarity, lang)}
                </span>
                {isEquipped && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-success-500/20 text-success-500">
                    {t('itemsSlot')} {equipSlot !== null ? equipSlot + 1 : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors shrink-0"
          >
            <X className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
          </button>
        </div>

        {/* Description */}
        <div className="rounded-xl p-3 bg-neutral-50 dark:bg-neutral-850/50 border border-neutral-200 dark:border-neutral-800 mb-4">
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">{desc}</p>
        </div>

        {/* Effect progression */}
        {effectLines.length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {lang === 'ru' ? 'Характеристики' : (lang === 'uk' ? 'Характеристики' : 'Stats')}
            </div>
            <div className="space-y-1.5">
              {effectLines.map((line, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg px-3 py-2 bg-neutral-50 dark:bg-neutral-850/50 border border-neutral-200 dark:border-neutral-800"
                >
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">{line.label}</span>
                  {!isMaxLevel ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold">
                      <span className="text-neutral-700 dark:text-neutral-300">{line.current}</span>
                      <ChevronRight className="w-3 h-3 text-neutral-400" />
                      <span className="text-success-500">{line.next}</span>
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-success-500">{line.current}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upgrade materials */}
        {!isMaxLevel && hasCost && (
          <div className="mb-4">
            <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2 flex items-center gap-1">
              <Wrench className="w-3 h-3" />
              {t('itemsUpgradeCost')}
            </div>
            <div className="space-y-1.5">
              {/* Gems */}
              {gemCost > 0 && (
                <div
                  className={`flex items-center justify-between rounded-lg px-3 py-2 border ${
                    hasGems
                      ? 'bg-success-500/5 border-success-500/20'
                      : 'bg-error-500/5 border-error-500/20'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    <Gem className="w-3.5 h-3.5 text-accent-500" />
                    {lang === 'ru' ? 'Алмазы' : (lang === 'uk' ? 'Алмази' : 'Gems')}
                  </span>
                  <span className={`flex items-center gap-1.5 text-xs font-bold ${hasGems ? 'text-success-500' : 'text-error-500'}`}>
                    {gems} / {gemCost}
                    {hasGems ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  </span>
                </div>
              )}
              {/* Materials */}
              {materialsCheck.map((m) => (
                <div
                  key={m.matId}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 border ${
                    m.enough
                      ? 'bg-success-500/5 border-success-500/20'
                      : 'bg-error-500/5 border-error-500/20'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    <span>{getMaterialIcon(m.matId)}</span>
                    {getMaterialName(m.matId, lang)}
                  </span>
                  <span className={`flex items-center gap-1.5 text-xs font-bold ${m.enough ? 'text-success-500' : 'text-error-500'}`}>
                    {m.have} / {m.amount}
                    {m.enough ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Max level notice */}
        {isMaxLevel && (
          <div className="mb-4 rounded-xl p-3 bg-success-500/10 border border-success-500/20 flex items-center justify-center gap-1.5 text-sm font-bold text-success-500">
            <Lock className="w-4 h-4" />
            {t('itemsMaxLevel')}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {!isEquipped ? (
            availableSlots.length > 0 ? (
              <button
                onClick={() => onEquip(item.uid, availableSlots[0])}
                className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                {t('itemsEquip')}
              </button>
            ) : (
              <div className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-400 text-center">
                {lang === 'ru' ? 'Нет слотов' : (lang === 'uk' ? 'Немає слотів' : 'No slots')}
              </div>
            )
          ) : (
            equipSlot !== null && (
              <button
                onClick={() => onUnequip(equipSlot)}
                className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowDownToLine className="w-4 h-4" />
                {lang === 'ru' ? 'Снять' : (lang === 'uk' ? 'Зняти' : 'Unequip')}
              </button>
            )
          )}
          {!isMaxLevel && hasCost && (
            <button
              onClick={() => onUpgrade(item.uid)}
              disabled={!canUpgrade}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
                canUpgrade
                  ? 'bg-warning-500 text-white hover:bg-warning-600'
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
              }`}
            >
              <Wrench className="w-4 h-4" />
              {t('itemsUpgrade')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
