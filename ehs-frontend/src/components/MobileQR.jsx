import React, { useState } from 'react';
import { Smartphone, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const MobileQR = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Dynamically get the LAN IP and current path
  const currentUrl = `http://${window.location.hostname}:5174${window.location.pathname}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(currentUrl)}`;

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[9000] bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.5)] transition-all hover:scale-110 flex items-center justify-center group"
        title="Open this page on your phone"
      >
        <Smartphone size={24} />
      </button>

      {/* QR Code Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center relative"
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="bg-blue-500/10 text-blue-400 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center border border-blue-500/30 shadow-inner">
                <Smartphone size={40} />
              </div>
              
              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Test on Mobile</h3>
              <p className="text-slate-400 text-sm mb-6">Scan this QR code with your phone's camera to instantly open the current page.</p>
              
              <div className="bg-white p-4 rounded-2xl mx-auto inline-block shadow-[0_0_30px_rgba(255,255,255,0.1)] mb-4">
                <img src={qrUrl} alt="QR Code" className="w-[200px] h-[200px] object-contain" />
              </div>
              
              <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5 text-xs text-slate-500 font-mono overflow-x-auto whitespace-nowrap">
                {currentUrl}
              </div>
              
              <p className="text-xs text-orange-400/80 mt-4">
                * Ensure your phone is on the same Wi-Fi network as this computer.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileQR;
