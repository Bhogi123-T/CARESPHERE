import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, MapPin, User as UserIcon, CheckCircle, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import MagneticButton from './MagneticButton';
import { useToast } from '../../context/ToastContext';

const ProfileCompletionModal = () => {
  const { user, updateProfile } = useAuth();
  const { addToast } = useToast();
  
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!user || user.profile_completed) return null;

  // Determine labels based on role
  const roleNameMap = {
    hospital: 'Hospital Name',
    ambulance: 'Ambulance Agency / Driver Name',
    volunteer: 'Volunteer Full Name',
    pharmacy: 'Pharmacy Name',
    blood_donor: 'Donor Full Name',
    government: 'Department / Official Name',
    patient: 'Full Name'
  };

  const nameLabel = roleNameMap[user.role] || 'Full Name';
  const IconComponent = ['hospital', 'pharmacy', 'government'].includes(user.role) ? Building2 : UserIcon;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !address.trim()) {
      setError('Please fill out all required fields.');
      return;
    }

    setSubmitting(true);
    const result = await updateProfile(name, address);
    if (result.success) {
      addToast('Profile completed successfully!', 'success');
    } else {
      setError(result.message || 'Failed to update profile.');
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-[#0B1120]/80 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative w-full max-w-md bg-[#131B2F] border border-blue-500/30 rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.15)] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 bg-gradient-to-r from-blue-900/20 to-transparent flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Shield size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">Complete Your Profile</h2>
              <p className="text-sm text-slate-400 mt-1">Please provide your details to continue accessing the {user.role} dashboard.</p>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
            {error && (
              <div className="p-3 rounded-xl bg-red-900/20 border border-red-800 text-red-400 flex items-center gap-2 text-sm">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">{nameLabel}</label>
              <div className="relative">
                <IconComponent className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`Enter ${nameLabel.toLowerCase()}`}
                  className="w-full bg-[#0B1120] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Contact Address / Location</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-3 text-slate-500" size={18} />
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter detailed address or base location"
                  rows={3}
                  className="w-full bg-[#0B1120] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600 resize-none"
                  required
                />
              </div>
            </div>

            <MagneticButton
              type="submit"
              disabled={submitting}
              className={`w-full py-4 rounded-xl font-bold tracking-widest uppercase text-sm mt-2 transition-all flex items-center justify-center gap-2 ${
                submitting 
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'
              }`}
            >
              {submitting ? 'Saving Details...' : (
                <>
                  <CheckCircle size={18} /> Complete Setup
                </>
              )}
            </MagneticButton>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProfileCompletionModal;
