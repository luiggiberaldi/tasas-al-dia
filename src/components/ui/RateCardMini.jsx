import React from 'react';

// Componente pequeño para tarjetas secundarias (BCV, Euro)
export default function RateCardMini({ title, price, change, icon, formatVES, renderChange }) {
    return (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 duration-300">
            {/* Icono y % de cambio */}
            <div className="flex justify-between items-start mb-4">
                <span className="text-xl filter grayscale opacity-80">{icon}</span>
                {/* Si no hay cambio, se renderiza un div vacío para mantener la altura */}
                {change !== 0 ? renderChange(change) : <div className="h-5"></div>}
            </div>
            {/* Título y precio */}
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">{title}</span>
            <div className="text-xl font-black text-slate-800 dark:text-white tracking-tight font-mono">{formatVES(price)}</div>
            <div className="text-[10px] text-slate-400 font-medium">Bs / $</div>
        </div>
    );
}