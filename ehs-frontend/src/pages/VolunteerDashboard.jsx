import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { io } from 'socket.io-client';
import { BACKEND_URL } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Users, MapPin, CheckCircle, Clock, AlertTriangle, ArrowRight, Award, Star, Shield, Medal, Trophy, Droplet, Search } from 'lucide-react';
import { useLocationName } from '../hooks/useLocationName';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { LiveMapUpdater } from '../hooks/LiveMapUpdater';
import { mockVolunteerTasks } from '../data/mockData';
import InteractiveCard from '../components/ui/InteractiveCard';
import MagneticButton from '../components/ui/MagneticButton';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import TimeAgo from '../components/ui/TimeAgo';
import { useNetworkState } from '../hooks/useNetworkState';
import localforage from 'localforage';

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


const VolunteerDashboard = () => {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const { isOnline } = useNetworkState();
  const [socket, setSocket] = useState(null);
  const [emergencies, setEmergencies] = useState([]);
  const [bloodRequests, setBloodRequests] = useState([]);
  const [bloodType, setBloodType] = useState('O+');
  const [units, setUnits] = useState(1);
  const [requested, setRequested] = useState(false);
  const [center, setCenter] = useState([17.3850, 78.4867]);
  const [lowDataMode, setLowDataMode] = useState(false); // Default Hyderabad
  const locationName = useLocationName();
  const { location: liveLocation, isTracking } = useLiveLocation();
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const cached = await localforage.getItem('volunteer_tasks');
        if (cached && cached.length > 0) {
          setTasks(cached);
        } else {
          setTasks(mockVolunteerTasks);
          await localforage.setItem('volunteer_tasks', mockVolunteerTasks);
        }
      } catch (e) {
        setTasks(mockVolunteerTasks);
      }
    };
    loadTasks();
  }, []);

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
    if (liveLocation) {
      setCenter([liveLocation.lat, liveLocation.lng]);
    }
  }, [liveLocation]);

  useEffect(() => {
    if (!isOnline) return;
    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('request_emergencies');
      newSocket.emit('request_blood_requests');
    });

    newSocket.on('update_emergencies', (data) => {
      const riskScore = { 'CRITICAL': 3, 'HIGH': 2, 'MEDIUM': 1, 'LOW': 0 };
      const sortedData = data.sort((a, b) => {
        const scoreA = riskScore[a.risk_level] || 0;
        const scoreB = riskScore[b.risk_level] || 0;
        if (scoreA !== scoreB) return scoreB - scoreA;
        return new Date(b.created_at) - new Date(a.created_at);
      });
      setEmergencies(sortedData);
      if (sortedData.length > 0 && sortedData[0].location) {
        setCenter([sortedData[0].location.lat, sortedData[0].location.lng]);
      }
    });

    newSocket.on('update_blood_requests', (data) => {
      setBloodRequests(data);
    });

    newSocket.on('new_blood_alert', (data) => {
      addToast(
        `URGENT: ${data.units} Unit(s) of ${data.blood_group} requested nearby!`, 
        'critical',
        10000
      );
    });

    newSocket.on('new_emergency_alert', (data) => {
      addToast(
        `DISPATCH ORDER: ${data.risk_level} emergency reported at ${data.locationName || 'Unknown Location'}. Symptoms: ${data.symptoms}`, 
        data.risk_level === 'CRITICAL' ? 'critical' : 'error',
        12000
      );
    });

    return () => newSocket.disconnect();
  }, [isOnline, addToast]);

  const acceptEmergency = (id) => {
    if (socket) {
      socket.emit('accept_emergency', {
        emergency_id: id,
        role: 'volunteer'
      });
    }
  };

  const handleBloodRequest = () => {
    if (socket) {
      socket.emit('new_blood_request', {
        patient_id: user?.id || 'guest',
        blood_group: bloodType,
        units_needed: units,
        location: liveLocation || { lat: center[0], lng: center[1] }
      });
      setRequested(true);
      setTimeout(() => setRequested(false), 5000);
    }
  };

  const acceptBloodRequest = (id) => {
    if (socket) {
      socket.emit('accept_blood_request', {
        request_id: id,
        donor_id: user?.id || 'volunteer'
      });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#0B1120] text-white overflow-hidden selection:bg-green-900/200/30">
      {!isOnline && (
        <div className="w-full bg-red-600 text-white text-xs font-black uppercase tracking-widest text-center py-2 animate-pulse z-[9999] relative">
          ⚠️ NO INTERNET CONNECTION - OFFLINE GPS TRACKING ACTIVE (COMMUNITY TASKS ONLY)
        </div>
      )}
      <header className="flex flex-col md:flex-row justify-between items-center bg-[#0B1120]/90 backdrop-blur-xl p-4 border-b border-white/10 z-10 gap-4 md:gap-0 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-green-900/20 flex items-center justify-center text-green-400 border border-green-800 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wider text-green-400">COMMUNITY FIRST RESPONDER</h1>
            <p className="text-slate-500 text-xs flex items-center gap-1 mt-1 font-medium">
              Logged in as {user?.role.toUpperCase()} <span className="text-slate-300">•</span>
              {isTracking ? <span className="relative flex h-2 w-2 mr-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-900/200"></span></span> : <MapPin size={10} className="text-slate-500"/>}
              {locationName} {liveLocation ? `(${liveLocation.lat.toFixed(4)}, ${liveLocation.lng.toFixed(4)})` : ''}
            </p>
          </div>
        </div>
        <button onClick={logout} className="px-5 py-2 text-red-400 hover:text-red-600 hover:bg-red-900/20 rounded-xl transition-all font-bold text-sm">Sign Out</button>
      </header>

      <div className="flex flex-col-reverse md:flex-row flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <aside className="w-full md:w-[450px] h-[50vh] md:h-full bg-[#131B2F] border border-white/5 md:border-r border-t md:border-t-0 border-white/10 overflow-y-auto p-4 md:p-6 flex flex-col gap-8 z-10 shadow-soft-lg custom-scrollbar shrink-0">
          
          {/* Live SOS Section */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-3 text-white">
              <span className="w-3 h-3 rounded-full bg-red-900/200 animate-pulse shadow-[0_0_15px_rgba(0,0,0,0.3)]"></span>
              Live SOS Alerts
              <span className="ml-auto bg-red-900/20 text-red-400 py-0.5 px-2 rounded-lg text-sm border border-red-800">{emergencies.filter(e => e.status === 'PENDING').length}</span>
            </h2>
            
            {emergencies.length === 0 ? (
              <div className="text-center py-8 px-6 bg-[#1e293b]/50 border border-white/5 rounded-2xl border-dashed border-white/10 text-slate-500 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-bold">No active emergencies nearby.</p>
                <p className="text-sm mt-1">Thank you for being on standby.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {emergencies.map((e) => (
                  <InteractiveCard 
                    key={e.id} 
                    glowColor={e.status === 'PENDING' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 0, 0, 0.05)'}
                    className={`p-5 flex flex-col transition-all animate-fade-in-up ${e.status === 'PENDING' ? 'bg-red-900/20 border border-red-800 shadow-[0_0_15px_rgba(0,0,0,0.3)]' : 'bg-[#131B2F] border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.3)]'}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg ${e.risk_level === 'CRITICAL' ? 'bg-red-900/200 text-white shadow-[0_0_15px_rgba(0,0,0,0.3)]' : 'bg-orange-500 text-white'}`}>
                        {e.risk_level} RISK
                      </span>
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><Clock size={12}/> <TimeAgo timestamp={e.created_at} /></span>
                    </div>
                    <p className="text-[15px] font-medium mb-3 leading-relaxed relative z-10 text-white">{e.symptoms}</p>
                    
                    {liveLocation && e.location && (
                      <div className="mb-4 text-xs font-bold text-blue-400 flex items-center gap-1">
                        <MapPin size={14} /> {calculateDistance(liveLocation.lat, liveLocation.lng, e.location.lat, e.location.lng)} km away from you
                      </div>
                    )}
                    
                    {e.status === 'PENDING' ? (
                      <MagneticButton 
                        variant="success"
                        size="md"
                        onClick={() => acceptEmergency(e.id)}
                        className="w-full py-3 text-sm tracking-widest shadow-[0_0_15px_rgba(0,0,0,0.3)] relative z-10 bg-green-900/200 hover:bg-green-600 text-white"
                      >
                        Accept & Provide Aid
                      </MagneticButton>
                    ) : (
                      <div className="w-full py-3 bg-[#1e293b]/50 border border-white/5 text-slate-300 border-white/10 rounded-xl text-xs font-bold tracking-widest uppercase text-center relative z-10 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
                        Accepted by {e.accepted_by || 'Responder'}
                      </div>
                    )}
                  </InteractiveCard>
                ))}
              </div>
            )}
          </section>

          <hr className="border-white/10" />

          {/* Skill Badges & Leaderboard */}
          <section>
             <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
               <Trophy className="text-yellow-400" />
               Impact & Badges
             </h2>
             <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-[#131B2F] border border-white/5 p-3 rounded-2xl flex flex-col items-center justify-center border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.3)] group hover:bg-yellow-900/20 transition-colors">
                   <Shield className="text-yellow-400 mb-2 group-hover:scale-110 transition-transform" size={24}/>
                   <span className="text-[10px] font-bold text-slate-300 text-center leading-tight">First Responder</span>
                </div>
                <div className="bg-[#131B2F] border border-white/5 p-3 rounded-2xl flex flex-col items-center justify-center border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.3)] group hover:bg-blue-900/20 transition-colors">
                   <Medal className="text-blue-400 mb-2 group-hover:scale-110 transition-transform" size={24}/>
                   <span className="text-[10px] font-bold text-slate-300 text-center leading-tight">CPR Certified</span>
                </div>
                <div className="bg-[#131B2F] border border-white/5 p-3 rounded-2xl flex flex-col items-center justify-center border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.3)] group hover:bg-green-900/20 transition-colors opacity-60 grayscale hover:grayscale-0">
                   <Star className="text-green-400 mb-2" size={24}/>
                   <span className="text-[10px] font-bold text-slate-500 text-center leading-tight">10+ Rescues</span>
                </div>
             </div>
             
             <div className="bg-[#1e293b]/50 border border-white/5 rounded-2xl border-white/10 p-4 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
                <div className="flex justify-between items-center mb-3">
                   <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Regional Rank</span>
                   <span className="text-sm font-black text-yellow-400">#4</span>
                </div>
                <div className="h-2 w-full bg-[#1e293b] rounded-full overflow-hidden">
                   <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 w-[75%] rounded-full shadow-[0_0_15px_rgba(0,0,0,0.3)]"></div>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 text-right">150 pts to Rank #3</p>
             </div>
          </section>

          <hr className="border-white/10" />

          {/* Community Tasks Section */}
          <section>
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                      <Clock size={20} className="text-green-500" />
                      Assigned Tasks
                      {!isOnline && <span className="ml-2 text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">Offline Cache</span>}
                    </h2>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                      {tasks.map((task, idx) => (
                <div key={task.id} className="bg-[#131B2F] border border-white/5 p-5 rounded-2xl border-l-4 border-l-green-500 hover:bg-[#1e293b]/50 border border-white/5 transition-colors group shadow-[0_0_15px_rgba(0,0,0,0.3)] border-t border-r border-b border-white/10">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-white group-hover:text-green-400 transition-colors">{task.title}</h3>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                      task.urgency === 'HIGH' ? 'bg-red-900/20 text-red-400 border border-red-800' : 
                      task.urgency === 'MEDIUM' ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-800' : 'bg-blue-900/20 text-blue-400 border border-blue-800'
                    }`}>
                      {task.urgency}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mb-4 line-clamp-2">{task.description}</p>
                  
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><MapPin size={12}/> {task.location} ({task.distance})</span>
                     <MagneticButton variant="success" size="sm" className="!py-1.5 !px-4 text-[10px] bg-green-900/200 hover:bg-green-600 text-white">Accept Task</MagneticButton>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-white/10" />

          {/* Blood Network Section */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
              <Droplet className="text-red-400" />
              Blood Network
            </h2>

            {/* Request Form */}
            <div className="bg-[#1e293b]/50 border border-white/5 p-5 rounded-2xl border-white/10 mb-6 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
              <h3 className="text-sm font-bold text-slate-200 mb-4">Request Blood</h3>
              <div className="flex gap-3 mb-4">
                <select 
                  value={bloodType} 
                  onChange={(e) => setBloodType(e.target.value)}
                  className="flex-1 bg-[#131B2F] border border-white/10 rounded-xl p-3 text-lg font-black text-red-400 focus:outline-none focus:border-red-300 shadow-[0_0_15px_rgba(0,0,0,0.3)]"
                >
                  {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <input 
                  type="number"
                  min="1"
                  max="10"
                  value={units}
                  onChange={(e) => setUnits(parseInt(e.target.value))}
                  className="w-20 bg-[#131B2F] border border-white/10 rounded-xl p-3 text-lg font-black text-white focus:outline-none focus:border-red-300 text-center shadow-[0_0_15px_rgba(0,0,0,0.3)]"
                />
              </div>
              {requested ? (
                <div className="text-center py-3 bg-red-900/20 text-red-600 border border-red-800 rounded-xl font-bold text-sm shadow-[0_0_15px_rgba(0,0,0,0.3)]">
                  <CheckCircle size={16} className="inline mr-2"/> Request Broadcasted
                </div>
              ) : (
                <MagneticButton 
                  variant="danger"
                  onClick={handleBloodRequest}
                  className="w-full py-3 bg-red-900/200 hover:bg-red-600 font-bold text-sm flex items-center justify-center gap-2 text-white shadow-[0_0_15px_rgba(0,0,0,0.3)]"
                >
                  <Search size={16}/> Broadcast Request
                </MagneticButton>
              )}
            </div>

            {/* Live Requests */}
            <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-900/200 animate-pulse"></span> Live Area Requests
            </h3>
            <div className="space-y-3">
              {bloodRequests.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No active requests.</p>
              ) : (
                bloodRequests.map(req => (
                  <div key={req.id} className="bg-[#131B2F] border border-white/5 p-4 rounded-xl border-l-4 border-l-red-500 border-t border-r border-b border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.3)] flex justify-between items-center">
                    <div>
                      <p className="font-bold text-red-600">{req.blood_group} <span className="text-slate-300">({req.units_needed} Unit{req.units_needed > 1 ? 's' : ''})</span></p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] text-slate-500"><TimeAgo timestamp={req.created_at} /></p>
                        {liveLocation && req.location && (
                          <p className="text-[10px] font-bold text-blue-400 flex items-center gap-1">
                            <MapPin size={10} /> {calculateDistance(liveLocation.lat, liveLocation.lng, req.location.lat, req.location.lng)} km
                          </p>
                        )}
                      </div>
                    </div>
                    {req.status === 'PENDING' ? (
                      <button onClick={() => acceptBloodRequest(req.id)} className="px-3 py-1.5 bg-red-900/200 text-white text-xs font-bold rounded-lg hover:bg-red-600 shadow-[0_0_15px_rgba(0,0,0,0.3)] transition-colors">
                        Donate
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-green-400 uppercase">Accepted</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

        </aside>

        {/* Map */}
        <main className="flex-1 relative z-0">
          <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} className={lowDataMode ? 'bg-slate-100' : ''}>
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
                  <div className="text-white font-medium">
                    <p className="font-bold text-red-600 mb-1">{e.risk_level} EMERGENCY</p>
                    <p className="text-sm mb-2">{e.symptoms}</p>
                    <p className="text-xs text-slate-500">Status: {e.status}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </main>
      </div>
    </div>
  );
};

export default VolunteerDashboard;
