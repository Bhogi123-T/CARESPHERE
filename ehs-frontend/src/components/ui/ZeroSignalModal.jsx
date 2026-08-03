import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bluetooth, Satellite, CheckCircle, AlertTriangle, X } from 'lucide-react';

const ZeroSignalModal = ({ isOpen, onClose, onComplete }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      
      // Step 0: Initial warning (2s)
      const t1 = setTimeout(() => setStep(1), 2000);
      
      // Step 1: Bluetooth Mesh Scanning (4s)
      const t2 = setTimeout(() => setStep(2), 6000);
      
      // Step 2: Mesh Failed, Switching to Satellite (2s)
      const t3 = setTimeout(() => setStep(3), 8000);
      
      // Step 3: Satellite Scanning & Connecting (4s)
      const t4 = setTimeout(() => setStep(4), 12000);
      
      // Step 4: Transmitting Payload (3s)
      const t5 = setTimeout(() => setStep(5), 15000);

      // Step 5: Success & Auto-close (3s)
      const t6 = setTimeout(() => {
        if (onComplete) onComplete();
        onClose();
      }, 18000);

      return () => {
        clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); 
        clearTimeout(t4); clearTimeout(t5); clearTimeout(t6);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.5)]"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white z-10">
          <X size={24} />
        </button>

        <div className="p-8 flex flex-col items-center justify-center text-center h-[400px]">
          <AnimatePresence mode="wait">
            
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                <AlertTriangle size={64} className="text-red-500 mb-4 animate-pulse" />
                <h2 className="text-2xl font-bold text-white mb-2">No Cellular Signal</h2>
                <p className="text-slate-400">Initiating CareSphere Zero-Signal Protocol...</p>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                <div className="relative w-32 h-32 flex items-center justify-center mb-6">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                  <div className="absolute inset-4 bg-blue-500/40 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                  <div className="bg-blue-600 p-4 rounded-full relative z-10 shadow-[0_0_30px_rgba(37,99,235,0.8)]">
                    <Bluetooth size={40} className="text-white" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-blue-400 mb-2">Mesh Network Scan</h2>
                <p className="text-slate-400 text-sm">Searching for nearby peer devices via Bluetooth LE to bounce SOS payload...</p>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                <AlertTriangle size={48} className="text-yellow-500 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Mesh Network Unavailable</h2>
                <p className="text-slate-400 text-sm">No peers found in 100m radius. Switching to Satellite Uplink...</p>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center w-full">
                {/* Radar Animation */}
                <div className="relative w-48 h-48 rounded-full border border-green-500/30 overflow-hidden mb-6 flex items-center justify-center bg-slate-950">
                  {/* Radar Sweep */}
                  <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(34,197,94,0.3)_90deg,transparent_90deg)] animate-[spin_2s_linear_infinite] origin-center"></div>
                  {/* Grid Lines */}
                  <div className="absolute inset-0 border border-green-500/20 rounded-full scale-50"></div>
                  <div className="absolute inset-0 border border-green-500/20 rounded-full scale-75"></div>
                  {/* Center Icon */}
                  <div className="bg-slate-900 p-2 rounded-full relative z-10">
                    <Satellite size={32} className="text-green-500" />
                  </div>
                  {/* Satellite Blip */}
                  <div className="absolute top-8 right-12 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white] animate-pulse"></div>
                </div>
                <h2 className="text-xl font-bold text-green-400 mb-2">Satellite Uplink</h2>
                <p className="text-slate-400 text-sm">Acquiring signal from Low Earth Orbit (LEO) satellite... Please point device at open sky.</p>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                <Satellite size={64} className="text-green-500 mb-4 animate-bounce" />
                <h2 className="text-xl font-bold text-white mb-2">Uplink Established</h2>
                <p className="text-slate-400 text-sm mb-4">Transmitting highly compressed emergency payload...</p>
                <div className="w-full bg-slate-800 rounded-full h-2 mb-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: "100%" }} 
                    transition={{ duration: 2.5, ease: "linear" }}
                    className="bg-green-500 h-full"
                  />
                </div>
                <p className="text-xs text-green-500/70 font-mono">142 Bytes sent over S-Band</p>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
                <div className="bg-green-500/20 p-4 rounded-full mb-4 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                  <CheckCircle size={64} className="text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">SOS Delivered!</h2>
                <p className="text-slate-400 text-sm">Your emergency payload has been relayed via satellite to the nearest emergency dispatch center.</p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default ZeroSignalModal;
