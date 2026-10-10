import { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { ITEM_TYPES, ITEM_LEVEL_NAMES, UPGRADE_COSTS, getItemEffect, getItemName, getItemLevelName } from '@/config/itemsConfig';
import { MATERIALS_CONFIG } from '@/config/expeditions';
import type { ItemType, OwnedItem, ItemLevel } from '@/types/items';
import type { Lang } from '@/types';
import {
  X,
  Timer,
  Zap,
  Scale,
  Footprints,
  ShoppingBasket,
  ShoppingBag,
  ChevronUp,
  Package,
  Sparkles,
  Gem,
  Plus,
  ArrowDownToLine,
  Wrench,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Timer,
  Zap,
  Scale,
  Footprints,
  ShoppingBasket,
};

function EffectDescription({ type, level, lang }: { type: ItemType; level: ItemLevel; lang: Lang }) {
  const eff = getItemEffect(type, level);
  const parts: string[] = [];

  if (eff.activeLeaseMultBonus > 0) {
    parts.push(lang === 'ru' ? `+${eff.activeLeaseMultBonus}х к аренде` : (lang === 'uk' ? `+${eff.activeLeaseMultBonus}х до оренди` : `+${eff.activeLeaseMultBonus}x lease`));
  }
  if (eff.energyMaxBonus > 0) {
    parts.push(lang === 'ru' ? `+${eff.energyMaxBonus} энергии` : (lang === 'uk' ? `+${eff.energyMaxBonus} енергії` : `+${eff.energyMaxBonus} energy`));
  }
  if (eff.energyRegenBonus > 0) {
    parts.push(lang === 'ru' ? `+${eff.energyRegenBonus} реген.` : (lang === 'uk' ? `+${eff.energyRegenBonus} реген.` : `+${eff.energyRegenBonus} regen`));
  }
  if (eff.foodBonusPct > 0) {
    parts.push(lang === 'ru' ? `+${Math.round(eff.foodBonusPct * 100)}% от еды` : (lang === 'uk' ? `+${Math.round(eff.foodBonusPct * 100)}% від їжі` : `+${Math.round(eff.foodBonusPct * 100)}% food`));
  }
  if (eff.sellMultBonus > 0) {
    parts.push(lang === 'ru' ? `+${eff.sellMultBonus}х к продаже` : (lang === 'uk' ? `+${eff.sellMultBonus}х до продажу` : `+${eff.sellMultBonus}x sell`));
  }
  if (eff.expeditionTimeReductionPct > 0) {
    parts.push(lang === 'ru' ? `-${eff.expeditionTimeReductionPct}% эксп.` : (lang === 'uk' ? `-${eff.expeditionTimeReductionPct}% експ.` : `-${eff.expeditionTimeReductionPct}% exp.`));
  }
  if (eff.expeditionRefreshReductionPct > 0) {
    parts.push(lang === 'ru' ? `-${eff.expeditionRefreshReductionPct}% обновл.` : (lang === 'uk' ? `-${eff.expeditionRefreshReductionPct}% оновл.` : `-${eff.expeditionRefreshReductionPct}% refresh`));
  }
  if (eff.expeditionLootChance > 0) {
    parts.push(lang === 'ru' ? `${Math.round(eff.expeditionLootChance * 100)}% x${eff.expeditionLootMult} лут` : (lang === 'uk' ? `${Math.round(eff.expeditionLootChance * 100)}% x${eff.expeditionLootMult} лут` : `${Math.round(eff.expeditionLootChance * 100)}% x${eff.expeditionLootMult} loot`));
  }

  return <span>{parts.join(' · ')}</span>;
}

function ItemCard({
  item,
  lang,
  isEquipped,
  equipSlot,
  onEquip,
  onUpgrade,
  t,
}: {
  item: OwnedItem;
  lang: Lang;
  isEquipped: boolean;
  equipSlot: number | null;
  onEquip: (uid: string) => void;
  onUpgrade: (uid: string) => void;
  t: (k: any) => string;
}) {
  const info = ITEM_TYPES[item.type];
  const Icon = ICON_MAP[info.icon] || Package;
  const levelInfo = ITEM_LEVEL_NAMES[item.level];
  const isMaxLevel = item.level >= 7;
  const cost = UPGRADE_COSTS[item.level];
  const hasCost = cost && Object.keys(cost).length > 0;

  return (
    <div
      className={`rounded-2xl p-3 border-2 transition-all ${isEquipped ? 'ring-2 ring-success-500/30' : ''}`}
      style={{
        borderColor: levelInfo.color + (isEquipped ? '' : '60'),
        backgroundColor: levelInfo.color + (isEquipped ? '12' : '08'),
        order: isEquipped ? 0 : 1,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: info.color + '20' }}
        >
          <Icon className="w-5 h-5" style={{ color: info.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold truncate" style={{ color: info.color }}>
            {getItemName(item.type, lang)}
          </div>
          <div className="text-[10px] font-semibold" style={{ color: levelInfo.color }}>
            {getItemLevelName(item.level, lang)}
          </div>
        </div>
        {isEquipped && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-success-500/20 text-success-500 whitespace-nowrap">
            {t('itemsSlot')} {equipSlot !== null ? equipSlot + 1 : ''}
          </span>
        )}
      </div>

      {/* Effect */}
      <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mb-2 leading-relaxed">
        <EffectDescription type={item.type} level={item.level} lang={lang} />
      </div>

      {/* Actions */}
      <div className="flex gap-1.5">
        {!isEquipped ? (
          <button
            onClick={() => onEquip(item.uid)}
            className="flex-1 py-1.5 text-[11px] font-semibold rounded-lg bg-primary-500/20 text-primary-600 dark:text-primary-400 hover:bg-primary-500/30 transition-colors flex items-center justify-center gap-1"
          >
            <Plus className="w-3 h-3" />
            {t('itemsEquip')}
          </button>
        ) : null}
        {hasCost && !isMaxLevel && (
          <button
            onClick={() => onUpgrade(item.uid)}
            className="flex-1 py-1.5 text-[11px] font-semibold rounded-lg bg-warning-500/20 text-warning-600 dark:text-warning-400 hover:bg-warning-500/30 transition-colors flex items-center justify-center gap-1"
          >
            <ChevronUp className="w-3 h-3" />
            {t('itemsUpgrade')}
          </button>
        )}
        {isMaxLevel && (
          <div className="flex-1 py-1.5 text-[11px] font-bold rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-400 text-center">
            MAX
          </div>
        )}
      </div>

      {/* Upgrade cost preview */}
      {hasCost && !isMaxLevel && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {cost.gems && (
            <span className="text-[9px] flex items-center gap-0.5 text-accent-500">
              <Gem className="w-2.5 h-2.5" /> {cost.gems}
            </span>
          )}
          {Object.entries(cost).map(([matId, amount]) => {
            if (matId === 'gems') return null;
            const mat = MATERIALS_CONFIG[matId as keyof typeof MATERIALS_CONFIG];
            if (!mat) return null;
            return (
              <span key={matId} className="text-[9px] flex items-center gap-0.5 text-neutral-500 dark:text-neutral-400">
                {mat.icon} {amount}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ItemsModal() {
  const { state, itemsOpen, setItemsOpen, openItemBag, equipItem, unequipItem, upgradeItem, t, lang, totalItemEffects } = useGame();
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [contextSlot, setContextSlot] = useState<number | null>(null);

  if (!itemsOpen) return null;

  const equippedUids = new Set(state.equippedItems.filter(Boolean) as string[]);

  const activeEffectsList: { label: string; value: string }[] = [];
  if (totalItemEffects.activeLeaseMultBonus > 0)
    activeEffectsList.push({ label: lang === 'ru' ? 'Аренда' : (lang === 'uk' ? 'Оренда' : 'Lease'), value: `+${totalItemEffects.activeLeaseMultBonus}x` });
  if (totalItemEffects.energyMaxBonus > 0)
    activeEffectsList.push({ label: lang === 'ru' ? 'Энергия' : (lang === 'uk' ? 'Енергія' : 'Energy'), value: `+${totalItemEffects.energyMaxBonus}` });
  if (totalItemEffects.energyRegenBonus > 0)
    activeEffectsList.push({ label: lang === 'ru' ? 'Реген.' : (lang === 'uk' ? 'Реген.' : 'Regen'), value: `+${totalItemEffects.energyRegenBonus}` });
  if (totalItemEffects.foodBonusPct > 0)
    activeEffectsList.push({ label: lang === 'ru' ? 'Еда' : (lang === 'uk' ? 'Їжа' : 'Food'), value: `+${Math.round(totalItemEffects.foodBonusPct * 100)}%` });
  if (totalItemEffects.sellMultBonus > 0)
    activeEffectsList.push({ label: lang === 'ru' ? 'Продажа' : (lang === 'uk' ? 'Продаж' : 'Sell'), value: `+${totalItemEffects.sellMultBonus}x` });
  if (totalItemEffects.expeditionTimeReductionPct > 0)
    activeEffectsList.push({ label: lang === 'ru' ? 'Эксп.' : (lang === 'uk' ? 'Експ.' : 'Exped.'), value: `-${totalItemEffects.expeditionTimeReductionPct}%` });
  if (totalItemEffects.expeditionRefreshReductionPct > 0)
    activeEffectsList.push({ label: lang === 'ru' ? 'Обновл.' : (lang === 'uk' ? 'Оновл.' : 'Refresh'), value: `-${totalItemEffects.expeditionRefreshReductionPct}%` });
  if (totalItemEffects.expeditionLootChance > 0)
    activeEffectsList.push({ label: lang === 'ru' ? 'Лут' : (lang === 'uk' ? 'Лут' : 'Loot'), value: `${Math.round(totalItemEffects.expeditionLootChance * 100)}% x${totalItemEffects.expeditionLootMult}` });

  const sortedItems = [...state.ownedItems].sort((a, b) => {
    const aEq = equippedUids.has(a.uid) ? 0 : 1;
    const bEq = equippedUids.has(b.uid) ? 0 : 1;
    return aEq - bEq;
  });

  const contextItem = contextSlot !== null
    ? (state.equippedItems[contextSlot] ? state.ownedItems.find((o) => o.uid === state.equippedItems[contextSlot]) : null)
    : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3"
      onClick={() => setItemsOpen(false)}
    >
      <div
        className="card w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 animate-drop-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-warning-500" />
            {t('itemsTitle')}
          </h2>
          <div className="flex items-center gap-2">
            {state.itemBags > 0 && (
              <button
                onClick={openItemBag}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-warning-500 text-white hover:bg-warning-600 transition-colors flex items-center gap-1.5 animate-pulse-glow"
              >
                <Package className="w-3.5 h-3.5" />
                {t('itemsOpenBag')} ({state.itemBags})
              </button>
            )}
            <button
              onClick={() => setItemsOpen(false)}
              className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
            >
              <X className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            </button>
          </div>
        </div>

        {/* Active effects summary */}
        {activeEffectsList.length > 0 && (
          <div className="mb-4 rounded-xl p-3 bg-success-500/10 border border-success-500/20">
            <div className="text-[10px] font-bold uppercase tracking-wide text-success-600 dark:text-success-400 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {t('itemsTotalEffects')}
            </div>
            <div className="flex flex-wrap gap-2">
              {activeEffectsList.map((eff, i) => (
                <span key={i} className="text-xs font-semibold text-success-600 dark:text-success-400 bg-success-500/10 px-2 py-0.5 rounded-md">
                  {eff.label} {eff.value}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Equipment slots */}
        <div className="mb-4">
          <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
            {t('itemsEquipped')} (6)
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {state.equippedItems.map((uid, slotIdx) => {
              const item = uid ? state.ownedItems.find((o) => o.uid === uid) : null;
              const info = item ? ITEM_TYPES[item.type] : null;
              const Icon = info ? ICON_MAP[info.icon] : null;
              const levelInfo = item ? ITEM_LEVEL_NAMES[item.level] : null;
              return (
                <button
                  key={slotIdx}
                  onClick={() => {
                    if (item) {
                      setContextSlot(contextSlot === slotIdx ? null : slotIdx);
                      setSelectedSlot(null);
                    } else if (selectedSlot === slotIdx) {
                      setSelectedSlot(null);
                    } else {
                      setSelectedSlot(slotIdx);
                      setContextSlot(null);
                    }
                  }}
                  className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all relative ${
                    item
                      ? 'border-transparent'
                      : selectedSlot === slotIdx
                      ? 'border-primary-500 bg-primary-500/10 animate-pulse'
                      : 'border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600'
                  }`}
                  style={
                    item && levelInfo
                      ? { backgroundColor: (info?.color || '#94a3b8') + '15', borderColor: levelInfo.color + '80' }
                      : undefined
                  }
                >
                  {item && Icon && info && levelInfo ? (
                    <>
                      <Icon className="w-5 h-5" style={{ color: info.color }} />
                      <span className="text-[8px] font-bold mt-0.5" style={{ color: levelInfo.color }}>
                        {getItemLevelName(item.level, lang)}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] text-neutral-400">{slotIdx + 1}</span>
                      {selectedSlot === slotIdx && (
                        <Plus className="w-3 h-3 text-primary-500 mt-0.5" />
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* Context menu for equipped slot */}
          {contextSlot !== null && contextItem && (() => {
            const info = ITEM_TYPES[contextItem.type];
            const Icon = ICON_MAP[info.icon] || Package;
            const levelInfo = ITEM_LEVEL_NAMES[contextItem.level];
            const isMaxLevel = contextItem.level >= 7;
            const cost = UPGRADE_COSTS[contextItem.level];
            const hasCost = cost && Object.keys(cost).length > 0;
            return (
              <div className="mt-2 rounded-xl p-3 border-2" style={{ borderColor: levelInfo.color + '60', backgroundColor: levelInfo.color + '08' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: info.color + '20' }}>
                    <Icon className="w-4 h-4" style={{ color: info.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold truncate" style={{ color: info.color }}>
                      {getItemName(contextItem.type, lang)}
                    </div>
                    <div className="text-[10px]" style={{ color: levelInfo.color }}>
                      {getItemLevelName(contextItem.level, lang)}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mb-2">
                  <EffectDescription type={contextItem.type} level={contextItem.level} lang={lang} />
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      unequipItem(contextSlot);
                      setContextSlot(null);
                    }}
                    className="flex-1 py-1.5 text-[11px] font-semibold rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors flex items-center justify-center gap-1"
                  >
                    <ArrowDownToLine className="w-3 h-3" />
                    {lang === 'ru' ? 'Снять' : (lang === 'uk' ? 'Зняти' : 'Unequip')}
                  </button>
                  {hasCost && !isMaxLevel && (
                    <button
                      onClick={() => {
                        upgradeItem(contextItem.uid);
                      }}
                      className="flex-1 py-1.5 text-[11px] font-semibold rounded-lg bg-warning-500/20 text-warning-600 dark:text-warning-400 hover:bg-warning-500/30 transition-colors flex items-center justify-center gap-1"
                    >
                      <Wrench className="w-3 h-3" />
                      {t('itemsUpgrade')}
                    </button>
                  )}
                  <button
                    onClick={() => setContextSlot(null)}
                    className="px-2 py-1.5 text-[11px] font-semibold rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })()}

          {selectedSlot !== null && (
            <p className="text-[10px] text-primary-500 mt-1.5 text-center font-medium">
              {lang === 'ru' ? 'Выберите предмет из инвентаря для слота' : (lang === 'uk' ? 'Оберіть предмет з інвентарю для слоту' : 'Select an item from inventory for the slot')}
            </p>
          )}
        </div>

        {/* Inventory */}
        <div>
          <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
            {t('itemsInventory')} ({state.ownedItems.length})
          </h3>
          {state.ownedItems.length === 0 ? (
            <div className="card p-6 text-center">
              <ShoppingBag className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
              <p className="text-sm text-neutral-400">{t('itemsEmpty')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {sortedItems.map((item) => (
                <ItemCard
                  key={item.uid}
                  item={item}
                  lang={lang}
                  isEquipped={equippedUids.has(item.uid)}
                  equipSlot={state.equippedItems.indexOf(item.uid)}
                  onEquip={(uid) => {
                    const slot = selectedSlot !== null ? selectedSlot : state.equippedItems.findIndex((u) => u === null);
                    if (slot >= 0) {
                      equipItem(uid, slot);
                      setSelectedSlot(null);
                    }
                  }}
                  onUpgrade={upgradeItem}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
