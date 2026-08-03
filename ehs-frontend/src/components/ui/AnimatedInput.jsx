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
            "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 outline-none transition-all duration-300 shadow-sm",
            "focus:bg-white focus:border-teal-400 focus:shadow-[0_0_15px_rgba(20,184,166,0.1)]",
            "hover:border-slate-300",
            Icon ? "pl-11" : "",
            error ? "border-red-400 focus:border-red-400 focus:shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "",
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
              "-top-2.5 text-xs bg-white text-teal-600",
              "peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:bg-transparent peer-placeholder-shown:text-slate-500",
              "peer-focus:-top-2.5 peer-focus:text-xs peer-focus:bg-white peer-focus:text-teal-600"
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
