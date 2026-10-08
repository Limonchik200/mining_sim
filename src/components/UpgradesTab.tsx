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
  UPGRADE_CONFIG,
} from '@/config/upgradesConfig';
import { getCaseChanceValue } from '@/config/casesConfig';
import { getCaseChanceCost } from '@/config/upgradesConfig';
import {
  Zap,
  Clock,
  Gauge,
  Package,
  Gift,
  ChevronUp,
  Lock,
  Coins,
  Battery,
  Timer,
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
}: UpgradeCardProps) {
  const isMaxed = maxLevel !== undefined && level >= maxLevel;

  return (
    <div className="rounded-xl p-4 bg-neutral-50 dark:bg-neutral-850/50 border border-neutral-200 dark:border-neutral-800">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: iconColor + '20' }}>
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
        <div className="w-full py-2 text-sm font-semibold text-center rounded-xl bg-success-500/10 text-success-500 flex items-center justify-center gap-1.5">
          <Lock className="w-4 h-4" />
          {t('maxLevelReached')}
        </div>
      ) : (
        <button
          onClick={onUpgrade}
          disabled={!canAfford}
          className="btn-primary w-full py-2 text-sm flex items-center justify-center gap-1.5"
        >
          <ChevronUp className="w-4 h-4" />
          {t('buyUpgrade')} · {formatMoney(cost)}
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
    t,
  } = useGame();

  const u = state.upgrades;

  return (
    <div className="space-y-4">
      {/* Balance & Title Header */}
      <div className="card p-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary-500" />
          {t('upgradesTitle')}
        </h2>
        <div className="flex items-center gap-1.5">
          <Coins className="w-4 h-4 text-success-500" />
          <span className="text-sm font-bold text-success-500">{formatMoney(state.balance)}</span>
        </div>
      </div>

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
          currentValue={`${(getAutoCooldownMs(u.autoCooldownLvl) / 1000).toFixed(1)}s`}
          nextValue={`${(getAutoCooldownMs(u.autoCooldownLvl + 1) / 1000).toFixed(1)}s`}
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

      {/* Section 3: Cases */}
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

      {/* Section 4: Energy */}
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
          cost={getEnergyMaxCost(u.energyMaxLvl)}
          canAfford={state.balance >= getEnergyMaxCost(u.energyMaxLvl)}
          onUpgrade={upgradeEnergyMax}
          t={t}
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
          cost={getEnergyRegenCost(u.energyRegenLvl)}
          canAfford={state.balance >= getEnergyRegenCost(u.energyRegenLvl)}
          onUpgrade={upgradeEnergyRegen}
          t={t}
        />
      </div>
    </div>
  );
}
