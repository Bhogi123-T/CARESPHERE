import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Lock, Briefcase, AlertCircle, Activity, Stethoscope, Users } from 'lucide-react';
import InteractiveCard from '../components/ui/InteractiveCard';
import AnimatedInput from '../components/ui/AnimatedInput';
import MagneticButton from '../components/ui/MagneticButton';
import ThemeToggle from '../components/ui/ThemeToggle';
import LanguageToggle from '../components/ui/LanguageToggle';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';

const RegisterPage = () => {
  const [contactInfo, setContactInfo] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await register(contactInfo, password, role);
    setLoading(false);
    if (res.success) {
      navigate('/login');
    } else {
      setError(res.message);
    }
  };

  const roles = [
    { id: 'patient', label: 'Patient' },
    { id: 'hospital', label: 'Hospital (Doctor)' },
    { id: 'ambulance', label: 'Ambulance' },
    { id: 'volunteer', label: 'Volunteer' },
    { id: 'pharmacy', label: 'Pharmacy' },
    { id: 'blood_donor', label: 'Blood Donor' },
    { id: 'government', label: 'Government Analytics' },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 flex-row-reverse">
      
      {/* Right Side - Dynamic Art/Branding */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-bl from-teal-500 to-cyan-600 dark:from-teal-800 dark:to-cyan-900 border-l border-teal-200 dark:border-teal-800 shadow-sm">
        <div className="absolute inset-0 z-0">
           <div className="absolute top-[10%] right-[20%] w-[80%] h-[80%] rounded-full bg-white/20 blur-[150px] animate-float pointer-events-none"></div>
           <div className="absolute bottom-[10%] left-[10%] w-[60%] h-[60%] rounded-full bg-teal-100/20 blur-[120px] animate-pulse-fast pointer-events-none"></div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 flex items-center justify-end gap-3"
        >
          <span className="text-2xl font-black tracking-tight text-white drop-shadow-sm">CareSphere</span>
          <div className="w-12 h-12 bg-white border border-white/30 rounded-xl flex items-center justify-center text-teal-600 shadow-sm">
            <Activity size={24} />
          </div>
        </motion.div>

        <div className="relative z-10 my-auto pl-12">
          <motion.h1 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl font-black text-white leading-tight tracking-tight mb-6 text-right drop-shadow-sm"
          >
            Join the <span className="text-teal-100">Network</span> of Care.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl text-teal-50 font-medium leading-relaxed text-right drop-shadow-sm"
          >
            Whether you're a patient, doctor, or volunteer, your participation saves lives every single day.
          </motion.p>
          
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8, delay: 0.6 }}
             className="flex justify-end gap-6 mt-12"
          >
            <div className="flex items-center gap-3 bg-white/20 px-4 py-2 rounded-full border border-white/30 shadow-sm backdrop-blur-sm">
               <Stethoscope className="text-teal-100" size={18}/> <span className="text-sm font-bold text-white">50+ Hospitals</span>
            </div>
            <div className="flex items-center gap-3 bg-white/20 px-4 py-2 rounded-full border border-white/30 shadow-sm backdrop-blur-sm">
               <Users className="text-blue-100" size={18}/> <span className="text-sm font-bold text-white">1000+ Volunteers</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        <div className="absolute top-0 left-0 w-64 h-64 bg-teal-100 dark:bg-teal-900/30 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute top-6 left-6 flex gap-2 z-50">
           <LanguageToggle />
           <ThemeToggle />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          <InteractiveCard glowColor="rgba(20, 184, 166, 0.1)" className="p-10 shadow-soft bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="mb-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-900/30 border border-teal-100 dark:border-teal-800 text-teal-600 dark:text-teal-400 mb-6 shadow-sm">
                <UserPlus size={32} />
              </div>
              <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Create Account</h2>
              <p className="text-slate-500 dark:text-slate-400">Join the EHRS ecosystem today</p>
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
              
              <div className="relative group">
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-slate-400 z-10 pointer-events-none group-focus-within:text-teal-500 transition-colors">
                    <Briefcase size={18} />
                  </div>
                  <select 
                    value={role} 
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 pl-11 text-slate-800 dark:text-white outline-none transition-all duration-300 focus:bg-white dark:focus:bg-slate-800 focus:border-teal-400 dark:focus:border-teal-500 focus:shadow-[0_0_15px_rgba(20,184,166,0.1)] hover:border-slate-300 dark:hover:border-slate-600 appearance-none font-medium shadow-sm"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">{r.label}</option>
                    ))}
                  </select>
                  <label className="absolute -top-2.5 left-11 text-xs bg-white dark:bg-slate-900 px-1 text-teal-600 dark:text-teal-400 font-bold rounded transition-all duration-300 pointer-events-none tracking-widest uppercase">
                    Select Role
                  </label>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>

              <MagneticButton type="submit" variant="primary" className="w-full mt-6 py-4 text-lg bg-teal-600 hover:bg-teal-700 text-white shadow-sm" size="lg" disabled={loading}>
                {loading ? 'Registering...' : 'Register Now'}
              </MagneticButton>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-slate-500 dark:text-slate-400">
                Already have an account? <Link to="/login" className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-bold transition-colors ml-1">Sign in</Link>
              </p>
            </div>
          </InteractiveCard>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;
