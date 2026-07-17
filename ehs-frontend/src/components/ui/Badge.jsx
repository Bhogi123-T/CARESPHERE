import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Badge = ({ children, variant = 'default', className }) => {
  const variants = {
    default: "bg-slate-800/80 text-slate-300 border-slate-700",
    primary: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    success: "bg-teal-500/20 text-teal-400 border-teal-500/30",
    warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    danger: "bg-red-500/20 text-red-400 border-red-500/30 glow-danger",
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border backdrop-blur-sm",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};

export default Badge;
