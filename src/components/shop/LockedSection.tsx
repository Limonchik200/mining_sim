import { Lock } from 'lucide-react';
import type { Lang } from '@/types';

interface LockedSectionProps {
  requiredLevel: number;
  lang: Lang;
}

export default function LockedSection({ requiredLevel, lang }: LockedSectionProps) {
  const tr = (ru: string, uk: string, en: string) => lang === 'ru' ? ru : (lang === 'uk' ? uk : en);
  return (
    <div className="card p-6 text-center">
      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
        <Lock className="w-6 h-6 text-neutral-400" />
      </div>
      <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
        {tr(
          `Откроется на ${requiredLevel} уровне`,
          `Відкриється на ${requiredLevel} рівні`,
          `Unlocks at level ${requiredLevel}`
        )}
      </p>
    </div>
  );
}
