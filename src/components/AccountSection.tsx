import { useState, type FormEvent } from 'react';
import { LogIn, LogOut, UserPlus, UserCircle } from 'lucide-react';
import { useAuth, type SignUpResult } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';

export default function AccountSection() {
  const { t } = useGame();
  const { user, loading, signIn, signUp, signOut } = useAuth();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (loading) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    if (mode === 'signIn') {
      const ok = await signIn(email.trim(), password);
      if (!ok) setError(t('accountAuthFailed'));
    } else {
      const result: SignUpResult = await signUp(email.trim(), password);
      if (result === 'failed') setError(t('accountAuthFailed'));
      if (result === 'check_email') {
        setInfo(t('accountCheckEmail'));
        setMode('signIn');
      }
    }
    setPassword('');
    setBusy(false);
  };

  const handleSignOut = async () => {
    setBusy(true);
    await signOut();
    setBusy(false);
  };

  return (
    <div className="card p-4">
      <h3 className="font-bold text-neutral-800 dark:text-neutral-100 mb-3 flex items-center gap-2">
        <UserCircle className="w-5 h-5 text-primary-500" />
        {t('accountTitle')}
      </h3>

      {user ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 min-w-0 truncate">
            {t('accountSignedInAs')} <span className="font-semibold text-neutral-800 dark:text-neutral-200">{user.email ?? ''}</span>
          </p>
          <button
            onClick={handleSignOut}
            disabled={busy}
            className="btn-primary px-4 py-2 text-sm whitespace-nowrap flex items-center gap-1.5 disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            {t('accountSignOut')}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('accountSignedOutHint')}</p>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('accountEmail')}
            className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-850 px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('accountPassword')}
            className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-850 px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signIn' ? 'signUp' : 'signIn');
                setError(null);
                setInfo(null);
              }}
              className="text-xs text-primary-500 hover:underline"
            >
              {mode === 'signIn' ? t('accountSwitchToSignUp') : t('accountSwitchToSignIn')}
            </button>
            <button type="submit" disabled={busy} className="btn-primary px-4 py-2 text-sm whitespace-nowrap flex items-center gap-1.5 disabled:opacity-50">
              {mode === 'signIn' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {mode === 'signIn' ? t('accountSignIn') : t('accountSignUp')}
            </button>
          </div>
          {error && <p className="text-xs text-error-500">{error}</p>}
          {info && <p className="text-xs text-success-500">{info}</p>}
        </form>
      )}
    </div>
  );
}
