import React from 'react';
import { EXCHANGE_SHOP_ITEMS } from '../../config/shop/exchangeConfig';

interface ExchangeScreenProps {
  playerTokens: number;
  hasUsedChestDiscount: boolean;
  onBuyItem: (itemId: string, price: number) => void;
}

export const ExchangeScreen: React.FC<ExchangeScreenProps> = ({
  playerTokens,
  hasUsedChestDiscount,
  onBuyItem,
}) => {
  return (
    <div className="flex flex-col h-full gap-4 text-white overflow-y-auto pr-1">
      <div className="flex justify-between items-center bg-slate-900/60 p-3 rounded-xl border border-slate-700">
        <div>
          <h3 className="font-bold text-sm">Обмінник (Магазин жетонів)</h3>
          <p className="text-xs text-slate-400">Купуйте унікальні товари за бойові жетони</p>
        </div>
        <div className="flex items-center gap-1 text-amber-400 font-bold bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          <span>🪙</span> <span>{playerTokens}</span>
        </div>
      </div>

      {/* Список товарів обмінника */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {EXCHANGE_SHOP_ITEMS.map((item) => {
          // Якщо це ящик з екіпіровкою і знижка ще діє, робимо 90% знижку (6000 замість 60000)
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
                      Знижка 90% 🔥
                    </span>
                  )}
                </div>
                <p className="text-xs text-amber-400 font-bold mt-1">Ціна: {price.toLocaleString()} жетонів</p>
              </div>

              <button
                onClick={() => onBuyItem(item.id, price)}
                disabled={!canAfford}
                className="w-full py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-xl text-xs font-bold transition-all shadow-md"
              >
                {canAfford ? 'Придбати' : 'Недостатньо жетонів'}
              </button>
            </div>
          );
        })}

        {/* Секретний слот «Скоро...» */}
        <div className="bg-slate-900/40 border border-dashed border-slate-700 p-4 rounded-xl flex flex-col justify-center items-center text-center">
          <span className="text-2xl mb-1">🔒</span>
          <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Скоро...</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Нові товари та унікальні підсилення у наступних оновленнях!</p>
        </div>
      </div>
    </div>
  );
};