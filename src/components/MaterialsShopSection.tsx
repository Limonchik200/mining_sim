import { useState, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { formatMoney } from '@/config';
import { getSlotPrice, MATERIALS_SHOP_REFRESH_MS } from '@/config/materialsShopConfig';
import { CRAFT_ITEMS, getCraftItemName } from '@/config/craftConfig';
import { TreePine, Layers, Clock, Coins, RefreshCw, Package } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  TreePine,
  Layers,
};

export default function MaterialsShopSection() {
  const { state, lang, buyMaterialSlot } = useGame();
  const [, force] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const shop = state.materialsShop;
  if (!shop) return null;

  const now = Date.now();
  const msUntilRefresh = Math.max(0, shop.nextRefreshAt - now);
  const minsUntilRefresh = Math.floor(msUntilRefresh / 60000);
  const secsUntilRefresh = Math.floor((msUntilRefresh % 60000) / 1000);

  const title = lang === 'ru' ? 'Сырье' : (lang === 'uk' ? 'Сировина' : 'Materials');

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
          <Package className="w-5 h-5 text-success-500" />
          {title}
        </h2>
        <div className="flex items-center gap-1.5 text-xs text-neutral-400">
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="tabular-nums">{minsUntilRefresh}:{String(secsUntilRefresh).padStart(2, '0')}</span>
        </div>
      </div>

      <div className="space-y-2">
        {shop.slots.map((slot) => {
          const item = CRAFT_ITEMS[slot.materialType];
          const Icon = ICON_MAP[item?.icon] || Package;
          const price = getSlotPrice(slot);
          const hasDiscount = slot.discountPct > 0;
          const originalPrice = slot.basePrice;
          const canAfford = state.balance >= price;
          const inStock = slot.stock > 0;
          const matName = getCraftItemName(slot.materialType, lang);

          return (
            <div
              key={slot.id}
              className={`rounded-xl p-3 border flex items-center justify-between ${
                inStock
                  ? 'bg-neutral-50 dark:bg-neutral-850/50 border-neutral-200 dark:border-neutral-800'
                  : 'bg-neutral-50/50 dark:bg-neutral-850/30 border-neutral-200/50 dark:border-neutral-800/50 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: item.color + '20' }}>
                  <Icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <div>
                  <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                    {matName} ×{slot.packSize}
                  </div>
                  <div className="text-xs text-neutral-400 flex items-center gap-2">
                    <span>
                      {lang === 'ru' ? 'В наличии' : (lang === 'uk' ? 'В наявності' : 'In stock')}: {slot.stock}/{slot.maxStock}
                    </span>
                    {hasDiscount && (
                      <span className="text-error-500 font-bold">-{slot.discountPct}%</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  {hasDiscount && (
                    <div className="text-xs text-neutral-400 line-through">{formatMoney(originalPrice)}</div>
                  )}
                  <div className="text-sm font-bold text-success-500">{formatMoney(price)}</div>
                </div>
                <button
                  onClick={() => buyMaterialSlot(slot.id)}
                  disabled={!inStock || !canAfford}
                  className={`btn px-3 py-1.5 text-xs whitespace-nowrap rounded-lg ${
                    inStock && canAfford
                      ? 'bg-success-500 text-white hover:bg-success-600'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5 inline mr-1" />
                  {inStock
                    ? (lang === 'ru' ? 'Купить' : (lang === 'uk' ? 'Купити' : 'Buy'))
                    : (lang === 'ru' ? 'Нет' : (lang === 'uk' ? 'Немає' : 'Sold out'))
                  }
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-neutral-400 mt-3 flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5" />
        {lang === 'ru' ? 'Ассортимент обновляется каждый час' : (lang === 'uk' ? 'Асортимент оновлюється щогодини' : 'Assortment refreshes every hour')}
      </div>
    </div>
  );
}
