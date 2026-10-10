import { useState, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { formatMoney, formatTime } from '@/config';
import { EXPEDITION_TIERS, MATERIALS_CONFIG } from '@/config/expeditions';
import type { GeneratedExpedition } from '@/config/expeditions';
import { CASE_RARITIES } from '@/config/casesConfig';
import type { Lang } from '@/types';
import {
  Compass,
  Clock,
  Coins,
  Gem,
  Package,
  Gift,
  Lock,
  Play,
  CheckCircle2,
  Timer,
  RefreshCw,
  Star,
} from 'lucide-react';

const TIER_COLORS: Record<number, string> = {
  1: '#22c55e',
  2: '#3b82f6',
  3: '#a855f7',
  4: '#f59e0b',
  5: '#ef4444',
};

function formatDuration(seconds: number, lang: Lang): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const hLabel = lang === 'ru' ? 'ч' : (lang === 'uk' ? 'г' : 'h');
  const mLabel = lang === 'ru' ? 'м' : (lang === 'uk' ? 'хв' : 'm');
  if (h > 0) return `${h}${hLabel} ${m}${mLabel}`;
  return `${m}${mLabel}`;
}

function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  return now;
}

function ExpeditionCard({
  expedition,
  status,
  now,
  onStart,
  onClaim,
  t,
  lang,
}: {
  expedition: GeneratedExpedition;
  status: 'available' | 'active' | 'completed';
  now: number;
  onStart: () => void;
  onClaim: () => void;
  t: (k: any) => string;
  lang: Lang;
}) {
  const tierConfig = EXPEDITION_TIERS[expedition.tier];
  const tierColor = TIER_COLORS[expedition.tier] || '#22c55e';
  const tierName = lang === 'ru' ? `Тир ${expedition.tier}` : (lang === 'uk' ? `Тір ${expedition.tier}` : `Tier ${expedition.tier}`);

  const remainingMs = expedition.completedAt ? expedition.completedAt - now : 0;
  const isCompleted = status === 'completed';
  const elapsedPct =
    expedition.startTime && expedition.completedAt
      ? Math.min(100, ((now - expedition.startTime) / (expedition.completedAt - expedition.startTime)) * 100)
      : 0;

  return (
    <div
      className="rounded-2xl p-4 border-2 transition-all animate-drop-in"
      style={{
        borderColor: tierColor + (isCompleted ? '' : '40'),
        backgroundColor: tierColor + '08',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: tierColor + '20' }}
          >
            <Compass className="w-5 h-5" style={{ color: tierColor }} />
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: tierColor }}>
              {tierName}
            </div>
            <div className="text-[10px] text-neutral-400 flex items-center gap-1">
              <Star className="w-3 h-3" />
              {t('expeditionsLevel')} {tierConfig.requiredPlayerLevel}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-neutral-400 uppercase flex items-center gap-1 justify-end">
            <Clock className="w-3 h-3" />
            {t('expeditionsDuration')}
          </div>
          <div className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
            {formatDuration(expedition.durationSeconds, lang)}
          </div>
        </div>
      </div>

      {/* Progress bar for active expeditions */}
      {status === 'active' && !isCompleted && (
        <div className="mb-3">
          <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${elapsedPct}%`,
                backgroundColor: tierColor,
              }}
            />
          </div>
          <div className="text-center text-xs font-semibold mt-1" style={{ color: tierColor }}>
            <Timer className="w-3.5 h-3.5 inline mr-1" />
            {formatTime(Math.max(0, Math.ceil(remainingMs / 1000)))}
          </div>
        </div>
      )}

      {/* Rewards */}
      <div className="space-y-2 mb-3">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400 flex items-center gap-1">
          <Gift className="w-3 h-3" />
          {t('expeditionsRewards')}
        </div>
        <div className="flex flex-wrap gap-2">
          {expedition.cashReward > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg bg-success-500/10 px-2.5 py-1.5">
              <Coins className="w-4 h-4 text-success-500" />
              <span className="text-xs font-bold text-success-500">{formatMoney(expedition.cashReward)}</span>
            </div>
          )}
          {expedition.diamondReward > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg bg-accent-500/10 px-2.5 py-1.5">
              <Gem className="w-4 h-4 text-accent-500" />
              <span className="text-xs font-bold text-accent-500">{expedition.diamondReward}</span>
            </div>
          )}
          {expedition.materialsReward.map((mat, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1.5"
            >
              <span className="text-sm">{MATERIALS_CONFIG[mat.materialId]?.icon}</span>
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                {mat.amount}x {lang === 'ru' ? mat.nameRu : (lang === 'uk' ? mat.name : mat.nameEn)}
              </span>
            </div>
          ))}
        </div>

        {/* Case chances */}
        {expedition.caseChances.length > 0 && (
          <div className="pt-1">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400 flex items-center gap-1 mb-1">
              <Package className="w-3 h-3" />
              {t('expeditionsCaseChances')}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {expedition.caseChances.map((cc, i) => {
                const rarity = CASE_RARITIES[cc.caseType];
                const name = lang === 'ru' ? rarity.nameRu : (lang === 'uk' ? rarity.nameUk : rarity.nameEn);
                return (
                  <div
                    key={i}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold"
                    style={{
                      backgroundColor: rarity.color + '15',
                      color: rarity.color,
                    }}
                  >
                    {cc.chance}% {name}
                    {cc.maxAmount > cc.minAmount && ` (${cc.minAmount}-${cc.maxAmount})`}
                    {cc.maxAmount === cc.minAmount && cc.maxAmount > 1 && ` x${cc.maxAmount}`}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Action button */}
      {status === 'available' && (
        <button
          onClick={onStart}
          className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-1.5"
          style={{ backgroundColor: tierColor, boxShadow: `0 4px 14px ${tierColor}40` }}
        >
          <Play className="w-4 h-4" />
          {t('expeditionsStart')}
        </button>
      )}

      {status === 'active' && !isCompleted && (
        <div
          className="w-full py-2.5 text-sm font-semibold text-center rounded-xl flex items-center justify-center gap-1.5"
          style={{ backgroundColor: tierColor + '15', color: tierColor }}
        >
          <Clock className="w-4 h-4" />
          {t('expeditionsActive')}
        </div>
      )}

      {isCompleted && (
        <button
          onClick={onClaim}
          className="btn-success w-full py-2.5 text-sm flex items-center justify-center gap-1.5 animate-pulse-glow"
        >
          <CheckCircle2 className="w-4 h-4" />
          {t('expeditionsClaim')}
        </button>
      )}
    </div>
  );
}

export default function ExpeditionsTab() {
  const { state, t, lang, startExpedition, claimExpedition, totalItemEffects } = useGame();
  const now = useNow();

  if (state.level < 3) {
    return (
      <div className="space-y-4">
        <div className="card p-6 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
            <Lock className="w-8 h-8 text-neutral-400" />
          </div>
          <h2 className="text-lg font-bold text-neutral-600 dark:text-neutral-400">
            {t('expeditionsTitle')}
          </h2>
          <p className="text-sm text-neutral-400">{t('expeditionsLocked')}</p>
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Star className="w-4 h-4" />
            {t('expeditionsLevel')} {state.level} / 3
          </div>
        </div>
      </div>
    );
  }

  const refreshMs = state.expeditionRefreshAt - now;
  const refreshSec = Math.max(0, Math.ceil(refreshMs / 1000));

  const activeExpeditions = state.activeExpeditions.map((exp) => {
    const isCompleted = exp.completedAt ? now >= exp.completedAt : false;
    return { exp, isCompleted };
  });

  const completedCount = activeExpeditions.filter((e) => e.isCompleted).length;

  return (
    <div className="space-y-4">
      {/* Title header */}
      <div className="card p-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
          <Compass className="w-5 h-5 text-primary-500" />
          {t('expeditionsTitle')}
        </h2>
        <div className="flex flex-col items-end gap-0.5">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <RefreshCw className="w-3.5 h-3.5" />
            {t('expeditionsRefreshIn')}
          </div>
          <div className="text-sm font-bold text-primary-500">{formatTime(refreshSec)}</div>
        </div>
      </div>

      {/* Item buff indicators */}
      {(totalItemEffects.expeditionTimeReductionPct > 0 || totalItemEffects.expeditionRefreshReductionPct > 0 || totalItemEffects.expeditionLootChance > 0) && (
        <div className="flex flex-wrap gap-2">
          {totalItemEffects.expeditionTimeReductionPct > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-success-500/10 text-success-600 dark:text-success-400 flex items-center gap-1">
              {lang === 'ru' ? `Время эксп. -${totalItemEffects.expeditionTimeReductionPct}%` : (lang === 'uk' ? `Час експ. -${totalItemEffects.expeditionTimeReductionPct}%` : `Exped. time -${totalItemEffects.expeditionTimeReductionPct}%`)}
            </span>
          )}
          {totalItemEffects.expeditionRefreshReductionPct > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-success-500/10 text-success-600 dark:text-success-400 flex items-center gap-1">
              {lang === 'ru' ? `Обновление -${totalItemEffects.expeditionRefreshReductionPct}%` : (lang === 'uk' ? `Оновлення -${totalItemEffects.expeditionRefreshReductionPct}%` : `Refresh -${totalItemEffects.expeditionRefreshReductionPct}%`)}
            </span>
          )}
          {totalItemEffects.expeditionLootChance > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-success-500/10 text-success-600 dark:text-success-400 flex items-center gap-1">
              {lang === 'ru' ? `Шанс лута ${Math.round(totalItemEffects.expeditionLootChance * 100)}% x${totalItemEffects.expeditionLootMult}` : (lang === 'uk' ? `Шанс луту ${Math.round(totalItemEffects.expeditionLootChance * 100)}% x${totalItemEffects.expeditionLootMult}` : `Loot chance ${Math.round(totalItemEffects.expeditionLootChance * 100)}% x${totalItemEffects.expeditionLootMult}`)}
            </span>
          )}
        </div>
      )}

      {/* Active expeditions */}
      {activeExpeditions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2 mt-1">
            <Clock className="w-4 h-4 text-primary-500" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
              {t('expeditionsActive')} ({activeExpeditions.length})
            </h3>
            {completedCount > 0 && (
              <span className="text-xs font-bold text-success-500 bg-success-500/10 px-2 py-0.5 rounded-md">
                {completedCount} {t('expeditionsCompleted').toLowerCase()}
              </span>
            )}
            <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
          </div>
          <div className="space-y-3">
            {activeExpeditions.map(({ exp, isCompleted }) => (
              <ExpeditionCard
                key={exp.id}
                expedition={exp}
                status={isCompleted ? 'completed' : 'active'}
                now={now}
                onStart={() => {}}
                onClaim={() => claimExpedition(exp.id)}
                t={t}
                lang={lang}
              />
            ))}
          </div>
        </div>
      )}

      {/* Available expeditions */}
      <div>
        <div className="flex items-center gap-2 mb-2 mt-1">
          <Compass className="w-4 h-4 text-success-500" />
          <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
            {t('expeditionsTitle')} ({state.availableExpeditions.length})
          </h3>
          <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
        </div>
        {state.availableExpeditions.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-sm text-neutral-400">{t('expeditionsNoSlots')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {state.availableExpeditions.map((exp) => (
              <ExpeditionCard
                key={exp.id}
                expedition={exp}
                status="available"
                now={now}
                onStart={() => startExpedition(exp.id)}
                onClaim={() => {}}
                t={t}
                lang={lang}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
