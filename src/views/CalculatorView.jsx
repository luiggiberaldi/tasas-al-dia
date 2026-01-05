import React, { useState, useEffect } from 'react';
import { useSpeech } from '../hooks/useSpeech';
import { CalculatorHeader } from '../components/calculator/CalculatorHeader';
import { ManualMode } from '../components/calculator/ManualMode';
import { ChatMode } from '../components/calculator/ChatMode';
import { useToast, Toast } from '../components/Toast';

const SAFE_RATES = { usdt: { price: 0 }, bcv: { price: 0 }, euro: { price: 0 } };

export default function CalculatorView({ rates, theme }) {
  const currentRates = rates || SAFE_RATES;
  const [viewMode, setViewMode] = useState('manual');
  const [accounts, setAccounts] = useState([]);
  const { toast, showToast } = useToast();
  const [clientName, setClientName] = useState('');
  
  const voiceControl = useSpeech();

  useEffect(() => {
    try { setAccounts(JSON.parse(localStorage.getItem('my_accounts_v2')) || []); } catch (e) {}
  }, []);

  // ✅ Contenedor principal corregido
  // Se elimina la altura fija (h-[88vh]) y se usa un flexbox que ocupa toda la altura disponible.
  return (
    <div className="h-full w-full flex flex-col bg-slate-50 dark:bg-slate-950 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative ring-4 ring-slate-100 dark:ring-slate-900/50 animate-in fade-in duration-500">
      <Toast message={toast.message} show={toast.show} />
      
      <CalculatorHeader 
        viewMode={viewMode} 
        setViewMode={setViewMode} 
        voiceEnabled={voiceControl.voiceEnabled}
        setVoiceEnabled={voiceControl.setVoiceEnabled}
        clientName={clientName}
      />

      {/* ✅ Contenedor de contenido con scroll interno */}
      {/* flex-1 asegura que ocupe el espacio restante y overflow-y-auto activa el scroll solo aquí */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50">
          {viewMode === 'manual' ? (
              <ManualMode 
                rates={currentRates} 
                accounts={accounts} 
                theme={theme} 
                clientName={clientName}
                setClientName={setClientName}
              />
          ) : (
              <ChatMode 
                rates={currentRates} 
                accounts={accounts} 
                voiceControl={voiceControl} 
                showToast={showToast}
                setClientName={setClientName}
              />
          )}
      </div>
    </div>
  );
}