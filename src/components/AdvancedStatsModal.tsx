import { X, BarChart3 } from 'lucide-react';
import { useEffect } from 'react';
import type { GameStats, Lang } from '@/types';
import { formatMoney } from '@/config';

interface AdvancedStatsModalProps {
  stats: GameStats;
  lang: Lang;
  onClose: () => void;
}

interface StatRow {
  key: keyof GameStats;
  label: { uk: string; en: string; ru: string };
  format?: (v: number) => string;
}

const ROWS: StatRow[] = [
  { key: 'totalClicks', label: { uk: 'Кліки', en: 'Clicks', ru: 'Клики' } },
  { key: 'gemsEarned', label: { uk: 'Зароблено алмазів', en: 'Gems earned', ru: 'Заработано алмазов' }, format: (v) => `${v} 💎` },
  { key: 'casesCommonOpened', label: { uk: 'Звичайні кейси відкрито', en: 'Common cases opened', ru: 'Обычных кейсов открыто' } },
  { key: 'casesRareOpened', label: { uk: 'Рідкісні кейси відкрито', en: 'Rare cases opened', ru: 'Редких кейсов открыто' } },
  { key: 'casesEpicOpened', label: { uk: 'Епічні кейси відкрито', en: 'Epic cases opened', ru: 'Эпических кейсов открыто' } },
  { key: 'casesLegendaryOpened', label: { uk: 'Легендарні кейси відкрито', en: 'Legendary cases opened', ru: 'Легендарных кейсов открыто' } },
  { key: 'casesEnergyOpened', label: { uk: 'Енергетичні кейси відкрито', en: 'Energy cases opened', ru: 'Энергетических кейсов открыто' } },
  { key: 'casesDugCommon', label: { uk: 'Викопано звичайних кейсів', en: 'Common cases dug', ru: 'Выкопано обычных кейсов' } },
  { key: 'casesDugRare', label: { uk: 'Викопано рідкісних кейсів', en: 'Rare cases dug', ru: 'Выкопано редких кейсов' } },
  { key: 'casesDugEpic', label: { uk: 'Викопано епічних кейсів', en: 'Epic cases dug', ru: 'Выкопано эпических кейсов' } },
  { key: 'casesDugLegendary', label: { uk: 'Викопано легендарних кейсів', en: 'Legendary cases dug', ru: 'Выкопано легендарных кейсов' } },
  { key: 'itemBagsOpened', label: { uk: 'Сумок з предметом відкрито', en: 'Item bags opened', ru: 'Сумок с предметом открыто' } },
  { key: 'itemsOwned', label: { uk: 'Наявних предметів', en: 'Items owned', ru: 'Имеющихся предметов' } },
  { key: 'itemsRecycled', label: { uk: 'Утилізованих предметів', en: 'Items recycled', ru: 'Утилизированных предметов' } },
  { key: 'foodSnickersEaten', label: { uk: "З'їджених Snickers", en: 'Snickers eaten', ru: 'Съеденных Snickers' } },
  { key: 'foodJuiceDrunk', label: { uk: 'Випитих соків', en: 'Juices drunk', ru: 'Выпитых соков' } },
  { key: 'foodMilkaEaten', label: { uk: "З'їджених Milka", en: 'Milka eaten', ru: 'Съеденных Milka' } },
  { key: 'oreMinedKg', label: { uk: 'Викопано руди (кг)', en: 'Ore mined (kg)', ru: 'Выкопано руды (кг)' }, format: (v) => `${v.toFixed(2)} кг` },
  { key: 'moneyEarned', label: { uk: 'Зароблено грошей', en: 'Money earned', ru: 'Заработано денег' }, format: (v) => formatMoney(v) },
  { key: 'totalCasesOpened', label: { uk: 'Усього кейсів відкрито', en: 'Total cases opened', ru: 'Всего кейсов открыто' } },
  { key: 'expeditionsTier1', label: { uk: 'Експедицій (Тір 1)', en: 'Expeditions (Tier 1)', ru: 'Экспедиций (Тир 1)' } },
  { key: 'expeditionsTier2', label: { uk: 'Експедицій (Тір 2)', en: 'Expeditions (Tier 2)', ru: 'Экспедиций (Тир 2)' } },
  { key: 'expeditionsTier3', label: { uk: 'Експедицій (Тір 3)', en: 'Expeditions (Tier 3)', ru: 'Экспедиций (Тир 3)' } },
  { key: 'expeditionsTier4', label: { uk: 'Експедицій (Тір 4)', en: 'Expeditions (Tier 4)', ru: 'Экспедиций (Тир 4)' } },
  { key: 'expeditionsTier5', label: { uk: 'Експедицій (Тір 5)', en: 'Expeditions (Tier 5)', ru: 'Экспедиций (Тир 5)' } },
  { key: 'moneySpentUpgrades', label: { uk: 'Грошей на прокачку', en: 'Money spent on upgrades', ru: 'Денег на прокачку' }, format: (v) => formatMoney(v) },
  { key: 'moneySpentRepairs', label: { uk: 'Грошей на лагодження кирки', en: 'Money spent on repairs', ru: 'Денег на ремонт кирки' }, format: (v) => formatMoney(v) },
  { key: 'gemsSpentSpecialOffers', label: { uk: 'Алмазів у спецпропозиціях', en: 'Gems in special offers', ru: 'Алмазов в спецпредложениях' }, format: (v) => `${v} 💎` },
  { key: 'gemsSpentUpgrades', label: { uk: 'Алмазів на прокачку', en: 'Gems on upgrades', ru: 'Алмазов на прокачку' }, format: (v) => `${v} 💎` },
  { key: 'daysPlayed', label: { uk: 'Днів у грі', en: 'Days played', ru: 'Дней в игре' } },
  { key: 'energySpent', label: { uk: 'Витрачено енергії', en: 'Energy spent', ru: 'Потрачено энергии' }, format: (v) => v.toFixed(2) },
  { key: 'oxygenSpent', label: { uk: 'Витрачено кисню', en: 'Oxygen spent', ru: 'Потрачено кислорода' }, format: (v) => v.toFixed(2) },
  { key: 'logsBought', label: { uk: 'Куплено колод', en: 'Logs bought', ru: 'Куплено бревен' } },
  { key: 'planksBought', label: { uk: 'Куплено планок', en: 'Planks bought', ru: 'Куплено планок' } },
  { key: 'specialOffersBought', label: { uk: 'Куплено спецпропозицій', en: 'Special offers bought', ru: 'Куплено спецпредложений' } },
];

export default function AdvancedStatsModal({ stats, lang, onClose }: AdvancedStatsModalProps) {
  const tr = (ru: string, uk: string, en: string) => lang === 'ru' ? ru : (lang === 'uk' ? uk : en);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg card rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-drop-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 p-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center shadow-md shadow-accent-500/20 shrink-0">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-neutral-800 dark:text-neutral-100 truncate">
              {tr('Расширенная статистика', 'Розширена статистика', 'Advanced Statistics')}
            </h2>
            <p className="text-xs text-neutral-400 truncate">
              {tr('Подробная история ваших действий', 'Детальна історія ваших дій', 'Detailed history of your actions')}
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

        <div className="overflow-y-auto p-4 space-y-2 overscroll-contain">
          {ROWS.map((row) => {
            const value = stats[row.key] ?? 0;
            const display = row.format ? row.format(value as number) : String(value);
            return (
              <div
                key={row.key}
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 bg-neutral-50 dark:bg-neutral-850/50 border border-neutral-200 dark:border-neutral-800 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-850"
              >
                <span className="text-xs text-neutral-500 dark:text-neutral-400 flex-1 min-w-0">
                  {tr(row.label.ru, row.label.uk, row.label.en)}
                </span>
                <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200 text-right whitespace-nowrap">
                  {display}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
