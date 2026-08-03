import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Video, ShieldAlert, Activity, Heart, AlertTriangle, MessageSquare, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MagneticButton from '../components/ui/MagneticButton';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const TeleConsultation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const roomName = location.state?.roomName || `CareSphere_Emergency_${Math.floor(Math.random() * 10000)}`;
  
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [vitals, setVitals] = useState({ heart_rate: 75, blood_pressure: '120/80', spo2: 98 });
  const [mlInsight, setMlInsight] = useState(null);
  const [socket, setSocket] = useState(null);
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    // Connect to WebSocket server
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5000';
    const newSocket = io(backendUrl);
    setSocket(newSocket);

    // Join the emergency room for this consultation
    newSocket.emit('join_emergency_room', { emergency_id: roomName });

    // Listen for new chat messages
    newSocket.on('receive_message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    // Listen for AI anomaly alerts
    newSocket.on('ml_anomaly_alert', (data) => {
      console.warn("AI ANOMALY ALERT:", data);
      setMlInsight(data);
      // Auto-hide alert after 10 seconds if it normalizes
      setTimeout(() => setMlInsight(null), 10000);
    });

    // Listen for regular risk updates (optional to display)
    newSocket.on('realtime_risk_update', (data) => {
      if (!data.is_anomaly) {
        setMlInsight(null);
      }
    });

    return () => newSocket.close();
  }, [roomName]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;
    
    socket.emit('send_message', {
      emergency_id: roomName,
      sender_role: user?.role || 'patient',
      message: newMessage
    });
    
    setNewMessage('');
  };

  useEffect(() => {
    // Simulate iframe load time for UI purposes
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    // Simulate Gathering Vitals from a smart watch / IoT device
    const vitalsInterval = setInterval(() => {
      const newVitals = {
        heart_rate: Math.floor(Math.random() * (130 - 60 + 1) + 60), // Random HR between 60 and 130
        spo2: Math.floor(Math.random() * (100 - 88 + 1) + 88), // Random SpO2 between 88 and 100
        blood_pressure: `${Math.floor(Math.random() * (165 - 100 + 1) + 100)}/${Math.floor(Math.random() * (105 - 60 + 1) + 60)}`
      };
      
      setVitals(newVitals);
      
      // Push vitals continuously to ML inference engine on backend
      socket.emit('stream_vitals', {
        emergency_id: roomName,
        ...newVitals
      });
      
    }, 2000); // Send data every 2 seconds

    return () => clearInterval(vitalsInterval);
  }, [socket, roomName]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 p-4 sticky top-0 z-50 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Video className="text-teal-600" size={20} />
              Secure Tele-Consultation
            </h1>
            <p className="text-sm text-green-600 flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              End-to-End Encrypted (Room: {roomName})
            </p>
          </div>
        </div>
        
        <MagneticButton variant="danger" size="sm" onClick={() => navigate('/patient/dashboard')}>
          End Call
        </MagneticButton>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6 flex flex-col lg:flex-row gap-6 relative">
        {/* Video Feed */}
        <div className="flex-1 relative flex flex-col">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm z-10 rounded-2xl border border-slate-200">
              <div className="w-16 h-16 rounded-full border-4 border-teal-100 border-t-teal-500 animate-spin mb-4"></div>
              <p className="text-slate-600 font-medium">Connecting to secure video server...</p>
            </div>
          )}
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 bg-black rounded-2xl overflow-hidden shadow-sm relative min-h-[400px] border border-slate-200"
          >
            {/* Using Jitsi Meet Public Server for demo purposes */}
            <iframe
              src={`https://meet.jit.si/${roomName}#config.prejoinPageEnabled=false&config.disableDeepLinking=true`}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="w-full h-full border-0"
              title="Tele-Consultation Video"
            />
          </motion.div>
          
          <div className="mt-4 p-4 rounded-xl bg-teal-50 border border-teal-100 flex items-start gap-3 shadow-sm">
            <ShieldAlert className="text-teal-600 shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-teal-800">
              <strong>Note:</strong> This is a secure WebRTC connection. No data is stored on our servers. Please allow camera and microphone permissions when prompted by your browser.
            </p>
          </div>
        </div>

        {/* Real-time AI Vitals Panel */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm"
          >
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
              <Activity className="text-teal-600" size={20} />
              Live AI Diagnostics
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100 shadow-sm">
                <span className="text-slate-500 text-sm font-medium">Heart Rate</span>
                <div className="flex items-center gap-2">
                  <Heart size={16} className={`\${vitals.heart_rate > 100 ? 'text-red-500 animate-pulse' : 'text-green-500'}`} />
                  <span className="text-xl font-bold text-slate-800">{vitals.heart_rate} <span className="text-xs text-slate-500">bpm</span></span>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100 shadow-sm">
                <span className="text-slate-500 text-sm font-medium">SpO2</span>
                <div className="flex items-center gap-2">
                  <Activity size={16} className={`\${vitals.spo2 < 92 ? 'text-red-500' : 'text-teal-600'}`} />
                  <span className="text-xl font-bold text-slate-800">{vitals.spo2} <span className="text-xs text-slate-500">%</span></span>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100 shadow-sm">
                <span className="text-slate-500 text-sm font-medium">Blood Pressure</span>
                <span className="text-lg font-bold text-slate-800">{vitals.blood_pressure}</span>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500 text-center mb-2 font-medium">Streaming to Neural Engine</p>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden shadow-inner">
                <div className="bg-teal-500 h-1.5 rounded-full w-full animate-pulse"></div>
              </div>
            </div>
          </motion.div>

          {/* Dynamic AI Alert Display */}
          <AnimatePresence>
            {mlInsight && mlInsight.is_anomaly && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-red-600 shrink-0 mt-1 animate-pulse" size={24} />
                  <div>
                    <h3 className="text-red-700 font-bold text-lg leading-none mb-2">AI ANOMALY DETECTED</h3>
                    <p className="text-red-600/80 text-sm mb-3">
                      The predictive model detected critical instability in the patient's real-time vitals stream.
                    </p>
                    
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-red-600">Risk Score: {mlInsight.risk_score}/100</p>
                      {mlInsight.reasons && mlInsight.reasons.map((reason, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-xs text-red-500">
                          <div className="w-1 h-1 rounded-full bg-red-500"></div>
                          {reason}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Real-time Chat Panel */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col h-64 md:h-80"
          >
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
              <MessageSquare className="text-teal-600" size={16} />
              Emergency Chat
            </h2>
            
            <div className="flex-1 overflow-y-auto mb-3 space-y-2 pr-2 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center font-medium">
                  <MessageSquare size={24} className="mb-2 opacity-30 text-slate-500" />
                  No messages yet. Use this chat if video/audio is unstable.
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`text-sm p-2.5 rounded-xl max-w-[85%] shadow-sm \${msg.sender_role === (user?.role || 'patient') ? 'bg-teal-600 text-white ml-auto rounded-tr-none' : 'bg-slate-50 text-slate-800 mr-auto rounded-tl-none border border-slate-200'}`}>
                    <div className={`text-[9px] uppercase tracking-wider opacity-70 mb-0.5 font-bold \${msg.sender_role === (user?.role || 'patient') ? 'text-teal-100' : 'text-slate-500'}`}>
                      {msg.sender_role}
                    </div>
                    {msg.message}
                  </div>
                ))
              )}
            </div>
            
            <form onSubmit={sendMessage} className="relative mt-auto">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl py-2.5 pl-3 pr-10 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all shadow-inner placeholder:text-slate-400"
              />
              <button 
                type="submit" 
                disabled={!newMessage.trim()}
                className="absolute right-1.5 top-1.5 p-1.5 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-teal-600"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TeleConsultation;
