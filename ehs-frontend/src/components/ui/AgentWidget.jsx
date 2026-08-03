import React, { useState, useRef, useEffect } from 'react';
import { Bot, Mic, Send, X, Activity } from 'lucide-react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const AgentWidget = ({ onAgentAction, voiceLang = 'en-US' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'agent', content: 'Hi, I am CareSphere AI. How can I help you today?' }
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
      setMessages(prev => [...prev, { role: 'agent', content: 'Sorry, I am having trouble connecting to the network right now.' }]);
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
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-slate-900 border border-blue-500/30 rounded-2xl shadow-2xl mb-4 w-80 sm:w-96 overflow-hidden flex flex-col"
            style={{ height: '400px' }}
          >
            {/* Header */}
            <div className="bg-blue-600/20 p-4 border-b border-blue-500/20 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="bg-blue-500 p-1.5 rounded-full text-white"><Bot size={18} /></div>
                <h3 className="font-bold text-blue-400">CareSphere AI Agent</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 p-3 rounded-2xl rounded-bl-none border border-slate-700 text-slate-400 flex gap-1">
                    <span className="animate-bounce">.</span><span className="animate-bounce delay-75">.</span><span className="animate-bounce delay-150">.</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input Area */}
            <div className="p-3 border-t border-slate-800 bg-slate-900/50 flex gap-2">
              <button 
                onClick={startRecording}
                className={`p-2 rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-blue-400'}`}
              >
                <Mic size={20} />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type or speak..."
                className="flex-1 bg-slate-800 border-none rounded-full px-4 text-sm text-white focus:ring-1 focus:ring-blue-500"
              />
              <button 
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="p-2 bg-blue-600 text-white rounded-full disabled:opacity-50 disabled:bg-slate-700"
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.5)] transition-transform hover:scale-110 flex items-center justify-center relative group"
      >
        {isOpen ? <X size={24} /> : <Bot size={24} />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
        )}
      </button>
    </div>
  );
};

export default AgentWidget;
