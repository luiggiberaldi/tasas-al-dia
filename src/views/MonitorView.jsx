import React, { useState, useRef } from 'react';
import { TrendingUp, TrendingDown, Clock, Maximize, Minimize, Camera, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';

import Header from '../components/ui/Header';
import RateCardLarge from '../components/ui/RateCardLarge';
import RateCardMini from '../components/ui/RateCardMini'; // ✨ 1. IMPORTAMOS RateCardMini

export default function MonitorView({ 
  rates, 
  loading, 
  onRefresh, 
  theme, 
  enableNotifications, 
  notificationsEnabled, 
  addLog 
}) {
  
  const [kioskMode, setKioskMode] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const kioskRef = useRef(null);

  const formatVES = (amount) => {
    return new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  };

  const spread = rates.bcv.price > 0 ? ((rates.usdt.price - rates.bcv.price) / rates.bcv.price) * 100 : 0;
  const diffBs = rates.usdt.price - rates.bcv.price;

  const renderChange = (change) => {
    if (!change || change === 0) return null;
    const isPositive = change > 0;
    return (
      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 border ${isPositive ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30' : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/30'}`}>
        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {Math.abs(change).toFixed(2)}%
      </span>
    );
  };

  const handleCaptureKiosk = async () => {
      if (!kioskRef.current || isCapturing) return;
      setIsCapturing(true);
      const log = addLog || console.log;

      try {
          const canvas = await html2canvas(kioskRef.current, { useCORS: true, scale: window.devicePixelRatio, backgroundColor: '#020617', ignoreElements: (el) => el.id === 'hide-on-capture' });
          const image = canvas.toDataURL("image/jpeg", 0.9);
          const link = document.createElement('a');
          const dateStr = new Date().toLocaleDateString('es-VE').replace(/\//g, '-');
          const timeStr = new Date().toLocaleTimeString('es-VE', { hour12: false }).replace(/:/g, '');
          link.download = `TasasAlDía_${dateStr}_${timeStr}.jpg`;
          link.href = image;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          log("Captura guardada con éxito", "success");
      } catch (e) {
          console.error("Error captura:", e);
          alert("Hubo un error al guardar la imagen.");
      } finally {
          setIsCapturing(false);
      }
  };

  if (kioskMode) {
    return (
      <div ref={kioskRef} className="fixed inset-0 z-[100] bg-slate-950 text-white flex flex-col justify-between items-center p-6 animate-in zoom-in duration-300" style={{ fontFamily: 'sans-serif' }}>
          <button id="hide-on-capture" onClick={() => setKioskMode(false)} className="absolute top-6 right-6 p-3 bg-white/10 rounded-full text-white/50 hover:text-white transition-colors z-20"><Minimize size={24}/></button>
          <div className="flex flex-col items-center mt-12 gap-4"><img src="/logodark.png" alt="TasasAlDía" className="h-20 w-auto object-contain drop-shadow-lg"/><div className="bg-slate-800/60 px-4 py-1.5 rounded-full border border-slate-700/50 backdrop-blur-md"><p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">MONITOR EN TIEMPO REAL</p></div></div>
          <div className="flex flex-col items-center justify-center -mt-8"><h1 className="text-[18vw] sm:text-[10rem] font-black font-mono leading-none tracking-tighter text-brand drop-shadow-[0_0_40px_rgba(255,204,0,0.2)]">{formatVES(rates.usdt.price).split(',')[0]}<span className="text-[10vw] sm:text-[5rem] text-slate-500">,{formatVES(rates.usdt.price).split(',')[1]}</span></h1><p className="text-xl sm:text-3xl text-slate-500 font-mono font-medium tracking-widest mt-2">1 USDT = BS</p></div>
          <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-sm rounded-[2rem] border border-slate-800/50 p-6 sm:p-8 flex justify-between items-center mb-8"><div className="text-center w-1/2 border-r border-slate-800 pr-4"><p className="text-xs sm:text-sm font-bold uppercase text-slate-500 tracking-wider mb-2">BCV OFICIAL</p><p className="text-2xl sm:text-4xl font-mono font-bold text-white">{formatVES(rates.bcv.price)}</p></div><div className="text-center w-1/2 pl-4"><p className="text-xs sm:text-sm font-bold uppercase text-slate-500 tracking-wider mb-2">EURO BCV</p><p className="text-2xl sm:text-4xl font-mono font-bold text-white">{formatVES(rates.euro.price)}</p></div></div>
          <div className="flex flex-col items-center gap-6 mb-8 w-full relative z-10"><div className="text-center opacity-60"><p className="text-lg font-medium text-brand">{rates.lastUpdate ? new Date(rates.lastUpdate).toLocaleDateString('es-VE', { day: 'numeric', month: 'long' }) : '---'}</p><p className="text-sm font-mono">{rates.lastUpdate ? new Date(rates.lastUpdate).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--'}</p></div>{!isCapturing && <button id="hide-on-capture" onClick={handleCaptureKiosk} className="flex items-center gap-2 bg-brand text-slate-900 px-6 py-3 rounded-full font-bold shadow-lg shadow-brand/20 active:scale-95 transition-transform">{isCapturing ? <Loader2 size={20} className="animate-spin"/> : <Camera size={20}/>}<span>Guardar Imagen</span></button>}</div>
      </div>
    );
  }

  if (loading && (!rates || !rates.usdt || rates.usdt.price === 0)) {
    return (
        <div className="space-y-8 pt-6 px-1 animate-pulse">
            <div className="flex justify-between items-center mb-8 px-2"><div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div><div className="flex gap-2"><div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-xl"></div><div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-xl"></div></div></div>
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-[2rem]"></div>
            <div className="grid grid-cols-2 gap-4"><div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-[1.5rem]"></div><div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-[1.5rem]"></div></div>
        </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-24 relative">
      <Header 
        theme={theme}
        setKioskMode={setKioskMode}
        enableNotifications={enableNotifications}
        notificationsEnabled={notificationsEnabled}
        onRefresh={onRefresh}
        loading={loading}
      />

      <div className="grid gap-6">
          <RateCardLarge 
            rate={rates.usdt}
            spread={spread}
            diffBs={diffBs}
            renderChange={renderChange}
            formatVES={formatVES}
          />

          <div className="grid grid-cols-2 gap-4">
              <RateCardMini title="Dolar BCV Oficial" price={rates.bcv.price} change={rates.bcv.change} icon="🏛️" formatVES={formatVES} renderChange={renderChange} />
              <RateCardMini title="Euro BCV Oficial" price={rates.euro.price} change={rates.euro.change} icon="🇪🇺" formatVES={formatVES} renderChange={renderChange} />
          </div>
      </div>
      
      <div className="flex justify-center pb-4 opacity-60 hover:opacity-100 transition-opacity"><div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50"><Clock size={12} className="text-slate-400" /><span className="text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400">Actualizado: {rates.lastUpdate ? new Date(rates.lastUpdate).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--'}</span></div></div>
    </div>
  );
}

// ✨ 2. ELIMINAMOS RateCardMini de aquí
