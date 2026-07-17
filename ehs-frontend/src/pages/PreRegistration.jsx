import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { MapPin, User, Activity, Navigation, Calendar, HeartPulse, Wind } from 'lucide-react';
import ThemeToggle from '../components/ui/ThemeToggle';
import RegistrationSuccessFlow from '../components/ui/RegistrationSuccessFlow';

const PreRegistration = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    blood_group: 'A+',
    medical_history: '',
    family_contact: '',
    expected_delivery_date: ''
  });
  const [location, setLocation] = useState(null);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessFlow, setShowSuccessFlow] = useState(false);
  const [isHighRiskFlow, setIsHighRiskFlow] = useState(false);
  
  // High Risk checkboxes
  const [isPregnancyCase, setIsPregnancyCase] = useState(false);
  const [isCardiacCase, setIsCardiacCase] = useState(false);
  const [isAsthmaCase, setIsAsthmaCase] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const detectLocation = () => {
    setLoadingLoc(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
          setLoadingLoc(false);
          showToast('Location detected successfully!', 'success');
        },
        (err) => {
          setLoadingLoc(false);
          showToast('Failed to detect location. Please allow permissions.', 'error');
        }
      );
    } else {
      setLoadingLoc(false);
      showToast('Geolocation not supported by this browser.', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.age || !formData.family_contact) {
      showToast('Please fill out all required fields (Name, Age, Contact).', 'error');
      return;
    }
    
    if (isPregnancyCase && !formData.expected_delivery_date) {
      showToast('Please provide an Expected Delivery Date.', 'error');
      return;
    }

    if (!location) {
      showToast('Please detect your home location first.', 'error');
      return;
    }
    
    // Combine explicit severe conditions into medical_history for the backend to process
    let combinedHistory = formData.medical_history;
    const severeConditions = [];
    if (isCardiacCase) severeConditions.push('Severe Cardiac / Heart Attack History');
    if (isAsthmaCase) severeConditions.push('Severe Asthma');
    
    if (severeConditions.length > 0) {
      combinedHistory = `${severeConditions.join(', ')}. ${combinedHistory}`;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/patient/profile', {
        ...formData,
        medical_history: combinedHistory,
        lat: location.lat,
        lng: location.lng,
        expected_delivery_date: isPregnancyCase && formData.expected_delivery_date ? formData.expected_delivery_date : null
      });
      
      const isHighRisk = response.data.risk_level === 'High' || isCardiacCase || isPregnancyCase;
      
      setIsHighRiskFlow(isHighRisk);
      setShowSuccessFlow(true);
    } catch (error) {
      showToast(error.response?.data?.msg || 'Error saving profile.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20 pb-10 px-4 transition-colors duration-300">
      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-xl shadow-md overflow-hidden border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="bg-blue-600 p-6 text-white flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <User className="w-6 h-6" /> Patient Pre-Registration
            </h2>
            <p className="opacity-90 mt-1 text-sm">
              Complete your profile so we can proactively monitor your health and prevent emergencies.
            </p>
          </div>
          <ThemeToggle />
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <input 
                type="text" 
                name="name" 
                required
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                value={formData.name}
                onChange={handleChange}
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Age</label>
              <input 
                type="number" 
                name="age"
                required 
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                value={formData.age}
                onChange={handleChange}
                placeholder="28"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Blood Group</label>
              <select 
                name="blood_group"
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                value={formData.blood_group}
                onChange={handleChange}
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Emergency Contact Number</label>
              <input 
                type="tel" 
                name="family_contact" 
                required
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                value={formData.family_contact}
                onChange={handleChange}
                placeholder="+91 9876543210"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" /> Additional Medical History
            </label>
            <textarea 
              name="medical_history" 
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 transition-colors"
              value={formData.medical_history}
              onChange={handleChange}
              placeholder="Describe any other chronic conditions or past surgeries..."
            ></textarea>
          </div>

          <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">Severe Conditions (Pre-Alert System)</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30 transition-colors">
                <input 
                  type="checkbox" 
                  id="cardiac"
                  checked={isCardiacCase} 
                  onChange={() => setIsCardiacCase(!isCardiacCase)}
                  className="w-4 h-4 text-red-600 rounded bg-slate-800 border-slate-700"
                />
                <label htmlFor="cardiac" className="text-sm font-medium text-red-900 dark:text-red-400 cursor-pointer flex items-center gap-2">
                  <HeartPulse className="w-4 h-4" /> History of Heart Attacks / Cardiac Issues
                </label>
              </div>

              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/50 transition-colors">
                <input 
                  type="checkbox" 
                  id="pregnancy"
                  checked={isPregnancyCase} 
                  onChange={() => setIsPregnancyCase(!isPregnancyCase)}
                  className="w-4 h-4 text-blue-600 rounded bg-slate-800 border-slate-700"
                />
                <label htmlFor="pregnancy" className="text-sm font-medium text-blue-900 dark:text-blue-300 cursor-pointer flex items-center gap-2">
                  Currently Pregnant
                </label>
              </div>

              <div className="flex items-center gap-2 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-100 dark:border-teal-900/50 transition-colors">
                <input 
                  type="checkbox" 
                  id="asthma"
                  checked={isAsthmaCase} 
                  onChange={() => setIsAsthmaCase(!isAsthmaCase)}
                  className="w-4 h-4 text-teal-600 rounded bg-slate-800 border-slate-700"
                />
                <label htmlFor="asthma" className="text-sm font-medium text-teal-900 dark:text-teal-300 cursor-pointer flex items-center gap-2">
                  <Wind className="w-4 h-4" /> Severe Asthma / Respiratory Issues
                </label>
              </div>
            </div>
          </div>

          {isPregnancyCase && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-pink-500" /> Expected Delivery Date (EDD)
              </label>
              <input 
                type="date" 
                name="expected_delivery_date" 
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none transition-colors"
                value={formData.expected_delivery_date}
                onChange={handleChange}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-500" /> Home GPS Location
            </label>
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <button 
                type="button" 
                onClick={detectLocation}
                disabled={loadingLoc}
                className="w-full sm:w-auto px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg flex justify-center items-center gap-2 transition"
              >
                <Navigation className={`w-4 h-4 ${loadingLoc ? 'animate-spin' : ''}`} />
                {loadingLoc ? 'Detecting...' : 'Detect Exact Location'}
              </button>
              {location && (
                <span className="text-sm text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
                  Location Captured ✓
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              We capture your exact GPS coordinates so an ambulance can reach your door without needing directions.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 transition-colors">
            <button 
              type="submit" 
              disabled={isSubmitting}
              formNoValidate
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition shadow-lg shadow-blue-500/20"
            >
              {isSubmitting ? 'Saving Profile...' : 'Complete Registration & Notify Hospitals'}
            </button>
          </div>
        </form>
      </div>
      <RegistrationSuccessFlow isOpen={showSuccessFlow} isHighRisk={isHighRiskFlow} />
    </div>
  );
};

export default PreRegistration;
