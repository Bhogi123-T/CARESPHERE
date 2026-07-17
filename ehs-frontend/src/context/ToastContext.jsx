import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    
    // Play a sound based on type
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'error' || type === 'critical') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch (e) {
      // Audio context might be blocked if no user interaction occurred yet
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className={`pointer-events-auto flex items-start gap-3 p-4 min-w-[320px] max-w-[400px] glass-panel border-l-4 animate-fade-in-up transition-all ${
              toast.type === 'critical' || toast.type === 'error' 
                ? 'border-l-red-500 bg-red-950/90 shadow-[0_5px_30px_rgba(239,68,68,0.5)]' 
                : toast.type === 'success' 
                  ? 'border-l-green-500 bg-green-950/90 shadow-[0_5px_30px_rgba(34,197,94,0.3)]'
                  : 'border-l-blue-500 bg-blue-950/90 shadow-[0_5px_30px_rgba(59,130,246,0.3)]'
            }`}
          >
            <div className="mt-0.5">
              {toast.type === 'critical' || toast.type === 'error' ? <AlertCircle className="text-red-500 animate-pulse" size={24} /> : 
               toast.type === 'success' ? <CheckCircle className="text-green-500" size={24} /> :
               <Info className="text-blue-500" size={24} />}
            </div>
            
            <div className="flex-1">
              <p className={`font-black text-xs ${
                toast.type === 'critical' || toast.type === 'error' ? 'text-red-400' : 
                toast.type === 'success' ? 'text-green-400' : 'text-blue-400'
              } uppercase tracking-widest mb-1`}>
                {toast.type === 'critical' ? 'CRITICAL ALERT' : toast.type}
              </p>
              <p className="text-white text-sm font-medium leading-relaxed">{toast.message}</p>
            </div>
            
            <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-white transition-colors p-1">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
