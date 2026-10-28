import { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { ITEM_TYPES, ITEM_LEVEL_NAMES, UPGRADE_COSTS, getItemEffect, getItemName, getItemLevelName } from '@/config/itemsConfig';
import { MATERIALS_CONFIG } from '@/config/expeditions';
import type { ItemType, OwnedItem, ItemLevel } from '@/types/items';
import type { Lang } from '@/types';
import ItemDetailsModal from '@/components/ItemDetailsModal';
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
  Lock,
  CheckCircle2,
  Diamond,
  Briefcase,
  Map,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Timer,
  Zap,
  Scale,
  Footprints,
  ShoppingBasket,
  Gem,
  Diamond,
  Map,
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
  if (eff.expeditionExtraChance > 0) {
    const pct = Math.round(eff.expeditionExtraChance * 100);
    const extraStr = lang === 'ru' ? `${pct}% +${eff.expeditionExtraCount} эксп.` : (lang === 'uk' ? `${pct}% +${eff.expeditionExtraCount} експ.` : `${pct}% +${eff.expeditionExtraCount} exped.`);
    parts.push(extraStr);
  }
  if (eff.expeditionTier6Chance > 0) {
    const pct = Math.round(eff.expeditionTier6Chance * 100);
    parts.push(lang === 'ru' ? `${pct}% Тир-6` : (lang === 'uk' ? `${pct}% Тір-6` : `${pct}% Tier-6`));
  }
  if (eff.oreYieldMultChance > 0) {
    parts.push(lang === 'ru' ? `${Math.round(eff.oreYieldMultChance * 100)}% x${eff.oreYieldMult} руда` : (lang === 'uk' ? `${Math.round(eff.oreYieldMultChance * 100)}% x${eff.oreYieldMult} руда` : `${Math.round(eff.oreYieldMultChance * 100)}% x${eff.oreYieldMult} ore`));
  }
  if (eff.diamondDropBonus > 0) {
    parts.push(lang === 'ru' ? `+${(eff.diamondDropBonus * 100).toFixed(3)}% алмаз` : (lang === 'uk' ? `+${(eff.diamondDropBonus * 100).toFixed(3)}% алмаз` : `+${(eff.diamondDropBonus * 100).toFixed(3)}% diamond`));
  }
  if (eff.diamondMultChance > 0) {
    parts.push(lang === 'ru' ? `${Math.round(eff.diamondMultChance * 100)}% x${eff.diamondMult} алмаз` : (lang === 'uk' ? `${Math.round(eff.diamondMultChance * 100)}% x${eff.diamondMult} алмаз` : `${Math.round(eff.diamondMultChance * 100)}% x${eff.diamondMult} diamond`));
  }

  return <span>{parts.join(' · ')}</span>;
}

function ItemCard({
  item,
  lang,
  isEquipped,
  equipSlot,
  onClick,
  t,
}: {
  item: OwnedItem;
  lang: Lang;
  isEquipped: boolean;
  equipSlot: number | null;
  onClick: () => void;
  t: (k: any) => string;
}) {
  const info = ITEM_TYPES[item.type];
  const Icon = ICON_MAP[info.icon] || Package;
  const levelInfo = ITEM_LEVEL_NAMES[item.level];
  const isMaxLevel = item.level >= 7;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl p-3 border-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg ${isEquipped ? 'ring-2 ring-success-500/40 shadow-md shadow-success-500/10' : ''}`}
      style={{
        borderColor: levelInfo.color + (isEquipped ? '' : '60'),
        background: isEquipped
          ? `linear-gradient(135deg, ${levelInfo.color}15, ${info.color}08)`
          : undefined,
        backgroundColor: isEquipped ? undefined : levelInfo.color + '08',
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
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-success-500/20 text-success-500 whitespace-nowrap flex items-center gap-0.5">
            <CheckCircle2 className="w-2.5 h-2.5" />
            {t('itemsSlot')} {equipSlot !== null ? equipSlot + 1 : ''}
          </span>
        )}
      </div>

      {/* Effect */}
      <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mb-2 leading-relaxed">
        <EffectDescription type={item.type} level={item.level} lang={lang} />
      </div>

      {/* Hint */}
      <div className="text-[9px] text-neutral-400 text-center font-medium">
        {isMaxLevel ? 'MAX' : (lang === 'ru' ? 'Нажмите для деталей' : (lang === 'uk' ? 'Натисніть для деталей' : 'Tap for details'))}
      </div>
    </button>
  );
}

function ItemRevealModal({
  item,
  lang,
  onClose,
  onOpenAnother,
  canOpenAnother,
  t,
}: {
  item: OwnedItem;
  lang: Lang;
  onClose: () => void;
  onOpenAnother: () => void;
  canOpenAnother: boolean;
  t: (k: any) => string;
}) {
  const info = ITEM_TYPES[item.type];
  const Icon = ICON_MAP[info.icon] || Package;
  const levelInfo = ITEM_LEVEL_NAMES[item.level];

  return (
    <div
      className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-xs p-6 animate-drop-in text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-xs font-bold uppercase tracking-wide text-warning-500 mb-4 flex items-center justify-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          {lang === 'ru' ? 'Из сумки выпал:' : (lang === 'uk' ? 'З сумки випав:' : 'From the bag:')}
        </div>

        <div className="relative inline-flex items-center justify-center mb-4">
          <div
            className="absolute inset-0 rounded-full blur-2xl animate-pulse"
            style={{ backgroundColor: info.color + '40' }}
          />
          <div
            className="relative w-24 h-24 rounded-2xl flex items-center justify-center animate-drop-bounce"
            style={{ backgroundColor: info.color + '20', boxShadow: `0 0 30px ${info.color}60` }}
          >
            <Icon className="w-12 h-12" style={{ color: info.color }} />
          </div>
        </div>

        <div className="text-base font-bold mb-1" style={{ color: info.color }}>
          {getItemName(item.type, lang)}
        </div>
        <div className="flex items-center justify-center gap-1.5 mb-4">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-md"
            style={{ backgroundColor: levelInfo.color + '20', color: levelInfo.color }}
          >
            {getItemLevelName(item.level, lang)}
          </span>
        </div>

        <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mb-4 leading-relaxed">
          <EffectDescription type={item.type} level={item.level} lang={lang} />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
          >
            {t('close')}
          </button>
          {canOpenAnother && (
            <button
              onClick={onOpenAnother}
              className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-warning-500 text-white hover:bg-warning-600 transition-colors flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Package className="w-4 h-4" />
              {lang === 'ru' ? 'Ещё' : (lang === 'uk' ? 'Ще' : 'Open another')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ItemsModal() {
  const { state, itemsOpen, setItemsOpen, openItemBag, openSuitcase, equipItem, unequipItem, upgradeItem, recycleItem, unlockSlot6, isSlotUnlocked, t, lang, totalItemEffects } = useGame();
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<OwnedItem | null>(null);
  const [revealedItem, setRevealedItem] = useState<OwnedItem | null>(null);
  const [bagOpening, setBagOpening] = useState(false);
  const [suitcaseOpening, setSuitcaseOpening] = useState(false);

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
  if (totalItemEffects.expeditionExtraChance > 0)
    activeEffectsList.push({ label: lang === 'ru' ? 'Доп. эксп.' : (lang === 'uk' ? 'Дод. експ.' : 'Extra exped.'), value: `${Math.round(totalItemEffects.expeditionExtraChance * 100)}% +${totalItemEffects.expeditionExtraCount}` });
  if (totalItemEffects.expeditionTier6Chance > 0)
    activeEffectsList.push({ label: lang === 'ru' ? 'Тир-6' : (lang === 'uk' ? 'Тір-6' : 'Tier-6'), value: `${Math.round(totalItemEffects.expeditionTier6Chance * 100)}%` });

  const sortedItems = [...state.ownedItems].sort((a, b) => {
    const aEq = equippedUids.has(a.uid) ? 0 : 1;
    const bEq = equippedUids.has(b.uid) ? 0 : 1;
    if (aEq !== bEq) return aEq - bEq;
    return b.level - a.level;
  });

  const SLOT_UNLOCK_LEVELS = [0, 10, 20, 30, 40, 40];

  const availableSlots = state.equippedItems
    .map((uid, idx) => (uid === null && isSlotUnlocked(idx) ? idx : null))
    .filter((idx): idx is number => idx !== null);

  const handleOpenBag = () => {
    setBagOpening(true);
    setTimeout(() => {
      const result = openItemBag();
      if (result) {
        setRevealedItem(result);
      }
      setBagOpening(false);
    }, 800);
  };

  const handleOpenSuitcase = () => {
    setSuitcaseOpening(true);
    setTimeout(() => {
      const result = openSuitcase();
      if (result) {
        setRevealedItem(result.item);
      }
      setSuitcaseOpening(false);
    }, 800);
  };

  const handleOpenContainer = state.suitcases > 0 ? handleOpenSuitcase : handleOpenBag;

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
                onClick={handleOpenBag}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-warning-500 text-white hover:bg-warning-600 transition-all flex items-center gap-1.5 animate-pulse-glow active:scale-95"
              >
                <Package className="w-3.5 h-3.5" />
                {t('itemsOpenBag')} ({state.itemBags})
              </button>
            )}
            {state.suitcases > 0 && (
              <button
                onClick={handleOpenSuitcase}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-accent-500 text-white hover:bg-accent-600 transition-all flex items-center gap-1.5 animate-pulse-glow active:scale-95"
              >
                <Briefcase className="w-3.5 h-3.5" />
                {t('itemsOpenSuitcase')} ({state.suitcases})
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
              const unlocked = isSlotUnlocked(slotIdx);
              const unlockLevel = SLOT_UNLOCK_LEVELS[slotIdx];
              const isSlot6Paid = slotIdx === 5;

              if (!unlocked) {
                const levelMet = state.level >= unlockLevel;
                return (
                  <div
                    key={slotIdx}
                    className="aspect-square rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex flex-col items-center justify-center relative bg-neutral-50 dark:bg-neutral-850/30"
                  >
                    <Lock className="w-4 h-4 text-neutral-400" />
                    <span className="text-[8px] text-neutral-400 mt-0.5 font-semibold">
                      {isSlot6Paid
                        ? (levelMet ? '100 💎' : `Lvl ${unlockLevel}`)
                        : `Lvl ${unlockLevel}`}
                    </span>
                    {isSlot6Paid && levelMet && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          unlockSlot6();
                        }}
                        disabled={state.gems < 100}
                        className="mt-1 px-2 py-0.5 text-[8px] font-bold rounded-md bg-accent-500 text-white disabled:opacity-50 hover:bg-accent-600 transition-colors"
                      >
                        <Gem className="w-2.5 h-2.5 inline mr-0.5" />100
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={slotIdx}
                  onClick={() => {
                    if (item) {
                      setSelectedItem(item);
                      setSelectedSlot(null);
                    } else if (selectedSlot === slotIdx) {
                      setSelectedSlot(null);
                    } else {
                      setSelectedSlot(slotIdx);
                    }
                  }}
                  className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-300 relative ${
                    item
                      ? 'border-transparent hover:shadow-md hover:scale-105'
                      : selectedSlot === slotIdx
                      ? 'border-primary-500 bg-primary-500/10 animate-pulse'
                      : 'border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600'
                  }`}
                  style={
                    item && levelInfo
                      ? { backgroundColor: (info?.color || '#94a3b8') + '15', borderColor: levelInfo.color + '80', boxShadow: `0 0 12px ${levelInfo.color}30` }
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
                  onClick={() => setSelectedItem(item)}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Item Details Modal */}
      {selectedItem && (
        <ItemDetailsModal
          item={selectedItem}
          lang={lang}
          isEquipped={equippedUids.has(selectedItem.uid)}
          equipSlot={state.equippedItems.indexOf(selectedItem.uid)}
          availableSlots={availableSlots}
          materials={state.materials}
          gems={state.gems}
          onEquip={(uid, slot) => {
            equipItem(uid, slot);
            setSelectedSlot(null);
            setSelectedItem(null);
          }}
          onUnequip={(slot) => {
            unequipItem(slot);
            setSelectedItem(null);
          }}
          onUpgrade={(uid) => {
            upgradeItem(uid);
            setSelectedItem(null);
          }}
          onRecycle={(uid) => {
            recycleItem(uid);
            setSelectedItem(null);
          }}
          onClose={() => setSelectedItem(null)}
          t={t}
        />
      )}

      {/* Bag/Suitcase opening animation overlay */}
      {(bagOpening || suitcaseOpening) && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-none">
          <div className="relative">
            {suitcaseOpening ? (
              <Briefcase className="w-20 h-20 text-accent-500 animate-bag-shake" />
            ) : (
              <Package className="w-20 h-20 text-warning-500 animate-bag-shake" />
            )}
            <div className="absolute inset-0 rounded-full bg-warning-500/20 animate-ping" />
          </div>
        </div>
      )}

      {/* Item reveal modal */}
      {revealedItem && (
        <ItemRevealModal
          item={revealedItem}
          lang={lang}
          onClose={() => setRevealedItem(null)}
          onOpenAnother={handleOpenContainer}
          canOpenAnother={state.suitcases > 0 || state.itemBags > 0}
          t={t}
        />
      )}
    </div>
  );
}
