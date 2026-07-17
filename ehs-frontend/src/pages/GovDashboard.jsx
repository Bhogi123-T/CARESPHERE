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

  if (loading) return <div className="h-screen flex items-center justify-center text-slate-300 text-2xl font-black uppercase tracking-widest animate-pulse bg-slate-950">Loading Analytics Data...</div>;
  if (!data) return <div className="h-screen flex items-center justify-center text-slate-400 text-xl font-bold uppercase tracking-widest bg-slate-950">Failed to load data. Ensure backend is running.</div>;

  const { kpis, trends, risk_zones, recommendations } = data;

  return (
    <div className="min-h-screen flex flex-col text-white bg-slate-950 overflow-x-hidden pb-12 selection:bg-indigo-500/30">
      {/* Header */}
      <header className="premium-glass-nav p-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/40 shadow-inner drop-shadow-lg">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight drop-shadow-sm">Government Analytics Dashboard</h1>
              <p className="text-slate-400 text-xs flex items-center gap-2 font-medium mt-1.5 uppercase tracking-widest">
                <Badge variant="primary" className="px-2 py-0.5 text-[10px]">State Health Ministry</Badge> <span className="text-slate-600">•</span> Command Center
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 uppercase tracking-widest text-xs font-bold px-6">Sign Out</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full mt-10 px-6 space-y-8">
        
        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-6">
          <InteractiveCard glowColor="rgba(59, 130, 246, 0.2)">
            <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2"><Activity size={14}/> Total Emergencies Logged</p>
            <p className="text-5xl font-black text-slate-100 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]"><AnimatedCounter to={kpis.total_emergencies} duration={1.5} /></p>
          </InteractiveCard>
          <InteractiveCard glowColor="rgba(34, 197, 94, 0.2)">
            <p className="text-green-400 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2"><TrendingUp size={14}/> Estimated Lives Saved</p>
            <p className="text-5xl font-black text-slate-100 drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]"><AnimatedCounter to={kpis.lives_saved} duration={1.5} /></p>
          </InteractiveCard>
          <InteractiveCard glowColor="rgba(249, 115, 22, 0.2)">
            <p className="text-orange-400 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2"><Activity size={14}/> Avg Response Time</p>
            <p className="text-5xl font-black text-slate-100 drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]"><AnimatedCounter to={kpis.avg_response_time} duration={1.5} /> <span className="text-xl text-slate-500 font-bold ml-1">mins</span></p>
          </InteractiveCard>
          <InteractiveCard glowColor="rgba(239, 68, 68, 0.2)">
            <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2"><AlertTriangle size={14}/> Critical High-Risk Cases</p>
            <p className="text-5xl font-black text-slate-100 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]"><AnimatedCounter to={kpis.critical_cases} duration={1.5} /></p>
          </InteractiveCard>
        </div>

        {/* Middle Section: Map and Recommendations */}
        <div className="grid grid-cols-3 gap-6 h-[550px]">
          {/* Map */}
          <div className="col-span-2 bg-slate-900/60 backdrop-blur-md rounded-3xl overflow-hidden relative border border-white/10 group shadow-xl">
            <div className="absolute top-6 left-6 z-[400] bg-slate-950/80 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 shadow-lg">
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
                    <div className="text-slate-900 font-bold p-2 text-sm">
                      <p className="text-red-600 font-black uppercase tracking-widest text-[10px] mb-2">High Risk Cluster</p>
                      <p className="leading-snug">Multiple emergencies reported in this vicinity.</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(2,6,23,0.9)] z-[300]"></div>
          </div>

          {/* Resource & Infrastructure Recommendations */}
          <div className="col-span-1 bg-slate-900/60 backdrop-blur-md p-8 rounded-3xl border border-white/10 flex flex-col shadow-xl">
            <h2 className="text-sm font-black flex items-center gap-3 text-white mb-6 uppercase tracking-widest">
              <Zap size={20} className="text-indigo-400"/> AI Resource Allocation
            </h2>
            <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
              <div className="bg-indigo-950/40 border border-indigo-500/30 p-4 rounded-2xl shadow-inner mb-2">
                 <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold mb-2 flex items-center gap-2"><Truck size={12}/> Fleet Redeployment</p>
                 <p className="text-sm text-slate-200 font-medium">Move 3 ambulances from <span className="text-white font-bold">North Zone</span> to <span className="text-white font-bold">East Zone</span> due to predicted evening spike.</p>
                 <button className="mt-3 w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 rounded-xl transition-all shadow-[0_0_10px_rgba(79,70,229,0.3)]">Authorize Move</button>
              </div>
              {recommendations.map((rec, idx) => (
                <div key={idx} className="bg-slate-950/50 border border-white/5 p-4 rounded-2xl shadow-inner transition-colors hover:bg-slate-950/70 flex gap-3 items-start">
                  <div className="mt-0.5"><Building2 size={16} className="text-slate-400"/></div>
                  <p className="text-xs font-medium text-slate-300 leading-relaxed">{rec}</p>
                </div>
              ))}
              <div className="mt-4 p-4 border border-dashed border-slate-700/50 rounded-2xl text-center bg-slate-950/30">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center justify-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  NITI Aayog Sync Active
                </p>
              </div>
            </div>
          </div>

          {/* LSTM Anomaly Feed */}
          {anomalyData && (
            <div className="col-span-3 bg-gradient-to-br from-red-900/20 to-slate-900/60 backdrop-blur-md p-8 rounded-3xl border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)] mt-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-black flex items-center gap-3 text-red-400 uppercase tracking-widest">
                  <Activity size={20} className="animate-pulse" /> LSTM Autoencoder Anomaly Detection
                </h2>
                <Badge variant="danger">Behavioral Sequence Analysis</Badge>
              </div>
              <p className="text-xs text-slate-400 mb-6 max-w-3xl">
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
                        <div className="absolute -top-6 text-[10px] text-red-400 font-bold bg-red-950/80 px-2 py-1 rounded">Alert</div>
                      )}
                      <div className="w-full relative bg-slate-800/50 rounded-t-md overflow-hidden" style={{ height: `${height}%` }}>
                        <div className={`absolute inset-0 ${isAnomaly ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-blue-500/50'}`}></div>
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
          <InteractiveCard glowColor="rgba(59, 130, 246, 0.15)">
            <h2 className="text-[10px] font-black flex items-center gap-2 text-slate-400 mb-8 uppercase tracking-widest">
              <TrendingUp size={16} className="text-blue-400"/> 6-Month Emergency Volume
            </h2>
            <div className="h-48 flex items-end justify-between gap-3 mt-4">
              {trends.emergencies.map((val, i) => {
                const max = Math.max(...trends.emergencies);
                const height = (val / max) * 100;
                return (
                  <div key={i} className="flex flex-col items-center flex-1 group">
                    <div className="text-xs font-bold text-blue-300 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-900/50 px-2 py-1 rounded-md">{val}</div>
                    <div className="w-full bg-slate-800/50 rounded-t-xl group-hover:bg-slate-700/50 transition-colors relative overflow-hidden" style={{ height: `${height}%` }}>
                      <div className="absolute bottom-0 left-0 right-0 top-0 bg-gradient-to-t from-blue-600/20 to-blue-500/50 rounded-t-xl border-t-2 border-blue-400 shadow-[0_-5px_15px_rgba(59,130,246,0.3)]"></div>
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 mt-4 uppercase tracking-widest">{trends.months[i]}</div>
                  </div>
                );
              })}
            </div>
          </InteractiveCard>

          <InteractiveCard glowColor="rgba(34, 197, 94, 0.15)">
            <h2 className="text-[10px] font-black flex items-center gap-2 text-slate-400 mb-8 uppercase tracking-widest">
              <Activity size={16} className="text-green-400"/> Average Response Time (Mins)
            </h2>
            <div className="h-48 flex items-end justify-between gap-3 mt-4 relative">
              {/* Target Line */}
              <div className="absolute top-[40%] left-0 right-0 border-t-2 border-dashed border-green-500/30 z-0 pointer-events-none">
                <span className="absolute -top-6 right-0 text-[10px] text-green-500 font-black uppercase tracking-widest bg-slate-900/80 px-2 py-0.5 rounded-md border border-green-500/20">15 Min Target</span>
              </div>
              
              {trends.response_times.map((val, i) => {
                const max = Math.max(...trends.response_times) + 5;
                const height = (val / max) * 100;
                return (
                  <div key={i} className="flex flex-col items-center flex-1 z-10 group">
                    <div className="text-xs font-bold text-green-300 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-green-900/50 px-2 py-1 rounded-md">{val}m</div>
                    <div className="w-full bg-slate-800/50 rounded-t-xl group-hover:bg-slate-700/50 transition-colors relative overflow-hidden" style={{ height: `${height}%` }}>
                      <div className="absolute bottom-0 left-0 right-0 top-0 bg-gradient-to-t from-green-600/20 to-green-500/50 rounded-t-xl border-t-2 border-green-400 shadow-[0_-5px_15px_rgba(34,197,94,0.3)]"></div>
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 mt-4 uppercase tracking-widest">{trends.months[i]}</div>
                  </div>
                );
              })}
            </div>
          </InteractiveCard>

          <InteractiveCard glowColor="rgba(168, 85, 247, 0.15)">
            <h2 className="text-[10px] font-black flex items-center gap-2 text-slate-400 mb-8 uppercase tracking-widest">
              <ThermometerSun size={16} className="text-purple-400"/> Epidemic Risk Forecast
            </h2>
            <div className="h-48 flex items-end justify-between gap-2 mt-4 relative">
               {/* 7 Days forecast */}
               {[30, 45, 60, 85, 95, 70, 50].map((val, i) => {
                  const isHighRisk = val > 80;
                  return (
                     <div key={i} className="flex flex-col items-center flex-1 z-10 group">
                       <div className={`text-xs font-bold mb-2 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded-md ${isHighRisk ? 'text-red-300 bg-red-900/50' : 'text-purple-300 bg-purple-900/50'}`}>{val}%</div>
                       <div className="w-full bg-slate-800/50 rounded-t-xl group-hover:bg-slate-700/50 transition-colors relative overflow-hidden" style={{ height: `${val}%` }}>
                         <div className={`absolute bottom-0 left-0 right-0 top-0 bg-gradient-to-t rounded-t-xl border-t-2 ${isHighRisk ? 'from-red-600/20 to-red-500/50 border-red-400 shadow-[0_-5px_15px_rgba(239,68,68,0.3)]' : 'from-purple-600/20 to-purple-500/50 border-purple-400 shadow-[0_-5px_15px_rgba(168,85,247,0.3)]'}`}></div>
                       </div>
                       <div className="text-[10px] font-bold text-slate-500 mt-4 uppercase tracking-widest">D+{i+1}</div>
                     </div>
                  );
               })}
            </div>
          </InteractiveCard>
        </div>
        
      </main>
    </div>
  );
};

export default GovDashboard;
