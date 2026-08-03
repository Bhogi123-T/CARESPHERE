import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldAlert, Heart, Users, WifiOff, Map, ChevronRight, Zap, Video } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import InteractiveCard from '../components/ui/InteractiveCard';
import MagneticButton from '../components/ui/MagneticButton';
import AnimatedCounter from '../components/ui/AnimatedCounter';

const LandingPage = () => {
  const { scrollYProgress } = useScroll();
  
  // Parallax effects for background meshes
  const yBg1 = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const yBg2 = useTransform(scrollYProgress, [0, 1], [0, -300]);
  
  // Fade out hero text on scroll
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-950">
      
      {/* Dynamic Background Mesh with Parallax - Darkened */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <motion.div style={{ y: yBg1 }} className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-medical-900/20 blur-[150px] animate-float"></motion.div>
        <motion.div style={{ y: yBg2 }} className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-sky-900/20 blur-[150px] animate-float-delayed"></motion.div>
        <div className="absolute top-[30%] left-[40%] w-[50%] h-[50%] rounded-full bg-emerald-900/20 blur-[150px] animate-pulse-fast"></div>
      </div>

      {/* Hero Section */}
      <motion.div 
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="flex-1 flex flex-col items-center justify-center text-center p-6 mt-20 relative z-10"
      >
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-slate-900/80 backdrop-blur-md px-6 py-2.5 rounded-full mb-10 inline-flex items-center gap-3 border border-slate-700 shadow-sm hover:scale-105 transition-transform duration-300 cursor-default"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-medical-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-medical-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]"></span>
          </span>
          <span className="text-medical-400 text-sm font-bold tracking-widest uppercase flex items-center gap-2">
            CareSphere v3.0 Live <Zap size={14} className="text-yellow-500 fill-yellow-500 animate-pulse"/>
          </span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tight mb-8 max-w-6xl leading-[1.1] text-slate-100"
        >
          AI-Powered <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-medical-400 to-sky-400">Rural Healthcare</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-2xl text-slate-400 max-w-3xl mb-14 font-medium leading-relaxed"
        >
          Bridging the gap in rural emergency care through predictive AI triage, instant dispatching, and community-driven responder networks.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 mb-24 z-20 relative items-center"
        >
          <Link to="/register">
            <MagneticButton variant="primary" size="lg" className="px-10 py-5 text-lg group w-full sm:w-auto shadow-medical-500/30">
              Join the Network <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform"/>
            </MagneticButton>
          </Link>
          <Link to="/login">
            <MagneticButton variant="danger" size="lg" className="px-8 py-5 text-lg group w-full sm:w-auto shadow-red-500/30">
              <ShieldAlert size={22} className="group-hover:scale-110 transition-transform"/> Emergency SOS
            </MagneticButton>
          </Link>
          <Link to="/analytics/models">
            <MagneticButton variant="secondary" size="lg" className="px-8 py-5 text-lg group w-full sm:w-auto border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700">
              <Activity size={22} className="group-hover:rotate-12 transition-transform text-medical-400"/> AI Analytics
            </MagneticButton>
          </Link>
        </motion.div>
      </motion.div>

      {/* Features Section */}
      <div className="relative z-10 py-32 px-6 bg-slate-900 border-y border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-800/30 to-transparent pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-24"
          >
            <h3 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight text-slate-100">Ecosystem Features</h3>
            <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto">A comprehensive, lightning-fast suite designed for rapid, life-saving response.</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <Activity className="text-sky-400" size={32}/>, title: "AI Health Assistant", desc: "Instant AI triage and risk assessment using advanced NLP algorithms.", color: "sky", glow: "rgba(14, 165, 233, 0.25)" },
              { icon: <ShieldAlert className="text-red-400" size={32}/>, title: "Rural SOS Network", desc: "Direct dispatch for agri-emergencies to local hospitals and MMUs.", color: "red", glow: "rgba(239, 68, 68, 0.25)" },
              { icon: <Users className="text-purple-400" size={32}/>, title: "ASHA Integration", desc: "Connect instantly with local Village Health Guides for on-ground support.", color: "purple", glow: "rgba(168, 85, 247, 0.25)" },
              { icon: <Video className="text-medical-400" size={32}/>, title: "Tele-Consultations", desc: "Remote video consultations bridging the gap with urban specialists.", color: "medical", glow: "rgba(20, 184, 166, 0.25)" },
              { icon: <WifiOff className="text-slate-400" size={32}/>, title: "Offline Support", desc: "Automated SMS fallback ensuring SOS delivery even without internet.", color: "slate", glow: "rgba(148, 163, 184, 0.25)" },
              { icon: <Map className="text-yellow-400" size={32}/>, title: "MMU Tracking", desc: "Live schedules for Mobile Medical Units visiting rural communities.", color: "yellow", glow: "rgba(250, 204, 21, 0.25)" },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <InteractiveCard glowColor={f.glow} className="h-full p-8 group bg-slate-800 border-slate-700">
                  <div className={`w-16 h-16 rounded-2xl bg-${f.color}-900/30 border border-${f.color}-700/50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-${f.color}-800/50 transition-all duration-500`}>
                    {f.icon}
                  </div>
                  <h4 className="font-bold text-2xl mb-3 text-slate-100 transition-colors">{f.title}</h4>
                  <p className="text-slate-400 leading-relaxed text-lg transition-colors">{f.desc}</p>
                </InteractiveCard>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative z-10 py-40 px-6 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[500px] bg-gradient-to-r from-medical-900 via-sky-900 to-emerald-900 blur-[100px] rounded-full pointer-events-none z-[-1]"></div>
        <div className="max-w-7xl mx-auto">
          <div className="bg-slate-800/80 backdrop-blur-xl rounded-3xl p-16 md:p-24 text-center relative border border-slate-700 shadow-soft-lg">
            
            <motion.h3 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="text-5xl md:text-6xl font-black mb-24 relative z-10 tracking-tight text-slate-100"
            >
              Real-World Impact
            </motion.h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 relative z-10">
              {[
                { val: 500, suffix: "+", label: "Villages Connected", color: "from-medical-400 to-sky-400" },
                { val: 1000, suffix: "+", label: "Volunteers Ready", color: "from-sky-400 to-indigo-400" },
                { val: 50, suffix: "+", label: "Hospitals Integrated", color: "from-emerald-400 to-medical-400" },
                { val: 5000, suffix: "+", label: "Lives Impacted", color: "from-purple-400 to-pink-400" },
              ].map((s, i) => (
                <div key={i} className="hover:scale-110 transition-transform duration-500 cursor-default">
                  <div className={`text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r ${s.color} mb-4`}>
                    <AnimatedCounter to={s.val} suffix={s.suffix} duration={2.5 + (i * 0.2)} />
                  </div>
                  <div className="text-slate-400 font-bold uppercase tracking-widest text-sm">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-900 py-12 text-center border-t border-slate-800">
        <p className="text-slate-500 mb-6 font-medium text-lg">© 2026 CareSphere Ecosystem. All rights reserved.</p>
        <div className="flex justify-center gap-8">
          <Link to="/login" className="text-slate-400 hover:text-medical-400 hover:underline transition-all font-bold">Authentication</Link>
          <Link to="/register" className="text-slate-400 hover:text-medical-400 hover:underline transition-all font-bold">Register</Link>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
