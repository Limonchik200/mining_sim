import { useState, useEffect, useRef } from 'react';
import { useGame } from '@/context/GameContext';
import { formatTime, formatMoney } from '@/config';
import { getPickaxeTier, getRepairCost, isUnlimitedDurability } from '@/config/pickaxesConfig';
import { getMineById, MINES, RESOURCES, isDumpMine } from '@/config/minesConfig';
import { CASE_RARITIES } from '@/config/casesConfig';
import { COOLER_CONFIGS } from '@/config/coolerConfig';
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
  ShoppingBag,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';

export default function MiningTab() {
  const { state, dig, collectBasket, t, lang, currentAutoCooldownMs, currentBasketCap, currentMineId, setCurrentMineId, repairActivePickaxe, currentEnergyRegenSeconds, currentEnergyRegenAmount, totalItemEffects, currentEnergyMax, isMineUnlocked, startMineUnlock, speedUpMineUnlock, checkMineUnlockRequirements, setItemsOpen } = useGame();
  const [, force] = useState(0);
  const [showMineSelector, setShowMineSelector] = useState(false);
  const [showMiningWindow, setShowMiningWindow] = useState(false);
  const [showRepairPlaque, setShowRepairPlaque] = useState(false);
  const [unlockTargetMineId, setUnlockTargetMineId] = useState<number | null>(null);
  const [mineOpenedNotice, setMineOpenedNotice] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => force((n) => n + 1), 250);
    return () => clearInterval(interval);
  }, []);

  // Track mine unlock completion for "Mine opened" notice
  const prevUnlockedRef = useRef<number[]>(state.unlockedMines || [0, 1]);
  useEffect(() => {
    const currentUnlocked = state.unlockedMines || [0, 1];
    const newlyOpened = currentUnlocked.filter(id => !prevUnlockedRef.current.includes(id) && id > 1);
    if (newlyOpened.length > 0) {
      setMineOpenedNotice(newlyOpened[0]);
    }
    prevUnlockedRef.current = [...currentUnlocked];
  }, [state.unlockedMines]);

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

  // Temperature for current mine
  const currentMineData = getMineById(currentMineId);
  const baseTemp = currentMineData.environment?.baseTemperature ?? 15;
  const activeCoolers = state.lifeSupport.coolers.filter((c) => c.active && c.durability > 0);
  const tempReduction = activeCoolers.reduce((sum, c) => {
    const cfg = COOLER_CONFIGS[c.type];
    return sum + (cfg.modeConfigs[c.mode]?.tempReduction ?? 0);
  }, 0);
  const currentTemp = baseTemp - tempReduction;
  const needsOxygen = currentMineId >= 3;
  const activeTank = state.lifeSupport.activeOxygenTankId
    ? state.lifeSupport.oxygenTanks.find((t) => t.id === state.lifeSupport.activeOxygenTankId)
    : state.lifeSupport.oxygenTanks.find((t) => t.currentOxygen > 0);

  const basketTotalMass = state.autoBasket.reduce((sum, item) => sum + item.mass, 0);

  const canDig = state.energy >= tier.energyCost && state.activePickaxe && (isShovel || state.activePickaxe.durability >= tier.durabilityCost) && hasLeaseOrDump
    && (!needsOxygen || (activeTank && activeTank.currentOxygen > 0))
    && (dumpMine || (currentTemp >= 8 && currentTemp <= 18));

  const autoMiningActive = !!state.autoMiningEndsAt && autoMiningRemaining > 0 && basketTotalMass < currentBasketCap;
  const basketFull = basketTotalMass >= currentBasketCap;

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

  const handleDig = (x?: number, y?: number) => {
    if (!canDig) return;
    dig(x, y);
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
  const basketPct = currentBasketCap > 0 ? (basketTotalMass / currentBasketCap) * 100 : 0;

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

  // Check if previous mine is unlocked for sequential unlock display
  const unlockedSet = new Set(state.unlockedMines || [0, 1]);

  return (
    <div className="space-y-4 relative">
      {/* Top bar: Mine selector + Items button */}
      <div className="flex justify-between items-center mb-2 gap-2">
        <button
          onClick={() => setItemsOpen(true)}
          disabled={state.level < 5}
          className={`bg-neutral-200 dark:bg-neutral-800 ${state.level >= 5 ? 'hover:bg-neutral-300 dark:hover:bg-neutral-700' : 'opacity-40 cursor-not-allowed'} text-neutral-700 dark:text-neutral-200 px-3 py-2 rounded-xl shadow-md flex items-center gap-1.5 font-bold text-sm border border-neutral-300/30 dark:border-neutral-700/30 transition-all`}
        >
          {state.level < 5 ? (
            <>
              <Lock className="w-4 h-4 text-neutral-400" />
              <span className="text-[10px] font-bold text-neutral-400">Lvl 5</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4 text-warning-500" />
              {state.itemBags > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-warning-500 text-white">{state.itemBags}</span>
              )}
            </>
          )}
        </button>
        <button
          onClick={() => setShowMineSelector(true)}
          className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 font-bold text-sm border border-amber-400/30 transition-all"
        >
          ⛏️ {mineName}
        </button>
      </div>

      {/* Mine Room Visual */}
      <MineRoomView onOreVeinClick={() => setShowMiningWindow(true)} />

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
            {basketTotalMass.toFixed(1)} / {currentBasketCap} {lang === 'ru' ? 'кг' : (lang === 'uk' ? 'кг' : 'kg')}
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

        {/* Lease timers */}
        <div className="grid grid-cols-2 gap-3 mb-3">
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

        {state.autoMiningEndsAt && autoMiningRemaining > 0 && (
          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mb-3 flex items-center gap-1 italic">
            <AlertTriangle className="w-3 h-3 text-warning-500 shrink-0" />
            {lang === 'ru' ? 'Автоматический видобуток увеличивает знос инструмента на +15%' : (lang === 'uk' ? 'Автоматичний видобуток збільшує знос інструменту на +15%' : 'Auto-mining increases tool wear by +15%')}
          </p>
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

      {/* Mine selector modal — scrollable */}
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
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#f59e0b transparent' }}>
              {MINES.map((mine) => {
                const mineUnlocked = isMineUnlocked(mine.id);
                const levelMet = state.level >= mine.reqLevel;
                const isSelected = currentMineId === mine.id;
                const mName = lang === 'ru' ? mine.nameRu : (lang === 'uk' ? mine.nameUk : mine.nameEn);
                const unlockTimer = (state.mineUnlockTimers || []).find((tm) => tm.mineId === mine.id);
                const timerRemaining = unlockTimer
                  ? Math.max(0, Math.ceil((unlockTimer.startedAt + unlockTimer.durationMs - now) / 1000))
                  : 0;
                const prevUnlocked = mine.id <= 1 || unlockedSet.has(mine.id - 1);
                const canTryUnlock = levelMet && prevUnlocked;
                return (
                  <button
                    key={mine.id}
                    disabled={!levelMet && !mineUnlocked && !unlockTimer || (!prevUnlocked && !mineUnlocked && !unlockTimer)}
                    onClick={() => {
                      if (mineUnlocked) {
                        setCurrentMineId(mine.id);
                        setShowMineSelector(false);
                      } else if (canTryUnlock) {
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
                        : canTryUnlock
                        ? 'bg-neutral-100 dark:bg-neutral-800 hover:bg-amber-500/20 text-neutral-800 dark:text-neutral-100 border border-amber-500/30'
                        : 'bg-neutral-100/50 dark:bg-neutral-800/40 text-neutral-400 cursor-not-allowed'
                    }`}
                  >
                    <span>{mName}</span>
                    {mineUnlocked ? (
                      <span className="text-xs">{isSelected ? (lang === 'ru' ? 'Выбрано' : (lang === 'uk' ? 'Вибрано' : 'Selected')) : (lang === 'ru' ? 'Выбрать' : (lang === 'uk' ? 'Обрати' : 'Select'))}</span>
                    ) : unlockTimer ? (
                      <span className="text-xs flex items-center gap-1"><Timer className="w-3.5 h-3.5" /> {formatTime(timerRemaining)}</span>
                    ) : !prevUnlocked && mine.id > 1 ? (
                      <span className="text-xs flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> {lang === 'ru' ? 'Пред. шахта' : (lang === 'uk' ? 'Попер. шахта' : 'Prev. mine')}</span>
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

      {/* Mining window — opened by clicking ore vein */}
      {showMiningWindow && (() => {
        const mine = getMineById(currentMineId);
        const mName = lang === 'ru' ? mine.nameRu : (lang === 'uk' ? mine.nameUk : mine.nameEn);
        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowMiningWindow(false)}>
            <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto p-5 space-y-4 animate-drop-in" onClick={(e) => e.stopPropagation()}>
              {/* Header with mine name and number */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                  <Pickaxe className="w-5 h-5 text-primary-500" />
                  {mName}
                  <span className="text-xs text-neutral-400">#{currentMineId}</span>
                </h3>
                <button onClick={() => setShowMiningWindow(false)} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Oxygen/temperature warnings */}
              {needsOxygen && (!activeTank || activeTank.currentOxygen <= 0) && (
                <div className="flex items-center gap-1.5 text-xs text-error-500 bg-error-500/10 px-3 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  {lang === 'ru' ? 'Нет кислорода! Нужен балон.' : (lang === 'uk' ? 'Немає кисню! Потрібен балон.' : 'No oxygen! Need a tank.')}
                </div>
              )}
              {!dumpMine && (currentTemp < 8 || currentTemp > 18) && (
                <div className="flex items-center gap-1.5 text-xs text-error-500 bg-error-500/10 px-3 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  {lang === 'ru' ? `Температура ${currentTemp.toFixed(0)}°C вне нормы (8–18°C)!` : (lang === 'uk' ? `Температура ${currentTemp.toFixed(0)}°C поза нормою (8–18°C)!` : `Temperature ${currentTemp.toFixed(0)}°C out of range (8–18°C)!`)}
                </div>
              )}

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

              {/* Pickaxe durability bar — clickable for repair */}
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
                    <button
                      onClick={() => setShowRepairPlaque(!showRepairPlaque)}
                      className="w-full text-left"
                    >
                      <div className="h-3 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden mb-2 cursor-pointer hover:opacity-80 transition-opacity">
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
                    </button>
                    {showRepairPlaque && (
                      <div className="rounded-lg bg-primary-500/10 border border-primary-500/20 p-3 flex items-center justify-between gap-2">
                        <div className="text-xs">
                          <div className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                            <Wrench className="w-3.5 h-3.5 text-primary-500" />
                            {t('repairBtn')}
                          </div>
                          <div className="text-neutral-500 mt-0.5">{formatMoney(repairCost)}</div>
                        </div>
                        <button
                          onClick={() => {
                            repairActivePickaxe();
                            setShowRepairPlaque(false);
                          }}
                          disabled={!needsRepair || !canAffordRepair}
                          className={`btn py-1.5 px-3 text-xs rounded-lg transition-all ${
                            !needsRepair
                              ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                              : canAffordRepair
                              ? 'bg-primary-500 text-white hover:bg-primary-600'
                              : 'bg-neutral-300 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed'
                          }`}
                        >
                          <Wrench className="w-3.5 h-3.5 inline mr-1" />
                          {needsRepair ? `${t('repairBtn')}` : '✓'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Dig button */}
              <button
                onClick={() => handleDig()}
                disabled={!canDig}
                className={`
                  relative w-full py-3 rounded-xl
                  flex items-center justify-center gap-2
                  font-bold text-sm uppercase tracking-wide
                  transition-all duration-200
                  ${canDig
                    ? 'bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-xl shadow-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/40 active:scale-95'
                    : 'bg-neutral-300 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-600 cursor-not-allowed'
                  }
                `}
              >
                <Pickaxe className="w-5 h-5" />
                {t('dig')}
              </button>

              {/* Block reasons */}
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

              {/* Drop chances inside mining window */}
              <div className="border-t border-neutral-200 dark:border-neutral-800 pt-3">
                <div className="text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-2 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  {t('mineChances')}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {dropEntries.map(([type, chance]) => {
                    const res = RESOURCES[type];
                    const name = lang === 'ru' ? res.nameRu : (lang === 'uk' ? res.nameUk : res.nameEn);
                    return (
                      <div key={type} className="flex items-center justify-between rounded-lg p-2 bg-neutral-50 dark:bg-neutral-850/50 border border-neutral-200 dark:border-neutral-800">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: res.bgColor }}>
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: res.color }} />
                          </div>
                          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{name}</span>
                        </div>
                        <span className="text-xs font-bold text-primary-500">{chance}%</span>
                      </div>
                    );
                  })}
                </div>
                <div className="text-[10px] text-neutral-400 text-center mt-2">
                  {lang === 'ru' ? 'Шанс алмаза: 0.001% за копание' : (lang === 'uk' ? 'Шанс діаманта: 0.001% за копання' : 'Diamond chance: 0.001% per dig')}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Mine opened notice */}
      {mineOpenedNotice !== null && (() => {
        const mine = getMineById(mineOpenedNotice);
        const mName = lang === 'ru' ? mine.nameRu : (lang === 'uk' ? mine.nameUk : mine.nameEn);
        return (
          <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={() => setMineOpenedNotice(null)}>
            <div className="card p-6 max-w-sm w-full text-center space-y-3 animate-drop-in" onClick={(e) => e.stopPropagation()}>
              <CheckCircle2 className="w-12 h-12 text-success-500 mx-auto" />
              <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">
                {lang === 'ru' ? 'Шахта открыта!' : (lang === 'uk' ? 'Шахту відкрито!' : 'Mine opened!')}
              </h3>
              <p className="text-sm text-neutral-500">{mName}</p>
              <button
                onClick={() => {
                  setCurrentMineId(mineOpenedNotice);
                  setMineOpenedNotice(null);
                }}
                className="btn-primary w-full py-2.5 text-sm"
              >
                {lang === 'ru' ? 'Перейти к шахте' : (lang === 'uk' ? 'Перейти до шахти' : 'Go to mine')}
              </button>
              <button onClick={() => setMineOpenedNotice(null)} className="btn-ghost w-full py-2 text-xs">
                {t('close')}
              </button>
            </div>
          </div>
        );
      })()}

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
