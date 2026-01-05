import { useState, useRef, useEffect } from 'react';
import { interpretVoiceCommandAI, analyzeImageAI } from '../utils/groqClient';
import { formatBs, formatUsd } from '../utils/calculatorUtils';

export const useChatCalculator = (rates, speak) => {
    const [messages, setMessages] = useState([
        { id: 1, role: 'bot', type: 'text', content: '👋 ¡Hola! Soy Mister Cambio. ¿Qué calculamos hoy?' }
    ]);
    const [isProcessing, setIsProcessing] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto-scroll
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const addMessage = (role, type, content, data = null) => {
        setMessages(prev => [...prev, { id: Date.now(), role, type, content, data }]);
    };

    const processAIResult = (aiResult) => {
        if (aiResult?.amount) {
            const amount = parseFloat(aiResult.amount);
            const currency = aiResult.currency || 'USD';
            let target = aiResult.targetCurrency;
            
            // Inferencia de destino
            if (!target) {
                if (currency === 'USDT') target = 'USD';
                else if (currency === 'USD') target = 'USDT';
                else if (currency === 'EUR') target = 'VES';
                else target = 'USD';
            }
            
            let result = 0, rateUsed = 0, rateName = '';
            
            // Lógica de Negocio (Tasas)
            if (currency === 'USDT' && target === 'USD') {
                rateUsed = rates.usdt.price / rates.bcv.price;
                result = amount * rateUsed;
                rateName = 'Brecha (USDT → BCV)';
            } else if (currency === 'USD' && target === 'USDT') {
                rateUsed = rates.bcv.price / rates.usdt.price;
                result = amount * rateUsed;
                rateName = 'Brecha (BCV → USDT)';
            } else if (currency === 'USD' && target === 'EUR') {
                rateUsed = rates.bcv.price / rates.euro.price;
                result = amount * rateUsed;
                rateName = 'Dólar a Euro';
            } else if (currency === 'EUR' && target === 'USD') {
                rateUsed = rates.euro.price / rates.bcv.price;
                result = amount * rateUsed;
                rateName = 'Euro a Dólar';
            } else if (target === 'VES') {
                if (currency === 'USDT') { rateUsed = rates.usdt.price; rateName = 'Tasa USDT'; }
                else if (currency === 'EUR') { rateUsed = rates.euro.price; rateName = 'Tasa Euro'; }
                else { rateUsed = rates.bcv.price; rateName = 'Tasa BCV'; }
                result = amount * rateUsed;
            } else {
                result = amount; rateUsed = 1; rateName = 'Mismo valor';
            }

            const data = { 
                originalAmount: amount, originalSource: currency, 
                resultAmount: result, targetCurrency: target, 
                rateUsed, rateName, clientName: aiResult.clientName 
            };

            addMessage('bot', 'calculation', null, data);
            
            // Feedback de voz
            const vozMonto = target === 'VES' ? formatBs(result) : formatUsd(result);
            speak(`Son ${vozMonto}.`);
        } else {
            addMessage('bot', 'text', 'No entendí el monto. Intenta "100 USDT a BCV".');
        }
        setIsProcessing(false);
    };

    const handleTextSend = async (text) => {
        if (!text.trim()) return;
        addMessage('user', 'text', text);
        setIsProcessing(true);
        try {
            // Historial breve para contexto
            const history = messages.slice(-4).map(m => ({ 
                role: m.role === 'user' ? 'user' : 'assistant', 
                content: m.type === 'calculation' ? `Calc: ${m.data.originalAmount} ${m.data.originalSource}` : m.content 
            }));
            history.push({ role: 'user', content: text });
            
            const aiResult = await interpretVoiceCommandAI(history);
            processAIResult(aiResult);
        } catch { setIsProcessing(false); }
    };

    const handleImageUpload = async (file) => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        addMessage('user', 'image', url);
        setIsProcessing(true);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            try {
                const res = await analyzeImageAI(reader.result);
                processAIResult(res);
            } catch { setIsProcessing(false); }
        };
    };

    return {
        messages,
        isProcessing,
        messagesEndRef,
        handleTextSend,
        handleImageUpload,
        clearMessages: () => setMessages([])
    };
};