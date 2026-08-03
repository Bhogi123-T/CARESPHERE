import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { LogIn, User, Lock, AlertCircle, Activity, Heart, ShieldAlert } from 'lucide-react';
import InteractiveCard from '../components/ui/InteractiveCard';
import AnimatedInput from '../components/ui/AnimatedInput';
import MagneticButton from '../components/ui/MagneticButton';
import ThemeToggle from '../components/ui/ThemeToggle';
import LanguageToggle from '../components/ui/LanguageToggle';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';

const LoginPage = () => {
  const [contactInfo, setContactInfo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();

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
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      
      {/* Left Side - Dynamic Art/Branding */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-teal-500 to-cyan-600 dark:from-teal-800 dark:to-cyan-900 border-r border-teal-200 dark:border-teal-800 shadow-sm">
        <div className="absolute inset-0 z-0">
           <div className="absolute top-[10%] left-[20%] w-[80%] h-[80%] rounded-full bg-white/20 blur-[150px] animate-float pointer-events-none"></div>
           <div className="absolute bottom-[10%] right-[10%] w-[60%] h-[60%] rounded-full bg-teal-100/20 blur-[120px] animate-pulse-fast pointer-events-none"></div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 flex items-center gap-3"
        >
          <div className="w-12 h-12 bg-white border border-white/30 rounded-xl flex items-center justify-center text-teal-600 shadow-sm">
            <Activity size={24} />
          </div>
          <span className="text-2xl font-black tracking-tight text-white drop-shadow-sm">CareSphere</span>
        </motion.div>

        <div className="relative z-10 my-auto pr-12">
          <motion.h1 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl font-black text-white leading-tight tracking-tight mb-6 drop-shadow-sm"
          >
            Empowering <span className="text-teal-100">Rural Health</span> Ecosystems.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl text-teal-50 font-medium leading-relaxed drop-shadow-sm"
          >
            Log in to manage your health records, access emergency services, or dispatch critical care instantly.
          </motion.p>
          
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8, delay: 0.6 }}
             className="flex gap-6 mt-12"
          >
            <div className="flex items-center gap-3 bg-white/20 px-4 py-2 rounded-full border border-white/30 shadow-sm backdrop-blur-sm">
               <Heart className="text-pink-100" size={18}/> <span className="text-sm font-bold text-white">Live Network</span>
            </div>
            <div className="flex items-center gap-3 bg-white/20 px-4 py-2 rounded-full border border-white/30 shadow-sm backdrop-blur-sm">
               <ShieldAlert className="text-red-100" size={18}/> <span className="text-sm font-bold text-white">Fast SOS</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-100 dark:bg-teal-900/30 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute top-6 right-6 flex gap-2 z-50">
           <LanguageToggle />
           <ThemeToggle />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          <InteractiveCard glowColor="rgba(13, 148, 136, 0.1)" className="p-10 shadow-soft bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="mb-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-900/30 border border-teal-100 dark:border-teal-800 text-teal-600 dark:text-teal-400 mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <LogIn size={32} />
              </div>
              <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Welcome Back</h2>
              <p className="text-slate-500 dark:text-slate-400">Login to access your dashboard</p>
            </div>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm mb-8 shadow-sm"
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
              
              <MagneticButton type="submit" variant="primary" className="w-full mt-4 py-4 text-lg bg-teal-600 hover:bg-teal-700 text-white shadow-sm" size="lg" disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign In to Platform'}
              </MagneticButton>
            </form>
            
            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Don't have an account? <Link to="/register" className="text-teal-600 dark:text-teal-400 font-bold hover:text-teal-700 dark:hover:text-teal-300 transition-colors ml-1">Register here</Link>
              </p>
            </div>
          </InteractiveCard>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
