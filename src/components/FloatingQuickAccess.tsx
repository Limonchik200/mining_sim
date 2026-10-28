import { useState, useEffect, useRef } from 'react';
import { useGame } from '@/context/GameContext';
import { ShoppingBag, Package, Zap, ScrollText, Lock } from 'lucide-react';
import { questComplete, allQuestsClaimed, DAILY_LEVEL_REQUIRED, WEEKLY_LEVEL_REQUIRED } from '@/features/quests/questData';
import QuestModal from '@/components/QuestModal';

export default function FloatingQuickAccess() {
  const { state, setItemsOpen, collectBasket, t, lang } = useGame();
  const [expanded, setExpanded] = useState(false);
  const [questsOpen, setQuestsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!expanded) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [expanded]);

  const basketCount = state.autoBasket.length + state.autoBasketCases.length;
  const itemsUnlocked = state.level >= 5;
  const hasItems = itemsUnlocked && (state.ownedItems.length > 0 || state.itemBags > 0);

  const questsUnlocked = state.level >= DAILY_LEVEL_REQUIRED || state.level >= WEEKLY_LEVEL_REQUIRED;
  const questReadyCount = (() => {
    if (!state.quests || !questsUnlocked) return 0;
    let count = 0;
    if (state.level >= DAILY_LEVEL_REQUIRED) {
      count += state.quests.daily.quests.filter((q) => questComplete(state.stats, q) && !q.claimed).length;
      if (allQuestsClaimed(state.stats, state.quests.daily.quests) && !state.quests.daily.allClaimedRewardClaimed) count += 1;
    }
    if (state.level >= WEEKLY_LEVEL_REQUIRED) {
      count += state.quests.weekly.quests.filter((q) => questComplete(state.stats, q) && !q.claimed).length;
      if (allQuestsClaimed(state.stats, state.quests.weekly.quests) && !state.quests.weekly.allClaimedRewardClaimed) count += 1;
    }
    return count;
  })();

  return (
    <div ref={containerRef} className="fixed left-3 z-50 flex flex-col items-start gap-2" style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}>
      {expanded && (
        <>
          {(
            <button
              onClick={() => {
                setQuestsOpen(true);
                setExpanded(false);
              }}
              className={`flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full shadow-lg border transition-all duration-200 hover:scale-105 active:scale-95 ${
                questsUnlocked
                  ? 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                  : 'bg-neutral-100 dark:bg-neutral-850 border-neutral-200 dark:border-neutral-800 opacity-60'
                }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${questsUnlocked ? 'bg-warning-500/15' : 'bg-neutral-300/30 dark:bg-neutral-700/30'}`}>
                {questsUnlocked ? (
                  <ScrollText className="w-4 h-4 text-warning-500" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-neutral-400" />
                )}
              </div>
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200">
                {lang === 'ru' ? 'Задания' : (lang === 'uk' ? 'Завдання' : 'Quests')}
              </span>
              {!questsUnlocked && (
                <span className="text-[9px] font-bold text-neutral-400">
                  {lang === 'ru' ? '6 ур.' : (lang === 'uk' ? '6 р.' : 'Lv.6')}
                </span>
              )}
              {questReadyCount > 0 && (
                <span className="text-[10px] font-bold text-white bg-error-500 px-1.5 py-0.5 rounded-md animate-bounce">
                  {questReadyCount}
                </span>
              )}
            </button>
          )}
          {basketCount > 0 && (
            <button
              onClick={() => {
                collectBasket();
                setExpanded(false);
              }}
              className="flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full bg-white dark:bg-neutral-800 shadow-lg border border-neutral-200 dark:border-neutral-700 hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-full bg-success-500/15 flex items-center justify-center">
                <Package className="w-4 h-4 text-success-500" />
              </div>
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200">
                {lang === 'ru' ? 'Собрать' : (lang === 'uk' ? 'Зібрати' : 'Collect')}
              </span>
              <span className="text-[10px] font-bold text-success-500 bg-success-500/10 px-1.5 py-0.5 rounded-md">
                {basketCount}
              </span>
            </button>
          )}
          {hasItems && (
            <button
              onClick={() => {
                setItemsOpen(true);
                setExpanded(false);
              }}
              className="flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full bg-white dark:bg-neutral-800 shadow-lg border border-neutral-200 dark:border-neutral-700 hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-full bg-warning-500/15 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-warning-500" />
              </div>
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200">
                {t('itemsTitle')}
              </span>
              {state.itemBags > 0 && (
                <span className="text-[10px] font-bold text-warning-500 bg-warning-500/10 px-1.5 py-0.5 rounded-md">
                  {state.itemBags}
                </span>
              )}
            </button>
          )}
        </>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all duration-200 relative ${
          expanded
            ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
            : questReadyCount > 0
            ? 'bg-warning-500 text-white animate-pulse-glow'
            : basketCount > 0
            ? 'bg-success-500 text-white animate-pulse-glow'
            : 'bg-warning-500 text-white hover:bg-warning-600'
        }`}
        style={{ touchAction: 'manipulation' }}
      >
        {questReadyCount > 0 && !expanded ? (
          <div className="relative">
            <Zap className="w-5 h-5" />
            <span className="absolute -top-2 -right-2 min-w-4 h-4 px-1 rounded-full bg-error-500 text-white text-[8px] font-bold flex items-center justify-center">
              {questReadyCount > 9 ? '9+' : questReadyCount}
            </span>
          </div>
        ) : basketCount > 0 && !expanded ? (
          <div className="relative">
            <Package className="w-5 h-5" />
            <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-error-500 text-white text-[8px] font-bold flex items-center justify-center">
              {basketCount > 9 ? '9+' : basketCount}
            </span>
          </div>
        ) : expanded ? (
          <ScrollText className="w-5 h-5 transition-transform duration-200" />
        ) : (
          <Zap className="w-5 h-5" />
        )}
      </button>

      {questsOpen && <QuestModal onClose={() => setQuestsOpen(false)} />}
    </div>
  );
}
