import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { io } from 'socket.io-client';
import { BACKEND_URL } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Activity, MapPin, CheckCircle, Clock, Bed, Users, AlertTriangle, Radio, Truck } from 'lucide-react';
import { useLocationName } from '../hooks/useLocationName';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { getLocationName } from '../services/geocoding';
import { LiveMapUpdater } from '../hooks/LiveMapUpdater';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ThemeToggle from '../components/ui/ThemeToggle';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import { motion, AnimatePresence } from 'framer-motion';
import { useNetworkState } from '../hooks/useNetworkState';

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

const HospitalDashboard = () => {
  const { user, logout } = useAuth();
  const { isOnline } = useNetworkState();
  const { addToast } = useToast();
  const [socket, setSocket] = useState(null);
  const [emergencies, setEmergencies] = useState([]);
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

  const pendingEmergencies = emergencies.filter(e => e.status === 'PENDING');
  const incomingPatients = emergencies.filter(e => e.status !== 'PENDING');

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

  return (
    <div className="h-screen flex flex-col relative overflow-hidden bg-slate-950 selection:bg-blue-500/30">
      {!isOnline && (
        <div className="bg-red-600/90 backdrop-blur-md text-white text-center py-1.5 px-4 font-black uppercase tracking-widest text-[10px] shadow-lg animate-pulse z-[9999] relative border-b border-red-500">
          ⚠️ Rural Offline Mode Active - Using Local Network & Triangulation
        </div>
      )}
      <header className="premium-glass-nav p-4 flex justify-between items-center z-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/40 shadow-inner drop-shadow-md">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-sm">Hospital Command Center</h1>
            <p className="text-slate-400 text-xs flex items-center gap-2 font-medium mt-1">
              <Badge variant="primary" className="px-2 py-0.5 text-[10px]">Logged in as {user?.role.toUpperCase()}</Badge>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-slate-300">
                {isTracking ? <span className="relative flex h-2 w-2 mr-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span></span> : <MapPin size={12} className="text-slate-400"/>}
                {ownLocationName} {hospitalLocation ? `(${hospitalLocation.lat.toFixed(4)}, ${hospitalLocation.lng.toFixed(4)})` : ''}
              </span>
            </p>
          </div>
        </div>
        
        <div className="flex gap-8 items-center bg-slate-900/60 backdrop-blur-md p-2 px-8 rounded-2xl border border-white/10 shadow-inner">
          <div className="text-center">
            <div className="text-3xl font-black text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
              <AnimatedCounter to={emergencies.filter(e => e.status === 'PENDING').length} duration={1} />
            </div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Active Emergencies</div>
          </div>
          <div className="w-px h-10 bg-slate-700/50"></div>
          <div className="text-center">
            <div className="text-3xl font-black text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.3)]">
              <AnimatedCounter to={4} duration={1.5} />
            </div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Ambulances</div>
          </div>
          <div className="w-px h-10 bg-slate-700/50"></div>
          <div className="text-center">
            <div className="text-3xl font-black text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.3)]">
              <AnimatedCounter to={8} duration={2} />
            </div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Doctors</div>
          </div>
          <div className="w-px h-10 bg-slate-700/50"></div>
          <button onClick={() => setLowDataMode(!lowDataMode)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${lowDataMode ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}>{lowDataMode ? '⚡ 2G Mode On' : '⚡ 2G Mode'}</button>
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={logout} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">Sign Out</Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <aside className="w-[420px] premium-glass-panel rounded-none border-t-0 border-b-0 border-l-0 border-r-white/10 overflow-y-auto p-6 flex flex-col gap-6 z-10 custom-scrollbar bg-slate-900/80">
          <h2 className="text-xl font-black flex items-center gap-3 tracking-tight text-white">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-glow-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
            Emergency Queue
          </h2>
          
          {emergencies.length === 0 ? (
            <div className="text-center py-16 px-6 bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-3xl animate-fade-in-up shadow-inner">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500/40 drop-shadow-lg" />
              <p className="font-bold text-lg text-slate-200">No active emergencies</p>
              <p className="text-sm mt-2 text-slate-500 font-medium">The queue is clear.</p>
            </div>
          ) : (
            <motion.div 
              initial="hidden" 
              animate="show" 
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 }
                }
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
                  className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border-l-[4px] shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-l-red-500 border border-slate-700/50"
                >
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant={e.risk_level === 'CRITICAL' ? 'danger' : 'warning'} className="uppercase tracking-widest text-[10px]">
                      {e.risk_level}
                    </Badge>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-medium"><Clock size={12}/> <TimeAgo timestamp={e.created_at} /></span>
                  </div>
                  <p className="text-base font-bold mb-3 text-slate-200 leading-snug">{e.symptoms}</p>
                  <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5 mb-5 shadow-inner flex flex-col gap-2">
                    <p className="text-xs text-orange-400 flex items-center gap-2 font-medium leading-relaxed"><MapPin size={16} className="text-orange-500/70"/> {locations[e.id] || 'Loading location...'}</p>
                  </div>
                  
                  <Button 
                    variant="primary"
                    className="w-full bg-blue-600 hover:bg-blue-500 border-none shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:scale-105"
                    onClick={() => acceptEmergency(e.id)}
                  >
                    Accept & Dispatch
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          )}

          {incomingPatients.length > 0 && (
            <>
              <h2 className="text-xl font-black flex items-center gap-3 tracking-tight text-white mt-6">
                <span className="w-3 h-3 rounded-full bg-orange-500 animate-glow-pulse shadow-[0_0_10px_rgba(249,115,22,0.8)]"></span>
                Incoming Patients
              </h2>
              <div className="space-y-4">
                {incomingPatients.map((e) => (
                  <div key={e.id} className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border-l-[4px] shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-l-orange-500 border border-slate-700/50">
                    <div className="flex justify-between items-start mb-4">
                      <Badge variant="warning" className="uppercase tracking-widest text-[10px]">
                        <Truck size={12} className="inline mr-1" /> En Route
                      </Badge>
                    </div>
                    <p className="text-sm font-bold mb-3 text-orange-400 leading-snug">Target: {e.hospital_name}</p>
                    <p className="text-base font-bold mb-3 text-slate-200 leading-snug">{e.symptoms}</p>
                    
                    <div className="flex flex-col gap-3">
                      <Button 
                        variant="secondary"
                        className="w-full uppercase tracking-widest text-[10px] py-3 hover:scale-105 bg-orange-500/20 text-orange-400 border-orange-500/50 hover:bg-orange-500/40"
                        onClick={() => {
                          setSelectedEmergency(e);
                          setChecklist({ blood: false, bed: false, doctor: false, medicine: false });
                        }}
                      >
                        View Pre-Prep
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </aside>

        {/* Map */}
        <main className="flex-1 relative z-0">
          <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} className={lowDataMode ? 'bg-slate-900' : 'grayscale-[20%] contrast-110'}>
            {!lowDataMode && (
              <TileLayer
                url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                attribution='&copy; Google Maps'
              />
            )}
            <LiveMapUpdater defaultCenter={center} />
            
            {emergencies.map((e) => e.location && (
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
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(2,6,23,0.9)] z-[400]"></div>

          {/* Phase 5: Pre-Preparation Panel overlaying the map */}
          {selectedEmergency && (
            <div className="absolute top-6 right-[380px] w-[420px] max-h-[85vh] overflow-y-auto bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-[500] p-8 animate-fade-in-up custom-scrollbar">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-xl text-white flex items-center gap-3 tracking-tight">
                  <Activity className="text-blue-400" size={24} /> Pre-Arrival Prep
                </h3>
                <button onClick={() => setSelectedEmergency(null)} className="text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors">&times;</button>
              </div>

              {/* Patient Details */}
              <div className="bg-slate-950/60 rounded-2xl p-5 mb-8 border border-white/5 space-y-5 shadow-inner">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">Patient Details</p>
                  <p className="font-bold text-lg text-slate-200">{selectedEmergency.patient_name}, {selectedEmergency.patient_age} yrs</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">Blood Group</p>
                    <p className="font-black text-red-500 text-xl drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]">{selectedEmergency.blood_group}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">ETA</p>
                    <p className="font-black text-orange-400 text-xl animate-pulse">
                      {liveAmbulances[selectedEmergency.id] 
                        ? `~${liveAmbulances[selectedEmergency.id].eta_left} mins` 
                        : 'Calculating...'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">Medical History</p>
                  <p className="text-sm font-medium text-slate-300 leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5">{selectedEmergency.medical_history}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">Symptoms</p>
                  <p className="text-sm font-medium text-slate-300 leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5">{selectedEmergency.symptoms}</p>
                </div>
              </div>

              {/* Readiness Checklist */}
              <div className="mb-8">
                <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4 flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500"/> Readiness Checklist
                </p>
                <div className="space-y-3">
                  {[
                    { id: 'blood', label: 'Blood Arranged' },
                    { id: 'bed', label: 'Bed/OT Ready' },
                    { id: 'doctor', label: 'Doctor on Standby' },
                    { id: 'medicine', label: 'Medicines Ready' }
                  ].map(item => (
                    <label key={item.id} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${checklist[item.id] ? 'bg-green-500/10 border-green-500/30 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 text-slate-300 shadow-inner'}`}>
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded bg-slate-950 border-slate-600 text-green-500 focus:ring-green-500 focus:ring-offset-slate-900 cursor-pointer"
                        checked={checklist[item.id]}
                        onChange={(e) => setChecklist({...checklist, [item.id]: e.target.checked})}
                      />
                      <span className="font-bold text-sm tracking-wide">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status Banner */}
              {Object.values(checklist).every(Boolean) ? (
                <div className="bg-green-600 text-white font-black uppercase tracking-widest text-center py-5 rounded-2xl shadow-[0_0_30px_rgba(22,163,74,0.5)] animate-glow-pulse border border-green-400">
                  HOSPITAL READY FOR ARRIVAL
                </div>
              ) : (
                <div className="bg-slate-950 text-slate-500 font-bold uppercase tracking-widest text-center py-5 rounded-2xl border border-slate-800 shadow-inner">
                  AWAITING PREPARATION
                </div>
              )}
            </div>
          )}
        </main>
        
        {/* Right Sidebar - Hospital Resources */}
        <aside className="w-[350px] premium-glass-panel rounded-none border-t-0 border-b-0 border-r-0 border-l-white/10 overflow-y-auto p-6 flex flex-col gap-6 z-10 custom-scrollbar bg-slate-900/80 shrink-0">
          <h2 className="text-xl font-black flex items-center gap-3 tracking-tight text-white mb-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 animate-glow-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>
            Resources & Staff
          </h2>

          {/* Emergency Codes */}
          <div className="bg-slate-950/60 rounded-2xl p-5 border border-white/5 shadow-inner">
            <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3 flex items-center gap-2">
              <Radio size={14} className="text-red-400 animate-pulse"/> Broadcast Codes
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => addToast('CODE BLUE Broadcasted!', 'critical', 5000)} className="bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 text-blue-400 font-bold text-xs py-3 rounded-xl transition-all shadow-[0_0_10px_rgba(37,99,235,0.2)]">CODE BLUE</button>
              <button onClick={() => addToast('CODE RED Broadcasted!', 'critical', 5000)} className="bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 text-red-400 font-bold text-xs py-3 rounded-xl transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)]">CODE RED</button>
            </div>
          </div>

          {/* Bed Tracker */}
          <div className="bg-slate-950/60 rounded-2xl p-5 border border-white/5 shadow-inner">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-2">
                <Bed size={14} className="text-slate-400"/> Live Bed Status
              </h3>
              <button onClick={() => setIsEditingResources(true)} className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-500/40 font-bold uppercase">
                Edit
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] font-bold text-slate-300 mb-1">
                  <span>ICU BEDS</span>
                  <span className="text-red-400">{beds.icu.available} / {beds.icu.total} Available</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-red-500" style={{ width: `${((beds.icu.total - beds.icu.available) / Math.max(beds.icu.total, 1)) * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-bold text-slate-300 mb-1">
                  <span>OXYGEN BEDS</span>
                  <span className="text-orange-400">{beds.oxygen.available} / {beds.oxygen.total} Available</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-orange-500" style={{ width: `${((beds.oxygen.total - beds.oxygen.available) / Math.max(beds.oxygen.total, 1)) * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-bold text-slate-300 mb-1">
                  <span>GENERAL WARD</span>
                  <span className="text-green-400">{beds.general.available} / {beds.general.total} Available</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-green-500" style={{ width: `${((beds.general.total - beds.general.available) / Math.max(beds.general.total, 1)) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Staff Roster */}
          <div className="bg-slate-950/60 rounded-2xl p-5 border border-white/5 shadow-inner flex-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-2">
                <Users size={14} className="text-slate-400"/> On-Duty ER Staff
              </h3>
            </div>
            <div className="space-y-3">
              {staff.map((s, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-900/80 p-3 rounded-xl border border-slate-700/50">
                  <div>
                    <p className="text-xs font-bold text-slate-200">{s.name}</p>
                    <p className="text-[10px] text-slate-500">{s.role}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${s.color}`}>{s.status}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Edit Resources Modal */}
      {isEditingResources && (
        <div className="absolute inset-0 bg-black/80 z-[9999] flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Bed size={20} className="text-blue-400"/> Edit Hospital Resources</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">ICU Beds (Available / Total)</label>
                <div className="flex gap-2">
                  <input type="number" min="0" value={beds.icu.available} onChange={(e) => setBeds({...beds, icu: {...beds.icu, available: parseInt(e.target.value) || 0}})} className="w-1/2 bg-black/40 border border-white/10 p-3 rounded-xl text-white font-bold focus:border-blue-500 outline-none" />
                  <input type="number" min="0" value={beds.icu.total} onChange={(e) => setBeds({...beds, icu: {...beds.icu, total: parseInt(e.target.value) || 0}})} className="w-1/2 bg-black/40 border border-white/10 p-3 rounded-xl text-white font-bold focus:border-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Oxygen Beds (Available / Total)</label>
                <div className="flex gap-2">
                  <input type="number" min="0" value={beds.oxygen.available} onChange={(e) => setBeds({...beds, oxygen: {...beds.oxygen, available: parseInt(e.target.value) || 0}})} className="w-1/2 bg-black/40 border border-white/10 p-3 rounded-xl text-white font-bold focus:border-blue-500 outline-none" />
                  <input type="number" min="0" value={beds.oxygen.total} onChange={(e) => setBeds({...beds, oxygen: {...beds.oxygen, total: parseInt(e.target.value) || 0}})} className="w-1/2 bg-black/40 border border-white/10 p-3 rounded-xl text-white font-bold focus:border-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">General Beds (Available / Total)</label>
                <div className="flex gap-2">
                  <input type="number" min="0" value={beds.general.available} onChange={(e) => setBeds({...beds, general: {...beds.general, available: parseInt(e.target.value) || 0}})} className="w-1/2 bg-black/40 border border-white/10 p-3 rounded-xl text-white font-bold focus:border-blue-500 outline-none" />
                  <input type="number" min="0" value={beds.general.total} onChange={(e) => setBeds({...beds, general: {...beds.general, total: parseInt(e.target.value) || 0}})} className="w-1/2 bg-black/40 border border-white/10 p-3 rounded-xl text-white font-bold focus:border-blue-500 outline-none" />
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setIsEditingResources(false)} className="px-5 py-2.5 text-slate-400 hover:text-white font-bold text-sm transition-colors">Cancel</button>
              <button onClick={() => {
                localStorage.setItem('hospital_beds', JSON.stringify(beds));
                setIsEditingResources(false);
                addToast('Resources updated successfully', 'success', 3000);
              }} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-colors text-sm">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalDashboard;
