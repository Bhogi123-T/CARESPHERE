import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { MapPin, User, Activity, Navigation, Calendar, HeartPulse, Wind } from 'lucide-react';
import ThemeToggle from '../components/ui/ThemeToggle';
import LanguageToggle from '../components/ui/LanguageToggle';
import { useLanguage } from '../context/LanguageContext';
import RegistrationSuccessFlow from '../components/ui/RegistrationSuccessFlow';

const PreRegistration = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { t } = useLanguage();
  
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
  const [mlResult, setMlResult] = useState(null);
  
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
          // MOCK LOCATION FOR DEMO (to match super_seed.py locations in Hyderabad)
          const baseLat = 17.3850;
          const baseLng = 78.4867;
          const randomOffset = () => (Math.random() - 0.5) * 0.05;
          setLocation({
            lat: baseLat + randomOffset(),
            lng: baseLng + randomOffset()
          });
          setLoadingLoc(false);
          addToast('Location detected successfully!', 'success');
        },
        (err) => {
          setLoadingLoc(false);
          addToast('Failed to detect location. Please allow permissions.', 'error');
        }
      );
    } else {
      setLoadingLoc(false);
      addToast('Geolocation not supported by this browser.', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.age || !formData.family_contact) {
      addToast('Please fill out all required fields (Name, Age, Contact).', 'error');
      return;
    }
    
    if (isPregnancyCase && !formData.expected_delivery_date) {
      addToast('Please provide an Expected Delivery Date.', 'error');
      return;
    }

    if (!location) {
      addToast('Please detect your home location first.', 'error');
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
      
      let mlResponse = null;
      if (isPregnancyCase) {
        try {
          const riskRes = await api.post('/risk/maternal', {
            age: formData.age,
            blood_group: formData.blood_group,
            medical_history: combinedHistory
          });
          mlResponse = riskRes.data;
        } catch (mlErr) {
          console.error("LightGBM prediction failed:", mlErr);
        }
      }
      
      setMlResult(mlResponse);
      setIsHighRiskFlow(isHighRisk);
      setShowSuccessFlow(true);
    } catch (error) {
      addToast(error.response?.data?.msg || 'Error saving profile.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20 pb-10 px-4 transition-colors duration-300 selection:bg-teal-500/30">
      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="bg-teal-600 dark:bg-teal-700 p-6 text-white flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <User className="w-6 h-6" /> Patient Pre-Registration
            </h2>
            <p className="opacity-90 mt-1 text-sm">
              Complete your profile so we can proactively monitor your health and prevent emergencies.
            </p>
          </div>
          <div className="flex gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <input 
                type="text" 
                name="name" 
                required
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors shadow-inner"
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
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors shadow-inner"
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
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors shadow-inner"
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
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors shadow-inner"
                value={formData.family_contact}
                onChange={handleChange}
                placeholder="+91 9876543210"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-500" /> Additional Medical History
            </label>
            <textarea 
              name="medical_history" 
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none h-24 transition-colors shadow-inner custom-scrollbar"
              value={formData.medical_history}
              onChange={handleChange}
              placeholder="Describe any other chronic conditions or past surgeries..."
            ></textarea>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wider">Severe Conditions (Pre-Alert System)</h3>
            <div className="space-y-3">
              <div className={`flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border shadow-sm transition-colors cursor-pointer ${isCardiacCase ? 'border-red-400 dark:border-red-500/50' : 'border-red-200 dark:border-red-900/30 hover:border-red-300 dark:hover:border-red-800'}`} onClick={() => setIsCardiacCase(!isCardiacCase)}>
                <input 
                  type="checkbox" 
                  id="cardiac"
                  checked={isCardiacCase} 
                  onChange={() => setIsCardiacCase(!isCardiacCase)}
                  className="w-4 h-4 text-red-600 rounded bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 focus:ring-red-500 pointer-events-none"
                />
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 pointer-events-none">
                  <HeartPulse className="w-4 h-4 text-red-500 dark:text-red-400" /> History of Heart Attacks / Cardiac Issues
                </label>
              </div>

              <div className={`flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border shadow-sm transition-colors cursor-pointer ${isPregnancyCase ? 'border-blue-400 dark:border-blue-500/50' : 'border-blue-200 dark:border-blue-900/30 hover:border-blue-300 dark:hover:border-blue-800'}`} onClick={() => setIsPregnancyCase(!isPregnancyCase)}>
                <input 
                  type="checkbox" 
                  id="pregnancy"
                  checked={isPregnancyCase} 
                  onChange={() => setIsPregnancyCase(!isPregnancyCase)}
                  className="w-4 h-4 text-blue-600 rounded bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 focus:ring-blue-500 pointer-events-none"
                />
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 pointer-events-none">
                  Currently Pregnant
                </label>
              </div>

              <div className={`flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border shadow-sm transition-colors cursor-pointer ${isAsthmaCase ? 'border-teal-400 dark:border-teal-500/50' : 'border-teal-200 dark:border-teal-900/30 hover:border-teal-300 dark:hover:border-teal-800'}`} onClick={() => setIsAsthmaCase(!isAsthmaCase)}>
                <input 
                  type="checkbox" 
                  id="asthma"
                  checked={isAsthmaCase} 
                  onChange={() => setIsAsthmaCase(!isAsthmaCase)}
                  className="w-4 h-4 text-teal-600 rounded bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 focus:ring-teal-500 pointer-events-none"
                />
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 pointer-events-none">
                  <Wind className="w-4 h-4 text-teal-500 dark:text-teal-400" /> Severe Asthma / Respiratory Issues
                </label>
              </div>
            </div>
          </div>

          {isPregnancyCase && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300 bg-pink-50 dark:bg-pink-900/20 p-4 rounded-xl border border-pink-100 dark:border-pink-900/30">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-pink-500 dark:text-pink-400" /> Expected Delivery Date (EDD)
              </label>
              <input 
                type="date" 
                name="expected_delivery_date" 
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-pink-200 dark:border-pink-800 text-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition-colors shadow-sm"
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
                className="w-full sm:w-auto px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl flex justify-center items-center gap-2 transition shadow-sm border border-slate-200 dark:border-slate-700"
              >
                <Navigation className={`w-4 h-4 ${loadingLoc ? 'animate-spin' : ''}`} />
                {loadingLoc ? 'Detecting...' : 'Detect Exact Location'}
              </button>
              {location && (
                <span className="text-sm text-green-700 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-3 py-1 rounded-xl shadow-sm">
                  Location Captured ✓
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              We capture your exact GPS coordinates so an ambulance can reach your door without needing directions.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 transition-colors mt-6">
            <button 
              type="submit" 
              disabled={isSubmitting}
              formNoValidate
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition shadow-md shadow-teal-500/20"
            >
              {isSubmitting ? 'Saving Profile...' : 'Complete Registration & Notify Hospitals'}
            </button>
          </div>
        </form>
      </div>
      <RegistrationSuccessFlow isOpen={showSuccessFlow} isHighRisk={isHighRiskFlow} mlResult={mlResult} />
    </div>
  );
};

export default PreRegistration;
