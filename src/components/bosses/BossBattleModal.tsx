import React from 'react';
import type { BossLang } from '../../config/bosses/bossI18n';
import { getBossT } from '../../config/bosses/bossI18n';

interface BossBattleModalProps {
  isOpen: boolean;
  bossName: string;
  bossHp: number;
  bossMaxHp: number;
  playerHp: number;
  playerMaxHp: number;
  battleLog: string[];
  isFighting: boolean;
  attackCooldown: boolean;
  onAttack: () => void;
  onClose: () => void;
  lootData?: Record<string, number> | null;
  onClaimLoot?: () => void;
  lang: BossLang;
  playerDied?: boolean;
}

export const BossBattleModal: React.FC<BossBattleModalProps> = ({
  isOpen, bossName, bossHp, bossMaxHp, playerHp, playerMaxHp,
  battleLog, isFighting, attackCooldown, onAttack, onClose,
  lootData, onClaimLoot, lang, playerDied,
}) => {
  const t = getBossT(lang);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 flex flex-col max-h-[90vh] shadow-2xl">

        <div className="flex justify-between items-center mb-4 border-b border-e-slate-800 pb-3">
          <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
            <span>⚔️</span> {t('battleWith')}: <span className="text-red-400">{bossName}</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-xl px-2">✕</button>
        </div>

        {lootData ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
            <span className="text-5xl animate-bounce">🎁</span>
            <h4 className="text-xl font-extrabold text-amber-400">{t('victory')}</h4>
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 w-full space-y-2 text-left">
              {Object.entries(lootData).map(([itemKey, qty]) => (
                <div key={itemKey} className="flex justify-between text-sm">
                  <span className="text-slate-300 capitalize">{itemKey.replace('_', ' ')}:</span>
                  <span className="text-amber-400 font-bold">+{qty}</span>
                </div>
              ))}
            </div>
            <button
              onClick={onClaimLoot}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white transition-all shadow-lg"
            >
              {t('claimReward')}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 flex-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-xs text-red-400 font-bold">{t('bossHealth')} ({bossHp}/{bossMaxHp})</span>
                <div className="w-full bg-slate-900 rounded-full h-2.5 mt-1 overflow-hidden border border-slate-800">
                  <div className="bg-red-600 h-full transition-all duration-200" style={{ width: `${Math.max(0, (bossHp / bossMaxHp) * 100)}%` }}></div>
                </div>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-xs text-emerald-400 font-bold">{playerHp}/{playerMaxHp}</span>
                <div className="w-full bg-slate-900 rounded-full h-2.5 mt-1 overflow-hidden border border-slate-800">
                  <div className={`h-full transition-all duration-200 ${playerDied ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.max(0, (playerHp / playerMaxHp) * 100)}%` }}></div>
                </div>
              </div>
            </div>

            {playerDied && (
              <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-4 text-center">
                <span className="text-3xl">💀</span>
                <p className="text-red-400 font-extrabold text-sm mt-2">{t('deathTitle')}</p>
              </div>
            )}

            <div className="flex-1 bg-slate-950/70 border border-slate-800 rounded-xl p-3 overflow-y-auto space-y-1.5 h-48 font-mono text-xs">
              {battleLog.length === 0 ? (
                <p className="text-slate-500 text-center italic mt-12">{t('battleStarted')}</p>
              ) : (
                battleLog.map((log, idx) => (
                  <p key={idx} className="text-slate-300">{log}</p>
                ))
              )}
            </div>

            <button
              onClick={onAttack}
              disabled={!isFighting || attackCooldown || playerHp <= 0 || bossHp <= 0}
              className={`w-full py-4 rounded-xl font-extrabold text-white text-base shadow-xl transition-all uppercase tracking-wider ${
                attackCooldown && isFighting
                  ? 'bg-slate-700 opacity-60 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500'
              }`}
            >
              {playerHp <= 0 ? t('youDied') : bossHp <= 0 ? t('bossDefeated') : attackCooldown ? '⏳ ' + t('recharging') : '⚡ ' + t('attack')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
