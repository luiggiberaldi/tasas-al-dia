import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Copy, MessageSquare, Camera, ArrowRightLeft, User } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useCalculator } from '../../hooks/useCalculator';
import { interpretVoiceCommandAI } from '../../utils/groqClient';
import { Modal } from '../../components/Modal';
import CalculatorInput from '../../components/CalculatorInput';
import { AccountSelector } from './AccountSelector';
import { PaymentSummaryChat } from './PaymentSummaryChat';
import { formatBs, formatUsd } from '../../utils/calculatorUtils';
import { useToast, Toast } from '../../components/Toast';

export const ManualMode = ({ rates, accounts, theme, clientName, setClientName }) => {
    const calc = useCalculator(rates);
    const { toast, showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const captureRef = useRef(null);

    const modifiedCurrencies = calc.currencies.map(c => ({ ...c, label: (c.label === '$ BCV' || c.id === 'USD' || c.id === 'BCV') ? 'USD' : c.label }));

    useEffect(() => {
        if (accounts.length === 1) setSelectedAccount(accounts[0]);
    }, [accounts]);

    const handleVoiceFill = () => {
        if (!window.webkitSpeechRecognition) return alert("Usa Chrome.");
        const recognition = new window.webkitSpeechRecognition();
        recognition.lang = 'es-VE'; recognition.start();
        setIsListening(true);
        recognition.onresult = async (e) => {
            setIsListening(false);
            const res = await interpretVoiceCommandAI(e.results[0][0].transcript);
            if (res?.amount) {
                if (res.currency) calc.setFrom(res.currency.toUpperCase());
                if (res.targetCurrency) calc.setTo(res.targetCurrency.toUpperCase());
                if (res.clientName) setClientName(res.clientName);
                calc.handleAmountChange(res.amount.toString(), 'top');
            }
        };
        recognition.onend = () => setIsListening(false);
    };

    const handleCopy = () => {
        if (!calc.amountBot) return;
        const result = calc.to === 'VES' ? formatBs(calc.amountBot) : formatUsd(calc.amountBot);
        navigator.clipboard.writeText(calc.amountBot);
        showToast(`Copiado: ${result}`);
    };

    const handleShareImage = async () => {
        if (!captureRef.current) return;
        const canvas = await html2canvas(captureRef.current, { backgroundColor: theme === 'dark' ? '#0f172a' : '#f8fafc', scale: 2 });
        const link = document.createElement('a'); link.href = canvas.toDataURL("image/png"); link.download = `Calculo.png`; link.click();
    };
    
    const handleCobrarClick = () => {
        if (accounts.length !== 1) setSelectedAccount(null);
        setIsModalOpen(true);
    }

    const onConfirmShare = (msg) => {
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
        setIsModalOpen(false);
        setClientName('');
    }

    const formatRate = (rate) => rate < 1 ? rate.toFixed(6) : rate.toFixed(2);

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950/50">
            <Toast message={toast.message} show={toast.show} />
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <div ref={captureRef} className="space-y-6 pb-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Conversión Rápida</h2>
                            <p className="text-sm text-slate-400 font-medium">Calculadora de precisión</p>
                        </div>
                        <button onClick={handleVoiceFill} className={`p-3 rounded-2xl transition-all duration-300 shadow-sm border border-slate-100 dark:border-slate-800 ${isListening ? 'bg-rose-500 text-white animate-pulse shadow-rose-200' : 'bg-white dark:bg-slate-900 text-slate-400 hover:text-brand-dark'}`}>
                            {isListening ? <MicOff size={20}/> : <Mic size={20}/>}
                        </button>
                    </div>

                     <div className="relative flex flex-col gap-2">
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm p-1 z-0">
                           <CalculatorInput label="TENGO" amount={calc.amountTop} currency={calc.from} currencies={modifiedCurrencies} onAmountChange={(v) => calc.handleAmountChange(v, 'top')} onCurrencyChange={calc.setFrom} onClear={calc.clear}/>
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center gap-4">
                            <div className="text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-800/50 py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                                1 {calc.from} = {formatRate(calc.currentRate)} {calc.to}
                            </div>
                            <button onClick={calc.handleSwap} className="bg-brand text-slate-900 p-3 rounded-full shadow-xl hover:scale-110 hover:rotate-180 transition-all duration-300 border-[6px] border-slate-50 dark:border-slate-950">
                                <ArrowRightLeft size={22} strokeWidth={2.5} />
                            </button>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm p-1 z-0">
                           <CalculatorInput label="RECIBO" amount={calc.amountBot} currency={calc.to} currencies={modifiedCurrencies} onAmountChange={(v) => calc.handleAmountChange(v, 'bot')} onCurrencyChange={calc.setTo} onClear={calc.clear}/>
                        </div>
                    </div>

                    <div className="relative">
                        <User size={16} className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"/>
                        <input 
                            type="text"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            placeholder="¿Para quién es el cobro? (Opcional)"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm font-semibold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-dark outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="p-5 pt-2 flex-shrink-0 z-20 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent dark:from-slate-950 dark:via-slate-950">
                <div className="flex items-center gap-3">
                    <button onClick={handleCopy} className="h-20 w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 flex flex-col items-center justify-center gap-1 shadow-sm">
                        <Copy size={20}/>
                        <span className="text-[9px] font-bold uppercase tracking-widest">Copiar</span>
                    </button>
                    
                    {/* ✅ AJUSTE DE MARGEN FORZADO CON ESTILO EN LÍNEA */}
                    <button onClick={handleCobrarClick} disabled={!calc.amountTop} className="flex-1 h-20 bg-brand text-slate-900 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg shadow-brand/20 hover:shadow-brand/40 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 flex items-center justify-center">
                        <MessageSquare size={22} strokeWidth={2.5} />
                        <span className="whitespace-nowrap" style={{ marginLeft: '12px' }}>{clientName ? `Nota para ${clientName}`: 'Generar Nota'}</span>
                    </button>
                    
                    <button onClick={handleShareImage} className="h-20 w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 flex flex-col items-center justify-center gap-1 shadow-sm">
                        <Camera size={20}/>
                        <span className="text-[9px] font-bold uppercase tracking-widest">Captura</span>
                    </button>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={clientName ? `Nota para ${clientName}` : (accounts.length === 1 ? "Confirmar Pago" : "Seleccionar Cuenta")}>
                 {selectedAccount ? (
                    <PaymentSummaryChat 
                        selectedAccount={selectedAccount} 
                        chatData={{
                            originalAmount: parseFloat(calc.amountTop || 0),
                            originalSource: calc.from,
                            resultAmount: parseFloat(calc.amountBot || 0),
                            targetCurrency: calc.to,
                            clientName: clientName
                        }}
                        rates={rates}
                        onBack={() => accounts.length > 1 && setSelectedAccount(null)}
                        onConfirm={onConfirmShare}
                    />
                 ) : (
                    <AccountSelector accounts={accounts} onSelect={(acc) => setSelectedAccount(acc)} />
                 )}
            </Modal>
        </div>
    );
};