import React, { useState, useEffect } from 'react';
import { ArrowLeft, Cpu, Activity, ShieldCheck, Database, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import api from '../services/api';
import PageWrapper from '../components/ui/PageWrapper';

const ModelAnalytics = () => {
  const [metrics, setMetrics] = useState(null);
  const [ganMetrics, setGanMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [res, ganRes] = await Promise.all([
          api.get('/ml/metrics'),
          api.get('/ml/gan-data').catch(() => ({ data: null }))
        ]);
        setMetrics(res.data.metrics);
        if (ganRes.data) setGanMetrics(ganRes.data);
      } catch (err) {
        console.error("Failed to load metrics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 mt-4 font-medium uppercase tracking-widest text-sm">Loading AI Models...</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-red-400">
        <p>Failed to load AI model metrics. Please train the model first.</p>
        <Link to="/" className="mt-4 text-blue-400 hover:underline">Return Home</Link>
      </div>
    );
  }

  return (
    <PageWrapper>
      <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10 selection:bg-blue-500/30 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-10">
            <Link to="/" className="p-3 bg-slate-900 border border-slate-700 rounded-full hover:bg-slate-800 transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-black flex items-center gap-3">
                <Cpu className="text-blue-500" size={36} />
                AI Model Analytics & Comparison
              </h1>
              <p className="text-slate-400 mt-1 text-sm font-medium">Performance evaluation of automated triage algorithms.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Model Winner & Dataset */}
            <div className="space-y-8">
              
              <div className="bg-gradient-to-br from-blue-900/40 to-slate-900 border border-blue-500/30 p-8 rounded-3xl shadow-[0_0_40px_rgba(59,130,246,0.15)] relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 blur-3xl rounded-full"></div>
                <Badge variant="success" className="mb-4">Winning Algorithm</Badge>
                <h2 className="text-3xl font-black text-blue-400 mb-2 flex items-center gap-2">
                  <Award size={28} /> {metrics.winning_model}
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  Selected for production due to superior handling of non-linear symptom relationships and resistance to overfitting on rural healthcare datasets.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Peak Accuracy</p>
                    <p className="text-2xl font-black text-green-400">
                      {metrics.models.find(m => m.name === 'RandomForest')?.accuracy}%
                    </p>
                  </div>
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Precision</p>
                    <p className="text-2xl font-black text-blue-400">
                      {metrics.models.find(m => m.name === 'RandomForest')?.precision}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-700/50 p-8 rounded-3xl">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Database className="text-purple-400" size={24} /> Training Pipeline
                </h3>
                <ul className="space-y-4">
                  <li className="flex justify-between items-center p-4 bg-slate-950/50 rounded-xl border border-white/5">
                    <span className="text-slate-400 font-medium">Dataset Size</span>
                    <span className="text-white font-bold">{metrics.sample_size} records</span>
                  </li>
                  <li className="flex justify-between items-center p-4 bg-slate-950/50 rounded-xl border border-white/5">
                    <span className="text-slate-400 font-medium">Vectorization</span>
                    <span className="text-white font-bold text-right max-w-[150px]">{metrics.vectorizer}</span>
                  </li>
                  <li className="flex flex-col gap-2 p-4 bg-slate-950/50 rounded-xl border border-white/5">
                    <span className="text-slate-400 font-medium">Target Classes</span>
                    <div className="flex gap-2 mt-1">
                      {metrics.classes.map(c => (
                        <span key={c} className={`px-2 py-1 text-xs font-bold rounded-md ${c === 'HIGH' ? 'bg-red-500/20 text-red-400' : c === 'MEDIUM' ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </li>
                </ul>
              </div>

            </div>

            {/* Right Column: Charts */}
            <div className="lg:col-span-2 space-y-8">
              
              <div className="bg-slate-900/60 border border-slate-700/50 p-8 rounded-3xl h-[400px]">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Activity className="text-green-400" size={24} /> Model Comparison (Accuracy vs Precision)
                </h3>
                <ResponsiveContainer width="100%" height="80%">
                  <BarChart data={metrics.models} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                    <YAxis domain={[80, 100]} stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="accuracy" name="Accuracy (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="precision" name="Precision (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="f1_score" name="F1-Score (%)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-900/60 border border-slate-700/50 p-8 rounded-3xl h-[400px]">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <ShieldCheck className="text-orange-400" size={24} /> Performance Radar
                </h3>
                <ResponsiveContainer width="100%" height="85%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={metrics.models}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 14 }} />
                    <PolarRadiusAxis angle={30} domain={[80, 100]} tick={{ fill: '#64748b' }} />
                    <Radar name="Accuracy" dataKey="accuracy" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                    <Radar name="Recall" dataKey="recall" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* GAN Section */}
              {ganMetrics && (
                <div className="bg-gradient-to-br from-purple-900/40 to-slate-900 border border-purple-500/30 p-8 rounded-3xl shadow-[0_0_40px_rgba(168,85,247,0.15)] mt-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2 text-purple-400">
                        <Database size={24} /> GAN Data Synthesizer
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">Generative Adversarial Network for Zero-Day Payload & Synthetic Patient Data Generation</p>
                    </div>
                    <Badge variant="primary">{ganMetrics.privacy_compliance}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Records Generated</p>
                      <p className="text-2xl font-black text-purple-400">{ganMetrics.records_generated}</p>
                    </div>
                    <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Generator Loss</p>
                      <p className="text-2xl font-black text-slate-300">{ganMetrics.generator_loss}</p>
                    </div>
                    <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Discriminator Loss</p>
                      <p className="text-2xl font-black text-slate-300">{ganMetrics.discriminator_loss}</p>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 rounded-xl p-4 font-mono text-xs text-slate-400 h-32 overflow-y-auto border border-white/5 custom-scrollbar">
                    <p className="text-purple-400 mb-2">// SAMPLE SYNTHETIC DATA OUTPUT</p>
                    <pre>{JSON.stringify(ganMetrics.sample_data, null, 2)}</pre>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

// Helper Badge component since it's not exported globally
const Badge = ({ children, variant = 'primary', className = '' }) => {
  const base = "px-3 py-1 text-xs font-black uppercase tracking-widest rounded-full inline-block";
  const variants = {
    primary: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    success: "bg-green-500/20 text-green-400 border border-green-500/30",
    danger: "bg-red-500/20 text-red-400 border border-red-500/30",
    warning: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  };
  return <span className={`${base} ${variants[variant]} ${className}`}>{children}</span>;
};

export default ModelAnalytics;
