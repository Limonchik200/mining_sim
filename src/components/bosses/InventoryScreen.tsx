import React, { useState } from 'react';
import { BOSS_EQUIPMENT_CONFIG } from '../../config/bossEquipment/equipmentConfig';
import { EquipmentManager } from '../../managers/EquipmentManager';
import { RESOURCE_DISPLAY } from '../../config/bosses/bossI18n';
import type { BossLang } from '../../config/bosses/bossI18n';
import { getBossT } from '../../config/bosses/bossI18n';

interface InventoryScreenProps {
  inventory: { instanceId: string; itemId: string; level: number; durability: number; isChest?: boolean }[];
  materials: Record<string, number>;
  chestResult: string | null;
  onOpenChest: (instanceId: string) => void;
  onDismissChestResult: () => void;
  onEquipItem: (instanceId: string, slot: string) => void;
  lang: BossLang;
}

const RARITY_COLORS: Record<string, string> = {
  common: 'border-gray-500 text-gray-400',
  good: 'border-green-500 text-green-400',
  great: 'border-blue-500 text-blue-400',
  epic: 'border-purple-500 text-purple-400',
  legendary: 'border-amber-500 text-amber-400',
  mythic: 'border-red-500 text-red-400',
  exotic: 'border-pink-500 text-pink-400',
};

export const InventoryScreen: React.FC<InventoryScreenProps> = ({
  inventory, materials, chestResult, onOpenChest, onDismissChestResult, onEquipItem, lang,
}) => {
  const t = getBossT(lang);
  const [openingChestId, setOpeningChestId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const chests = inventory.filter(i => i.isChest);
  const items = inventory.filter(i => !i.isChest);
  const materialEntries = Object.entries(materials).filter(([, count]) => count > 0);

  const handleOpenChest = (instanceId: string) => {
    if (openingChestId) return;
    setOpeningChestId(instanceId);
    setShowResult(false);
    setTimeout(() => {
      onOpenChest(instanceId);
      setShowResult(true);
      setTimeout(() => {
        setOpeningChestId(null);
        setShowResult(false);
        onDismissChestResult();
      }, 3500);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full gap-4 text-white overflow-y-auto pr-1">
      {/* Materials section */}
      <div>
        <h3 className="font-bold text-sm text-slate-300 mb-2">📦 {t('invMaterials')}</h3>
        {materialEntries.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 text-center text-xs text-slate-500">
            {t('noMaterials')}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {materialEntries.map(([resKey, count]) => {
              const display = RESOURCE_DISPLAY[resKey];
              const name = display ? t(display.nameKey) : resKey;
              const icon = display?.icon || '❓';
              return (
                <div key={resKey} className="bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl flex items-center gap-2">
                  <span className="text-lg">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-200 truncate">{name}</p>
                    <p className="text-xs text-slate-400">{count}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chests section */}
      <div>
        <h3 className="font-bold text-sm text-slate-300 mb-2">🎁 {t('invChests')}</h3>
        {chests.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 text-center text-xs text-slate-500">
            {t('noChests')}
          </div>
        ) : (
          <div className="space-y-2">
            {chests.map((chest) => (
              <div key={chest.instanceId} className="bg-slate-900 border border-amber-700/40 p-3 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-amber-300">📦 {t('chest')}</p>
                </div>
                <button
                  onClick={() => handleOpenChest(chest.instanceId)}
                  disabled={!!openingChestId}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 rounded-lg text-xs font-bold transition-all"
                >
                  {openingChestId === chest.instanceId ? t('openChestAnim') : t('open')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Equipment items section */}
      <div>
        <h3 className="font-bold text-sm text-slate-300 mb-2">⚔️ {t('invEquipment')}</h3>
        {items.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 text-center text-xs text-slate-500">
            {t('noItems')}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((invItem) => {
              const conf = BOSS_EQUIPMENT_CONFIG[invItem.itemId];
              if (!conf) return null;
              const rarityClass = RARITY_COLORS[conf.levels[invItem.level - 1]?.rarity] || 'border-gray-500 text-gray-400';
              return (
                <div key={invItem.instanceId} className={`bg-slate-900 border ${rarityClass} p-3 rounded-xl flex justify-between items-center`}>
                  <div>
                    <p className="text-sm font-bold text-white">{conf.name}</p>
                    <p className="text-xs text-slate-400">
                      {t('itemLevel')} {invItem.level} | {conf.slot} | {invItem.durability}/{EquipmentManager.getMaxDurability(invItem.level)} {t('itemDurability').toLowerCase()}
                    </p>
                  </div>
                  <button
                    onClick={() => onEquipItem(invItem.instanceId, conf.slot)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold transition-all"
                  >
                    {t('equip')}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chest opening animation overlay */}
      {openingChestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            {!showResult ? (
              <>
                <div className="text-8xl animate-bounce">📦</div>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-ping" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-ping" style={{ animationDelay: '200ms' }}></div>
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-ping" style={{ animationDelay: '400ms' }}></div>
                </div>
                <p className="text-amber-400 font-bold text-lg animate-pulse">{t('openChestAnim')}</p>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 chest-reveal">
                <div className="text-7xl">✨</div>
                <div className="bg-slate-800 border-2 border-amber-500 rounded-2xl px-8 py-6 text-center shadow-2xl">
                  <p className="text-amber-400 font-bold text-sm uppercase tracking-wider mb-2">{t('chestResult')}</p>
                  <p className="text-2xl font-extrabold text-white">{chestResult || '???'}</p>
                </div>
                <div className="text-4xl animate-spin">⭐</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
