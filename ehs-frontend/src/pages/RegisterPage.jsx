import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Lock, Briefcase, AlertCircle, Activity, Stethoscope, Users } from 'lucide-react';
import InteractiveCard from '../components/ui/InteractiveCard';
import AnimatedInput from '../components/ui/AnimatedInput';
import MagneticButton from '../components/ui/MagneticButton';
import { motion } from 'framer-motion';

const RegisterPage = () => {
  const [contactInfo, setContactInfo] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
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
    <div className="min-h-screen flex bg-slate-950 flex-row-reverse">
      
      {/* Right Side - Dynamic Art/Branding */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-bl from-slate-900 to-slate-950 border-l border-white/5">
        <div className="absolute inset-0 z-0">
           <div className="absolute top-[10%] right-[20%] w-[80%] h-[80%] rounded-full bg-purple-600/10 blur-[150px] animate-float pointer-events-none"></div>
           <div className="absolute bottom-[10%] left-[10%] w-[60%] h-[60%] rounded-full bg-pink-600/10 blur-[120px] animate-pulse-fast pointer-events-none"></div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 flex items-center justify-end gap-3"
        >
          <span className="text-2xl font-black tracking-tight text-white">CareSphere</span>
          <div className="w-12 h-12 bg-purple-500/20 border border-purple-500/30 rounded-xl flex items-center justify-center text-purple-400">
            <Activity size={24} />
          </div>
        </motion.div>

        <div className="relative z-10 my-auto pl-12">
          <motion.h1 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl font-black text-white leading-tight tracking-tight mb-6 text-right"
          >
            Join the <span className="gradient-text from-purple-400 to-pink-400">Network</span> of Care.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl text-slate-400 font-medium leading-relaxed text-right"
          >
            Whether you're a patient, doctor, or volunteer, your participation saves lives every single day.
          </motion.p>
          
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8, delay: 0.6 }}
             className="flex justify-end gap-6 mt-12"
          >
            <div className="flex items-center gap-3 bg-slate-900/50 px-4 py-2 rounded-full border border-white/5">
               <Stethoscope className="text-teal-400" size={18}/> <span className="text-sm font-bold text-slate-300">50+ Hospitals</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-900/50 px-4 py-2 rounded-full border border-white/5">
               <Users className="text-blue-400" size={18}/> <span className="text-sm font-bold text-slate-300">1000+ Volunteers</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        <div className="absolute top-0 left-0 w-64 h-64 bg-teal-600/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          <InteractiveCard glowColor="rgba(168, 85, 247, 0.2)" className="p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-slate-900/90 border border-slate-700/50">
            <div className="mb-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-6 shadow-[inset_0_0_20px_rgba(168,85,247,0.1)]">
                <UserPlus size={32} />
              </div>
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Create Account</h2>
              <p className="text-slate-400">Join the EHRS ecosystem today</p>
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
              
              <div className="relative group">
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-slate-400 z-10 pointer-events-none">
                    <Briefcase size={18} />
                  </div>
                  <select 
                    value={role} 
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-4 pl-11 text-slate-200 outline-none transition-all duration-300 focus:bg-slate-800/80 focus:border-purple-500/50 focus:shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:border-slate-600 appearance-none font-medium"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id} className="bg-slate-800 text-white">{r.label}</option>
                    ))}
                  </select>
                  <label className="absolute -top-2.5 left-11 text-xs bg-slate-900 px-1 text-purple-400 font-bold rounded transition-all duration-300 pointer-events-none tracking-widest uppercase">
                    Select Role
                  </label>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>

              <MagneticButton type="submit" variant="primary" className="w-full mt-6 py-4 text-lg bg-purple-600/90 hover:bg-purple-500 border-purple-500/50" size="lg" disabled={loading}>
                {loading ? 'Registering...' : 'Register Now'}
              </MagneticButton>
            </form>

            <div className="mt-8 pt-8 border-t border-white/10 text-center">
              <p className="text-slate-400">
                Already have an account? <Link to="/login" className="text-purple-400 hover:text-purple-300 font-bold transition-colors ml-1">Sign in</Link>
              </p>
            </div>
          </InteractiveCard>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;
