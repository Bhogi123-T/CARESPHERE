import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldPlus, Check, X, Package, MapPin, AlertTriangle, ScanLine, FileText, Truck, Zap } from 'lucide-react';
import { useLocationName } from '../hooks/useLocationName';
import { useLiveLocation } from '../hooks/useLiveLocation';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import InteractiveCard from '../components/ui/InteractiveCard';
import MagneticButton from '../components/ui/MagneticButton';
import AnimatedCounter from '../components/ui/AnimatedCounter';

const PharmacyDashboard = () => {
  const { user, logout } = useAuth();
  const [inventory, setInventory] = useState([]);
  const locationName = useLocationName();
  const { location: pharmacyLocation, isTracking } = useLiveLocation();

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await api.get('/pharmacy/inventory');
        setInventory(res.data);
      } catch (err) {
        console.error("Failed to fetch inventory", err);
      }
    };
    fetchInventory();
  }, []);

  const toggleAvailability = async (id) => {
    const item = inventory.find(i => i.id === id);
    if (!item) return;
    
    const isNowAvailable = item.status === 'OUT_OF_STOCK';
    const newStock = isNowAvailable ? 50 : 0;
    const newStatus = isNowAvailable ? 'OPTIMAL' : 'OUT_OF_STOCK';
    
    try {
      const res = await api.post(`/pharmacy/inventory/${id}`, { stock: newStock, status: newStatus });
      setInventory(inventory.map(i => i.id === id ? res.data : i));
    } catch (err) {
      console.error("Failed to update inventory", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-950 text-white pb-10 selection:bg-teal-500/30">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-600/10 blur-[120px] animate-float"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-600/10 blur-[100px] animate-float-delayed"></div>
      </div>

      <header className="premium-glass-nav p-4 flex justify-between items-center z-50 sticky top-0">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 flex items-center justify-center text-teal-400 border border-teal-500/40 shadow-inner drop-shadow-md">
            <ShieldPlus size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-sm">Pharmacy Hub</h1>
            <p className="text-slate-400 text-xs flex items-center gap-2 font-medium mt-1">
              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-bold">Logged in as {user?.role.toUpperCase()}</span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-slate-300">
                {isTracking ? <span className="relative flex h-2 w-2 mr-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span></span> : <MapPin size={12} className="text-teal-500/70"/>}
                {locationName} {pharmacyLocation ? `(${pharmacyLocation.lat.toFixed(4)}, ${pharmacyLocation.lng.toFixed(4)})` : ''}
              </span>
            </p>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <button onClick={logout} className="px-5 py-2 text-sm font-bold tracking-widest uppercase text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl transition-colors">Sign Out</button>
        </motion.div>
      </header>

      <main className="max-w-5xl mx-auto w-full px-6 mt-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="premium-glass-panel rounded-3xl p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
        >
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-teal-500/10 rounded-full blur-[80px] pointer-events-none"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 relative z-10 gap-6">
            <div>
              <h2 className="text-4xl font-black mb-3 tracking-tight text-white drop-shadow-md">Critical Inventory</h2>
              <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-2xl">
                Manage stock for vital rural medicines. Your live status is instantly visible to local clinics and emergency responders.
              </p>
            </div>
            <div className="w-20 h-20 bg-teal-500/10 border border-teal-500/30 rounded-3xl flex items-center justify-center text-teal-400 shadow-[inset_0_0_30px_rgba(20,184,166,0.1)] shrink-0 group hover:scale-110 transition-transform duration-500">
              <Package size={40} className="group-hover:animate-pulse" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            <AnimatePresence>
              {inventory.map((item, idx) => {
                const isOptimal = item.status === 'OPTIMAL';
                const isLow = item.status === 'LOW';
                
                let glowColor = 'rgba(239, 68, 68, 0.15)'; // Red
                let borderColor = 'border-red-500';
                let textColor = 'text-red-400';
                
                if (isOptimal) {
                  glowColor = 'rgba(20, 184, 166, 0.15)'; // Teal
                  borderColor = 'border-teal-500';
                  textColor = 'text-teal-400';
                } else if (isLow) {
                  glowColor = 'rgba(234, 179, 8, 0.15)'; // Yellow
                  borderColor = 'border-yellow-500';
                  textColor = 'text-yellow-400';
                }

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                  >
                    <InteractiveCard glowColor={glowColor} className={`h-full p-6 flex flex-col justify-between border-l-[4px] ${borderColor} shadow-[0_10px_30px_rgba(0,0,0,0.3)]`}>
                      <div className="mb-8">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold text-xl text-white leading-tight pr-4 drop-shadow-sm">{item.name}</h3>
                          <span className="px-2 py-1 bg-slate-800/80 rounded border border-slate-700 text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0 shadow-inner">
                            {item.category}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2 mt-4 bg-slate-950/50 p-4 rounded-xl border border-white/5 shadow-inner">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Stock:</span>
                          <span className={`text-4xl font-black ${textColor} drop-shadow-md`}>
                            <AnimatedCounter to={item.stock} duration={1} />
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-5 border-t border-white/10">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                          {isOptimal ? (
                            <span className="text-teal-400 flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/10 rounded-lg"><Check size={14}/> Ready</span>
                          ) : isLow ? (
                            <span className="text-yellow-400 flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 rounded-lg"><AlertTriangle size={14}/> Low</span>
                          ) : (
                            <span className="text-red-400 flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 rounded-lg"><X size={14}/> Empty</span>
                          )}
                        </div>
                        
                        <MagneticButton
                          size="sm"
                          variant={item.status !== 'OUT_OF_STOCK' ? 'danger' : 'success'}
                          onClick={() => toggleAvailability(item.id)}
                          className="!py-2 !px-4 text-[11px] tracking-widest shadow-none"
                        >
                          {item.status !== 'OUT_OF_STOCK' ? 'Mark Out' : 'Restock'}
                        </MagneticButton>
                      </div>
                    </InteractiveCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-12 relative z-10">
            {/* E-Prescription Verifier */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
               className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-3xl p-8 shadow-xl relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none"></div>
               <h3 className="text-xl font-black flex items-center gap-3 text-white mb-6 uppercase tracking-widest">
                 <ScanLine className="text-blue-400" size={24}/> E-Prescription Verifier
               </h3>
               
               <div className="border-2 border-dashed border-slate-700 rounded-2xl p-8 text-center bg-slate-950/40 hover:bg-slate-900/60 transition-colors cursor-pointer group mb-6 shadow-inner">
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 mx-auto mb-4 group-hover:scale-110 transition-transform">
                     <FileText size={28}/>
                  </div>
                  <p className="font-bold text-slate-300 mb-2">Scan ABHA QR or Enter Rx ID</p>
                  <p className="text-xs text-slate-500 font-medium">Verify digital prescriptions from connected PHCs instantly.</p>
               </div>
               
               <div className="flex gap-4">
                  <input type="text" placeholder="e.g. RX-99482-ABHA" className="flex-1 bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none shadow-inner" />
                  <MagneticButton variant="primary" className="bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]">Verify</MagneticButton>
               </div>
            </motion.div>

            {/* Automated Restock / Low Stock Alerts */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.4 }}
               className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-3xl p-8 shadow-xl relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[50px] rounded-full pointer-events-none"></div>
               <h3 className="text-xl font-black flex items-center gap-3 text-white mb-6 uppercase tracking-widest">
                 <Truck className="text-orange-400" size={24}/> Smart Restock Agent
               </h3>
               
               <div className="bg-orange-500/10 border border-orange-500/30 p-5 rounded-2xl shadow-[0_0_15px_rgba(249,115,22,0.1)] mb-6">
                  <div className="flex items-center gap-3 mb-2">
                     <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                     </span>
                     <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">Low Stock Detected</p>
                  </div>
                  <p className="text-sm text-slate-300 font-medium">Paracetamol & ORS are critically low. AI suggests immediate restock from regional supplier.</p>
               </div>
               
               <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center bg-slate-950/60 p-4 rounded-xl border border-white/5 shadow-inner">
                     <div>
                        <p className="font-bold text-slate-200 text-sm">Paracetamol 500mg</p>
                        <p className="text-[10px] text-slate-500">Req: 500 strips</p>
                     </div>
                     <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded">Urgent</span>
                  </div>
               </div>
               
               <MagneticButton variant="warning" className="w-full bg-orange-600 hover:bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)] animate-glow-pulse flex items-center justify-center gap-2">
                  <Zap size={16}/> Auto-Order from Supplier
               </MagneticButton>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default PharmacyDashboard;
