import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { LogIn, User, Lock, AlertCircle, Activity, Heart, ShieldAlert } from 'lucide-react';
import InteractiveCard from '../components/ui/InteractiveCard';
import AnimatedInput from '../components/ui/AnimatedInput';
import MagneticButton from '../components/ui/MagneticButton';
import { motion } from 'framer-motion';

const LoginPage = () => {
  const [contactInfo, setContactInfo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(contactInfo, password);
    setLoading(false);
    if (!res.success) {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950">
      
      {/* Left Side - Dynamic Art/Branding */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 border-r border-white/5">
        <div className="absolute inset-0 z-0">
           <div className="absolute top-[10%] left-[20%] w-[80%] h-[80%] rounded-full bg-blue-600/10 blur-[150px] animate-float pointer-events-none"></div>
           <div className="absolute bottom-[10%] right-[10%] w-[60%] h-[60%] rounded-full bg-teal-600/10 blur-[120px] animate-pulse-fast pointer-events-none"></div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 flex items-center gap-3"
        >
          <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center text-blue-400">
            <Activity size={24} />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">CareSphere</span>
        </motion.div>

        <div className="relative z-10 my-auto pr-12">
          <motion.h1 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl font-black text-white leading-tight tracking-tight mb-6"
          >
            Empowering <span className="gradient-text">Rural Health</span> Ecosystems.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl text-slate-400 font-medium leading-relaxed"
          >
            Log in to manage your health records, access emergency services, or dispatch critical care instantly.
          </motion.p>
          
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8, delay: 0.6 }}
             className="flex gap-6 mt-12"
          >
            <div className="flex items-center gap-3 bg-slate-900/50 px-4 py-2 rounded-full border border-white/5">
               <Heart className="text-pink-400" size={18}/> <span className="text-sm font-bold text-slate-300">Live Network</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-900/50 px-4 py-2 rounded-full border border-white/5">
               <ShieldAlert className="text-red-400" size={18}/> <span className="text-sm font-bold text-slate-300">Fast SOS</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full"></div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          <InteractiveCard glowColor="rgba(59, 130, 246, 0.2)" className="p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-slate-900/90 border border-slate-700/50">
            <div className="mb-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-6 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)] group-hover:scale-110 transition-transform">
                <LogIn size={32} />
              </div>
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Welcome Back</h2>
              <p className="text-slate-400">Login to access your dashboard</p>
            </div>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-8"
              >
                <AlertCircle size={20} className="flex-shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatedInput
                label="Email or Phone Number"
                type="text"
                required
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                icon={User}
              />
              
              <AnimatedInput
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={Lock}
              />
              
              <MagneticButton type="submit" variant="primary" className="w-full mt-4 py-4 text-lg" size="lg" disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign In to Platform'}
              </MagneticButton>
            </form>
            
            <div className="mt-8 pt-8 border-t border-white/10 text-center">
              <p className="text-slate-400 font-medium">
                Don't have an account? <Link to="/register" className="text-blue-400 font-bold hover:text-blue-300 transition-colors ml-1">Register here</Link>
              </p>
            </div>
          </InteractiveCard>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
