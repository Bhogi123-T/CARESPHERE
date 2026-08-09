import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { io } from 'socket.io-client';
import { BACKEND_URL } from '../services/api';
import { Truck, MapPin, Navigation, CheckCircle, Settings, Droplet, Battery, Activity, HeartPulse, AlertCircle } from 'lucide-react';
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
import PremiumCard from '../components/ui/PremiumCard';

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

  // AI Routing Simulation States
  const [roadblockDetected, setRoadblockDetected] = useState(false);
  const [isRerouting, setIsRerouting] = useState(false);

  useEffect(() => {
    if (isSimulating && tripPhase === 'to_patient') {
      const timer = setTimeout(() => {
        setRoadblockDetected(true);
        setIsRerouting(true);
        setTimeout(() => setIsRerouting(false), 4000);
      }, 6000);
      return () => clearTimeout(timer);
    } else {
      setRoadblockDetected(false);
      setIsRerouting(false);
    }
  }, [isSimulating, tripPhase]);

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
      const riskScore = { 'CRITICAL': 3, 'HIGH': 2, 'MEDIUM': 1, 'LOW': 0 };
      const sortedData = filteredData.sort((a, b) => {
        const scoreA = riskScore[a.risk_level] || 0;
        const scoreB = riskScore[b.risk_level] || 0;
        if (scoreA !== scoreB) return scoreB - scoreA;
        return new Date(b.created_at) - new Date(a.created_at);
      });
      setEmergencies(sortedData);
      if (sortedData.length > 0 && sortedData[0].location && !isSimulating) {
        setCenter([sortedData[0].location.lat - 0.05, sortedData[0].location.lng - 0.05]);
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
    <div className="h-screen flex flex-col relative overflow-hidden bg-slate-950 selection:bg-blue-500/30 text-slate-200">
      
      {/* Premium Ambient Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-red-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      
      {!isOnline && (
        <div className="bg-red-600/90 backdrop-blur-md text-white text-center py-1.5 px-4 font-black uppercase tracking-widest text-[10px] shadow-sm animate-pulse z-[9999] relative border-b border-red-500">
          ⚠️ Rural Offline Mode Active - Using Satellite Triangulation
        </div>
      )}
      
      {/* Premium Header */}
      <header className="bg-[#0f172a]/90 backdrop-blur-xl border-white/10 backdrop-blur-xl border-b border-white/10 shadow-sm p-4 flex flex-col md:flex-row justify-between items-center z-50 gap-4 md:gap-0 transition-colors duration-300">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-800 shadow-sm drop-shadow-sm">
            <Truck size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 drop-shadow-sm">Ambulance Panel</h1>
            <p className="text-slate-400 text-xs flex items-center gap-2 font-medium mt-1">
              <Badge variant="warning" className="px-2 py-0.5 text-[10px] dark:bg-orange-900/50 dark:text-orange-300">Logged in as {user?.role.toUpperCase()}</Badge>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="flex items-center gap-1 text-slate-400">
                {isTracking ? <span className="relative flex h-2 w-2 mr-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 dark:bg-orange-500 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500 dark:bg-orange-400"></span></span> : <MapPin size={12} className="text-slate-500"/>}
                {ownLocationName} {liveLocation ? `(${liveLocation.lat.toFixed(4)}, ${liveLocation.lng.toFixed(4)})` : ''}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <button onClick={() => setLowDataMode(!lowDataMode)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors shadow-sm ${lowDataMode ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800' : 'bg-[#1e293b] border-white/5 text-slate-300 border-white/10 hover:text-slate-800 dark:hover:text-white'}`}>{lowDataMode ? '⚡ 2G Mode On' : '⚡ 2G Mode'}</button>
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={logout} className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30">Sign Out</Button>
        </div>
      </header>

      <div className="flex flex-col-reverse md:flex-row flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <aside className="w-full md:w-[450px] h-[50vh] md:h-full premium-glass-panel bg-slate-900/90 rounded-none border-t md:border-t-0 md:border-r border-slate-800 overflow-y-auto p-4 md:p-6 flex flex-col gap-6 z-10 custom-scrollbar relative shrink-0 transition-colors duration-300">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-100">
            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm"></span>
            Dispatch Console
          </h2>
          
          {!displayEmergency ? (
             <PremiumCard className="text-center p-12 h-full flex flex-col items-center justify-center bg-slate-800/80 border-slate-700/50">
               <div className="w-24 h-24 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center border border-green-100 dark:border-green-800 mb-6 drop-shadow-sm">
                 <CheckCircle className="w-12 h-12 text-green-400 dark:text-green-500 animate-pulse-slow" />
               </div>
               <p className="text-2xl font-black text-slate-200 uppercase tracking-wider">Standby Mode</p>
               <p className="text-sm mt-3 text-slate-400 font-medium leading-relaxed">No active emergencies in your assigned sector.</p>
             </PremiumCard>
          ) : (
            <PremiumCard className="bg-slate-800/80 border-slate-700/50 p-5">
              {displayEmergency.status === 'PENDING' && (
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
              )}
              
              {/* Header */}
              <div className="flex justify-between items-center mb-5 pb-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border shadow-sm ${displayEmergency.status === 'PENDING' ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-500 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-500 dark:text-green-400'}`}>
                    {displayEmergency.status === 'PENDING' ? <Activity size={20} /> : <CheckCircle size={20} />}
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${displayEmergency.status === 'PENDING' ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {displayEmergency.status === 'PENDING' ? 'New Dispatch' : 'En Route'}
                    </p>
                    <p className="text-slate-400 text-xs font-medium">{displayEmergency.risk_level} Severity</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{displayEmergency.status === 'PENDING' ? calculateDistance(center[0], center[1], displayEmergency.location?.lat, displayEmergency.location?.lng) : routeData.distance} <span className="text-sm text-slate-400 font-normal">km</span></p>
                  <p className="text-slate-400 text-xs">{displayEmergency.status === 'PENDING' ? 'Away from you' : 'To Target'}</p>
                </div>
              </div>

              {/* Trip Details (Pickup -> Drop) */}
              <div className="mb-6 relative">
                <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-slate-200 dark:bg-slate-700"></div>
                
                {/* Pickup Point */}
                <div className="flex items-start gap-4 mb-6 relative">
                  <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/30 border-2 border-orange-400 dark:border-orange-500 flex items-center justify-center z-10 shrink-0 mt-1 shadow-sm">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                  </div>
                  <div className="flex-1 bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 p-4 rounded-2xl shadow-sm">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Pickup Location</p>
                    <p className="text-sm font-bold text-slate-100">{locations[displayEmergency.id] || 'Loading location...'}</p>
                  </div>
                </div>
                
                {/* Drop Point */}
                <div className="flex items-start gap-4 relative">
                  <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/30 border-2 border-green-400 dark:border-green-500 flex items-center justify-center z-10 shrink-0 mt-1 shadow-sm">
                    <MapPin size={14} className="text-green-500" />
                  </div>
                  <div className="flex-1 bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 p-4 rounded-2xl shadow-sm">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Destination Hospital</p>
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">{displayEmergency.hospital_name || 'Nearest Available Facility'}</p>
                    {displayEmergency.hospital_name && (
                       <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><CheckCircle size={12}/> Automatically Assigned</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Patient Info */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-600 mb-6 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 bg-[#1e293b] border-white/5 rounded-full flex items-center justify-center shrink-0 border border-white/10 shadow-sm">
                  <span className="font-black text-slate-400">ID</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-400 font-bold uppercase">Patient Code</p>
                  <p className="text-sm font-bold text-slate-100 font-mono">{displayEmergency.patient_id.substring(0, 8).toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">Symptoms</p>
                  <Badge variant="warning" className="text-[10px] bg-orange-50 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50">{displayEmergency.symptoms.substring(0,20)}...</Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 mt-6">
                {displayEmergency.status === 'PENDING' ? (
                  <MagneticButton className="flex-1">
                    <Button 
                      variant="danger"
                      onClick={() => acceptEmergency(displayEmergency.id)}
                      className="w-full py-3 bg-red-500 hover:bg-red-600 text-sm font-bold text-white transition-colors shadow-sm rounded-xl"
                    >
                      Accept Dispatch
                    </Button>
                  </MagneticButton>
                ) : tripPhase === 'to_patient' ? (
                  <div className="flex-1 flex flex-col gap-4">
                    <MagneticButton>
                      <Button 
                        variant="primary" 
                        className="w-full py-3 text-sm font-bold bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm text-white rounded-xl"
                        onClick={() => setTripPhase('to_hospital')}
                      >
                        Mark Patient Picked Up
                      </Button>
                    </MagneticButton>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-5 rounded-2xl shadow-sm">
                      <p className="text-[10px] text-green-600 dark:text-green-400 uppercase tracking-widest font-bold mb-2 flex items-center gap-2"><CheckCircle size={14}/> Hospital ER Details</p>
                      <p className="text-xl font-black text-slate-100 mb-1">{displayEmergency.hospital_name || 'Apollo City Hospital'}</p>
                      <p className="text-sm font-medium text-slate-400 mb-4">Level 1 Trauma Center • ER Bay 4</p>
                      
                      <div className="flex gap-3 mb-4">
                        <div className="flex-1 bg-[#1e293b] border-white/5 p-2 rounded-lg text-center border border-white/10 shadow-sm">
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Contact</p>
                          <p className="text-sm font-bold text-slate-300">1-800-ER-DESK</p>
                        </div>
                        <div className="flex-1 bg-[#1e293b] border-white/5 p-2 rounded-lg text-center border border-white/10 shadow-sm">
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Status</p>
                          <p className="text-sm font-bold text-green-500 dark:text-green-400">BED READY</p>
                        </div>
                      </div>
                      <MagneticButton>
                        <Button 
                          variant="success" 
                          className="w-full py-4 text-sm font-black uppercase tracking-widest bg-green-600 hover:bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)] text-white"
                          onClick={() => finishTrip()}
                        >
                          PATIENT DELIVERED & COMPLETE TRIP
                        </Button>
                      </MagneticButton>
                    </div>
                  </div>
                )}
              </div>
            </PremiumCard>
          )}

          {/* Enhanced DQN Indicator in Sidebar */}
          {dqnData && displayEmergency && (
            <PremiumCard className="p-4 mt-4 relative shrink-0 shadow-sm bg-slate-800/80 border-slate-700/50">
              <div className="absolute top-4 right-4 flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </div>
              <h3 className="font-bold flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm">
                <Navigation size={16} /> Traffic Analysis Active
              </h3>
              <p className="text-xs text-slate-400 mt-1">Routing optimized by telemetry data.</p>
            </PremiumCard>
          )}

          {/* Vehicle Status Widget */}
          <div className="bg-[#1e293b] border-white/5 border border-white/10 rounded-xl p-5 mt-4 shrink-0 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold flex items-center gap-2 text-slate-100 text-sm">
                <Settings size={16} className="text-slate-400" /> Vehicle Status
              </h3>
              <button onClick={() => setIsEditingStatus(true)} className="text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium underline">
                Configure
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span className="flex items-center gap-1"><Droplet size={12}/> Fuel Level</span>
                  <span>{vehicleStatus.fuel}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${vehicleStatus.fuel}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span className="flex items-center gap-1"><Battery size={12}/> Oxygen Supply</span>
                  <span className="text-blue-500 dark:text-blue-400">{vehicleStatus.oxygen}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${vehicleStatus.oxygen}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Patient Vitals Sync Panel */}
          {displayEmergency && displayEmergency.status !== 'PENDING' && (
            <div className="bg-[#1e293b]/50 backdrop-blur-md border-white/5 border border-white/10 rounded-xl p-5 mt-4 relative shrink-0 shadow-sm">
              <div className="absolute top-4 right-4 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                <span className="text-[10px] text-slate-400">Live</span>
              </div>
              <h3 className="font-bold flex items-center gap-2 text-slate-100 mb-4 text-sm">
                <Activity size={16} className="text-red-500" /> Patient Vitals
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1e293b] border-white/5 p-3 rounded-lg border border-white/10 shadow-sm">
                  <p className="text-[10px] text-slate-400 font-medium mb-1 flex items-center gap-1"><HeartPulse size={12} className="text-red-500"/> Heart Rate</p>
                  <p className="text-xl font-bold text-slate-100">98 <span className="text-xs text-slate-400 font-normal">bpm</span></p>
                </div>
                <div className="bg-[#1e293b] border-white/5 p-3 rounded-lg border border-white/10 shadow-sm">
                  <p className="text-[10px] text-slate-400 font-medium mb-1">SpO2</p>
                  <p className="text-xl font-bold text-slate-100">94 <span className="text-xs text-slate-400 font-normal">%</span></p>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Map */}
        <main className="flex-1 relative z-0">
          <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} className={lowDataMode ? 'bg-slate-100' : ''}>
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
          
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_50px_rgba(248,250,252,0.8)] z-[400]"></div>
          
          {/* AI Smart Routing Live HUD */}
          {displayEmergency && dqnData && (
            <div className="absolute top-6 right-6 z-[500] w-[320px] flex flex-col gap-3">
              
              {/* Dynamic Reroute Alert Overlay */}
              {roadblockDetected && (
                <div className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border ${isRerouting ? 'border-orange-300 dark:border-orange-500/50' : 'border-white/10'} rounded-lg p-4 shadow-soft-lg transition-all`}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className={isRerouting ? "text-orange-500" : "text-slate-400"} size={20} />
                    <h4 className="font-bold text-slate-100 text-sm">Route Advisory</h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Traffic congestion identified on primary route.</p>
                  {isRerouting ? (
                    <div className="flex items-center gap-2 text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 p-2 rounded">
                      <div className="w-3 h-3 border border-orange-500/30 border-t-orange-500 dark:border-t-orange-400 rounded-full animate-spin"></div>
                      Recalculating alternative path...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 p-2 rounded">
                      <CheckCircle size={14} /> Alternate route confirmed.
                    </div>
                  )}
                </div>
              )}

              {/* Main AI Neural Core Analytics */}
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-lg p-4 shadow-soft-lg">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    <Activity size={16} className="text-blue-500" /> Route Telemetry
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Connected
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Traffic Density</span>
                      <span className={roadblockDetected && !isRerouting ? "text-orange-500" : "text-slate-300"}>
                        {roadblockDetected && !isRerouting ? 'Moderate' : 'Low'}
                      </span>
                    </div>
                    <div className="h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-1000 ${roadblockDetected && !isRerouting ? 'bg-orange-500 w-[65%]' : 'bg-blue-500 w-[20%]'}`}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>ETA Confidence</span>
                      <span className="text-slate-300">94.2%</span>
                    </div>
                    <div className="h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-[94%]"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 mt-2 border-t border-white/10">
                    <div className="bg-[#1e293b] border-white/5 p-2 rounded text-center border border-white/10">
                      <p className="text-[10px] text-slate-400 font-medium mb-1">Standard ETA</p>
                      <p className="text-base font-bold text-slate-300">{dqnData.standard_route_eta}m</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-center border border-blue-200 dark:border-blue-800/50">
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mb-1">Optimized</p>
                      <p className="text-base font-bold text-blue-600 dark:text-blue-400">
                        {roadblockDetected && !isRerouting ? Math.max(1, parseInt(dqnData.dqn_optimized_eta) - 2) : dqnData.dqn_optimized_eta}m
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Edit Vehicle Status Modal */}
      {isEditingStatus && (
        <div className="absolute inset-0 bg-slate-900/40 z-[9999] flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up">
            <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2"><Truck size={20} className="text-orange-500"/> Edit Vehicle Status</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Fuel Level (%)</label>
                <input type="number" min="0" max="100" value={vehicleStatus.fuel} onChange={(e) => setVehicleStatus({...vehicleStatus, fuel: parseInt(e.target.value) || 0})} className="w-full bg-[#1e293b] border-white/5 border border-white/10 p-3 rounded-xl text-slate-100 font-bold focus:border-orange-400 dark:focus:border-orange-500 outline-none shadow-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Oxygen Supply (%)</label>
                <input type="number" min="0" max="100" value={vehicleStatus.oxygen} onChange={(e) => setVehicleStatus({...vehicleStatus, oxygen: parseInt(e.target.value) || 0})} className="w-full bg-[#1e293b] border-white/5 border border-white/10 p-3 rounded-xl text-slate-100 font-bold focus:border-orange-400 dark:focus:border-orange-500 outline-none shadow-sm" />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setIsEditingStatus(false)} className="px-5 py-2.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold text-sm transition-colors">Cancel</button>
              <button onClick={() => {
                localStorage.setItem('ambulance_status', JSON.stringify(vehicleStatus));
                setIsEditingStatus(false);
                addToast('Vehicle status updated successfully', 'success', 3000);
              }} className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-sm transition-colors text-sm">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AmbulanceDashboard;
