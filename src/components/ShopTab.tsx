import { useState, useMemo, useRef } from 'react';
import { useGame } from '@/context/GameContext';
import type { TimeUnit, ResourceType } from '@/types';
import {
  STARTER_GIFT_SECONDS,
  FOOD_ITEMS,
  PICKAXE_TIERS,
  getPickaxeTier,
  getActiveLeasePricePerSec,
  getAutoLeasePricePerSec,
  getFoodPrice,
} from '@/config/pickaxesConfig';
import { RESOURCES, RESOURCE_LIST, MIN_LEASE_SECONDS, getMineById } from '@/config/minesConfig';
import { DAILY_REWARDS, getDailyRewardScaled } from '@/config/rewardsConfig';
import { convertToSeconds, formatMoney, formatTime } from '@/config';
import {
  Clock,
  Zap,
  Battery,
  Candy,
  CupSoda,
  Cookie,
  Hammer,
  TrendingUp,
  Coins,
  Gift,
  ArrowLeftRight,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';

const foodIcons: Record<string, typeof Candy> = {
  snickers: Candy,
  juice: CupSoda,
  milka: Cookie,
};

export default function ShopTab() {
  const {
    state,
    buyActiveLease,
    buyAutoLease,
    confirmLeasePurchase,
    cancelLeasePurchase,
    pendingLeasePurchase,
    buyFood,
    buyPickaxe,
    equipPickaxe,
    switchPickaxe,
    sellResource,
    sellAll,
    claimStarterGift,
    claimDailyReward,
    t,
    lang,
    activeLeaseMult,
    autoLeaseMult,
    totalItemEffects,
  } = useGame();

  const [leaseValue, setLeaseValue] = useState('100');
  const [leaseUnit, setLeaseUnit] = useState<TimeUnit>('seconds');

  const calendarRef = useRef<HTMLDivElement>(null);
  const leasesRef = useRef<HTMLDivElement>(null);
  const pickaxesRef = useRef<HTMLDivElement>(null);
  const foodRef = useRef<HTMLDivElement>(null);

  const currentMineId = state.currentMineId || 1;
  const currentMine = getMineById(currentMineId);
  const currentMineName = lang === 'ru' ? currentMine.nameRu : (lang === 'uk' ? currentMine.nameUk : currentMine.nameEn);

  const seconds = useMemo(() => {
    const val = parseFloat(leaseValue) || 0;
    return convertToSeconds(val, leaseUnit);
  }, [leaseValue, leaseUnit]);

  const activePricePerSec = getActiveLeasePricePerSec(currentMineId);
  const autoPricePerSec = getAutoLeasePricePerSec(currentMineId);
  const activeCost = seconds * activePricePerSec;
  const autoCost = seconds * autoPricePerSec;
  const meetsMin = seconds >= MIN_LEASE_SECONDS;
  const hasResources = RESOURCE_LIST.some((r) => state.inventory[r.type].mass > 0);

  const now = Date.now();
  const activeLeaseRemaining = state.activeLeaseEndsAt
    ? Math.max(0, (state.activeLeaseEndsAt - now) / 1000)
    : 0;
  const autoLeaseRemaining = state.autoMiningEndsAt
    ? Math.max(0, (state.autoMiningEndsAt - now) / 1000)
    : 0;

  const activeLeaseMine = state.activeLeaseEndsAt && activeLeaseRemaining > 0
    ? getMineById(state.activeLeaseMineId || 1)
    : null;
  const autoLeaseMine = state.autoMiningEndsAt && autoLeaseRemaining > 0
    ? getMineById(state.autoLeaseMineId || 1)
    : null;

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const dailyStreakDays = state.dailyCalendar?.lastClaimDay || 0;
  const canClaimDaily = dailyStreakDays < 7 &&
    (!state.dailyCalendar?.lastClaimTimestamp || Date.now() - state.dailyCalendar.lastClaimTimestamp >= 20 * 3600 * 1000);

  const calculateDailyReward = (day: number) => {
    const reward = DAILY_REWARDS[day - 1];
    return getDailyRewardScaled(reward, state.level);
  };

  return (
    <div className="space-y-4">
      {/* Balance display */}
      <div className="card p-3 flex items-center justify-around">
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-success-500" />
          <span className="text-lg font-bold text-success-500">{formatMoney(state.balance)}</span>
        </div>
        <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-700" />
        <div className="flex items-center gap-2">
          <span className="text-lg">💎</span>
          <span className="text-lg font-bold text-accent-500">{state.gems}</span>
        </div>
      </div>

      {/* Lease timers */}
      <div className="grid grid-cols-2 gap-2">
        <div className={`card p-2.5 ${state.activeLeaseEndsAt && activeLeaseRemaining > 0 ? 'border-primary-500/30' : ''}`}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Zap className="w-3.5 h-3.5 text-primary-500" />
            <span className="text-[10px] font-semibold uppercase text-neutral-500">{t('activeLease')}</span>
          </div>
          {state.activeLeaseEndsAt && activeLeaseRemaining > 0 ? (
            <>
              <span className="text-sm font-bold text-primary-500 tabular-nums">{formatTime(activeLeaseRemaining)}</span>
              <div className="text-[10px] text-neutral-400">
                {t('leaseMine')} {lang === 'ru' ? activeLeaseMine?.nameRu : (lang === 'uk' ? activeLeaseMine?.nameUk : activeLeaseMine?.nameEn)}
              </div>
            </>
          ) : (
            <span className="text-xs text-neutral-400">{t('inactive')}</span>
          )}
        </div>
        <div className={`card p-2.5 ${state.autoMiningEndsAt && autoLeaseRemaining > 0 ? 'border-accent-500/30' : ''}`}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Clock className="w-3.5 h-3.5 text-accent-500" />
            <span className="text-[10px] font-semibold uppercase text-neutral-500">{t('autoMining')}</span>
          </div>
          {state.autoMiningEndsAt && autoLeaseRemaining > 0 ? (
            <>
              <span className="text-sm font-bold text-accent-500 tabular-nums">{formatTime(autoLeaseRemaining)}</span>
              <div className="text-[10px] text-neutral-400">
                {t('leaseMine')} {lang === 'ru' ? autoLeaseMine?.nameRu : (lang === 'uk' ? autoLeaseMine?.nameUk : autoLeaseMine?.nameEn)}
              </div>
            </>
          ) : (
            <span className="text-xs text-neutral-400">{t('inactive')}</span>
          )}
        </div>
      </div>

      {/* Quick nav */}
      <div className="card p-2 flex gap-1 overflow-x-auto">
        <button onClick={() => scrollTo(calendarRef)} className="btn-ghost flex-1 py-2 text-xs whitespace-nowrap">
          <Calendar className="w-3.5 h-3.5 inline mr-1" />
          {lang === 'ru' ? 'Календарь' : (lang === 'uk' ? 'Календар' : 'Calendar')}
        </button>
        <button onClick={() => scrollTo(leasesRef)} className="btn-ghost flex-1 py-2 text-xs whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 inline mr-1" />
          {t('shopJumpLeases')}
        </button>
        <button onClick={() => scrollTo(pickaxesRef)} className="btn-ghost flex-1 py-2 text-xs whitespace-nowrap">
          <Hammer className="w-3.5 h-3.5 inline mr-1" />
          {t('shopJumpPickaxes')}
        </button>
        <button onClick={() => scrollTo(foodRef)} className="btn-ghost flex-1 py-2 text-xs whitespace-nowrap">
          <Battery className="w-3.5 h-3.5 inline mr-1" />
          {t('shopJumpFood')}
        </button>
      </div>

      {/* Daily Calendar Card */}
      <div ref={calendarRef} className="card p-4 scroll-mt-4 border-accent-500/30 bg-accent-500/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-accent-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-accent-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-800 dark:text-neutral-100">
                {lang === 'ru' ? 'Ежедневный календарь' : (lang === 'uk' ? 'Щоденний календар' : 'Daily Calendar')}
              </h2>
              <div className="text-xs text-neutral-400">
                {lang === 'ru' ? 'Серия:' : (lang === 'uk' ? 'Стрік:' : 'Streak:')} <span className="text-accent-500 font-bold">{dailyStreakDays} {lang === 'ru' ? 'дней' : (lang === 'uk' ? 'день' : 'days')}</span>
              </div>
            </div>
          </div>
          <button
            onClick={claimDailyReward}
            disabled={!canClaimDaily}
            className={canClaimDaily ? "btn-accent px-4 py-2 text-xs" : "btn-ghost px-4 py-2 text-xs opacity-50 cursor-not-allowed"}
          >
            {canClaimDaily ? (lang === 'ru' ? 'Забрать награду' : (lang === 'uk' ? 'Забрати нагороду' : 'Claim Reward')) : (lang === 'ru' ? 'Получено сегодня' : (lang === 'uk' ? 'Отримано сьогодні' : 'Claimed today'))}
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 mt-3">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const isPassed = day < dailyStreakDays || (day === dailyStreakDays && !canClaimDaily);
            const isCurrent = day === dailyStreakDays && canClaimDaily;
            const reward = calculateDailyReward(day);
            const rewardLabel = reward.type === 'cash'
              ? formatMoney(reward.amount)
              : reward.type === 'gems'
              ? `${reward.amount} 💎`
              : reward.caseRarity === 'epic'
              ? (lang === 'ru' ? 'Эпический' : (lang === 'uk' ? 'Епічний' : 'Epic'))
              : (lang === 'ru' ? 'Обычный' : (lang === 'uk' ? 'Звичайний' : 'Common'));

            return (
              <div
                key={day}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                  isPassed
                    ? 'bg-success-500/10 border-success-500/30 text-success-600'
                    : isCurrent
                    ? 'bg-accent-500/20 border-accent-500 animate-pulse text-accent-500 font-bold'
                    : 'bg-neutral-100 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 text-neutral-400'
                }`}
              >
                <span className="text-[10px] uppercase font-semibold">
                  {lang === 'ru' ? `День ${day}` : (lang === 'uk' ? `День ${day}` : `Day ${day}`)}
                </span>
                {reward.type === 'case' ? (
                  <Gift className="w-4 h-4 mt-1" />
                ) : null}
                <span className="text-[10px] font-bold mt-1">{rewardLabel}</span>
                {isPassed && <CheckCircle2 className="w-3 h-3 mt-1 text-success-500" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Starter gift */}
      {!state.starterGiftClaimed && (
        <div className="card p-4 border-success-500/30 bg-success-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success-500/20 flex items-center justify-center">
                <Gift className="w-5 h-5 text-success-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{t('starterGift')}</div>
                <div className="text-xs text-neutral-400">{t('starterGiftDesc')} ({STARTER_GIFT_SECONDS}s)</div>
              </div>
            </div>
            <button onClick={claimStarterGift} className="btn-success px-4 py-2 text-sm">
              {t('claimGift')}
            </button>
          </div>
        </div>
      )}

      {/* Lease shop */}
      <div ref={leasesRef} className="card p-4 scroll-mt-4">
        <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-accent-500" />
          {t('shopLeases')}
          {activeLeaseMult > 1 && <span className="text-xs text-success-500">×{activeLeaseMult}</span>}
          {autoLeaseMult > 1 && <span className="text-xs text-success-500">×{autoLeaseMult}</span>}
        </h2>

        <div className="space-y-3">
          <div className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-850/50 rounded-lg px-3 py-2">
            {t('leaseMine')}: <span className="font-bold text-neutral-700 dark:text-neutral-300">{currentMineName}</span>
          </div>

          <div>
            <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">{t('leaseTime')}</label>
            <input
              type="number"
              min="1"
              value={leaseValue}
              onChange={(e) => setLeaseValue(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-850 px-3 py-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder={t('enterTime')}
            />
          </div>

          <div>
            <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">{t('timeUnit')}</label>
            <div className="grid grid-cols-3 gap-2">
              {(['seconds', 'minutes', 'hours'] as TimeUnit[]).map((unit) => (
                <button
                  key={unit}
                  onClick={() => setLeaseUnit(unit)}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                    leaseUnit === unit
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-300 dark:hover:bg-neutral-700'
                  }`}
                >
                  {t(unit)}
                </button>
              ))}
            </div>
          </div>

          {!meetsMin && (
            <div className="text-xs text-error-500 bg-error-500/10 rounded-lg px-3 py-2">
              {t('minTimeWarning')} ({seconds}s / {MIN_LEASE_SECONDS}s)
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850/50">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="w-3.5 h-3.5 text-primary-500" />
                <span className="text-[10px] font-semibold uppercase text-neutral-500">{t('activeLease')}</span>
              </div>
              <div className="text-xs text-neutral-400 mb-0.5">{formatMoney(activePricePerSec)}/{t('secs')}</div>
              <div className="text-sm font-bold text-primary-500">{formatMoney(activeCost)}</div>
              {activeLeaseMult > 1 && <div className="text-[10px] text-success-500">×{activeLeaseMult} = {Math.floor(seconds * activeLeaseMult)}s</div>}
            </div>
            <div className="rounded-xl p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850/50">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-accent-500" />
                <span className="text-[10px] font-semibold uppercase text-neutral-500">{t('autoMining')}</span>
              </div>
              <div className="text-xs text-neutral-400 mb-0.5">{formatMoney(autoPricePerSec)}/{t('secs')}</div>
              <div className="text-sm font-bold text-accent-500">{formatMoney(autoCost)}</div>
              {autoLeaseMult > 1 && <div className="text-[10px] text-success-500">×{autoLeaseMult} = {Math.floor(seconds * autoLeaseMult)}s</div>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => buyActiveLease(parseFloat(leaseValue) || 0, leaseUnit)}
              disabled={!meetsMin || state.balance < activeCost}
              className="btn-primary py-2.5 text-sm"
            >
              <Zap className="w-4 h-4 inline mr-1.5" />
              {t('buyActiveLease')}
            </button>
            <button
              onClick={() => buyAutoLease(parseFloat(leaseValue) || 0, leaseUnit)}
              disabled={!meetsMin || state.balance < autoCost}
              className="btn-accent py-2.5 text-sm"
            >
              <Clock className="w-4 h-4 inline mr-1.5" />
              {t('buyAutoLease')}
            </button>
          </div>

          <div className="text-xs text-neutral-400 space-y-0.5">
            <p>· {t('activeLeaseDesc')}</p>
            <p>· {t('autoLeaseDesc')}</p>
          </div>
        </div>
      </div>

      {/* Pickaxe shop */}
      <div ref={pickaxesRef} className="card p-4 scroll-mt-4">
        <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-3 flex items-center gap-2">
          <Hammer className="w-5 h-5 text-primary-500" />
          {t('shopEquipment')}
        </h2>
        <div className="space-y-2">
          {PICKAXE_TIERS.map((tier) => {
            const name = lang === 'ru' ? tier.nameRu : (lang === 'uk' ? tier.nameUk : tier.nameEn);
            const isEquipped = state.activePickaxeTierId === tier.id;
            const meetsLevel = state.level >= tier.requiredLevel;
            const canAfford = state.balance >= tier.price;
            const isOwned = state.ownedPickaxes?.includes(tier.id);

            return (
              <div
                key={tier.id}
                className={`rounded-xl p-3 border bg-neutral-50 dark:bg-neutral-850/50 border-neutral-200 dark:border-neutral-800 ${
                  isEquipped ? 'ring-1 ring-primary-500/30' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: tier.color + '20' }}
                    >
                      <Hammer className="w-4.5 h-4.5" style={{ color: tier.color }} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                        {name}
                        {isEquipped && <span className="text-[10px] text-primary-500 bg-primary-500/10 px-1.5 py-0.5 rounded">{t('equipped')}</span>}
                        {isOwned && !isEquipped && <span className="text-[10px] text-success-500 bg-success-500/10 px-1.5 py-0.5 rounded">{t('owned')}</span>}
                      </div>
                      <div className="text-xs text-neutral-400">
                        ×{tier.yieldMultiplier} {t('yield')} · {tier.energyCost} {t('energyCost')} · {tier.durabilityCost} {t('durabilityCost')} · {tier.maxDurability} {t('maxDurability')}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs">
                    {tier.requiredLevel > 1 && !isOwned && (
                      <span className={meetsLevel ? 'text-neutral-400' : 'text-error-500'}>
                        {t('requiresLevel')} {tier.requiredLevel}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => (isOwned ? equipPickaxe(tier.id) : buyPickaxe(tier.id))}
                    disabled={isEquipped || (!isOwned && (!meetsLevel || !canAfford))}
                    className={
                      isEquipped
                        ? 'btn-ghost px-4 py-1.5 text-xs'
                        : isOwned
                        ? 'btn-success px-4 py-1.5 text-xs'
                        : !meetsLevel
                        ? 'btn-error px-4 py-1.5 text-xs opacity-50'
                        : 'btn-primary px-4 py-1.5 text-xs'
                    }
                  >
                    {isEquipped
                      ? t('equipped')
                      : isOwned
                      ? t('switchToPickaxe')
                      : !meetsLevel
                      ? `${t('requiresLevel')} ${tier.requiredLevel}`
                      : formatMoney(tier.price)}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {state.sparePickaxes.length > 0 && (
          <div className="mt-3">
            <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 flex items-center gap-1.5">
              <ArrowLeftRight className="w-3.5 h-3.5" />
              {t('sparePickaxes')} ({state.sparePickaxes.length})
            </div>
            <div className="space-y-1.5">
              {state.sparePickaxes.map((px) => {
                const pxTier = getPickaxeTier(px.pickaxeTierId);
                const pxName = lang === 'ru' ? pxTier.nameRu : (lang === 'uk' ? pxTier.nameUk : pxTier.nameEn);
                return (
                  <div
                    key={px.id}
                    className="flex items-center justify-between rounded-lg p-2 bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700"
                  >
                    <div className="flex items-center gap-2">
                      <Hammer className="w-3.5 h-3.5" style={{ color: pxTier.color }} />
                      <div>
                        <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{pxName}</div>
                        <div className="text-[10px] text-neutral-400">{px.durability}/{px.maxDurability} {t('durability')}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => switchPickaxe(px.id)}
                      className="btn-ghost px-3 py-1 text-xs flex items-center gap-1"
                    >
                      <ArrowLeftRight className="w-3 h-3" />
                      {t('switchToPickaxe')}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Food shop */}
      <div ref={foodRef} className="card p-4 scroll-mt-4">
        <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-3 flex items-center gap-2">
          <Battery className="w-5 h-5 text-accent-500" />
          {t('shopFood')}
        </h2>
        <div className="space-y-2">
          {FOOD_ITEMS.map((food) => {
            const Icon = foodIcons[food.id] || Candy;
            const name = lang === 'ru' ? food.nameRu : (lang === 'uk' ? food.nameUk : food.nameEn);
            const activeBuff = state.buffs.find((b) => b.id === food.id && b.expiresAt > Date.now());
            const buffRemaining = activeBuff ? Math.ceil((activeBuff.expiresAt - Date.now()) / 1000) : 0;
            const foodPrice = getFoodPrice(food, currentMineId);

            return (
              <div
                key={food.id}
                className="flex items-center justify-between rounded-xl p-3 bg-neutral-50 dark:bg-neutral-850/50 border border-neutral-200 dark:border-neutral-800"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: food.color + '20' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: food.color }} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{name}</div>
                    <div className="text-xs text-neutral-400">
                      {food.energyBoost > 0 && <span>+{food.energyBoost} {t('energy')} </span>}
                      {food.regenMultiplier > 1 && (
                        <span>+{food.regenMultiplier}× {t('regenRate')} ({food.buffDuration}s)</span>
                      )}
                    </div>
                    {activeBuff && (
                      <div className="text-[10px] text-accent-500 font-semibold mt-0.5">
                        {t('buffActive')}: {formatTime(buffRemaining)}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => buyFood(food.id)}
                  disabled={state.balance < foodPrice}
                  className="btn-primary px-3 py-1.5 text-xs whitespace-nowrap"
                >
                  {formatMoney(foodPrice)}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Market */}
      <div className="card p-4">
        <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-success-500" />
          {t('shopMarket')}
          {totalItemEffects.sellMultBonus > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-success-500/20 text-success-500">
              {lang === 'ru' ? `Множитель продажи: x${(1 + totalItemEffects.sellMultBonus).toFixed(2)}` : (lang === 'uk' ? `Множник продажу: x${(1 + totalItemEffects.sellMultBonus).toFixed(2)}` : `Sell multiplier: x${(1 + totalItemEffects.sellMultBonus).toFixed(2)}`)}
            </span>
          )}
        </h2>

        <div className="space-y-2 mb-3">
          {RESOURCE_LIST.map((res) => {
            const entry = state.inventory[res.type];
            const name = lang === 'ru' ? res.nameRu : (lang === 'uk' ? res.nameUk : res.nameEn);
            const value = entry.mass * res.pricePerKg;
            const canSell = entry.mass > 0;

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
                    <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{name}</div>
                    <div className="text-xs text-neutral-400">
                      {t('youHave')}: {entry.mass.toFixed(2)} {t('kg')} · {formatMoney(res.pricePerKg)}/{t('kg')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-success-500">{formatMoney(value)}</span>
                  <button
                    onClick={() => sellResource(res.type as ResourceType)}
                    disabled={!canSell}
                    className="btn-success px-3 py-1.5 text-xs"
                  >
                    <Coins className="w-3.5 h-3.5 inline mr-1" />
                    {t('sellResource')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {!hasResources && (
          <p className="text-xs text-neutral-400 text-center py-2">{t('noResources')}</p>
        )}

        <button onClick={sellAll} disabled={!hasResources} className="btn-success w-full py-2.5 text-sm">
          <TrendingUp className="w-4 h-4 inline mr-1.5" />
          {t('sellAll')}
        </button>
      </div>

      {/* Lease replacement confirmation modal */}
      {pendingLeasePurchase && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={cancelLeasePurchase}
        >
          <div
            className="card w-full max-w-sm p-5 animate-drop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-warning-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-warning-500" />
              </div>
              <h2 className="text-base font-bold text-neutral-800 dark:text-neutral-100">
                {t('leaseReplaceTitle')}
              </h2>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-5">
              {t('leaseReplaceMsg')}
            </p>
            <div className="flex gap-2">
              <button
                onClick={cancelLeasePurchase}
                className="btn-ghost flex-1 py-2.5 text-sm"
              >
                {t('cancel')}
              </button>
              <button
                onClick={confirmLeasePurchase}
                className="btn-primary flex-1 py-2.5 text-sm"
              >
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
