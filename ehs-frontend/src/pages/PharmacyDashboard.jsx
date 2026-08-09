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

  // E-Prescription State
  const [rxId, setRxId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedRx, setVerifiedRx] = useState(null);
  const [rxError, setRxError] = useState('');

  // Auto-Order State
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

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

  const handleVerifyRx = () => {
    if (!rxId.trim()) {
      setRxError('Please enter a Prescription ID');
      return;
    }
    setRxError('');
    setIsVerifying(true);
    setVerifiedRx(null);
    
    // Simulate API call to verify prescription
    setTimeout(() => {
      if (rxId.toLowerCase() === 'invalid') {
        setRxError('Invalid Prescription ID or QR Code');
      } else {
        setVerifiedRx({
          id: rxId.toUpperCase(),
          patientName: 'Rahul Sharma',
          age: 34,
          doctor: 'Dr. A. Kumar (PHC-East)',
          date: new Date().toLocaleDateString(),
          medicines: [
            { name: 'Amoxicillin 500mg', dosage: '1-0-1', days: 5 },
            { name: 'Paracetamol 500mg', dosage: '1-1-1', days: 3 }
          ],
          status: 'Valid'
        });
      }
      setIsVerifying(false);
    }, 1500);
  };

  const handleAutoOrder = async () => {
    setIsOrdering(true);
    
    try {
      // Find paracetamol or lowest stock item
      let targetItem = inventory.find(i => i.name.toLowerCase().includes('paracetamol'));
      if (!targetItem && inventory.length > 0) {
        targetItem = inventory.reduce((prev, curr) => prev.stock < curr.stock ? prev : curr);
      }

      if (targetItem) {
        const res = await api.post(`/pharmacy/inventory/${targetItem.id}`, { 
          stock: targetItem.stock + 500, 
          status: 'OPTIMAL' 
        });
        setInventory(inventory.map(item => item.id === targetItem.id ? res.data : item));
      }
      
      setIsOrdering(false);
      setOrderSuccess(true);
      setTimeout(() => setOrderSuccess(false), 5000);
    } catch (err) {
      console.error(err);
      setIsOrdering(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-10 selection:bg-teal-500/30 transition-colors duration-300">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-200/40 dark:bg-teal-900/20 blur-[120px] animate-float"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-200/40 dark:bg-emerald-900/20 blur-[100px] animate-float-delayed"></div>
      </div>

      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center z-50 sticky top-0 shadow-sm transition-colors duration-300">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-800 shadow-sm drop-shadow-sm">
            <ShieldPlus size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 drop-shadow-sm">Pharmacy Hub</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-2 font-medium mt-1">
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-bold">Logged in as {user?.role.toUpperCase()}</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
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
          <button onClick={logout} className="px-5 py-2 text-sm font-bold tracking-widest uppercase text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800/50 rounded-xl transition-colors shadow-sm">Sign Out</button>
        </motion.div>
      </header>

      <main className="max-w-5xl mx-auto w-full px-6 mt-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-10 border border-slate-100 dark:border-slate-800 shadow-soft-lg relative overflow-hidden transition-colors duration-300"
        >
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-teal-100/50 dark:bg-teal-900/20 rounded-full blur-[80px] pointer-events-none"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 relative z-10 gap-6">
            <div>
              <h2 className="text-4xl font-black mb-3 tracking-tight text-slate-800 dark:text-slate-100 drop-shadow-sm">Critical Inventory</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-lg leading-relaxed max-w-2xl">
                Manage stock for vital rural medicines. Your live status is instantly visible to local clinics and emergency responders.
              </p>
            </div>
            <div className="w-20 h-20 bg-teal-50 dark:bg-teal-900/30 border border-teal-100 dark:border-teal-800/50 rounded-3xl flex items-center justify-center text-teal-500 dark:text-teal-400 shadow-sm shrink-0 group hover:scale-110 transition-transform duration-500">
              <Package size={40} className="group-hover:animate-pulse" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            <AnimatePresence>
              {inventory.map((item, idx) => {
                const isOptimal = item.status === 'OPTIMAL';
                const isLow = item.status === 'LOW';
                
                let glowColor = 'rgba(239, 68, 68, 0.05)'; // Red
                let borderColor = 'border-red-300';
                let textColor = 'text-red-500';
                
                if (isOptimal) {
                  glowColor = 'rgba(20, 184, 166, 0.05)'; // Teal
                  borderColor = 'border-teal-300';
                  textColor = 'text-teal-600';
                } else if (isLow) {
                  glowColor = 'rgba(234, 179, 8, 0.05)'; // Yellow
                  borderColor = 'border-yellow-300';
                  textColor = 'text-yellow-600';
                }

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                  >
                    <InteractiveCard glowColor={glowColor} className={`h-full p-6 flex flex-col justify-between border-l-[4px] ${borderColor} dark:bg-slate-800/50 shadow-soft hover:shadow-soft-lg`}>
                      <div className="mb-8">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold text-xl text-slate-800 dark:text-slate-200 leading-tight pr-4 drop-shadow-sm">{item.name}</h3>
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700/50 rounded border border-slate-200 dark:border-slate-600 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest shrink-0">
                            {item.category}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2 mt-4 bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Stock:</span>
                          <span className={`text-4xl font-black ${textColor} drop-shadow-sm`}>
                            <AnimatedCounter to={item.stock} duration={1} />
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                          {isOptimal ? (
                            <span className="text-teal-600 dark:text-teal-400 flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 dark:bg-teal-900/30 rounded-lg border border-teal-100 dark:border-teal-800/50"><Check size={14}/> Ready</span>
                          ) : isLow ? (
                            <span className="text-yellow-600 dark:text-yellow-400 flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-100 dark:border-yellow-800/50"><AlertTriangle size={14}/> Low</span>
                          ) : (
                            <span className="text-red-500 dark:text-red-400 flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-100 dark:border-red-800/50"><X size={14}/> Empty</span>
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12 relative z-10 items-stretch">
            {/* E-Prescription Verifier - Premium UI */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
               className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] relative overflow-hidden group h-full flex flex-col"
            >
               {/* Decorative Background */}
               <div className="absolute top-[-50%] right-[-20%] w-96 h-96 bg-blue-400/10 dark:bg-blue-500/10 blur-[80px] rounded-full pointer-events-none transition-transform duration-700 group-hover:scale-110"></div>
               
               <div className="flex items-center justify-between mb-8 relative z-10">
                 <h3 className="text-xl font-black flex items-center gap-3 text-slate-800 dark:text-slate-100 uppercase tracking-widest drop-shadow-sm">
                   <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 border border-blue-100 dark:border-blue-800/50 shadow-sm">
                     <ScanLine size={20}/> 
                   </div>
                   E-Prescription
                 </h3>
                 <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-100 dark:border-blue-800/50">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div> Network Active
                 </span>
               </div>
               
               {!verifiedRx ? (
                 <div className="relative z-10">
                   <div className="relative border-2 border-dashed border-blue-200 dark:border-slate-600 rounded-2xl p-10 text-center bg-gradient-to-b from-blue-50/50 to-transparent dark:from-slate-700/30 dark:to-transparent transition-all duration-300 hover:border-blue-400 dark:hover:border-blue-500 group/scan mb-6 overflow-hidden">
                      {/* Scanning Line Animation */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-scan opacity-0 group-hover/scan:opacity-100 transition-opacity"></div>
                      
                      <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-blue-500 mx-auto mb-5 shadow-soft-lg border border-blue-100 dark:border-slate-700 group-hover/scan:scale-110 transition-transform duration-500 relative">
                         <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping"></div>
                         <FileText size={32} className="relative z-10"/>
                      </div>
                      <p className="text-lg font-black text-slate-800 dark:text-slate-200 mb-2">Scan ABHA QR Code</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-[250px] mx-auto">Instantly verify and load digital prescriptions from connected doctors.</p>
                   </div>
                   
                   <div className="flex flex-col gap-2">
                     <div className="flex gap-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
                        <div className="flex-1 relative">
                          <input 
                            type="text" 
                            placeholder="Or enter Rx ID manually..." 
                            value={rxId}
                            onChange={(e) => setRxId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleVerifyRx()}
                            className="w-full bg-transparent px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none uppercase" 
                          />
                        </div>
                        <MagneticButton 
                          variant="primary" 
                          onClick={handleVerifyRx}
                          disabled={isVerifying}
                          className="bg-blue-600 hover:bg-blue-500 shadow-[0_4px_15px_rgba(37,99,235,0.3)] disabled:opacity-70 flex items-center gap-2 px-6 rounded-xl"
                        >
                          {isVerifying ? (
                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Fetching</>
                          ) : 'Verify'}
                        </MagneticButton>
                     </div>
                     {rxError && <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500 font-bold ml-2 flex items-center gap-1"><AlertTriangle size={12}/> {rxError}</motion.p>}
                   </div>
                 </div>
               ) : (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="bg-white dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-2xl p-1 relative overflow-hidden shadow-soft-lg z-10"
                 >
                   <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                   <div className="p-6">
                     <div className="flex justify-between items-start mb-6">
                       <div>
                         <div className="flex items-center gap-2 mb-2">
                           <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400"><Check size={14} /></span>
                           <span className="text-xs font-black text-green-600 dark:text-green-400 uppercase tracking-widest">Verified Digital Rx</span>
                         </div>
                         <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{verifiedRx.patientName}</p>
                         <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1 px-2 py-0.5 bg-slate-50 dark:bg-slate-900 rounded inline-block">ID: {verifiedRx.id}</p>
                       </div>
                       <div className="text-right bg-blue-50 dark:bg-slate-900 p-3 rounded-xl border border-blue-100 dark:border-slate-700">
                         <p className="text-[10px] text-blue-500 dark:text-blue-400 font-black uppercase tracking-widest mb-1">Prescribing Doctor</p>
                         <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{verifiedRx.doctor}</p>
                         <p className="text-[10px] text-slate-400 font-medium mt-1">{verifiedRx.date}</p>
                       </div>
                     </div>
                     
                     <div className="space-y-3 mb-8 relative">
                       <div className="absolute left-[15px] top-4 bottom-4 w-px bg-slate-200 dark:bg-slate-700"></div>
                       {verifiedRx.medicines.map((med, idx) => (
                         <div key={idx} className="flex items-center gap-4 relative z-10">
                           <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border-2 border-blue-500 flex items-center justify-center shadow-sm shrink-0">
                             <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                           </div>
                           <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex justify-between items-center group hover:border-blue-200 dark:hover:border-slate-500 transition-colors">
                             <div>
                               <p className="font-bold text-slate-800 dark:text-slate-200">{med.name}</p>
                               <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Dosage: <span className="text-blue-600 dark:text-blue-400">{med.dosage}</span> • {med.days} Days</p>
                             </div>
                             <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 flex items-center justify-center cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-500 hover:border-green-200 transition-colors">
                               <Check size={16} className="text-slate-300 dark:text-slate-500" />
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                     
                     <div className="mt-auto pt-8 flex gap-4">
                       <button 
                         onClick={() => { setVerifiedRx(null); setRxId(''); }} 
                         className="px-6 py-3 text-slate-500 dark:text-slate-400 font-bold text-sm hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                       >
                         Cancel
                       </button>
                       <MagneticButton 
                         onClick={() => {
                           setVerifiedRx(null);
                           setRxId('');
                         }} 
                         variant="success"
                         className="flex-1 py-4 text-white font-black text-sm uppercase tracking-widest bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2"
                       >
                         <Package size={18} /> Mark as Dispensed
                       </MagneticButton>
                     </div>
                   </div>
                 </motion.div>
               )}
            </motion.div>

            {/* Smart Restock Agent - Premium UI */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.4 }}
               className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] relative overflow-hidden group h-full flex flex-col"
            >
               {/* Decorative Background */}
               <div className="absolute top-[-20%] left-[-20%] w-64 h-64 bg-orange-400/10 dark:bg-orange-500/10 blur-[80px] rounded-full pointer-events-none transition-transform duration-700 group-hover:scale-110"></div>
               
               <div className="flex items-center justify-between mb-8 relative z-10">
                 <h3 className="text-xl font-black flex items-center gap-3 text-slate-800 dark:text-slate-100 uppercase tracking-widest drop-shadow-sm">
                   <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-500 border border-orange-100 dark:border-orange-800/50 shadow-sm">
                     <Zap size={20} className={isOrdering ? "animate-pulse" : ""} /> 
                   </div>
                   AI Restock Agent
                 </h3>
                 <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                   Automated Mode
                 </span>
               </div>
               
               <div className="relative z-10">
                 <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/10 border border-orange-200 dark:border-orange-800/50 p-6 rounded-2xl shadow-inner mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[30px] rounded-full"></div>
                    <div className="flex items-start gap-4 relative z-10">
                       <div className="mt-1 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                         <AlertTriangle size={16} />
                       </div>
                       <div>
                         <p className="text-xs font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                           <span className="relative flex h-2 w-2">
                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                             <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                           </span>
                           Critical Low Stock
                         </p>
                         <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                           Paracetamol & ORS inventory has dropped below 15% threshold. AI model predicts surge in demand due to current weather conditions.
                         </p>
                       </div>
                    </div>
                 </div>
                 
                 <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group/item">
                       <div className="absolute left-0 top-0 w-1 h-full bg-red-500"></div>
                       <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center font-black text-slate-400 dark:text-slate-500">Rx</div>
                       <div className="flex-1">
                          <p className="font-bold text-slate-800 dark:text-slate-200">Paracetamol 500mg</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase">Current: 20</span>
                            <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded uppercase">Req: 500</span>
                          </div>
                       </div>
                       <span className="text-[10px] font-black text-red-500 dark:text-red-400 uppercase tracking-widest px-3 py-1.5 border border-red-100 dark:border-red-900/50 rounded-lg bg-red-50/50 dark:bg-red-900/20">Action Required</span>
                    </div>
                 </div>
                 
                 <div className="mt-auto pt-8">
                   <MagneticButton 
                     variant={orderSuccess ? "success" : "primary"}
                     onClick={handleAutoOrder}
                     disabled={isOrdering || orderSuccess}
                     className={`w-full py-4 rounded-xl text-sm font-black uppercase tracking-widest shadow-[0_8px_25px_rgba(249,115,22,0.3)] flex items-center justify-center gap-3 transition-all duration-500 ${orderSuccess ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-[0_8px_25px_rgba(16,185,129,0.3)] border-none text-white' : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-none text-white'} disabled:opacity-90 disabled:scale-100`}
                   >
                     {isOrdering ? (
                       <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Handshaking with Supplier Node...</>
                     ) : orderSuccess ? (
                       <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
                         <Check size={20} /> Order Dispatched • ETA: 2 Hours
                       </motion.div>
                     ) : (
                       <><Truck size={18}/> Auto-Order from Regional Hub</>
                     )}
                   </MagneticButton>
                 </div>
               </div>
            </motion.div>
             {/* Critical Rural Supplies Alert - Premium UI */}
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.5 }}
               className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] relative overflow-hidden group lg:col-span-1 md:col-span-2 h-full flex flex-col"
             >
               <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-red-400/10 dark:bg-red-500/10 blur-[80px] rounded-full pointer-events-none transition-transform duration-700 group-hover:scale-110"></div>
               
               <div className="flex items-center justify-between mb-8 relative z-10">
                 <h3 className="text-xl font-black flex items-center gap-3 text-slate-800 dark:text-slate-100 uppercase tracking-widest drop-shadow-sm">
                   <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-500 border border-red-100 dark:border-red-800/50 shadow-sm animate-pulse">
                     <AlertTriangle size={20} /> 
                   </div>
                   Rural Alert
                 </h3>
                 <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-red-200 dark:border-red-700">
                   Priority Level 1
                 </span>
               </div>

               <div className="space-y-4 relative z-10">
                 <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 p-4 rounded-xl flex items-center justify-between group/item transition-colors hover:bg-red-100 dark:hover:bg-red-900/40">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Snake Anti-Venom</p>
                      <p className="text-xs text-red-500 font-medium">Critical: Only 2 vials left</p>
                    </div>
                    <div className="text-right">
                      <MagneticButton size="sm" className="bg-red-600 hover:bg-red-500 px-3 py-1 text-[10px] shadow-none text-white rounded">Request</MagneticButton>
                    </div>
                 </div>

                 <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 p-4 rounded-xl flex items-center justify-between group/item transition-colors hover:bg-orange-100 dark:hover:bg-orange-900/40">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Maternal Bleeding Kit</p>
                      <p className="text-xs text-orange-500 font-medium">Low: 5 kits remaining</p>
                    </div>
                    <div className="text-right">
                      <MagneticButton size="sm" className="bg-orange-600 hover:bg-orange-500 px-3 py-1 text-[10px] shadow-none text-white rounded">Request</MagneticButton>
                    </div>
                 </div>
               </div>
             </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default PharmacyDashboard;
