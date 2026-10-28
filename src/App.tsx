import { useState } from 'react';
import { GameProvider, useGame } from '@/context/GameContext';
import TabNav from '@/components/TabNav';
import MiningTab from '@/components/MiningTab';
import ShopTab from '@/components/ShopTab';
import UpgradesTab from '@/components/UpgradesTab';
import ExpeditionsTab from '@/components/ExpeditionsTab';
import SettingsTab from '@/components/SettingsTab';
import EquipmentTab from '@/components/EquipmentTab';
import Notifications from '@/components/Notifications';
import FloatTexts from '@/components/FloatTexts';
import ItemsModal from '@/components/ItemsModal';
import FloatingQuickAccess from '@/components/FloatingQuickAccess';
import LevelUpModal from '@/components/LevelUpModal';
import LevelRoadmapModal from '@/components/LevelRoadmapModal';
import { Pickaxe, Coins, Gem } from 'lucide-react';
import { formatMoney } from '@/config';
import { xpForLevel } from '@/config/upgradesConfig';

function LevelXPBar() {
  const { state, t, lang } = useGame();
  const [roadmapOpen, setRoadmapOpen] = useState(false);
  const xpNeeded = xpForLevel(state.level);
  const xpPct = Math.min(100, (state.xp / xpNeeded) * 100);

  return (
    <>
      <button
        onClick={() => setRoadmapOpen(true)}
        className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
        title={lang === 'ru' ? 'Открыть карту уровней' : (lang === 'uk' ? 'Відкрити карту рівнів' : 'Open level roadmap')}
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-md shadow-primary-500/20 shrink-0">
          <Pickaxe className="w-5 h-5 text-white" />
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
            {t('level')} {state.level}
          </div>
          <div className="text-xs font-bold text-neutral-700 dark:text-neutral-200">
            {t('xp')}: {state.xp} / {xpNeeded}
          </div>
        </div>
        <div className="w-16 sm:w-24 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-400 to-primary-500 transition-all duration-300"
            style={{ width: `${xpPct}%` }}
          />
        </div>
      </button>
      {roadmapOpen && (
        <LevelRoadmapModal
          currentLevel={state.level}
          xp={state.xp}
          lang={lang}
          onClose={() => setRoadmapOpen(false)}
        />
      )}
    </>
  );
}

function Balances() {
  const { state, t } = useGame();
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <Coins className="w-4 h-4 text-success-500" />
        <span className="text-sm font-bold text-success-500">{formatMoney(state.balance)}</span>
      </div>
      <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-700" />
      <div className="flex items-center gap-1.5">
        <Gem className="w-4 h-4 text-accent-500" />
        <span className="text-sm font-bold text-accent-500">{state.gems}</span>
      </div>
    </div>
  );
}

function GameApp() {
  const { activeTab, t, state, levelUpData, setLevelUpData, lang } = useGame();

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <LevelXPBar />
          <h1 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-50 absolute left-1/2 -translate-x-1/2 hidden md:block">
            {t('appTitle')}
          </h1>
          <Balances />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-4 space-y-4" style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom, 0px))' }}>
        {activeTab === 'mining' && <MiningTab />}
        {activeTab === 'shop' && <ShopTab />}
        {activeTab === 'upgrades' && <UpgradesTab />}
        {activeTab === 'equipment' && <EquipmentTab />}
        {activeTab === 'expeditions' && <ExpeditionsTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>

      {/* Bottom tab nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="max-w-2xl mx-auto px-2 sm:px-3 py-1.5 sm:py-2">
          <TabNav />
        </div>
      </div>

      {/* Overlays */}
      <Notifications />
      <FloatTexts />
      <ItemsModal />
      <FloatingQuickAccess />
      {levelUpData !== null && (
        <LevelUpModal
          level={levelUpData}
          lang={lang}
          onClose={() => setLevelUpData(null)}
        />
      )}

      {/* Version badge */}
      <div className="fixed bottom-16 right-3 z-50 pointer-events-none select-none">
        <span className="text-[10px] font-mono font-semibold text-neutral-400 dark:text-neutral-600 bg-neutral-100/70 dark:bg-neutral-900/70 px-2 py-0.5 rounded-md backdrop-blur-sm">
          V9.6.0
        </span>
      </div>
    </div>
  );
}

function App() {
  return (
    <GameProvider>
      <GameApp />
    </GameProvider>
  );
}

export default App;
