import React from 'react';
import { TrendingUp } from 'lucide-react';

// Este componente representa la tarjeta GRANDE que muestra la tasa principal (USDT)
export default function RateCardLarge({
  rate,
  spread,
  diffBs,
  renderChange,
  formatVES,
  size = 'large' // Prop para controlar el tamaño (large/medium)
}) {
  const textSize = size === 'large' ? 'text-[4rem]' : 'text-4xl';
  const subTextSize = size === 'large' ? 'text-3xl' : 'text-2xl';

  return (
    <div className="relative group">
      {/* Efecto de fondo brillante */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-brand/30 to-purple-500/30 rounded-[2.2rem] blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
      
      <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-7 shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Icono de fondo decorativo */}
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.02] transform rotate-12 pointer-events-none">
          <TrendingUp size={140} />
        </div>
        
        {/* Encabezado de la tarjeta */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-400 dark:text-slate-500">Promedio P2P</span>
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
              Tasa USDT {rate.type === 'p2p' && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
            </h2>
          </div>
          {renderChange(rate.change)}
        </div>

        {/* Precio principal */}
        <div className="flex items-baseline gap-1 mb-6">
          <span className="text-2xl text-slate-300 dark:text-slate-600 font-bold font-sans transform -translate-y-4">$</span>
          <div className={`${textSize} leading-none font-black text-slate-900 dark:text-white tracking-tighter font-mono`}>
            {formatVES(rate.price).split(',')[0]}
            <span className={`${subTextSize} text-slate-400 dark:text-slate-600`}>,{formatVES(rate.price).split(',')[1]}</span>
          </div>
          <span className="text-xl font-bold text-slate-400 ml-2">Bs</span>
        </div>

        {/* Footer con info de brecha */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-50 dark:border-slate-800">
          <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${spread > 10 ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
            Brecha: {spread.toFixed(2)}%
          </div>
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 truncate">Diferencia: {formatVES(diffBs)} Bs</span>
        </div>
      </div>
    </div>
  );
}
