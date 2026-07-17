import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from './Button'; // Reusing cn utility

const InteractiveCard = ({ children, className, glowColor = 'rgba(168, 85, 247, 0.15)' }) => {
  const cardRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl transition-all duration-300',
        className
      )}
    >
      {/* Background Glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${glowColor}, transparent 40%)`,
        }}
      />
      
      {/* Border Glow via pseudo element simulation */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 rounded-2xl"
        style={{
          opacity,
          background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.1), transparent 40%)`,
          maskImage: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          padding: '1px',
        }}
      />

      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default InteractiveCard;
