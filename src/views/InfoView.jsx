import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Terminal, ShieldAlert } from 'lucide-react';

export default function InfoView({ logs, isOffline }) {
  // Estado para el secreto
  const [secretCount, setSecretCount] = useState(0);
  const [showLogs, setShowLogs] = useState(false);

  const handleSecretTrigger = () => {
    const next = secretCount + 1;
    setSecretCount(next);

    // Al llegar a 7 toques, alterna la visibilidad de los logs
    if (next === 7) {
        setShowLogs(!showLogs);
        setSecretCount(0); // Reinicia contador
    }

    // Si deja de tocar por 2 segundos, reinicia el contador
    if (next === 1) {
        setTimeout(() => setSecretCount(0), 2000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pt-6 px-4 pb-24">
        
        {/* HEADER INTERACTIVO (GATILLO DEL SECRETO) */}
        <div 
            onClick={handleSecretTrigger} 
            className="select-none cursor-pointer active:opacity-50 transition-opacity"
        >
            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Información</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium font-mono">
                {showLogs ? '🔓 Modo Depuración: VISIBLE' : 'Estado y Logs del sistema'}
            </p>
        </div>

        {/* --- CAJA DE LOGS (OCULTA POR DEFECTO) --- */}
        {showLogs && (
            <div className="bg-slate-950 rounded-2xl p-4 shadow-2xl border border-slate-800 overflow-hidden animate-in zoom-in duration-300">
                <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
                    <Terminal size={14} className="text-emerald-500" />
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                        Registro de Conexión
                    </span>
                </div>
                
                <div className="font-mono text-[10px] text-slate-300 h-48 overflow-y-auto space-y-1.5 scrollbar-hide">
                    {logs && logs.length > 0 ? (
                        [...logs].reverse().map((log, i) => { // Mostramos invertido para ver el más nuevo arriba
                             const isString = typeof log === 'string';
                             const text = isString ? log : (log.msg || JSON.stringify(log));
                             return (
                                <div key={i} className="break-all border-l-2 border-slate-800 pl-2 hover:border-emerald-500 transition-colors">
                                    <span className="opacity-40 mr-2 block text-[8px]">{isString ? 'Log' : log.time}</span>
                                    <span className={text.includes('Error') ? 'text-rose-400' : text.includes('✅') ? 'text-emerald-400' : 'text-slate-300'}>
                                        {text}
                                    </span>
                                </div>
                             )
                        })
                    ) : (
                        <div className="text-slate-600 italic text-center py-4">Esperando datos...</div>
                    )}
                </div>
            </div>
        )}

        {/* --- TARJETA: AVISO --- */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex gap-4 items-start">
            <div className="p-3 rounded-2xl bg-orange-50 text-orange-500 dark:bg-orange-900/20 dark:text-orange-400 shrink-0">
                <AlertTriangle size={24} />
            </div>
            <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-1">Aviso Importante</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Los datos son referenciales (BCV, Mercados P2P). No somos una entidad financiera.
                </p>
            </div>
        </div>

        {/* --- TARJETA: ESTADO --- */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex gap-4 items-center">
             <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20 dark:text-emerald-400 shrink-0">
                <CheckCircle2 size={24} />
            </div>
            <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-0.5">Estado</h3>
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`}></span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {isOffline ? 'Sin Conexión' : 'API: Conectada'}
                    </span>
                </div>
            </div>
        </div>

        {/* CREDITOS */}
        <div className="text-center pt-8 opacity-30 select-none">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">TasasAlDía v3.0</p>
        </div>
    </div>
  );
}