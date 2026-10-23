import { useState, useRef, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { formatMoney } from '@/config';
import {
  getLeaseMultCost,
  getLeaseMultValue,
  getAutoCooldownCost,
  getAutoCooldownMs,
  getBasketCapCost,
  getBasketCapValue,
  getEnergyMaxCost,
  getEnergyMaxValue,
  getEnergyRegenCost,
  getEnergyRegenValue,
  getEnergyRegenAmountCost,
  getEnergyRegenAmountValue,
  isEnergyUpgradeDiamond,
  getEnergyUpgradeDiamondCost,
  getBackpackCost,
  getBackpackWeightLimit,
  UPGRADE_CONFIG,
} from '@/config/upgradesConfig';
import { getCaseChanceValue } from '@/config/casesConfig';
import { getCaseChanceCost } from '@/config/upgradesConfig';
import CraftPanel from '@/components/CraftPanel';
import EquipmentPanel from '@/components/EquipmentPanel';
import {
  Zap,
  Clock,
  Gauge,
  Package,
  Gift,
  ChevronUp,
  Lock,
  Coins,
  Gem,
  Battery,
  Timer,
  Sparkles,
  Backpack,
  Hammer,
  HardHat,
  Mountain,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface UpgradeCardProps {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  desc: string;
  level: number;
  maxLevel?: number;
  currentValue: string;
  nextValue: string;
  cost: number;
  canAfford: boolean;
  onUpgrade: () => void;
  t: (k: any) => string;
  useDiamonds?: boolean;
}

function UpgradeCard({
  icon: Icon,
  iconColor,
  title,
  desc,
  level,
  maxLevel,
  currentValue,
  nextValue,
  cost,
  canAfford,
  onUpgrade,
  t,
  useDiamonds,
}: UpgradeCardProps) {
  const isMaxed = maxLevel !== undefined && level >= maxLevel;
  const [burst, setBurst] = useState(false);

  const handleUpgrade = () => {
    onUpgrade();
    setBurst(true);
    setTimeout(() => setBurst(false), 600);
  };

  return (
    <div
      className={`relative rounded-xl p-4 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-850/50 dark:to-neutral-900/50 border border-neutral-200 dark:border-neutral-800 transition-all duration-300 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5 ${burst ? 'animate-upgrade-burst' : ''}`}
    >
      {burst && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Sparkles className="w-8 h-8 text-amber-400 animate-fade-scale" />
        </div>
      )}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 hover:scale-110" style={{ backgroundColor: iconColor + '20' }}>
            <Icon className="w-5 h-5" style={{ color: iconColor }} />
          </div>
          <div>
            <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{title}</div>
            <div className="text-xs text-neutral-400">{desc}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-neutral-400 uppercase">{t('level_')}</div>
          <div className="text-sm font-bold text-primary-500">{level}{maxLevel !== undefined ? `/${maxLevel}` : ''}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex gap-3">
          <div>
            <span className="text-neutral-400">{t('current')}: </span>
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">{currentValue}</span>
          </div>
          {!isMaxed && (
            <div>
              <span className="text-neutral-400">{t('next')}: </span>
              <span className="font-semibold text-success-500">{nextValue}</span>
            </div>
          )}
        </div>
      </div>

      {isMaxed ? (
        <div className="w-full py-2 text-sm font-bold text-center rounded-xl bg-success-500/10 text-success-500 flex items-center justify-center gap-1.5 border border-success-500/20">
          <Sparkles className="w-4 h-4" />
          {t('maxLevelReached')}
        </div>
      ) : (
        <button
          onClick={handleUpgrade}
          disabled={!canAfford}
          className={`btn-primary w-full py-2 text-sm flex items-center justify-center gap-1.5 transition-all duration-200 hover:shadow-md hover:shadow-amber-500/20 active:scale-95 ${
            !canAfford ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <ChevronUp className="w-4 h-4" />
          {t('buyUpgrade')} ·{' '}
          {useDiamonds ? (
            <span className="flex items-center gap-1">
              <Gem className="w-3.5 h-3.5 text-accent-500" />
              {cost}
            </span>
          ) : (
            formatMoney(cost)
          )}
        </button>
      )}
    </div>
  );
}

function SectionHeader({ icon, title, color }: { icon: LucideIcon; title: string; color: string }) {
  const Icon = icon;
  return (
    <div className="flex items-center gap-2 mb-2 mt-1">
      <Icon className="w-4 h-4" style={{ color }} />
      <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">{title}</h3>
      <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
    </div>
  );
}

export default function UpgradesTab() {
  const {
    state,
    upgradeActiveLeaseMult,
    upgradeAutoLeaseMult,
    upgradeAutoCooldown,
    upgradeBasketCap,
    upgradeCaseChance,
    upgradeEnergyMax,
    upgradeEnergyRegen,
    upgradeEnergyRegenAmount,
    upgradeBackpack,
    currentBackpackLimit,
    currentBackpackWeight,
    t,
    lang,
  } = useGame();

  const [subTab, setSubTab] = useState<'upgrades' | 'craft' | 'equipment'>('upgrades');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [subTab]);

  const subTabBtn = (tab: 'upgrades' | 'craft' | 'equipment', Icon: LucideIcon, label: string) => (
    <button
      onClick={() => setSubTab(tab)}
      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
        subTab === tab
          ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
          : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
      }`}
    >
      <Icon className="w-4 h-4 inline mr-1.5" />
      {label}
    </button>
  );

  const switcher = (
    <div className="flex gap-2 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-850">
      {subTabBtn('upgrades', Zap, lang === 'ru' ? 'Прокачка' : (lang === 'uk' ? 'Прокачка' : 'Upgrades'))}
      {subTabBtn('craft', Hammer, lang === 'ru' ? 'Крафт' : (lang === 'uk' ? 'Крафт' : 'Craft'))}
      {subTabBtn('equipment', HardHat, lang === 'ru' ? 'Спорядження' : (lang === 'uk' ? 'Спорядження' : 'Equipment'))}
    </div>
  );

  if (subTab === 'craft') {
    return (
      <div className="space-y-4">
        {switcher}
        <CraftPanel />
      </div>
    );
  }

  if (subTab === 'equipment') {
    return (
      <div className="space-y-4">
        {switcher}
        <EquipmentPanel />
      </div>
    );
  }

  const u = state.upgrades;

  const energyMaxDiamond = isEnergyUpgradeDiamond(u.energyMaxLvl);
  const energyRegenDiamond = isEnergyUpgradeDiamond(u.energyRegenLvl);
  const energyRegenAmountDiamond = isEnergyUpgradeDiamond(u.energyRegenAmountLvl ?? 0);

  return (
    <div className="space-y-4">
      {/* Balance & Title Header */}
      <div className="card p-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary-500" />
          {t('upgradesTitle')}
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-success-500" />
            <span className="text-sm font-bold text-success-500">{formatMoney(state.balance)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Gem className="w-4 h-4 text-accent-500" />
            <span className="text-sm font-bold text-accent-500">{state.gems}</span>
          </div>
        </div>
      </div>

      {switcher}

      {/* Section 1: Multipliers */}
      <div className="card p-4 space-y-3">
        <SectionHeader icon={Zap} title={t('upSectionMultipliers')} color="#f97316" />
        <UpgradeCard
          icon={Zap}
          iconColor="#f97316"
          title={t('upActiveLease')}
          desc={t('upActiveLeaseDesc')}
          level={u.activeLeaseMult}
          maxLevel={UPGRADE_CONFIG.activeLeaseMult.maxLevel}
          currentValue={`×${getLeaseMultValue('activeLeaseMult', u.activeLeaseMult)}`}
          nextValue={`×${getLeaseMultValue('activeLeaseMult', u.activeLeaseMult + 1)}`}
          cost={getLeaseMultCost('activeLeaseMult', u.activeLeaseMult)}
          canAfford={state.balance >= getLeaseMultCost('activeLeaseMult', u.activeLeaseMult)}
          onUpgrade={upgradeActiveLeaseMult}
          t={t}
        />
        <UpgradeCard
          icon={Clock}
          iconColor="#06b6d4"
          title={t('upAutoLease')}
          desc={t('upAutoLeaseDesc')}
          level={u.autoLeaseMult}
          maxLevel={UPGRADE_CONFIG.autoLeaseMult.maxLevel}
          currentValue={`×${getLeaseMultValue('autoLeaseMult', u.autoLeaseMult)}`}
          nextValue={`×${getLeaseMultValue('autoLeaseMult', u.autoLeaseMult + 1)}`}
          cost={getLeaseMultCost('autoLeaseMult', u.autoLeaseMult)}
          canAfford={state.balance >= getLeaseMultCost('autoLeaseMult', u.autoLeaseMult)}
          onUpgrade={upgradeAutoLeaseMult}
          t={t}
        />
      </div>

      {/* Section 2: Mining */}
      <div className="card p-4 space-y-3">
        <SectionHeader icon={Gauge} title={t('upSectionMining')} color="#22c55e" />
        <UpgradeCard
          icon={Gauge}
          iconColor="#22c55e"
          title={t('upAutoCooldown')}
          desc={t('upAutoCooldownDesc')}
          level={u.autoCooldownLvl}
          maxLevel={UPGRADE_CONFIG.autoCooldown.maxLevel}
          currentValue={`${getAutoCooldownMs(u.autoCooldownLvl) / 1000}s`}
          nextValue={`${getAutoCooldownMs(u.autoCooldownLvl + 1) / 1000}s`}
          cost={getAutoCooldownCost(u.autoCooldownLvl)}
          canAfford={state.balance >= getAutoCooldownCost(u.autoCooldownLvl)}
          onUpgrade={upgradeAutoCooldown}
          t={t}
        />
        <UpgradeCard
          icon={Package}
          iconColor="#f59e0b"
          title={t('upBasketCap')}
          desc={t('upBasketCapDesc')}
          level={u.basketCapLvl}
          maxLevel={UPGRADE_CONFIG.basketCap.maxLevel}
          currentValue={`${getBasketCapValue(u.basketCapLvl)}`}
          nextValue={`${getBasketCapValue(u.basketCapLvl + 1)}`}
          cost={getBasketCapCost(u.basketCapLvl)}
          canAfford={state.balance >= getBasketCapCost(u.basketCapLvl)}
          onUpgrade={upgradeBasketCap}
          t={t}
        />
      </div>

      {/* Section 3: Mine */}
      <div className="card p-4 space-y-3">
        <SectionHeader icon={Backpack} title={t('upSectionMine')} color="#eab308" />
        <UpgradeCard
          icon={Backpack}
          iconColor="#eab308"
          title={t('upBackpack')}
          desc={t('upBackpackDesc')}
          level={u.backpackLvl ?? 0}
          maxLevel={UPGRADE_CONFIG.backpack.maxLevel}
          currentValue={`${currentBackpackWeight.toFixed(2)}/${getBackpackWeightLimit(u.backpackLvl ?? 0).toFixed(2)} kg`}
          nextValue={`${getBackpackWeightLimit((u.backpackLvl ?? 0) + 1).toFixed(2)} kg`}
          cost={getBackpackCost(u.backpackLvl ?? 0)}
          canAfford={state.balance >= getBackpackCost(u.backpackLvl ?? 0)}
          onUpgrade={upgradeBackpack}
          t={t}
        />
      </div>

      {/* Section 4: Cases */}
      <div className="card p-4 space-y-3">
        <SectionHeader icon={Gift} title={t('upSectionCases')} color="#a855f7" />
        <UpgradeCard
          icon={Gift}
          iconColor="#a855f7"
          title={t('upCaseChance')}
          desc={t('upCaseChanceDesc')}
          level={u.caseChanceLvl}
          maxLevel={UPGRADE_CONFIG.caseChance.maxLevel}
          currentValue={`${(getCaseChanceValue(u.caseChanceLvl) * 100).toFixed(2)}%`}
          nextValue={`${(getCaseChanceValue(u.caseChanceLvl + 1) * 100).toFixed(2)}%`}
          cost={getCaseChanceCost(u.caseChanceLvl)}
          canAfford={state.balance >= getCaseChanceCost(u.caseChanceLvl)}
          onUpgrade={upgradeCaseChance}
          t={t}
        />
      </div>

      {/* Section 5: Energy */}
      <div className="card p-4 space-y-3">
        <SectionHeader icon={Battery} title={t('upSectionEnergy')} color="#3b82f6" />
        <UpgradeCard
          icon={Battery}
          iconColor="#3b82f6"
          title={t('upEnergyMax')}
          desc={t('upEnergyMaxDesc')}
          level={u.energyMaxLvl}
          maxLevel={UPGRADE_CONFIG.energyMax.maxLevel}
          currentValue={`${getEnergyMaxValue(u.energyMaxLvl)}`}
          nextValue={`${getEnergyMaxValue(u.energyMaxLvl + 1)}`}
          cost={energyMaxDiamond ? getEnergyUpgradeDiamondCost(u.energyMaxLvl) : getEnergyMaxCost(u.energyMaxLvl)}
          canAfford={energyMaxDiamond ? state.gems >= getEnergyUpgradeDiamondCost(u.energyMaxLvl) : state.balance >= getEnergyMaxCost(u.energyMaxLvl)}
          onUpgrade={upgradeEnergyMax}
          t={t}
          useDiamonds={energyMaxDiamond}
        />
        <UpgradeCard
          icon={Timer}
          iconColor="#6366f1"
          title={t('upEnergyRegen')}
          desc={t('upEnergyRegenDesc')}
          level={u.energyRegenLvl}
          maxLevel={UPGRADE_CONFIG.energyRegen.maxLevel}
          currentValue={`${getEnergyRegenValue(u.energyRegenLvl)}s`}
          nextValue={`${getEnergyRegenValue(u.energyRegenLvl + 1)}s`}
          cost={energyRegenDiamond ? getEnergyUpgradeDiamondCost(u.energyRegenLvl) : getEnergyRegenCost(u.energyRegenLvl)}
          canAfford={energyRegenDiamond ? state.gems >= getEnergyUpgradeDiamondCost(u.energyRegenLvl) : state.balance >= getEnergyRegenCost(u.energyRegenLvl)}
          onUpgrade={upgradeEnergyRegen}
          t={t}
          useDiamonds={energyRegenDiamond}
        />
        <UpgradeCard
          icon={Sparkles}
          iconColor="#10b981"
          title={t('upEnergyRegenAmount')}
          desc={t('upEnergyRegenAmountDesc')}
          level={u.energyRegenAmountLvl ?? 0}
          maxLevel={UPGRADE_CONFIG.energyRegenAmount.maxLevel}
          currentValue={`+${getEnergyRegenAmountValue(u.energyRegenAmountLvl ?? 0)}`}
          nextValue={`+${getEnergyRegenAmountValue((u.energyRegenAmountLvl ?? 0) + 1)}`}
          cost={energyRegenAmountDiamond ? getEnergyUpgradeDiamondCost(u.energyRegenAmountLvl ?? 0) : getEnergyRegenAmountCost(u.energyRegenAmountLvl ?? 0)}
          canAfford={energyRegenAmountDiamond ? state.gems >= getEnergyUpgradeDiamondCost(u.energyRegenAmountLvl ?? 0) : state.balance >= getEnergyRegenAmountCost(u.energyRegenAmountLvl ?? 0)}
          onUpgrade={upgradeEnergyRegenAmount}
          t={t}
          useDiamonds={energyRegenAmountDiamond}
        />
      </div>
    </div>
  );
}
