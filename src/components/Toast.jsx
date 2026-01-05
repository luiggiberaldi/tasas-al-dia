import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

/**
 * Muestra una notificación flotante (toast) en la pantalla.
 * @param {object} props
 * @param {string} props.message - El mensaje a mostrar.
 * @param {boolean} props.show - Controla la visibilidad del toast.
 */
export const Toast = ({ message, show }) => {
  if (!show) return null;

  return (
    // ✨ Efecto visual: Animación de entrada más pronunciada
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-10 duration-500 ease-out">
      <div className="flex items-center gap-3 bg-slate-900 text-white rounded-full py-3 px-5 shadow-2xl border border-slate-700 ring-4 ring-slate-900/10">
        {/* ✨ Efecto visual: Icono con animación de zoom */}
        <CheckCircle size={22} className="text-emerald-400 animate-in zoom-in-125 duration-500" />
        <span className="text-sm font-bold">{message}</span>
      </div>
    </div>
  );
};

// Hook mejorado para manejar la visibilidad y los efectos del toast
export const useToast = () => {
  const [toast, setToast] = React.useState({ show: false, message: '' });

  // ✨ Efecto de sonido: Carga del audio una sola vez
  // Nota: Debes crear un archivo de sonido en `public/sounds/pop.mp3`
  const toastSound = React.useMemo(() => {
    if (typeof window !== 'undefined') {
      return new Audio('/sounds/pop.mp3');
    }
    return null;
  }, []);

  const showToast = (message) => {
    setToast({ show: true, message });
    
    // ✨ Efecto de sonido y vibración al mostrar
    if (toastSound) {
      toastSound.currentTime = 0;
      toastSound.play().catch(() => {}); // El catch evita errores si el usuario no ha interactuado con la página
    }
    if (navigator.vibrate) {
      navigator.vibrate(50); // Vibración sutil para feedback háptico
    }

    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 2500); // Duración aumentada a 2.5s
  };

  return { toast, showToast };
};
