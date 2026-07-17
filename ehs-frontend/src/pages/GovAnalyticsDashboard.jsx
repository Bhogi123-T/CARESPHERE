import React from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart3, TrendingUp, AlertTriangle, ShieldCheck, MapPin, CheckCircle2, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocationName } from '../hooks/useLocationName';
import { mockGovMetrics } from '../data/mockData';

const GovAnalyticsDashboard = () => {
  const { user, logout } = useAuth();
  const locationName = useLocationName();

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-12 selection:bg-indigo-500/30">
      
      <header className="glass-nav p-6 border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30 shadow-inner">
              <BarChart3 size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-wider text-indigo-400">GOVERNMENT ANALYTICS</h1>
              <p className="text-slate-400 text-xs flex items-center gap-1 mt-1 font-medium">
                Logged in as {user?.role.toUpperCase()} <span className="text-slate-600">•</span> CareSphere Command <span className="text-slate-600">•</span> <MapPin size={10} className="text-slate-500"/> {locationName}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <Link to="/health-map" className="glass-button px-5 py-2 text-white hover:text-indigo-300 text-sm flex items-center gap-2">
              <MapPin size={16}/> Open Health Map
            </Link>
            <button onClick={logout} className="glass-button px-5 py-2 text-red-400 hover:text-red-300 text-sm">Sign Out</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 mt-6">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-panel p-6 rounded-3xl animate-fade-in-up" style={{animationDelay: '0ms'}}>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Total Emergencies</p>
            <h3 className="text-4xl font-black text-white mb-2">{mockGovMetrics.totalEmergencies.toLocaleString()}</h3>
            <div className="flex items-center gap-1 text-xs font-bold text-red-400"><TrendingUp size={14}/> +12% this week</div>
          </div>
          <div className="glass-panel p-6 rounded-3xl animate-fade-in-up" style={{animationDelay: '100ms'}}>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Avg Response Time</p>
            <h3 className="text-4xl font-black text-white mb-2">{mockGovMetrics.avgResponseTime}</h3>
            <div className="flex items-center gap-1 text-xs font-bold text-green-400"><TrendingUp size={14} className="rotate-180"/> -2 mins this month</div>
          </div>
          <div className="glass-panel p-6 rounded-3xl animate-fade-in-up" style={{animationDelay: '200ms'}}>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Active Health Camps</p>
            <h3 className="text-4xl font-black text-white mb-2">{mockGovMetrics.activeHealthCamps}</h3>
            <div className="flex items-center gap-1 text-xs font-bold text-indigo-400">Deployed Regionally</div>
          </div>
          <div className="glass-panel p-6 rounded-3xl border border-red-500/30 bg-red-500/5 animate-fade-in-up" style={{animationDelay: '300ms'}}>
            <p className="text-red-400/80 text-xs font-bold uppercase tracking-widest mb-2">Critical Cases</p>
            <h3 className="text-4xl font-black text-white mb-2">{mockGovMetrics.criticalCases}</h3>
            <div className="flex items-center gap-1 text-xs font-bold text-red-400"><AlertTriangle size={14}/> Requires Attention</div>
          </div>
        </div>

        {/* AI Rural Accessibility Engine */}
        <div className="glass-panel bg-gradient-to-br from-indigo-900/40 to-slate-900 rounded-3xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <ShieldCheck className="text-indigo-400" />
                Regional Alerts & AI Diagnostics
              </h2>
              <p className="text-slate-400 mt-1 font-medium">Automated analysis of village-level healthcare status based on real-time data.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            {mockGovMetrics.regionalAlerts.map((alert, idx) => (
              <div key={alert.id} className={`glass-card p-6 rounded-2xl border-l-4 animate-fade-in-up ${
                alert.severity === 'CRITICAL' ? 'border-l-red-500' : 
                alert.severity === 'HIGH' ? 'border-l-orange-500' : 'border-l-indigo-500'
              }`} style={{ animationDelay: `${idx * 150}ms` }}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2 text-white"><MapPin size={16} className="text-slate-400"/> {alert.region}</h3>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                    alert.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 
                    alert.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400' : 'bg-indigo-500/20 text-indigo-400'
                  }`}>{alert.severity}</span>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase">AI Insight:</p>
                  <div className="text-sm font-medium flex items-center gap-2 text-slate-200">
                    {alert.severity === 'CRITICAL' ? <AlertTriangle size={16} className="text-red-400 shrink-0"/> : 
                     alert.severity === 'HIGH' ? <AlertTriangle size={16} className="text-orange-400 shrink-0"/> :
                     <CheckCircle2 size={16} className="text-indigo-400 shrink-0"/>}
                    {alert.alert}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disease Outbreak Simulation */}
        <div className="glass-panel p-8 rounded-3xl">
           <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
             <Activity className="text-indigo-400" />
             Monthly Disease Trend Analysis (Simulated)
           </h2>
           
           <div className="w-full overflow-x-auto">
             <div className="min-w-[700px]">
               <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 px-4">
                 <div className="w-1/4">Month</div>
                 <div className="w-1/4">Dengue</div>
                 <div className="w-1/4">Malaria</div>
                 <div className="w-1/4">Snakebites</div>
               </div>
               
               {mockGovMetrics.outbreakData.map((data, idx) => (
                 <div key={idx} className="flex justify-between items-center bg-slate-800/30 hover:bg-slate-800/50 p-4 rounded-2xl mb-2 transition-colors">
                   <div className="w-1/4 font-bold text-white">{data.month}</div>
                   <div className="w-1/4 text-red-400 font-medium flex items-center gap-2">
                     <span className="w-8">{data.dengue}</span>
                     <div className="h-1.5 bg-red-500/20 rounded-full w-full max-w-[100px] overflow-hidden">
                       <div className="h-full bg-red-500 rounded-full" style={{ width: `${(data.dengue / 120) * 100}%` }}></div>
                     </div>
                   </div>
                   <div className="w-1/4 text-orange-400 font-medium flex items-center gap-2">
                     <span className="w-8">{data.malaria}</span>
                     <div className="h-1.5 bg-orange-500/20 rounded-full w-full max-w-[100px] overflow-hidden">
                       <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(data.malaria / 120) * 100}%` }}></div>
                     </div>
                   </div>
                   <div className="w-1/4 text-indigo-400 font-medium flex items-center gap-2">
                     <span className="w-8">{data.snakebites}</span>
                     <div className="h-1.5 bg-indigo-500/20 rounded-full w-full max-w-[100px] overflow-hidden">
                       <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(data.snakebites / 120) * 100}%` }}></div>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        </div>

      </main>
    </div>
  );
};

export default GovAnalyticsDashboard;
