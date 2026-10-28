import { useState, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import {
  questProgress,
  questComplete,
  allQuestsClaimed,
  questLabel,
  nextDailyRefreshMs,
  nextWeeklyRefreshMs,
  DAILY_GEM_REWARD,
  WEEKLY_GEM_REWARD,
  DAILY_ALL_CASE_RARITY,
  WEEKLY_ALL_CASE_RARITY,
  WEEKLY_ALL_CASE_COUNT,
  DAILY_LEVEL_REQUIRED,
  WEEKLY_LEVEL_REQUIRED,
} from '@/features/quests/questData';
import type { QuestKind, ActiveQuest } from '@/features/quests/types';
import type { Lang } from '@/types';
import { X, ScrollText, Calendar, CheckCircle2, Gift, Lock, Gem, Sparkles, AlertCircle } from 'lucide-react';

function formatCountdown(ms: number, lang: Lang): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}${lang === 'ru' ? 'ч' : (lang === 'uk' ? 'год' : 'h')} ${m}${lang === 'ru' ? 'м' : (lang === 'uk' ? 'хв' : 'm')}`;
  }
  if (m > 0) {
    return `${m}${lang === 'ru' ? 'м' : (lang === 'uk' ? 'хв' : 'm')} ${s}${lang === 'ru' ? 'с' : (lang === 'uk' ? 'с' : 's')}`;
  }
  return `${s}${lang === 'ru' ? 'с' : (lang === 'uk' ? 'с' : 's')}`;
}

function QuestRow({
  quest,
  kind,
  lang,
  claimed,
  canClaim,
  onClaim,
}: {
  quest: ActiveQuest;
  kind: QuestKind;
  lang: Lang;
  claimed: boolean;
  canClaim: boolean;
  onClaim: () => void;
}) {
  const { state } = useGame();
  const progress = questProgress(state.stats, quest);
  const pct = Math.min(100, (progress / quest.target) * 100);
  const label = questLabel(quest.id, quest.target, kind, lang);

  return (
    <div
      className={`rounded-2xl p-3 border transition-all ${
        claimed
          ? 'border-success-500/30 bg-success-500/5'
          : canClaim
            ? 'border-warning-500/40 bg-warning-500/5'
            : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850/50'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 flex-1 min-w-0">
          {label}
        </span>
        {claimed ? (
          <span className="text-success-500 text-xs font-bold flex items-center gap-1 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {lang === 'ru' ? 'Готово' : (lang === 'uk' ? 'Готово' : 'Done')}
          </span>
        ) : canClaim ? (
          <span className="text-success-500 text-xs font-bold flex items-center gap-1 shrink-0 animate-pulse">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {lang === 'ru' ? 'Выполнено' : (lang === 'uk' ? 'Виконано' : 'Done')}
          </span>
        ) : (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-warning-500/20 text-warning-600 dark:text-warning-400 shrink-0 flex items-center gap-0.5">
            <Gem className="w-3 h-3" />
            +{kind === 'daily' ? DAILY_GEM_REWARD : WEEKLY_GEM_REWARD}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex-1">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              claimed ? 'bg-success-500' : pct >= 100 ? 'bg-warning-500' : 'bg-gradient-to-r from-accent-400 to-accent-600'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 tabular-nums shrink-0">
          {Math.floor(progress)} / {quest.target}
        </span>
      </div>

      {!claimed && (
        <button
          onClick={onClaim}
          disabled={!canClaim}
          className={`w-full py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 ${
            canClaim
              ? 'bg-warning-500 text-white hover:bg-warning-600'
              : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
          }`}
        >
          {canClaim
            ? (lang === 'ru' ? 'Забрать' : (lang === 'uk' ? 'Забрати' : 'Claim'))
            : (lang === 'ru' ? 'В процессе...' : (lang === 'uk' ? 'В процесі...' : 'In progress...'))}
        </button>
      )}
    </div>
  );
}

export default function QuestModal({ onClose }: { onClose: () => void }) {
  const { state, claimQuest, claimAllQuestsReward, lang } = useGame();
  const [tab, setTab] = useState<QuestKind>('daily');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    const interval = setInterval(() => setTick((n) => n + 1), 1000);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      clearInterval(interval);
    };
  }, [onClose]);

  void tick;

  const quests = state.quests;
  if (!quests) return null;

  const dailyLocked = state.level < DAILY_LEVEL_REQUIRED;
  const weeklyLocked = state.level < WEEKLY_LEVEL_REQUIRED;

  const currentBucket = tab === 'daily' ? quests.daily : quests.weekly;
  const currentLocked = tab === 'daily' ? dailyLocked : weeklyLocked;

  const dailyHasCompleted = !dailyLocked && quests.daily.quests.some((q) => questComplete(state.stats, q) && !q.claimed);
  const weeklyHasCompleted = !weeklyLocked && quests.weekly.quests.some((q) => questComplete(state.stats, q) && !q.claimed);

  const tr = (ru: string, uk: string, en: string) => lang === 'ru' ? ru : (lang === 'uk' ? uk : en);

  const refreshMs = tab === 'daily' ? nextDailyRefreshMs() : nextWeeklyRefreshMs();
  const allDone = allQuestsClaimed(state.stats, currentBucket.quests);
  const allBonusClaimed = currentBucket.allClaimedRewardClaimed;
  const completedCount = currentBucket.quests.filter((q) => questComplete(state.stats, q)).length;

  const allBonusRarity = tab === 'daily' ? DAILY_ALL_CASE_RARITY : WEEKLY_ALL_CASE_RARITY;
  const allBonusCount = tab === 'daily' ? 1 : WEEKLY_ALL_CASE_COUNT;
  const allBonusLabel = allBonusRarity === 'common'
    ? (lang === 'ru' ? 'Обычный кейс' : (lang === 'uk' ? 'Звичайний кейс' : 'Common Case'))
    : (lang === 'ru' ? 'Редкий кейс' : (lang === 'uk' ? 'Рідкісний кейс' : 'Rare Case'));

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-md card rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-drop-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 p-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-warning-400 to-warning-600 flex items-center justify-center shadow-md shadow-warning-500/20 shrink-0">
            <ScrollText className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-neutral-800 dark:text-neutral-100 truncate">
              {tr('Задания', 'Завдання', 'Quests')}
            </h2>
            <p className="text-xs text-neutral-400 truncate flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {tr('Обновление через', 'Оновлення через', 'Refresh in')} {formatCountdown(refreshMs, lang)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-3 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <button
            onClick={() => setTab('daily')}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              tab === 'daily'
                ? 'bg-warning-500 text-white shadow-md shadow-warning-500/20'
                : 'bg-neutral-100 dark:bg-neutral-850 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            {tr('Ежедневные', 'Щоденні', 'Daily')}
            {dailyHasCompleted && (
              <AlertCircle className="w-3.5 h-3.5 text-error-500 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setTab('weekly')}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              tab === 'weekly'
                ? 'bg-accent-500 text-white shadow-md shadow-accent-500/20'
                : 'bg-neutral-100 dark:bg-neutral-850 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            {tr('Еженедельные', 'Щотижневі', 'Weekly')}
            {weeklyHasCompleted && (
              <AlertCircle className="w-3.5 h-3.5 text-error-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 overscroll-contain flex-1">
          {currentLocked ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center mb-3">
                <Lock className="w-7 h-7 text-neutral-400" />
              </div>
              <p className="text-sm font-bold text-neutral-500 mb-1">
                {tr(
                  `Доступно с ${tab === 'daily' ? DAILY_LEVEL_REQUIRED : WEEKLY_LEVEL_REQUIRED} уровня`,
                  `Доступно з ${tab === 'daily' ? DAILY_LEVEL_REQUIRED : WEEKLY_LEVEL_REQUIRED} рівня`,
                  `Unlocks at level ${tab === 'daily' ? DAILY_LEVEL_REQUIRED : WEEKLY_LEVEL_REQUIRED}`
                )}
              </p>
              <p className="text-xs text-neutral-400">
                {tr(
                  `Текущий уровень: ${state.level}`,
                  `Поточний рівень: ${state.level}`,
                  `Current level: ${state.level}`
                )}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2.5 mb-4">
                {(() => {
                  const entries = currentBucket.quests.map((q, i) => ({ q, i, done: questComplete(state.stats, q) }));
                  entries.sort((a, b) => {
                    const aRank = a.done ? 0 : 1;
                    const bRank = b.done ? 0 : 1;
                    return aRank - bRank;
                  });
                  return entries.map(({ q, i, done }) => (
                    <QuestRow
                      key={`${q.id}-${i}`}
                      quest={q}
                      kind={tab}
                      lang={lang}
                      claimed={q.claimed}
                      canClaim={done && !q.claimed}
                      onClaim={() => claimQuest(tab, i)}
                    />
                  ));
                })()}
              </div>

              {/* All-quests bonus */}
              <div
                className={`rounded-2xl p-3 border-2 transition-all ${
                  allBonusClaimed
                    ? 'border-success-500/30 bg-success-500/5'
                    : allDone
                      ? 'border-warning-500/50 bg-gradient-to-br from-warning-500/10 to-accent-500/10 animate-pulse-slow'
                      : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Gift className={`w-5 h-5 ${allBonusClaimed ? 'text-success-500' : 'text-warning-500'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
                      {tr('Бонус за все задания', 'Бонус за всі завдання', 'All-quest bonus')}
                    </div>
                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                      {allBonusLabel} ×{allBonusCount}
                    </div>
                  </div>
                  {allBonusClaimed && (
                    <span className="text-success-500 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {tr('Получено', 'Отримано', 'Claimed')}
                    </span>
                  )}
                </div>

                {!allBonusClaimed && (
                  <button
                    onClick={() => claimAllQuestsReward(tab)}
                    disabled={!allDone}
                    className={`w-full py-2 text-xs font-bold rounded-lg transition-all active:scale-95 ${
                      allDone
                        ? 'bg-gradient-to-r from-warning-500 to-accent-500 text-white hover:shadow-lg'
                        : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                    }`}
                  >
                    {allDone
                      ? (tr('Забрать бонус', 'Забрати бонус', 'Claim bonus'))
                      : (tr(
                          `Выполнено ${completedCount}/${currentBucket.quests.length}`,
                          `Виконано ${completedCount}/${currentBucket.quests.length}`,
                          `Completed ${completedCount}/${currentBucket.quests.length}`
                        ))}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
