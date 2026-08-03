import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart3, TrendingUp, AlertTriangle, ShieldCheck, MapPin, CheckCircle2, Activity, Download, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocationName } from '../hooks/useLocationName';
import api from '../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const GovAnalyticsDashboard = () => {
  const { user, logout } = useAuth();
  const locationName = useLocationName();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/analytics');
        setMetrics(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch analytics", err);
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const exportPDF = () => {
    if (!metrics) return;
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('CareSphere District Infrastructure Planning Report', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated for: NITI Aayog | Region: ${locationName}`, 14, 30);
    
    // KPI Table
    doc.autoTable({
      startY: 40,
      head: [['Metric', 'Value']],
      body: [
        ['Total Emergencies', metrics.kpis.total_emergencies.toLocaleString()],
        ['Avg Response Time', metrics.kpis.avg_response_time + " mins"],
        ['Critical Cases', metrics.kpis.critical_cases.toString()],
        ['Lives Saved', metrics.kpis.lives_saved.toString()]
      ],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });
    
    // Regional Alerts
    doc.text('Regional Recommendations', 14, doc.lastAutoTable.finalY + 10);
    const alertData = metrics.recommendations.map((r, i) => [`Rec ${i+1}`, r]);
    
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 15,
      head: [['ID', 'Recommendation']],
      body: alertData,
      theme: 'striped',
      headStyles: { fillColor: [220, 38, 38] }
    });

    doc.save('CareSphere_NITI_Aayog_Report.pdf');
  };

  if (loading || !metrics) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-teal-600" size={48} /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12 selection:bg-teal-500/30">
      
      <header className="bg-white/90 backdrop-blur-md p-6 border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100 shadow-sm">
              <BarChart3 size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-wider text-teal-700">GOVERNMENT ANALYTICS</h1>
              <p className="text-slate-500 text-xs flex items-center gap-1 mt-1 font-medium">
                Logged in as {user?.role.toUpperCase()} <span className="text-slate-400">•</span> CareSphere Command <span className="text-slate-400">•</span> <MapPin size={10} className="text-slate-400"/> {locationName}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={exportPDF} className="bg-teal-50 px-5 py-2 text-teal-700 hover:text-teal-800 hover:bg-teal-100 text-sm flex items-center gap-2 border border-teal-200 rounded-xl transition-colors shadow-sm font-bold">
              <Download size={16}/> Export Report
            </button>
            <Link to="/government/audit" className="bg-white px-5 py-2 text-slate-700 hover:text-teal-600 text-sm flex items-center gap-2 border border-slate-200 rounded-xl transition-colors shadow-sm font-bold">
              <ShieldCheck size={16}/> View Ledger
            </Link>
            <Link to="/health-map" className="bg-teal-600 px-5 py-2 text-white hover:bg-teal-700 text-sm flex items-center gap-2 rounded-xl transition-colors shadow-sm font-bold">
              <MapPin size={16}/> Open Health Map
            </Link>
            <button onClick={logout} className="px-5 py-2 text-red-500 hover:text-red-600 text-sm font-bold">Sign Out</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 mt-6">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-3xl animate-fade-in-up" style={{animationDelay: '0ms'}}>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Total Emergencies</p>
            <h3 className="text-4xl font-black text-slate-800 mb-2">{metrics.kpis.total_emergencies.toLocaleString()}</h3>
            <div className="flex items-center gap-1 text-xs font-bold text-red-500"><TrendingUp size={14}/> Accurate Local Data</div>
          </div>
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-3xl animate-fade-in-up" style={{animationDelay: '100ms'}}>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Avg Response Time</p>
            <h3 className="text-4xl font-black text-slate-800 mb-2">{metrics.kpis.avg_response_time} m</h3>
            <div className="flex items-center gap-1 text-xs font-bold text-green-500"><TrendingUp size={14} className="rotate-180"/> Verified via Blockchain</div>
          </div>
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-3xl animate-fade-in-up" style={{animationDelay: '200ms'}}>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Lives Saved</p>
            <h3 className="text-4xl font-black text-slate-800 mb-2">{metrics.kpis.lives_saved}</h3>
            <div className="flex items-center gap-1 text-xs font-bold text-teal-500">Estimated based on outcomes</div>
          </div>
          <div className="bg-red-50 p-6 rounded-3xl border border-red-200 animate-fade-in-up shadow-sm" style={{animationDelay: '300ms'}}>
            <p className="text-red-600 text-xs font-bold uppercase tracking-widest mb-2">Critical Cases</p>
            <h3 className="text-4xl font-black text-red-700 mb-2">{metrics.kpis.critical_cases}</h3>
            <div className="flex items-center gap-1 text-xs font-bold text-red-500"><AlertTriangle size={14}/> Requires Attention</div>
          </div>
        </div>

        {/* AI Rural Accessibility Engine */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-teal-50 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-800">
                <ShieldCheck className="text-teal-500" />
                Regional Alerts & AI Diagnostics
              </h2>
              <p className="text-slate-500 mt-1 font-medium">Automated analysis of village-level healthcare status based on real-time data.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            {metrics.recommendations.map((rec, idx) => (
              <div key={idx} className="bg-slate-50 p-6 rounded-2xl border-l-4 border-l-teal-500 border-y border-r border-slate-200 shadow-sm animate-fade-in-up" style={{ animationDelay: `${idx * 150}ms` }}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800"><Activity size={16} className="text-slate-400"/> Recommendation {idx + 1}</h3>
                  <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-teal-100 text-teal-700">Insight</span>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase">AI Generated:</p>
                  <div className="text-sm font-medium flex items-center gap-2 text-slate-700">
                    <CheckCircle2 size={16} className="text-teal-500 shrink-0"/>
                    {rec}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real Data Trends */}
        <div className="bg-white border border-slate-200 shadow-sm p-8 rounded-3xl">
           <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-slate-800">
             <Activity className="text-teal-500" />
             Emergency Trends over Time
           </h2>
           
           <div className="w-full overflow-x-auto">
             <div className="min-w-[700px]">
               <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 px-4">
                 <div className="w-1/3">Month</div>
                 <div className="w-1/3">Total Emergencies</div>
                 <div className="w-1/3">Avg Response Time</div>
               </div>
               
               {metrics.trends.months.map((month, idx) => (
                 <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-100 hover:bg-slate-100 p-4 rounded-2xl mb-2 transition-colors shadow-sm">
                   <div className="w-1/3 font-bold text-slate-800">{month}</div>
                   <div className="w-1/3 text-blue-600 font-medium flex items-center gap-2">
                     <span className="w-8">{metrics.trends.emergencies[idx]}</span>
                     <div className="h-1.5 bg-blue-100 rounded-full w-full max-w-[150px] overflow-hidden">
                       <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(metrics.trends.emergencies[idx] / 250) * 100}%` }}></div>
                     </div>
                   </div>
                   <div className="w-1/3 text-green-600 font-medium flex items-center gap-2">
                     <span className="w-8">{metrics.trends.response_times[idx]}m</span>
                     <div className="h-1.5 bg-green-100 rounded-full w-full max-w-[150px] overflow-hidden">
                       <div className="h-full bg-green-500 rounded-full" style={{ width: `${(metrics.trends.response_times[idx] / 30) * 100}%` }}></div>
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
