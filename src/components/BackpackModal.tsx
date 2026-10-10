import { useState, useMemo } from 'react';
import { useGame, type CaseOpenResult } from '@/context/GameContext';
import { CASE_RARITIES, CASE_LOOT_TABLES } from '@/config/casesConfig';
import { RESOURCE_LIST } from '@/config/minesConfig';
import { formatMoney, formatMass } from '@/config';
import { MATERIALS_CONFIG } from '@/config/expeditions';
import type { CaseRarity } from '@/types';
import type { MaterialId } from '@/config/expeditions';
import {
  X,
  Package,
  Gift,
  Lock,
  Sparkles,
  Coins,
  Gem,
  ShoppingBag,
  ChevronDown,
  FlaskConical,
  Mountain,
} from 'lucide-react';

export default function BackpackModal() {
  const { state, backpackOpen, setBackpackOpen, openCase, openAllCases, openCasesByRarity, t, lang } = useGame();
  const [results, setResults] = useState<CaseOpenResult[] | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [expandedRarity, setExpandedRarity] = useState<CaseRarity | null>(null);
  const [invSubTab, setInvSubTab] = useState<'resources' | 'materials'>('resources');

  const stackedCases = useMemo(() => {
    const unopened = state.cases.filter((c) => !c.opened);
    const groups: Record<CaseRarity, typeof unopened> = {
      common: [], rare: [], epic: [], legendary: [],
    };
    for (const c of unopened) {
      groups[c.rarity as CaseRarity].push(c);
    }
    return groups;
  }, [state.cases]);

  const unopenedCount = state.cases.filter((c) => !c.opened).length;

  if (!backpackOpen) return null;

  const handleOpenOne = (caseId: string) => {
    const result = openCase(caseId);
    if (result) {
      setResults([result]);
      setShowResults(true);
    }
  };

  const handleOpenRarity = (rarity: CaseRarity) => {
    const groupResults = openCasesByRarity(rarity);
    if (groupResults.length > 0) {
      setResults(groupResults);
      setShowResults(true);
    }
  };

  const handleOpenAll = () => {
    const allResults = openAllCases();
    if (allResults.length > 0) {
      setResults(allResults);
      setShowResults(true);
    }
  };

  const closeResults = () => {
    setShowResults(false);
    setResults(null);
  };

  const rarityKeys = (Object.keys(stackedCases) as CaseRarity[]).filter(
    (k) => stackedCases[k].length > 0
  );

  return (
    <>
      {!showResults && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setBackpackOpen(false)}
        >
          <div
            className="card w-full max-w-md max-h-[80vh] overflow-y-auto p-4 animate-drop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary-500" />
                {t('backpackTitle')}
              </h2>
              <button
                onClick={() => setBackpackOpen(false)}
                className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
              >
                <X className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-warning-500" />
                  {t('cases')}
                </h3>
                {unopenedCount > 0 && (
                  <button onClick={handleOpenAll} className="btn-primary px-3 py-1 text-xs">
                    {t('openAllCases')} ({unopenedCount})
                  </button>
                )}
              </div>

              {unopenedCount === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-4">{t('noCases')}</p>
              ) : (
                <div className="space-y-2">
                  {rarityKeys.map((rarityKey) => {
                    const rarity = CASE_RARITIES[rarityKey];
                    const name = lang === 'uk' ? rarity.nameUk : rarity.nameEn;
                    const lootTable = CASE_LOOT_TABLES[rarityKey] || [];
                    const group = stackedCases[rarityKey];
                    const isExpanded = expandedRarity === rarityKey;

                    return (
                      <div key={rarityKey}>
                        <div
                          className="relative group rounded-xl p-3 border-2"
                          style={{
                            borderColor: rarity.color + '60',
                            backgroundColor: rarity.glowColor,
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: rarity.color + '30' }}
                              >
                                <Gift className="w-5 h-5" style={{ color: rarity.color }} />
                              </div>
                              <div>
                                <div className="text-xs font-bold" style={{ color: rarity.color }}>
                                  {name}
                                </div>
                                <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                                  x{group.length}
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleOpenOne(group[0].id)}
                                className="btn py-1.5 px-2.5 text-xs text-white rounded-lg"
                                style={{ backgroundColor: rarity.color }}
                              >
                                {t('openCase')}
                              </button>
                              {group.length > 1 && (
                                <button
                                  onClick={() => setExpandedRarity(isExpanded ? null : rarityKey)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                                  style={{ backgroundColor: rarity.color + '20' }}
                                >
                                  <ChevronDown
                                    className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                    style={{ color: rarity.color }}
                                  />
                                </button>
                              )}
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-2.5 pt-2.5 border-t" style={{ borderColor: rarity.color + '30' }}>
                              <div className="space-y-1 mb-2">
                                {lootTable.map((entry, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-[11px] gap-2">
                                    <span className="text-neutral-600 dark:text-neutral-300">
                                      {lang === 'uk' ? entry.label : entry.labelEn}
                                    </span>
                                    <span className="font-bold text-neutral-700 dark:text-neutral-200">
                                      {entry.chance}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <button
                                onClick={() => handleOpenRarity(rarityKey)}
                                className="btn w-full py-1.5 text-xs text-white rounded-lg"
                                style={{ backgroundColor: rarity.color }}
                              >
                                {t('openAllCases')} ({group.length})
                              </button>
                            </div>
                          )}

                          {!isExpanded && group.length > 1 && (
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 hidden group-hover:block pointer-events-none">
                              <div className="card p-3 min-w-[180px] shadow-xl">
                                <div className="text-xs font-bold mb-2" style={{ color: rarity.color }}>
                                  {name}
                                </div>
                                <div className="space-y-1">
                                  {lootTable.map((entry, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-[11px] gap-2">
                                      <span className="text-neutral-600 dark:text-neutral-300">
                                        {lang === 'uk' ? entry.label : entry.labelEn}
                                      </span>
                                      <span className="font-bold text-neutral-700 dark:text-neutral-200">
                                        {entry.chance}%
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-primary-500" />
                {t('inventory')}
              </h3>

 {/* Sub-tabs: Resources / Materials */}
              <div className="flex gap-1 mb-3 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-850/50">
                <button
                  onClick={() => setInvSubTab('resources')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    invSubTab === 'resources'
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                  }`}>
                  <Mountain className="w-3.5 h-3.5" />
                  {t('inventory')}
                </button>
                <button
                  onClick={() => setInvSubTab('materials')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    invSubTab === 'materials'
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                  }`}>
                  <FlaskConical className="w-3.5 h-3.5" />
                  {t('backpackMaterials')}
                </button>
              </div>

              {invSubTab === 'resources' ? (
              <div className="space-y-2">
                {/* Item Bag */}
                <div className={`flex items-center justify-between rounded-xl p-2.5 border ${
                  (state.itemBags || 0) > 0
                    ? 'bg-warning-500/10 border-warning-500/30'
                    : 'bg-neutral-50 dark:bg-neutral-850/50 border-dashed border-neutral-300 dark:border-neutral-700 opacity-60'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-warning-500/20">
                      <ShoppingBag className="w-4 h-4 text-warning-500" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        {lang === 'uk' ? 'Сумка з предметом' : 'Item Bag'}
                      </span>
                      <span className="text-[10px] text-neutral-400 ml-1.5 block">
                        {(state.itemBags || 0) > 0
                          ? `x${state.itemBags}`
                          : (lang === 'uk' ? 'Отримайте з кейсів' : 'Obtain from cases')}
                      </span>
                    </div>
                  </div>
                  {(state.itemBags || 0) > 0 ? (
                    <span className="text-sm font-bold text-warning-500">{state.itemBags}</span>
                  ) : (
                    <Lock className="w-4 h-4 text-neutral-400" />
                  )}
                </div>

                {RESOURCE_LIST.map((res) => {
                  const entry = state.inventory[res.type];
                  const name = lang === 'uk' ? res.nameUk : res.nameEn;
                  const value = entry.mass * res.pricePerKg;
                  return (
                    <div
                      key={res.type}
                      className="flex items-center justify-between rounded-xl p-2.5 bg-neutral-50 dark:bg-neutral-850/50 border border-neutral-200 dark:border-neutral-800"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: res.bgColor }}
                        >
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: res.color }} />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{name}</span>
                          <span className="text-xs text-neutral-400 ml-1.5">
                            {formatMass(entry.mass)} · {entry.count} {t('items')}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-success-500">{formatMoney(value)}</span>
                    </div>
                  );
                })}
              </div>
              ) : (
              <div className="space-y-2">
                {(Object.keys(MATERIALS_CONFIG) as MaterialId[]).map((matId) => {
                  const mat = MATERIALS_CONFIG[matId];
                  const count = state.materials?.[matId] || 0;
                  return (
                    <div
                      key={matId}
                      className={`flex items-center justify-between rounded-xl p-2.5 border ${
                        count > 0
                          ? 'bg-neutral-50 dark:bg-neutral-850/50 border-neutral-200 dark:border-neutral-800'
                          : 'bg-neutral-50 dark:bg-neutral-850/30 border-dashed border-neutral-200 dark:border-neutral-700 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-200 dark:bg-neutral-800 text-base">
                          {mat.icon}
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            {mat.name}
                          </span>
                          <span className="text-[10px] text-neutral-400 block">{mat.description}</span>
                        </div>
                      </div>
                      <span className={`text-sm font-bold ${count > 0 ? 'text-primary-500' : 'text-neutral-400'}`}>
                        {count > 0 ? `x${count}` : '0'}
                      </span>
                    </div>
                  );
                })}
              </div>
              )}
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-warning-500" />
                {t('shopEquipment')}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl p-2.5 bg-neutral-50 dark:bg-neutral-850/50 border border-neutral-200 dark:border-neutral-800">
                  <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{t('pickaxe')}</span>
                  <span className="text-xs text-neutral-400">
                    {state.activePickaxe
                      ? `${state.activePickaxe.durability}/${state.activePickaxe.maxDurability}`
                      : t('noDurability')}
                    {state.sparePickaxes.length > 0 && ` (+${state.sparePickaxes.length})`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showResults && results && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={closeResults}
        >
          <div
            className="card w-full max-w-md p-6 animate-drop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                <Gift className="w-5 h-5 text-warning-500" />
                {t('caseOpened')}
              </h2>
              <button
                onClick={closeResults}
                className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
              >
                <X className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {results.map((result, i) => {
                const rarityKey = result.rarity as CaseRarity;
                const rarity = CASE_RARITIES[rarityKey];
                const rarityName = lang === 'uk' ? rarity.nameUk : rarity.nameEn;
                const lootIcon = result.loot.type === 'cash'
                  ? <Coins className="w-5 h-5 text-success-500" />
                  : result.loot.type === 'gems'
                  ? <Gem className="w-5 h-5 text-accent-500" />
                  : <ShoppingBag className="w-5 h-5 text-warning-500" />;

                return (
                  <div
                    key={i}
                    className="rounded-xl p-3 border-2 flex items-center gap-3 animate-drop-in"
                    style={{
                      borderColor: rarity.color + '60',
                      backgroundColor: rarity.glowColor,
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: rarity.color + '30' }}
                    >
                      {lootIcon}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold" style={{ color: rarity.color }}>
                        {rarityName}
                      </div>
                      <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                        {t('youGot')}: {result.loot.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={closeResults} className="btn-primary w-full py-2.5 text-sm mt-4">
              {t('close')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
