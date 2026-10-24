import { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { PICKAXE_TIERS, getPickaxeTier } from '@/config/pickaxesConfig';
import { formatMoney } from '@/config';
import { Hammer, ArrowLeftRight } from 'lucide-react';

export default function PickaxesSection() {
  const { state, lang, buyPickaxe, equipPickaxe, switchPickaxe, t } = useGame();
  const [flashItem, setFlashItem] = useState<string | null>(null);
  const [floatText, setFloatText] = useState<{ id: string; text: string } | null>(null);

  const tr = (ru: string, uk: string, en: string) => lang === 'ru' ? ru : (lang === 'uk' ? uk : en);

  const triggerBuyFlash = (id: string, text: string) => {
    setFlashItem(id);
    setFloatText({ id, text });
    setTimeout(() => setFlashItem(null), 800);
    setTimeout(() => setFloatText(null), 1200);
  };

  return (
    <div className="card p-4 scroll-mt-4">
      <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-3 flex items-center gap-2">
        <Hammer className="w-5 h-5 text-primary-500" />
        {t('shopEquipment')}
      </h2>
      <div className="space-y-2">
        {PICKAXE_TIERS.map((tier) => {
          const name = lang === 'ru' ? tier.nameRu : (lang === 'uk' ? tier.nameUk : tier.nameEn);
          const isEquipped = state.activePickaxeTierId === tier.id;
          const meetsLevel = state.level >= tier.requiredLevel;
          const canAfford = state.balance >= tier.price;
          const isOwned = state.ownedPickaxes?.includes(tier.id);

          return (
            <div
              key={tier.id}
              className={`relative rounded-xl p-3 border bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-850/50 dark:to-neutral-900/50 border-neutral-200 dark:border-neutral-800 transition-all duration-300 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5 ${
                isEquipped ? 'ring-1 ring-primary-500/30' : ''
              } ${flashItem === `px-${tier.id}` ? 'animate-buy-flash' : ''}`}
            >
              {floatText?.id === `px-${tier.id}` && (
                <span className="absolute -top-6 right-8 text-xs font-bold text-success-500 animate-fade-scale pointer-events-none">
                  {tr('Куплено!', 'Куплено!', '+1 Purchased')}
                </span>
              )}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: tier.color + '20' }}
                  >
                    <Hammer className="w-4.5 h-4.5" style={{ color: tier.color }} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                      {name}
                      {isEquipped && <span className="text-[10px] text-primary-500 bg-primary-500/10 px-1.5 py-0.5 rounded">{t('equipped')}</span>}
                      {isOwned && !isEquipped && <span className="text-[10px] text-success-500 bg-success-500/10 px-1.5 py-0.5 rounded">{t('owned')}</span>}
                    </div>
                    <div className="text-xs text-neutral-400">
                      ×{tier.yieldMultiplier} {t('yield')} · {tier.energyCost} {t('energyCost')} · {tier.durabilityCost} {t('durabilityCost')} · {tier.maxDurability} {t('maxDurability')}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs">
                  {tier.requiredLevel > 1 && !isOwned && (
                    <span className={meetsLevel ? 'text-neutral-400' : 'text-error-500'}>
                      {t('requiresLevel')} {tier.requiredLevel}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (isOwned) {
                      equipPickaxe(tier.id);
                    } else {
                      buyPickaxe(tier.id);
                      triggerBuyFlash(`px-${tier.id}`, tr('Куплено!', 'Куплено!', '+1 Purchased'));
                    }
                  }}
                  disabled={isEquipped || (!isOwned && (!meetsLevel || !canAfford))}
                  className={
                    isEquipped
                      ? 'btn-ghost px-4 py-1.5 text-xs'
                      : isOwned
                      ? 'btn-success px-4 py-1.5 text-xs'
                      : !meetsLevel
                      ? 'btn-error px-4 py-1.5 text-xs opacity-50'
                      : 'btn-primary px-4 py-1.5 text-xs'
                  }
                >
                  {isEquipped
                    ? t('equipped')
                    : isOwned
                    ? t('switchToPickaxe')
                    : !meetsLevel
                    ? `${t('requiresLevel')} ${tier.requiredLevel}`
                    : formatMoney(tier.price)}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {state.sparePickaxes.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 flex items-center gap-1.5">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            {t('sparePickaxes')} ({state.sparePickaxes.length})
          </div>
          <div className="space-y-1.5">
            {state.sparePickaxes.map((px) => {
              const pxTier = getPickaxeTier(px.pickaxeTierId);
              const pxName = lang === 'ru' ? pxTier.nameRu : (lang === 'uk' ? pxTier.nameUk : pxTier.nameEn);
              return (
                <div
                  key={px.id}
                  className="flex items-center justify-between rounded-lg p-2 bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700"
                >
                  <div className="flex items-center gap-2">
                    <Hammer className="w-3.5 h-3.5" style={{ color: pxTier.color }} />
                    <div>
                      <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{pxName}</div>
                      <div className="text-[10px] text-neutral-400">{px.durability}/{px.maxDurability} {t('durability')}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => switchPickaxe(px.id)}
                    className="btn-ghost px-3 py-1 text-xs flex items-center gap-1"
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                    {t('switchToPickaxe')}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
