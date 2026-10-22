import { useGame } from '@/context/GameContext';
import { formatMoney } from '@/config';
import { OXYGEN_TANK_CONFIGS } from '@/config/oxygenConfig';
import { BATTERY_CONFIGS } from '@/config/batteryConfig';
import { COOLER_CONFIGS, getCoolerDurabilityPct, getCoolerRemainingSec } from '@/config/coolerConfig';
import { GENERATOR_PRICE, GENERATOR_LITHIUM_SLOTS, getGeneratorTotalPower } from '@/config/generatorConfig';
import type { OxygenTankType, BatteryType, CoolerType, CoolerMode } from '@/types/craft';
import { Wind, Battery, Snowflake, Fuel, Coins, Power, Wrench, Plus, Minus, Zap, Clock, Lock, Grid2x2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

function formatRemaining(sec: number): string {
  if (sec <= 0) return '0s';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function LifeSupportSection() {
  const { state, lang, t, buyOxygenTank, buyBattery, buyCooler, toggleCooler, setCoolerMode, repairCooler, buyGenerator, toggleGenerator, refuelGenerator, insertLithiumBattery, removeLithiumBattery, buyShelf, usedWarehouseSpace, totalWarehouseSpace } = useGame();
  const ls = state.lifeSupport;

  const tr = (ru: string, uk: string, en: string) => lang === 'ru' ? ru : (lang === 'uk' ? uk : en);

  const hasVentilation = (state.equipment.ventilationLevel ?? 0) > 0;
  const hasSmokeFilter = !!state.equipment.respiratorFilterPurchased;
  const genReady = hasVentilation && hasSmokeFilter;

  return (
    <div className="card p-4 scroll-mt-4">
      <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-4 flex items-center gap-2">
        <Wind className="w-5 h-5 text-accent-500" />
        {tr('Спорядження', 'Спорядження', 'Equipment')}
      </h2>

      {/* Warehouse Space */}
      <div className="rounded-xl p-3 mb-4 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-850/50 dark:to-neutral-900/50 border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Grid2x2 className="w-4 h-4 text-accent-500" />
            <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">{tr('Склад', 'Склад', 'Warehouse')}</span>
            <span className="text-xs text-neutral-400">{ls.shelfCount}/6 {tr('стелажів', 'стелажів', 'shelves')}</span>
          </div>
          <div className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
            {usedWarehouseSpace} / {totalWarehouseSpace} м²
          </div>
        </div>
        <div className="h-2.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden mb-2">
          <div
            className={`h-full transition-all duration-300 ${usedWarehouseSpace / totalWarehouseSpace > 0.9 ? 'bg-error-500' : usedWarehouseSpace / totalWarehouseSpace > 0.7 ? 'bg-warning-500' : 'bg-success-500'}`}
            style={{ width: `${Math.min(100, (usedWarehouseSpace / totalWarehouseSpace) * 100)}%` }}
          />
        </div>
        {ls.shelfCount < 6 ? (
          <button
            onClick={buyShelf}
            disabled={(state.craftInventory?.shelf ?? 0) < 1}
            className={`btn px-3 py-1.5 text-xs rounded-lg w-full ${(state.craftInventory?.shelf ?? 0) >= 1 ? 'bg-accent-500 text-white hover:bg-accent-600' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'}`}
          >
            <Plus className="w-3.5 h-3.5 inline mr-1" />
            {tr('Встановити стелаж', 'Встановити стелаж', 'Install shelf')}
            {(state.craftInventory?.shelf ?? 0) < 1 && <span className="ml-1 opacity-70">({tr('потрібен крафт', 'потрібен крафт', 'need craft')})</span>}
          </button>
        ) : (
          <div className="text-xs text-center text-neutral-400 py-1">{tr('Максимум стелажів', 'Максимум стелажів', 'Maximum shelves')}</div>
        )}
      </div>

      {/* Oxygen Tanks */}
      <SectionTitle icon={Wind} color="#06b6d4" label={tr('Кислородные баллоны', 'Кисневі балони', 'Oxygen Tanks')} />
      <div className="space-y-2 mb-4">
        {(Object.keys(OXYGEN_TANK_CONFIGS) as OxygenTankType[]).map((type) => {
          const cfg = OXYGEN_TANK_CONFIGS[type];
          const owned = ls.oxygenTanks.filter((t) => t.type === type);
          const canAfford = state.balance >= cfg.price;
          return (
            <div key={type} className="flex items-center justify-between rounded-xl p-3 bg-neutral-50 dark:bg-neutral-850/50 border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: cfg.color + '20' }}>
                  <Wind className="w-5 h-5" style={{ color: cfg.color }} />
                </div>
                <div>
                  <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{tr(cfg.nameRu, cfg.nameUk, cfg.nameEn)}</div>
                  <div className="text-xs text-neutral-400">
                    {cfg.capacity}Л · {cfg.space}м²
                    {owned.length > 0 && <span className="ml-1.5 text-success-500">×{owned.length}</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={() => buyOxygenTank(type)}
                disabled={!canAfford}
                className={canAfford ? 'btn-primary px-3 py-1.5 text-xs whitespace-nowrap' : 'btn-ghost px-3 py-1.5 text-xs opacity-50 cursor-not-allowed'}
              >
                {formatMoney(cfg.price)}
              </button>
            </div>
          );
        })}
      </div>

      {/* Batteries */}
      <SectionTitle icon={Battery} color="#22c55e" label={tr('Аккумуляторы', 'Акумулятори', 'Batteries')} />
      <div className="space-y-2 mb-4">
        {(Object.keys(BATTERY_CONFIGS) as BatteryType[]).map((type) => {
          const cfg = BATTERY_CONFIGS[type];
          const owned = ls.batteries.filter((b) => b.type === type);
          const canAfford = state.balance >= cfg.price;
          const isLithium = type === 'battery_lithium';
          return (
            <div key={type} className="flex items-center justify-between rounded-xl p-3 bg-neutral-50 dark:bg-neutral-850/50 border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: cfg.color + '20' }}>
                  <Battery className="w-5 h-5" style={{ color: cfg.color }} />
                </div>
                <div>
                  <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{tr(cfg.nameRu, cfg.nameUk, cfg.nameEn)}</div>
                  <div className="text-xs text-neutral-400">
                    {cfg.capacity}МВт · {cfg.space}м²
                    {isLithium && <span className="ml-1 text-accent-500">· ×{cfg.maxRecharges} {tr('зарядки', 'зарядки', 'recharges')}</span>}
                    {owned.length > 0 && <span className="ml-1.5 text-success-500">×{owned.length}</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={() => buyBattery(type)}
                disabled={!canAfford}
                className={canAfford ? 'btn-primary px-3 py-1.5 text-xs whitespace-nowrap' : 'btn-ghost px-3 py-1.5 text-xs opacity-50 cursor-not-allowed'}
              >
                {formatMoney(cfg.price)}
              </button>
            </div>
          );
        })}
      </div>

      {/* Coolers */}
      <SectionTitle icon={Snowflake} color="#0891b2" label={tr('Охладители', 'Охолоджувачі', 'Coolers')} />
      <div className="space-y-2 mb-4">
        {(Object.keys(COOLER_CONFIGS) as CoolerType[]).map((type) => {
          const cfg = COOLER_CONFIGS[type];
          const owned = ls.coolers.filter((c) => c.type === type);
          const canAfford = state.balance >= cfg.price;
          const hasCooler = ls.coolers.length > 0;
          return (
            <div key={type} className="rounded-xl p-3 bg-neutral-50 dark:bg-neutral-850/50 border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: cfg.color + '20' }}>
                    <Snowflake className="w-5 h-5" style={{ color: cfg.color }} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{tr(cfg.nameRu, cfg.nameUk, cfg.nameEn)}</div>
                    <div className="text-xs text-neutral-400">
                      {cfg.modeConfigs.normal.tempReduction}°C · {cfg.modeConfigs.normal.powerPerMin}МВт/хв
                      {owned.length > 0 && <span className="ml-1.5 text-success-500">×{owned.length}</span>}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => buyCooler(type)}
                  disabled={!canAfford || hasCooler}
                  className={canAfford && !hasCooler ? 'btn-primary px-3 py-1.5 text-xs whitespace-nowrap' : 'btn-ghost px-3 py-1.5 text-xs opacity-50 cursor-not-allowed'}
                >
                  {hasCooler ? tr('Куплено', 'Куплено', 'Owned') : formatMoney(cfg.price)}
                </button>
              </div>

              {owned.map((cooler) => {
                const pct = getCoolerDurabilityPct(cooler);
                const remaining = getCoolerRemainingSec(cooler);
                const modeCfg = cfg.modeConfigs[cooler.mode];
                const isBroken = cooler.durability <= 0;
                return (
                  <div key={cooler.id} className="mt-2 p-2 rounded-lg bg-white dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${isBroken ? 'text-error-500' : cooler.active ? 'text-success-500' : 'text-neutral-400'}`}>
                          {isBroken ? tr('Сломан', 'Зламаний', 'Broken') : cooler.active ? tr('Включён', 'Увімкнений', 'Active') : tr('Выключен', 'Вимкнений', 'Off')}
                        </span>
                        {!isBroken && <span className="text-[10px] text-neutral-400">{pct}% · {formatRemaining(remaining)}</span>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isBroken ? (
                          <button onClick={() => repairCooler(cooler.id)} disabled={state.balance < cfg.repairPrice} className="btn px-2 py-1 text-[10px] rounded-md bg-warning-500 text-white hover:bg-warning-600 disabled:opacity-50">
                            <Wrench className="w-3 h-3 inline mr-0.5" />
                            {tr('Ремонт', 'Ремонт', 'Repair')} {formatMoney(cfg.repairPrice)}
                          </button>
                        ) : (
                          <button onClick={() => toggleCooler(cooler.id)} className={`btn px-2 py-1 text-[10px] rounded-md ${cooler.active ? 'bg-error-500/20 text-error-500' : 'bg-success-500/20 text-success-500'}`}>
                            <Power className="w-3 h-3 inline" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Durability bar */}
                    <div className="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden mb-1.5">
                      <div
                        className={`h-full transition-all ${isBroken ? 'bg-error-500' : pct > 50 ? 'bg-success-500' : pct > 20 ? 'bg-warning-500' : 'bg-error-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {/* Mode switcher for industrial */}
                    {cfg.hasModes && !isBroken && (
                      <div className="flex gap-1">
                        {cfg.modes.map((m) => {
                          const mc = cfg.modeConfigs[m];
                          const labels: Record<CoolerMode, string> = {
                            eco: tr('Эко', 'Еко', 'Eco'),
                            normal: tr('Норм', 'Норм', 'Norm'),
                            full: tr('Полный', 'Повний', 'Full'),
                          };
                          return (
                            <button
                              key={m}
                              onClick={() => setCoolerMode(cooler.id, m)}
                              className={`flex-1 py-1 text-[10px] rounded-md font-semibold transition-all ${
                                cooler.mode === m
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500'
                              }`}
                              title={`-${mc.tempReduction}°C · ${mc.powerPerMin}МВт/хв`}
                            >
                              {labels[m]} -{mc.tempReduction}°C
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Mode info */}
                    {!cfg.hasModes && !isBroken && (
                      <div className="text-[10px] text-neutral-400">
                        -{modeCfg.tempReduction}°C · {modeCfg.powerPerMin}МВт/хв
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Generator / Power Source */}
      <SectionTitle icon={Fuel} color="#f97316" label={tr('Источники питания', 'Джерела живлення', 'Power Sources')} />
      <div className="rounded-xl p-3 bg-neutral-50 dark:bg-neutral-850/50 border border-neutral-200 dark:border-neutral-800">
        {!ls.generator.purchased ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#f97316' + '20' }}>
                <Fuel className="w-5 h-5" style={{ color: '#f97316' }} />
              </div>
              <div>
                <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{tr('Дизельный генератор', 'Дизельний генератор', 'Diesel Generator')}</div>
                <div className="text-xs text-neutral-400">
                  5МВт/хв · 100Л бак · 1м²
                </div>
                {!genReady && (
                  <div className="text-[10px] text-error-500 mt-0.5 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    {tr('Нужна вентиляция + дымовой фильтр', 'Потрібна вентиляція + димовий фільтр', 'Requires ventilation + smoke filter')}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={buyGenerator}
              disabled={state.balance < GENERATOR_PRICE || !genReady}
              className={state.balance >= GENERATOR_PRICE && genReady ? 'btn-primary px-3 py-1.5 text-xs whitespace-nowrap' : 'btn-ghost px-3 py-1.5 text-xs opacity-50 cursor-not-allowed'}
            >
              {formatMoney(GENERATOR_PRICE)}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#f97316' + '20' }}>
                  <Fuel className="w-5 h-5" style={{ color: '#f97316' }} />
                </div>
                <div>
                  <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{tr('Дизельный генератор', 'Дизельний генератор', 'Diesel Generator')}</div>
                  <div className="text-xs text-neutral-400 flex items-center gap-2">
                    <span className={ls.generator.active ? 'text-success-500' : 'text-neutral-400'}>
                      {ls.generator.active ? tr('Работает', 'Працює', 'Running') : tr('Выключен', 'Вимкнений', 'Off')}
                    </span>
                    <span>· <Zap className="w-3 h-3 inline" /> {getGeneratorTotalPower(ls.generator.lithiumBatteryIds.length)}МВт/хв</span>
                  </div>
                </div>
              </div>
              <button
                onClick={toggleGenerator}
                className={`btn px-3 py-1.5 text-xs rounded-lg ${ls.generator.active ? 'bg-error-500/20 text-error-500' : 'bg-success-500 text-white'}`}
              >
                <Power className="w-3.5 h-3.5 inline mr-1" />
                {ls.generator.active ? tr('Стоп', 'Стоп', 'Stop') : tr('Старт', 'Старт', 'Start')}
              </button>
            </div>

            {/* Fuel gauge */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-neutral-400 flex items-center gap-1"><Fuel className="w-3 h-3" /> {tr('Топливо', 'Паливо', 'Fuel')}</span>
                <span className="font-bold text-neutral-600 dark:text-neutral-300">{ls.generator.fuelLiters.toFixed(1)}/{ls.generator.tankCapacity}Л</span>
              </div>
              <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden mb-2">
                <div className="h-full bg-warning-500 transition-all" style={{ width: `${(ls.generator.fuelLiters / ls.generator.tankCapacity) * 100}%` }} />
              </div>
              <button
                onClick={refuelGenerator}
                disabled={ls.generator.fuelLiters >= ls.generator.tankCapacity}
                className="btn px-3 py-1.5 text-xs rounded-lg bg-warning-500 text-white hover:bg-warning-600 disabled:opacity-50 w-full"
              >
                <Plus className="w-3.5 h-3.5 inline mr-1" />
                {tr('Заправить из канистр', 'Заправити з каністр', 'Refuel from canisters')}
              </button>
            </div>

            {/* Lithium battery slots */}
            <div>
              <div className="text-xs text-neutral-400 mb-1.5 flex items-center gap-1">
                <Battery className="w-3 h-3" />
                {tr('Слоты литиевых батарей', 'Слоти літієвих батарей', 'Lithium Battery Slots')} ({ls.generator.lithiumBatteryIds.length}/{GENERATOR_LITHIUM_SLOTS})
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: GENERATOR_LITHIUM_SLOTS }).map((_, slotIdx) => {
                  const batteryId = ls.generator.lithiumBatteryIds[slotIdx];
                  const battery = batteryId ? ls.batteries.find((b) => b.id === batteryId) : null;
                  return (
                    <div key={slotIdx} className="rounded-lg p-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50">
                      {battery ? (
                        <div className="flex items-center justify-between">
                          <div className="text-xs">
                            <div className="font-bold text-neutral-700 dark:text-neutral-300">{tr('Литиевый', 'Літієвий', 'Lithium')}</div>
                            <div className="text-[10px] text-neutral-400">{battery.currentCharge.toFixed(0)}/{battery.capacity}МВт</div>
                          </div>
                          <button onClick={() => removeLithiumBattery(battery.id)} className="btn-ghost p-1 rounded-md">
                            <Minus className="w-3 h-3 text-error-500" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-1">
                          <div className="text-[10px] text-neutral-400 mb-1">{tr('Пусто', 'Порожньо', 'Empty')}</div>
                          <div className="flex gap-1 justify-center flex-wrap">
                            {ls.batteries
                              .filter((b) => b.type === 'battery_lithium' && !ls.generator.lithiumBatteryIds.includes(b.id))
                              .slice(0, 3)
                              .map((b) => (
                                <button
                                  key={b.id}
                                  onClick={() => insertLithiumBattery(b.id)}
                                  className="btn-ghost px-1.5 py-0.5 text-[10px] rounded-md border border-neutral-300 dark:border-neutral-600"
                                >
                                  <Plus className="w-2.5 h-2.5 inline" />
                                  {b.currentCharge.toFixed(0)}МВт
                                </button>
                              ))}
                            {ls.batteries.filter((b) => b.type === 'battery_lithium' && !ls.generator.lithiumBatteryIds.includes(b.id)).length === 0 && (
                              <span className="text-[10px] text-neutral-400">{tr('Нет литиевых', 'Немає літієвих', 'No lithium')}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, color, label }: { icon: LucideIcon; color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2 mt-4 first:mt-0">
      <Icon className="w-4 h-4" style={{ color }} />
      <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">{label}</h3>
      <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
    </div>
  );
}
