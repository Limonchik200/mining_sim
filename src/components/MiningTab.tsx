import { useState, useEffect, useRef } from 'react';
import { useGame } from '@/context/GameContext';
import { formatTime, formatMoney } from '@/config';
import { getPickaxeTier, getRepairCost, isUnlimitedDurability } from '@/config/pickaxesConfig';
import { getMineById, MINES, RESOURCES, isDumpMine } from '@/config/minesConfig';
import { CASE_RARITIES } from '@/config/casesConfig';
import type { ResourceType, CaseRarity } from '@/types';
import MineRoomView from '@/components/MineRoomView';
import {
  Pickaxe,
  Package,
  Clock,
  Zap,
  AlertCircle,
  Download,
  Battery,
  X,
  Info,
  Lock,
  Wrench,
  Gift,
  Gem,
  CheckCircle2,
  Timer,
} from 'lucide-react';

export default function MiningTab() {
  const { state, dig, collectBasket, t, lang, currentAutoCooldownMs, currentBasketCap, currentMineId, setCurrentMineId, repairActivePickaxe, currentEnergyRegenSeconds, currentEnergyRegenAmount, totalItemEffects, currentEnergyMax, isMineUnlocked, startMineUnlock, speedUpMineUnlock, checkMineUnlockRequirements } = useGame();
  const [, force] = useState(0);
  const digBtnRef = useRef<HTMLButtonElement>(null);
  const [digShake, setDigShake] = useState(false);

  const [showMineSelector, setShowMineSelector] = useState(false);
  const [showMineInfo, setShowMineInfo] = useState(false);
  const [unlockTargetMineId, setUnlockTargetMineId] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => force((n) => n + 1), 250);
    return () => clearInterval(interval);
  }, []);

  const now = Date.now();
  const autoMiningRemaining = state.autoMiningEndsAt
    ? Math.max(0, (state.autoMiningEndsAt - now) / 1000)
    : 0;
  const activeLeaseRemaining = state.activeLeaseEndsAt
    ? Math.max(0, (state.activeLeaseEndsAt - now) / 1000)
    : 0;

  const tier = getPickaxeTier(state.activePickaxeTierId);
  const isShovel = isUnlimitedDurability(state.activePickaxeTierId);
  const dumpMine = isDumpMine(currentMineId);
  const hasActiveLease = state.activeLeaseEndsAt && activeLeaseRemaining > 0;
  const hasLeaseOrDump = dumpMine || hasActiveLease;
  const canDig = state.energy >= tier.energyCost && state.activePickaxe && (isShovel || state.activePickaxe.durability >= tier.durabilityCost) && hasLeaseOrDump;
  const autoMiningActive = !!state.autoMiningEndsAt && autoMiningRemaining > 0 && state.autoBasket.length < currentBasketCap;
  const basketFull = state.autoBasket.length >= currentBasketCap;

  const energyDeficit = currentEnergyMax - state.energy;
  const activeBuffs = state.buffs.filter((b) => b.expiresAt > now);
  let totalRegenMult = 1;
  for (const buff of activeBuffs) totalRegenMult += buff.regenMultiplier;
  const secondsPerEnergy = currentEnergyRegenSeconds / totalRegenMult;
  const regenPerTick = currentEnergyRegenAmount * totalRegenMult;
  const secondsUntilNextEnergy = Math.ceil(secondsPerEnergy - ((now / 1000) % secondsPerEnergy));
  const secondsUntilFullRegen = Math.ceil(energyDeficit * secondsPerEnergy / regenPerTick);

  const repairCost = state.activePickaxe && !isShovel ? getRepairCost(state.activePickaxeTierId, state.activePickaxe.durability) : 0;
  const needsRepair = !isShovel && state.activePickaxe && state.activePickaxe.durability < state.activePickaxe.maxDurability;
  const canAffordRepair = state.balance >= repairCost;

  const handleDig = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = digBtnRef.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : e.clientX;
    const y = rect ? rect.top + rect.height / 2 - 20 : e.clientY;
    dig(x, y);
    if (!canDig) {
      setDigShake(true);
      setTimeout(() => setDigShake(false), 300);
    }
  };

  const basketSummary = state.autoBasket.reduce(
    (acc, item) => {
      if (!acc[item.resource]) acc[item.resource] = { mass: 0, count: 0 };
      acc[item.resource].mass += item.mass;
      acc[item.resource].count += 1;
      return acc;
    },
    {} as Record<string, { mass: number; count: number }>
  );

  const energyPct = currentEnergyMax > 0 ? (state.energy / currentEnergyMax) * 100 : 0;
  const durabilityPct = state.activePickaxe && !isShovel
    ? (state.activePickaxe.durability / state.activePickaxe.maxDurability) * 100
    : 100;
  const basketPct = currentBasketCap > 0 ? (state.autoBasket.length / currentBasketCap) * 100 : 0;

  const currentMine = getMineById(currentMineId);
  const mineName = lang === 'ru' ? currentMine.nameRu : (lang === 'uk' ? currentMine.nameUk : currentMine.nameEn);

  const dropEntries: Array<[ResourceType, number]> = ([
    ['stone', currentMine.drops.stone],
    ['coal', currentMine.drops.coal],
    ['copper', currentMine.drops.copper],
    ['iron', currentMine.drops.iron],
    ['silver', currentMine.drops.silver ?? 0],
    ['gold', currentMine.drops.gold ?? 0],
  ] as Array<[ResourceType, number]>).filter(([, chance]) => Number(chance) > 0);

  return (
    <div className="space-y-4 relative">
      {/* Mine selector button */}
      <div className="flex justify-end items-center mb-2">
        <button
          onClick={() => setShowMineSelector(true)}
          className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 font-bold text-sm border border-amber-400/30 transition-all"
        >
          ⛏️ {mineName}
        </button>
      </div>

      {/* Mine Room Visual */}
      <MineRoomView onDigActivate={() => handleDig({} as React.MouseEvent<HTMLButtonElement>)} />

      {/* Mine info + status */}
      <div className="card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <Pickaxe className="w-5 h-5 text-primary-500" />
            {mineName}
          </h2>
          <button
            onClick={() => setShowMineInfo(true)}
            className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-300 transition-all font-bold"
            title={t('mineChances')}
          >
            <Info className="w-5 h-5" />
          </button>
        </div>

        {/* Status indicators */}
        <div className="space-y-3 mb-4">
          {/* Energy bar */}
          <div className="rounded-xl bg-neutral-50 dark:bg-neutral-850/50 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Battery className="w-4 h-4 text-accent-500" />
                <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{t('energy')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {totalItemEffects.energyMaxBonus > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-success-500/20 text-success-500">
                    +{totalItemEffects.energyMaxBonus}
                  </span>
                )}
                <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                  {Math.floor(state.energy)} / {currentEnergyMax}
                </span>
              </div>
            </div>
            <div className="h-3 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden mb-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent-400 to-accent-500 transition-all duration-300"
                style={{ width: `${energyPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              {state.energy >= currentEnergyMax ? (
                <span className="text-success-500 font-semibold">{t('energyFull')}</span>
              ) : (
                <>
                  <span className="text-neutral-400">
                    +{regenPerTick % 1 === 0 ? regenPerTick.toFixed(0) : regenPerTick.toFixed(1)} {t('energyRegenIn')} {secondsUntilNextEnergy}{t('secs')}
                  </span>
                  <span className="text-neutral-400">
                    {t('fullRegenIn')} {Math.floor(secondsUntilFullRegen / 60)}{t('min')} {secondsUntilFullRegen % 60}{t('secs')}
                  </span>
                </>
              )}
            </div>
            {activeBuffs.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {activeBuffs.map((buff) => {
                  const remaining = Math.ceil((buff.expiresAt - now) / 1000);
                  return (
                    <span key={buff.id} className="text-xs px-2 py-0.5 rounded-lg bg-accent-500/10 text-accent-500 font-medium flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {buff.name} ×{buff.regenMultiplier} ({formatTime(remaining)})
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pickaxe durability + repair */}
          <div className="rounded-xl bg-neutral-50 dark:bg-neutral-850/50 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Pickaxe className="w-4 h-4 text-primary-500" />
                <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{t('pickaxe')}</span>
              </div>
              <span className="text-xs text-neutral-400">
                {lang === 'ru' ? tier.nameRu : (lang === 'uk' ? tier.nameUk : tier.nameEn)}
                {state.sparePickaxes.length > 0 && <span className="ml-1.5 text-neutral-400">(+{state.sparePickaxes.length})</span>}
              </span>
            </div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('durability')}</span>
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                {state.activePickaxe
                  ? isShovel
                    ? '∞'
                    : `${state.activePickaxe.durability} / ${state.activePickaxe.maxDurability}`
                  : t('noDurability')}
              </span>
            </div>
            {!isShovel && (
              <>
                <div className="h-3 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      durabilityPct > 50
                        ? 'bg-gradient-to-r from-success-400 to-success-500'
                        : durabilityPct > 20
                        ? 'bg-gradient-to-r from-warning-400 to-warning-500'
                        : 'bg-gradient-to-r from-error-400 to-error-500'
                    }`}
                    style={{ width: `${durabilityPct}%` }}
                  />
                </div>
                <button
                  onClick={repairActivePickaxe}
                  disabled={!needsRepair || !canAffordRepair}
                  className={`btn w-full py-1.5 text-xs flex items-center justify-center gap-1.5 rounded-lg transition-all ${
                    !needsRepair
                      ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                      : canAffordRepair
                      ? 'bg-primary-500 text-white hover:bg-primary-600'
                      : 'bg-neutral-300 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  {needsRepair ? `${t('repairBtn')} · ${repairCost.toFixed(2)}` : t('repairBtn')}
                </button>
              </>
            )}
          </div>

          {/* Lease timers */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl p-3 bg-neutral-50 dark:bg-neutral-850/50 ${hasActiveLease ? 'border border-primary-500/30' : 'border border-neutral-200 dark:border-neutral-800'}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="w-4 h-4 text-primary-500" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  {t('activeLease')}
                </span>
                {totalItemEffects.activeLeaseMultBonus > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-success-500/20 text-success-500 ml-auto">
                    {lang === 'ru' ? `Оренда +${totalItemEffects.activeLeaseMultBonus}х` : (lang === 'uk' ? `Оренда +${totalItemEffects.activeLeaseMultBonus}х` : `Lease +${totalItemEffects.activeLeaseMultBonus}x`)}
                  </span>
                )}
              </div>
              {hasActiveLease ? (
                <span className="text-lg font-bold text-primary-500 tabular-nums">
                  {formatTime(activeLeaseRemaining)}
                </span>
              ) : (
                <span className="text-xs text-neutral-400">{t('inactive')}</span>
              )}
            </div>
            <div className={`rounded-xl p-3 bg-neutral-50 dark:bg-neutral-850/50 ${state.autoMiningEndsAt && autoMiningRemaining > 0 ? 'border border-accent-500/30' : 'border border-neutral-200 dark:border-neutral-800'}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-4 h-4 text-accent-500" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  {t('autoMining')}
                </span>
              </div>
              {state.autoMiningEndsAt && autoMiningRemaining > 0 ? (
                <span className="text-lg font-bold text-accent-500 tabular-nums">
                  {formatTime(autoMiningRemaining)}
                </span>
              ) : (
                <span className="text-xs text-neutral-400">{t('inactive')}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 py-2">
          <button
            ref={digBtnRef}
            onClick={handleDig}
            className={`
              relative w-28 h-28 sm:w-36 sm:h-36 rounded-full
              flex items-center justify-center
              font-bold text-base sm:text-lg uppercase tracking-wide
              transition-all duration-200
              ${canDig
                ? 'bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-xl shadow-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/40 active:scale-95 animate-pulse-glow'
                : 'bg-neutral-300 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-600 cursor-not-allowed'
              }
              ${digShake ? 'animate-shake' : ''}
            `}
          >
            <div className="flex flex-col items-center gap-2">
              <Pickaxe className="w-7 h-7 sm:w-9 sm:h-9" />
              <span>{t('dig')}</span>
            </div>
          </button>

          <div className="flex flex-wrap gap-2 justify-center">
            {!hasLeaseOrDump && (
              <span className="inline-flex items-center gap-1 text-xs text-error-500 bg-error-500/10 px-2 py-1 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5" />
                {t('noLease')}
              </span>
            )}
            {state.energy < tier.energyCost && (
              <span className="inline-flex items-center gap-1 text-xs text-error-500 bg-error-500/10 px-2 py-1 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5" />
                {t('noEnergy')}
              </span>
            )}
            {(!state.activePickaxe || (!isShovel && state.activePickaxe.durability < tier.durabilityCost)) && (
              <span className="inline-flex items-center gap-1 text-xs text-error-500 bg-error-500/10 px-2 py-1 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5" />
                {t('noDurability')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Auto mining basket */}
      <div className={`card p-4 ${autoMiningActive ? 'border-accent-500/30' : ''}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-warning-500" />
            {t('autoBasket')}
          </h3>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              autoMiningActive
                ? 'bg-accent-500/20 text-accent-500'
                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
            }`}
          >
            {autoMiningActive ? t('active') : t('inactive')}
          </span>
          {totalItemEffects.sellMultBonus > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-success-500/20 text-success-500 ml-1">
              {lang === 'ru' ? `Продажа x${(1 + totalItemEffects.sellMultBonus).toFixed(1)}` : (lang === 'uk' ? `Продаж x${(1 + totalItemEffects.sellMultBonus).toFixed(1)}` : `Sell x${(1 + totalItemEffects.sellMultBonus).toFixed(1)}`)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('autoBasket')}</span>
          <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
            {state.autoBasket.length} / {currentBasketCap}
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              basketPct >= 100 ? 'bg-error-500' : 'bg-gradient-to-r from-warning-400 to-warning-500'
            }`}
            style={{ width: `${basketPct}%` }}
          />
        </div>

        {basketFull && (
          <p className="text-xs text-error-500 mb-2 flex items-center gap-1">
            <X className="w-3.5 h-3.5" />
            {t('autoMiningStopped')}
          </p>
        )}

        {Object.keys(basketSummary).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Object.entries(basketSummary).map(([type, data]) => {
              const res = RESOURCES[type as ResourceType];
              const resName = lang === 'ru' ? res.nameRu : (lang === 'uk' ? res.nameUk : res.nameEn);
              return (
                <span key={type} className="text-xs px-2 py-0.5 rounded-lg font-medium flex items-center gap-1" style={{ backgroundColor: res.bgColor, color: res.color }}>
                  {resName} ×{data.count} ({data.mass.toFixed(2)}kg)
                </span>
              );
            })}
          </div>
        )}

        {state.autoBasketCases.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Object.entries(
              state.autoBasketCases.reduce((acc, c) => {
                acc[c.rarity] = (acc[c.rarity] || 0) + 1;
                return acc;
              }, {} as Record<CaseRarity, number>)
            ).map(([rarity, count]) => {
              const cfg = CASE_RARITIES[rarity as CaseRarity];
              const rName = lang === 'ru' ? cfg.nameRu : (lang === 'uk' ? cfg.nameUk : cfg.nameEn);
              return (
                <span key={rarity} className="text-xs px-2 py-0.5 rounded-lg font-medium flex items-center gap-1" style={{ backgroundColor: cfg.glowColor, color: cfg.color }}>
                  <Gift className="w-3 h-3" />
                  {rName} ×{count}
                </span>
              );
            })}
          </div>
        )}

        <button
          onClick={collectBasket}
          disabled={state.autoBasket.length === 0}
          className="btn-success w-full py-2 text-sm"
        >
          <Download className="w-4 h-4 inline mr-1.5" />
          {t('collectBasket')}
        </button>
      </div>

      {/* Mine selector modal */}
      {showMineSelector && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowMineSelector(false)}>
          <div className="card p-6 max-w-sm w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">
                {lang === 'ru' ? 'Выбор шахты' : (lang === 'uk' ? 'Вибір шахти' : 'Select Mine')}
              </h3>
              <button onClick={() => setShowMineSelector(false)} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {MINES.map((mine) => {
                const mineUnlocked = isMineUnlocked(mine.id);
                const levelMet = state.level >= mine.reqLevel;
                const isSelected = currentMineId === mine.id;
                const mName = lang === 'ru' ? mine.nameRu : (lang === 'uk' ? mine.nameUk : mine.nameEn);
                const unlockTimer = (state.mineUnlockTimers || []).find((tm) => tm.mineId === mine.id);
                const timerRemaining = unlockTimer
                  ? Math.max(0, Math.ceil((unlockTimer.startedAt + unlockTimer.durationMs - now) / 1000))
                  : 0;
                return (
                  <button
                    key={mine.id}
                    disabled={!levelMet && !mineUnlocked && !unlockTimer}
                    onClick={() => {
                      if (mineUnlocked) {
                        setCurrentMineId(mine.id);
                        setShowMineSelector(false);
                      } else if (levelMet) {
                        setUnlockTargetMineId(mine.id);
                        setShowMineSelector(false);
                      }
                    }}
                    className={`w-full p-3 rounded-xl flex items-center justify-between transition-all font-semibold ${
                      isSelected
                        ? 'bg-amber-600 text-white'
                        : mineUnlocked
                        ? 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-100'
                        : unlockTimer
                        ? 'bg-accent-500/20 text-accent-500 border border-accent-500/30'
                        : levelMet
                        ? 'bg-neutral-100 dark:bg-neutral-800 hover:bg-amber-500/20 text-neutral-800 dark:text-neutral-100 border border-amber-500/30'
                        : 'bg-neutral-100/50 dark:bg-neutral-800/40 text-neutral-400 cursor-not-allowed'
                    }`}
                  >
                    <span>{mName}</span>
                    {mineUnlocked ? (
                      <span className="text-xs">{isSelected ? (lang === 'ru' ? 'Выбрано' : (lang === 'uk' ? 'Вибрано' : 'Selected')) : (lang === 'ru' ? 'Выбрать' : (lang === 'uk' ? 'Обрати' : 'Select'))}</span>
                    ) : unlockTimer ? (
                      <span className="text-xs flex items-center gap-1"><Timer className="w-3.5 h-3.5" /> {formatTime(timerRemaining)}</span>
                    ) : levelMet ? (
                      <span className="text-xs flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> {lang === 'ru' ? 'Разблок.' : (lang === 'uk' ? 'Розбл.' : 'Unlock')}</span>
                    ) : (
                      <span className="text-xs flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> {t('requiresLevel')} {mine.reqLevel}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mine info modal with actual drop rates */}
      {showMineInfo && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowMineInfo(false)}>
          <div className="card p-6 max-w-sm w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">
                {t('mineChances')} — {mineName}
              </h3>
              <button onClick={() => setShowMineInfo(false)} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {dropEntries.map(([type, chance]) => {
                const res = RESOURCES[type];
                const name = lang === 'ru' ? res.nameRu : (lang === 'uk' ? res.nameUk : res.nameEn);
                return (
                  <div key={type} className="flex items-center justify-between rounded-xl p-2.5 bg-neutral-50 dark:bg-neutral-850/50 border border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: res.bgColor }}>
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: res.color }} />
                      </div>
                      <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{name}</span>
                    </div>
                    <span className="text-sm font-bold text-primary-500">{chance}%</span>
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-neutral-400 text-center pt-1">
              {lang === 'ru' ? 'Шанс алмаза: 0.001% за копание' : (lang === 'uk' ? 'Шанс діаманта: 0.001% за копання' : 'Diamond chance: 0.001% per dig')}
            </div>
            <button onClick={() => setShowMineInfo(false)} className="btn-primary w-full py-2 text-sm">
              {t('close')}
            </button>
          </div>
        </div>
      )}
      {/* Mine unlock modal */}
      {unlockTargetMineId !== null && (() => {
        const mine = getMineById(unlockTargetMineId);
        const mName = lang === 'ru' ? mine.nameRu : (lang === 'uk' ? mine.nameUk : mine.nameEn);
        const check = checkMineUnlockRequirements(unlockTargetMineId);
        const unlockTimer = (state.mineUnlockTimers || []).find((tm) => tm.mineId === unlockTargetMineId);
        const timerRemaining = unlockTimer
          ? Math.max(0, Math.ceil((unlockTimer.startedAt + unlockTimer.durationMs - now) / 1000))
          : 0;
        const speedUpMinutes = Math.ceil(timerRemaining / 60);
        return (
          <div
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setUnlockTargetMineId(null)}
          >
            <div className="card p-6 max-w-sm w-full space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-warning-500" />
                  {lang === 'ru' ? 'Разблокировка' : (lang === 'uk' ? 'Розблокування' : 'Unlock')} — {mName}
                </h3>
                <button onClick={() => setUnlockTargetMineId(null)} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {unlockTimer ? (
                <div className="space-y-3">
                  <div className="text-center py-4">
                    <Timer className="w-10 h-10 text-accent-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-accent-500 tabular-nums">
                      {formatTime(timerRemaining)}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1">
                      {lang === 'ru' ? 'Идёт разблокировка...' : (lang === 'uk' ? 'Триває розблокування...' : 'Unlocking...')}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      speedUpMineUnlock(unlockTargetMineId, speedUpMinutes);
                    }}
                    disabled={state.gems < speedUpMinutes || speedUpMinutes <= 0}
                    className={`btn w-full py-2.5 text-sm flex items-center justify-center gap-2 rounded-lg ${
                      state.gems >= speedUpMinutes && speedUpMinutes > 0
                        ? 'bg-accent-500 text-white hover:bg-accent-600'
                        : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                    }`}
                  >
                    <Gem className="w-4 h-4" />
                    {lang === 'ru' ? `Ускорить за ${speedUpMinutes} 💎` : (lang === 'uk' ? `Прискорити за ${speedUpMinutes} 💎` : `Speed up for ${speedUpMinutes} 💎`)}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    {check.requirements.map((req, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between rounded-xl p-2.5 border ${
                          req.met
                            ? 'bg-success-500/10 border-success-500/30'
                            : 'bg-error-500/10 border-error-500/30'
                        }`}
                      >
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                          {req.met ? (
                            <CheckCircle2 className="w-4 h-4 text-success-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-error-500" />
                          )}
                          {req.label}
                        </span>
                        <span className={`text-sm font-bold ${req.met ? 'text-success-500' : 'text-error-500'}`}>
                          {req.current} / {req.required}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      startMineUnlock(unlockTargetMineId);
                    }}
                    disabled={!check.met}
                    className={`btn w-full py-2.5 text-sm rounded-lg ${
                      check.met
                        ? 'bg-primary-500 text-white hover:bg-primary-600'
                        : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                    }`}
                  >
                    {check.met
                      ? (mine.unlockRequirements?.unlockTimeMinutes
                        ? (lang === 'ru' ? `Запустить разблокировку (${mine.unlockRequirements.unlockTimeMinutes} мин)` : (lang === 'uk' ? `Запустити розблокування (${mine.unlockRequirements.unlockTimeMinutes} хв)` : `Start unlock (${mine.unlockRequirements.unlockTimeMinutes} min)`))
                        : (lang === 'ru' ? 'Разблокировать' : (lang === 'uk' ? 'Розблокувати' : 'Unlock')))
                      : (lang === 'ru' ? 'Условия не выполнены' : (lang === 'uk' ? 'Умови не виконані' : 'Requirements not met'))
                    }
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// Keep import for energy regen constant — moved to top
