import React, { useState } from 'react';
import { BOSS_EQUIPMENT_CONFIG } from '../../config/bossEquipment/equipmentConfig';
import { EquipmentManager } from '../../managers/EquipmentManager';
import { ItemDetailsModal } from './ItemDetailsModal';
import type { BossLang } from '../../config/bosses/bossI18n';
import { getBossT } from '../../config/bosses/bossI18n';
import type { InventoryItem } from '../../context/BossContext';

interface EquipmentScreenProps {
  equipped: Record<string, { itemId: string; level: number; durability: number } | null>;
  inventory: InventoryItem[];
  playerTokens: number;
  materials: Record<string, number>;
  lang: BossLang;
  onEquipItem: (instanceId: string, slot: string) => void;
  onRepairItem: (slot: string) => void;
  onRepairAll: () => void;
  onOpenChest: (instanceId: string) => void;
  onUpgradeItem: (instanceId: string) => void;
  onUpgradeEquipped: (slot: string) => void;
  chestResult: string | null;
  onDismissChestResult: () => void;
}

const SLOT_NAMES: Record<BossLang, Record<string, string>> = {
  en: { weapon: '⚔️ Weapon', helmet: '🪖 Helmet', amulet: '📿 Amulet', chest: '👕 Chest', pants: '👖 Pants', boots: '👢 Boots' },
  ru: { weapon: '⚔️ Оружие', helmet: '🪖 Каска', amulet: '📿 Амулет', chest: '👕 Нагрудник', pants: '👖 Штаны', boots: '👢 Обувь' },
  uk: { weapon: '⚔️ Зброя', helmet: '🪖 Каска', amulet: '📿 Амулет', chest: '👕 Нагрудник', pants: '👖 Штани', boots: '👢 Взуття' },
};

const MATERIAL_ICONS: Record<string, string> = {
  bones: '🦴', fire_rod: '🔥', basalt_slab: '🪨', black_shards: '⚫',
  scroll: '📜', magma_stone: '🌋', solar_essence: '☀️', rainbow_stone: '🌈', mutagen_capsule: '🧬',
  diamond: '💎',
};

export const EquipmentScreen: React.FC<EquipmentScreenProps> = ({
  equipped, inventory, playerTokens, materials, lang,
  onEquipItem, onRepairItem, onRepairAll, onOpenChest, onUpgradeItem, onUpgradeEquipped,
  chestResult, onDismissChestResult,
}) => {
  const t = getBossT(lang);
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);
  const [detailEquippedSlot, setDetailEquippedSlot] = useState<string | null>(null);
  const slotNames = SLOT_NAMES[lang];

  return (
    <div className="flex flex-col h-full gap-4 text-white overflow-y-auto pr-1">
      {/* Chest open notification */}
      {chestResult && (
        <div className="bg-amber-900/40 border border-amber-500/50 rounded-xl p-3 flex items-center justify-between gap-3 animate-in fade-in">
          <span className="text-sm font-bold text-amber-300">
            🎁 {t('chestOpened', { item: chestResult })}
          </span>
          <button onClick={onDismissChestResult} className="text-amber-400 hover:text-white font-bold px-2">✕</button>
        </div>
      )}

      {/* Equipped slots */}
      <div className="flex justify-between items-center bg-slate-900/60 p-3 rounded-xl border border-slate-700">
        <h3 className="font-bold text-sm">{t('slotsEquipment')}</h3>
        <button onClick={onRepairAll} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 rounded-lg text-xs font-bold transition-all shadow-md">
          🛠️ {t('repairAll')}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {Object.keys(slotNames).map((slotKey) => {
          const item = equipped[slotKey];
          const itemConfig = item ? BOSS_EQUIPMENT_CONFIG[item.itemId] : null;
          const maxDur = item ? EquipmentManager.getMaxDurability(item.level) : 80;
          const repairInfo = item ? EquipmentManager.getRepairCost(item.durability, maxDur) : { tokenCost: 0 };

          return (
            <div key={slotKey} className="bg-slate-900/80 border border-slate-700 p-3 rounded-xl flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-slate-400 font-bold">{slotNames[slotKey]}</span>
                {item && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${item.durability > 0 ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
                    {item.durability > 0 ? t('active') : t('broken')}
                  </span>
                )}
              </div>
              {item && itemConfig ? (
                <div className="space-y-2">
                  <button onClick={() => setDetailEquippedSlot(slotKey)} className="text-left w-full">
                    <p className="text-sm font-extrabold text-indigo-300 hover:text-indigo-200 transition-colors">{itemConfig.name}</p>
                    <p className="text-xs text-slate-400">{t('itemLevel')}: {item.level} ({item.durability}/{maxDur})</p>
                  </button>
                  <button
                    onClick={() => onRepairItem(slotKey)}
                    disabled={item.durability >= maxDur || playerTokens < repairInfo.tokenCost}
                    className="w-full py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-[11px] rounded font-bold border border-slate-600 transition-all"
                  >
                    {t('repair')} ({repairInfo.tokenCost} 🪙)
                  </button>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-500 italic">{t('emptySlot')}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Materials inventory */}
      <div className="mt-2">
        <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">{t('materialsTitle')}</h4>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {Object.entries(materials).filter(([, qty]) => qty > 0).length === 0 ? (
            <div className="col-span-full bg-slate-900/40 border border-slate-800 rounded-xl p-3 text-center text-xs text-slate-500">
              {t('noMaterials')}
            </div>
          ) : (
            Object.entries(materials)
              .filter(([, qty]) => qty > 0)
              .map(([matKey, qty]) => (
                <div key={matKey} className="bg-slate-900 border border-slate-700 p-2 rounded-lg flex items-center gap-1.5">
                  <span className="text-base">{MATERIAL_ICONS[matKey] || '📦'}</span>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400">{matKey}</span>
                    <span className="text-xs font-bold text-white">{qty}</span>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Item inventory */}
      <div className="mt-2">
        <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">{t('itemInventory')}</h4>
        {inventory.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 text-center text-xs text-slate-500">
            {t('emptyInventory')}
          </div>
        ) : (
          <div className="space-y-2">
            {inventory.map((invItem) => {
              const conf = invItem.isChest ? null : BOSS_EQUIPMENT_CONFIG[invItem.itemId];
              return (
                <div key={invItem.instanceId} className="bg-slate-900 border border-slate-700 p-3 rounded-xl flex justify-between items-center">
                  <div>
                    {invItem.isChest ? (
                      <>
                        <p className="text-sm font-bold text-amber-300">📦 {t('chest')}</p>
                        <p className="text-xs text-slate-400">{lang === 'ru' ? 'Нажмите, чтобы открыть' : lang === 'en' ? 'Click to open' : 'Натисніть, щоб відкрити'}</p>
                      </>
                    ) : conf ? (
                      <>
                        <p className="text-sm font-bold text-white">{conf.name}</p>
                        <p className="text-xs text-slate-400">{t('itemLevel')} {invItem.level} | {conf.slot} | {invItem.durability}/{EquipmentManager.getMaxDurability(invItem.level)} {t('itemDurability').toLowerCase()}</p>
                      </>
                    ) : null}
                  </div>
                  {invItem.isChest ? (
                    <button
                      onClick={() => onOpenChest(invItem.instanceId)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 rounded-lg text-xs font-bold transition-all"
                    >
                      {t('open')}
                    </button>
                  ) : conf ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDetailItem(invItem)}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold transition-all"
                      >
                        ℹ️
                      </button>
                      <button
                        onClick={() => onEquipItem(invItem.instanceId, conf.slot)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold transition-all"
                      >
                        {t('equip')}
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Item detail modal - inventory item */}
      {detailItem && !detailItem.isChest && (
        <ItemDetailsModal
          instanceId={detailItem.instanceId}
          itemId={detailItem.itemId}
          level={detailItem.level}
          durability={detailItem.durability}
          lang={lang}
          materials={materials}
          onUpgrade={onUpgradeItem}
          onEquip={onEquipItem}
          onClose={() => setDetailItem(null)}
        />
      )}

      {/* Item detail modal - equipped item */}
      {detailEquippedSlot && equipped[detailEquippedSlot] && (
        <ItemDetailsModal
          instanceId={'eq_' + detailEquippedSlot}
          itemId={equipped[detailEquippedSlot]!.itemId}
          level={equipped[detailEquippedSlot]!.level}
          durability={equipped[detailEquippedSlot]!.durability}
          lang={lang}
          materials={materials}
          onUpgrade={(_instanceId: string) => onUpgradeEquipped(detailEquippedSlot)}
          onEquip={(_instanceId: string, _slot: string) => setDetailEquippedSlot(null)}
          onClose={() => setDetailEquippedSlot(null)}
        />
      )}
    </div>
  );
};
