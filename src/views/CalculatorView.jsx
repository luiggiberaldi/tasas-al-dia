import React, { useState, useEffect } from 'react';
import { useSpeech } from '../hooks/useSpeech';
import { CalculatorHeader } from '../components/calculator/CalculatorHeader';
import { ManualMode } from '../components/calculator/ManualMode'; // (Asume que creaste este archivo con el código de ManualCalculator)
import { ChatMode } from '../components/calculator/ChatMode';

const SAFE_RATES = { usdt: { price: 0 }, bcv: { price: 0 }, euro: { price: 0 } };

export default function CalculatorView({ rates, theme }) {
  const currentRates = rates || SAFE_RATES;
  const [viewMode, setViewMode] = useState('chat');
  const [accounts, setAccounts] = useState([]);
  
  // Hook de Voz (compartido por header y chat)
  const voiceControl = useSpeech();

  useEffect(() => {
    try { setAccounts(JSON.parse(localStorage.getItem('my_accounts_v2')) || []); } catch (e) {}
  }, []);

  return (
    <div className="flex flex-col h-[88vh] bg-slate-50 dark:bg-slate-950 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative ring-4 ring-slate-100 dark:ring-slate-900/50 animate-in fade-in duration-500">
      
      <CalculatorHeader 
        viewMode={viewMode} 
        setViewMode={setViewMode} 
        voiceEnabled={voiceControl.voiceEnabled}
        setVoiceEnabled={voiceControl.setVoiceEnabled}
        onClearChat={() => { /* Implementar limpieza si es necesario pasar al hook */ }}
      />

      <div className="flex-1 overflow-hidden relative bg-slate-50/50 dark:bg-slate-950/50">
          {viewMode === 'manual' ? (
              <ManualMode rates={currentRates} accounts={accounts} theme={theme} />
          ) : (
              <ChatMode rates={currentRates} accounts={accounts} voiceControl={voiceControl} />
          )}
      </div>
    </div>
  );
}