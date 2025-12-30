import React, { useState, useRef, useEffect } from 'react';
import { ArrowRightLeft, Check, Copy, Camera, ToggleLeft, ToggleRight, Smartphone, Building2, Bitcoin, Wallet, ArrowLeft, DollarSign, Mic, MicOff } from 'lucide-react';
import html2canvas from 'html2canvas';

// Imports Arquitectura
import { useCalculator } from '../hooks/useCalculator'; 
import { formatBs, formatUsd } from '../utils/calculatorUtils'; 
import { Modal } from '../components/Modal';
import CalculatorInput from '../components/CalculatorInput';

export default function CalculatorView({ rates, theme }) {
  // 1. Hook de Calculadora
  const calc = useCalculator(rates);
  
  // 2. Estado de Cuentas
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('my_accounts_v2')) || [];
      setAccounts(saved);
    } catch (e) { console.error("Error cargando cuentas", e); }
  }, []);
  
  // 3. Estado de UI
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [includeRef, setIncludeRef] = useState(true);
  const captureRef = useRef(null);

  // Estado de Escucha de Voz
  const [isListening, setIsListening] = useState(false);

  // --- FEATURE: CONTROL POR VOZ ---
  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Tu navegador no soporta el reconocimiento de voz. Intenta usar Chrome.");
        return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'es-VE'; 
    recognition.continuous = false;
    recognition.interimResults = false;
    
    setIsListening(true);
    recognition.start();

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        const numbers = transcript.match(/(\d+[.,]?\d*)/); 
        
        if (numbers) {
            let amount = numbers[0].replace(',', '.');
            
            if (transcript.includes('bolívar') || transcript.includes('bolívares') || transcript.includes('bs')) {
                calc.setFrom('VES');
                calc.handleAmountChange(amount, 'top');
            } else if (transcript.includes('dólar') || transcript.includes('dólares') || transcript.includes('usdt')) {
                calc.setFrom('USDT'); 
                calc.handleAmountChange(amount, 'top');
            } else if (transcript.includes('euro') || transcript.includes('euros')) {
                calc.setFrom('EUR');
                calc.handleAmountChange(amount, 'top');
            } else {
                calc.handleAmountChange(amount, 'top');
            }
        }
        setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  // --- Handlers ---
  const handleCopy = () => {
    if (!calc.amountBot && !calc.amountTop) return;
    const date = new Date().toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit' });
    const cFrom = calc.currencies.find(c => c.id === calc.from);
    const cTo = calc.currencies.find(c => c.id === calc.to);
    
    const fmtTop = cFrom.id === 'VES' ? formatBs(calc.safeParse(calc.amountTop)) : formatUsd(calc.safeParse(calc.amountTop));
    const fmtBot = cTo.id === 'VES' ? formatBs(calc.safeParse(calc.amountBot)) : formatUsd(calc.safeParse(calc.amountBot));
    
    // Versión simple para copiar
    const text = `💰 Cambio del día (${date})\n${fmtTop} ${cFrom.label} -> ${fmtBot} ${cTo.label}`;
    
    navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  // ✅ HANDLER WHATSAPP CORREGIDO (Sin Cálculo en el Header)
  const handleShareWhatsApp = (zelleRateType = 'bcv') => {
    if (!selectedAccount) return;

    // 1. Inicializamos el mensaje vacío (Ya no incluye el cálculo arriba)
    let msg = "";

    // 2. Datos de la cuenta (Texto plano)
    const acc = selectedAccount;
    if (acc.type === 'pago_movil') {
        msg += `*Datos Pago Móvil*\nBanco: ${acc.bank}\nTel: ${acc.phone}\nCI: ${acc.id}\nTitular: ${acc.holder || acc.alias}`;
    } else if (acc.type === 'transferencia') {
        msg += `*Datos Transferencia*\nBanco: ${acc.bank}\nCuenta: ${acc.accountNumber}\nCI/RIF: ${acc.id}\nTitular: ${acc.holder}`;
    } else if (acc.type === 'zelle') {
        msg += `*Datos Zelle*\nEmail: ${acc.email}\nTitular: ${acc.holder}`;
    } else if (acc.type === 'binance') {
        msg += `*Binance Pay*\nID/Email: ${acc.email}\nAlias: ${acc.holder || acc.alias}`;
    }

    // 3. Cálculo de montos para el bloque final
    const valTop = calc.safeParse(calc.amountTop);
    const valBot = calc.safeParse(calc.amountBot);
    
    let amountBs = 0;
    let amountUsd = 0;

    // Determinar montos base
    if (calc.from === 'VES') { amountBs = valTop; amountUsd = valBot; }
    else if (calc.to === 'VES') { amountBs = valBot; amountUsd = valTop; }
    else { 
        amountUsd = (calc.from === 'USD' || calc.from === 'USDT') ? valTop : valBot;
        amountBs = amountUsd * rates.bcv.price; 
    }

    // 4. Construcción del Bloque de Monto y Referencia
    if (acc.type === 'pago_movil' || acc.type === 'transferencia') {
        // MONTO EN BOLÍVARES
        msg += `\n\n*Monto: ${formatBs(amountBs)} Bs*`;
        
        // Referencia opcional (SOLO BCV)
        if (includeRef) {
            const refUsd = amountBs / rates.bcv.price;
            msg += `\n(Ref: $${formatUsd(refUsd)} @ BCV)`;
        }
    
    } else if (acc.type === 'binance') {
        msg += `\n\n*Monto: ${formatUsd(amountUsd)} USDT*`;
        if (includeRef) {
            const refBs = amountUsd * rates.usdt.price;
            msg += `\n(Ref: ${formatBs(refBs)} Bs @ Tasa USDT)`;
        }
    
    } else if (acc.type === 'zelle') {
        msg += `\n\n*Monto: $${formatUsd(amountUsd)}*`;
        if (includeRef) {
            const usedRate = zelleRateType === 'bcv' ? rates.bcv.price : rates.usdt.price;
            const refBs = amountUsd * usedRate;
            msg += `\n(Ref: ${formatBs(refBs)} Bs @ Tasa ${zelleRateType.toUpperCase()})`;
        }
    }

    // 5. Footer Obligatorio
    msg += `\n\n*Por favor enviar capture del comprobante de pago.*`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    setIsModalOpen(false); setSelectedAccount(null);
  };

  const handleShareImage = async () => {
    if (captureRef.current) {
        try {
            const canvas = await html2canvas(captureRef.current, { 
                backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff', 
                scale: 2, logging: false, useCORS: true 
            });
            const link = document.createElement('a');
            link.href = canvas.toDataURL("image/png");
            link.download = `Calculo.png`;
            link.click();
        } catch (e) { console.error(e); }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
      
      {/* Header */}
      <div className="px-1 flex justify-between items-end">
          <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white transition-colors tracking-tight">Calculadora</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium font-mono">1 USDT = {new Intl.NumberFormat('es-VE').format(rates.usdt.price)} Bs</p>
          </div>
          
          <button 
            onClick={handleVoiceInput}
            className={`p-3 rounded-2xl transition-all shadow-lg active:scale-95 ${isListening ? 'bg-red-500 text-white animate-pulse shadow-red-500/30' : 'bg-white dark:bg-slate-800 text-brand-dark dark:text-brand shadow-slate-200/50 dark:shadow-none'}`}
            title="Dictar monto por voz"
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
      </div>
      
      {/* Tarjeta Principal */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 transition-colors duration-300">
          
          <div ref={captureRef} className="bg-white dark:bg-slate-900 p-2 rounded-xl"> 
              <CalculatorInput 
                label="Tengo" amount={calc.amountTop} currency={calc.from} currencies={calc.currencies}
                onAmountChange={(v) => calc.handleAmountChange(v, 'top')}
                onCurrencyChange={calc.setFrom}
                onClear={calc.clear}
              />
              
              <div className="flex justify-center -my-3 relative z-20">
                  <button onClick={calc.handleSwap} className="bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-900 p-2 rounded-full shadow-lg text-brand hover:text-brand-dark dark:text-brand dark:hover:text-white transition-all active:scale-90 active:rotate-180 duration-300">
                      <ArrowRightLeft size={20} strokeWidth={3} />
                  </button>
              </div>
              
              <CalculatorInput 
                label="Recibo / Equivalente" amount={calc.amountBot} currency={calc.to} currencies={calc.currencies}
                onAmountChange={(v) => calc.handleAmountChange(v, 'bot')}
                onCurrencyChange={calc.setTo}
                onClear={calc.clear}
              >
                  {getVisualEquivalent(calc) && (
                      <div className="flex justify-end animate-in fade-in slide-in-from-top-1 px-1 mt-1">
                          <div className="flex items-center gap-2 px-2 py-1 rounded-lg opacity-60">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Son:</span>
                              <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                                  {getVisualEquivalent(calc)} <span className="text-[10px]">Bs</span>
                              </span>
                          </div>
                      </div>
                  )}
              </CalculatorInput>

              <div className="flex gap-2 mt-6 justify-center flex-wrap">
                  {[5, 10, 20, 50, 100].map(val => (
                      <button key={val} onClick={() => calc.handleQuickAdd(val)} className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2.5 rounded-xl text-sm font-bold font-mono hover:bg-brand hover:text-slate-900 dark:hover:bg-brand dark:hover:text-slate-900 transition-all active:scale-95 border border-slate-200 dark:border-slate-700">+{val}</button>
                  ))}
              </div>
          </div>

          <div className="mt-6 flex gap-3 justify-center">
              <button onClick={handleCopy} className="flex-none flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-5 py-3.5 rounded-2xl text-xs font-bold transition-all active:scale-95 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700">
                  {copied ? <Check size={20} className="text-emerald-500"/> : <Copy size={20}/>}
              </button>
              
              <button 
                onClick={() => { setSelectedAccount(null); setIsModalOpen(true); }} 
                disabled={!calc.amountTop}
                className="flex-1 flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-slate-900 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-brand/20 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  <WhatsAppIcon size={20} /> COBRAR
              </button>

              <button onClick={handleShareImage} className="flex-none flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-5 py-3.5 rounded-2xl text-xs font-bold transition-all active:scale-95 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700">
                  <Camera size={20}/>
              </button>
          </div>
      </div>

      {/* --- MODAL DE COBRO --- */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedAccount ? "Confirmar Envío" : "Selecciona Método"}>
         {!selectedAccount ? (
             <AccountSelector accounts={accounts} onSelect={(acc) => { setSelectedAccount(acc); setIncludeRef(true); }} />
         ) : (
             <PaymentSummary 
                selectedAccount={selectedAccount} 
                includeRef={includeRef} 
                onToggleRef={() => setIncludeRef(!includeRef)}
                onBack={() => setSelectedAccount(null)}
                onConfirm={handleShareWhatsApp}
                rates={rates} 
                calc={calc}   
             />
         )}
      </Modal>
    </div>
  );
}

// --- SUB-COMPONENTES ---

function AccountSelector({ accounts, onSelect }) {
    const getIcon = (t) => {
        if(t === 'pago_movil') return <Smartphone size={18} className="text-emerald-500"/>;
        if(t === 'binance') return <Bitcoin size={18} className="text-amber-500"/>;
        if(t === 'zelle') return <DollarSign size={18} className="text-purple-500"/>;
        return <Building2 size={18} className="text-blue-500"/>;
    };
    const getBg = (t) => {
        if(t === 'pago_movil') return 'bg-emerald-100';
        if(t === 'binance') return 'bg-amber-100';
        if(t === 'zelle') return 'bg-purple-100';
        return 'bg-blue-100';
    };
    
    if (accounts.length === 0) return (
        <div className="text-center py-6 text-slate-400">
            <Wallet size={48} className="mx-auto mb-2 opacity-50"/>
            <p>No tienes cuentas guardadas.</p>
            <p className="text-xs mt-1">Ve a la pestaña "Cuentas" para agregar una.</p>
        </div>
    );

    return (
        <div className="grid gap-3">
            {accounts.map(acc => (
                <button key={acc.id_gen} onClick={() => onSelect(acc)} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-brand dark:hover:border-brand hover:bg-brand/5 transition-all text-left group">
                    <div className={`p-3 rounded-2xl shrink-0 ${getBg(acc.type)}`}>
                        {getIcon(acc.type)}
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm group-hover:text-brand-dark dark:group-hover:text-brand transition-colors">{acc.alias}</h4>
                        <p className="text-xs text-slate-500 font-mono mt-0.5 capitalize">{acc.type.replace('_', ' ')}</p>
                    </div>
                </button>
            ))}
        </div>
    );
}

function PaymentSummary({ selectedAccount, includeRef, onToggleRef, onBack, onConfirm, rates, calc }) {
    const [zelleRate, setZelleRate] = useState('bcv');
    const acc = selectedAccount;
    
    // Obtener valores de la calculadora
    const valTop = calc.safeParse(calc.amountTop);
    const valBot = calc.safeParse(calc.amountBot);
    
    let amountBs = 0;
    let amountUsd = 0;

    // Lógica para determinar el monto base
    if (calc.from === 'VES') { amountBs = valTop; amountUsd = valBot; }
    else if (calc.to === 'VES') { amountBs = valBot; amountUsd = valTop; }
    else { 
        amountUsd = (calc.from === 'USD' || calc.from === 'USDT') ? valTop : valBot;
        amountBs = amountUsd * rates.bcv.price; 
    }

    // Texto del Toggle (solo informativo)
    let labelText = '';
    if (acc.type === 'pago_movil' || acc.type === 'transferencia') {
        const refUsd = amountBs / rates.bcv.price;
        labelText = `Incluir referencia en Dólares ($${formatUsd(refUsd)})`;
    } else if (acc.type === 'binance') {
        const refBs = amountUsd * rates.usdt.price;
        labelText = `Incluir referencia en Bolívares (${formatBs(refBs)} Bs)`;
    } else if (acc.type === 'zelle') {
        const usedRate = zelleRate === 'bcv' ? rates.bcv.price : rates.usdt.price;
        const refBs = amountUsd * usedRate;
        labelText = `Incluir referencia en Bolívares (${formatBs(refBs)} Bs)`;
    }

    const getIcon = (t) => {
        if(t === 'pago_movil') return <Smartphone size={18} className="text-emerald-500"/>;
        if(t === 'binance') return <Bitcoin size={18} className="text-amber-500"/>;
        if(t === 'zelle') return <DollarSign size={18} className="text-purple-500"/>;
        return <Building2 size={18} className="text-blue-500"/>;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            
            {acc.type === 'zelle' && (
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-2">
                    <button 
                        onClick={() => setZelleRate('bcv')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${zelleRate === 'bcv' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400'}`}
                    >
                        Tasa BCV
                    </button>
                    <button 
                        onClick={() => setZelleRate('usdt')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${zelleRate === 'usdt' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400'}`}
                    >
                        Tasa USDT
                    </button>
                </div>
            )}

            <div className="bg-slate-100 dark:bg-slate-800 rounded-3xl p-4 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 ml-1 leading-tight max-w-[70%]">
                    {includeRef ? labelText : "Solo enviar datos de cuenta"}
                </span>
                <button onClick={onToggleRef} className={`transition-colors duration-200 ${includeRef ? 'text-emerald-500' : 'text-slate-300'}`}>
                    {includeRef ? <ToggleRight size={36} strokeWidth={2} /> : <ToggleLeft size={36} strokeWidth={2} />}
                </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 opacity-75">
                <div className="flex items-center gap-3 mb-2">
                    {getIcon(acc.type)}
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{acc.alias}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono break-all">
                    {acc.type === 'pago_movil' ? `${acc.bank} • ${acc.phone}` : 
                     acc.type === 'transferencia' ? `${acc.bank} • ${acc.accountNumber.slice(-4)}` :
                     acc.email}
                </div>
            </div>

            <div className="flex gap-3">
                <button onClick={onBack} className="flex-none p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <button 
                    onClick={() => onConfirm(zelleRate)} 
                    className="flex-1 bg-brand hover:bg-brand-dark text-slate-900 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg shadow-brand/20 transition-all active:scale-95 py-4 flex items-center justify-center gap-2"
                >
                    <WhatsAppIcon size={20} /> ENVIAR AL CLIENTE
                </button>
            </div>
        </div>
    );
}

const getVisualEquivalent = (calc) => {
    if (!calc.amountBot || calc.to === 'VES') return null;
    const rateTo = calc.currencies.find(c => c.id === calc.to)?.rate || 0;
    return formatBs(calc.safeParse(calc.amountBot) * rateTo); 
};

function WhatsAppIcon({ size = 24, className }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" /><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" /></svg>;
}