import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, CheckCircle2, ChevronLeft, Bot, Send, User as UserIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const AIHealthAssistant = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: "Hello! I am your CareSphere AI Assistant. Please describe your symptoms in detail, and I will perform an initial triage assessment." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userMsg }]);
    setLoading(true);
    
    try {
      const response = await api.post('/risk', { symptoms: userMsg });
      const analysis = response.data;
      
      let aiResponseText = '';
      if (analysis.risk === 'HIGH') {
        aiResponseText = `⚠️ **CRITICAL RISK DETECTED**\n\n${analysis.message}\n\nPlease trigger an Emergency SOS immediately.`;
      } else if (analysis.risk === 'MEDIUM') {
        aiResponseText = `⚠️ **MODERATE RISK**\n\n${analysis.message}\n\nAction: ${analysis.action}. Please consult a local health worker or visit the nearest clinic.`;
      } else {
        aiResponseText = `✅ **LOW RISK**\n\n${analysis.message}\n\nAction: ${analysis.action}. Monitor your symptoms and stay hydrated.`;
      }

      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: aiResponseText, risk: analysis.risk }]);
        setLoading(false);
      }, 1000); // Simulate "thinking" delay
      
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: "I'm having trouble connecting to the analysis engine right now. If you are experiencing an emergency, please trigger the SOS manually.", risk: 'UNKNOWN' }]);
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-teal-500/30 flex flex-col">
      <header className="bg-white/90 backdrop-blur-md p-4 border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/patient/dashboard" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors text-slate-600 shadow-sm">
              <ChevronLeft size={20} />
            </Link>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100 shadow-sm">
              <Bot size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wider text-slate-900">AI TRIAGE ASSISTANT</h1>
              <p className="text-slate-500 text-xs flex items-center gap-1 mt-1 font-medium">Powered by CareSphere Engine</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 flex flex-col h-[calc(100vh-100px)]">
        
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50 rounded-3xl p-6 mb-4 flex flex-col gap-6 custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 max-w-[85%] animate-fade-in-up ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                msg.sender === 'user' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-teal-50 text-teal-600 border border-teal-100'
              }`}>
                {msg.sender === 'user' ? <UserIcon size={20} /> : <Bot size={20} />}
              </div>
              
              <div className={`p-5 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                msg.sender === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-sm' 
                  : msg.risk === 'HIGH'
                    ? 'bg-red-50 border border-red-200 text-red-700 rounded-tl-sm shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                    : msg.risk === 'MEDIUM'
                      ? 'bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-tl-sm'
                      : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'
              }`}>
                <div className="whitespace-pre-wrap">{msg.text}</div>
                
                {msg.risk === 'HIGH' && (
                  <button 
                    onClick={() => navigate('/patient/dashboard')}
                    className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-bold uppercase tracking-wider w-full shadow-sm animate-glow-pulse flex items-center justify-center gap-2 text-white"
                  >
                    <ShieldAlert size={16}/> Trigger SOS Now
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex gap-4 max-w-[80%] animate-fade-in-up">
              <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100 shadow-sm">
                <Bot size={20} />
              </div>
              <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl rounded-tl-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border border-slate-200 p-2 rounded-full flex items-end shadow-md">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your symptoms here..."
            className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 resize-none p-4 max-h-32 text-slate-800 placeholder:text-slate-400 font-medium"
            rows="1"
            style={{ minHeight: '56px' }}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="w-12 h-12 m-1 shrink-0 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:hover:bg-teal-600 rounded-full flex items-center justify-center text-white transition-colors shadow-sm"
          >
            <Send size={20} className="ml-1" />
          </button>
        </div>
      </main>
    </div>
  );
};

export default AIHealthAssistant;
