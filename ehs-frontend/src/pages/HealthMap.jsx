import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { BACKEND_URL } from '../services/api';
import { MapContainer, TileLayer, Circle, Marker, Popup, FeatureGroup } from 'react-leaflet';
import { Map as MapIcon, MapPin, Building2, Truck } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useLocationName } from '../hooks/useLocationName';
import { mockMapData } from '../data/mockData';

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


const HealthMap = () => {
  const { user, logout } = useAuth();
  const center = [17.3850, 78.4867]; // Hyderabad Base
  const locationName = useLocationName();
  const [liveAmbulances, setLiveAmbulances] = useState({});

  useEffect(() => {
    const socket = io(BACKEND_URL);
    
    socket.on('live_ambulance_location', (data) => {
      setLiveAmbulances(prev => ({
        ...prev,
        [data.emergency_id]: data
      }));
    });

    return () => socket.disconnect();
  }, []);

  const zones = [
    { center: [17.40, 78.50], radius: 2000, color: '#ef4444', name: 'Dengue Outbreak Zone', desc: 'High mosquito density reported.' },
    { center: [17.35, 78.45], radius: 3000, color: '#eab308', name: 'Severe Heatwave', desc: 'Temperatures exceeding 45°C.' },
    { center: [17.42, 78.42], radius: 1500, color: '#3b82f6', name: 'Flood Risk Area', desc: 'Waterlogging in low-lying areas.' },
    { center: [17.37, 78.52], radius: 2500, color: '#22c55e', name: 'Safe Zone', desc: 'Normal conditions.' },
  ];

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-800 overflow-hidden">
      <header className="flex justify-between items-center bg-white/90 backdrop-blur-md p-4 border-b border-slate-200 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-yellow-50 flex items-center justify-center text-yellow-600 border border-yellow-100 shadow-sm">
            <MapIcon size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wider text-slate-800">COMMUNITY HEALTH MAP</h1>
            <p className="text-slate-500 text-xs flex items-center gap-1 mt-1 font-medium">
              Public Access <span className="text-slate-400">•</span> <MapPin size={10} className="text-slate-400"/> {locationName}
            </p>
          </div>
        </div>
        <button onClick={logout} className="px-5 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 text-sm font-bold border border-red-200 rounded-xl transition-colors">Sign Out</button>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className="w-80 bg-white/90 backdrop-blur-md border-r border-slate-200 p-6 flex flex-col gap-6 z-10 shadow-sm">
          <h2 className="text-xl font-bold mb-2 text-slate-800">Map Legend</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]"></div>
              <span className="font-bold text-red-600">Dengue Zones</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="w-4 h-4 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]"></div>
              <span className="font-bold text-yellow-600">Heatwave Areas</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]"></div>
              <span className="font-bold text-blue-600">Flood Areas</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="w-4 h-4 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]"></div>
              <span className="font-bold text-green-600">Safe Areas</span>
            </div>
          </div>

          <div className="mt-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm">
            <h3 className="font-bold text-sm mb-4 text-slate-500 uppercase tracking-widest">Live Entities</h3>
            <ul className="text-sm font-medium space-y-3">
              <li className="flex items-center gap-3 text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100"><Building2 size={16}/></div>
                Hospitals: <span className="text-slate-800 font-black">{mockMapData.hospitals.length} Active</span>
              </li>
              <li className="flex items-center gap-3 text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center border border-red-100"><Truck size={16}/></div>
                Ambulances: <span className="text-slate-800 font-black">{mockMapData.ambulances.length + Object.keys(liveAmbulances).length} Active</span>
              </li>
              <li className="flex items-center gap-3 text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center border border-green-100"><MapPin size={16}/></div>
                Volunteers: <span className="text-slate-800 font-black">34 Available</span>
              </li>
            </ul>
          </div>
        </aside>

        <main className="flex-1 relative z-0">
          <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false} className="grayscale-[20%] contrast-110">
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              attribution='&copy; Google Maps'
            />
            
            {zones.map((zone, i) => (
              <Circle 
                key={i}
                center={zone.center}
                pathOptions={{ color: zone.color, fillColor: zone.color, fillOpacity: 0.2 }}
                radius={zone.radius}
              >
                <Popup>
                  <div className="font-medium text-slate-900">
                    <h3 className="font-bold text-lg" style={{color: zone.color}}>{zone.name}</h3>
                    <p className="text-sm mt-1">{zone.desc}</p>
                  </div>
                </Popup>
              </Circle>
            ))}

            {mockMapData.hospitals.map(h => (
              <Marker key={h.id} position={[h.lat, h.lng]} icon={hospitalIcon}>
                <Popup>
                  <div className="font-medium text-slate-900 p-1">
                    <h3 className="font-bold text-blue-600 mb-1 flex items-center gap-1"><Building2 size={14}/> {h.name}</h3>
                    <p className="text-sm">Available Beds: <span className="font-black text-blue-600">{h.bedsAvailable}</span></p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {mockMapData.ambulances.map(a => (
              <Marker key={a.id} position={[a.lat, a.lng]} icon={ambulanceIcon}>
                <Popup>
                  <div className="font-medium text-slate-900 p-1">
                    <h3 className="font-bold text-red-600 mb-1 flex items-center gap-1"><Truck size={14}/> {a.name}</h3>
                    <p className="text-sm">Status: <span className={`font-black ${a.status === 'AVAILABLE' ? 'text-green-600' : 'text-red-600'}`}>{a.status}</span></p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {Object.values(liveAmbulances).map(a => (
              <Marker key={a.emergency_id} position={[a.lat, a.lng]} icon={ambulanceIcon} zIndexOffset={1000}>
                <Popup>
                  <div className="font-medium text-slate-900 p-1">
                    <h3 className="font-bold text-red-600 mb-1 flex items-center gap-1"><Truck size={14}/> Live MMU Response</h3>
                    <p className="text-sm">Distance Left: <span className="font-black text-red-600">{a.distance_left} km</span></p>
                    <p className="text-sm">ETA: <span className="font-black text-red-600">{a.eta_left} mins</span></p>
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

export default HealthMap;
