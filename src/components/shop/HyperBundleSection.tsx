import { useGame } from '@/context/GameContext';
import { findHyperBundle } from '@/config/hyperBundlesConfig';
import { getOfferPriceGems, getBundleName, getRewardDisplayName } from '@/config/specialOffersConfig';
import { Gem, Package, Layers, Briefcase, Check, Clock, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = { Package, Layers, Briefcase };

export default function HyperBundleSection() {
  const { state, buyHyperBundle, lang } = useGame();

  const tr = (ru: string, uk: string, en: string) => lang === 'ru' ? ru : (lang === 'uk' ? uk : en);

  const hyper = state.hyperBundle;
  const bundle = hyper ? findHyperBundle(hyper.bundleId) : undefined;
  if (!hyper || !bundle) return null;

  const msUntilRefresh = Math.max(0, hyper.nextRefreshAt - Date.now());
  const daysUntil = Math.floor(msUntilRefresh / (24 * 60 * 60 * 1000));
  const hoursUntil = Math.floor((msUntilRefresh % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  const Icon = ICON_MAP[bundle.icon] || Package;
  const price = getOfferPriceGems(bundle, hyper.discountPct);
  const canAfford = state.gems >= price;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent-500" />
          {tr('Гипербандлы', 'Гіпербандли', 'Hyperbundles')}
        </h2>
        <span className="text-xs text-neutral-400 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {daysUntil}{tr('д', 'д', 'd')} {hoursUntil}{tr('ч', 'г', 'h')}
        </span>
      </div>

      <div
        className={`rounded-xl p-4 border transition-all ${
          hyper.purchased
            ? 'bg-success-500/5 border-success-500/20'
            : 'bg-neutral-50 dark:bg-neutral-850/50 border-neutral-200 dark:border-neutral-800 hover:border-accent-500/30'
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: bundle.color + '20' }}
            >
              <Icon className="w-5 h-5" style={{ color: bundle.color }} />
            </div>
            <div>
              <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                {getBundleName(bundle, lang)}
              </div>
              {hyper.discountPct > 0 && (
                <div className="text-xs font-bold text-success-500">-{hyper.discountPct}%</div>
              )}
            </div>
          </div>
          <div className="text-right">
            {hyper.discountPct > 0 && (
              <div className="text-xs text-neutral-400 line-through">{bundle.basePriceGems}</div>
            )}
            <div className="flex items-center gap-1">
              <Gem className="w-4 h-4 text-accent-500" />
              <span className="text-sm font-bold text-accent-500">{price}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {bundle.rewards.map((reward, i) => (
            <span
              key={i}
              className="text-xs px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-medium"
            >
              {getRewardDisplayName(reward.type, lang)} ×{reward.amount}
            </span>
          ))}
        </div>

        {hyper.purchased ? (
          <div className="w-full py-2 text-sm font-bold text-center rounded-xl bg-success-500/10 text-success-500 flex items-center justify-center gap-1.5 border border-success-500/20">
            <Check className="w-4 h-4" />
            {tr('Куплено', 'Куплено', 'Purchased')}
          </div>
        ) : (
          <button
            type="button"
            onClick={buyHyperBundle}
            disabled={!canAfford}
            className={`btn w-full py-2 text-sm rounded-lg flex items-center justify-center gap-1.5 ${
              canAfford
                ? 'bg-accent-500 text-white hover:bg-accent-600'
                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
            }`}
          >
            <Gem className="w-4 h-4" />
            {canAfford
              ? tr('Купить', 'Купити', 'Buy')
              : tr('Недостаточно алмазов', 'Недостатньо алмазів', 'Not enough gems')}
          </button>
        )}
      </div>
    </div>
  );
}
