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
    { id: 'USD', label: '$ BCV', icon: '🏛️', rate: rates.bcv.price },
    { id: 'EUR', label: 'Euro', icon: '💶', rate: rates.euro.price },
  ];

  const safeParse = (val) => (!val || val === '.') ? 0 : parseFloat(val.replace(/,/g, '.'));

  const addToHistory = useCallback((calculation) => {
    if (JSON.stringify(history[0]) !== JSON.stringify(calculation)) {
        setHistory(prev => [calculation, ...prev].slice(0, 5));
    }
  }, [history]);

  useEffect(() => {
    const rateFrom = currencies.find(c => c.id === from)?.rate || 0;
    const rateTo = currencies.find(c => c.id === to)?.rate || 0;

    if (rateTo === 0 || rateFrom === 0) {
        setCurrentRate(0);
        if (lastEdited === 'top') setAmountBot('');
        else setAmountTop('');
        return;
    }
    
    const conversionRate = rateFrom / rateTo;
    setCurrentRate(conversionRate);

    const applyRounding = (value, currencyId) => {
        if (currencyId === 'VES') return Math.ceil(value).toString();
        const fixedValue = value.toFixed(2);
        return fixedValue.endsWith('.00') ? Math.trunc(value).toString() : fixedValue;
    };

    if (lastEdited === 'top') {
        if (!amountTop) { setAmountBot(''); return; }
        const res = safeParse(amountTop) * conversionRate;
        setAmountBot(applyRounding(res, to));
    } else {
        if (!amountBot) { setAmountTop(''); return; }
        const res = safeParse(amountBot) / conversionRate;
        setAmountTop(applyRounding(res, from));
    }

    const timer = setTimeout(() => {
      const topValue = safeParse(amountTop);
      const botValue = safeParse(lastEdited === 'top' ? amountBot : amountTop) * (lastEdited === 'top' ? 1 : 1/conversionRate) ;

      if (topValue > 0 && botValue > 0) {
        addToHistory({
          from,
          to,
          amountTop: topValue,
          amountBot: botValue,
          rate: conversionRate,
          id: Date.now()
        });
      }
    }, 1200);

    return () => clearTimeout(timer);

  }, [amountTop, amountBot, from, to, rates, lastEdited, addToHistory]);

  const handleAmountChange = (val, source) => {
    const currentCurrency = source === 'top' ? from : to;
    const cleanedVal = val.replace(/,/g, '.');
    const isValid = currentCurrency === 'VES' 
        ? /^\d*$/.test(cleanedVal) 
        : /^\d*\.?\d{0,2}$/.test(cleanedVal);

    if (isValid) {
        if (source === 'top') { setAmountTop(val); setLastEdited('top'); }
        else { setAmountBot(val); setLastEdited('bot'); }
    }
  };

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
    setLastEdited('top');
  };
  
  const clear = () => { setAmountTop(''); setAmountBot(''); };

  const loadFromHistory = (item) => {
    setFrom(item.from);
    setTo(item.to);
    setAmountTop(item.amountTop.toString());
    setLastEdited('top');
  };

  const setPair = (newFrom, newTo) => {
      setFrom(newFrom);
      setTo(newTo);
      setLastEdited('top'); // o 'bot' según la lógica deseada
  }

  return {
    amountTop, amountBot, from, to, currencies, currentRate, history,
    setFrom, setTo, setPair,
    handleAmountChange, handleSwap, clear, loadFromHistory,
    safeParse
  };
}