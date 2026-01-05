import { useState, useRef, useEffect } from 'react';
import { interpretVoiceCommandAI, analyzeImageAI } from '../utils/groqClient';
import { formatBs, formatUsd } from '../utils/calculatorUtils';

export const useChatCalculator = (rates, speak, setClientName) => {
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
        if (aiResult?.intent === 'invertir') {
            // Implementar lógica de inversión si es necesario
            addMessage('bot', 'text', 'Función de invertir aún no implementada en el chat.');
            setIsProcessing(false);
            return;
        }

        if (aiResult?.amount) {
            // ✅ Si la IA detecta un nombre, se actualiza el estado central
            if (aiResult.clientName) {
                setClientName(aiResult.clientName);
            }

            const amount = parseFloat(aiResult.amount);
            const currency = aiResult.currency || 'USD';
            let target = aiResult.targetCurrency || 'VES'; // Default a VES si no se especifica
            
            let result = 0, rateUsed = 0, rateName = '';
            
            if (currency === 'USDT' && target === 'VES') {
                rateUsed = rates.usdt.price;
                result = amount * rateUsed;
                rateName = 'Tasa Paralelo (USDT)';
            } else if (currency === 'USD' && target === 'VES') {
                rateUsed = rates.bcv.price;
                result = amount * rateUsed;
                rateName = 'Tasa Oficial (BCV)';
            } else if (currency === 'EUR' && target === 'VES') {
                rateUsed = rates.euro.price;
                result = amount * rateUsed;
                rateName = 'Tasa Euro';
            } else if (currency === 'VES' && target === 'USD') {
                rateUsed = rates.bcv.price;
                result = amount / rateUsed;
                rateName = 'Tasa Oficial (BCV)';
            } else {
                // Lógica de conversión para otras combinaciones (ej. USD a USDT)
                // Esta parte puede necesitar más detalle según las reglas de negocio
                addMessage('bot', 'text', `No se pudo convertir de ${currency} a ${target}.`);
                setIsProcessing(false);
                return;
            }

            const data = { 
                originalAmount: amount, originalSource: currency, 
                resultAmount: result, targetCurrency: target, 
                rateUsed, rateName, clientName: aiResult.clientName 
            };

            addMessage('bot', 'calculation', null, data);
            
            const vozMonto = target === 'VES' ? formatBs(result) : formatUsd(result, 2);
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
                content: m.content || `Cálculo anterior` 
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