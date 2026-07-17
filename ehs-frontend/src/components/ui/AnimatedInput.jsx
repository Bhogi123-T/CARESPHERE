import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const AnimatedInput = React.forwardRef(({ 
  className, 
  label, 
  id,
  icon: Icon,
  error,
  ...props 
}, ref) => {
  
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={cn("relative group mb-5", className)}>
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-4 text-slate-400 group-focus-within:text-blue-400 transition-colors z-10">
            <Icon size={18} />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          placeholder=" "
          className={cn(
            "w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3.5 text-slate-200 outline-none transition-all duration-300",
            "focus:bg-slate-800/80 focus:border-blue-500/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)]",
            "hover:border-slate-600",
            Icon ? "pl-11" : "",
            error ? "border-red-500/50 focus:border-red-500/50 focus:shadow-[0_0_15px_rgba(239,68,68,0.15)]" : "",
            "peer"
          )}
          {...props}
        />
        {label && (
          <label 
            htmlFor={inputId}
            className={cn(
              "absolute transition-all duration-300 pointer-events-none rounded px-1",
              Icon ? "left-11 peer-focus:left-3" : "left-4 peer-focus:left-3",
              "-top-2.5 text-xs bg-slate-900 text-blue-400",
              "peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:bg-transparent peer-placeholder-shown:text-slate-400",
              "peer-focus:-top-2.5 peer-focus:text-xs peer-focus:bg-slate-900 peer-focus:text-blue-400"
            )}
          >
            {label}
          </label>
        )}
      </div>
      {error && (
        <p className="text-red-400 text-xs mt-1.5 ml-1 animate-fade-in-up">{error}</p>
      )}
    </div>
  );
});

AnimatedInput.displayName = "AnimatedInput";

export default AnimatedInput;
