import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const PremiumCard = ({ children, className, hoverEffect = true, delay = 0, ...props }) => {
  return (
    <div 
      className={cn(
        "premium-glass-card p-6 animate-scale-in",
        hoverEffect ? "hover:-translate-y-1" : "hover:translate-y-0 hover:shadow-none hover:bg-slate-800/40",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
      {...props}
    >
      {children}
    </div>
  );
};

export default PremiumCard;
