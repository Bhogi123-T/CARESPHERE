import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Button = React.forwardRef(({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false,
  children, 
  ...props 
}, ref) => {
  
  const variants = {
    primary: "bg-blue-600/90 text-white hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.6)] border border-blue-400/50 hover:border-blue-400",
    secondary: "bg-slate-800/80 text-white hover:bg-slate-700 shadow-[0_0_15px_rgba(0,0,0,0.3)] border border-white/10 hover:border-white/30",
    danger: "bg-red-600/90 text-white hover:bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_40px_rgba(239,68,68,0.6)] border border-red-400/50 hover:border-red-400",
    success: "bg-teal-600/90 text-white hover:bg-teal-500 shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_40px_rgba(20,184,166,0.6)] border border-teal-400/50 hover:border-teal-400",
    ghost: "bg-transparent text-slate-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button
      ref={ref}
      className={cn(
        "interactive-btn relative overflow-hidden rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 active:translate-y-0",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
      ) : null}
      {children}
    </button>
  );
});

Button.displayName = "Button";

export default Button;
