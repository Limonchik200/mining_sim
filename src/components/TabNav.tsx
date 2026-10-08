import { useGame } from '@/context/GameContext';
import type { Tab } from '@/types';
import { Pickaxe, ShoppingCart, TrendingUp, Settings } from 'lucide-react';

export default function TabNav() {
  const { activeTab, setActiveTab, t } = useGame();

  const tabs: { id: Tab; icon: typeof Pickaxe; label: string }[] = [
    { id: 'mining', icon: Pickaxe, label: t('tabMining') },
    { id: 'shop', icon: ShoppingCart, label: t('tabShop') },
    { id: 'upgrades', icon: TrendingUp, label: t('tabUpgrades') },
    { id: 'settings', icon: Settings, label: t('tabSettings') },
  ];

  return (
    <nav className="flex gap-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-btn ${active ? 'tab-btn-active' : 'tab-btn-idle'}`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold uppercase tracking-wide">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
