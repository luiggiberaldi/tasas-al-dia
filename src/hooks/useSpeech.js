import { useState, useCallback } from 'react';

export const useSpeech = () => {
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [isListening, setIsListening] = useState(false);

    const speak = useCallback((text) => {
        if (!voiceEnabled || !window.speechSynthesis) return;
        
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        
        const voice = voices.find(v => v.lang === 'es-US') || 
                      voices.find(v => v.lang === 'es-419') || 
                      voices.find(v => v.lang === 'es-MX');
        
        if (voice) utterance.voice = voice;
        utterance.pitch = 0.85;
        utterance.rate = 1.05;
        
        window.speechSynthesis.speak(utterance);
    }, [voiceEnabled]);

    return { voiceEnabled, setVoiceEnabled, speak, isListening, setIsListening };
};