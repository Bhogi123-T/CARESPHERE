import React, { useState, useEffect } from 'react';
import { ScanFace, HeartPulse, Activity, Zap, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AIVitalScanner = ({ onScanComplete }) => {
  const [scanPhase, setScanPhase] = useState('initializing'); // initializing -> scanning -> analyzing -> complete
  const [vitals, setVitals] = useState({ hr: 0, stress: 0, temp: 0 });

  useEffect(() => {
    // Sequence the mock scan
    const initTimer = setTimeout(() => setScanPhase('scanning'), 1500);
    const scanTimer = setTimeout(() => setScanPhase('analyzing'), 4000);
    const analysisTimer = setTimeout(() => {
      setVitals({ hr: 112, stress: 84, temp: 37.8 });
      setScanPhase('complete');
      if (onScanComplete) setTimeout(() => onScanComplete({ hr: 112, stress: 84, temp: 37.8 }), 2000);
    }, 6000);

    return () => {
      clearTimeout(initTimer);
      clearTimeout(scanTimer);
      clearTimeout(analysisTimer);
    };
  }, [onScanComplete]);

  return (
    <div className="relative w-full max-w-sm mx-auto aspect-[3/4] bg-slate-900 rounded-3xl overflow-hidden border border-blue-500/30 shadow-[0_0_50px_rgba(37,99,235,0.15)] flex flex-col items-center justify-center p-6">
      {/* Dark background grid for tech feel */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDEwaDQwTTAgMjBoNDBNMCAzMGg0ME0xMCAwdjQwTTIwIDB2NDBNMzAgMHY0MCIgc3Ryb2tlPSIjM2I4MmY2IiBzdHJva2Utb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] pointer-events-none opacity-20"></div>

      {/* Main Scanner HUD */}
      <div className="relative w-48 h-48 mb-8">
        {/* Reticle brackets */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500 transition-all duration-300"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500 transition-all duration-300"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-500 transition-all duration-300"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-500 transition-all duration-300"></div>
        
        {/* Central Icon / Face placeholder */}
        <div className="absolute inset-0 flex items-center justify-center text-slate-700">
          <ScanFace size={80} className={`${scanPhase === 'scanning' ? 'text-blue-500/50' : ''}`} />
        </div>

        {/* Scanning Laser */}
        <AnimatePresence>
          {scanPhase === 'scanning' && (
            <motion.div 
              initial={{ top: 0, opacity: 0 }}
              animate={{ top: ['0%', '100%', '0%'], opacity: 1 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_15px_#60a5fa] z-10"
            ></motion.div>
          )}
        </AnimatePresence>

        {/* Circular Data Rings */}
        <div className={`absolute inset-[-10px] rounded-full border-2 border-dashed border-blue-500/20 ${scanPhase === 'scanning' || scanPhase === 'analyzing' ? 'animate-spin-slow' : ''}`}></div>
        <div className={`absolute inset-[-20px] rounded-full border border-blue-500/10 ${scanPhase === 'analyzing' ? 'animate-reverse-spin' : ''}`}></div>
      </div>

      {/* Status Text */}
      <div className="text-center relative z-10 w-full">
        {scanPhase === 'initializing' && (
          <p className="text-blue-400 font-bold uppercase tracking-widest text-sm animate-pulse">Initializing Biometrics...</p>
        )}
        {scanPhase === 'scanning' && (
          <p className="text-emerald-400 font-bold uppercase tracking-widest text-sm animate-pulse">Capturing rPPG Feed...</p>
        )}
        {scanPhase === 'analyzing' && (
          <p className="text-purple-400 font-bold uppercase tracking-widest text-sm animate-pulse flex items-center justify-center gap-2">
            <Zap size={14} className="animate-spin" /> Neural Analysis
          </p>
        )}
        {scanPhase === 'complete' && (
          <p className="text-green-400 font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2">
            <CheckCircle2 size={16} /> Scan Complete
          </p>
        )}

        {/* Data Readout */}
        <div className="mt-6 space-y-3">
          <div className="flex justify-between items-center bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase"><HeartPulse size={14}/> Heart Rate</div>
            <div className={`font-black ${scanPhase === 'complete' ? 'text-red-400' : 'text-slate-500'}`}>
              {scanPhase === 'complete' ? `${vitals.hr} BPM` : '---'}
            </div>
          </div>
          <div className="flex justify-between items-center bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase"><Activity size={14}/> Stress Index</div>
            <div className={`font-black ${scanPhase === 'complete' ? 'text-orange-400' : 'text-slate-500'}`}>
              {scanPhase === 'complete' ? `${vitals.stress}%` : '---'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIVitalScanner;
