import { Gem, Lock, Check, X, Pickaxe } from 'lucide-react';
import { createPortal } from 'react-dom';
import { gemsForLevel, LEVEL_MILESTONES, getMilestoneName } from '@/config/levelUnlocks';
import { xpForLevel } from '@/config/upgradesConfig';
import type { Lang } from '@/types';

interface LevelRoadmapModalProps {
  currentLevel: number;
  xp: number;
  lang: Lang;
  onClose: () => void;
}

export default function LevelRoadmapModal({ currentLevel, xp, lang, onClose }: LevelRoadmapModalProps) {
  const tr = (ru: string, uk: string, en: string) => lang === 'ru' ? ru : (lang === 'uk' ? uk : en);

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md card p-5 animate-drop-in max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-md shadow-primary-500/20">
            <Pickaxe className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-800 dark:text-neutral-100">
              {tr('Дорожня карта рівнів', 'Дорожня карта рівнів', 'Level Roadmap')}
            </h2>
            <p className="text-xs text-neutral-400">
              {tr('Відкриття за рівнями', 'Відкриття за рівнями', 'Milestone unlocks')}
            </p>
          </div>
        </div>

        <div
          className="space-y-2 overflow-y-auto pr-1 flex-1"
          style={{ maxHeight: '80vh' }}
        >
          {LEVEL_MILESTONES.map((milestone) => {
            const reached = currentLevel >= milestone.level;
            const unlockName = getMilestoneName(milestone, lang);
            const gems = gemsForLevel(milestone.level);
            const xpNeeded = xpForLevel(milestone.level);

            return (
              <div
                key={milestone.level}
                className={`rounded-xl p-3 border transition-all ${
                  reached
                    ? 'bg-success-500/5 border-success-500/20'
                    : 'bg-neutral-50 dark:bg-neutral-850/50 border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      reached
                        ? 'bg-success-500/20'
                        : 'bg-neutral-200 dark:bg-neutral-800'
                    }`}
                  >
                    {reached ? (
                      <Check className="w-4 h-4 text-success-500" />
                    ) : (
                      <Lock className="w-4 h-4 text-neutral-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
                        {tr('Рівень', 'Рівень', 'Level')} {milestone.level}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {xpNeeded.toLocaleString()} XP
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      {unlockName}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Gem className="w-3.5 h-3.5 text-accent-500" />
                    <span className="text-xs font-bold text-accent-500">+{gems}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 text-center text-xs text-neutral-400">
          {tr('Ваш рівень', 'Ваш рівень', 'Your level')}: <span className="font-bold text-primary-500">{currentLevel}</span>
          {' · '}
          {xp.toLocaleString()} / {xpForLevel(currentLevel).toLocaleString()} XP
        </div>
      </div>
    </div>,
    document.body
  );
}
