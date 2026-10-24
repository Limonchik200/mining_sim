import { Gem, Sparkles, X, Hammer } from 'lucide-react';
import { gemsForLevel, getMilestoneForLevel, getMilestoneName } from '@/config/levelUnlocks';
import { PICKAXE_TIERS } from '@/config/pickaxesConfig';
import { isItemUnlocked } from '@/config/levelUnlocks';
import type { Lang } from '@/types';
import { OXYGEN_TANK_CONFIGS } from '@/config/oxygenConfig';
import { BATTERY_CONFIGS } from '@/config/batteryConfig';
import { COOLER_CONFIGS } from '@/config/coolerConfig';

interface LevelUpModalProps {
  level: number;
  lang: Lang;
  onClose: () => void;
}

function getUnlockedPickaxes(level: number, lang: Lang): string[] {
  const result: string[] = [];
  for (const tier of PICKAXE_TIERS) {
    if (tier.id !== 'shovel' && tier.requiredLevel === level) {
      result.push(lang === 'ru' ? tier.nameRu : (lang === 'uk' ? tier.nameUk : tier.nameEn));
    }
  }
  return result;
}

function getUnlockedEquipment(level: number, lang: Lang): string[] {
  const result: string[] = [];
  const tr = (ru: string, uk: string, en: string) => lang === 'ru' ? ru : (lang === 'uk' ? uk : en);

  for (const type of Object.keys(OXYGEN_TANK_CONFIGS)) {
    if (isItemUnlocked(type, level) && !isItemUnlocked(type, level - 1)) {
      const cfg = OXYGEN_TANK_CONFIGS[type as keyof typeof OXYGEN_TANK_CONFIGS];
      result.push(tr(cfg.nameRu, cfg.nameUk, cfg.nameEn));
    }
  }
  for (const type of Object.keys(BATTERY_CONFIGS)) {
    if (isItemUnlocked(type, level) && !isItemUnlocked(type, level - 1)) {
      const cfg = BATTERY_CONFIGS[type as keyof typeof BATTERY_CONFIGS];
      result.push(tr(cfg.nameRu, cfg.nameUk, cfg.nameEn));
    }
  }
  for (const type of Object.keys(COOLER_CONFIGS)) {
    if (isItemUnlocked(type, level) && !isItemUnlocked(type, level - 1)) {
      const cfg = COOLER_CONFIGS[type as keyof typeof COOLER_CONFIGS];
      result.push(tr(cfg.nameRu, cfg.nameUk, cfg.nameEn));
    }
  }
  return result;
}

export default function LevelUpModal({ level, lang, onClose }: LevelUpModalProps) {
  const gems = gemsForLevel(level);
  const milestone = getMilestoneForLevel(level);
  const unlockName = getMilestoneName(milestone, lang);

  const tr = (ru: string, uk: string, en: string) => lang === 'ru' ? ru : (lang === 'uk' ? uk : en);

  const newPickaxes = getUnlockedPickaxes(level, lang);
  const newEquipment = getUnlockedEquipment(level, lang);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm card p-6 text-center animate-drop-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30 animate-bounce-gentle">
          <Sparkles className="w-8 h-8 text-white" />
        </div>

        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-1">
          {tr('Уровень повышен!', 'Рівень підвищено!', 'Level Up!')}
        </h2>

        <div className="flex items-center justify-center gap-1.5 mb-1">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {tr('Уровень', 'Рівень', 'Level')}
          </span>
          <span className="text-lg font-bold text-primary-500">{level}</span>
        </div>

        <div className="flex items-center justify-center gap-1.5 mb-3">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {tr('Награда:', 'Нагорода:', 'Reward:')}
          </span>
          <Gem className="w-4 h-4 text-accent-500" />
          <span className="text-base font-bold text-accent-500">+{gems}</span>
        </div>

        {unlockName && (
          <div className="rounded-xl px-3 py-2 bg-success-500/10 border border-success-500/20 mb-3">
            <span className="text-xs font-semibold text-success-500">
              {tr('Открыто:', 'Відкрито:', 'Unlocked:')} {unlockName}
            </span>
          </div>
        )}

        {newPickaxes.length > 0 && (
          <div className="rounded-xl px-3 py-2 bg-primary-500/10 border border-primary-500/20 mb-3">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Hammer className="w-4 h-4 text-primary-500" />
              <span className="text-xs font-bold text-primary-500">
                {tr('Новая кирка!', 'Нова кирка!', 'New pickaxe!')}
              </span>
            </div>
            {newPickaxes.map((name, i) => (
              <div key={i} className="text-sm font-bold text-primary-500">{name}</div>
            ))}
          </div>
        )}

        {newEquipment.length > 0 && (
          <div className="rounded-xl px-3 py-2 bg-accent-500/10 border border-accent-500/20 mb-3">
            <span className="text-xs font-semibold text-accent-500">
              {tr('Новое снаряжение:', 'Нове спорядження:', 'New gear:')}
            </span>
            <div className="mt-1 flex flex-wrap gap-1.5 justify-center">
              {newEquipment.map((name, i) => (
                <span key={i} className="text-xs font-bold text-accent-500 bg-accent-500/10 px-2 py-0.5 rounded-md">{name}</span>
              ))}
            </div>
          </div>
        )}

        <button onClick={onClose} className="btn-primary w-full py-2.5 text-sm">
          {tr('Продолжить', 'Продовжити', 'Continue')}
        </button>
      </div>
    </div>
  );
}
