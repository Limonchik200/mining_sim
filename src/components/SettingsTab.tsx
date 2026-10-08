import { useState, useRef, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import type { Lang, Theme } from '@/types';
import { formatMoney } from '@/config';
import {
  Globe,
  Moon,
  Sun,
  RotateCcw,
  BarChart3,
  Languages,
  Palette,
  KeyRound,
  CheckCircle2,
  X,
} from 'lucide-react';

export default function SettingsTab() {
  const { state, setLang, setTheme, resetGame, redeemPromoCode, t } = useGame();
  const [promoInput, setPromoInput] = useState('');
  const [promoBanner, setPromoBanner] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, []);

  const showBanner = (message: string, type: 'success' | 'error') => {
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    setPromoBanner({ message, type });
    bannerTimerRef.current = setTimeout(() => {
      setPromoBanner(null);
      bannerTimerRef.current = null;
    }, 4000);
  };

  const handleRedeem = () => {
    if (!promoInput.trim()) return;
    const code = promoInput.trim();
    const usedCodes = state.redeemedPromoCodes || [];
    if (usedCodes.includes(code.toLowerCase())) {
      showBanner(t('promoUsed'), 'error');
      setPromoInput('');
      return;
    }
    redeemPromoCode(code);
    showBanner(t('promoSuccess'), 'success');
    setPromoInput('');
  };

  return (
    <div className="space-y-4">
      {/* Settings */}
      <div className="card p-4">
        <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary-500" />
          {t('settingsTitle')}
        </h2>

        {/* Language */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-accent-500" />
            {t('language')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['uk', 'en'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  state.settings.lang === l
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                    : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-300 dark:hover:bg-neutral-700'
                }`}
              >
                <Languages className="w-4 h-4" />
                {l === 'uk' ? t('ukrainian') : t('english')}
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div>
          <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2 mb-2">
            <Palette className="w-4 h-4 text-primary-500" />
            {t('theme')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['dark', 'light'] as Theme[]).map((th) => (
              <button
                key={th}
                onClick={() => setTheme(th)}
                className={`py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  state.settings.theme === th
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                    : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-300 dark:hover:bg-neutral-700'
                }`}
              >
                {th === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                {th === 'dark' ? t('darkMode') : t('lightMode')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Promo code */}
      <div className="card p-4">
        <h3 className="font-bold text-neutral-800 dark:text-neutral-100 mb-3 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-accent-500" />
          {t('promoCode')}
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
            placeholder={t('promoCodePlaceholder')}
            className="flex-1 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-850 px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
          <button onClick={handleRedeem} disabled={!promoInput.trim()} className="btn-primary px-4 py-2 text-sm whitespace-nowrap disabled:opacity-50">
            {t('redeemCode')}
          </button>
        </div>
        {promoBanner && (
          <div className={`mt-2 flex items-center justify-between gap-2 text-xs rounded-lg px-3 py-1.5 ${
            promoBanner.type === 'success'
              ? 'text-success-500 bg-success-500/10'
              : 'text-error-500 bg-error-500/10'
          }`}>
            <span className="flex items-center gap-1.5">
              {promoBanner.type === 'success'
                ? <CheckCircle2 className="w-3.5 h-3.5" />
                : <X className="w-3.5 h-3.5" />}
              {promoBanner.message}
            </span>
            <button onClick={() => setPromoBanner(null)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Player statistics */}
      <div className="card p-4">
        <h3 className="font-bold text-neutral-800 dark:text-neutral-100 mb-3 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-accent-500" />
          {t('gameStats')}
        </h3>
        <div className="space-y-2">
          {[
            { label: t('level'), value: state.level },
            { label: t('xp'), value: `${state.xp} / ${Math.floor(100 * Math.pow(1.30, state.level - 1))}` },
            { label: t('totalDigs'), value: state.totalDigs },
            { label: t('totalEarned'), value: formatMoney(state.totalEarned) },
            { label: t('totalCasesOpened'), value: state.totalCasesOpened },
            { label: t('totalGemsEarned'), value: `${state.totalGemsEarned} 💎` },
          ].map((stat, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl px-3 py-2 bg-neutral-50 dark:bg-neutral-850/50 border border-neutral-200 dark:border-neutral-800"
            >
              <span className="text-xs text-neutral-500 dark:text-neutral-400">{stat.label}</span>
              <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Game data */}
      <div className="card p-4">
        <h3 className="font-bold text-neutral-800 dark:text-neutral-100 mb-3 flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-error-500" />
          {t('gameData')}
        </h3>
        <button
          onClick={() => {
            if (window.confirm(t('resetConfirm'))) {
              resetGame();
            }
          }}
          className="btn-error w-full py-2.5 text-sm"
        >
          <RotateCcw className="w-4 h-4 inline mr-1.5" />
          {t('resetGame')}
        </button>
      </div>
    </div>
  );
}
