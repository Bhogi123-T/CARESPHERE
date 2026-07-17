import React, { useState, useEffect } from 'react';
import { X, Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import AnimatedModal from './AnimatedModal';

import { useAuth } from '../../context/AuthContext';

const TeleConsultModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [callStatus, setCallStatus] = useState('connecting'); // connecting, connected, ended

  useEffect(() => {
    if (isOpen) {
      setCallStatus('connecting');
      const timer = setTimeout(() => {
        setCallStatus('connected');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} className="max-w-3xl w-full p-0 overflow-hidden bg-slate-950 border-slate-700">
      <div className="flex flex-col h-[600px] relative">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-600 overflow-hidden">
              <img src="https://i.pravatar.cc/150?img=33" alt="Doctor" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg leading-tight">Dr. Rakesh Kumar</h3>
              <p className="text-green-400 text-xs font-medium flex items-center gap-1">
                {callStatus === 'connecting' ? (
                  <span className="animate-pulse">Connecting to PHC...</span>
                ) : (
                  <>02:14 <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse ml-1"></span></>
                )}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-black/40 hover:bg-red-500/20 text-white rounded-full transition-colors backdrop-blur-md">
            <X size={20} />
          </button>
        </div>

        {/* Video Area */}
        <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
          {callStatus === 'connecting' ? (
            <div className="text-center">
              <div className="w-20 h-20 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin mx-auto mb-4"></div>
              <p className="text-slate-300 font-medium animate-pulse">Establishing Secure Connection...</p>
            </div>
          ) : (
            <iframe
              src={`https://meet.jit.si/CareSphere_TeleConsult_${user?.id || 'guest'}#config.prejoinPageEnabled=false`}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="w-full h-full border-0"
              title="Secure Tele-Consultation"
            />
          )}
        </div>

        {/* Controls - We can hide these since Jitsi has its own controls, or keep them to just end the call from our UI */}
        <div className="h-20 bg-slate-900/90 backdrop-blur-xl border-t border-slate-700/50 flex items-center justify-center gap-6 z-20">
          <button 
            onClick={() => setIsMicOn(!isMicOn)}
            className={`p-4 rounded-full transition-all ${isMicOn ? 'bg-slate-700/50 text-white hover:bg-slate-600' : 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'}`}
          >
            {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
          </button>
          
          <button 
            onClick={() => {
              setCallStatus('ended');
              setTimeout(onClose, 500);
            }}
            className="p-4 px-8 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all flex items-center gap-2 font-bold"
          >
            <PhoneOff size={24} /> End Call
          </button>

          <button 
            onClick={() => setIsVideoOn(!isVideoOn)}
            className={`p-4 rounded-full transition-all ${isVideoOn ? 'bg-slate-700/50 text-white hover:bg-slate-600' : 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'}`}
          >
            {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
          </button>
        </div>
      </div>
    </AnimatedModal>
  );
};

export default TeleConsultModal;
