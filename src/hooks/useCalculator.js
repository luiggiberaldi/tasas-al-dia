import { useState, useEffect, useCallback } from 'react';

export function useCalculator(rates) {
  const [amountTop, setAmountTop] = useState('');
  const [amountBot, setAmountBot] = useState('');
  const [from, setFrom] = useState('USDT');
  const [to, setTo] = useState('VES');
  const [lastEdited, setLastEdited] = useState('top');
  const [history, setHistory] = useState([]);
  const [currentRate, setCurrentRate] = useState(0);

  const currencies = [
    { id: 'VES', label: 'Bs.', icon: '🇻🇪', rate: 1 },
    { id: 'USDT', label: 'USDT', icon: '💵', rate: rates.usdt.price },
    { id: 'BCV', label: '$ BCV', icon: '🏛️', rate: rates.bcv.price },
    { id: 'EUR', label: 'Euro', icon: '💶', rate: rates.euro.price },
  ];

  const safeParse = (val) => (!val || val === '.') ? 0 : parseFloat(val.replace(/,/g, '.'));

  const addToHistory = useCallback((calculation) => {
    // Evitar duplicados exactos y consecutivos
    if (JSON.stringify(history[0]) !== JSON.stringify(calculation)) {
        setHistory(prev => [calculation, ...prev].slice(0, 5)); // Mantener solo los últimos 5
    }
  }, [history]);

  useEffect(() => {
    const rateFrom = currencies.find(c => c.id === from)?.rate || 0;
    const rateTo = currencies.find(c => c.id === to)?.rate || 0;

    if (rateTo === 0 || rateFrom === 0) {
        setCurrentRate(0);
        return;
    }
    
    const conversionRate = rateFrom / rateTo;
    setCurrentRate(conversionRate);

    const applyRounding = (value, currencyId) => {
        if (currencyId === 'VES') return Math.ceil(value).toString();
        return value.toFixed(2);
    };

    let newAmount = '';
    if (lastEdited === 'top') {
        if (!amountTop) { setAmountBot(''); return; }
        const res = safeParse(amountTop) * conversionRate;
        newAmount = applyRounding(res, to);
        setAmountBot(newAmount);
    } else {
        if (!amountBot) { setAmountTop(''); return; }
        const res = safeParse(amountBot) / conversionRate;
        newAmount = applyRounding(res, from);
        setAmountTop(newAmount);
    }

    // Lógica para añadir a historial (con debounce)
    const timer = setTimeout(() => {
      if (safeParse(amountTop) > 0 && safeParse(newAmount) > 0) {
        addToHistory({
          from,
          to,
          amountTop: safeParse(amountTop),
          amountBot: safeParse(newAmount),
          rate: conversionRate,
          id: Date.now()
        });
      }
    }, 1200); // Espera 1.2s de inactividad antes de guardar

    return () => clearTimeout(timer);

  }, [amountTop, amountBot, from, to, rates, lastEdited, addToHistory]);

  const handleAmountChange = (val, source) => {
    const currentCurrency = source === 'top' ? from : to;
    const isValid = currentCurrency === 'VES' 
        ? /^\d*$/.test(val) 
        : /^\d*\.?\d{0,2}$/.test(val.replace(/,/g, '.'));

    if (isValid) {
        if (source === 'top') { setAmountTop(val); setLastEdited('top'); }
        else { setAmountBot(val); setLastEdited('bot'); }
    }
  };

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
    setAmountTop(amountBot); 
    setLastEdited('top');
  };
  
  const clear = () => { setAmountTop(''); setAmountBot(''); };

  const loadFromHistory = (item) => {
    setFrom(item.from);
    setTo(item.to);
    setAmountTop(item.amountTop.toString());
    setLastEdited('top');
  };

  return {
    amountTop, amountBot, from, to, currencies, currentRate, history,
    setFrom, setTo,
    handleAmountChange, handleSwap, clear, loadFromHistory,
    safeParse
  };
}