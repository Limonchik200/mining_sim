import { useGame } from '@/context/GameContext';
import type { Tab } from '@/types';
import { Pickaxe, ShoppingCart, TrendingUp, Compass, Settings, Lock, Backpack } from 'lucide-react';

export default function TabNav() {
  const { activeTab, setActiveTab, t, state } = useGame();

  const tabs: { id: Tab; icon: typeof Pickaxe; label: string; locked?: boolean }[] = [
    { id: 'mining', icon: Pickaxe, label: t('tabMining') },
    { id: 'shop', icon: ShoppingCart, label: t('tabShop') },
    { id: 'upgrades', icon: TrendingUp, label: t('tabUpgrades') },
    { id: 'equipment', icon: Backpack, label: t('tabEquipment') },
    { id: 'expeditions', icon: Compass, label: t('tabExpeditions'), locked: state.level < 3 },
    { id: 'settings', icon: Settings, label: t('tabSettings') },
  ];

  return (
    <nav className="grid grid-cols-6 gap-0.5">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-btn relative ${active ? 'tab-btn-active' : 'tab-btn-idle'}`}
          >
            <div className="relative">
              <Icon className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
              {tab.locked && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-neutral-300 dark:bg-neutral-700 flex items-center justify-center">
                  <Lock className="w-2 h-2 text-neutral-500 dark:text-neutral-400" />
                </div>
              )}
            </div>
            <span className="text-[8px] sm:text-[10px] font-semibold uppercase tracking-tight leading-none truncate">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
