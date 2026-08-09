import React, { useState, useRef, useEffect } from 'react';
import { Bot, Mic, Send, X, Activity, Cpu, Sparkles, Zap, Radio } from 'lucide-react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const AgentWidget = ({ onAgentAction, voiceLang = 'en-US' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'agent', content: 'Omni-Core online. Neural link established. How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSend = async (text = input) => {
    if (!text.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setIsThinking(true);
    
    try {
      const res = await api.post('/agent/chat', { message: text, language: voiceLang });
      const data = res.data;
      
      // Add agent response
      setMessages(prev => [...prev, { role: 'agent', content: data.response }]);
      
      // Trigger action if needed
      if (data.action !== 'NONE' && onAgentAction) {
        onAgentAction(data.action, data.payload);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'agent', content: 'Connection degraded. Unable to reach Omni-Net.' }]);
    } finally {
      setIsThinking(false);
    }
  };

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = voiceLang;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsRecording(true);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      handleSend(transcript);
    };
    
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);
    
    recognition.start();
  };

  return (
    <div className="fixed bottom-8 right-8 z-[9999] flex flex-col items-end pointer-events-none">
      
      {/* Neural Interface Expand */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50, x: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50, x: 50, transition: { duration: 0.2 } }}
            className="pointer-events-auto bg-slate-950/70 backdrop-blur-2xl border border-blue-500/30 rounded-[2rem] shadow-[0_0_50px_rgba(37,99,235,0.2)] mb-8 w-[90vw] sm:w-[450px] overflow-hidden flex flex-col relative"
            style={{ height: '600px', maxHeight: '80vh' }}
          >
            {/* Ambient Background Glows */}
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-emerald-600/20 rounded-full blur-[100px] pointer-events-none"></div>
            
            {/* Scanner Grid Overlay */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDEwaDQwTTAgMjBoNDBNMCAzMGg0ME0xMCAwdjQwTTIwIDB2NDBNMzAgMHY0MCIgc3Ryb2tlPSIjM2I4MmY2IiBzdHJva2Utb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] pointer-events-none opacity-50 z-0"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50 z-0 shadow-[0_0_10px_#3b82f6] animate-scan"></div>

            {/* Header */}
            <div className="bg-slate-900/50 backdrop-blur-md p-6 border-b border-blue-500/20 flex justify-between items-center relative z-10">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 rounded-full blur-md animate-pulse"></div>
                  <div className="bg-gradient-to-br from-blue-400 to-indigo-600 p-2 rounded-xl text-white relative z-10 border border-blue-300/50 shadow-inner">
                    <Cpu size={24} />
                  </div>
                </div>
                <div>
                  <h3 className="font-black text-xl text-white tracking-widest uppercase">Omni-Core</h3>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Neural Link Active</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10 scrollbar-hide">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'agent' && (
                    <div className="w-8 h-8 rounded-full bg-blue-900/50 border border-blue-500/30 flex items-center justify-center mr-3 mt-1 shrink-0">
                      <Sparkles size={14} className="text-blue-400" />
                    </div>
                  )}
                  <div className={`max-w-[75%] p-4 text-sm font-medium leading-relaxed shadow-lg ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-sm' 
                      : 'bg-slate-800/80 backdrop-blur-md text-slate-200 border border-slate-700/50 rounded-2xl rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex justify-start">
                   <div className="w-8 h-8 rounded-full bg-blue-900/50 border border-blue-500/30 flex items-center justify-center mr-3 shrink-0">
                      <Activity size={14} className="text-blue-400 animate-pulse" />
                    </div>
                  <div className="bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl rounded-tl-sm border border-slate-700/50 text-blue-400 flex items-center gap-2">
                    <span className="animate-pulse">Processing Variables</span>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-75"></div>
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-150"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input Area */}
            <div className="p-5 border-t border-slate-800/50 bg-slate-900/80 backdrop-blur-xl relative z-10">
              <div className="relative flex items-center group">
                <button 
                  onClick={startRecording}
                  className={`absolute left-2 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 z-10 ${isRecording ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-blue-400 hover:bg-slate-700'}`}
                >
                  {isRecording ? <Radio size={18} className="animate-ping" /> : <Mic size={18} />}
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={isRecording ? "Listening to voice input..." : "Command Omni-Core..."}
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-full py-4 pl-14 pr-16 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium placeholder-slate-500 shadow-inner"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className="absolute right-2 w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-full disabled:opacity-30 disabled:bg-slate-800 transition-colors shadow-sm"
                >
                  <Send size={16} className="ml-1" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating 3D Orb */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto w-20 h-20 rounded-full shadow-[0_0_30px_rgba(37,99,235,0.4)] flex items-center justify-center relative group border border-blue-400/20 bg-slate-950"
      >
        {/* Orbital Rings */}
        <div className={`absolute inset-[-4px] rounded-full border border-blue-500/30 ${!isOpen ? 'animate-spin-slow' : ''}`}></div>
        <div className={`absolute inset-[-12px] rounded-full border border-dashed border-indigo-500/20 ${!isOpen ? 'animate-reverse-spin' : ''}`}></div>
        
        {/* Core Glow */}
        <div className={`absolute inset-1 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 blur-sm ${isThinking || isRecording ? 'animate-pulse' : ''} ${isOpen ? 'opacity-50' : 'opacity-100'}`}></div>
        
        {/* Surface */}
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-blue-400/80 to-indigo-900/80 backdrop-blur-md shadow-inner flex items-center justify-center overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 rounded-t-full"></div>
           {isOpen ? <X size={28} className="text-white relative z-10" /> : <Zap size={28} className="text-white relative z-10" />}
        </div>
        
        {/* Status indicator */}
        {!isOpen && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
        )}
      </motion.button>
    </div>
  );
};

export default AgentWidget;
