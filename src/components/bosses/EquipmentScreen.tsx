import React from 'react';
import { BOSS_EQUIPMENT_CONFIG } from '../../config/bossEquipment/equipmentConfig';
import { EquipmentManager } from '../../managers/EquipmentManager';

interface EquipmentScreenProps {
  equipped: Record<string, { itemId: string; level: number; durability: number } | null>;
  inventory: Array<{ instanceId: string; itemId: string; level: number; durability: number }>;
  playerTokens: number;
  onEquipItem: (instanceId: string, slot: string) => void;
  onRepairItem: (slot: string) => void;
  onRepairAll: () => void;
}

const SLOT_NAMES: Record<string, string> = {
  weapon: '⚔️ Зброя',
  helmet: '🪖 Каска',
  amulet: '📿 Амулет',
  chest: '👕 Нагрудник',
  pants: '👖 Штани',
  boots: '👢 Взуття',
};

export const EquipmentScreen: React.FC<EquipmentScreenProps> = ({
  equipped,
  inventory,
  playerTokens,
  onEquipItem,
  onRepairItem,
  onRepairAll,
}) => {
  return (
    <div className="flex flex-col h-full gap-4 text-white overflow-y-auto pr-1">
      <div className="flex justify-between items-center bg-slate-900/60 p-3 rounded-xl border border-slate-700">
        <h3 className="font-bold text-sm">Слоти екіпіровки (3х2)</h3>
        <button
          onClick={onRepairAll}
          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 rounded-lg text-xs font-bold transition-all shadow-md"
        >
          🛠️ Полагодити все
        </button>
      </div>

      {/* 6 слотів (3 вертикально зліва, 3 вертикально справа або сітка 2х3) */}
      <div className="grid grid-cols-2 gap-3">
        {Object.keys(SLOT_NAMES).map((slotKey) => {
          const item = equipped[slotKey];
          const itemConfig = item ? BOSS_EQUIPMENT_CONFIG[item.itemId] : null;
          const maxDur = item ? EquipmentManager.getMaxDurability(item.level) : 80;
          const repairInfo = item ? EquipmentManager.getRepairCost(item.durability, maxDur) : { tokenCost: 0 };

          return (
            <div key={slotKey} className="bg-slate-900/80 border border-slate-700 p-3 rounded-xl flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-slate-400 font-bold">{SLOT_NAMES[slotKey]}</span>
                {item && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    item.durability > 0 ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'
                  }`}>
                    {item.durability > 0 ? 'Активно' : 'Зламано ❌'}
                  </span>
                )}
              </div>

              {item && itemConfig ? (
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-extrabold text-indigo-300">{itemConfig.name}</p>
                    <p className="text-xs text-slate-400">Рівень: {item.level} ({item.durability}/{maxDur} міцність)</p>
                  </div>
                  <button
                    onClick={() => onRepairItem(slotKey)}
                    disabled={item.durability >= maxDur || playerTokens < repairInfo.tokenCost}
                    className="w-full py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-[11px] rounded font-bold border border-slate-600 transition-all"
                  >
                    Полагодити ({repairInfo.tokenCost} 🪙)
                  </button>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-500 italic">
                  Слот пустий
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Інвентар екіпіровки */}
      <div className="mt-4">
        <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Інвентар предметів</h4>
        {inventory.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 text-center text-xs text-slate-500">
            Інвентар порожній. Здобувайте ящики з екіпіровкою у босів!
          </div>
        ) : (
          <div className="space-y-2">
            {inventory.map((invItem) => {
              const conf = BOSS_EQUIPMENT_CONFIG[invItem.itemId];
              if (!conf) return null;
              return (
                <div key={invItem.instanceId} className="bg-slate-900 border border-slate-700 p-3 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-white">{conf.name}</p>
                    <p className="text-xs text-slate-400">Рівень {invItem.level} | Слот: {conf.slot}</p>
                  </div>
                  <button
                    onClick={() => onEquipItem(invItem.instanceId, conf.slot)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold transition-all"
                  >
                    Надіти
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};