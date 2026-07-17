import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedModal from './AnimatedModal';
import { CheckCircle2, Server, Truck, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const RegistrationSuccessFlow = ({ isOpen, isHighRisk }) => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState(0); 
  // 0: Initial, 1: Profile Saved, 2: Hospitals Notified, 3: Trucks Alerted, 4: Done

  useEffect(() => {
    if (isOpen) {
      setPhase(1); // Start phase 1 immediately
      
      const timer1 = setTimeout(() => setPhase(2), 2000);
      const timer2 = setTimeout(() => setPhase(3), 4000);
      const timer3 = setTimeout(() => {
        setPhase(4);
        setTimeout(() => {
          navigate('/patient/dashboard');
        }, 1500); // Redirect after brief pause
      }, 6500);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isOpen, navigate]);

  const phases = [
    {
      step: 1,
      icon: <Activity className="w-8 h-8" />,
      activeText: "Saving Patient Profile...",
      doneText: "Successfully Registered",
      color: "blue"
    },
    {
      step: 2,
      icon: <Server className="w-8 h-8" />,
      activeText: "Transmitting to Nearest Hospitals...",
      doneText: "Hospitals Pre-Notified",
      color: "purple"
    },
    {
      step: 3,
      icon: <Truck className="w-8 h-8" />,
      activeText: isHighRisk ? "Pre-Alerting Emergency Network..." : "Updating Ambulance Network...",
      doneText: "Network Alerted",
      color: isHighRisk ? "red" : "green"
    }
  ];

  return (
    <AnimatedModal isOpen={isOpen} onClose={() => {}} title="" maxWidth="max-w-md">
      <div className="py-6 flex flex-col items-center">
        <h2 className="text-2xl font-black text-white mb-8 tracking-tight">Registration Status</h2>
        
        <div className="w-full space-y-6">
          {phases.map((p) => {
            const isActive = phase === p.step;
            const isDone = phase > p.step;
            const isPending = phase < p.step;

            return (
              <motion.div 
                key={p.step}
                initial={{ opacity: 0.3, x: -20 }}
                animate={{ 
                  opacity: isPending ? 0.3 : 1, 
                  x: 0,
                  scale: isActive ? 1.05 : 1
                }}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500
                  ${isActive ? `bg-${p.color}-500/20 border-${p.color}-500/50 shadow-[0_0_20px_rgba(var(--color-${p.color}-500),0.3)]` : ''}
                  ${isDone ? 'bg-slate-800/80 border-slate-700' : ''}
                  ${isPending ? 'bg-slate-900/50 border-slate-800' : ''}
                `}
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0
                  ${isActive ? `bg-${p.color}-500/30 text-${p.color}-400` : ''}
                  ${isDone ? 'bg-green-500/20 text-green-400' : ''}
                  ${isPending ? 'bg-slate-800 text-slate-500' : ''}
                `}>
                  {isDone ? <CheckCircle2 className="w-8 h-8 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]" /> : (
                    <div className={`${isActive ? 'animate-pulse' : ''}`}>
                      {p.icon}
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <p className={`font-bold text-lg transition-colors duration-300
                    ${isActive ? `text-${p.color}-300` : ''}
                    ${isDone ? 'text-green-400' : ''}
                    ${isPending ? 'text-slate-500' : ''}
                  `}>
                    {isDone ? p.doneText : p.activeText}
                  </p>
                  {isActive && (
                    <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                      <motion.div 
                        initial={{ width: "0%" }} 
                        animate={{ width: "100%" }} 
                        transition={{ duration: 1.8, ease: "linear" }}
                        className={`h-full bg-${p.color}-500`}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {phase === 4 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center"
          >
            <p className="text-slate-300 font-medium">Redirecting to Dashboard...</p>
          </motion.div>
        )}
      </div>
    </AnimatedModal>
  );
};

export default RegistrationSuccessFlow;
