import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { io } from 'socket.io-client';
import { BACKEND_URL } from '../services/api';
import { Truck, MapPin, Navigation, CheckCircle, Settings, Droplet, Battery, Activity, HeartPulse } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet-routing-machine';
import 'lrm-graphhopper';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useLocationName } from '../hooks/useLocationName';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { getLocationName } from '../services/geocoding';
import { LiveMapUpdater } from '../hooks/LiveMapUpdater';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ThemeToggle from '../components/ui/ThemeToggle';
import MagneticButton from '../components/ui/MagneticButton';
import AnimatedCounter from '../components/ui/AnimatedCounter';

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


// Component to handle Routing and Simulation
const LiveRouting = ({ start, end, isSimulating, onRouteCalculated, onLocationUpdate }) => {
  const map = useMap();
  const [routeCoords, setRouteCoords] = useState([]);
  const [totals, setTotals] = useState({ distance: 0, eta: 0 });

  useEffect(() => {
    if (!start || !end) return;

    const offlineRouter = {
      route: function(waypoints, callback, context, options) {
        const s = waypoints[0].latLng;
        const e = waypoints[1].latLng;
        const dist = map.distance(s, e);
        const time = (dist / 1000) * 2; // Assuming ~30km/h => 2 mins per km
        
        // Generate a few intermediate points for smooth simulation
        const steps = 10;
        const coords = [];
        for (let i = 0; i <= steps; i++) {
          coords.push(L.latLng(
            s.lat + (e.lat - s.lat) * (i / steps),
            s.lng + (e.lng - s.lng) * (i / steps)
          ));
        }

        callback.call(context || callback, null, [{
          name: 'Offline Triangulated Route',
          summary: { totalDistance: dist, totalTime: time * 60 },
          coordinates: coords,
          waypoints: waypoints
        }]);
      }
    };

    const routingConfig = {
      waypoints: [
        L.latLng(start[0], start[1]),
        L.latLng(end.lat, end.lng)
      ],
      routeWhileDragging: false,
      showAlternatives: false,
      addWaypoints: false,
      fitSelectedRoutes: true,
      createMarker: () => null, // We draw our own markers
      lineOptions: {
        styles: [{ color: navigator.onLine ? '#f97316' : '#ef4444', weight: 6, opacity: 0.8, dashArray: navigator.onLine ? '' : '10, 10' }]
      },
      show: false // hide instructions panel
    };

    if (!navigator.onLine) {
      routingConfig.router = offlineRouter;
    }

    const control = L.Routing.control(routingConfig).addTo(map);

    control.on('routesfound', function (e) {
      const routes = e.routes;
      const summary = routes[0].summary;
      const dist = (summary.totalDistance / 1000).toFixed(1);
      const time = Math.round(summary.totalTime / 60);
      
      setTotals({ distance: dist, eta: time });
      setRouteCoords(routes[0].coordinates);
      
      onRouteCalculated({
        distance: dist,
        eta: time
      });
    });

    return () => {
      if (control) {
        map.removeControl(control);
      }
    };
  }, [map, start, end]);

  useEffect(() => {
    if (isSimulating && routeCoords.length > 0) {
      let step = 0;
      const interval = setInterval(() => {
        if (step >= routeCoords.length) {
          clearInterval(interval);
          return;
        }
        const currentCoord = routeCoords[step];
        const progress = step / routeCoords.length;
        const distLeft = (totals.distance * (1 - progress)).toFixed(1);
        const etaLeft = Math.round(totals.eta * (1 - progress));

        onLocationUpdate({
           lat: currentCoord.lat,
           lng: currentCoord.lng,
           distance: distLeft,
           eta: etaLeft
        });
        
        step += 5; // skip frames to drive faster in demo
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isSimulating, routeCoords, totals]);

  return null;
};


const AmbulanceDashboard = () => {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const { isOnline } = useNetworkState();
  const [socket, setSocket] = useState(null);
  const [emergencies, setEmergencies] = useState([]);
  const [locations, setLocations] = useState({});
  const ownLocationName = useLocationName();
  const { location: liveLocation, isTracking } = useLiveLocation();
  const [center, setCenter] = useState([17.3850, 78.4867]);
  const [lowDataMode, setLowDataMode] = useState(false);

  const [routeData, setRouteData] = useState({ distance: '...', eta: '...' });
  const [dqnData, setDqnData] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [liveAmbulanceLocation, setLiveAmbulanceLocation] = useState(null);

  const [vehicleStatus, setVehicleStatus] = useState(() => JSON.parse(localStorage.getItem('ambulance_status')) || {
    fuel: 78,
    oxygen: 45
  });
  const [isEditingStatus, setIsEditingStatus] = useState(false);

  const [tripPhase, setTripPhase] = useState('to_patient'); // 'to_patient' | 'to_hospital'

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;  
    const dLon = (lon2 - lon1) * Math.PI / 180; 
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return (R * c).toFixed(1);
  };

  // Update center to live location if not simulating
  useEffect(() => {
    if (liveLocation && !isSimulating) {
      setCenter([liveLocation.lat, liveLocation.lng]);
    }
  }, [liveLocation, isSimulating]);


  useEffect(() => {
    const fetchDqnData = async () => {
      try {
        const res = await api.get('/ml/route');
        setDqnData(res.data);
      } catch (err) {
        console.error("Failed to load DQN data", err);
      }
    };
    fetchDqnData();
  }, []);

  useEffect(() => {
    if (!isOnline) return;
    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('request_emergencies');
    });

    newSocket.on('update_emergencies', (data) => {
      const filteredData = data.filter(e => e.symptoms !== 'Test Emergency');
      setEmergencies(filteredData);
      if (filteredData.length > 0 && filteredData[0].location && !isSimulating) {
        // slightly offset ambulance start position for demo purposes
        setCenter([filteredData[0].location.lat - 0.05, filteredData[0].location.lng - 0.05]);
      }
    });

    newSocket.on('new_emergency_alert', (data) => {
      addToast(
        `DISPATCH ORDER: ${data.risk_level} emergency reported at ${data.locationName || 'Unknown Location'}. Symptoms: ${data.symptoms}`, 
        data.risk_level === 'CRITICAL' ? 'critical' : 'error',
        12000
      );
    });

    newSocket.on('new_patient_registered', (data) => {
      addToast(
        `NEW PATIENT REGISTRATION: ${data.name} (${data.risk_level} Risk)`, 
        'info',
        8000
      );
    });

    return () => newSocket.disconnect();
  }, [addToast, isSimulating]);

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
        role: 'ambulance'
      });
      setIsSimulating(true);
      setTripPhase('to_patient');
    }
  };

  const finishTrip = () => {
     setTripPhase('to_patient');
     setIsSimulating(false);
     setLiveAmbulanceLocation(null);
     addToast('Patient safely delivered to hospital!', 'success', 5000);
     // Optionally reload or reset state
     setTimeout(() => window.location.reload(), 2000);
  };

  const activeEmergency = emergencies.find(e => e.status === 'PENDING') || null;
  const acceptedEmergency = emergencies.find(e => e.accepted_by === 'ambulance') || null;
  const displayEmergency = acceptedEmergency || activeEmergency;

  const handleRouteCalculated = (data) => {
    setRouteData(data);
  };

  const handleLocationUpdate = (coords) => {
    setLiveAmbulanceLocation(coords);
    setRouteData({ distance: coords.distance, eta: coords.eta });
    // Emit to backend so Hospital and Patient can see it
    if (socket && displayEmergency) {
       socket.emit('ambulance_location_update', {
          emergency_id: displayEmergency.id,
          lat: coords.lat,
          lng: coords.lng,
          distance_left: coords.distance,
          eta_left: coords.eta
       });
    }
  };

  return (
    <div className="h-screen flex flex-col relative overflow-hidden bg-slate-950 selection:bg-blue-500/30">
      {!isOnline && (
        <div className="bg-red-600/90 backdrop-blur-md text-white text-center py-1.5 px-4 font-black uppercase tracking-widest text-[10px] shadow-lg animate-pulse z-[9999] relative border-b border-red-500">
          ⚠️ Rural Offline Mode Active - Using Satellite Triangulation
        </div>
      )}
      
      {/* Premium Header */}
      <header className="premium-glass-nav p-4 flex justify-between items-center z-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-400 border border-orange-500/40 shadow-inner drop-shadow-md">
            <Truck size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-widest text-orange-400 drop-shadow-sm">Ambulance Panel</h1>
            <p className="text-slate-400 text-xs flex items-center gap-2 font-medium mt-1">
              <Badge variant="warning" className="px-2 py-0.5 text-[10px]">Logged in as {user?.role.toUpperCase()}</Badge>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-slate-300">
                {isTracking ? <span className="relative flex h-2 w-2 mr-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span></span> : <MapPin size={12} className="text-slate-400"/>}
                {ownLocationName} {liveLocation ? `(${liveLocation.lat.toFixed(4)}, ${liveLocation.lng.toFixed(4)})` : ''}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setLowDataMode(!lowDataMode)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${lowDataMode ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}>{lowDataMode ? '⚡ 2G Mode On' : '⚡ 2G Mode'}</button>
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={logout} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">Sign Out</Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <aside className="w-[450px] premium-glass-panel rounded-none border-t-0 border-b-0 border-l-0 border-r-white/10 overflow-y-auto p-8 flex flex-col gap-6 z-10 custom-scrollbar bg-slate-900/80">
          <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight text-white">
            <span className="w-3 h-3 rounded-full bg-orange-500 animate-glow-pulse shadow-[0_0_10px_rgba(249,115,22,0.8)]"></span>
            Dispatch Orders
          </h2>
          
          {!displayEmergency ? (
             <div className="text-center p-12 bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-3xl h-full flex flex-col items-center justify-center animate-fade-in-up shadow-inner">
               <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20 mb-6 drop-shadow-lg">
                 <CheckCircle className="w-12 h-12 text-green-500/50 animate-pulse-slow" />
               </div>
               <p className="text-2xl font-black text-slate-200 uppercase tracking-wider">Standby Mode</p>
               <p className="text-sm mt-3 text-slate-400 font-medium leading-relaxed">No active emergencies in your assigned sector.</p>
             </div>
          ) : (
            <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden animate-fade-in-up shadow-2xl">
              {displayEmergency.status === 'PENDING' && (
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse shadow-[0_0_20px_rgba(239,68,68,1)]"></div>
              )}
              
              {/* Rapido-style Header */}
              <div className="flex justify-between items-center mb-6 pb-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border shadow-inner ${displayEmergency.status === 'PENDING' ? 'bg-red-500/20 border-red-500/50 animate-pulse text-red-500' : 'bg-green-500/20 border-green-500/50 text-green-500'}`}>
                    {displayEmergency.status === 'PENDING' ? <Activity size={24} /> : <CheckCircle size={24} />}
                  </div>
                  <div>
                    <p className={`font-black tracking-widest text-sm uppercase ${displayEmergency.status === 'PENDING' ? 'text-red-500' : 'text-green-500'}`}>
                      {displayEmergency.status === 'PENDING' ? 'NEW DISPATCH' : 'EN ROUTE'}
                    </p>
                    <p className="text-slate-400 text-[10px] font-bold uppercase">{displayEmergency.risk_level} SEVERITY</p>
                  </div>
                </div>
                <div className="text-right bg-slate-950/50 px-4 py-2 rounded-xl border border-white/5 shadow-inner">
                  <p className="text-3xl font-black text-white">{displayEmergency.status === 'PENDING' ? calculateDistance(center[0], center[1], displayEmergency.location?.lat, displayEmergency.location?.lng) : routeData.distance} <span className="text-sm text-slate-500">km</span></p>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{displayEmergency.status === 'PENDING' ? 'Away from you' : 'To Target'}</p>
                </div>
              </div>

              {/* Trip Details (Pickup -> Drop) */}
              <div className="mb-6 relative">
                <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-slate-700/50"></div>
                
                {/* Pickup Point */}
                <div className="flex items-start gap-4 mb-6 relative">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 border-2 border-orange-500 flex items-center justify-center z-10 shrink-0 mt-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                  </div>
                  <div className="flex-1 bg-slate-950/50 border border-white/5 p-4 rounded-2xl shadow-inner">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Pickup Location</p>
                    <p className="text-sm font-bold text-slate-200">{locations[displayEmergency.id] || 'Loading location...'}</p>
                  </div>
                </div>
                
                {/* Drop Point */}
                <div className="flex items-start gap-4 relative">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center z-10 shrink-0 mt-1">
                    <MapPin size={14} className="text-green-500" />
                  </div>
                  <div className="flex-1 bg-slate-950/50 border border-white/5 p-4 rounded-2xl shadow-inner">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Destination Hospital</p>
                    <p className="text-sm font-bold text-green-400">{displayEmergency.hospital_name || 'Nearest Available Facility'}</p>
                    {displayEmergency.hospital_name && (
                       <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><CheckCircle size={12}/> Automatically Assigned</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Patient Info */}
              <div className="bg-slate-950/30 rounded-2xl p-4 border border-white/5 mb-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center shrink-0 border border-slate-700">
                  <span className="font-black text-slate-400">ID</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 font-bold uppercase">Patient Code</p>
                  <p className="text-sm font-bold text-slate-200 font-mono">{displayEmergency.patient_id.substring(0, 8).toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Symptoms</p>
                  <Badge variant="warning" className="text-[10px]">{displayEmergency.symptoms.substring(0,20)}...</Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                {displayEmergency.status === 'PENDING' ? (
                  <MagneticButton 
                    variant="danger"
                    size="lg"
                    onClick={() => acceptEmergency(displayEmergency.id)}
                    className="flex-1 py-5 bg-red-600 hover:bg-red-500 border-red-500 text-lg uppercase tracking-widest text-white shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-glow-pulse"
                  >
                    ACCEPT DISPATCH
                  </MagneticButton>
                ) : tripPhase === 'to_patient' ? (
                  <div className="flex-1 flex flex-col gap-4">
                    <Button 
                      variant="primary" 
                      className="w-full py-5 text-lg font-black uppercase tracking-widest bg-orange-600 hover:bg-orange-500 shadow-[0_0_20px_rgba(234,88,12,0.4)] animate-glow-pulse"
                      onClick={() => setTripPhase('to_hospital')}
                    >
                      MARK PATIENT PICKED UP (SLIDE)
                    </Button>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="bg-green-500/10 border border-green-500/30 p-5 rounded-2xl shadow-inner">
                      <p className="text-[10px] text-green-400 uppercase tracking-widest font-bold mb-2 flex items-center gap-2"><CheckCircle size={14}/> Hospital ER Details</p>
                      <p className="text-xl font-black text-slate-200 mb-1">{displayEmergency.hospital_name || 'Apollo City Hospital'}</p>
                      <p className="text-sm font-medium text-slate-400 mb-4">Level 1 Trauma Center • ER Bay 4</p>
                      
                      <div className="flex gap-3 mb-4">
                        <div className="flex-1 bg-slate-900/50 p-2 rounded-lg text-center border border-white/5">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Contact</p>
                          <p className="text-sm font-bold text-slate-300">1-800-ER-DESK</p>
                        </div>
                        <div className="flex-1 bg-slate-900/50 p-2 rounded-lg text-center border border-white/5">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Status</p>
                          <p className="text-sm font-bold text-green-400">BED READY</p>
                        </div>
                      </div>
                      
                      <Button 
                        variant="success" 
                        className="w-full py-4 text-sm font-black uppercase tracking-widest bg-green-600 hover:bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                        onClick={() => finishTrip()}
                      >
                        PATIENT DELIVERED & COMPLETE TRIP
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DQN Routing Data */}
          {dqnData && (
            <div className="bg-slate-900/80 border border-orange-500/30 rounded-3xl p-6 mt-6 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold flex items-center gap-2 text-orange-400">
                  <Navigation size={18} className="animate-pulse" /> DQN Smart Routing Active
                </h3>
                <Badge variant="warning">RL Optimized</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5 text-center">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Standard ETA</p>
                  <p className="text-xl font-black text-slate-500 line-through">{dqnData.standard_route_eta}m</p>
                </div>
                <div className="bg-orange-500/10 p-3 rounded-xl border border-orange-500/20 text-center">
                  <p className="text-[10px] text-orange-400 uppercase tracking-widest font-bold mb-1">DQN Optimized ETA</p>
                  <p className="text-2xl font-black text-orange-400">{dqnData.dqn_optimized_eta}m</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 text-center flex items-center justify-center gap-2 font-medium">
                <CheckCircle size={14} className="text-green-400" /> Time saved: <span className="text-green-400 font-bold">{dqnData.efficiency_gain}</span>
              </p>
            </div>
          )}

          {/* Vehicle Status Widget */}
          <div className="bg-slate-900/80 border border-slate-700/50 rounded-3xl p-6 mt-6 shadow-inner shrink-0">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold flex items-center gap-2 text-slate-200 uppercase tracking-widest text-xs">
                <Settings size={16} className="text-slate-400" /> Vehicle Status
              </h3>
              <button onClick={() => setIsEditingStatus(true)} className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-1 rounded hover:bg-orange-500/40 font-bold uppercase">
                Edit
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 mb-1">
                  <span className="flex items-center gap-1"><Droplet size={12}/> Fuel Level</span>
                  <span>{vehicleStatus.fuel}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-green-500" style={{ width: `${vehicleStatus.fuel}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 mb-1">
                  <span className="flex items-center gap-1"><Battery size={12}/> Oxygen Supply</span>
                  <span className="text-orange-400">{vehicleStatus.oxygen}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-orange-500" style={{ width: `${vehicleStatus.oxygen}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Patient Vitals Sync Panel */}
          {displayEmergency && displayEmergency.status !== 'PENDING' && (
            <div className="bg-slate-900/80 border border-red-500/30 rounded-3xl p-6 mt-6 shadow-[0_0_20px_rgba(239,68,68,0.1)] relative overflow-hidden shrink-0">
              <div className="absolute top-4 right-4">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              </div>
              <h3 className="font-bold flex items-center gap-2 text-red-400 mb-4 uppercase tracking-widest text-xs">
                <Activity size={16} className="animate-pulse" /> Live Vitals Sync
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 text-center shadow-inner">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 flex items-center justify-center gap-1"><HeartPulse size={12} className="text-red-500"/> Heart Rate</p>
                  <p className="text-2xl font-black text-slate-200">98 <span className="text-sm text-slate-500 font-medium">bpm</span></p>
                </div>
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 text-center shadow-inner">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">SpO2</p>
                  <p className="text-2xl font-black text-slate-200">94 <span className="text-sm text-slate-500 font-medium">%</span></p>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Map */}
        <main className="flex-1 relative z-0">
          <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} className={lowDataMode ? 'bg-slate-900' : 'grayscale-[20%] contrast-110'}>
            {!lowDataMode && <TileLayer url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" attribution="&copy; Google Maps" />}
            {!displayEmergency && <LiveMapUpdater defaultCenter={center} />}
            
            {displayEmergency && displayEmergency.location && (
              <>
                {/* Emergency Location Marker */}
                <Marker position={[displayEmergency.location.lat, displayEmergency.location.lng]} icon={redIcon}>
                  <Popup className="custom-popup">
                    <div className="font-bold text-slate-900 p-2 text-sm">Patient: {locations[displayEmergency.id]}</div>
                  </Popup>
                </Marker>

                {/* Destination Hospital Marker */}
                {displayEmergency.hospital_location && (
                  <Marker position={[displayEmergency.hospital_location.lat, displayEmergency.hospital_location.lng]} icon={hospitalIcon}>
                    <Popup className="custom-popup">
                      <div className="font-bold text-slate-900 p-2 text-sm">Target Hospital: {displayEmergency.hospital_name}</div>
                    </Popup>
                  </Marker>
                )}

                {/* Live Routing & Simulation */}
                <LiveRouting 
                   start={center} 
                   end={tripPhase === 'to_patient' ? displayEmergency.location : (displayEmergency.hospital_location || displayEmergency.location)} 
                   isSimulating={isSimulating}
                   onRouteCalculated={handleRouteCalculated}
                   onLocationUpdate={handleLocationUpdate}
                />

                {/* Moving Ambulance Marker */}
                {liveAmbulanceLocation ? (
                  <Marker position={[liveAmbulanceLocation.lat, liveAmbulanceLocation.lng]} icon={ambulanceIcon} zIndexOffset={1000}>
                    <Popup className="custom-popup">
                      <div className="font-bold text-slate-900 p-2 text-sm">Ambulance (You)</div>
                    </Popup>
                  </Marker>
                ) : (
                  <Marker position={center} icon={ambulanceIcon} zIndexOffset={1000}>
                    <Popup className="custom-popup">
                      <div className="font-bold text-slate-900 p-2 text-sm">Ambulance Start Point</div>
                    </Popup>
                  </Marker>
                )}
              </>
            )}
          </MapContainer>
          
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(2,6,23,0.9)] z-[400]"></div>
        </main>
      </div>

      {/* Edit Vehicle Status Modal */}
      {isEditingStatus && (
        <div className="absolute inset-0 bg-black/80 z-[9999] flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Truck size={20} className="text-orange-400"/> Edit Vehicle Status</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Fuel Level (%)</label>
                <input type="number" min="0" max="100" value={vehicleStatus.fuel} onChange={(e) => setVehicleStatus({...vehicleStatus, fuel: parseInt(e.target.value) || 0})} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white font-bold focus:border-orange-500 outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Oxygen Supply (%)</label>
                <input type="number" min="0" max="100" value={vehicleStatus.oxygen} onChange={(e) => setVehicleStatus({...vehicleStatus, oxygen: parseInt(e.target.value) || 0})} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white font-bold focus:border-orange-500 outline-none" />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setIsEditingStatus(false)} className="px-5 py-2.5 text-slate-400 hover:text-white font-bold text-sm transition-colors">Cancel</button>
              <button onClick={() => {
                localStorage.setItem('ambulance_status', JSON.stringify(vehicleStatus));
                setIsEditingStatus(false);
                addToast('Vehicle status updated successfully', 'success', 3000);
              }} className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold shadow-[0_0_15px_rgba(234,88,12,0.4)] transition-colors text-sm">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AmbulanceDashboard;
