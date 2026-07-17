import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLocationName } from '../services/geocoding';
import { io } from 'socket.io-client';
import { BACKEND_URL } from '../services/api';
import { 
  AlertCircle, CheckCircle2, Activity, HeartPulse, 
  Baby, ThermometerSun, Pill, History, Stethoscope, UserPlus, MapPin, Navigation, Truck,
  Mic, PhoneCall, Video, Users, Clock, Phone, BookOpen, BellRing, Battery, Languages
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { useToast } from '../context/ToastContext';


import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import PageWrapper from '../components/ui/PageWrapper';
import ThemeToggle from '../components/ui/ThemeToggle';
import { useNetworkState } from '../hooks/useNetworkState';
import InteractiveCard from '../components/ui/InteractiveCard';
import MagneticButton from '../components/ui/MagneticButton';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import AnimatedModal from '../components/ui/AnimatedModal';
import TeleConsultModal from '../components/ui/TeleConsultModal';

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

const getEmergencyCode = (symptom) => {
  if (!symptom) return 'G01';
  const s = symptom.toLowerCase();
  if (s.includes('heart')) return 'H01';
  if (s.includes('bite') || s.includes('toxin')) return 'S01';
  if (s.includes('preg') || s.includes('mater')) return 'P01';
  if (s.includes('breath') || s.includes('airway')) return 'B01';
  if (s.includes('trauma') || s.includes('bleed')) return 'A01';
  return 'G01';
};

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isOnline } = useNetworkState();
  const [lowDataMode, setLowDataMode] = useState(false);
  const [socket, setSocket] = useState(null);
  const [symptoms, setSymptoms] = useState('');
  const [status, setStatus] = useState('IDLE'); // IDLE, SEARCHING, ACCEPTED
  const [activeEmergencyId, setActiveEmergencyId] = useState(null);
  const [responder, setResponder] = useState('');
  const [offline, setOffline] = useState(!navigator.onLine);
  const [simulateOffline, setSimulateOffline] = useState(false);
  const isCurrentlyOffline = offline || simulateOffline;
  const [locationName, setLocationName] = useState('Detecting Location...');
  const [movingStatus, setMovingStatus] = useState(null); // 'YES', 'NO', null
  const [smartRoute, setSmartRoute] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showTeleConsult, setShowTeleConsult] = useState(false);
  
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [needsShifting, setNeedsShifting] = useState(false);
  const [liveAmbulance, setLiveAmbulance] = useState(null);
  const [showFirstAid, setShowFirstAid] = useState(false);
  const [voiceLang, setVoiceLang] = useState('en-US');
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [torchTrack, setTorchTrack] = useState(null);
  const [alarmAudio, setAlarmAudio] = useState(null);

  const { location, isTracking } = useLiveLocation();

  useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      });
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/patient/profile');
        setProfile(res.data);
        
        if (res.data.expected_delivery_date) {
          const edd = new Date(res.data.expected_delivery_date);
          const now = new Date();
          const diffTime = edd - now;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays > 0 && diffDays <= 14) {
            setNeedsShifting(true);
          }
        }
      } catch (err) {
        setProfile(null);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    newSocket.on('emergency_accepted', (data) => {
      if (data.patient_id === user.id.toString()) {
        setStatus('ACCEPTED');
        setResponder(data.role);
        setActiveEmergencyId(data.emergency_id);
      }
    });

    newSocket.on('smart_route_updated', (data) => {
      if (data.emergency_id === activeEmergencyId && data.is_moving) {
        setSmartRoute({
          lat: data.meeting_point_lat,
          lng: data.meeting_point_lng
        });
      }
    });

    newSocket.on('live_ambulance_location', (data) => {
      if (data.emergency_id === activeEmergencyId) {
         setLiveAmbulance(data);
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      newSocket.disconnect();
    };
  }, [user, activeEmergencyId]);

  useEffect(() => {
    if (location && location.lat && location.lng) {
        const fetchAddress = async () => {
          try {
            const locName = await getLocationName(location.lat, location.lng);
            setLocationName(locName);
          } catch(e) {
            setLocationName(`${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
          }
        };
        if (locationName === 'Detecting Location...' || locationName === 'Location Access Denied') {
            fetchAddress();
        }
    }
  }, [location, locationName]);

  const triggerSOS = () => {
    if (!socket || !symptoms) return;
    
    setStatus('SEARCHING');
    
    if (isCurrentlyOffline) {
      const hospitalNumber = "9999999999"; 
      const familyNumber = profile?.family_contact || "1234567890";
      const recipients = `108,${hospitalNumber},${familyNumber}`;
      
      const pBlood = profile?.blood_group || 'Unknown';
      const eCode = getEmergencyCode(symptoms);
      const timeStr = new Date().toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute: '2-digit'}).replace(':', '');
      
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(5);
          const lng = pos.coords.longitude.toFixed(5);
          const body = encodeURIComponent(`SOS001|${lat}|${lng}|${eCode}|${pBlood}|${batteryLevel}|${timeStr}`);
          window.location.href = `sms:${recipients}?body=${body}`;
          setStatus('IDLE');
        },
        (err) => {
          const body = encodeURIComponent(`SOS001|0.00000|0.00000|${eCode}|${pBlood}|${batteryLevel}|${timeStr}`);
          window.location.href = `sms:${recipients}?body=${body}`;
          setStatus('IDLE');
        }
      );
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        socket.emit('new_emergency', {
          patient_id: user.id.toString(),
          symptoms: symptoms,
          risk_level: 'CRITICAL',
          location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          locationName: locationName
        });
      },
      (err) => {
        socket.emit('new_emergency', {
          patient_id: user.id.toString(),
          symptoms: symptoms,
          risk_level: 'CRITICAL',
          location: null,
          locationName: 'Location Access Denied'
        });
      }
    );
  };

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = voiceLang; // Configurable language
    recognition.interimResults = false;
    
    recognition.onstart = () => {
      setIsRecording(true);
    };
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSymptoms(prev => prev ? prev + ' ' + transcript : transcript);
    };
    
    recognition.onend = () => {
      setIsRecording(false);
    };
    
    recognition.onerror = (event) => {
      console.error(event.error);
      setIsRecording(false);
    };
    
    recognition.start();
  };

  const toggleFlashlight = async () => {
    if (torchTrack) {
      torchTrack.stop();
      setTorchTrack(null);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        const track = stream.getVideoTracks()[0];
        if (track.getCapabilities && track.getCapabilities().torch) {
          await track.applyConstraints({ advanced: [{ torch: true }] });
          setTorchTrack(track);
        } else {
          alert("Flashlight not supported on this device.");
          track.stop();
        }
      } catch (err) {
        alert("Camera permission required for flashlight.");
      }
    }
  };

  const toggleAlarm = () => {
    if (alarmAudio) {
      alarmAudio.pause();
      setAlarmAudio(null);
    } else {
      const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
      audio.loop = true;
      audio.play();
      setAlarmAudio(audio);
    }
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">Loading...</div>
    );
  }

  return (
    <div className="min-h-screen relative">
      
      {/* Offline Banner & Simulator */}
      {isCurrentlyOffline && (
        <div className="bg-orange-500/20 text-orange-400 p-3 text-center text-sm font-bold border-b border-orange-500/30 flex flex-col sm:flex-row items-center justify-center gap-2 animate-pulse shadow-inner">
          <AlertCircle size={20} className="text-orange-500" /> 
          <div>
            NO INTERNET SIGNAL DETECTED. 
            <span className="text-orange-300 ml-1 block sm:inline font-medium">SOS will automatically route through 2G (SMS) using offline GPS and Geocoding to ensure you still get help in rural areas!</span>
          </div>
        </div>
      )}
      
      {/* Simulation Control (Demo Only) */}
      <div className="absolute top-24 left-4 z-50">
        <button 
          onClick={() => setSimulateOffline(!simulateOffline)}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-lg border ${simulateOffline ? 'bg-orange-500 text-white border-orange-600' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}
        >
          {simulateOffline ? '🟢 Network Outage Simulated' : '🔴 Simulate Network Outage'}
        </button>
      </div>

      {/* Battery Low Failsafe */}
      {batteryLevel < 15 && (
        <div className="bg-red-600/90 text-white p-3 text-center text-sm font-bold border-b border-red-500 flex flex-col sm:flex-row items-center justify-center gap-2 animate-pulse shadow-inner z-50 relative">
          <Battery size={20} className="text-white" />
          CRITICAL BATTERY: {batteryLevel}%. Please trigger SOS immediately before your device shuts down!
        </div>
      )}

      {/* Pre-Registration Prompts & Alerts */}
      {!loadingProfile && !profile && (
        <div className="bg-blue-600/20 text-blue-300 p-3 text-center text-sm font-medium border-b border-blue-500/30 flex flex-col sm:flex-row items-center justify-center gap-3">
          <span className="flex items-center gap-2"><UserPlus size={18} /> Please complete your Pre-Registration for proactive monitoring.</span>
          <Link to="/patient/pre-register" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold transition">Complete Now</Link>
        </div>
      )}

      {!loadingProfile && profile && needsShifting && (
        <div className="bg-red-600/90 text-white p-3 text-center text-sm font-bold border-b border-red-50 flex items-center justify-center gap-2 animate-pulse">
          <AlertCircle size={18} /> 
          RECOMMENDATION: Your delivery date is approaching. Please shift closer to the nearest Hospital/PHC to prevent emergencies.
        </div>
      )}

      {/* Header */}
      <header className="premium-glass-nav p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Welcome, {user?.contact_info || "Bhogeswara Rao"}</h1>
            <div className="flex items-center gap-2 mt-2">
              {profile ? (
                <Badge variant={profile.risk_level === 'High' ? 'danger' : profile.risk_level === 'Medium' ? 'warning' : 'success'}>
                  Risk Level: {profile.risk_level}
                </Badge>
              ) : (
                <Badge variant="success">Health Score: 84/100</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setLowDataMode(!lowDataMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${lowDataMode ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}
            >
              <Activity size={14} className={lowDataMode ? 'animate-pulse' : ''} />
              2G/Low Data Mode
            </button>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={logout} className="text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <PageWrapper>
        {lowDataMode && (
          <div className="mb-6 bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex items-center gap-3 text-orange-400">
            <Battery size={20} className="shrink-0" />
            <div>
              <p className="font-bold text-sm uppercase tracking-widest">Low Bandwidth Mode Active</p>
              <p className="text-xs text-orange-300/70 font-medium mt-1">Map images are disabled to save data. Geocoding and Emergency SOS will connect instantly even on 1G/2G networks.</p>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Column - SOS & Quick Actions */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Emergency SOS Card */}
            <div className="premium-glass-panel p-8 relative overflow-hidden bg-gradient-to-br from-red-950/40 to-slate-900 border-red-500/30 animate-scale-in shadow-[0_0_40px_rgba(239,68,68,0.1)]">
              <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/15 rounded-full blur-3xl animate-pulse-fast"></div>

              <div className="flex items-center gap-5 mb-8 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-500 shadow-inner drop-shadow-lg">
                  <AlertCircle size={36} />
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-black text-red-400 tracking-tight drop-shadow-md">EMERGENCY SOS</h2>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    {isTracking && (
                      <Badge variant="success" className="animate-pulse">Live Tracking</Badge>
                    )}
                    <p className="text-sm text-red-300/80 font-medium flex items-center gap-1.5 bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">
                      <MapPin size={14} className="text-red-400" />
                      {locationName}
                    </p>
                  </div>
                </div>
              </div>

              {status === 'IDLE' && (
                <div className="relative z-10 animate-fade-in-up">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                    {[
                      { icon: '🫀', label: 'Heart Conditions', color: 'red' },
                      { icon: '🐍', label: 'Bites & Toxins', color: 'green' },
                      { icon: '🤰', label: 'Pregnancy', color: 'purple' },
                      { icon: '💨', label: 'Airway & Breathing', color: 'blue' },
                      { icon: '🩸', label: 'Trauma & Bleeding', color: 'orange' }
                    ].map((symptom, idx) => (
                      <button 
                        key={idx}
                        onClick={() => { setSymptoms(symptom.label); triggerSOS(); }} 
                        className={`bg-slate-900/50 backdrop-blur-md border border-slate-700 rounded-xl p-3 flex flex-col items-center justify-center gap-2 hover:bg-${symptom.color}-500/20 hover:border-${symptom.color}-500/50 hover:shadow-[0_0_15px_rgba(var(--color-${symptom.color}-500),0.2)] transition-all group`}
                      >
                        <span className="text-3xl group-hover:scale-110 transition-transform drop-shadow-md">{symptom.icon}</span>
                        <span className={`text-${symptom.color}-400 font-bold text-xs text-center leading-tight`}>{symptom.label}</span>
                      </button>
                    ))}
                  </div>
                  
                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                    <div className="relative flex justify-center text-xs"><span className="bg-slate-900 px-4 text-slate-400 uppercase tracking-widest font-bold rounded-full border border-white/10">Or specify details</span></div>
                  </div>

                  <div className="relative mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <select 
                        value={voiceLang}
                        onChange={(e) => setVoiceLang(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none"
                      >
                        <option value="en-US">English</option>
                        <option value="te-IN">Telugu</option>
                        <option value="ta-IN">Tamil</option>
                        <option value="hi-IN">Hindi</option>
                      </select>
                    </div>
                    <textarea 
                      className="w-full bg-slate-950/60 backdrop-blur-md border border-white/10 rounded-2xl p-5 pr-14 text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all resize-none shadow-inner"
                      placeholder="Describe your emergency or use the mic..."
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      rows="3"
                    />
                    <button 
                      onClick={startRecording}
                      className={`absolute right-4 top-4 p-3 rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                    >
                      <Mic size={20} />
                    </button>
                  </div>
                  
                  <MagneticButton 
                    variant="danger"
                    size="lg"
                    onClick={triggerSOS}
                    disabled={!symptoms}
                    className="w-full py-5 text-xl font-black tracking-widest uppercase animate-glow-pulse disabled:animate-none border-red-500 hover:bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.5)] hover:shadow-[0_0_60px_rgba(239,68,68,0.7)] transition-all mb-8"
                  >
                    Broadcast SOS Now
                  </MagneticButton>

                  {/* OFFLINE LIFESAVER TOOLS */}
                  <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
                    <button 
                      onClick={toggleFlashlight}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all border ${torchTrack ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                      <div className={`p-3 rounded-full mb-2 ${torchTrack ? 'bg-yellow-500 text-slate-900 shadow-[0_0_20px_rgba(234,179,8,0.6)]' : 'bg-slate-800'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11.5 9H9.5L12.5 2H15.5L11.5 9Z"/><path d="M13 14H15L12 21L9 21L13 14Z"/><rect x="7" y="9" width="10" height="5" rx="1"/></svg>
                      </div>
                      <span className="text-xs font-bold">Flashlight</span>
                    </button>
                    
                    <button 
                      onClick={toggleAlarm}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all border ${alarmAudio ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                      <div className={`p-3 rounded-full mb-2 ${alarmAudio ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.6)]' : 'bg-slate-800'}`}>
                        <BellRing size={24} className={alarmAudio ? 'animate-bounce' : ''} />
                      </div>
                      <span className="text-xs font-bold">Siren</span>
                    </button>
                    
                    <button 
                      onClick={() => setShowFirstAid(true)}
                      className="flex flex-col items-center justify-center p-4 rounded-2xl transition-all border bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                      <div className="p-3 rounded-full mb-2 bg-slate-800">
                        <BookOpen size={24} />
                      </div>
                      <span className="text-xs font-bold">First Aid</span>
                    </button>
                  </div>
                </div>
              )}

              {status === 'SEARCHING' && (
                <div className="text-center py-16 relative z-10 animate-fade-in-up">
                  <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className="absolute inset-0 rounded-full border-4 border-red-500/20"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-red-500 border-t-transparent animate-spin-slow"></div>
                    <AlertCircle size={40} className="absolute inset-0 m-auto text-red-500 animate-pulse" />
                  </div>
                  <h3 className="text-3xl font-bold text-red-400 mb-2 tracking-tight">Broadcasting SOS...</h3>
                  <p className="text-slate-400 mb-8 text-lg">Finding the nearest available responder</p>
                  
                  <div className="mt-4 space-y-3 text-sm text-slate-200 text-left w-72 mx-auto premium-glass-panel p-6 border-red-500/30">
                    <div className="flex items-center gap-3"><CheckCircle2 className="text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] rounded-full" size={20}/> 108 Ambulance Alerted</div>
                    <div className="flex items-center gap-3"><CheckCircle2 className="text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] rounded-full" size={20}/> Hospital/PHC Pre-Alerted</div>
                    <div className="flex items-center gap-3"><CheckCircle2 className="text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] rounded-full" size={20}/> Community Volunteers Notified</div>
                  </div>
                </div>
              )}

              {status === 'ACCEPTED' && (
                <div className="text-center py-12 relative z-10 animate-fade-in-up w-full">
                  <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.3)] animate-pulse-fast">
                    <CheckCircle2 size={40} className="text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]" />
                  </div>
                  <h3 className="text-3xl font-black text-green-400 mb-2 tracking-tight">Help is on the way!</h3>
                  
                  {liveAmbulance ? (
                    <div className="flex flex-col md:flex-row gap-6 mb-8 mt-6">
                       <div className="flex-1 bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 shadow-xl text-left">
                         <p className="text-slate-400 uppercase tracking-widest text-xs font-bold mb-4 flex items-center gap-2"><Truck size={16}/> Live Updates</p>
                         <div className="flex justify-between items-center bg-slate-950/50 p-4 rounded-xl border border-white/5 mb-4">
                           <span className="text-slate-500 font-bold text-xs">Distance Away</span>
                           <span className="text-xl font-black text-slate-200">{liveAmbulance.distance_left} km</span>
                         </div>
                         <div className="flex justify-between items-center bg-orange-950/30 p-4 rounded-xl border border-orange-500/20">
                           <span className="text-orange-500/70 font-bold text-xs uppercase">Live ETA</span>
                           <span className="text-2xl font-black text-orange-400 animate-pulse">{liveAmbulance.eta_left} mins</span>
                         </div>
                       </div>
                       
                       <div className={`flex-1 h-64 rounded-3xl overflow-hidden border-2 border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.6)] relative group ${lowDataMode ? 'bg-slate-900' : ''}`}>
                          <MapContainer center={location && location.lat ? [location.lat, location.lng] : [17.3850, 78.4867]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} className={lowDataMode ? '' : 'grayscale-[30%] contrast-125'}>
                            {!lowDataMode && (
                              <TileLayer url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" attribution="&copy; Google Maps" />
                            )}
                            {location && location.lat && (
                               <Marker position={[location.lat, location.lng]} icon={redIcon}>
                                  <Popup>You</Popup>
                               </Marker>
                            )}
                            <Marker position={[liveAmbulance.lat, liveAmbulance.lng]} icon={ambulanceIcon} zIndexOffset={1000}>
                               <Popup>Ambulance</Popup>
                            </Marker>
                          </MapContainer>
                          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_50px_rgba(2,6,23,0.9)] z-[400]"></div>
                       </div>
                    </div>
                  ) : (
                    <p className="text-slate-300 text-lg mb-8 bg-slate-900/50 p-4 rounded-xl inline-block border border-slate-700">Connecting to live tracker...</p>
                  )}
                  
                  {/* Phase 4: Smart Routing Prompts */}
                  {!movingStatus && (
                    <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6 text-left max-w-lg mx-auto shadow-xl">
                      <p className="text-base font-bold text-white mb-4 text-center">Are you moving the patient towards the {responder}?</p>
                      <div className="flex gap-4">
                        <Button 
                          variant="primary"
                          className="flex-1"
                          onClick={() => {
                            setMovingStatus('YES');
                            socket.emit('update_moving_status', { emergency_id: activeEmergencyId, is_moving: true });
                          }}
                        >
                          YES, MOVING
                        </Button>
                        <Button 
                          variant="secondary"
                          className="flex-1"
                          onClick={() => {
                            setMovingStatus('NO');
                            socket.emit('update_moving_status', { emergency_id: activeEmergencyId, is_moving: false });
                          }}
                        >
                          STAYING HERE
                        </Button>
                      </div>
                    </div>
                  )}

                  {movingStatus === 'YES' && smartRoute && (
                    <div className="bg-blue-900/30 border border-blue-500/50 rounded-2xl p-6 text-left max-w-sm mx-auto animate-pulse shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                      <p className="text-base font-bold text-blue-300 flex items-center gap-2 mb-3"><Navigation size={20} /> SMART ROUTE ACTIVE</p>
                      <p className="text-white font-medium text-sm leading-relaxed mb-3">Meeting halfway at coordinates:<br/><span className="text-blue-200 font-mono bg-black/30 px-2 py-1 rounded mt-1 inline-block">{smartRoute.lat.toFixed(4)}, {smartRoute.lng.toFixed(4)}</span></p>
                      <Badge variant="primary" className="mt-2">Saves ~30 minutes!</Badge>
                    </div>
                  )}

                  {movingStatus === 'NO' && (
                    <div className="bg-orange-900/30 border border-orange-500/50 rounded-2xl p-6 text-left max-w-sm mx-auto shadow-[0_0_30px_rgba(249,115,22,0.2)] mt-4">
                      <p className="text-base font-bold text-orange-300 flex items-center gap-2 mb-3"><AlertCircle size={20} /> STAY PUT</p>
                      <p className="text-white font-medium text-sm leading-relaxed">A doctor will call you shortly to guide you on keeping the patient safe until the {responder} arrives.</p>
                    </div>
                  )}

                  <Button variant="ghost" onClick={() => {setStatus('IDLE'); setSymptoms(''); setMovingStatus(null); setSmartRoute(null); setActiveEmergencyId(null);}} className="mt-8 mx-auto">
                    Dismiss Alert
                  </Button>
                </div>
              )}
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up stagger-1">
              <Link to="/patient/assistant" className="h-full">
                <InteractiveCard glowColor="rgba(59, 130, 246, 0.15)" className="h-full flex flex-col items-start group p-6">
                  <div className="p-3 bg-blue-500/10 rounded-xl mb-4 border border-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform shadow-inner"><Activity size={24}/></div>
                  <h3 className="font-bold text-base mb-1 text-slate-200 group-hover:text-blue-400 transition-colors leading-tight">AI Assistant</h3>
                  <p className="text-xs text-slate-400 mt-auto">Symptom analysis</p>
                </InteractiveCard>
              </Link>
              <Link to="/medicine-search" className="h-full">
                <InteractiveCard glowColor="rgba(20, 184, 166, 0.15)" className="h-full flex flex-col items-start group p-6">
                  <div className="p-3 bg-teal-500/10 rounded-xl mb-4 border border-teal-500/20 text-teal-400 group-hover:scale-110 transition-transform shadow-inner"><Pill size={24}/></div>
                  <h3 className="font-bold text-base mb-1 text-slate-200 group-hover:text-teal-400 transition-colors leading-tight">Medicines</h3>
                  <p className="text-xs text-slate-400 mt-auto">Find nearby stock</p>
                </InteractiveCard>
              </Link>
              <Link to="/health-records" className="h-full">
                <InteractiveCard glowColor="rgba(168, 85, 247, 0.15)" className="h-full flex flex-col items-start group p-6">
                  <div className="p-3 bg-purple-500/10 rounded-xl mb-4 border border-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform shadow-inner"><History size={24}/></div>
                  <h3 className="font-bold text-base mb-1 text-slate-200 group-hover:text-purple-400 transition-colors leading-tight">Records</h3>
                  <p className="text-xs text-slate-400 mt-auto">Medical history</p>
                </InteractiveCard>
              </Link>
              <Link to="/health-map" className="h-full">
                <InteractiveCard glowColor="rgba(34, 197, 94, 0.15)" className="h-full flex flex-col items-start group p-6">
                  <div className="p-3 bg-green-500/10 rounded-xl mb-4 border border-green-500/20 text-green-400 group-hover:scale-110 transition-transform shadow-inner"><Stethoscope size={24}/></div>
                  <h3 className="font-bold text-base mb-1 text-slate-200 group-hover:text-green-400 transition-colors leading-tight">Hospitals</h3>
                  <p className="text-xs text-slate-400 mt-auto">Locate clinics</p>
                </InteractiveCard>
              </Link>
            </div>

            {/* Quick SOS Contacts */}
            <div className="premium-glass-panel p-6 relative overflow-hidden mt-8 animate-fade-in-up stagger-2 border-t-[3px] border-t-red-500/50">
               <h3 className="font-bold text-xl mb-4 flex items-center gap-3"><Users className="text-red-400" size={24}/> Quick SOS Contacts</h3>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div 
                    onClick={() => window.location.href = 'tel:+919876543210'}
                    className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-red-500/30 transition-all cursor-pointer shadow-inner active:scale-95"
                  >
                     <div>
                        <p className="text-sm font-bold text-slate-200 group-hover:text-red-400 transition-colors">Wife</p>
                        <p className="text-xs text-slate-500">Priya Sharma</p>
                     </div>
                     <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 group-hover:bg-red-500 group-hover:text-white transition-all"><Phone size={18}/></div>
                  </div>
                  <div 
                    onClick={() => window.location.href = 'tel:+919876543211'}
                    className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-red-500/30 transition-all cursor-pointer shadow-inner active:scale-95"
                  >
                     <div>
                        <p className="text-sm font-bold text-slate-200 group-hover:text-red-400 transition-colors">Son</p>
                        <p className="text-xs text-slate-500">Rahul Sharma</p>
                     </div>
                     <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 group-hover:bg-red-500 group-hover:text-white transition-all"><Phone size={18}/></div>
                  </div>
                  <div 
                    onClick={() => window.location.href = 'tel:+919876543212'}
                    className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-red-500/30 transition-all cursor-pointer shadow-inner active:scale-95"
                  >
                     <div>
                        <p className="text-sm font-bold text-slate-200 group-hover:text-red-400 transition-colors">Family Doctor</p>
                        <p className="text-xs text-slate-500">Dr. Vivek</p>
                     </div>
                     <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 group-hover:bg-red-500 group-hover:text-white transition-all"><Phone size={18}/></div>
                  </div>
               </div>
            </div>

            {/* Recent Health Timeline */}
            <div className="premium-glass-panel p-6 relative overflow-hidden mt-8 animate-fade-in-up stagger-3 border-t-[3px] border-t-blue-500/50">
               <h3 className="font-bold text-xl mb-6 flex items-center gap-3"><Clock className="text-blue-400" size={24}/> Recent Health Timeline</h3>
               <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                     <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-blue-500/20 text-blue-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        <Activity size={16}/>
                     </div>
                     <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-slate-900/60 border border-white/5 shadow-inner">
                        <div className="flex items-center justify-between mb-1">
                           <div className="font-bold text-slate-200">Tele-Consultation</div>
                           <time className="font-mono text-xs text-blue-400">Today, 10:30 AM</time>
                        </div>
                        <div className="text-slate-400 text-sm">Consulted with Dr. Vivek regarding mild chest pain. Prescribed rest and ECG.</div>
                     </div>
                  </div>
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                     <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-800 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        <Pill size={16}/>
                     </div>
                     <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-slate-900/40 border border-white/5 shadow-inner opacity-70 hover:opacity-100 transition-opacity">
                        <div className="flex items-center justify-between mb-1">
                           <div className="font-bold text-slate-200">Prescription Refill</div>
                           <time className="font-mono text-xs text-slate-500">Aug 2, 2026</time>
                        </div>
                        <div className="text-slate-400 text-sm">Refilled BP medication (Amlodipine 5mg) from Apollo Pharmacy.</div>
                     </div>
                  </div>
               </div>
            </div>

          </div>

          {/* Side Column - Specialized Care Modules */}
          <div className="space-y-6 animate-fade-in-up stagger-2">
            
            {/* ASHA Worker Widget */}
            <div className="premium-glass-panel p-6 border-t-[3px] border-t-purple-500/50">
              <h3 className="font-bold text-xl mb-4 flex items-center gap-3"><UserPlus className="text-purple-400" size={24}/> Local ASHA Worker</h3>
              <div className="bg-slate-800/50 rounded-2xl border border-white/5 p-4 shadow-inner">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/40 text-purple-400">
                    <img src="https://i.pravatar.cc/150?img=5" alt="ASHA Worker" className="w-full h-full rounded-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200">Lakshmi Devi</h4>
                    <p className="text-xs text-slate-400">Village Health Guide</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 text-xs border-purple-500/30 text-purple-300 hover:bg-purple-500/10"><PhoneCall size={14} className="mr-2"/> Call</Button>
                  <Button variant="primary" className="flex-1 text-xs bg-purple-600 hover:bg-purple-500" onClick={() => setShowTeleConsult(true)}><Video size={14} className="mr-2"/> E-Consult</Button>
                </div>
              </div>
            </div>

            {/* MMU Tracker Widget */}
            <div className="premium-glass-panel p-6 border-t-[3px] border-t-blue-500/50">
              <h3 className="font-bold text-xl mb-4 flex items-center gap-3"><Truck className="text-blue-400" size={24}/> Mobile Medical Unit</h3>
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-4 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl"></div>
                <p className="text-sm font-bold text-blue-300 mb-1">Next Village Visit</p>
                <p className="text-2xl font-black text-white mb-2">Tomorrow, 10 AM</p>
                <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/50 p-2 rounded-lg border border-white/5">
                  <MapPin size={14} className="text-blue-400"/> Primary School Ground
                </div>
              </div>
            </div>

            {/* Medication Reminders */}
            <div className="premium-glass-panel p-6 border-t-[3px] border-t-green-500/50">
              <h3 className="font-bold text-xl mb-6 flex items-center gap-3"><Pill className="text-green-400" size={24}/> Medication Reminders</h3>
              <div className="space-y-3">
                <div className="p-4 bg-slate-800/50 rounded-2xl flex justify-between items-center border border-white/5 shadow-inner hover:bg-slate-800 transition-colors cursor-pointer group">
                  <div><p className="text-sm font-bold text-slate-200 group-hover:text-green-300 transition-colors">Morning Meds</p><p className="text-xs text-slate-400 mt-1">Metformin, Amlodipine</p></div>
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]"><CheckCircle2 size={16}/></div>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-2xl flex justify-between items-center border border-white/5 shadow-inner hover:bg-slate-800 transition-colors cursor-pointer group">
                  <div><p className="text-sm font-bold text-slate-200 group-hover:text-green-300 transition-colors">Afternoon Meds</p><p className="text-xs text-slate-400 mt-1">Vitamin D, B12</p></div>
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]"><CheckCircle2 size={16}/></div>
                </div>
                <div className="p-4 bg-green-500/10 rounded-2xl flex justify-between items-center border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)] hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-shadow cursor-pointer">
                  <div><p className="text-sm font-bold text-green-400">Night Meds</p><p className="text-xs text-green-400/70 mt-1">Atorvastatin (Take in 2 hrs)</p></div>
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/50 text-green-400 animate-pulse"><Pill size={14}/></div>
                </div>
              </div>
            </div>

            {/* Mother & Child */}
            <div className="premium-glass-panel p-6 border-t-[3px] border-t-pink-500/50">
              <h3 className="font-bold text-xl mb-6 flex items-center gap-3"><Baby className="text-pink-400" size={24}/> Mother & Child</h3>
              <div className="flex justify-between items-end mb-6 p-5 bg-slate-800/50 rounded-2xl border border-white/5 shadow-inner">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Pregnancy Wk</p>
                  <p className="text-3xl font-black text-pink-400">Wk 24</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Health Score</p>
                  <p className="text-2xl font-bold text-green-400">85%</p>
                </div>
              </div>
              <div className="p-4 bg-pink-500/10 border border-pink-500/30 rounded-xl text-sm flex items-center justify-between">
                <span className="font-bold text-pink-400 flex items-center gap-2"><CheckCircle2 size={16}/> Next Vax:</span> 
                <span className="font-medium text-slate-200">12 Aug (TT)</span>
              </div>
            </div>

            {/* Weather Alerts */}
            <div className="premium-glass-panel p-6 border-t-[3px] border-t-yellow-500/50 overflow-hidden">
              <h3 className="font-bold text-xl mb-6 flex items-center gap-3 relative z-10"><ThermometerSun className="text-yellow-400" size={24}/> Health Alerts</h3>
              <div className="p-5 bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border border-yellow-500/30 rounded-2xl relative overflow-hidden shadow-inner">
                  {movingStatus === 'NO' && (
                    <div className="bg-orange-900/30 border border-orange-500/50 rounded-2xl p-6 text-left max-w-sm mx-auto shadow-[0_0_30px_rgba(249,115,22,0.2)] mt-4">
                      <p className="text-base font-bold text-orange-300 flex items-center gap-2 mb-3"><AlertCircle size={20} /> STAY PUT</p>
                      <p className="text-white font-medium text-sm leading-relaxed">A doctor will call you shortly to guide you on keeping the patient safe until the {responder} arrives.</p>
                    </div>
                  )}

                  <Button variant="ghost" onClick={() => {setStatus('IDLE'); setSymptoms(''); setMovingStatus(null); setSmartRoute(null); setActiveEmergencyId(null);}} className="mt-8 mx-auto">
                    Dismiss Alert
                  </Button>
                </div>
              )}
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up stagger-1">
              <Link to="/patient/assistant" className="h-full">
                <InteractiveCard glowColor="rgba(59, 130, 246, 0.15)" className="h-full flex flex-col items-start group p-6">
                  <div className="p-3 bg-blue-500/10 rounded-xl mb-4 border border-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform shadow-inner"><Activity size={24}/></div>
                  <h3 className="font-bold text-base mb-1 text-slate-200 group-hover:text-blue-400 transition-colors leading-tight">AI Assistant</h3>
                  <p className="text-xs text-slate-400 mt-auto">Symptom analysis</p>
                </InteractiveCard>
              </Link>
              <Link to="/medicine-search" className="h-full">
                <InteractiveCard glowColor="rgba(20, 184, 166, 0.15)" className="h-full flex flex-col items-start group p-6">
                  <div className="p-3 bg-teal-500/10 rounded-xl mb-4 border border-teal-500/20 text-teal-400 group-hover:scale-110 transition-transform shadow-inner"><Pill size={24}/></div>
                  <h3 className="font-bold text-base mb-1 text-slate-200 group-hover:text-teal-400 transition-colors leading-tight">Medicines</h3>
                  <p className="text-xs text-slate-400 mt-auto">Find nearby stock</p>
                </InteractiveCard>
              </Link>
              <Link to="/health-records" className="h-full">
                <InteractiveCard glowColor="rgba(168, 85, 247, 0.15)" className="h-full flex flex-col items-start group p-6">
                  <div className="p-3 bg-purple-500/10 rounded-xl mb-4 border border-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform shadow-inner"><History size={24}/></div>
                  <h3 className="font-bold text-base mb-1 text-slate-200 group-hover:text-purple-400 transition-colors leading-tight">Records</h3>
                  <p className="text-xs text-slate-400 mt-auto">Medical history</p>
                </InteractiveCard>
              </Link>
              <Link to="/health-map" className="h-full">
                <InteractiveCard glowColor="rgba(34, 197, 94, 0.15)" className="h-full flex flex-col items-start group p-6">
                  <div className="p-3 bg-green-500/10 rounded-xl mb-4 border border-green-500/20 text-green-400 group-hover:scale-110 transition-transform shadow-inner"><Stethoscope size={24}/></div>
                  <h3 className="font-bold text-base mb-1 text-slate-200 group-hover:text-green-400 transition-colors leading-tight">Hospitals</h3>
                  <p className="text-xs text-slate-400 mt-auto">Locate clinics</p>
                </InteractiveCard>
              </Link>
            </div>

            {/* Quick SOS Contacts */}
            <div className="premium-glass-panel p-6 relative overflow-hidden mt-8 animate-fade-in-up stagger-2 border-t-[3px] border-t-red-500/50">
               <h3 className="font-bold text-xl mb-4 flex items-center gap-3"><Users className="text-red-400" size={24}/> Quick SOS Contacts</h3>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div 
                    onClick={() => window.location.href = 'tel:+919876543210'}
                    className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-red-500/30 transition-all cursor-pointer shadow-inner active:scale-95"
                  >
                     <div>
                        <p className="text-sm font-bold text-slate-200 group-hover:text-red-400 transition-colors">Wife</p>
                        <p className="text-xs text-slate-500">Priya Sharma</p>
                     </div>
                     <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 group-hover:bg-red-500 group-hover:text-white transition-all"><Phone size={18}/></div>
                  </div>
                  <div 
                    onClick={() => window.location.href = 'tel:+919876543211'}
                    className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-red-500/30 transition-all cursor-pointer shadow-inner active:scale-95"
                  >
                     <div>
                        <p className="text-sm font-bold text-slate-200 group-hover:text-red-400 transition-colors">Son</p>
                        <p className="text-xs text-slate-500">Rahul Sharma</p>
                     </div>
                     <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 group-hover:bg-red-500 group-hover:text-white transition-all"><Phone size={18}/></div>
                  </div>
                  <div 
                    onClick={() => window.location.href = 'tel:+919876543212'}
                    className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-red-500/30 transition-all cursor-pointer shadow-inner active:scale-95"
                  >
                     <div>
                        <p className="text-sm font-bold text-slate-200 group-hover:text-red-400 transition-colors">Family Doctor</p>
                        <p className="text-xs text-slate-500">Dr. Vivek</p>
                     </div>
                     <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 group-hover:bg-red-500 group-hover:text-white transition-all"><Phone size={18}/></div>
                  </div>
               </div>
            </div>

            {/* Recent Health Timeline */}
            <div className="premium-glass-panel p-6 relative overflow-hidden mt-8 animate-fade-in-up stagger-3 border-t-[3px] border-t-blue-500/50">
               <h3 className="font-bold text-xl mb-6 flex items-center gap-3"><Clock className="text-blue-400" size={24}/> Recent Health Timeline</h3>
               <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                     <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-blue-500/20 text-blue-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        <Activity size={16}/>
                     </div>
                     <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-slate-900/60 border border-white/5 shadow-inner">
                        <div className="flex items-center justify-between mb-1">
                           <div className="font-bold text-slate-200">Tele-Consultation</div>
                           <time className="font-mono text-xs text-blue-400">Today, 10:30 AM</time>
                        </div>
                        <div className="text-slate-400 text-sm">Consulted with Dr. Vivek regarding mild chest pain. Prescribed rest and ECG.</div>
                     </div>
                  </div>
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                     <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-800 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        <Pill size={16}/>
                     </div>
                     <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-slate-900/40 border border-white/5 shadow-inner opacity-70 hover:opacity-100 transition-opacity">
                        <div className="flex items-center justify-between mb-1">
                           <div className="font-bold text-slate-200">Prescription Refill</div>
                           <time className="font-mono text-xs text-slate-500">Aug 2, 2026</time>
                        </div>
                        <div className="text-slate-400 text-sm">Refilled BP medication (Amlodipine 5mg) from Apollo Pharmacy.</div>
                     </div>
                  </div>
               </div>
            </div>

          </div>

          {/* Side Column - Specialized Care Modules */}
          <div className="space-y-6 animate-fade-in-up stagger-2">
            
            {/* ASHA Worker Widget */}
            <div className="premium-glass-panel p-6 border-t-[3px] border-t-purple-500/50">
              <h3 className="font-bold text-xl mb-4 flex items-center gap-3"><UserPlus className="text-purple-400" size={24}/> Local ASHA Worker</h3>
              <div className="bg-slate-800/50 rounded-2xl border border-white/5 p-4 shadow-inner">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/40 text-purple-400">
                    <img src="https://i.pravatar.cc/150?img=5" alt="ASHA Worker" className="w-full h-full rounded-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200">Lakshmi Devi</h4>
                    <p className="text-xs text-slate-400">Village Health Guide</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 text-xs border-purple-500/30 text-purple-300 hover:bg-purple-500/10"><PhoneCall size={14} className="mr-2"/> Call</Button>
                  <Button variant="primary" className="flex-1 text-xs bg-purple-600 hover:bg-purple-500" onClick={() => setShowTeleConsult(true)}><Video size={14} className="mr-2"/> E-Consult</Button>
                </div>
              </div>
            </div>

            {/* MMU Tracker Widget */}
            <div className="premium-glass-panel p-6 border-t-[3px] border-t-blue-500/50">
              <h3 className="font-bold text-xl mb-4 flex items-center gap-3"><Truck className="text-blue-400" size={24}/> Mobile Medical Unit</h3>
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-4 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl"></div>
                <p className="text-sm font-bold text-blue-300 mb-1">Next Village Visit</p>
                <p className="text-2xl font-black text-white mb-2">Tomorrow, 10 AM</p>
                <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/50 p-2 rounded-lg border border-white/5">
                  <MapPin size={14} className="text-blue-400"/> Primary School Ground
                </div>
              </div>
            </div>

            {/* Medication Reminders */}
            <div className="premium-glass-panel p-6 border-t-[3px] border-t-green-500/50">
              <h3 className="font-bold text-xl mb-6 flex items-center gap-3"><Pill className="text-green-400" size={24}/> Medication Reminders</h3>
              <div className="space-y-3">
                <div className="p-4 bg-slate-800/50 rounded-2xl flex justify-between items-center border border-white/5 shadow-inner hover:bg-slate-800 transition-colors cursor-pointer group">
                  <div><p className="text-sm font-bold text-slate-200 group-hover:text-green-300 transition-colors">Morning Meds</p><p className="text-xs text-slate-400 mt-1">Metformin, Amlodipine</p></div>
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]"><CheckCircle2 size={16}/></div>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-2xl flex justify-between items-center border border-white/5 shadow-inner hover:bg-slate-800 transition-colors cursor-pointer group">
                  <div><p className="text-sm font-bold text-slate-200 group-hover:text-green-300 transition-colors">Afternoon Meds</p><p className="text-xs text-slate-400 mt-1">Vitamin D, B12</p></div>
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]"><CheckCircle2 size={16}/></div>
                </div>
                <div className="p-4 bg-green-500/10 rounded-2xl flex justify-between items-center border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)] hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-shadow cursor-pointer">
                  <div><p className="text-sm font-bold text-green-400">Night Meds</p><p className="text-xs text-green-400/70 mt-1">Atorvastatin (Take in 2 hrs)</p></div>
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/50 text-green-400 animate-pulse"><Pill size={14}/></div>
                </div>
              </div>
            </div>

            {/* Mother & Child */}
            <div className="premium-glass-panel p-6 border-t-[3px] border-t-pink-500/50">
              <h3 className="font-bold text-xl mb-6 flex items-center gap-3"><Baby className="text-pink-400" size={24}/> Mother & Child</h3>
              <div className="flex justify-between items-end mb-6 p-5 bg-slate-800/50 rounded-2xl border border-white/5 shadow-inner">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Pregnancy Wk</p>
                  <p className="text-3xl font-black text-pink-400">Wk 24</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Health Score</p>
                  <p className="text-2xl font-bold text-green-400">85%</p>
                </div>
              </div>
              <div className="p-4 bg-pink-500/10 border border-pink-500/30 rounded-xl text-sm flex items-center justify-between">
                <span className="font-bold text-pink-400 flex items-center gap-2"><CheckCircle2 size={16}/> Next Vax:</span> 
                <span className="font-medium text-slate-200">12 Aug (TT)</span>
              </div>
            </div>

            {/* Weather Alerts */}
            <div className="premium-glass-panel p-6 border-t-[3px] border-t-yellow-500/50 overflow-hidden">
              <h3 className="font-bold text-xl mb-6 flex items-center gap-3 relative z-10"><ThermometerSun className="text-yellow-400" size={24}/> Health Alerts</h3>
              <div className="p-5 bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border border-yellow-500/30 rounded-2xl relative overflow-hidden shadow-inner">
                <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-yellow-500/30 rounded-full blur-2xl"></div>
                <p className="font-black text-yellow-400 text-lg mb-2 flex items-center gap-2 relative z-10">Heatwave Warning ⚠️</p>
                <Badge variant="danger" className="mb-3 relative z-10">High Risk: Elderly</Badge>
                <p className="text-sm font-medium text-slate-300 leading-relaxed relative z-10 mt-2">Ensure adequate hydration. Avoid direct sun exposure between 12PM and 4PM.</p>
              </div>
            </div>

          </div>
        </div>
      </PageWrapper>
      
      <TeleConsultModal isOpen={showTeleConsult} onClose={() => setShowTeleConsult(false)} />

      <AnimatedModal
        isOpen={showFirstAid}
        onClose={() => setShowFirstAid(false)}
        title="Offline First Aid Instructions"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <h4 className="font-bold text-red-400 mb-2 flex items-center gap-2"><HeartPulse size={18}/> CPR (No Pulse / Not Breathing)</h4>
            <ol className="text-sm text-slate-300 list-decimal list-inside space-y-1">
              <li>Place the heel of your hand on the center of the chest.</li>
              <li>Place the other hand on top and interlock fingers.</li>
              <li>Push hard and fast (100-120 pushes a minute, 2 inches deep).</li>
              <li>Do not stop until help arrives or they wake up.</li>
            </ol>
          </div>
          
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <h4 className="font-bold text-green-400 mb-2 flex items-center gap-2">🐍 Snake or Insect Bite</h4>
            <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
              <li>Keep the person calm and completely still.</li>
              <li>Keep the bitten area below the level of the heart.</li>
              <li>Remove any tight clothing or jewelry near the bite.</li>
              <li>DO NOT cut the wound or try to suck out venom.</li>
              <li>DO NOT apply a tourniquet or ice.</li>
            </ul>
          </div>
          
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <h4 className="font-bold text-orange-400 mb-2 flex items-center gap-2"><Baby size={18}/> Heavy Bleeding</h4>
            <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
              <li>Apply firm, direct pressure on the wound with a clean cloth.</li>
              <li>Keep pressure applied constantly. Do not lift to check.</li>
              <li>If blood soaks through, add more cloth on top, do not remove the first layer.</li>
              <li>Elevate the injured area if possible.</li>
            </ul>
          </div>
        </div>
      </AnimatedModal>

    </div>
  );
};

export default PatientDashboard;
