import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { io } from 'socket.io-client';
import { BACKEND_URL } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Heart, Droplet, MapPin, CheckCircle, Clock } from 'lucide-react';
import { useLocationName } from '../hooks/useLocationName';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { getLocationName } from '../services/geocoding';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { motion } from 'framer-motion';

const defaultIcon = L.divIcon({
  html: `<div style="background-color: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px;">B</div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const BloodDonorDashboard = () => {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const [socket, setSocket] = useState(null);
  const [requests, setRequests] = useState([]);
  const [center, setCenter] = useState([17.3850, 78.4867]);
  const [locations, setLocations] = useState({});
  const ownLocationName = useLocationName();
  const { location: donorLocation } = useLiveLocation();

  useEffect(() => {
    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('request_blood_requests');
    });

    newSocket.on('update_blood_requests', (data) => {
      setRequests(data);
      if (data.length > 0 && data[0].location) {
        setCenter([data[0].location.lat, data[0].location.lng]);
      }
    });

    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    requests.forEach(async (r) => {
      if (r.location && !locations[r.id]) {
        try {
          const locName = await getLocationName(r.location.lat, r.location.lng);
          setLocations(prev => ({
            ...prev,
            [r.id]: locName
          }));
        } catch (err) {
          console.error(err);
        }
      }
    });
  }, [requests, locations]);

  const acceptRequest = (id) => {
    if (socket) {
      socket.emit('accept_blood_request', {
        request_id: id,
        donor_id: user.id
      });
      addToast('Blood Request Accepted! Please proceed to the location.', 'success', 5000);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'PENDING');

  return (
    <div className="h-screen flex flex-col relative overflow-hidden bg-[#1e293b]/50 border border-white/5">
      <header className="bg-[#131B2F] border border-white/5/90 backdrop-blur-md p-4 flex justify-between items-center z-50 border-b border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-900/20 flex items-center justify-center text-red-600 border border-red-800 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
            <Droplet size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Blood Donor Network</h1>
            <p className="text-slate-500 text-xs flex items-center gap-2 mt-1 font-bold">
              <Badge variant="danger" className="text-[10px]">Blood Donor</Badge>
              <span className="flex items-center gap-1">
                <MapPin size={12} /> {ownLocationName}
              </span>
            </p>
          </div>
        </div>
        <Button variant="ghost" onClick={logout} className="text-red-400 hover:text-red-600 hover:bg-red-900/20 font-bold border border-red-800">Sign Out</Button>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className="w-[420px] bg-[#131B2F] border border-white/5/90 backdrop-blur-md border-r border-white/10 overflow-y-auto p-6 z-10 custom-scrollbar shadow-[0_0_15px_rgba(0,0,0,0.3)]">
          <h2 className="text-xl font-black text-white flex items-center gap-3 mb-6">
            <Heart className="text-red-400" size={24} /> Urgent Blood Requests
          </h2>

          {pendingRequests.length === 0 ? (
            <div className="text-center py-12 px-6 bg-[#1e293b]/50 border border-white/5 rounded-3xl border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400/40" />
              <p className="font-bold text-lg text-slate-200">No urgent requests nearby</p>
              <p className="text-sm mt-2 text-slate-500">Thank you for being available to save lives!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map(r => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  key={r.id} 
                  className="bg-[#131B2F] border border-white/5 p-5 rounded-2xl border-l-[4px] border-l-red-500 border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.3)]"
                >
                  <div className="flex justify-between items-start mb-3">
                    <Badge variant="danger" className="text-[14px] font-black">{r.blood_group}</Badge>
                    <span className="text-xs text-red-600 font-bold bg-red-900/20 px-2 py-1 rounded border border-red-800">{r.units_needed} Units Needed</span>
                  </div>
                  <div className="bg-[#1e293b]/50 border border-white/5 p-3 rounded-xl border-white/10 mb-4 mt-2">
                    <p className="text-xs text-slate-300 flex items-center gap-2 font-medium"><MapPin size={14} className="text-red-400"/> {locations[r.id] || 'Loading location...'}</p>
                  </div>
                  <Button onClick={() => acceptRequest(r.id)} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold border-none shadow-[0_0_15px_rgba(0,0,0,0.3)]">
                    Accept & Donate
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </aside>

        <main className="flex-1 relative z-0">
          <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} className="grayscale-[20%] contrast-110">
            <TileLayer url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" attribution="&copy; Google Maps" />
            {requests.map(r => r.location && (
              <Marker key={r.id} position={[r.location.lat, r.location.lng]} icon={defaultIcon}>
                <Popup className="custom-popup">
                  <div className="p-2">
                    <p className="font-bold text-red-600 mb-1">{r.blood_group} Needed ({r.units_needed} Units)</p>
                    <p className="text-xs font-bold text-slate-200">Status: {r.status}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_50px_rgba(0,0,0,0.05)] z-[400]"></div>
        </main>
      </div>
    </div>
  );
};

export default BloodDonorDashboard;
