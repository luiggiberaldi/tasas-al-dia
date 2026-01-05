import { useState, useRef, useEffect } from 'react';
import { interpretVoiceCommandAI, analyzeImageAI } from '../utils/groqClient';
import { formatBs, formatUsd } from '../utils/calculatorUtils';

export const useChatCalculator = (rates, speak, setClientName) => {
    const [messages, setMessages] = useState([
        { id: 1, role: 'bot', type: 'text', content: '👋 ¡Hola! Soy Mister Cambio. ¿Qué calculamos hoy?' }
    ]);
    const [isProcessing, setIsProcessing] = useState(false);
    const messagesEndRef = useRef(null);

    // Replicamos la lista de monedas del hook principal para asegurar consistencia
    const currencies = [
        { id: 'VES', label: 'Bs.', rate: 1 },
        { id: 'USDT', label: 'USDT', rate: rates.usdt.price },
        { id: 'USD', label: '$ BCV', rate: rates.bcv.price },
        { id: 'EUR', label: 'Euro', rate: rates.euro.price },
    ];

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const addMessage = (role, type, content, data = null) => {
        setMessages(prev => [...prev, { id: Date.now(), role, type, content, data }]);
    };

    const processAIResult = (aiResult) => {
        // --- INTENTO DE INVERSIÓN ---
        if (aiResult?.intent === 'invertir') {
            addMessage('bot', 'text', 'La función de invertir aún no está disponible en el chat. ¡Próximamente!');
            setIsProcessing(false);
            return;
        }

        // --- VALIDACIÓN DE DATOS MÍNIMOS DE LA IA ---
        if (aiResult?.amount && aiResult?.currency && aiResult?.targetCurrency) {
            
            if (aiResult.clientName) {
                setClientName(aiResult.clientName);
            }

            const amount = parseFloat(aiResult.amount);
            const fromCurrency = aiResult.currency;
            const toCurrency = aiResult.targetCurrency;

            const rateFromObj = currencies.find(c => c.id === fromCurrency);
            const rateToObj = currencies.find(c => c.id === toCurrency);

            // --- MANEJO DE MONEDAS NO ENCONTRADAS ---
            if (!rateToObj || !rateFromObj) {
                addMessage('bot', 'text', `No pude encontrar una tasa para convertir de ${fromCurrency} a ${toCurrency}.`);
                setIsProcessing(false);
                return;
            }

            // --- LÓGICA DE CÁLCULO UNIFICADA ---
            const conversionRate = rateFromObj.rate / rateToObj.rate;
            const result = amount * conversionRate;

            // --- LÓGICA PARA MOSTRAR LA TASA RELEVANTE EN LA BURBUJA ---
            let rateUsedForDisplay;
            let rateName;

            if (fromCurrency === 'VES') {
                rateUsedForDisplay = rateToObj.rate;
                rateName = `Tasa ${rateToObj.label}`;
            } else if (toCurrency === 'VES') {
                rateUsedForDisplay = rateFromObj.rate;
                rateName = `Tasa ${rateFromObj.label}`;
            } else { // Conversión entre dos monedas fuertes (ej: USDT a USD)
                rateUsedForDisplay = conversionRate;
                rateName = `Tasa ${fromCurrency}/${toCurrency}`;
            }
            
            const data = {
                originalAmount: amount,
                originalSource: fromCurrency,
                resultAmount: result,
                targetCurrency: toCurrency,
                rateUsed: rateUsedForDisplay,
                rateName,
                clientName: aiResult.clientName
            };

            addMessage('bot', 'calculation', null, data);
            
            const vozMonto = toCurrency === 'VES' ? formatBs(result) : formatUsd(result, 2);
            speak(`Son ${vozMonto}.`);

        } else {
            addMessage('bot', 'text', 'No entendí la instrucción. Prueba con algo como: "100 dólares" o "cuánto es 50 usdt para Juan".');
        }
        setIsProcessing(false);
    };

    const handleTextSend = async (text) => {
        if (!text.trim()) return;
        addMessage('user', 'text', text);
        setIsProcessing(true);
        try {
            const history = messages.slice(-5).map(m => ({ 
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.content || 'Cálculo anterior' 
            }));

            const aiResult = await interpretVoiceCommandAI([...history, { role: 'user', content: text }]);
            processAIResult(aiResult);
        } catch(e) { 
            console.error("Error procesando IA", e);
            addMessage('bot','text', 'Tuve un problema para procesar eso. Intenta de nuevo.');
            setIsProcessing(false); 
        }
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
                if (res?.amount) {
                    const textCommand = `${res.amount} ${res.currency || 'USD'}`;
                    handleTextSend(textCommand);
                } else {
                    addMessage('bot', 'text', 'No pude leer un monto en esa imagen.');
                    setIsProcessing(false);
                }
            } catch(e) { 
                console.error("Error en análisis de imagen", e);
                addMessage('bot', 'text', 'No pude analizar la imagen.');
                setIsProcessing(false); 
            }
        };
        reader.onerror = () => {
            addMessage('bot', 'text', 'Error al cargar la imagen.');
            setIsProcessing(false);
        }
    };

    return {
        messages,
        isProcessing,
        messagesEndRef,
        handleTextSend,
        handleImageUpload,
    };
};
