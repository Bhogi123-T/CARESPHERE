import React from 'react';

const Loader = ({ fullScreen = false, message = "Loading..." }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4 animate-fade-in-up">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
        <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin-slow"></div>
        <div className="absolute inset-2 rounded-full border-4 border-teal-400 border-b-transparent animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '4s' }}></div>
        <div className="absolute inset-4 bg-purple-500/20 rounded-full animate-glow-pulse backdrop-blur-md"></div>
      </div>
      {message && <p className="text-slate-400 font-medium tracking-wide animate-pulse-fast">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="flex justify-center p-8">
      {content}
    </div>
  );
};

export default Loader;
