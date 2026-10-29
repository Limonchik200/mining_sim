import React from 'react';
import { EXCHANGE_SHOP_ITEMS } from '../../config/shop/exchangeConfig';
import type { BossLang } from '../../config/bosses/bossI18n';
import { getBossT } from '../../config/bosses/bossI18n';

interface ExchangeScreenProps {
  playerTokens: number;
  hasUsedChestDiscount: boolean;
  onBuyItem: (itemId: string, price: number) => void;
  lang: BossLang;
}

export const ExchangeScreen: React.FC<ExchangeScreenProps> = ({
  playerTokens, hasUsedChestDiscount, onBuyItem, lang,
}) => {
  const t = getBossT(lang);

  return (
    <div className="flex flex-col h-full gap-4 text-white overflow-y-auto pr-1">
      <div className="flex justify-between items-center bg-slate-900/60 p-3 rounded-xl border border-slate-700">
        <div>
          <h3 className="font-bold text-sm">{t('shopTokens')}</h3>
          <p className="text-xs text-slate-400">{t('shopDesc')}</p>
        </div>
        <div className="flex items-center gap-1 text-amber-400 font-bold bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          <span>🪙</span> <span>{playerTokens}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {EXCHANGE_SHOP_ITEMS.map((item) => {
          const isChest = item.id === 'equipment_chest';
          const price = isChest && !hasUsedChestDiscount ? item.priceTokens / 10 : item.priceTokens;
          const canAfford = playerTokens >= price;

          return (
            <div key={item.id} className="bg-slate-900/80 border border-slate-700 p-4 rounded-xl flex flex-col justify-between gap-3">
              <div>
                <div className="flex justify-between items-start">
                  <h4 className="font-extrabold text-sm text-indigo-300">{item.nameUk}</h4>
                  {isChest && !hasUsedChestDiscount && (
                    <span className="bg-red-900/60 text-red-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-red-500/40 animate-pulse">
                      {t('discount90')} 🔥
                    </span>
                  )}
                </div>
                <p className="text-xs text-amber-400 font-bold mt-1">{t('costLabel')} {price.toLocaleString()} 🪙</p>
              </div>

              <button
                onClick={() => onBuyItem(item.id, price)}
                disabled={!canAfford}
                className="w-full py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-xl text-xs font-bold transition-all shadow-md"
              >
                {canAfford ? t('buy') : t('notEnoughTokens')}
              </button>
            </div>
          );
        })}

        <div className="bg-slate-900/40 border border-dashed border-slate-700 p-4 rounded-xl flex flex-col justify-center items-center text-center">
          <span className="text-2xl mb-1">🔒</span>
          <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">{t('comingSoon')}</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">{t('comingSoonDesc')}</p>
        </div>
      </div>
    </div>
  );
};
