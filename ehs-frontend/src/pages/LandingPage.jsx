import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldAlert, Heart, Users, WifiOff, Map, ChevronRight, Zap, Video, Menu, X, ArrowRight } from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import InteractiveCard from '../components/ui/InteractiveCard';
import MagneticButton from '../components/ui/MagneticButton';
import AnimatedCounter from '../components/ui/AnimatedCounter';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 shadow-soft-lg py-4' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-medical-500 to-sky-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(20,184,166,0.4)] group-hover:shadow-[0_0_30px_rgba(20,184,166,0.6)] transition-all">
            <Heart size={20} className="fill-white animate-pulse-fast" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">CareSphere</span>
        </Link>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-bold text-slate-300 hover:text-medical-400 transition-colors uppercase tracking-widest">Features</a>
          <a href="#impact" className="text-sm font-bold text-slate-300 hover:text-medical-400 transition-colors uppercase tracking-widest">Impact</a>
          <Link to="/login" className="text-sm font-bold text-slate-300 hover:text-white transition-colors uppercase tracking-widest">Login</Link>
          <Link to="/register">
            <MagneticButton size="sm" className="px-6 py-2 bg-white text-slate-900 hover:bg-slate-200 shadow-none font-bold rounded-xl">
              Get Started
            </MagneticButton>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>
      
      {/* Mobile Nav Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-slate-900 border-b border-slate-800 p-6 flex flex-col gap-4 md:hidden shadow-2xl"
          >
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-300 hover:text-white">Features</a>
            <a href="#impact" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-300 hover:text-white">Impact</a>
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-300 hover:text-white">Login</Link>
            <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="mt-4">
              <button className="w-full py-4 rounded-xl bg-medical-500 text-white font-bold text-lg">Get Started</button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const LandingPage = () => {
  const { scrollYProgress } = useScroll();
  const yBg1 = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const yBg2 = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <div className="min-h-screen flex flex-col relative bg-[#030712] selection:bg-medical-500/30 text-slate-200 font-sans">
      <Navbar />

      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div style={{ y: yBg1 }} className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-medical-600/10 blur-[120px] mix-blend-screen animate-float"></motion.div>
        <motion.div style={{ y: yBg2 }} className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-indigo-600/10 blur-[120px] mix-blend-screen animate-float-delayed"></motion.div>
        <div className="absolute top-[40%] left-[30%] w-[30vw] h-[30vw] rounded-full bg-emerald-600/10 blur-[120px] animate-pulse mix-blend-screen"></div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik02MCAwaC0xdjYwSDB2LTFoNjBWMEgwdjFINThWMHoiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyIvPjwvZz48L3N2Zz4=')] opacity-50 z-0 pointer-events-none"></div>
      </div>

      {/* Hero Section */}
      <motion.div 
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="flex-1 flex flex-col items-center justify-center text-center p-6 min-h-screen relative z-10 pt-24"
      >
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-2.5 rounded-full mb-8 inline-flex items-center gap-3 shadow-[0_0_30px_rgba(20,184,166,0.15)] hover:bg-white/10 transition-colors"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-medical-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-medical-500 shadow-[0_0_10px_rgba(20,184,166,0.8)]"></span>
          </span>
          <span className="text-white text-xs font-bold tracking-[0.2em] uppercase flex items-center gap-2">
            CareSphere v3.0 Is Live <Zap size={14} className="text-yellow-400 fill-yellow-400"/>
          </span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-6xl md:text-8xl lg:text-[7.5rem] font-black tracking-tighter mb-6 max-w-6xl leading-[1.05] text-white"
        >
          Next-Gen <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-medical-400 via-sky-400 to-indigo-400 drop-shadow-sm">Rural Healthcare</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-2xl text-slate-400 max-w-3xl mb-12 font-medium leading-relaxed"
        >
          Bridging the gap in rural emergency care through predictive AI triage, instant dispatching, and community-driven responder networks.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-5 items-center w-full sm:w-auto"
        >
          <Link to="/register" className="w-full sm:w-auto">
            <MagneticButton className="w-full sm:w-auto px-10 py-5 text-lg font-black uppercase tracking-widest bg-white text-slate-950 hover:bg-slate-100 shadow-[0_0_40px_rgba(255,255,255,0.2)] rounded-2xl flex items-center justify-center gap-3 group border-none">
              Join the Network <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform"/>
            </MagneticButton>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <MagneticButton className="w-full sm:w-auto px-10 py-5 text-lg font-black uppercase tracking-widest bg-medical-500/10 text-medical-400 border border-medical-500/30 hover:bg-medical-500/20 rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(20,184,166,0.1)]">
              <ShieldAlert size={22} /> Emergency SOS
            </MagneticButton>
          </Link>
        </motion.div>
      </motion.div>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-24"
          >
            <h3 className="text-5xl md:text-6xl font-black mb-6 tracking-tight text-white">The Ecosystem</h3>
            <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto">A comprehensive, lightning-fast suite designed for rapid, life-saving response in low-resource settings.</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <Activity className="text-sky-400" size={32}/>, title: "AI Health Assistant", desc: "Instant AI triage and risk assessment using advanced NLP algorithms.", color: "sky", glow: "rgba(14, 165, 233, 0.15)" },
              { icon: <ShieldAlert className="text-red-400" size={32}/>, title: "Rural SOS Network", desc: "Direct dispatch for agri-emergencies to local hospitals and MMUs.", color: "red", glow: "rgba(239, 68, 68, 0.15)" },
              { icon: <Users className="text-purple-400" size={32}/>, title: "ASHA Integration", desc: "Connect instantly with local Village Health Guides for on-ground support.", color: "purple", glow: "rgba(168, 85, 247, 0.15)" },
              { icon: <Video className="text-emerald-400" size={32}/>, title: "Tele-Consultations", desc: "Remote video consultations bridging the gap with urban specialists.", color: "emerald", glow: "rgba(16, 185, 129, 0.15)" },
              { icon: <WifiOff className="text-orange-400" size={32}/>, title: "Offline Fallback", desc: "Automated SMS routing ensuring SOS delivery even without 4G/5G.", color: "orange", glow: "rgba(249, 115, 22, 0.15)" },
              { icon: <Map className="text-indigo-400" size={32}/>, title: "Smart Routing", desc: "AI-driven traffic and terrain analysis for fastest ambulance dispatch.", color: "indigo", glow: "rgba(99, 102, 241, 0.15)" },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <InteractiveCard glowColor={f.glow} className="h-full p-8 group bg-white/[0.02] border-white/10 hover:border-white/20 backdrop-blur-md rounded-3xl transition-all duration-500 shadow-xl">
                  <div className={`w-16 h-16 rounded-2xl bg-${f.color}-500/10 border border-${f.color}-500/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-${f.color}-500/20 transition-all duration-500 shadow-[0_0_20px_${f.glow}]`}>
                    {f.icon}
                  </div>
                  <h4 className="font-bold text-2xl mb-3 text-white tracking-tight">{f.title}</h4>
                  <p className="text-slate-400 leading-relaxed font-medium">{f.desc}</p>
                </InteractiveCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="impact" className="relative z-10 py-32 px-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[500px] bg-gradient-to-r from-medical-600/20 via-sky-600/20 to-indigo-600/20 blur-[120px] rounded-full pointer-events-none z-[-1]"></div>
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/[0.03] backdrop-blur-2xl rounded-[3rem] p-16 md:p-24 text-center relative border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-50"></div>
            
            <motion.h3 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="text-5xl md:text-7xl font-black mb-24 relative z-10 tracking-tighter text-white"
            >
              Real-World Impact
            </motion.h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 relative z-10">
              {[
                { val: 500, suffix: "+", label: "Villages Connected", color: "from-medical-400 to-sky-400" },
                { val: 1000, suffix: "+", label: "Volunteers Ready", color: "from-sky-400 to-indigo-400" },
                { val: 50, suffix: "+", label: "Hospitals Linked", color: "from-emerald-400 to-medical-400" },
                { val: 5000, suffix: "+", label: "Lives Saved", color: "from-purple-400 to-pink-400" },
              ].map((s, i) => (
                <div key={i} className="group cursor-default">
                  <div className={`text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r ${s.color} mb-4 group-hover:scale-110 transition-transform duration-500 drop-shadow-sm`}>
                    <AnimatedCounter to={s.val} suffix={s.suffix} duration={2.5 + (i * 0.2)} />
                  </div>
                  <div className="text-slate-400 font-bold uppercase tracking-widest text-xs md:text-sm">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <footer className="relative z-10 border-t border-white/10 bg-[#020617] pt-24 pb-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col items-center text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Ready to transform healthcare?</h2>
          <p className="text-slate-400 max-w-2xl mb-12 text-lg">Join the CareSphere network today as a hospital, volunteer, or patient and be part of the change.</p>
          <div className="flex flex-col sm:flex-row gap-6 mb-24 w-full sm:w-auto">
            <Link to="/register" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-medical-500 hover:bg-medical-400 text-white font-black uppercase tracking-widest text-lg transition-colors shadow-[0_0_30px_rgba(20,184,166,0.3)]">Get Started</button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-lg border border-white/10 transition-colors">Sign In</button>
            </Link>
          </div>
          
          <div className="w-full border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Heart size={20} className="text-medical-500 fill-medical-500" />
              <span className="text-xl font-black text-white tracking-tight">CareSphere</span>
            </div>
            <p className="text-slate-500 font-medium text-sm">© 2026 CareSphere Ecosystem. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
