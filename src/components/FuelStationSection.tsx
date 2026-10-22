import { useState, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { formatMoney } from '@/config';
import {
  CANISTER_PRICE,
  CANISTER_CAPACITY_L,
  CANISTER_WEIGHT,
  getTotalFuel,
  getTotalFuelCapacity,
  getAvailableFuelSpace,
  DIESEL95_MIN_PRICE,
  DIESEL95_MAX_PRICE,
  DIESEL95_UPDATE_MS,
} from '@/config/fuelConfig';
import { Fuel, Package, Coins, Lock, TrendingUp, Clock } from 'lucide-react';

export default function FuelStationSection() {
  const { state, lang, buyCanister, buyFuel } = useGame();
  const [fuelLiters, setFuelLiters] = useState('1');
  const [, force] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => force((n) => n + 1), 500);
    return () => clearInterval(interval);
  }, []);

  const fuel = state.fuel;
  const canisters = fuel.canisters;
  const totalCapacity = getTotalFuelCapacity(canisters);
  const totalFuel = getTotalFuel(canisters);
  const availableSpace = getAvailableFuelSpace(canisters);
  const pricePerLiter = fuel.diesel95Price;
  const requestedLiters = parseFloat(fuelLiters) || 0;
  const actualLiters = Math.min(requestedLiters, availableSpace);
  const totalCost = Math.round(actualLiters * pricePerLiter * 100) / 100;
  const canAffordFuel = state.balance >= totalCost && availableSpace > 0 && actualLiters > 0;
  const canAffordCanister = state.balance >= CANISTER_PRICE;

  const pricePct = ((pricePerLiter - DIESEL95_MIN_PRICE) / (DIESEL95_MAX_PRICE - DIESEL95_MIN_PRICE)) * 100;
  const msUntilUpdate = Math.max(0, DIESEL95_UPDATE_MS - (Date.now() - fuel.diesel95PriceUpdatedAt));
  const secUntilUpdate = Math.ceil(msUntilUpdate / 1000);

  return (
    <div className="card p-4">
      <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2 mb-3">
        <Fuel className="w-5 h-5 text-accent-500" />
        {lang === 'ru' ? 'Заправка' : (lang === 'uk' ? 'Заправка' : 'Fuel Station')}
      </h2>

      {/* Canister purchase */}
      <div className="rounded-xl p-3 bg-neutral-50 dark:bg-neutral-850/50 border border-neutral-200 dark:border-neutral-800 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent-500/20">
              <Package className="w-5 h-5 text-accent-500" />
            </div>
            <div>
              <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                {lang === 'ru' ? 'Канистра' : (lang === 'uk' ? 'Каністра' : 'Canister')}
              </div>
              <div className="text-xs text-neutral-400">
                {CANISTER_CAPACITY_L}Л · {CANISTER_WEIGHT}м² · {lang === 'ru' ? 'пустая' : (lang === 'uk' ? 'порожня' : 'empty')}
              </div>
            </div>
          </div>
          <button
            onClick={buyCanister}
            disabled={!canAffordCanister}
            className={`btn px-3 py-1.5 text-xs rounded-lg ${
              canAffordCanister
                ? 'bg-accent-500 text-white hover:bg-accent-600'
                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
            }`}
          >
            <Coins className="w-3.5 h-3.5 inline mr-1" />
            {formatMoney(CANISTER_PRICE)}
          </button>
        </div>
      </div>

      {/* Canister status */}
      {canisters.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
            {lang === 'ru' ? 'Канистры' : (lang === 'uk' ? 'Каністри' : 'Canisters')} ({canisters.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {canisters.map((c) => {
              const fillPct = (c.currentFuel / c.capacity) * 100;
              return (
                <div key={c.id} className="w-16">
                  <div className="h-12 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-850 overflow-hidden relative">
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-accent-500 to-accent-400 transition-all"
                      style={{ height: `${fillPct}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-neutral-700 dark:text-neutral-200">
                      {c.currentFuel.toFixed(1)}/{c.capacity}Л
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-xs text-neutral-400 mt-2">
            {lang === 'ru' ? 'Всего топлива' : (lang === 'uk' ? 'Всього пального' : 'Total fuel')}: <span className="font-bold text-accent-500">{totalFuel.toFixed(1)}Л</span> / {totalCapacity}Л
          </div>
        </div>
      )}

      {/* Diesel 95 */}
      <div className="rounded-xl p-3 bg-neutral-50 dark:bg-neutral-850/50 border border-neutral-200 dark:border-neutral-800 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Fuel className="w-4 h-4 text-success-500" />
            <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Дизель 95</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-400 flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {secUntilUpdate}s
            </span>
            <span className="text-sm font-bold text-success-500 tabular-nums">{pricePerLiter.toFixed(2)}$/Л</span>
          </div>
        </div>

        {/* Price indicator */}
        <div className="mb-3">
          <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden relative">
            <div className="absolute inset-0 flex">
              <div className="flex-1 bg-success-500/30" />
              <div className="flex-1 bg-warning-500/30" />
              <div className="flex-1 bg-error-500/30" />
            </div>
            <div
              className="h-full bg-success-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, pricePct)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-neutral-400 mt-0.5">
            <span>{DIESEL95_MIN_PRICE.toFixed(2)}$</span>
            <span>{DIESEL95_MAX_PRICE.toFixed(2)}$</span>
          </div>
        </div>

        {availableSpace > 0 ? (
          <>
            <div className="mb-2">
              <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">
                {lang === 'ru' ? 'Литры' : (lang === 'uk' ? 'Літри' : 'Liters')} (макс: {availableSpace.toFixed(1)}Л)
              </label>
              <input
                type="number"
                min="0.1"
                max={availableSpace}
                step="0.1"
                value={fuelLiters}
                onChange={(e) => setFuelLiters(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-850 px-3 py-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200 focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none"
                placeholder="0"
              />
            </div>
            <div className="flex items-center justify-between mb-2 text-xs">
              <span className="text-neutral-400">
                {lang === 'ru' ? 'К оплате' : (lang === 'uk' ? 'До сплати' : 'Total')}: 
              </span>
              <span className="font-bold text-success-500">{formatMoney(totalCost)}</span>
            </div>
            <button
              onClick={() => buyFuel(actualLiters)}
              disabled={!canAffordFuel}
              className={`btn w-full py-2.5 text-sm rounded-lg flex items-center justify-center gap-1.5 ${
                canAffordFuel
                  ? 'bg-success-500 text-white hover:bg-success-600'
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              {lang === 'ru' ? 'Заправить' : (lang === 'uk' ? 'Заправити' : 'Refuel')}
            </button>
          </>
        ) : (
          <div className="text-xs text-neutral-400 text-center py-3 bg-neutral-100 dark:bg-neutral-850 rounded-lg">
            {lang === 'ru' ? 'Купите канистру для заправки' : (lang === 'uk' ? 'Купіть каністру для заправки' : 'Buy a canister to refuel')}
          </div>
        )}
      </div>

      {/* Diesel 100 - locked */}
      <div className="rounded-xl p-3 bg-neutral-50/50 dark:bg-neutral-850/30 border border-neutral-200/50 dark:border-neutral-800/50 opacity-60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-neutral-400" />
            <span className="text-sm font-bold text-neutral-500">Дизель 100</span>
          </div>
          <span className="text-xs text-neutral-400">
            {lang === 'ru' ? 'Нет в наличии' : (lang === 'uk' ? 'Немає в наявності' : 'Not available')}
          </span>
        </div>
      </div>
    </div>
  );
}
