import { useState, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { formatMoney } from '@/config';
import { getMineById, isDumpMine } from '@/config/minesConfig';
import { getPickaxeTier, isUnlimitedDurability, FOOD_ITEMS } from '@/config/pickaxesConfig';
import { COOLER_CONFIGS, getCoolerDurabilityPct, getCoolerRemainingSec } from '@/config/coolerConfig';
import { BATTERY_CONFIGS } from '@/config/batteryConfig';
import { OXYGEN_TANK_CONFIGS } from '@/config/oxygenConfig';
import { GENERATOR_LITHIUM_SLOTS } from '@/config/generatorConfig';
import type { CoolerMode, BatteryInstance, OxygenTank, FuelCanister } from '@/types/craft';
import { Power, Wrench, X, Plus, Minus, Battery, Wind, Fuel, Candy, CupSoda, Cookie } from 'lucide-react';

function formatRemaining(sec: number): string {
  if (sec <= 0) return '0s';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

type ShelfItem =
  | { kind: 'generator'; color: string; w: number; h: number }
  | { kind: 'battery'; color: string; w: number; h: number; charge: number; max: number }
  | { kind: 'oxygen'; color: string; w: number; h: number; oxygen: number; max: number; tankSize: 'sm' | 'md' | 'lg' }
  | { kind: 'canister'; color: string; w: number; h: number; empty: boolean; fuel: number };

function buildShelfItems(ls: import('@/types/craft').LifeSupportState, canisters: FuelCanister[]): ShelfItem[][] {
  const items: ShelfItem[] = [];

  if (ls.generator.purchased) {
    items.push({ kind: 'generator', color: '#f97316', w: 28, h: 22 });
  }

  for (const b of ls.batteries) {
    const cfg = BATTERY_CONFIGS[b.type];
    const sizeMap: Record<string, { w: number; h: number }> = {
      battery_basic: { w: 5, h: 12 },
      battery_weak: { w: 8, h: 14 },
      battery_car: { w: 12, h: 16 },
      battery_lithium: { w: 16, h: 20 },
    };
    const s = sizeMap[b.type] ?? { w: 8, h: 14 };
    items.push({ kind: 'battery', color: cfg.color, w: s.w, h: s.h, charge: b.currentCharge, max: b.capacity });
  }

  for (const t of ls.oxygenTanks) {
    const cfg = OXYGEN_TANK_CONFIGS[t.type];
    const sizeMap: Record<string, { w: number; h: number; tankSize: 'sm' | 'md' | 'lg' }> = {
      oxygen_tank_small: { w: 8, h: 16, tankSize: 'sm' },
      oxygen_tank_medium: { w: 11, h: 22, tankSize: 'md' },
      oxygen_tank_large: { w: 15, h: 28, tankSize: 'lg' },
    };
    const s = sizeMap[t.type] ?? { w: 10, h: 20, tankSize: 'md' };
    items.push({ kind: 'oxygen', color: cfg.color, w: s.w, h: s.h, oxygen: t.currentOxygen, max: t.capacity, tankSize: s.tankSize });
  }

  for (const c of canisters) {
    items.push({ kind: 'canister', color: c.isEmpty ? '#525252' : '#f97316', w: 10, h: 14, empty: !!c.isEmpty, fuel: c.currentFuel });
  }

  const shelfCount = Math.max(ls.shelfCount, 1);
  const shelves: ShelfItem[][] = Array.from({ length: 6 }, () => []);
  const perShelf = Math.ceil(items.length / shelfCount);
  for (let i = 0; i < shelfCount && i < 6; i++) {
    shelves[i] = items.slice(i * perShelf, (i + 1) * perShelf);
  }
  return shelves;
}

export default function MineRoomView({ onOreVeinClick }: { onOreVeinClick: () => void }) {
  const { state, lang, buyShelf, toggleCooler, setCoolerMode, repairCooler, toggleGenerator, refuelGenerator, insertLithiumBattery, removeLithiumBattery, sellCanister, usedWarehouseSpace, totalWarehouseSpace, currentMineId, eatFood } = useGame();
  const ls = state.lifeSupport;
  const [showCoolerModal, setShowCoolerModal] = useState(false);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [warehouseOpen, setWarehouseOpen] = useState(false);
  const [, force] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => force((n) => n + 1), 500);
    return () => clearInterval(interval);
  }, []);

  const tr = (ru: string, uk: string, en: string) => lang === 'ru' ? ru : (lang === 'uk' ? uk : en);

  const mine = getMineById(currentMineId);
  const dumpMine = isDumpMine(currentMineId);
  const baseTemp = mine.environment?.baseTemperature ?? 15;

  const activeCoolers = ls.coolers.filter((c) => c.active && c.durability > 0);
  const tempReduction = activeCoolers.reduce((sum, c) => {
    const cfg = COOLER_CONFIGS[c.type];
    return sum + (cfg.modeConfigs[c.mode]?.tempReduction ?? 0);
  }, 0);
  const currentTemp = baseTemp - tempReduction;

  const activeTank = ls.activeOxygenTankId
    ? ls.oxygenTanks.find((t) => t.id === ls.activeOxygenTankId)
    : ls.oxygenTanks.find((t) => t.currentOxygen > 0);
  const spareTanks = ls.oxygenTanks.filter((t) => t !== activeTank && t.currentOxygen > 0);
  const needsOxygen = currentMineId >= 3;

  const tier = getPickaxeTier(state.activePickaxeTierId);
  const isShovel = isUnlimitedDurability(state.activePickaxeTierId);
  const hasActiveLease = state.activeLeaseEndsAt && state.activeLeaseEndsAt > Date.now();
  const hasLeaseOrDump = dumpMine || hasActiveLease;
  const canDig = state.energy >= tier.energyCost && state.activePickaxe && (isShovel || state.activePickaxe.durability >= tier.durabilityCost) && hasLeaseOrDump;

  const oreColors: Record<number, string> = {
    0: '#8a8a8a', 1: '#9a9a9a', 2: '#5a5a6a', 3: '#5a5a6a',
    4: '#6a6a7a', 5: '#c0c0c8', 6: '#c0c0c8', 7: '#d0d0d8',
    8: '#e8c840', 9: '#e8c840', 10: '#f0d050',
  };
  const oreColor = oreColors[currentMineId] ?? '#9a9a9a';
  const oreSecondary = currentMineId >= 8 ? '#b8881a' : currentMineId >= 5 ? '#8a8a9a' : '#6a6a6a';

  const shelfCount = ls.shelfCount;
  const usedSpace = usedWarehouseSpace;
  const totalSpace = totalWarehouseSpace;
  const shelfItems = buildShelfItems(ls, state.fuel.canisters);
  const foodCabinetCount = state.craftInventory?.food_cabinet ?? 0;
  const hasFoodCabinet = foodCabinetCount > 0;
  const totalFoodCount = Object.values(state.foodInventory ?? {}).reduce((sum, n) => sum + n, 0);

  const coolerActive = activeCoolers.length > 0;
  const firstCooler = ls.coolers[0];

  const totalCharge = ls.batteries.reduce((sum, b) => sum + b.currentCharge, 0);
  const totalOxygen = ls.oxygenTanks.reduce((sum, t) => sum + t.currentOxygen, 0);
  const totalDiesel = state.fuel.canisters.reduce((sum, c) => sum + c.currentFuel, 0);

  return (
    <>
      {/* ============ MINE ROOM SCENE — REDESIGNED ============ */}
      <div
        className="relative w-full rounded-2xl overflow-hidden shadow-2xl select-none"
        style={{
          minHeight: '440px',
          background: `
            radial-gradient(ellipse at 50% 90%, rgba(60,52,42,0.5) 0%, transparent 70%),
            radial-gradient(ellipse at 70% 20%, rgba(80,70,55,0.25) 0%, transparent 50%),
            linear-gradient(180deg, #2e2a24 0%, #3a3528 20%, #2e2820 60%, #1f1c16 100%)
          `,
        }}
      >
        {/* Stone texture noise overlay */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(circle at 15% 25%, rgba(80,70,60,0.15) 1px, transparent 2px),
              radial-gradient(circle at 75% 15%, rgba(90,80,70,0.12) 1px, transparent 2px),
              radial-gradient(circle at 45% 55%, rgba(70,60,50,0.1) 1px, transparent 2px),
              radial-gradient(circle at 85% 75%, rgba(80,70,60,0.13) 1px, transparent 2px),
              radial-gradient(circle at 25% 85%, rgba(60,55,45,0.1) 1px, transparent 2px)
            `,
            backgroundSize: '80px 80px, 120px 120px, 100px 100px, 90px 90px, 110px 110px',
          }}
        />

        {/* ===== DEEP TUNNEL PERSPECTIVE — full width backdrop ===== */}
        <div className="absolute inset-0 pointer-events-none" style={{ perspective: '400px' }}>
          {/* Tunnel walls converging to center-back */}
          <div
            className="absolute left-0 top-[10%] bottom-[25%] w-full"
            style={{
              transform: 'rotateX(0deg)',
              background: `
                linear-gradient(90deg,
                  rgba(20,18,15,0.95) 0%,
                  rgba(30,27,22,0.5) 15%,
                  rgba(25,22,18,0.15) 40%,
                  rgba(25,22,18,0.15) 60%,
                  rgba(30,27,22,0.5) 85%,
                  rgba(20,18,15,0.95) 100%
                )
              `,
            }}
          />
          {/* Tunnel ceiling arch — darker at top, vanishing to center */}
          <div
            className="absolute left-0 right-0 top-0 h-[35%]"
            style={{
              background: `radial-gradient(ellipse at 50% 100%, transparent 10%, rgba(15,12,10,0.7) 40%, rgba(10,8,5,0.95) 100%)`,
            }}
          />
          {/* Distant dark — the end of the tunnel */}
          <div
            className="absolute left-1/2 top-[20%] -translate-x-1/2 w-[40%] h-[50%] rounded-full"
            style={{
              background: 'radial-gradient(ellipse, rgba(5,4,3,0.9) 0%, transparent 70%)',
            }}
          />
          {/* Support beams — going into perspective */}
          {[0, 1, 2, 3].map((i) => {
            const scale = 1 - i * 0.2;
            const opacity = 0.4 - i * 0.08;
            const left = 50 + (i * 8 - 12);
            return (
              <div
                key={i}
                className="absolute"
                style={{
                  left: `${left}%`,
                  top: `${15 + i * 5}%`,
                  width: `${30 * scale}%`,
                  height: `${60 * scale}%`,
                  opacity,
                  borderLeft: '2px solid #3d2b1f',
                  borderRight: '2px solid #3d2b1f',
                  borderTop: '3px solid #4a3220',
                  borderRadius: '8px 8px 0 0',
                  transform: `perspective(200px) rotateX(5deg)`,
                }}
              />
            );
          })}
        </div>

        {/* ===== RAILS ROAD — center-bottom going into tunnel ===== */}
        <div className="absolute left-0 right-0 bottom-0 h-[120px] pointer-events-none" style={{ perspective: '300px' }}>
          {/* Ground/floor */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, rgba(20,18,15,0.3) 0%, rgba(30,27,22,0.7) 100%)',
              transform: 'rotateX(45deg)',
              transformOrigin: 'bottom center',
            }}
          />
          {/* Two rails converging toward tunnel */}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2"
            style={{ width: '100%', height: '100px' }}
          >
            {/* Left rail */}
            <div
              className="absolute"
              style={{
                bottom: '0',
                left: '20%',
                width: '60%',
                height: '3px',
                background: 'linear-gradient(90deg, #2a2a2a 0%, #6a6a6a 50%, #4a4a4a 100%)',
                transform: 'perspective(200px) rotateX(55deg) scaleY(1.5)',
                transformOrigin: 'bottom center',
                boxShadow: '0 1px 2px rgba(0,0,0,0.5)',
              }}
            />
            {/* Right rail */}
            <div
              className="absolute"
              style={{
                bottom: '0',
                left: '20%',
                width: '60%',
                height: '3px',
                marginTop: '20px',
                background: 'linear-gradient(90deg, #2a2a2a 0%, #6a6a6a 50%, #4a4a4a 100%)',
                transform: 'perspective(200px) rotateX(55deg) scaleY(1.5) translateY(20px)',
                transformOrigin: 'bottom center',
                boxShadow: '0 1px 2px rgba(0,0,0,0.5)',
              }}
            />
            {/* Rail ties (sleepers) */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
              const progress = i / 7;
              const width = 50 + progress * 30;
              const left = 50 - width / 2;
              const bottom = progress * 80;
              const scale = 0.4 + progress * 0.6;
              return (
                <div
                  key={i}
                  className="absolute rounded-sm"
                  style={{
                    left: `${left}%`,
                    bottom: `${bottom}px`,
                    width: `${width}%`,
                    height: `${4 * scale}px`,
                    background: `linear-gradient(180deg, #3d2b1f, #5a3d2a)`,
                    opacity: 0.6 + progress * 0.3,
                    transform: 'perspective(200px) rotateX(55deg)',
                    transformOrigin: 'bottom center',
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* ===== LEFT: COOLER + FOOD CABINET ===== */}
        <div className="absolute left-0 top-0 bottom-0 w-[22%] z-10">
          {/* Cooler */
          ls.coolers.length > 0 ? (
            <button
              onClick={() => setShowCoolerModal(true)}
              className="relative transition-transform hover:scale-105"
              style={{ width: '60px', height: '44px', marginTop: '12px', marginLeft: '8px' }}
            >
              <div className="absolute inset-0 rounded-md"
                style={{
                  background: coolerActive
                    ? 'linear-gradient(180deg, #1a4a5a 0%, #0d3040 50%, #082030 100%)'
                    : 'linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 50%, #1a1a1a 100%)',
                  border: '1px solid rgba(0,0,0,0.4)',
                  boxShadow: coolerActive
                    ? '0 0 12px rgba(6,182,212,0.25), 0 3px 8px rgba(0,0,0,0.4)'
                    : '0 3px 8px rgba(0,0,0,0.4)',
                }}>
                <div className="absolute top-1 left-1 right-1 bottom-3 rounded-sm overflow-hidden"
                  style={{ background: 'rgba(0,0,0,0.3)' }}>
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-0.5 w-full"
                      style={{ marginTop: '2px', background: coolerActive ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.04)' }} />
                  ))}
                </div>
                <div className="absolute bottom-1 right-1.5 w-1.5 h-1.5 rounded-full"
                  style={{
                    background: coolerActive ? '#22c55e' : '#525252',
                    boxShadow: coolerActive ? '0 0 4px #22c55e' : 'none',
                  }} />
                {coolerActive && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
                    style={{
                      animation: 'spin 1.5s linear infinite',
                      background: `conic-gradient(from 0deg, transparent, rgba(6,182,212,0.2), transparent, rgba(6,182,212,0.2), transparent)`,
                    }} />
                )}
              </div>
              <div className="absolute -bottom-4 left-0 right-0 text-center">
                <span className="text-[7px] font-bold text-neutral-500">
                  {coolerActive ? `${getCoolerDurabilityPct(firstCooler)}%` : tr('вимк', 'вимк', 'off')}
                </span>
              </div>
            </button>
          ) : (
            <div className="relative opacity-40" style={{ width: '50px', height: '36px', marginTop: '12px', marginLeft: '8px' }}>
              <div className="absolute inset-0 rounded-md"
                style={{ background: 'linear-gradient(180deg, #2a2a2a, #1a1a1a)', border: '1px dashed rgba(255,255,255,0.1)' }} />
            </div>
          )}

          {/* Food Cabinet */}
          <div className="absolute bottom-3 left-2 right-2">
            <button
              onClick={() => setShowFoodModal(true)}
              className="relative rounded-md transition-all w-full hover:opacity-100 hover:scale-105 cursor-pointer"
              style={{ height: '60px' }}
            >
              <div className="absolute inset-0 rounded-md"
                style={{
                  background: hasFoodCabinet
                    ? 'linear-gradient(180deg, #5a4530 0%, #4a3825 50%, #3d2e1c 100%)'
                    : 'linear-gradient(180deg, #3a3025 0%, #2e251c 50%, #251d15 100%)',
                  border: '1px solid rgba(0,0,0,0.3)',
                  boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.05), 0 2px 6px rgba(0,0,0,0.3)',
                }}>
                <div className="absolute top-0 bottom-0 left-1/2 w-px" style={{ background: 'rgba(0,0,0,0.4)' }} />
                <div className="absolute top-1/2 -translate-y-1/2 left-[40%] w-1 h-4 rounded-sm" style={{ background: '#8a7a5a' }} />
                <div className="absolute top-1/2 -translate-y-1/2 right-[40%] w-1 h-4 rounded-sm" style={{ background: '#8a7a5a' }} />
                {hasFoodCabinet && (
                  <div className="absolute inset-0 rounded-md" style={{ boxShadow: 'inset 0 0 8px rgba(34,197,94,0.15)' }} />
                )}
              </div>
              <div className="absolute -bottom-4 left-0 right-0 text-center">
                <span className="text-[8px] font-bold text-neutral-500">{tr('Шафа', 'Шафа', 'Cabinet')}</span>
              </div>
            </button>
          </div>
        </div>

        {/* ===== CENTER: WAREHOUSE DOOR — integrated into tunnel wall, rails wrap around ===== */}
        <div className="absolute left-[22%] right-[44%] top-[15%] bottom-[20%] flex flex-col items-center justify-center z-10">
          <button
            onClick={() => setWarehouseOpen(true)}
            className="group relative flex flex-col items-center transition-transform hover:scale-105"
          >
            {/* Stone arch above door */}
            <div className="w-[80px] h-[20px] mx-auto rounded-t-full"
              style={{
                background: 'linear-gradient(180deg, #3a352d, #2e2920)',
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.03), 0 -2px 6px rgba(0,0,0,0.3)',
              }} />
            {/* Door frame — set into wall */}
            <div className="relative w-[72px] mx-auto rounded-b-md overflow-hidden"
              style={{
                height: '110px',
                background: 'linear-gradient(180deg, #2a2520 0%, #1e1a15 100%)',
                border: '2px solid #3a3225',
                borderTop: 'none',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.7), 0 4px 12px rgba(0,0,0,0.5)',
              }}>
              {/* Metal door panels */}
              <div className="absolute inset-1 rounded-sm grid grid-cols-2 grid-rows-3 gap-0.5">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="rounded-sm"
                    style={{
                      background: `linear-gradient(${135 + (i % 2) * 45}deg, #3d3528, #2a2418, #3d3528)`,
                      border: '1px solid rgba(0,0,0,0.2)',
                      boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.03)',
                    }} />
                ))}
              </div>
              {/* Door handle */}
              <div className="absolute top-1/2 right-1.5 w-2 h-2 rounded-full"
                style={{ background: 'radial-gradient(circle, #d4a843, #8a6f20)', boxShadow: '0 0 3px rgba(212,168,67,0.4)' }} />
              {/* Warning sign */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-5 h-3 rounded-sm flex items-center justify-center"
                style={{ background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(251,146,60,0.3)' }}>
                <span className="text-[6px] font-bold text-orange-400/60">{tr('СКЛАД', 'СКЛАД', 'WH')}</span>
              </div>
              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-sm"
                style={{ boxShadow: 'inset 0 0 15px rgba(251,191,36,0.15)' }} />
            </div>
            {/* Space indicator */}
            <div className="mt-2 flex flex-col items-center gap-0.5">
              <div className="w-[60px] h-1 rounded-full bg-black/40 overflow-hidden">
                <div
                  className={`h-full transition-all ${usedSpace / totalSpace > 0.9 ? 'bg-red-500' : usedSpace / totalSpace > 0.7 ? 'bg-amber-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(100, (usedSpace / totalSpace) * 100)}%` }}
                />
              </div>
              <span className="text-[8px] text-neutral-500 tabular-nums">{usedSpace}/{totalSpace}м²</span>
            </div>
          </button>
        </div>

        {/* ===== RIGHT: ORE MOUNTAIN — compact, harmonious with tunnel ===== */}
        <div className="absolute right-0 bottom-[80px] top-[20%] w-[34%] z-10 flex flex-col items-center justify-end">
          <button
            onClick={onOreVeinClick}
            className="relative transition-transform hover:scale-105 cursor-pointer w-full h-full flex items-center justify-center"
            style={{ marginTop: '0' }}
          >
            {/* Mountain shape — rising to the ceiling */}
            <div className="relative w-full h-full flex items-end justify-center">
              {/* Back layer — dark rock */}
              <div className="absolute bottom-0 right-0 left-0"
                style={{
                  height: '60%',
                  background: `
                    radial-gradient(ellipse at 60% 100%, ${oreSecondary} 0%, #2a2520 40%, #1a1510 100%)
                  `,
                  clipPath: 'polygon(15% 100%, 0% 100%, 0% 20%, 30% 5%, 55% 0%, 80% 10%, 100% 5%, 100% 100%, 85% 100%)',
                }}
              />
              {/* Front layer — ore-rich rock */}
              <div className="absolute bottom-0 right-0 left-0"
                style={{
                  height: '50%',
                  background: `
                    radial-gradient(ellipse at 50% 80%, ${oreColor} 0%, ${oreSecondary} 35%, #2a2520 70%, #1a1510 100%)
                  `,
                  clipPath: 'polygon(10% 100%, 0% 100%, 0% 30%, 20% 10%, 45% 0%, 70% 15%, 100% 5%, 100% 100%, 90% 100%)',
                  boxShadow: canDig
                    ? `inset 0 0 40px ${oreColor}30`
                    : 'inset 0 0 20px rgba(0,0,0,0.5)',
                }}
              >
                {/* Ore specks — shiny bits */}
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className="absolute rounded-sm"
                    style={{
                      width: `${2 + (i % 3)}px`,
                      height: `${2 + (i % 3)}px`,
                      left: `${10 + i * 11}%`,
                      top: `${15 + (i % 5) * 15}%`,
                      background: oreColor,
                      opacity: 0.8,
                      boxShadow: `0 0 4px ${oreColor}80`,
                    }} />
                ))}
                {/* Texture lines */}
                <div className="absolute inset-0 opacity-15"
                  style={{
                    background: `repeating-linear-gradient(55deg, transparent, transparent 8px, rgba(0,0,0,0.2) 8px, rgba(0,0,0,0.2) 9px)`,
                  }} />
              </div>

              {/* Glow when diggable */}
              {canDig && (
                <div className="absolute inset-0 pointer-events-none animate-pulse"
                  style={{ boxShadow: `inset 0 0 60px ${oreColor}15` }} />
              )}

              {/* Click hint */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                <div className="text-[10px] font-bold text-neutral-400 bg-black/50 px-2 py-1 rounded-lg flex items-center gap-1 animate-pulse">
                  {tr('Копать', 'Копати', 'Dig')}
                  <span className="text-[8px]">→</span>
                </div>
              </div>

              {/* Floating particles when can dig */}
              {canDig && [0, 1, 2, 3].map((i) => (
                <div key={i} className="absolute rounded-full pointer-events-none"
                  style={{
                    width: '3px',
                    height: '3px',
                    left: `${20 + i * 20}%`,
                    bottom: `${30 + (i % 2) * 25}px`,
                    background: oreColor,
                    opacity: 0.6,
                    animation: `float-up ${2 + i * 0.3}s ease-out infinite`,
                    animationDelay: `${i * 0.4}s`,
                  }} />
              ))}
            </div>
          </button>
        </div>

        {/* ===== HUD: Top-left (temperature + oxygen) ===== */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
          {/* Temperature */}
          <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-2 h-3 rounded-sm shrink-0"
              style={{
                background: currentTemp < 10 ? '#06b6d4' : '#f97316',
                boxShadow: `0 0 4px ${currentTemp < 10 ? '#06b6d4' : '#f97316'}80`,
              }} />
            <span className="text-[11px] font-bold text-neutral-100 tabular-nums">{currentTemp.toFixed(0)}°C</span>
          </div>
          {/* Oxygen */}
          <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-2.5 h-2.5 rounded-full shrink-0 border"
              style={{
                borderColor: needsOxygen ? '#06b6d4' : '#22c55e',
                background: needsOxygen ? 'rgba(6,182,212,0.2)' : 'rgba(34,197,94,0.2)',
                boxShadow: `0 0 4px ${needsOxygen ? '#06b6d4' : '#22c55e'}60`,
              }} />
            <span className="text-[11px] font-bold text-neutral-100 tabular-nums">
              {needsOxygen ? (activeTank ? `${activeTank.currentOxygen.toFixed(0)}Л` : '—') : tr('OK', 'OK', 'OK')}
            </span>
            {spareTanks.length > 0 && (
              <span className="text-[9px] text-cyan-400/60">+{spareTanks.length}</span>
            )}
          </div>
        </div>

        {/* ===== HUD: Top-right (balance + gems) ===== */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 z-20 items-end">
          <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: '#22c55e', boxShadow: '0 0 4px #22c55e60' }} />
            <span className="text-[11px] font-bold text-green-400 tabular-nums">{formatMoney(state.balance)}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-2.5 h-2.5 shrink-0" style={{ background: '#06b6d4', clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', boxShadow: '0 0 4px #06b6d460' }} />
            <span className="text-[11px] font-bold text-cyan-400 tabular-nums">{state.gems}</span>
          </div>
        </div>

        {/* ===== HUD: Bottom bar (total charge, oxygen, diesel) ===== */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-2 z-20">
          <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Battery className="w-3 h-3 text-green-400 shrink-0" />
            <span className="text-[10px] font-bold text-green-400 tabular-nums">{totalCharge.toFixed(0)}МВт</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Wind className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="text-[10px] font-bold text-cyan-400 tabular-nums">{totalOxygen.toFixed(0)}Л</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Fuel className="w-3 h-3 text-orange-400 shrink-0" />
            <span className="text-[10px] font-bold text-orange-400 tabular-nums">{totalDiesel.toFixed(0)}Л</span>
          </div>
        </div>

        {/* CSS keyframes */}
        <style>{`
          @keyframes flicker {
            0% { opacity: 0.8; }
            50% { opacity: 1; }
            100% { opacity: 0.7; }
          }
          @keyframes spin {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
          }
          @keyframes float-up {
            0% { transform: translateY(0) scale(1); opacity: 0.6; }
            100% { transform: translateY(-30px) scale(0.5); opacity: 0; }
          }
        `}</style>
      </div>

      {/* ============ WAREHOUSE INTERIOR MODAL ============ */}
      {warehouseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={() => setWarehouseOpen(false)}>
          <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: 'linear-gradient(180deg, #1e1c18 0%, #2a2620 30%, #1e1c18 100%)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
            onClick={(e) => e.stopPropagation()}>

            <div className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle at 30% 20%, rgba(80,70,60,0.1) 1px, transparent 2px), radial-gradient(circle at 70% 60%, rgba(90,80,70,0.1) 1px, transparent 2px)`,
                backgroundSize: '60px 60px, 80px 80px',
              }} />

            {/* Header */}
            <div className="relative flex items-center justify-between p-4 border-b border-white/5">
              <span className="text-sm font-bold text-neutral-300">{tr('Склад', 'Склад', 'Warehouse')} — {usedSpace}/{totalSpace}м²</span>
              <div className="flex items-center gap-2">
                {shelfCount < 6 && (
                  <button onClick={buyShelf} disabled={(state.craftInventory?.shelf ?? 0) < 1}
                    className={`text-[10px] px-2 py-1 rounded-lg font-bold ${(state.craftInventory?.shelf ?? 0) >= 1 ? 'bg-accent-500 text-white' : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'}`}>
                    <Plus className="w-2.5 h-2.5 inline mr-0.5" />{tr('Стелаж', 'Стелаж', 'Shelf')}
                  </button>
                )}
                <button onClick={() => setWarehouseOpen(false)} className="text-neutral-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Warehouse room with shelves */}
            <div className="relative p-4 space-y-3" style={{ minHeight: '300px' }}>
              <div className="space-y-3">
                {Array.from({ length: Math.min(shelfCount, 6) }).map((_, shelfIdx) => {
                  const items = shelfItems[shelfIdx] || [];
                  return (
                    <div key={shelfIdx} className="relative">
                      <div className="relative h-[36px] rounded-sm flex items-end gap-0.5 px-1.5 pb-0.5"
                        style={{
                          background: 'linear-gradient(180deg, #4a3825 0%, #3d2e1c 60%, #2e2215 100%)',
                          border: '1px solid rgba(0,0,0,0.3)',
                          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.04), 0 2px 4px rgba(0,0,0,0.3)',
                        }}>
                        <div className="absolute -left-1 top-0 w-1 h-full rounded-l-sm" style={{ background: '#3d2e1c' }} />
                        <div className="absolute -right-1 top-0 w-1 h-full rounded-r-sm" style={{ background: '#3d2e1c' }} />
                        {items.length === 0 ? (
                          <div className="flex-1 flex items-center justify-center">
                            <span className="text-[8px] text-neutral-700">{tr('порожньо', 'порожньо', 'empty')}</span>
                          </div>
                        ) : (
                          items.map((item, i) => <ShelfItemVisual key={i} item={item} />)
                        )}
                      </div>
                    </div>
                  );
                })}
                {Array.from({ length: 6 - Math.min(shelfCount, 6) }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-[36px] rounded-sm border border-dashed border-white/5 flex items-center justify-center">
                    <span className="text-[8px] text-neutral-700">{tr('— порожній слот —', '— порожній слот —', '— empty slot —')}</span>
                  </div>
                ))}
              </div>

              {/* Generator section */}
              {ls.generator.purchased && (
                <div className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm" style={{ background: ls.generator.active ? '#f97316' : '#525252', boxShadow: ls.generator.active ? '0 0 4px #f9731660' : 'none' }} />
                      {tr('Генератор', 'Генератор', 'Generator')}
                    </span>
                    <button onClick={toggleGenerator}
                      className={`text-[10px] px-2 py-1 rounded font-bold ${ls.generator.active ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                      <Power className="w-2.5 h-2.5 inline mr-0.5" />
                      {ls.generator.active ? tr('Стоп', 'Стоп', 'Stop') : tr('Старт', 'Старт', 'Start')}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] text-neutral-500 w-8">{tr('Паливо', 'Паливо', 'Fuel')}</span>
                    <div className="flex-1 h-2 rounded-full bg-black/40 overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${(ls.generator.fuelLiters / ls.generator.tankCapacity) * 100}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-neutral-400 tabular-nums">{ls.generator.fuelLiters.toFixed(0)}Л</span>
                  </div>
                  <button onClick={refuelGenerator} disabled={ls.generator.fuelLiters >= ls.generator.tankCapacity}
                    className="w-full text-[10px] py-1 rounded font-bold bg-amber-600/30 text-amber-400 disabled:opacity-40">
                    <Plus className="w-2.5 h-2.5 inline mr-0.5" />
                    {tr('Заправити з каністр', 'Заправити з каністр', 'Refuel from canisters')}
                  </button>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    {Array.from({ length: GENERATOR_LITHIUM_SLOTS }).map((_, slotIdx) => {
                      const batteryId = ls.generator.lithiumBatteryIds[slotIdx];
                      const battery = batteryId ? ls.batteries.find((b) => b.id === batteryId) : null;
                      return (
                        <div key={slotIdx} className="rounded-md p-1.5 flex items-center justify-between"
                          style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)' }}>
                          {battery ? (
                            <>
                              <span className="text-[9px] font-bold text-violet-400">{battery.currentCharge.toFixed(0)}МВт</span>
                              <button onClick={() => removeLithiumBattery(battery.id)} className="text-red-400">
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                            </>
                          ) : (
                            <div className="flex gap-0.5 w-full justify-center flex-wrap">
                              {ls.batteries.filter((b) => b.type === 'battery_lithium' && !ls.generator.lithiumBatteryIds.includes(b.id)).slice(0, 2).map((b) => (
                                <button key={b.id} onClick={() => insertLithiumBattery(b.id)}
                                  className="text-[8px] px-1 py-0.5 rounded border border-violet-500/30 text-violet-400">
                                  <Plus className="w-2 h-2 inline" />{b.currentCharge.toFixed(0)}
                                </button>
                              ))}
                              {ls.batteries.filter((b) => b.type === 'battery_lithium' && !ls.generator.lithiumBatteryIds.includes(b.id)).length === 0 && (
                                <span className="text-[8px] text-neutral-600">{tr('порожньо', 'порожньо', 'empty')}</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty canister sell section */}
              {state.fuel.canisters.some((c) => c.currentFuel === 0) && (
                <div className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="text-[10px] font-bold text-neutral-400 mb-2">{tr('Порожні каністри', 'Порожні каністри', 'Empty canisters')}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {state.fuel.canisters.filter((c) => c.currentFuel === 0).map((c) => (
                      <button key={c.id} onClick={() => sellCanister(c.id)}
                        className="text-[9px] px-2 py-1 rounded font-bold bg-green-500/20 text-green-400 hover:bg-green-500/30">
                        {tr('Продати', 'Продати', 'Sell')} 500$
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============ COOLER CONTROL MODAL ============ */}
      {showCoolerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={() => setShowCoolerModal(false)}>
          <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: 'linear-gradient(180deg, #1e1c18 0%, #2a2620 50%, #1e1c18 100%)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
            onClick={(e) => e.stopPropagation()}>

            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <span className="text-sm font-bold text-neutral-300">{tr('Охолодження', 'Охолодження', 'Cooling')}</span>
              <button onClick={() => setShowCoolerModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {ls.coolers.map((cooler) => {
                const cfg = COOLER_CONFIGS[cooler.type];
                const pct = getCoolerDurabilityPct(cooler);
                const remaining = getCoolerRemainingSec(cooler);
                const isBroken = cooler.durability <= 0;
                return (
                  <div key={cooler.id} className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-neutral-300">{tr(cfg.nameRu, cfg.nameUk, cfg.nameEn)}</span>
                      <span className={`text-[10px] font-bold ${isBroken ? 'text-red-400' : cooler.active ? 'text-green-400' : 'text-neutral-500'}`}>
                        {isBroken ? tr('Зламаний', 'Зламаний', 'Broken') : cooler.active ? tr('Працює', 'Працює', 'Active') : tr('Вимк', 'Вимк', 'Off')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] text-neutral-500 w-12">{tr('Міцність', 'Міцність', 'Durability')}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-black/40 overflow-hidden">
                        <div className={`h-full ${pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[9px] text-neutral-400 tabular-nums w-16 text-right">{pct}% · {formatRemaining(remaining)}</span>
                    </div>

                    <div className="flex gap-1.5">
                      {isBroken ? (
                        <button onClick={() => repairCooler(cooler.id)} disabled={state.balance < cfg.repairPrice}
                          className="flex-1 text-[10px] py-1.5 rounded-lg font-bold bg-amber-600/30 text-amber-400 disabled:opacity-40">
                          <Wrench className="w-3 h-3 inline mr-0.5" />{tr('Ремонт', 'Ремонт', 'Repair')} {formatMoney(cfg.repairPrice)}
                        </button>
                      ) : (
                        <button onClick={() => toggleCooler(cooler.id)}
                          className={`flex-1 text-[10px] py-1.5 rounded-lg font-bold ${cooler.active ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                          <Power className="w-3 h-3 inline mr-0.5" />
                          {cooler.active ? tr('Вимкнути', 'Вимкнути', 'Turn off') : tr('Увімкнути', 'Увімкнути', 'Turn on')}
                        </button>
                      )}
                    </div>

                    {cfg.hasModes && !isBroken && (
                      <div className="flex gap-1 mt-2">
                        {cfg.modes.map((m) => {
                          const mc = cfg.modeConfigs[m];
                          const labels: Record<CoolerMode, string> = {
                            eco: tr('Еко', 'Еко', 'Eco'), normal: tr('Норм', 'Норм', 'Norm'), full: tr('Макс', 'Макс', 'Full'),
                          };
                          return (
                            <button key={m} onClick={() => setCoolerMode(cooler.id, m)}
                              className={`flex-1 py-1 text-[9px] rounded font-bold transition-all ${cooler.mode === m ? 'bg-cyan-500 text-white' : 'bg-black/30 text-neutral-500'}`}>
                              {labels[m]} -{mc.tempReduction}°C
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {ls.coolers.length === 0 && (
                <div className="text-center py-6 text-neutral-600 text-xs">{tr('Охолоджувачі не куплені', 'Охолоджувачі не куплені', 'No coolers purchased')}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============ FOOD CABINET MODAL ============ */}
      {showFoodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={() => setShowFoodModal(false)}>
          <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: 'linear-gradient(180deg, #1e1c18 0%, #2a2620 50%, #1e1c18 100%)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
            onClick={(e) => e.stopPropagation()}>

            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <span className="text-sm font-bold text-neutral-300">{tr('Шафа з їжею', 'Шафа з їжею', 'Food Cabinet')}</span>
              <button onClick={() => setShowFoodModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-2">
              {!hasFoodCabinet && (
                <div className="text-center py-3 mb-2 rounded-lg" style={{ background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.2)' }}>
                  <span className="text-xs text-orange-400 font-medium">
                    {tr('Шафи немає. Ліміт зберігання їжі: 5 шт.', 'Шафи немає. Ліміт зберігання їжі: 5 шт.', 'No cabinet purchased. Food storage limit: 5 items.')}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs mb-2 px-1">
                <span className="text-neutral-500">{tr('Зберігання їжі', 'Зберігання їжі', 'Food storage')}</span>
                <span className="font-bold text-neutral-300">
                  {totalFoodCount} / {hasFoodCabinet ? 100 : 5} {tr('шт.', 'шт.', 'pcs.')}
                </span>
              </div>
              {FOOD_ITEMS.map((food) => {
                const count = state.foodInventory?.[food.id] ?? 0;
                const name = lang === 'ru' ? food.nameRu : (lang === 'uk' ? food.nameUk : food.nameEn);
                const Icon = food.id === 'snickers' ? Candy : food.id === 'juice' ? CupSoda : Cookie;
                return (
                  <div key={food.id}
                    className="flex items-center justify-between rounded-lg p-3"
                    style={{ background: count > 0 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: food.color + '20' }}>
                        <Icon className="w-4 h-4" style={{ color: food.color }} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-neutral-200">{name}</div>
                        <div className="text-[10px] text-neutral-500">
                          {food.energyBoost > 0 && <span>+{food.energyBoost} {tr('енергія', 'енергія', 'energy')} </span>}
                          {food.regenMultiplier > 1 && <span>×{food.regenMultiplier} {tr('реген', 'реген', 'regen')}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${count > 0 ? 'text-accent-400' : 'text-neutral-600'}`}>×{count}</span>
                      <button
                        onClick={() => eatFood(food.id)}
                        disabled={count <= 0}
                        className={`text-[10px] px-3 py-1.5 rounded-lg font-bold ${count > 0 ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-neutral-700 text-neutral-600 cursor-not-allowed'}`}>
                        {tr('З\'їсти', 'З\'їсти', 'Eat')}
                      </button>
                    </div>
                  </div>
                );
              })}

              {FOOD_ITEMS.every((f) => (state.foodInventory?.[f.id] ?? 0) === 0) && (
                <div className="text-center py-6 text-neutral-600 text-xs">
                  {tr('Шафа порожня. Купіть їжу в магазині.', 'Шафа порожня. Купіть їжу в магазині.', 'Cabinet is empty. Buy food in the shop.')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ===== SHELF ITEM VISUAL COMPONENT =====
function ShelfItemVisual({ item }: { item: ShelfItem }) {
  if (item.kind === 'generator') {
    return (
      <div className="relative shrink-0 rounded-sm" style={{ width: item.w, height: item.h }}>
        <div className="absolute inset-0 rounded-sm"
          style={{
            background: 'linear-gradient(180deg, #d97316 0%, #b8530f 50%, #8a3d0a 100%)',
            border: '1px solid rgba(0,0,0,0.3)',
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1)',
          }} />
        <div className="absolute top-0.5 left-0.5 right-0.5 h-0.5 rounded-sm" style={{ background: 'rgba(0,0,0,0.3)' }} />
        <div className="absolute top-1 right-0.5 w-1 h-1 rounded-full" style={{ background: '#333' }} />
      </div>
    );
  }

  if (item.kind === 'battery') {
    const chargePct = item.max > 0 ? (item.charge / item.max) * 100 : 0;
    return (
      <div className="relative shrink-0 rounded-sm" style={{ width: item.w, height: item.h }}>
        <div className="absolute inset-0 rounded-sm"
          style={{
            background: `linear-gradient(180deg, ${item.color}cc 0%, ${item.color}88 50%, ${item.color}44 100%)`,
            border: '1px solid rgba(0,0,0,0.3)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1)',
          }} />
        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-0.5 rounded-sm" style={{ background: '#888' }} />
        <div className="absolute bottom-0 left-0 right-0 rounded-b-sm transition-all"
          style={{ height: `${chargePct}%`, background: `${item.color}60` }} />
        <div className="absolute top-1/3 left-0 right-0 h-px" style={{ background: 'rgba(0,0,0,0.15)' }} />
      </div>
    );
  }

  if (item.kind === 'oxygen') {
    const oxygenPct = item.max > 0 ? (item.oxygen / item.max) * 100 : 0;
    return (
      <div className="relative shrink-0" style={{ width: item.w, height: item.h }}>
        <div className="absolute inset-0 rounded-sm"
          style={{
            background: `linear-gradient(90deg, ${item.color}aa 0%, ${item.color}66 30%, ${item.color}aa 60%, ${item.color}44 100%)`,
            borderRadius: '40%',
            border: '1px solid rgba(0,0,0,0.3)',
            boxShadow: 'inset 0 0 2px rgba(255,255,255,0.1)',
          }} />
        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1 rounded-t-sm" style={{ background: '#666' }} />
        <div className="absolute bottom-0 left-0 right-0 rounded-b-sm transition-all"
          style={{ height: `${oxygenPct}%`, background: `${item.color}40` }} />
      </div>
    );
  }

  if (item.kind === 'canister') {
    return (
      <div className="relative shrink-0 rounded-sm" style={{ width: item.w, height: item.h }}>
        <div className="absolute inset-0 rounded-sm"
          style={{
            background: item.empty
              ? 'linear-gradient(180deg, #5a5a5a 0%, #4a4a4a 50%, #3a3a3a 100%)'
              : 'linear-gradient(180deg, #f97316 0%, #d97316 50%, #b8530f 100%)',
            border: '1px solid rgba(0,0,0,0.3)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.08)',
            opacity: item.empty ? 0.6 : 1,
          }} />
        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-0.5 rounded-sm"
          style={{ background: item.empty ? '#333' : '#1a1a1a' }} />
        <div className="absolute top-0.5 left-0.5 w-1 h-1 rounded-sm border"
          style={{ borderColor: 'rgba(0,0,0,0.3)', background: item.empty ? '#444' : '#a8530f' }} />
      </div>
    );
  }

  return null;
}
