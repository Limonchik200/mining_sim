import { useState, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { formatMoney } from '@/config';
import { getMineById, isDumpMine } from '@/config/minesConfig';
import { getPickaxeTier, isUnlimitedDurability } from '@/config/pickaxesConfig';
import { COOLER_CONFIGS, getCoolerDurabilityPct, getCoolerRemainingSec } from '@/config/coolerConfig';
import { BATTERY_CONFIGS } from '@/config/batteryConfig';
import { OXYGEN_TANK_CONFIGS } from '@/config/oxygenConfig';
import { GENERATOR_LITHIUM_SLOTS } from '@/config/generatorConfig';
import type { CoolerMode, BatteryInstance, OxygenTank, FuelCanister } from '@/types/craft';
import { Power, Wrench, X, Plus, Minus } from 'lucide-react';

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

export default function MineRoomView({ onDigActivate }: { onDigActivate: () => void }) {
  const { state, lang, buyShelf, toggleCooler, setCoolerMode, repairCooler, toggleGenerator, refuelGenerator, insertLithiumBattery, removeLithiumBattery, sellCanister, usedWarehouseSpace, totalWarehouseSpace, currentMineId } = useGame();
  const ls = state.lifeSupport;
  const [showCoolerModal, setShowCoolerModal] = useState(false);
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
  const needsOxygen = currentMineId >= 2;

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

  const coolerActive = activeCoolers.length > 0;
  const firstCooler = ls.coolers[0];

  return (
    <>
      {/* ============ MINE ROOM SCENE ============ */}
      <div
        className="relative w-full rounded-2xl overflow-hidden shadow-2xl select-none"
        style={{
          minHeight: '440px',
          background: `
            radial-gradient(ellipse at 50% 80%, rgba(40,35,30,0.5) 0%, transparent 70%),
            radial-gradient(ellipse at 20% 30%, rgba(60,50,40,0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 40%, rgba(50,45,40,0.3) 0%, transparent 50%),
            linear-gradient(180deg, #1c1a17 0%, #2a2620 30%, #1e1c18 70%, #15130f 100%)
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

        {/* Cracks in stone */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `
            linear-gradient(105deg, transparent 48%, rgba(0,0,0,0.15) 49%, rgba(0,0,0,0.15) 49.5%, transparent 50%),
            linear-gradient(75deg, transparent 68%, rgba(0,0,0,0.1) 69%, transparent 70%)
          `,
          backgroundSize: '200px 100%, 150px 100%',
          backgroundPosition: '10% 30%, 70% 60%',
          backgroundRepeat: 'no-repeat',
        }} />

        {/* ===== LEFT: TUNNEL + COOLER ===== */}
        <div className="absolute left-0 top-0 bottom-0 w-[30%] sm:w-[26%]">
          {/* Cooler - drawn as floor AC unit (LEFT side) */}
          <div className="relative w-full flex justify-center" style={{ marginTop: '8px' }}>
            {ls.coolers.length > 0 ? (
              <button
                onClick={() => setShowCoolerModal(true)}
                className="relative transition-transform hover:scale-105"
                style={{ width: '70px', height: '50px' }}
              >
                {/* AC unit body */}
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

                  {/* Vent grille */}
                  <div className="absolute top-1 left-1 right-1 bottom-3 rounded-sm overflow-hidden"
                    style={{ background: 'rgba(0,0,0,0.3)' }}>
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="h-0.5 w-full"
                        style={{
                          marginTop: '2px',
                          background: coolerActive ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.04)',
                        }} />
                    ))}
                  </div>

                  {/* Status LED */}
                  <div className="absolute bottom-1 right-1.5 w-1.5 h-1.5 rounded-full"
                    style={{
                      background: coolerActive ? '#22c55e' : '#525252',
                      boxShadow: coolerActive ? '0 0 4px #22c55e' : 'none',
                    }} />

                  {/* Fan blades spinning when active */}
                  {coolerActive && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
                      style={{
                        animation: 'spin 1.5s linear infinite',
                        background: `conic-gradient(from 0deg, transparent, rgba(6,182,212,0.2), transparent, rgba(6,182,212,0.2), transparent)`,
                      }} />
                  )}
                </div>

                {/* Floor shadow */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full"
                  style={{ background: 'rgba(0,0,0,0.3)', filter: 'blur(2px)' }} />

                {/* Durability label */}
                <div className="absolute -bottom-4 left-0 right-0 text-center">
                  <span className="text-[7px] font-bold text-neutral-500">
                    {coolerActive ? `${getCoolerDurabilityPct(firstCooler)}%` : tr('вимк', 'вимк', 'off')}
                  </span>
                </div>
              </button>
            ) : (
              <div className="relative opacity-40" style={{ width: '60px', height: '40px' }}>
                <div className="absolute inset-0 rounded-md"
                  style={{ background: 'linear-gradient(180deg, #2a2a2a, #1a1a1a)', border: '1px dashed rgba(255,255,255,0.1)' }} />
                <div className="absolute -bottom-4 left-0 right-0 text-center">
                  <span className="text-[7px] text-neutral-700">{tr('немає', 'немає', 'none')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Tunnel perspective */}
          <div className="absolute inset-0 flex items-center justify-center pb-[120px]">
            <div className="relative w-full h-[200px]" style={{ perspective: '250px' }}>
              {/* Tunnel interior */}
              <div
                className="absolute inset-x-2 top-0 bottom-0 rounded-t-2xl"
                style={{
                  transform: 'rotateX(20deg) rotateY(-8deg)',
                  transformOrigin: 'bottom center',
                  background: `
                    linear-gradient(180deg,
                      rgba(5,5,5,0.95) 0%,
                      rgba(20,18,15,0.8) 40%,
                      rgba(30,27,22,0.5) 100%
                    )
                  `,
                  boxShadow: 'inset 0 8px 30px rgba(0,0,0,0.8), inset 0 -5px 15px rgba(0,0,0,0.5)',
                }}
              >
                {/* Tunnel arch top */}
                <div className="absolute top-0 left-0 right-0 h-8 rounded-t-2xl"
                  style={{ background: 'linear-gradient(180deg, rgba(10,8,5,0.9), transparent)' }} />

                {/* Support beams - wooden */}
                {[0, 1, 2].map((i) => (
                  <div key={i} className="absolute left-0 right-0 flex items-center"
                    style={{ top: `${15 + i * 28}%`, height: '3px' }}>
                    {/* Left post */}
                    <div className="w-1.5 h-full rounded-sm" style={{ background: 'linear-gradient(90deg, #3d2b1f, #5a3d2a, #3d2b1f)' }} />
                    {/* Crossbeam */}
                    <div className="flex-1 h-full" style={{ background: 'linear-gradient(180deg, #4a3220, #5a3d2a, #4a3220)' }} />
                    {/* Right post */}
                    <div className="w-1.5 h-full rounded-sm" style={{ background: 'linear-gradient(90deg, #3d2b1f, #5a3d2a, #3d2b1f)' }} />
                  </div>
                ))}

                {/* Rails on floor */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  <div className="w-0.5 h-16 rounded-sm" style={{ background: 'linear-gradient(180deg, #4a4a4a, #6a6a6a, #3a3a3a)' }} />
                  <div className="w-0.5 h-16 rounded-sm" style={{ background: 'linear-gradient(180deg, #4a4a4a, #6a6a6a, #3a3a3a)' }} />
                </div>
                {/* Rail ties */}
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="absolute left-1/2 -translate-x-1/2 w-3 h-1 rounded-sm"
                    style={{ bottom: `${4 + i * 4}px`, background: '#3d2b1f' }} />
                ))}

                {/* Glowing lanterns */}
                {[0, 1].map((i) => (
                  <div key={i} className="absolute rounded-full"
                    style={{
                      left: `${20 + i * 55}%`,
                      top: '20%',
                      width: '8px',
                      height: '8px',
                      background: 'radial-gradient(circle, #fbbf24 0%, #f59e0b 40%, transparent 70%)',
                      boxShadow: '0 0 12px 4px rgba(251,191,36,0.4), 0 0 24px 8px rgba(251,191,36,0.15)',
                      animation: `flicker ${2 + i * 0.5}s ease-in-out infinite alternate`,
                    }} />
                ))}
              </div>
            </div>
          </div>

          {/* Food Cabinet - drawn as real furniture */}
          <div className="absolute bottom-3 left-2 right-2">
            <div
              className={`relative rounded-md transition-all cursor-pointer ${hasFoodCabinet ? 'hover:scale-[1.02]' : 'opacity-60'}`}
              style={{ height: '70px' }}
              onClick={() => {}}
            >
              {/* Cabinet body */}
              <div className="absolute inset-0 rounded-md"
                style={{
                  background: hasFoodCabinet
                    ? 'linear-gradient(180deg, #5a4530 0%, #4a3825 50%, #3d2e1c 100%)'
                    : 'linear-gradient(180deg, #3a3025 0%, #2e251c 50%, #251d15 100%)',
                  border: '1px solid rgba(0,0,0,0.3)',
                  boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.05), 0 2px 6px rgba(0,0,0,0.3)',
                }}>
                {/* Wood grain lines */}
                <div className="absolute inset-0 rounded-md opacity-30"
                  style={{
                    background: `repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.1) 8px, rgba(0,0,0,0.1) 9px)`,
                  }} />

                {/* Cabinet doors split */}
                <div className="absolute top-0 bottom-0 left-1/2 w-px" style={{ background: 'rgba(0,0,0,0.4)' }} />

                {/* Handles */}
                <div className="absolute top-1/2 -translate-y-1/2 left-[40%] w-1 h-4 rounded-sm" style={{ background: '#8a7a5a' }} />
                <div className="absolute top-1/2 -translate-y-1/2 right-[40%] w-1 h-4 rounded-sm" style={{ background: '#8a7a5a' }} />

                {/* Top shelf line */}
                <div className="absolute top-1/3 left-1 right-1 h-px" style={{ background: 'rgba(0,0,0,0.2)' }} />

                {/* Food glow if has food */}
                {hasFoodCabinet && (
                  <div className="absolute inset-0 rounded-md"
                    style={{ boxShadow: 'inset 0 0 8px rgba(34,197,94,0.15)' }} />
                )}
              </div>

              {/* Label */}
              <div className="absolute -bottom-4 left-0 right-0 text-center">
                <span className="text-[8px] font-bold text-neutral-500">{tr('Шафа їжі', 'Шафа їжі', 'Food Cabinet')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== CENTER: WAREHOUSE DOOR ===== */}
        <div className="absolute left-[30%] sm:left-[26%] right-[30%] sm:right-[26%] top-0 bottom-0 flex flex-col items-center justify-center">
          <button
            onClick={() => setWarehouseOpen(true)}
            className="group relative flex flex-col items-center transition-transform hover:scale-105"
            style={{ filter: warehouseOpen ? 'brightness(1.3)' : 'none' }}
          >
            {/* Stone arch above door */}
            <div className="relative">
              {/* Arch top */}
              <div className="w-[90px] h-[24px] mx-auto rounded-t-full"
                style={{
                  background: 'linear-gradient(180deg, #3a352d, #2e2920)',
                  boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.03), 0 -2px 6px rgba(0,0,0,0.3)',
                }} />

              {/* Door frame */}
              <div className="relative w-[80px] mx-auto rounded-b-md overflow-hidden"
                style={{
                  height: '120px',
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

                {/* Warning sign on door */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-5 h-3 rounded-sm flex items-center justify-center"
                  style={{ background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(251,146,60,0.3)' }}>
                  <span className="text-[6px] font-bold text-orange-400/60">{tr('СКЛАД', 'СКЛАД', 'WH')}</span>
                </div>

                {/* Hover glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-sm"
                  style={{ boxShadow: 'inset 0 0 15px rgba(251,191,36,0.15)' }} />
              </div>
            </div>

            {/* Space indicator */}
            <div className="mt-2 flex flex-col items-center gap-0.5">
              <div className="w-[70px] h-1 rounded-full bg-black/40 overflow-hidden">
                <div
                  className={`h-full transition-all ${usedSpace / totalSpace > 0.9 ? 'bg-red-500' : usedSpace / totalSpace > 0.7 ? 'bg-amber-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(100, (usedSpace / totalSpace) * 100)}%` }}
                />
              </div>
              <span className="text-[8px] text-neutral-500 tabular-nums">{usedSpace}/{totalSpace}м²</span>
            </div>
          </button>
        </div>

        {/* ===== RIGHT: ORE VEIN ===== */}
        <div className="absolute right-0 top-0 bottom-0 w-[30%] sm:w-[26%] flex flex-col items-center justify-between py-3">

          {/* Ore vein - drawn as textured rock pile */}
          <button
            onClick={onDigActivate}
            disabled={!canDig}
            className={`relative transition-transform ${canDig ? 'hover:scale-110 cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
            style={{ marginTop: '20px' }}
          >
            <div className="relative" style={{ width: '100px', height: '100px' }}>
              {/* Main ore pile shape */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-full"
                style={{
                  width: '90px',
                  height: '70px',
                  background: `
                    radial-gradient(ellipse at 30% 40%, ${oreColor} 0%, ${oreSecondary} 50%, #2a2520 100%)
                  `,
                  borderRadius: '45px 45px 8px 8px',
                  boxShadow: canDig
                    ? `0 0 20px 2px ${oreColor}30, 0 4px 12px rgba(0,0,0,0.5)`
                    : '0 4px 12px rgba(0,0,0,0.5)',
                }}>

                {/* Ore specks - shiny bits */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="absolute rounded-sm"
                    style={{
                      width: `${2 + (i % 3)}px`,
                      height: `${2 + (i % 3)}px`,
                      left: `${15 + i * 18}%`,
                      top: `${20 + (i % 4) * 15}%`,
                      background: oreColor,
                      opacity: 0.8,
                      boxShadow: `0 0 4px ${oreColor}80`,
                    }} />
                ))}

                {/* Texture lines */}
                <div className="absolute inset-0 rounded-t-full opacity-20"
                  style={{
                    background: `repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(0,0,0,0.2) 6px, rgba(0,0,0,0.2) 7px)`,
                  }} />
              </div>

              {/* Base shadow */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-2 rounded-full"
                style={{ background: 'rgba(0,0,0,0.4)', filter: 'blur(3px)' }} />

              {/* Glow when diggable */}
              {canDig && (
                <div className="absolute inset-0 rounded-full animate-pulse pointer-events-none"
                  style={{ boxShadow: `0 0 25px 5px ${oreColor}20` }} />
              )}

              {/* Floating particles when digging */}
              {canDig && [0, 1, 2, 3].map((i) => (
                <div key={i} className="absolute rounded-full pointer-events-none"
                  style={{
                    width: '3px',
                    height: '3px',
                    left: `${30 + i * 15}%`,
                    bottom: `${40 + (i % 2) * 20}px`,
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
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
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
        <div className="absolute top-2 right-2 flex flex-col gap-1 z-10 items-end">
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

        {/* ===== HUD: Bottom-right (energy + pickaxe, only when can dig) ===== */}
        {canDig && (
          <div className="absolute bottom-2 right-2 flex flex-col gap-1 z-10 items-end">
            <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-[9px] font-bold text-amber-400 uppercase">{tr('Енерг', 'Енерг', 'Eng')}</span>
              <div className="w-16 h-1.5 rounded-full bg-black/50 overflow-hidden">
                <div className="h-full bg-amber-400" style={{ width: `${(state.energy / (state.maxEnergy || 300)) * 100}%` }} />
              </div>
              <span className="text-[10px] font-bold text-neutral-200 tabular-nums">{Math.floor(state.energy)}</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-[9px] font-bold text-orange-400 uppercase">{tr('Кирка', 'Кирка', 'Pck')}</span>
              {!isShovel && state.activePickaxe && (
                <div className="w-16 h-1.5 rounded-full bg-black/50 overflow-hidden">
                  <div className="h-full bg-orange-400" style={{ width: `${(state.activePickaxe.durability / state.activePickaxe.maxDurability) * 100}%` }} />
                </div>
              )}
              <span className="text-[10px] font-bold text-neutral-200 tabular-nums">
                {isShovel ? '∞' : state.activePickaxe?.durability ?? 0}
              </span>
            </div>
          </div>
        )}

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

            {/* Stone texture for warehouse interior */}
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

              {/* Shelves with physical items */}
              <div className="space-y-3">
                {Array.from({ length: Math.min(shelfCount, 6) }).map((_, shelfIdx) => {
                  const items = shelfItems[shelfIdx] || [];
                  return (
                    <div key={shelfIdx} className="relative">
                      {/* Shelf board */}
                      <div className="relative h-[36px] rounded-sm flex items-end gap-0.5 px-1.5 pb-0.5"
                        style={{
                          background: 'linear-gradient(180deg, #4a3825 0%, #3d2e1c 60%, #2e2215 100%)',
                          border: '1px solid rgba(0,0,0,0.3)',
                          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.04), 0 2px 4px rgba(0,0,0,0.3)',
                        }}>
                        {/* Shelf brackets */}
                        <div className="absolute -left-1 top-0 w-1 h-full rounded-l-sm" style={{ background: '#3d2e1c' }} />
                        <div className="absolute -right-1 top-0 w-1 h-full rounded-r-sm" style={{ background: '#3d2e1c' }} />

                        {/* Items on shelf */}
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

                {/* Empty shelf slots */}
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
                  {/* Fuel gauge */}
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

                  {/* Lithium slots */}
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

                    {/* Durability bar */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] text-neutral-500 w-12">{tr('Міцність', 'Міцність', 'Durability')}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-black/40 overflow-hidden">
                        <div className={`h-full ${pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[9px] text-neutral-400 tabular-nums w-16 text-right">{pct}% · {formatRemaining(remaining)}</span>
                    </div>

                    {/* Action buttons */}
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

                    {/* Mode switcher */}
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
    </>
  );
}

// ===== SHELF ITEM VISUAL COMPONENT =====
function ShelfItemVisual({ item }: { item: ShelfItem }) {
  if (item.kind === 'generator') {
    return (
      <div className="relative shrink-0 rounded-sm" style={{ width: item.w, height: item.h }}>
        {/* Generator body */}
        <div className="absolute inset-0 rounded-sm"
          style={{
            background: 'linear-gradient(180deg, #d97316 0%, #b8530f 50%, #8a3d0a 100%)',
            border: '1px solid rgba(0,0,0,0.3)',
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1)',
          }} />
        {/* Top vent */}
        <div className="absolute top-0.5 left-0.5 right-0.5 h-0.5 rounded-sm" style={{ background: 'rgba(0,0,0,0.3)' }} />
        {/* Fuel cap */}
        <div className="absolute top-1 right-0.5 w-1 h-1 rounded-full" style={{ background: '#333' }} />
      </div>
    );
  }

  if (item.kind === 'battery') {
    const chargePct = item.max > 0 ? (item.charge / item.max) * 100 : 0;
    return (
      <div className="relative shrink-0 rounded-sm" style={{ width: item.w, height: item.h }}>
        {/* Battery body */}
        <div className="absolute inset-0 rounded-sm"
          style={{
            background: `linear-gradient(180deg, ${item.color}cc 0%, ${item.color}88 50%, ${item.color}44 100%)`,
            border: '1px solid rgba(0,0,0,0.3)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1)',
          }} />
        {/* Terminal top */}
        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-0.5 rounded-sm" style={{ background: '#888' }} />
        {/* Charge indicator fill */}
        <div className="absolute bottom-0 left-0 right-0 rounded-b-sm transition-all"
          style={{ height: `${chargePct}%`, background: `${item.color}60` }} />
        {/* Label line */}
        <div className="absolute top-1/3 left-0 right-0 h-px" style={{ background: 'rgba(0,0,0,0.15)' }} />
      </div>
    );
  }

  if (item.kind === 'oxygen') {
    const oxygenPct = item.max > 0 ? (item.oxygen / item.max) * 100 : 0;
    return (
      <div className="relative shrink-0" style={{ width: item.w, height: item.h }}>
        {/* Tank body - cylindrical */}
        <div className="absolute inset-0 rounded-sm"
          style={{
            background: `linear-gradient(90deg, ${item.color}aa 0%, ${item.color}66 30%, ${item.color}aa 60%, ${item.color}44 100%)`,
            borderRadius: '40%',
            border: '1px solid rgba(0,0,0,0.3)',
            boxShadow: 'inset 0 0 2px rgba(255,255,255,0.1)',
          }} />
        {/* Valve cap */}
        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1 rounded-t-sm" style={{ background: '#666' }} />
        {/* Oxygen level fill from bottom */}
        <div className="absolute bottom-0 left-0 right-0 rounded-b-sm transition-all"
          style={{ height: `${oxygenPct}%`, background: `${item.color}40` }} />
      </div>
    );
  }

  if (item.kind === 'canister') {
    return (
      <div className="relative shrink-0 rounded-sm" style={{ width: item.w, height: item.h }}>
        {/* Canister body */}
        <div className="absolute inset-0 rounded-sm"
          style={{
            background: item.empty
              ? 'linear-gradient(180deg, #5a5a5a 0%, #4a4a4a 50%, #3a3a3a 100%)'
              : 'linear-gradient(180deg, #f97316 0%, #d97316 50%, #b8530f 100%)',
            border: '1px solid rgba(0,0,0,0.3)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.08)',
            opacity: item.empty ? 0.6 : 1,
          }} />
        {/* Cap */}
        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-0.5 rounded-sm"
          style={{ background: item.empty ? '#333' : '#1a1a1a' }} />
        {/* Handle */}
        <div className="absolute top-0.5 left-0.5 w-1 h-1 rounded-sm border"
          style={{ borderColor: 'rgba(0,0,0,0.3)', background: item.empty ? '#444' : '#a8530f' }} />
      </div>
    );
  }

  return null;
}
