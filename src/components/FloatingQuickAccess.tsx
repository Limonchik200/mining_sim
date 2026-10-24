import { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { ShoppingBag, Package, Zap } from 'lucide-react';

export default function FloatingQuickAccess() {
  const { state, setItemsOpen, collectBasket, t, lang } = useGame();
  const [expanded, setExpanded] = useState(false);

  const basketCount = state.autoBasket.length + state.autoBasketCases.length;
  const itemsUnlocked = state.level >= 5;
  const hasItems = itemsUnlocked && (state.ownedItems.length > 0 || state.itemBags > 0);

  return (
    <div className="fixed left-3 z-50 flex flex-col items-start gap-2" style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}>
      {expanded && (
        <>
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
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all duration-200 ${
          expanded
            ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
            : basketCount > 0
            ? 'bg-success-500 text-white animate-pulse-glow'
            : 'bg-primary-500 text-white hover:bg-primary-600'
        }`}
        style={{ touchAction: 'manipulation' }}
      >
        {basketCount > 0 && !expanded ? (
          <div className="relative">
            <Package className="w-5 h-5" />
            <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-error-500 text-white text-[8px] font-bold flex items-center justify-center">
              {basketCount > 9 ? '9+' : basketCount}
            </span>
          </div>
        ) : (
          <Zap className={`w-5 h-5 transition-transform duration-200 ${expanded ? 'rotate-45' : ''}`} />
        )}
      </button>
    </div>
  );
}
