import { useState, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { DAILY_REWARDS } from '@/config/rewardsConfig';
import { formatTime } from '@/config';
import { Calendar, Check, Lock, Gift, Clock } from 'lucide-react';

export default function DailyCalendar() {
  const { state, claimDailyReward, t, lang } = useGame();
  const [, force] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const dc = state.dailyCalendar || { lastClaimDay: 0, lastClaimTimestamp: null };
  const now = Date.now();
  const nextDay = dc.lastClaimDay + 1;
  const canClaim = nextDay <= DAILY_REWARDS.length &&
    (!dc.lastClaimTimestamp || now - dc.lastClaimTimestamp >= 20 * 3600 * 1000);

  const timeUntilCanClaim = dc.lastClaimTimestamp
    ? Math.max(0, 20 * 3600 * 1000 - (now - dc.lastClaimTimestamp))
    : 0;
  const secondsUntilClaim = Math.floor(timeUntilCanClaim / 1000);

  const cycleComplete = dc.lastClaimDay >= DAILY_REWARDS.length;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-accent-500" />
          {t('dailyCalendar')}
        </h3>
        {!canClaim && !cycleComplete && timeUntilCanClaim > 0 && (
          <span className="text-xs text-neutral-400 flex items-center gap-1 tabular-nums">
            <Clock className="w-3.5 h-3.5" />
            {t('nextRewardIn')} {formatTime(secondsUntilClaim)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-3">
        {DAILY_REWARDS.map((reward, idx) => {
          const dayNum = idx + 1;
          const isClaimed = dayNum <= dc.lastClaimDay;
          const isNext = dayNum === nextDay && canClaim;
          const isLocked = dayNum > nextDay;

          return (
            <div
              key={idx}
              className={`rounded-xl p-2 text-center border transition-all ${
                isClaimed
                  ? 'bg-neutral-100 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700/50 opacity-50'
                  : isNext
                  ? 'bg-accent-500/10 border-accent-500/50 ring-1 ring-accent-500/30'
                  : 'bg-neutral-50 dark:bg-neutral-850/30 border-neutral-200 dark:border-neutral-800 opacity-60'
              }`}
            >
              <div className={`text-[10px] font-bold mb-0.5 ${isClaimed ? 'text-neutral-400' : isNext ? 'text-accent-500' : 'text-neutral-400'}`}>
                {lang === 'uk' ? `День ${dayNum}` : `Day ${dayNum}`}
              </div>
              <div className="flex items-center justify-center">
                {isClaimed ? (
                  <Check className="w-3.5 h-3.5 text-neutral-400" />
                ) : isLocked ? (
                  <Lock className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600" />
                ) : (
                  <Gift className={`w-3.5 h-3.5 ${isNext ? 'text-accent-500' : 'text-neutral-400'}`} />
                )}
              </div>
              <div className={`text-[10px] font-bold mt-0.5 ${isClaimed ? 'text-neutral-400' : isNext ? 'text-accent-500' : 'text-neutral-400'}`}>
                ${reward}
              </div>
            </div>
          );
        })}
      </div>

      {cycleComplete ? (
        <div className="text-center text-xs text-neutral-400 py-2">
          {lang === 'uk' ? 'Усі нагороди отримано! Оновлення завтра.' : 'All rewards claimed! Resets tomorrow.'}
        </div>
      ) : (
        <button
          onClick={claimDailyReward}
          disabled={!canClaim}
          className="btn-primary w-full py-2 text-sm disabled:opacity-50"
        >
          {canClaim ? t('claimReward') : `${t('locked')} ${formatTime(secondsUntilClaim)}`}
        </button>
      )}
    </div>
  );
}
