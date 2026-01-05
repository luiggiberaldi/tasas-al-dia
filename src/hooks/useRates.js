import { useState, useEffect, useCallback } from 'react';

// --- Constantes y Configuración ---
const DEFAULT_RATES = {
  usdt: { price: 0, source: '---', type: 'none', change: 0 },
  bcv: { price: 0, source: '---', change: 0 },
  euro: { price: 0, source: '---', change: 0 },
  lastUpdate: null
};

// Nivel 1: API Principal (la que el usuario confirmó que funciona)
const PRIMARY_API_URL = 'https://script.google.com/macros/s/AKfycbxT9sKz_XWRWuQx_XP-BJ33T0hoAgJsLwhZA00v6nPt4Ij4jRjq-90mDGLVCsS6FXwW9Q/exec?token=Lvbp1994';
// Nivel 2: API de Respaldo Privada
const SECONDARY_API_URL = 'https://script.google.com/macros/s/AKfycbxT9sKz_XWRWuQx_XP-BJ33T0hoAgJsLwhZA00v6nPt4Ij4jRjq-90mDGLVC556FXwW9Q/exec?token=Lvbp1994';
// Nivel 3: API de Respaldo Pública
const PUBLIC_FALLBACK_URL = 'https://ve.dolarapi.com/v1/dolares';

const USDT_CONNECTION_STRATEGIES = [
    { name: 'Directo', buildUrl: (target) => target },
    { name: 'Proxy (AllOrigins)', buildUrl: (target) => `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}` }
];

const UPDATE_INTERVAL = 3600000; // 1 hora
const FETCH_TIMEOUT = 10000; // 10 segundos

// --- Hook Principal ---
export function useRates() {
  const [rates, setRates] = useState(() => {
    try {
      // Versión final del caché
      return JSON.parse(localStorage.getItem('monitor_rates_v16')) || null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [logs, setLogs] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const currentRates = rates || DEFAULT_RATES;

  useEffect(() => {
    if (rates) {
      localStorage.setItem('monitor_rates_v16', JSON.stringify(rates));
    }
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, [rates]);

  const addLog = useCallback((msg, type = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });
    setLogs(prev => [...prev.slice(-49), { time, msg, type }]);
  }, []);

  const parseSafeFloat = (val) => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const parsed = parseFloat(val.replace(',', '.'));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const getMeta = (newPrice, oldPrice, oldChange = 0, apiChange = null) => {
    const p = parseSafeFloat(newPrice);
    const o = parseSafeFloat(oldPrice);
    if (apiChange !== null && apiChange !== undefined) return { price: p, change: parseSafeFloat(apiChange) };
    if (p === o) return { price: p, change: oldChange };
    return { price: p, change: (p > 0 && o > 0) ? ((p - o) / o) * 100 : 0 };
  };
  
  const sendRateNotification = (title, body) => {
    if (notificationsEnabled) {
      try {
        new Notification(title, { body, icon: '/logodark.png', vibrate: [200, 100, 200] });
      } catch (e) { console.error("Error al enviar notificación", e); }
    }
  };
  
  const fetchUSDT = async () => {
    const targetUrl = `https://criptoya.com/api/binancep2p/USDT/VES/1`; 
    addLog('Consultando Binance P2P (USDT)...');
    for (const strategy of USDT_CONNECTION_STRATEGIES) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
            const res = await fetch(strategy.buildUrl(targetUrl), { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!res.ok) continue;
            const result = await res.json();
            const avgPrice = (parseSafeFloat(result.ask) + parseSafeFloat(result.bid)) / 2;
            if (avgPrice > 0) {
                addLog(`✅ Éxito USDT con ${strategy.name}`, 'success');
                return { price: avgPrice, source: `Binance P2P (${strategy.name})` };
            }
        } catch (err) { /* Silently try next strategy */ }
    }
    addLog('Fallo al obtener USDT', 'error');
    return null;
  };

  const updateData = useCallback(async (isAutoUpdate = false) => {
    setLoading(true);
    setIsOffline(false);
    addLog(isAutoUpdate ? "--- Auto-Refresco Periódico ---" : "--- Actualización Manual ---");

    const fetchWithTimeout = async (url, sourceName) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
      try {
        addLog(`Consultando: ${sourceName}...`);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`Respuesta no válida (status ${res.status})`);
        return await res.json();
      } catch (e) {
        clearTimeout(timeoutId);
        addLog(`Fallo en ${sourceName}: ${e.message}`, 'error');
        return null;
      }
    };

    // --- Lógica de Obtención de BCV por Niveles ---
    let bcvData = null;
    let bcvSource = '---';

    // Nivel 1: API Principal
    let primaryData = await fetchWithTimeout(PRIMARY_API_URL, 'API Principal');
    if (primaryData) {
      bcvData = primaryData;
      bcvSource = 'BCV Oficial (Privado)';
      addLog('✅ Éxito con API Principal', 'success');
    } else {
      // Nivel 2: API de Respaldo Privada
      let secondaryData = await fetchWithTimeout(SECONDARY_API_URL, 'Respaldo Privado');
      if (secondaryData) {
        bcvData = secondaryData;
        bcvSource = 'BCV Oficial (Respaldo Privado)';
        addLog('✅ Éxito con Respaldo Privado', 'success');
      } else {
        // Nivel 3: API de Respaldo Pública
        addLog('APIs privadas fallaron, usando respaldo público.');
        let publicData = await fetchWithTimeout(PUBLIC_FALLBACK_URL, 'Respaldo Público');
        if (publicData) {
          const oficial = publicData.find(d => d.fuente.toLowerCase() === 'oficial');
          if (oficial) {
            bcvData = { bcv: oficial.promedio, euro: oficial.promedio_anterior }; // Estructura simulada
            bcvSource = 'BCV Oficial (Respaldo Público)';
            addLog('✅ Éxito con Respaldo Público', 'success');
          }
        }
      }
    }

    // --- Procesamiento y Actualización de Estado ---
    try {
      const [usdtResult] = await Promise.all([fetchUSDT()]);
      let newRates = { ...(rates || DEFAULT_RATES) };

      if (usdtResult) {
          const meta = getMeta(usdtResult.price, newRates.usdt.price, newRates.usdt.change);
          newRates.usdt = { ...newRates.usdt, price: usdtResult.price, change: meta.change, source: usdtResult.source, type: 'p2p' };
      }
      
      if (bcvData) {
        const rawBcv = bcvData.bcv ?? bcvData.usd;
        const rawEuro = bcvData.euro ?? bcvData.eur;
        const newBcvPrice = parseSafeFloat(typeof rawBcv === 'object' ? rawBcv.price : rawBcv);
        const newEuroPrice = parseSafeFloat(typeof rawEuro === 'object' ? rawEuro.price : rawEuro);
        
        if (newBcvPrice > 0) {
          const meta = getMeta(newBcvPrice, newRates.bcv.price, newRates.bcv.change, typeof rawBcv === 'object' ? rawBcv.change : null);
          if (notificationsEnabled && rates && newRates.bcv.price !== meta.price) {
             sendRateNotification("Cambio Tasa BCV", `La tasa oficial es ahora ${meta.price.toFixed(2)} Bs.`);
          }
          newRates.bcv = { ...newRates.bcv, ...meta, source: bcvSource };
        }

        if (newEuroPrice > 0) {
          const meta = getMeta(newEuroPrice, newRates.euro.price, newRates.euro.change, typeof rawEuro === 'object' ? rawEuro.change : null);
          newRates.euro = { ...newRates.euro, ...meta, source: bcvSource.replace('BCV', 'Euro') };
        }
      } else {
        addLog('❌ Todas las fuentes de BCV fallaron.', 'error');
        setIsOffline(true);
      }

      newRates.lastUpdate = new Date();
      setRates(newRates);
      addLog('Actualización completada.', 'success');
    } catch (e) {
      console.error(e);
      addLog(`Error crítico al procesar datos: ${e.message}`, 'error');
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  }, [addLog, rates, notificationsEnabled]);

  useEffect(() => {
    if (!rates) updateData();
    const intervalId = setInterval(() => updateData(true), UPDATE_INTERVAL);
    return () => clearInterval(intervalId);
  }, [updateData, rates]);

  const enableNotifications = async () => {
    if (!('Notification' in window)) {
      alert("Tu navegador no soporta notificaciones.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      new Notification("🔔 Notificaciones Activadas", { body: "Te avisaremos si cambia la tasa del dólar o euro.", icon: '/logodark.png' });
      addLog("Permiso de notificaciones concedido.", "success");
    }
  };

  return { rates: currentRates, loading, isOffline, logs, updateData, enableNotifications, notificationsEnabled };
}
