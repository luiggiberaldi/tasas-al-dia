import React from 'react';
import { Maximize, Bell, BellRing, RefreshCw } from 'lucide-react';

export default function Header({
  handleSecretDebug,
  theme,
  setKioskMode,
  enableNotifications,
  notificationsEnabled,
  onRefresh,
  loading
}) {
  return (
    <header className="flex items-center justify-between pt-5 pb-2 px-3 sm:px-4">
      <button onClick={handleSecretDebug} className="flex flex-col items-start gap-1 active:scale-95 transition-transform outline-none">
        <img
          src={theme === 'dark' ? '/logodark.png' : '/logoprincipal.png'}
          alt="TasasAlDía"
          className="h-10 sm:h-12 w-auto object-contain animate-in fade-in slide-in-from-left-2 duration-500 drop-shadow-sm"
        />
        <div className="bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded-md border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm ml-1 mt-0.5">
          <p className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] leading-none">
            V3.0 FÉNIX
          </p>
        </div>
      </button>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={() => setKioskMode(true)}
          className="p-2 sm:p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-brand-dark dark:hover:text-brand transition-all shadow-sm active:scale-95"
          title="Pantalla Completa / Captura"
        >
          <Maximize size={18} strokeWidth={2} />
        </button>

        <button
          onClick={enableNotifications}
          disabled={notificationsEnabled}
          className={`p-2 sm:p-2.5 rounded-2xl border transition-all active:scale-95 shadow-sm ${notificationsEnabled
              ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-900/30 dark:text-emerald-400'
              : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-400'
            }`}
        >
          {notificationsEnabled ? <BellRing size={18} /> : <Bell size={18} />}
        </button>

        <button
          onClick={onRefresh}
          disabled={loading}
          className={`p-2 sm:p-2.5 rounded-2xl text-slate-900 shadow-lg shadow-brand/10 border border-transparent transition-all active:scale-95 ${loading
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 cursor-not-allowed'
              : 'bg-brand hover:bg-brand-light'
            }`}
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} strokeWidth={2.5} />
        </button>
      </div>
    </header>
  );
}
