import React from 'react';

const PageWrapper = ({ children, title, subtitle, actions }) => {
  return (
    <div className="min-h-screen text-slate-200 pb-12 pt-6 px-4 md:px-8 max-w-7xl mx-auto animate-fade-in-up">
      {/* Page Header */}
      {(title || actions) && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            {title && <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">{title}</h1>}
            {subtitle && <p className="text-slate-400">{subtitle}</p>}
          </div>
          {actions && (
            <div className="flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      )}
      
      {/* Page Content */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};

export default PageWrapper;
