import { X, Recycle, Gem, AlertTriangle } from 'lucide-react';
import type { OwnedItem, ItemLevel } from '@/types/items';
import type { Lang } from '@/types';
import { UPGRADE_COSTS, ITEM_TYPES, getItemName } from '@/config/itemsConfig';
import { MATERIALS_CONFIG } from '@/config/expeditions';
import type { MaterialId } from '@/config/expeditions';

function getMaterialName(matId: string, lang: Lang): string {
  const mat = MATERIALS_CONFIG[matId as MaterialId];
  if (!mat) return matId;
  return lang === 'ru' ? (mat.nameRu || mat.name) : (lang === 'uk' ? mat.name : (mat.nameEn || mat.name));
}

function getMaterialIcon(matId: string): string {
  const mat = MATERIALS_CONFIG[matId as MaterialId];
  return mat?.icon || '?';
}

export function computeRecycleReturns(item: OwnedItem): { gems: number; materials: Record<string, number> } {
  if (item.level === 1) {
    return { gems: 3, materials: { scroll: 2 } };
  }

  const returnedMaterials: Record<string, number> = {};
  let returnedGems = 0;
  for (let lvl = 1; lvl < item.level; lvl++) {
    const cost = UPGRADE_COSTS[lvl as ItemLevel];
    if (!cost) continue;
    for (const [matId, amount] of Object.entries(cost)) {
      if (matId === 'gems') {
        returnedGems += Math.floor((amount as number) * 0.4);
      } else {
        const val = Math.floor((amount as number) * 0.4);
        if (val > 1) {
          returnedMaterials[matId] = (returnedMaterials[matId] || 0) + val;
        }
      }
    }
  }
  return { gems: returnedGems, materials: returnedMaterials };
}

interface RecycleModalProps {
  item: OwnedItem;
  lang: Lang;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function RecycleModal({ item, lang, onConfirm, onCancel }: RecycleModalProps) {
  const info = ITEM_TYPES[item.type];
  const returns = computeRecycleReturns(item);
  const materialEntries = Object.entries(returns.materials);

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3"
      onClick={onCancel}
    >
      <div
        className="card w-full max-w-sm p-5 animate-drop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: info.color + '20' }}
            >
              <Recycle className="w-5 h-5" style={{ color: info.color }} />
            </div>
            <h2 className="text-base font-bold text-neutral-800 dark:text-neutral-100">
              {lang === 'ru' ? 'Утилизация' : (lang === 'uk' ? 'Утилізація' : 'Recycling')}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors shrink-0"
          >
            <X className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
          </button>
        </div>

        <div className="rounded-xl p-3 bg-warning-500/10 border border-warning-500/20 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-warning-500 shrink-0 mt-0.5" />
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {lang === 'ru'
                ? `Вы пытаетесь утилизировать предмет "${getItemName(item.type, lang)}". После утилизации вам будут возвращены следующие материалы:`
                : lang === 'uk'
                ? `Ви намагаєтесь утилізувати предмет "${getItemName(item.type, lang)}". Після утилізації вам будуть повернуті такі матеріали:`
                : `You are about to recycle "${getItemName(item.type, lang)}". After recycling, the following materials will be returned:`}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 mb-4">
          {returns.gems > 0 && (
            <div className="flex items-center justify-between rounded-lg px-3 py-2 bg-success-500/5 border border-success-500/20">
              <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                <Gem className="w-3.5 h-3.5 text-accent-500" />
                {lang === 'ru' ? 'Алмазы' : (lang === 'uk' ? 'Алмази' : 'Gems')}
              </span>
              <span className="text-xs font-bold text-success-500">+{returns.gems}</span>
            </div>
          )}
          {materialEntries.map(([matId, amount]) => (
            <div
              key={matId}
              className="flex items-center justify-between rounded-lg px-3 py-2 bg-success-500/5 border border-success-500/20"
            >
              <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                <span>{getMaterialIcon(matId)}</span>
                {getMaterialName(matId, lang)}
              </span>
              <span className="text-xs font-bold text-success-500">+{amount}</span>
            </div>
          ))}
          {returns.gems === 0 && materialEntries.length === 0 && (
            <div className="text-xs text-neutral-400 text-center py-2">
              {lang === 'ru' ? 'Нечего вернуть' : (lang === 'uk' ? 'Немає чого повернути' : 'Nothing to return')}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
          >
            {lang === 'ru' ? 'Отмена' : (lang === 'uk' ? 'Скасувати' : 'Cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-warning-500 text-white hover:bg-warning-600 transition-colors flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Recycle className="w-4 h-4" />
            {lang === 'ru' ? 'Подтвердить' : (lang === 'uk' ? 'Підтвердити' : 'Confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
