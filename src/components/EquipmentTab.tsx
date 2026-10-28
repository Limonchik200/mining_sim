import { useState, useMemo, useEffect, useRef } from 'react';
import { useGame, type CaseOpenResult } from '@/context/GameContext';
import { CASE_RARITIES, CASE_LOOT_TABLES } from '@/config/casesConfig';
import { RESOURCE_LIST } from '@/config/minesConfig';
import { formatMoney, formatMass } from '@/config';
import { MATERIALS_CONFIG } from '@/config/expeditions';
import type { CaseRarity } from '@/types';
import type { MaterialId } from '@/config/expeditions';
import {
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
  Weight,
  Pickaxe,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── Case opening animation component ───
function CaseOpeningAnimation({
  rarity,
  result,
  onComplete,
}: {
  rarity: CaseRarity;
  result: CaseOpenResult;
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState<'shaking' | 'burst' | 'reveal'>('shaking');
  const r = CASE_RARITIES[rarity];

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('burst'), 1500);
    const t2 = setTimeout(() => setPhase('reveal'), 1900);
    const t3 = setTimeout(() => onComplete(), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  const lootIcon =
    result.loot.type === 'cash' ? <Coins className="w-12 h-12 text-success-500" /> :
    result.loot.type === 'gems' ? <Gem className="w-12 h-12 text-accent-500" /> :
    result.loot.type === 'itembag' ? <ShoppingBag className="w-12 h-12 text-warning-500" /> :
    <Sparkles className="w-12 h-12 text-accent-400" />;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 backdrop-blur-md">
      {phase === 'shaking' && (
        <div className="relative">
          <div
            className="case-shaking w-32 h-32 rounded-2xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${r.color}30, ${r.color}10)`,
              border: `2px solid ${r.color}80`,
              boxShadow: `0 0 30px ${r.glowColor}`,
            }}
          >
            <Gift className="w-14 h-14" style={{ color: r.color }} />
          </div>
          <div
            className="absolute inset-0 rounded-2xl shimmer-bar"
            style={{ opacity: 0.3 }}
          />
        </div>
      )}

      {phase === 'burst' && (
        <div className="relative">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute case-burst rounded-full"
              style={{
                width: 8,
                height: 8,
                background: r.color,
                left: '50%',
                top: '50%',
                transform: `rotate(${i * 45}deg) translateY(-60px)`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
          <div
            className="case-burst w-32 h-32 rounded-full"
            style={{ background: `radial-gradient(circle, ${r.color}40, transparent)` }}
          />
        </div>
      )}

      {phase === 'reveal' && (
        <div className="flex flex-col items-center gap-4">
          <div
            className="animate-drop-bounce w-28 h-28 rounded-2xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${r.color}30, ${r.color}10)`,
              border: `2px solid ${r.color}`,
              boxShadow: `0 0 40px ${r.glowColor}`,
            }}
          >
            {lootIcon}
          </div>
          <div className="reveal-pop text-center" style={{ animationDelay: '0.1s', opacity: 0 }}>
            <div className="text-sm font-bold" style={{ color: r.color }}>
              {result.loot.label}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Rarity badge ───
function RarityBadge({ rarity, label }: { rarity: CaseRarity; label: string }) {
  const r = CASE_RARITIES[rarity];
  return (
    <span
      className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
      style={{ color: r.color, background: `${r.color}20` }}
    >
      {label}
    </span>
  );
}

// ─── Case card ───
function CaseCard({
  rarityKey,
  count,
  lootTable,
  onOpenOne,
  onOpenRarity,
  onOpenAmount,
  onExpand,
  isExpanded,
  labelName,
}: {
  rarityKey: CaseRarity;
  count: number;
  lootTable: typeof CASE_LOOT_TABLES[CaseRarity];
  onOpenOne: () => void;
  onOpenRarity: () => void;
  onOpenAmount: (amount: number) => void;
  onExpand: () => void;
  isExpanded: boolean;
  labelName: string;
}) {
  const r = CASE_RARITIES[rarityKey];

  return (
    <div
      className="relative group rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02]"
      style={{
        borderColor: r.color + '60',
        borderWidth: 2,
        background: `linear-gradient(135deg, ${r.glowColor} 0%, rgba(0,0,0,0.02) 100%)`,
        boxShadow: `0 4px 20px ${r.color}15`,
      }}
    >
      {/* Shimmer overlay */}
      <div className="absolute inset-0 shimmer-bar pointer-events-none rounded-2xl" />

      {/* Top sheen */}
      <div
        className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none rounded-t-2xl"
        style={{ background: `linear-gradient(180deg, ${r.color}08, transparent)` }}
      />

      <div className="relative p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 item-float"
              style={{ background: `linear-gradient(135deg, ${r.color}30, ${r.color}10)` }}
            >
              <Gift className="w-6 h-6" style={{ color: r.color }} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold" style={{ color: r.color }}>{labelName}</span>
              </div>
              <RarityBadge rarity={rarityKey} label={labelName} />
            </div>
          </div>
          <span
            className="text-xs font-bold px-2 py-1 rounded-lg"
            style={{ color: r.color, background: `${r.color}20` }}
          >
            ×{count}
          </span>
        </div>

        {/* Loot table preview (compact) */}
        <div className="flex gap-1 flex-wrap mb-2.5">
          {lootTable.slice(0, 3).map((entry, idx) => (
            <span
              key={idx}
              className="text-[9px] px-1.5 py-0.5 rounded-md bg-neutral-100/60 dark:bg-neutral-800/40 text-neutral-500 dark:text-neutral-400"
            >
              {entry.chance}%
            </span>
          ))}
        </div>

        <div className="flex gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={onOpenOne}
            className="flex-1 min-w-[80px] py-2 text-xs text-white rounded-lg font-bold transition-all duration-200 hover:shadow-md active:scale-95"
            style={{ background: r.color }}
          >
            Відкрити
          </button>
          {count >= 10 && (
            <button
              type="button"
              onClick={() => onOpenAmount(10)}
              className="py-2 px-2.5 text-xs text-white rounded-lg font-bold transition-all duration-200 hover:shadow-md active:scale-95"
              style={{ background: r.color + 'cc' }}
            >
              ×10
            </button>
          )}
          {count >= 50 && (
            <button
              type="button"
              onClick={() => onOpenAmount(50)}
              className="py-2 px-2.5 text-xs text-white rounded-lg font-bold transition-all duration-200 hover:shadow-md active:scale-95"
              style={{ background: r.color + 'aa' }}
            >
              ×50
            </button>
          )}
          {count > 1 && (
            <button
              type="button"
              onClick={onExpand}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-opacity-80 active:scale-90"
              style={{ background: r.color + '20' }}
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                style={{ color: r.color }}
              />
            </button>
          )}
        </div>

        {isExpanded && (
          <div className="mt-2.5 pt-2.5 border-t slide-up-fade" style={{ borderColor: r.color + '20' }}>
            <div className="space-y-1 mb-2">
              {lootTable.map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] gap-2">
                  <span className="text-neutral-600 dark:text-neutral-300 truncate">{entry.label}</span>
                  <span className="font-bold whitespace-nowrap" style={{ color: r.color }}>{entry.chance}%</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={onOpenRarity}
              className="w-full py-2 text-xs text-white rounded-lg font-bold transition-all duration-200 hover:shadow-md active:scale-95"
              style={{ background: r.color }}
            >
              Відкрити всі ({count})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EquipmentTab() {
  const { state, openCase, openAllCases, openCasesByRarity, openCasesByAmount, currentBackpackLimit, currentBackpackWeight, t, lang } = useGame();
  const [results, setResults] = useState<CaseOpenResult[] | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [expandedRarity, setExpandedRarity] = useState<CaseRarity | null>(null);
  const [invSubTab, setInvSubTab] = useState<'resources' | 'materials'>('resources');
  const [openingCase, setOpeningCase] = useState<{ rarity: CaseRarity; result: CaseOpenResult } | null>(null);
  const revealTimersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      revealTimersRef.current.forEach((id) => clearTimeout(id));
    };
  }, []);

  const stackedCases = useMemo(() => {
    const unopened = state.cases.filter((c) => !c.opened);
    const groups: Record<CaseRarity, typeof unopened> = {
      common: [], rare: [], epic: [], legendary: [], energy: [],
    };
    for (const c of unopened) {
      groups[c.rarity as CaseRarity].push(c);
    }
    return groups;
  }, [state.cases]);

  const unopenedCount = state.cases.filter((c) => !c.opened).length;
  const safeWeight = Number.isFinite(currentBackpackWeight) ? currentBackpackWeight : 0;
  const safeLimit = Number.isFinite(currentBackpackLimit) ? currentBackpackLimit : 100;

  const handleOpenOne = (caseId: string, rarity: CaseRarity) => {
    const result = openCase(caseId);
    if (result) {
      setOpeningCase({ rarity, result });
      const timer = window.setTimeout(() => {
        setResults([result]);
        setShowResults(true);
        setOpeningCase(null);
      }, 3000);
      revealTimersRef.current.push(timer);
    }
  };

  const handleOpenRarity = (rarity: CaseRarity) => {
    const groupResults = openCasesByRarity(rarity);
    if (groupResults.length > 0) {
      setOpeningCase({ rarity, result: groupResults[0] });
      const timer = window.setTimeout(() => {
        setResults(groupResults);
        setShowResults(true);
        setOpeningCase(null);
      }, 3000);
      revealTimersRef.current.push(timer);
    }
  };

  const handleOpenAmount = (rarity: CaseRarity, amount: number) => {
    const groupResults = openCasesByAmount(rarity, amount);
    if (groupResults.length > 0) {
      setOpeningCase({ rarity, result: groupResults[0] });
      const timer = window.setTimeout(() => {
        setResults(groupResults);
        setShowResults(true);
        setOpeningCase(null);
      }, 3000);
      revealTimersRef.current.push(timer);
    }
  };

  const handleOpenAll = () => {
    const allResults = openAllCases();
    if (allResults.length > 0) {
      setOpeningCase({ rarity: allResults[0].rarity, result: allResults[0] });
      const timer = window.setTimeout(() => {
        setResults(allResults);
        setShowResults(true);
        setOpeningCase(null);
      }, 3000);
      revealTimersRef.current.push(timer);
    }
  };

  const closeResults = () => {
    setShowResults(false);
    setResults(null);
  };

  const rarityKeys = (Object.keys(stackedCases) as CaseRarity[]).filter(
    (k) => stackedCases[k].length > 0
  );

  const tr = (ru: string, uk: string, en: string) => lang === 'ru' ? ru : (lang === 'uk' ? uk : en);

  return (
    <div className="space-y-4">
      {/* Case opening animation overlay */}
      {openingCase && (
        <CaseOpeningAnimation
          rarity={openingCase.rarity}
          result={openingCase.result}
          onComplete={() => {}}
        />
      )}

      <div className="card p-4">
        <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-primary-500" />
          {t('backpackTitle')}
        </h2>

        {/* Backpack Weight Bar */}
        <div className="mb-4 rounded-xl p-3 bg-neutral-50 dark:bg-neutral-850/50 border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Weight className="w-3.5 h-3.5 text-warning-500" />
              {t('backpackWeight')}
            </span>
            <span className={`text-xs font-bold ${safeWeight >= safeLimit ? 'text-error-500' : 'text-neutral-600 dark:text-neutral-400'}`}>
              {safeWeight.toFixed(2)} / {safeLimit.toFixed(2)} kg
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                safeWeight >= safeLimit
                  ? 'bg-error-500'
                  : safeWeight >= safeLimit * 0.8
                  ? 'bg-warning-500'
                  : 'bg-success-500'
              }`}
              style={{ width: `${Math.min(100, safeLimit > 0 ? (safeWeight / safeLimit) * 100 : 0)}%` }}
            />
          </div>
        </div>

        {/* Cases section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-warning-500" />
              {t('cases')}
            </h3>
            {unopenedCount > 0 && (
              <button
                type="button"
                onClick={handleOpenAll}
                className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5 transition-all duration-200 hover:shadow-md active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {t('openAllCases')} ({unopenedCount})
              </button>
            )}
          </div>

          {unopenedCount === 0 ? (
            <div className="text-center py-8">
              <Gift className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
              <p className="text-xs text-neutral-400">{t('noCases')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {rarityKeys.map((rarityKey) => {
                const rarity = CASE_RARITIES[rarityKey];
                const name = tr(rarity.nameRu, rarity.nameUk, rarity.nameEn);
                const lootTable = CASE_LOOT_TABLES[rarityKey] || [];
                const group = stackedCases[rarityKey];
                const isExpanded = expandedRarity === rarityKey;

                return (
                  <CaseCard
                    key={rarityKey}
                    rarityKey={rarityKey}
                    count={group.length}
                    lootTable={lootTable}
                    onOpenOne={() => handleOpenOne(group[0].id, rarityKey)}
                    onOpenRarity={() => handleOpenRarity(rarityKey)}
                    onOpenAmount={(amount) => handleOpenAmount(rarityKey, amount)}
                    onExpand={() => setExpandedRarity(isExpanded ? null : rarityKey)}
                    isExpanded={isExpanded}
                    labelName={name}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Inventory sub-tabs */}
        <div>
          <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-primary-500" />
            {t('inventory')}
          </h3>

          <div className="flex gap-1 mb-3 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-850/50">
            <button
              type="button"
              onClick={() => setInvSubTab('resources')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                invSubTab === 'resources'
                  ? 'bg-primary-500 text-white shadow-sm scale-105'
                  : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
              }`}
            >
              <Mountain className="w-3.5 h-3.5" />
              {t('inventory')}
            </button>
            <button
              type="button"
              onClick={() => setInvSubTab('materials')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                invSubTab === 'materials'
                  ? 'bg-primary-500 text-white shadow-sm scale-105'
                  : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              {t('backpackMaterials')}
            </button>
          </div>

          {invSubTab === 'resources' ? (
            <div className="space-y-2">
              {/* Item Bag */}
              <div className={`flex items-center justify-between rounded-xl p-2.5 border transition-all duration-300 ${
                (state.itemBags || 0) > 0
                  ? 'bg-warning-500/10 border-warning-500/30 hover:shadow-md'
                  : 'bg-neutral-50 dark:bg-neutral-850/50 border-dashed border-neutral-300 dark:border-neutral-700 opacity-60'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-warning-500/20 ${(state.itemBags || 0) > 0 ? 'item-float' : ''}`}>
                    <ShoppingBag className="w-4 h-4 text-warning-500" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      {tr('Сумка з предметом', 'Сумка з предметом', 'Item Bag')}
                    </span>
                    <span className="text-[10px] text-neutral-400 ml-1.5 block">
                      {(state.itemBags || 0) > 0
                        ? `×${state.itemBags}`
                        : tr('Отримайте з кейсів', 'Отримайте з кейсів', 'Obtain from cases')}
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
                const safeMass = entry && Number.isFinite(entry.mass) ? entry.mass : 0;
                const safeCount = entry && Number.isFinite(entry.count) ? entry.count : 0;
                const name = tr(res.nameRu, res.nameUk, res.nameEn);
                const value = safeMass * res.pricePerKg;
                return (
                  <div
                    key={res.type}
                    className="flex items-center justify-between rounded-xl p-2.5 bg-neutral-50 dark:bg-neutral-850/50 border border-neutral-200 dark:border-neutral-800 transition-all duration-200 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: res.bgColor }}>
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: res.color }} />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{name}</span>
                        <span className="text-xs text-neutral-400 ml-1.5">{formatMass(safeMass)} · {safeCount} {t('items')}</span>
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
                    className={`flex items-center justify-between rounded-xl p-2.5 border transition-all duration-200 ${
                      count > 0
                        ? 'bg-neutral-50 dark:bg-neutral-850/50 border-neutral-200 dark:border-neutral-800 hover:shadow-sm'
                        : 'bg-neutral-50 dark:bg-neutral-850/30 border-dashed border-neutral-200 dark:border-neutral-700 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-200 dark:bg-neutral-800 text-base">{mat.icon}</div>
                      <div>
                        <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{tr(mat.nameRu, mat.name, mat.nameEn)}</span>
                        <span className="text-[10px] text-neutral-400 block">{tr(mat.descriptionRu, mat.description, mat.descriptionEn)}</span>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${count > 0 ? 'text-primary-500' : 'text-neutral-400'}`}>
                      {count > 0 ? `×${count}` : '0'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pickaxe info */}
        <div className="mt-4">
          <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-warning-500" />
            {t('shopEquipment')}
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl p-2.5 bg-neutral-50 dark:bg-neutral-850/50 border border-neutral-200 dark:border-neutral-800">
              <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Pickaxe className="w-4 h-4 text-primary-500" />
                {t('pickaxe')}
              </span>
              <span className="text-xs text-neutral-400">
                {state.activePickaxe ? `${state.activePickaxe.durability}/${state.activePickaxe.maxDurability}` : t('noDurability')}
                {state.sparePickaxes.length > 0 && ` (+${state.sparePickaxes.length})`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Case results modal */}
      {showResults && results && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={closeResults}
        >
          <div
            className="card w-full max-w-md p-6 slide-up-fade"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                <Gift className="w-5 h-5 text-warning-500" />
                {t('caseOpened')}
              </h2>
              <button
                type="button"
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
                const rarityName = tr(rarity.nameRu, rarity.nameUk, rarity.nameEn);
                const lootIcon =
                  result.loot.type === 'cash' ? <Coins className="w-5 h-5 text-success-500" /> :
                  result.loot.type === 'gems' ? <Gem className="w-5 h-5 text-accent-500" /> :
                  result.loot.type === 'itembag' ? <ShoppingBag className="w-5 h-5 text-warning-500" /> :
                  <Sparkles className="w-5 h-5 text-accent-400" />;
                return (
                  <div
                    key={i}
                    className="rounded-xl p-3 border-2 flex items-center gap-3 animate-drop-bounce"
                    style={{
                      borderColor: rarity.color + '60',
                      background: rarity.glowColor,
                      animationDelay: `${i * 0.08}s`,
                      opacity: 0,
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: rarity.color + '30' }}
                    >
                      {lootIcon}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold" style={{ color: rarity.color }}>{rarityName}</div>
                      <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                        {t('youGot')}: {result.loot.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={closeResults}
              className="btn-primary w-full py-2.5 text-sm mt-4 transition-all duration-200 hover:shadow-md active:scale-95"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
