import React, { useState, useEffect } from 'react';
import { Download, Smartphone } from 'lucide-react';
import Button from './Button';

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      // Log install to analytics
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
  };

  if (!isInstallable || isInstalled) {
    return null; // Don't show anything if already installed or not supported
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 z-50 animate-fade-in-up">
      <div className="bg-slate-900/90 backdrop-blur-xl border border-blue-500/50 p-4 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.3)] flex items-center justify-between gap-4 max-w-sm ml-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 text-blue-400">
            <Smartphone size={20} />
          </div>
          <div>
            <h4 className="font-bold text-slate-100 text-sm">Install Offline App</h4>
            <p className="text-[10px] text-slate-400 leading-tight">Access Dashboard & SOS even without internet!</p>
          </div>
        </div>
        <Button 
          variant="primary" 
          size="sm" 
          onClick={handleInstallClick}
          className="bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] text-xs font-bold whitespace-nowrap"
        >
          <Download size={14} className="mr-1 inline" /> Install
        </Button>
      </div>
    </div>
  );
};

export default InstallPWA;
