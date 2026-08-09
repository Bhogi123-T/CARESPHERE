import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { io } from 'socket.io-client';
import { BACKEND_URL } from '../services/api';
import api from '../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Activity, MapPin, CheckCircle, Clock, Bed, Users, AlertTriangle, Radio, Truck, BrainCircuit, WifiOff, Heart } from 'lucide-react';
import { useLocationName } from '../hooks/useLocationName';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { getLocationName } from '../services/geocoding';
import { LiveMapUpdater } from '../hooks/LiveMapUpdater';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ThemeToggle from '../components/ui/ThemeToggle';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import MagneticButton from '../components/ui/MagneticButton';
import { motion, AnimatePresence } from 'framer-motion';
import { useNetworkState } from '../hooks/useNetworkState';
import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip, YAxis } from 'recharts';
import AIPredictivePanel from '../components/ui/AIPredictivePanel';

// --- OFFLINE SAFE ICONS ---
const defaultIcon = L.divIcon({
  html: `<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.4);"></div>`,
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});
L.Marker.prototype.options.icon = defaultIcon;

const redIcon = L.divIcon({
  html: `<div style="background-color: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.4);"></div>`,
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const hospitalIcon = L.divIcon({
  html: `<div style="background-color: #22c55e; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 14px;">🏥</div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const ambulanceIcon = L.divIcon({
  html: `<div style="background-color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.6); border: 2px solid #ef4444; font-size: 20px;">🚑</div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});


import TimeAgo from '../components/ui/TimeAgo';
import LanguageToggle from '../components/ui/LanguageToggle';
import { useLanguage } from '../context/LanguageContext';

const HospitalDashboard = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { isOnline } = useNetworkState();
  const { addToast } = useToast();
  const [socket, setSocket] = useState(null);
  const [emergencies, setEmergencies] = useState([]);
  const [dispatchingId, setDispatchingId] = useState(null);
  const [center, setCenter] = useState([17.3850, 78.4867]);
  const [lowDataMode, setLowDataMode] = useState(false); 
  const [locations, setLocations] = useState({});
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [checklist, setChecklist] = useState({ blood: false, bed: false, doctor: false, medicine: false });
  const [liveAmbulances, setLiveAmbulances] = useState({});
  const ownLocationName = useLocationName();
  const { location: hospitalLocation, isTracking } = useLiveLocation();

  const [beds, setBeds] = useState(() => JSON.parse(localStorage.getItem('hospital_beds')) || {
    icu: { available: 2, total: 20 },
    oxygen: { available: 15, total: 50 },
    general: { available: 45, total: 100 }
  });
  
  const [staff, setStaff] = useState(() => JSON.parse(localStorage.getItem('hospital_staff')) || [
    { name: 'Dr. Sarah Jenkins', role: 'Head of ER', status: 'Available', color: 'text-green-400' },
    { name: 'Dr. Marcus Chen', role: 'Trauma Surgeon', status: 'In Surgery', color: 'text-orange-400' },
    { name: 'Nurse Emily R.', role: 'Triage Lead', status: 'Available', color: 'text-green-400' }
  ]);
  
  const [isEditingResources, setIsEditingResources] = useState(false);

  const sortEmergencies = (a, b) => {
    const riskScore = { 'CRITICAL': 3, 'HIGH': 2, 'MEDIUM': 1, 'LOW': 0 };
    const scoreA = riskScore[a.risk_level] || 0;
    const scoreB = riskScore[b.risk_level] || 0;
    if (scoreA !== scoreB) return scoreB - scoreA;
    return new Date(b.created_at) - new Date(a.created_at);
  };

  const pendingEmergencies = emergencies.filter(e => e.status === 'PENDING').sort(sortEmergencies);
  const incomingPatients = emergencies.filter(e => e.status !== 'PENDING').sort(sortEmergencies);

  // Helper function to calculate distance using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;  
    const dLon = (lon2 - lon1) * Math.PI / 180; 
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return (R * c).toFixed(1);
  };

  useEffect(() => {
    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('request_emergencies');
    });

    newSocket.on('update_emergencies', (data) => {
      const filteredData = data.filter(e => e.symptoms !== 'Test Emergency');
      setEmergencies(filteredData);
      if (filteredData.length > 0 && filteredData[0].location) {
        setCenter([filteredData[0].location.lat, filteredData[0].location.lng]);
      }
    });

    newSocket.on('new_emergency_alert', (data) => {
      addToast(
        `${data.risk_level} Emergency reported at ${data.locationName || 'Unknown Location'} - Symptoms: ${data.symptoms}`, 
        data.risk_level === 'CRITICAL' ? 'critical' : 'error',
        12000
      );
    });

    newSocket.on('new_patient_registered', (data) => {
      addToast(
        `NEW PATIENT PROFILE: ${data.name} (${data.blood_group}) - ${data.risk_level} Risk`, 
        'info',
        8000
      );
    });

    newSocket.on('live_ambulance_location', (data) => {
      setLiveAmbulances(prev => ({
        ...prev,
        [data.emergency_id]: data
      }));
    });

    return () => newSocket.disconnect();
  }, [addToast]);

  useEffect(() => {
    emergencies.forEach(async (e) => {
      if (e.location_name) {
        setLocations(prev => ({ ...prev, [e.id]: e.location_name }));
      } else if (e.location && !locations[e.id]) {
        try {
          const locName = await getLocationName(e.location.lat, e.location.lng);
          setLocations(prev => ({
            ...prev,
            [e.id]: locName
          }));
        } catch (err) {
          console.error(err);
        }
      }
    });
  }, [emergencies, locations]);

  const acceptEmergency = (id) => {
    if (socket) {
      socket.emit('accept_emergency', {
        emergency_id: id,
        role: user.role
      });
    }
  };

  const handleAutoDispatch = async (id) => {
    setDispatchingId(id);
    try {
      const response = await api.post('/auto-dispatch', { emergency_id: id });
      addToast(
        `AI DISPATCH SUCCESS: Assigned ${response.data.ambulance_assigned} (Distance: ${response.data.distance}, Score: ${response.data.multi_factor_score})`,
        'success',
        8000
      );
      // Backend automatically updates emergency status, socket will broadcast update_emergencies
    } catch (error) {
      addToast(error.response?.data?.msg || 'Auto-Dispatch failed.', 'error');
    } finally {
      setDispatchingId(null);
    }
  };

  const handleDispatchVolunteer = (id) => {
    // In a real app this would hit a backend endpoint that sends an SMS to the nearest ASHA worker.
    // For MVP, we simulate the action and show a success toast.
    addToast(
      'ASHA WORKER DISPATCHED: Alert sent to nearest local volunteer via SMS for immediate first-aid.',
      'success',
      8000
    );
  };

  return (
    <div className="h-screen flex flex-col relative overflow-hidden bg-slate-950 selection:bg-blue-500/30">
      {!isOnline && (
        <div className="bg-red-600/90 backdrop-blur-md text-white text-center py-1.5 px-4 font-black uppercase tracking-widest text-[10px] shadow-[0_0_15px_rgba(220,38,38,0.5)] animate-pulse z-[9999] relative border-b border-red-500 flex items-center justify-center gap-2">
          <WifiOff size={14} /> ⚠️ Rural Offline Mode Active - Using Local Network & Triangulation
        </div>
      )}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 shadow-[0_4px_30px_rgba(0,0,0,0.1)] p-4 flex flex-col md:flex-row justify-between items-center z-50 gap-4 md:gap-0 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-blue-400 border border-slate-700 shadow-[0_0_15px_rgba(59,130,246,0.2)] drop-shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors"></div>
            <Activity size={24} className="relative z-10" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-sm flex items-center gap-2">
              Apollo City Hospital
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            </h1>
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mt-0.5 mb-1.5">Central Emergency Command</p>
            <p className="text-slate-400 text-xs flex items-center gap-2 font-medium">
              <Badge variant="primary" className="px-2 py-0.5 text-[10px] bg-blue-900/30 text-blue-400 border-blue-800/50">Lvl: {user?.role.toUpperCase()}</Badge>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-slate-300">
                {isTracking ? <span className="relative flex h-2 w-2 mr-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span></span> : <MapPin size={12} className="text-slate-400"/>}
                {ownLocationName} {hospitalLocation ? `(${hospitalLocation.lat.toFixed(4)}, ${hospitalLocation.lng.toFixed(4)})` : ''}
              </span>
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap gap-4 md:gap-6 items-center bg-slate-800/50 backdrop-blur-md p-2 px-4 md:px-6 rounded-2xl border border-slate-700 shadow-inner w-full md:w-auto justify-center">
          <div className="text-center px-2">
            <div className="text-3xl font-black text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]">
              <AnimatedCounter to={emergencies.filter(e => e.status === 'PENDING').length} duration={1} />
            </div>
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">{t('hospital.active_emergencies') || 'Active SOS'}</div>
          </div>
          <div className="w-px h-10 bg-slate-700"></div>
          <div className="text-center px-2">
            <div className="text-3xl font-black text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]">
              <AnimatedCounter to={4} duration={1.5} />
            </div>
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">{t('hospital.ambulances') || 'Ambulances'}</div>
          </div>
          <div className="w-px h-10 bg-slate-700"></div>
          <div className="text-center px-2">
            <div className="text-3xl font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">
              <AnimatedCounter to={8} duration={2} />
            </div>
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">{t('hospital.doctors') || 'Doctors'}</div>
          </div>
          <div className="w-px h-10 bg-slate-700"></div>
          <button onClick={() => setLowDataMode(!lowDataMode)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shadow-sm ${lowDataMode ? 'bg-orange-900/30 text-orange-400 border-orange-800 shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'bg-slate-700 text-slate-300 border-slate-600 hover:text-white'}`}>{lowDataMode ? '⚡ 2G Mode On' : '⚡ 2G Mode'}</button>
          <LanguageToggle />
          <Button variant="ghost" size="sm" onClick={logout} className="text-red-400 hover:text-red-300 hover:bg-red-900/30 border border-transparent hover:border-red-800/50 rounded-lg">{t('app.logout')}</Button>
        </div>
      </header>

      <div className="flex flex-col-reverse md:flex-row flex-1 overflow-y-auto md:overflow-hidden relative">
        {/* Sidebar */}
        <aside className="w-full md:w-[420px] h-[50vh] md:h-full premium-glass-panel bg-slate-900/90 rounded-none border-t md:border-t-0 md:border-r border-slate-800 overflow-y-auto p-4 md:p-6 flex flex-col gap-6 z-10 custom-scrollbar relative">
          <AIPredictivePanel role="hospital" />
          
          <h2 className="text-xl font-black flex items-center gap-3 tracking-tight text-white">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-glow-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
            Emergency Queue
          </h2>
          
          {emergencies.length === 0 ? (
            <div className="text-center py-16 px-6 bg-slate-800/50 border border-slate-700 rounded-3xl animate-fade-in-up shadow-inner relative overflow-hidden">
              <div className="absolute inset-0 bg-green-500/5 blur-[50px] rounded-full"></div>
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] relative z-10" />
              <p className="font-bold text-lg text-slate-300 relative z-10">No active emergencies</p>
              <p className="text-sm mt-2 text-slate-500 font-medium relative z-10">The queue is clear.</p>
            </div>
          ) : (
            <motion.div 
              initial="hidden" 
              animate="show" 
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.1 } }
              }}
              className="space-y-4"
            >
              {pendingEmergencies.map((e, idx) => (
                <motion.div 
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.95 },
                    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
                  }}
                  key={e.id} 
                  className="premium-glass-card p-5 border-l-[4px] border-l-red-500 bg-slate-800/80 border-slate-700/50 hover:border-slate-600 transition-all relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-[40px] rounded-full pointer-events-none group-hover:bg-red-500/10 transition-colors"></div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <Badge variant={e.risk_level === 'CRITICAL' ? 'danger' : 'warning'} className={`uppercase tracking-widest text-[9px] font-black ${e.risk_level === 'CRITICAL' ? 'bg-red-900/50 text-red-400 border-red-800/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-orange-900/50 text-orange-400 border-orange-800/50'}`}>
                      {e.risk_level}
                    </Badge>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-bold uppercase tracking-wider"><Clock size={12} className="text-slate-500"/> <TimeAgo timestamp={e.created_at} /></span>
                  </div>
                  <p className="text-base font-black mb-3 text-slate-100 leading-snug relative z-10">{e.symptoms}</p>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 mb-5 shadow-inner flex flex-col gap-2 relative z-10">
                    <p className="text-xs text-orange-400 flex items-center gap-2 font-medium leading-relaxed"><MapPin size={14} className="text-orange-500/70"/> {locations[e.id] || 'Loading location...'}</p>
                  </div>
                  
                  <div className="flex flex-col gap-2 relative z-10">
                    <div className="flex gap-2">
                      <MagneticButton className="flex-1">
                        <Button 
                          variant="primary"
                          className="w-full bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-slate-500 text-slate-200 text-xs px-2 shadow-none rounded-xl"
                          onClick={() => acceptEmergency(e.id)}
                        >
                          Manual Accept
                        </Button>
                      </MagneticButton>
                      <MagneticButton className="flex-1">
                        <Button 
                          variant="secondary"
                          disabled={dispatchingId === e.id}
                          className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 border-none shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] text-white text-xs px-2 flex items-center justify-center gap-2 rounded-xl"
                          onClick={() => handleAutoDispatch(e.id)}
                        >
                          <BrainCircuit size={14} className={dispatchingId === e.id ? 'animate-spin' : ''} />
                          {dispatchingId === e.id ? 'Computing...' : 'AI Dispatch'}
                        </Button>
                      </MagneticButton>
                    </div>
                    <MagneticButton className="w-full mt-1">
                      <Button 
                        variant="warning"
                        className="w-full bg-orange-600/20 hover:bg-orange-600/40 border border-orange-500/50 text-orange-400 text-xs px-2 shadow-none rounded-xl"
                        onClick={() => handleDispatchVolunteer(e.id)}
                      >
                        Dispatch Local ASHA/Volunteer First
                      </Button>
                    </MagneticButton>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {incomingPatients.length > 0 && (
            <>
              <h2 className="text-xl font-black flex items-center gap-3 tracking-tight text-white mt-6">
                <span className="w-3 h-3 rounded-full bg-orange-500 animate-glow-pulse shadow-[0_0_10px_rgba(249,115,22,0.5)]"></span>
                Incoming ETA
              </h2>
              <div className="space-y-4">
                {incomingPatients.map((e) => (
                  <div key={e.id} className="premium-glass-card p-5 border-l-[4px] border-l-orange-500 bg-slate-800/80 border-slate-700/50 hover:border-slate-600 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <Badge variant="warning" className="uppercase tracking-widest text-[9px] font-black bg-orange-900/40 text-orange-400 border border-orange-800/50 shadow-[0_0_10px_rgba(249,115,22,0.15)]">
                        <Truck size={12} className="inline mr-1" /> En Route
                      </Badge>
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest mb-1 text-slate-500">Target: <span className="text-orange-400">{e.hospital_name}</span></p>
                    <p className="text-base font-bold mb-4 text-slate-100 leading-snug">{e.symptoms}</p>
                    
                    <div className="flex flex-col gap-3">
                      <MagneticButton className="w-full">
                        <Button 
                          variant="secondary"
                          className="w-full uppercase tracking-widest text-[10px] font-black py-3 bg-slate-700/50 hover:bg-slate-700 text-blue-400 border border-blue-900/50 hover:border-blue-700/50 shadow-none rounded-xl transition-all"
                          onClick={() => {
                            setSelectedEmergency(e);
                            setChecklist({ blood: false, bed: false, doctor: false, medicine: false });
                          }}
                        >
                          Open Pre-Arrival HUD
                        </Button>
                      </MagneticButton>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </aside>

        {/* Map */}
        <main className="flex-1 relative z-0 h-[50vh] md:h-auto min-h-[400px]">
          <MapContainer 
            center={center} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} className={lowDataMode ? 'bg-slate-900' : 'grayscale-[20%] contrast-110'}>
            {!lowDataMode && (
              <TileLayer
                url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                attribution='&copy; Google Maps'
              />
            )}
            <LiveMapUpdater defaultCenter={center} />
            
            {emergencies.filter(e => e.status === 'PENDING' || e.status === 'ACCEPTED').map((e) => e.location && (
              <Marker 
                key={e.id} 
                position={[e.location.lat, e.location.lng]}
                icon={e.status === 'PENDING' ? redIcon : new L.Icon.Default()}
              >
                <Popup className="custom-popup">
                  <div className="text-slate-900 font-medium p-2 text-sm">
                    <p className="font-black text-red-600 mb-2 uppercase tracking-wider">{e.risk_level} EMERGENCY</p>
                    <p className="text-sm mb-3 font-bold leading-tight">{e.symptoms}</p>
                    <div className="inline-block px-2 py-1 bg-slate-200 rounded text-[10px] font-bold text-slate-700 uppercase tracking-wider">Status: {e.status}</div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {Object.values(liveAmbulances).map((amb) => (
              <Marker 
                key={`amb-${amb.emergency_id}`} 
                position={[amb.lat, amb.lng]}
                icon={ambulanceIcon}
                zIndexOffset={1000}
              >
                <Popup className="custom-popup">
                   <div className="font-bold text-slate-900 p-2 text-sm">Ambulance ETA: {amb.eta_left} mins</div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          
          {/* Overlay gradient for Map to blend with dark mode */}
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(2,6,23,1)] z-[400]"></div>

          {/* Phase 5: Pre-Preparation Panel overlaying the map */}
          {selectedEmergency && (
            <div className="absolute top-6 right-6 md:right-[380px] w-full md:w-[460px] max-h-[85vh] overflow-y-auto bg-slate-900/90 backdrop-blur-2xl border border-blue-900/50 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[500] p-8 animate-fade-in-up custom-scrollbar relative overflow-hidden">
              {/* HUD decorative elements */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
              <div className="absolute top-1/2 left-[-20%] w-64 h-64 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none"></div>
              
              <div className="flex justify-between items-center mb-8 relative z-10">
                <h3 className="font-black text-xl text-white flex items-center gap-3 tracking-widest uppercase text-shadow-sm">
                  <Activity className="text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]" size={24} /> Pre-Arrival HUD
                </h3>
                <button onClick={() => setSelectedEmergency(null)} className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors border border-slate-700 shadow-sm">&times;</button>
              </div>

              {/* Patient Details HUD */}
              <div className="bg-slate-950/60 rounded-2xl p-6 mb-8 border border-slate-800/80 space-y-5 shadow-inner relative z-10">
                <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-slate-500 font-black mb-1.5 flex items-center gap-1.5"><Users size={10} className="text-blue-500"/> Subject Identity</p>
                    <p className="font-black text-xl text-slate-100 uppercase tracking-wide">{selectedEmergency.patient_name} <span className="text-slate-500 font-medium">| {selectedEmergency.patient_age} YRS</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-widest text-slate-500 font-black mb-1.5">Blood Type</p>
                    <p className="font-black text-red-500 text-2xl drop-shadow-[0_0_12px_rgba(239,68,68,0.6)] leading-none">{selectedEmergency.blood_group}</p>
                  </div>
                </div>
                <div className="bg-orange-900/20 border border-orange-900/50 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-orange-500 font-black mb-1">Ambulance ETA</p>
                      <p className="font-black text-orange-400 text-xl flex items-center gap-2">
                        {liveAmbulances[selectedEmergency.id] 
                          ? <><span className="animate-pulse">~{liveAmbulances[selectedEmergency.id].eta_left} MINS</span></> 
                          : 'Calculating...'}
                      </p>
                    </div>
                    <Truck size={24} className="text-orange-500/50"/>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                    <p className="text-[9px] uppercase tracking-widest text-slate-500 font-black mb-2 flex items-center gap-1.5"><Heart size={10} className="text-pink-500"/> Known History</p>
                    <p className="text-sm font-medium text-slate-300 leading-relaxed">{selectedEmergency.medical_history}</p>
                  </div>
                  <div className="bg-red-900/10 p-4 rounded-xl border border-red-900/30">
                    <p className="text-[9px] uppercase tracking-widest text-red-500 font-black mb-2 flex items-center gap-1.5"><AlertTriangle size={10} className="text-red-500"/> Reported Symptoms</p>
                    <p className="text-sm font-medium text-slate-200 leading-relaxed">{selectedEmergency.symptoms}</p>
                  </div>
                </div>
              </div>

              {/* Readiness Checklist HUD */}
              <div className="mb-8 relative z-10">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-4 flex items-center gap-2">
                  <CheckCircle size={14} className="text-emerald-500"/> Facility Readiness Protocol
                </p>
                <div className="space-y-3">
                  {[
                    { id: 'blood', label: 'Blood Units Arranged' },
                    { id: 'bed', label: 'Trauma Bay Ready' },
                    { id: 'doctor', label: 'Surgical Team on Standby' },
                    { id: 'medicine', label: 'Resuscitation Kit Prepped' }
                  ].map(item => (
                    <label key={item.id} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${checklist[item.id] ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600 text-slate-300 shadow-sm'}`}>
                      <div className="relative flex items-center justify-center w-6 h-6 rounded border border-slate-600 bg-slate-900 shrink-0">
                        <input 
                          type="checkbox" 
                          className="peer absolute w-full h-full opacity-0 cursor-pointer"
                          checked={checklist[item.id]}
                          onChange={(e) => setChecklist({...checklist, [item.id]: e.target.checked})}
                        />
                        {checklist[item.id] && <CheckCircle size={16} className="text-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]" />}
                      </div>
                      <span className="font-bold text-sm tracking-wide">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status Banner */}
              <div className="relative z-10">
                {Object.values(checklist).every(Boolean) ? (
                  <div className="bg-gradient-to-r from-emerald-600 to-green-500 text-white font-black uppercase tracking-widest text-center py-5 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.4)] animate-glow-pulse border border-emerald-400 flex items-center justify-center gap-3">
                    <CheckCircle size={20} /> FACILITY READY FOR IMPACT
                  </div>
                ) : (
                  <div className="bg-slate-800 text-slate-500 font-black uppercase tracking-widest text-center py-5 rounded-xl border border-slate-700 shadow-inner flex items-center justify-center gap-3">
                    <AlertTriangle size={18} /> AWAITING PROTOCOL COMPLETION
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
        
        {/* Right Sidebar - Hospital Resources */}
        <aside className="w-full md:w-[350px] h-auto md:h-full bg-slate-900/90 backdrop-blur-md rounded-none md:border-l border-t md:border-t-0 border-slate-800 shadow-[-4px_0_24px_rgba(0,0,0,0.2)] p-4 md:p-6 flex flex-col gap-6 z-10 shrink-0 relative custom-scrollbar overflow-y-auto">
          <h2 className="text-xl font-black flex items-center gap-3 tracking-tight text-white mb-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 animate-glow-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
            Facility Metrics
          </h2>

          {/* Emergency Codes */}
          <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/80 shadow-[0_4px_15px_rgba(0,0,0,0.1)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 blur-[30px] rounded-full pointer-events-none transition-transform group-hover:scale-150"></div>
            <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-4 flex items-center gap-2 relative z-10">
              <Radio size={14} className="text-red-500 animate-pulse"/> Global Broadcast
            </h3>
            <div className="grid grid-cols-2 gap-3 relative z-10">
              <button onClick={() => addToast('CODE BLUE Broadcasted!', 'critical', 5000)} className="bg-blue-900/30 hover:bg-blue-600 border border-blue-800/50 hover:border-blue-500 text-blue-400 hover:text-white font-black text-xs py-3 rounded-xl transition-all shadow-[0_0_10px_rgba(59,130,246,0.1)] hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]">CODE BLUE</button>
              <button onClick={() => addToast('CODE RED Broadcasted!', 'critical', 5000)} className="bg-red-900/30 hover:bg-red-600 border border-red-800/50 hover:border-red-500 text-red-400 hover:text-white font-black text-xs py-3 rounded-xl transition-all shadow-[0_0_10px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse">CODE RED</button>
            </div>
          </div>

          {/* Bed Tracker HUD */}
          <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/80 shadow-[0_4px_15px_rgba(0,0,0,0.1)] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-24 h-24 bg-blue-500/10 blur-[30px] rounded-full pointer-events-none transition-transform group-hover:scale-150"></div>
            <div className="flex justify-between items-center mb-5 relative z-10">
              <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-black flex items-center gap-2">
                <Bed size={14} className="text-blue-500"/> Capacity Grid
              </h3>
              <button onClick={() => setIsEditingResources(true)} className="text-[9px] bg-slate-700 text-slate-300 px-2 py-1 rounded hover:bg-slate-600 font-black uppercase tracking-widest transition-colors border border-slate-600">
                Update
              </button>
            </div>
            <div className="space-y-5 relative z-10">
              <div>
                <div className="flex justify-between text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">
                  <span>CRITICAL (ICU)</span>
                  <span className="text-red-400">{beds.icu.available} / {beds.icu.total}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden shadow-inner relative">
                  <div className="absolute top-0 left-0 h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] rounded-full transition-all duration-1000" style={{ width: `${((beds.icu.total - beds.icu.available) / Math.max(beds.icu.total, 1)) * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">
                  <span>OXYGEN SUPPORT</span>
                  <span className="text-orange-400">{beds.oxygen.available} / {beds.oxygen.total}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden shadow-inner relative">
                  <div className="absolute top-0 left-0 h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)] rounded-full transition-all duration-1000" style={{ width: `${((beds.oxygen.total - beds.oxygen.available) / Math.max(beds.oxygen.total, 1)) * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">
                  <span>GENERAL WARD</span>
                  <span className="text-emerald-400">{beds.general.available} / {beds.general.total}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden shadow-inner relative">
                  <div className="absolute top-0 left-0 h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] rounded-full transition-all duration-1000" style={{ width: `${((beds.general.total - beds.general.available) / Math.max(beds.general.total, 1)) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Staff Roster */}
          <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/80 shadow-[0_4px_15px_rgba(0,0,0,0.1)] flex-1 overflow-y-auto custom-scrollbar relative">
            <div className="flex justify-between items-center mb-5 sticky top-0 bg-slate-800 z-10 pb-2">
              <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-black flex items-center gap-2">
                <Users size={14} className="text-indigo-400"/> Active Specialists
              </h3>
            </div>
            <div className="space-y-3">
              {staff.map((s, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors">
                  <div>
                    <p className="text-xs font-bold text-slate-200">{s.name}</p>
                    <p className="text-[9px] font-black tracking-wider text-slate-500 uppercase mt-0.5">{s.role}</p>
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${s.color} bg-slate-800 px-2 py-1 rounded border border-slate-700`}>{s.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mini Analytics Chart - Dark mode optimized */}
          <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/80 shadow-[0_4px_15px_rgba(0,0,0,0.1)] relative">
            <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-black flex items-center gap-2 mb-5">
              <Activity size={14} className="text-blue-500"/> Arrival Frequency
            </h3>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { time: '08:00', val: 2 }, { time: '09:00', val: 5 }, { time: '10:00', val: 3 },
                  { time: '11:00', val: 8 }, { time: '12:00', val: 12 }, { time: '13:00', val: 7 },
                  { time: '14:00', val: 9 }
                ]} margin={{ top: 5, right: 0, left: -40, bottom: 0 }}>
                  <YAxis hide={true} domain={[0, 'dataMax + 2']} />
                  <RechartsTooltip cursor={false} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#f8fafc', fontWeight: 'bold' }} itemStyle={{ color: '#60a5fa' }} />
                  <Area type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={3} fill="url(#blueMiniGradientHUD)" animationDuration={1500} />
                  <defs>
                    <linearGradient id="blueMiniGradientHUD" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </aside>
      </div>

      {/* Edit Resources Modal - Dark UI */}
      {isEditingResources && (
        <div className="absolute inset-0 bg-slate-950/80 z-[9999] flex items-center justify-center backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 w-full max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-scale-in relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
            <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3 tracking-widest uppercase"><Bed size={20} className="text-blue-500"/> Capacity Update</h2>
            <div className="space-y-5">
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">ICU Beds (Available / Total)</label>
                <div className="flex gap-3">
                  <input type="number" min="0" value={beds.icu.available} onChange={(e) => setBeds({...beds, icu: {...beds.icu, available: parseInt(e.target.value) || 0}})} className="w-1/2 bg-slate-950 border border-slate-700 p-3 rounded-lg text-white font-bold focus:border-blue-500 outline-none shadow-inner" />
                  <input type="number" min="0" value={beds.icu.total} onChange={(e) => setBeds({...beds, icu: {...beds.icu, total: parseInt(e.target.value) || 0}})} className="w-1/2 bg-slate-950 border border-slate-700 p-3 rounded-lg text-white font-bold focus:border-blue-500 outline-none shadow-inner" />
                </div>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Oxygen Beds (Available / Total)</label>
                <div className="flex gap-3">
                  <input type="number" min="0" value={beds.oxygen.available} onChange={(e) => setBeds({...beds, oxygen: {...beds.oxygen, available: parseInt(e.target.value) || 0}})} className="w-1/2 bg-slate-950 border border-slate-700 p-3 rounded-lg text-white font-bold focus:border-blue-500 outline-none shadow-inner" />
                  <input type="number" min="0" value={beds.oxygen.total} onChange={(e) => setBeds({...beds, oxygen: {...beds.oxygen, total: parseInt(e.target.value) || 0}})} className="w-1/2 bg-slate-950 border border-slate-700 p-3 rounded-lg text-white font-bold focus:border-blue-500 outline-none shadow-inner" />
                </div>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">General Beds (Available / Total)</label>
                <div className="flex gap-3">
                  <input type="number" min="0" value={beds.general.available} onChange={(e) => setBeds({...beds, general: {...beds.general, available: parseInt(e.target.value) || 0}})} className="w-1/2 bg-slate-950 border border-slate-700 p-3 rounded-lg text-white font-bold focus:border-blue-500 outline-none shadow-inner" />
                  <input type="number" min="0" value={beds.general.total} onChange={(e) => setBeds({...beds, general: {...beds.general, total: parseInt(e.target.value) || 0}})} className="w-1/2 bg-slate-950 border border-slate-700 p-3 rounded-lg text-white font-bold focus:border-blue-500 outline-none shadow-inner" />
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-4">
              <button onClick={() => setIsEditingResources(false)} className="px-6 py-3 text-slate-400 hover:text-white font-black uppercase tracking-widest text-[10px] transition-colors">Abort</button>
              <button onClick={() => {
                localStorage.setItem('hospital_beds', JSON.stringify(beds));
                setIsEditingResources(false);
                addToast('CAPACITY METRICS UPDATED', 'success', 3000);
              }} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all">Commit Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalDashboard;
