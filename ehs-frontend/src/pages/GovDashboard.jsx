import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldCheck, Map, TrendingUp, AlertTriangle, Building2, MapPin, ThermometerSun, Truck, Zap } from 'lucide-react';
import api from '../services/api';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LiveMapUpdater } from '../hooks/LiveMapUpdater';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import InteractiveCard from '../components/ui/InteractiveCard';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, ComposedChart, Line
} from 'recharts';

const GovDashboard = () => {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [anomalyData, setAnomalyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [res, anomalyRes] = await Promise.all([
          api.get('/analytics'),
          api.get('/ml/anomaly').catch(() => ({ data: null }))
        ]);
        setData(res.data);
        if (anomalyRes.data) setAnomalyData(anomalyRes.data);
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center text-slate-500 text-2xl font-black uppercase tracking-widest animate-pulse bg-[#1e293b]/50 border border-white/5">Loading Analytics Data...</div>;
  if (!data) return <div className="h-screen flex items-center justify-center text-slate-500 text-xl font-bold uppercase tracking-widest bg-[#1e293b]/50 border border-white/5">Failed to load data. Ensure backend is running.</div>;

  const { kpis, trends, risk_zones, recommendations } = data;

  return (
    <div className="min-h-screen flex flex-col relative text-slate-200 bg-slate-950 overflow-x-hidden pb-12 selection:bg-teal-500/30 transition-colors duration-300">
      
      {/* Premium Ambient Background */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="relative z-10 flex flex-col h-full w-full">
      {/* Header */}
      <header className="bg-slate-900/40 backdrop-blur-2xl border-b border-white/10 p-6 sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.3)]">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-100">Government Analytics Dashboard</h1>
              <p className="text-slate-500 text-xs flex items-center gap-2 font-medium mt-1.5 uppercase tracking-widest">
                <Badge variant="primary" className="px-2 py-0.5 text-[10px]">State Health Ministry</Badge> <span className="text-slate-500">•</span> Command Center
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="text-red-400 hover:text-red-600 hover:bg-red-500/20 uppercase tracking-widest text-xs font-bold px-6 rounded-xl transition-all">Sign Out</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full mt-10 px-6 space-y-8">
        
        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-6">
          <InteractiveCard glowColor="rgba(59, 130, 246, 0.1)" className="bg-[#131B2F] border border-white/5 border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
            <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2"><Activity size={14}/> Total Emergencies Logged</p>
            <p className="text-5xl font-black text-white"><AnimatedCounter to={kpis.total_emergencies} duration={1.5} /></p>
          </InteractiveCard>
          <InteractiveCard glowColor="rgba(34, 197, 94, 0.1)" className="bg-[#131B2F] border border-white/5 border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
            <p className="text-green-400 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2"><TrendingUp size={14}/> Estimated Lives Saved</p>
            <p className="text-5xl font-black text-white"><AnimatedCounter to={kpis.lives_saved} duration={1.5} /></p>
          </InteractiveCard>
          <InteractiveCard glowColor="rgba(249, 115, 22, 0.1)" className="bg-[#131B2F] border border-white/5 border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
            <p className="text-orange-500 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2"><Activity size={14}/> Avg Response Time</p>
            <p className="text-5xl font-black text-white"><AnimatedCounter to={kpis.avg_response_time} duration={1.5} /> <span className="text-xl text-slate-500 font-bold ml-1">mins</span></p>
          </InteractiveCard>
          <InteractiveCard glowColor="rgba(239, 68, 68, 0.1)" className="bg-[#131B2F] border border-white/5 border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
            <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2"><AlertTriangle size={14}/> Critical High-Risk Cases</p>
            <p className="text-5xl font-black text-white"><AnimatedCounter to={kpis.critical_cases} duration={1.5} /></p>
          </InteractiveCard>
        </div>

        {/* Middle Section: Map and Recommendations */}
        <div className="grid grid-cols-3 gap-6 h-[550px]">
          {/* Map */}
          <div className="col-span-2 bg-slate-100 rounded-3xl overflow-hidden relative border-white/10 group shadow-[0_0_15px_rgba(0,0,0,0.3)]">
            <div className="absolute top-6 left-6 z-[400] bg-[#131B2F] border border-white/5/90 backdrop-blur-md px-5 py-3 rounded-2xl border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
              <h2 className="text-xs font-black flex items-center gap-2 text-white uppercase tracking-widest"><Map size={16} className="text-red-400 animate-pulse"/> Live Risk Zone Heatmap</h2>
            </div>
            <MapContainer center={[15.6, 78.2]} zoom={8} style={{ height: '100%', width: '100%' }} zoomControl={true} scrollWheelZoom={false}>
              <TileLayer url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" attribution="&copy; Google Maps" />
              <LiveMapUpdater defaultCenter={[15.6, 78.2]} />
              {risk_zones.map((zone, idx) => (
                <CircleMarker 
                  key={idx} 
                  center={[zone.lat, zone.lng]} 
                  radius={zone.intensity * 20} 
                  pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.5, weight: 1 }}
                >
                  <Popup className="custom-popup">
                    <div className="text-white font-bold p-2 text-sm">
                      <p className="text-red-600 font-black uppercase tracking-widest text-[10px] mb-2">High Risk Cluster</p>
                      <p className="leading-snug">Multiple emergencies reported in this vicinity.</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_50px_rgba(0,0,0,0.05)] z-[300]"></div>
          </div>

          {/* Resource & Infrastructure Recommendations */}
          <div className="col-span-1 bg-[#131B2F] border border-white/5 p-8 rounded-3xl border-white/10 flex flex-col shadow-[0_0_15px_rgba(0,0,0,0.3)]">
            <h2 className="text-sm font-black flex items-center gap-3 text-white mb-6 uppercase tracking-widest">
              <Zap size={20} className="text-teal-500"/> AI Resource Allocation
            </h2>
            <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
              <div className="bg-teal-50 border border-teal-100 p-4 rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.3)] mb-2">
                 <p className="text-[10px] text-teal-600 uppercase tracking-widest font-bold mb-2 flex items-center gap-2"><Truck size={12}/> Fleet Redeployment</p>
                 <p className="text-sm text-slate-200 font-medium">Move 3 ambulances from <span className="text-white font-bold">North Zone</span> to <span className="text-white font-bold">East Zone</span> due to predicted evening spike.</p>
                 <button className="mt-3 w-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(0,0,0,0.3)]">Authorize Move</button>
              </div>
              {recommendations.map((rec, idx) => (
                <div key={idx} className="bg-[#1e293b]/50 border border-white/5 border-white/10 p-4 rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.3)] transition-colors hover:bg-slate-100 flex gap-3 items-start">
                  <div className="mt-0.5"><Building2 size={16} className="text-slate-500"/></div>
                  <p className="text-xs font-medium text-slate-300 leading-relaxed">{rec}</p>
                </div>
              ))}
              <div className="mt-4 p-4 border border-dashed border-white/20 rounded-2xl text-center bg-[#1e293b]/50 border border-white/5">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center justify-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-green-900/200 animate-pulse"></span>
                  NITI Aayog Sync Active
                </p>
              </div>
            </div>
          </div>

          {/* LSTM Anomaly Feed */}
          {anomalyData && (
            <div className="col-span-3 bg-red-900/20 p-8 rounded-3xl border border-red-800 shadow-[0_0_15px_rgba(0,0,0,0.3)] mt-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-black flex items-center gap-3 text-red-600 uppercase tracking-widest">
                  <Activity size={20} className="animate-pulse" /> LSTM Autoencoder Anomaly Detection
                </h2>
                <Badge variant="danger">Behavioral Sequence Analysis</Badge>
              </div>
              <p className="text-xs text-slate-300 mb-6 max-w-3xl">
                The LSTM model analyzes temporal sequences of regional health data to detect abnormal spikes (outbreaks). 
                Reconstruction error above {anomalyData.data?.[0]?.threshold || 0.05} indicates an anomaly.
              </p>
              <div className="flex gap-2 h-32 items-end">
                {anomalyData.data?.slice(-30).map((point, idx) => {
                  const height = Math.min((point.reconstruction_error / 0.15) * 100, 100);
                  const isAnomaly = point.is_anomaly;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center group relative">
                      {isAnomaly && (
                        <div className="absolute -top-6 text-[10px] text-red-600 font-bold bg-red-100 px-2 py-1 rounded border border-red-800">Alert</div>
                      )}
                      <div className="w-full relative bg-[#1e293b] rounded-t-md overflow-hidden" style={{ height: `${height}%` }}>
                        <div className={`absolute inset-0 ${isAnomaly ? 'bg-red-900/200 shadow-[0_0_15px_rgba(0,0,0,0.3)]' : 'bg-blue-400/50'}`}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section: Trends */}
        <div className="grid grid-cols-3 gap-6">
          <InteractiveCard glowColor="rgba(59, 130, 246, 0.1)" className="bg-[#131B2F] border border-white/5 border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
            <h2 className="text-[10px] font-black flex items-center gap-2 text-slate-500 mb-8 uppercase tracking-widest">
              <TrendingUp size={16} className="text-blue-400"/> 6-Month Emergency Volume
            </h2>
            <div className="h-48 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends.emergencies.map((val, i) => ({ name: trends.months[i], val }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ backgroundColor: '#ffffff', borderColor: '#3b82f6', borderRadius: '8px' }} />
                  <Bar dataKey="val" fill="url(#blueGradient)" radius={[4, 4, 0, 0]} />
                  <defs>
                    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </InteractiveCard>

          <InteractiveCard glowColor="rgba(34, 197, 94, 0.1)" className="bg-[#131B2F] border border-white/5 border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
            <h2 className="text-[10px] font-black flex items-center gap-2 text-slate-500 mb-8 uppercase tracking-widest">
              <Activity size={16} className="text-green-400"/> Average Response Time (Mins)
            </h2>
            <div className="h-48 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends.response_times.map((val, i) => ({ name: trends.months[i], val }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ backgroundColor: '#ffffff', borderColor: '#22c55e', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="val" stroke="#22c55e" strokeWidth={3} fill="url(#greenGradient)" />
                  <defs>
                    <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.5}/>
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </InteractiveCard>

          <InteractiveCard glowColor="rgba(168, 85, 247, 0.1)" className="bg-[#131B2F] border border-white/5 border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
            <h2 className="text-[10px] font-black flex items-center gap-2 text-slate-500 mb-8 uppercase tracking-widest">
              <ThermometerSun size={16} className="text-purple-500"/> Epidemic Risk Forecast
            </h2>
            <div className="h-48 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={[30, 45, 60, 85, 95, 70, 50].map((val, i) => ({ name: `D+${i+1}`, val }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ backgroundColor: '#ffffff', borderColor: '#a855f7', borderRadius: '8px' }} />
                  <Bar dataKey="val" fill="url(#purpleGradient)" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="val" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7', r: 4 }} />
                  <defs>
                    <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.5}/>
                      <stop offset="100%" stopColor="#a855f7" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </InteractiveCard>
        </div>
        
      </main>
      </div>
    </div>
  );
};

export default GovDashboard;
