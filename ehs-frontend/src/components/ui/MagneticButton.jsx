import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from './Button'; // Reusing cn utility

const MagneticButton = ({ children, className, onClick, variant = 'primary', size = 'md', ...props }) => {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { width, height, left, top } = ref.current.getBoundingClientRect();
    
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    
    // Calculate distance to dampen effect near edges
    const distance = Math.sqrt(middleX * middleX + middleY * middleY);
    const maxDistance = Math.max(width, height);
    
    // Magnetic strength factor
    const strength = 0.2; 
    
    if (distance < maxDistance) {
        setPosition({ x: middleX * strength, y: middleY * strength });
    }
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] border border-white/10 hover:border-white/30",
    secondary: "bg-slate-800/80 text-white border border-white/10 hover:border-white/30",
    danger: "bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] border border-white/10 hover:border-white/30",
    success: "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-[0_0_20px_rgba(20,184,166,0.4)] border border-white/10 hover:border-white/30",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={cn(
        "relative rounded-xl font-bold flex items-center justify-center gap-2 overflow-hidden",
        "before:absolute before:inset-0 before:bg-white/0 hover:before:bg-white/10 before:transition-colors before:duration-300",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
};

export default MagneticButton;
