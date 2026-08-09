import React, { useState, useEffect } from 'react';
import { Activity, CloudRain, ShieldAlert, ThermometerSun, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AIPredictivePanel = ({ role = 'patient' }) => {
  const [predictions, setPredictions] = useState([]);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    // Simulate AI data fetching
    const timer = setTimeout(() => {
      setIsScanning(false);
      if (role === 'patient') {
        setPredictions([
          {
            id: 1,
            icon: <CloudRain size={20} className="text-blue-400" />,
            title: "Weather Context",
            desc: "High humidity & stagnant water detected via satellite in your block.",
            alert: "Moderate Risk",
            color: "blue"
          },
          {
            id: 2,
            icon: <Activity size={20} className="text-orange-400" />,
            title: "Epidemic Prediction",
            desc: "AI models predict a 42% spike in Dengue cases over the next 5 days.",
            alert: "Take Preventive Action",
            color: "orange"
          }
        ]);
      } else if (role === 'hospital') {
        setPredictions([
          {
            id: 1,
            icon: <TrendingUp size={20} className="text-red-400" />,
            title: "ER Influx Prediction",
            desc: "3 active SOS triggers within 15km. Expected arrival in 22 mins.",
            alert: "High Probability",
            color: "red"
          },
          {
            id: 2,
            icon: <Users size={20} className="text-purple-400" />,
            title: "Resource Allocation",
            desc: "Suggesting pre-allocation of 2 Trauma beds and O-Negative blood.",
            alert: "Action Required",
            color: "purple"
          }
        ]);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [role]);

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.2)] relative overflow-hidden group mb-8">
      {/* Decorative Grid */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGgyMHYyMEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDEwaDIwTTAgMjBoMjBNMCAzMGgyME0xMCAwdjIwTTIwIDB2MjBNMzAgMHYyMCIgc3Ryb2tlPSIjM2I4MmY2IiBzdHJva2Utb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] pointer-events-none opacity-50"></div>
      
      {/* Scanning Line */}
      {isScanning && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_10px_#3b82f6] animate-scan opacity-50"></div>
      )}

      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="text-lg font-black flex items-center gap-2 text-slate-100 uppercase tracking-widest">
          <div className="relative">
            <div className={`absolute inset-0 rounded-full blur-md animate-pulse ${isScanning ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
            <div className={`bg-slate-800 p-1.5 rounded-lg border shadow-inner relative z-10 ${isScanning ? 'border-blue-500/50 text-blue-400' : 'border-emerald-500/50 text-emerald-400'}`}>
              <Activity size={16} />
            </div>
          </div>
          AI Predictive Insight
        </h3>
        <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 text-slate-300 border border-slate-700 rounded-full text-[10px] font-bold uppercase tracking-widest">
          {isScanning ? (
            <><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></div> Syncing Data</>
          ) : (
            <><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Live Feed</>
          )}
        </span>
      </div>

      <div className="space-y-4 relative z-10 min-h-[160px]">
        <AnimatePresence>
          {isScanning ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-[120px] gap-3 text-slate-400"
            >
              <div className="w-10 h-10 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Running Neural Models...</p>
            </motion.div>
          ) : (
            predictions.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.2 }}
                className={`bg-slate-800/50 border border-${p.color}-500/20 p-4 rounded-2xl flex gap-4 items-start group/item hover:bg-slate-800 transition-colors`}
              >
                <div className={`mt-1 p-2 rounded-xl bg-${p.color}-500/10 border border-${p.color}-500/20 shadow-inner`}>
                  {p.icon}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <p className={`font-black text-sm text-${p.color}-400 uppercase tracking-widest`}>{p.title}</p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest bg-${p.color}-900/30 text-${p.color}-300 border-${p.color}-700/50`}>
                      {p.alert}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm font-medium leading-relaxed">{p.desc}</p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AIPredictivePanel;
