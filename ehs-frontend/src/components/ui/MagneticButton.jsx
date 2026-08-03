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
    primary: "bg-medical-500 text-white shadow-soft hover:shadow-soft-lg hover:bg-medical-600 border border-transparent",
    secondary: "bg-medical-50 text-medical-600 border border-medical-100 hover:bg-medical-100 hover:border-medical-200",
    danger: "bg-red-500 text-white shadow-soft hover:shadow-soft-lg hover:bg-red-600 border border-transparent",
    success: "bg-emerald-500 text-white shadow-soft hover:shadow-soft-lg hover:bg-emerald-600 border border-transparent",
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
        "relative rounded-full font-bold flex items-center justify-center gap-2 overflow-hidden",
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
