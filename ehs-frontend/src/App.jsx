import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <>
      <ProfileCompletionModal />
      {children}
    </>
  );
};
import ProfileCompletionModal from './components/ui/ProfileCompletionModal';
import PatientDashboard from './pages/PatientDashboard';
import PreRegistration from './pages/PreRegistration';
import HospitalDashboard from './pages/HospitalDashboard';

import HealthMap from './pages/HealthMap';
import GovDashboard from './pages/GovDashboard';
import AmbulanceDashboard from './pages/AmbulanceDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import PharmacyDashboard from './pages/PharmacyDashboard';
import BloodDonorDashboard from './pages/BloodDonorDashboard';

import AIHealthAssistant from './pages/AIHealthAssistant';
import MedicineSearch from './pages/MedicineSearch';
import HealthRecords from './pages/HealthRecords';
import TeleConsultation from './pages/TeleConsultation';
import ModelAnalytics from './pages/ModelAnalytics';
import BlockchainAuditDashboard from './pages/BlockchainAuditDashboard';

import { useNetworkStatus } from './hooks/useNetworkStatus';
import { AlertCircle } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { AnimatePresence, motion } from 'framer-motion';
import MobileQR from './components/MobileQR';

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
        <Route path="/patient/dashboard" element={<ProtectedRoute><PageTransition><PatientDashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/patient/pre-register" element={<ProtectedRoute><PageTransition><PreRegistration /></PageTransition></ProtectedRoute>} />
        <Route path="/patient/assistant" element={<ProtectedRoute><PageTransition><AIHealthAssistant /></PageTransition></ProtectedRoute>} />
        <Route path="/medicine-search" element={<ProtectedRoute><PageTransition><MedicineSearch /></PageTransition></ProtectedRoute>} />
        <Route path="/health-records" element={<ProtectedRoute><PageTransition><HealthRecords /></PageTransition></ProtectedRoute>} />
        <Route path="/consultation" element={<ProtectedRoute><PageTransition><TeleConsultation /></PageTransition></ProtectedRoute>} />
        <Route path="/analytics/models" element={<ProtectedRoute><PageTransition><ModelAnalytics /></PageTransition></ProtectedRoute>} />
        
        {/* Other Dashboards */}
        <Route path="/hospital/dashboard" element={<ProtectedRoute><PageTransition><HospitalDashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/ambulance/dashboard" element={<ProtectedRoute><PageTransition><AmbulanceDashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/volunteer/dashboard" element={<ProtectedRoute><PageTransition><VolunteerDashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/pharmacy/dashboard" element={<ProtectedRoute><PageTransition><PharmacyDashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/health-map" element={<ProtectedRoute><PageTransition><HealthMap /></PageTransition></ProtectedRoute>} />
        <Route path="/government/dashboard" element={<ProtectedRoute><PageTransition><GovDashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/government/audit" element={<ProtectedRoute><PageTransition><BlockchainAuditDashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/donor/dashboard" element={<ProtectedRoute><PageTransition><BloodDonorDashboard /></PageTransition></ProtectedRoute>} />
      </Routes>
    </AnimatePresence>
  );
};

import { LanguageProvider } from './context/LanguageContext';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          <GlobalOfflineBanner />
          <MobileQR />
          <ToastProvider>
            <AuthProvider>
              <AnimatedRoutes />
            </AuthProvider>
          </ToastProvider>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
