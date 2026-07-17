import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const AnimatedModal = ({ isOpen, onClose, title, children, maxWidth = "max-w-2xl" }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-slate-950/60"
            onClick={onClose}
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`relative w-full ${maxWidth} bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {title && (
              <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-slate-800/30">
                <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
                <button 
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-slate-800/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 flex items-center justify-center transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            
            {/* Body */}
            <div className="p-6">
              {children}
            </div>
            
            {/* Decorative Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none -z-10"></div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AnimatedModal;
