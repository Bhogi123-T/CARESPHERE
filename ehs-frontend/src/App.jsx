import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PatientDashboard from './pages/PatientDashboard';
import PreRegistration from './pages/PreRegistration';
import HospitalDashboard from './pages/HospitalDashboard';

import HealthMap from './pages/HealthMap';
import GovDashboard from './pages/GovDashboard';
import AmbulanceDashboard from './pages/AmbulanceDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import PharmacyDashboard from './pages/PharmacyDashboard';

import AIHealthAssistant from './pages/AIHealthAssistant';
import MedicineSearch from './pages/MedicineSearch';
import HealthRecords from './pages/HealthRecords';
import TeleConsultation from './pages/TeleConsultation';
import ModelAnalytics from './pages/ModelAnalytics';

import { useNetworkStatus } from './hooks/useNetworkStatus';
import { AlertCircle } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { AnimatePresence, motion } from 'framer-motion';

const GlobalOfflineBanner = () => {
  const isOnline = useNetworkStatus();
  if (isOnline) return null;
  return (
    <div className="bg-orange-500/20 text-orange-400 p-2 text-center text-sm font-bold border-b border-orange-500/30 flex items-center justify-center gap-2 z-[9999] relative">
      <AlertCircle size={16} /> YOU ARE OFFLINE. APP IS RUNNING IN OFFLINE MODE.
    </div>
  );
};

// Page Transition Wrapper
const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
        
        {/* Patient Routes */}
        <Route path="/patient/dashboard" element={<PageTransition><PatientDashboard /></PageTransition>} />
        <Route path="/patient/pre-register" element={<PageTransition><PreRegistration /></PageTransition>} />
        <Route path="/patient/assistant" element={<PageTransition><AIHealthAssistant /></PageTransition>} />
        <Route path="/medicine-search" element={<PageTransition><MedicineSearch /></PageTransition>} />
        <Route path="/health-records" element={<PageTransition><HealthRecords /></PageTransition>} />
        <Route path="/consultation" element={<PageTransition><TeleConsultation /></PageTransition>} />
        <Route path="/analytics/models" element={<PageTransition><ModelAnalytics /></PageTransition>} />
        
        {/* Other Dashboards */}
        <Route path="/hospital/dashboard" element={<PageTransition><HospitalDashboard /></PageTransition>} />
        <Route path="/ambulance/dashboard" element={<PageTransition><AmbulanceDashboard /></PageTransition>} />
        <Route path="/volunteer/dashboard" element={<PageTransition><VolunteerDashboard /></PageTransition>} />
        <Route path="/pharmacy/dashboard" element={<PageTransition><PharmacyDashboard /></PageTransition>} />
        <Route path="/health-map" element={<PageTransition><HealthMap /></PageTransition>} />
        <Route path="/government/dashboard" element={<PageTransition><GovDashboard /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <GlobalOfflineBanner />
        <ToastProvider>
          <AuthProvider>
            <AnimatedRoutes />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
