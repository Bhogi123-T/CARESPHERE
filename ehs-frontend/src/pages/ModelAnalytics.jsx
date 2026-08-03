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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin"></div>
        <p className="text-slate-500 mt-4 font-medium uppercase tracking-widest text-sm">Loading AI Models...</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-red-600">
        <p>Failed to load AI model metrics. Please train the model first.</p>
        <Link to="/" className="mt-4 text-teal-600 hover:underline font-bold">Return Home</Link>
      </div>
    );
  }

  return (
    <PageWrapper>
      <div className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-10 selection:bg-teal-500/30 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-10">
            <Link to="/" className="p-3 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-sm text-slate-600">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-black flex items-center gap-3 text-slate-900">
                <Cpu className="text-teal-600" size={36} />
                AI Model Analytics & Comparison
              </h1>
              <p className="text-slate-500 mt-1 text-sm font-medium">Performance evaluation of automated triage algorithms.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Model Winner & Dataset */}
            <div className="space-y-8">
              
              <div className="bg-white border border-teal-200 p-8 rounded-3xl shadow-soft relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-teal-50 blur-3xl rounded-full"></div>
                <Badge variant="success" className="mb-4">Winning Algorithm</Badge>
                <h2 className="text-3xl font-black text-teal-600 mb-2 flex items-center gap-2 relative z-10">
                  <Award size={28} /> {metrics.winning_model}
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 relative z-10">
                  Selected for production due to superior handling of non-linear symptom relationships and resistance to overfitting on rural healthcare datasets.
                </p>
                <div className="grid grid-cols-2 gap-4 relative z-10">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Peak Accuracy</p>
                    <p className="text-2xl font-black text-green-600">
                      {metrics.models.find(m => m.name === 'RandomForest')?.accuracy}%
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Precision</p>
                    <p className="text-2xl font-black text-blue-600">
                      {metrics.models.find(m => m.name === 'RandomForest')?.precision}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800">
                  <Database className="text-purple-500" size={24} /> Training Pipeline
                </h3>
                <ul className="space-y-4">
                  <li className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                    <span className="text-slate-600 font-medium">Dataset Size</span>
                    <span className="text-slate-800 font-bold">{metrics.sample_size} records</span>
                  </li>
                  <li className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                    <span className="text-slate-600 font-medium">Vectorization</span>
                    <span className="text-slate-800 font-bold text-right max-w-[150px]">{metrics.vectorizer}</span>
                  </li>
                  <li className="flex flex-col gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                    <span className="text-slate-600 font-medium">Target Classes</span>
                    <div className="flex gap-2 mt-1">
                      {metrics.classes.map(c => (
                        <span key={c} className={`px-2 py-1 text-xs font-bold rounded-md ${c === 'HIGH' ? 'bg-red-50 border border-red-200 text-red-600' : c === 'MEDIUM' ? 'bg-orange-50 border border-orange-200 text-orange-600' : 'bg-green-50 border border-green-200 text-green-600'}`}>
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
              
              <div className="bg-white border border-slate-200 p-8 rounded-3xl h-[400px] shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800">
                  <Activity className="text-green-500" size={24} /> Model Comparison (Accuracy vs Precision)
                </h3>
                <ResponsiveContainer width="100%" height="80%">
                  <BarChart data={metrics.models} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b' }} />
                    <YAxis domain={[80, 100]} stroke="#64748b" tick={{ fill: '#64748b' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="accuracy" name="Accuracy (%)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="precision" name="Precision (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="f1_score" name="F1-Score (%)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white border border-slate-200 p-8 rounded-3xl h-[400px] shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800">
                  <ShieldCheck className="text-orange-500" size={24} /> Performance Radar
                </h3>
                <ResponsiveContainer width="100%" height="85%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={metrics.models}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 14 }} />
                    <PolarRadiusAxis angle={30} domain={[80, 100]} tick={{ fill: '#94a3b8' }} />
                    <Radar name="Accuracy" dataKey="accuracy" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.4} />
                    <Radar name="Recall" dataKey="recall" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* GAN Section */}
              {ganMetrics && (
                <div className="bg-white border border-purple-200 p-8 rounded-3xl shadow-soft mt-8 relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-50 blur-3xl rounded-full"></div>
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2 text-purple-600">
                        <Database size={24} /> GAN Data Synthesizer
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">Generative Adversarial Network for Zero-Day Payload & Synthetic Patient Data Generation</p>
                    </div>
                    <Badge variant="primary">{ganMetrics.privacy_compliance}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-6 relative z-10">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Records Generated</p>
                      <p className="text-2xl font-black text-purple-600">{ganMetrics.records_generated}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Generator Loss</p>
                      <p className="text-2xl font-black text-slate-700">{ganMetrics.generator_loss}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Discriminator Loss</p>
                      <p className="text-2xl font-black text-slate-700">{ganMetrics.discriminator_loss}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 font-mono text-xs text-slate-600 h-32 overflow-y-auto border border-slate-200 shadow-inner custom-scrollbar relative z-10">
                    <p className="text-purple-600 font-bold mb-2">// SAMPLE SYNTHETIC DATA OUTPUT</p>
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
  const base = "px-3 py-1 text-xs font-black uppercase tracking-widest rounded-full inline-block shadow-sm";
  const variants = {
    primary: "bg-blue-50 border border-blue-200 text-blue-600",
    success: "bg-green-50 border border-green-200 text-green-600",
    danger: "bg-red-50 border border-red-200 text-red-600",
    warning: "bg-yellow-50 border border-yellow-200 text-yellow-600",
  };
  return <span className={`${base} ${variants[variant]} ${className}`}>{children}</span>;
};

export default ModelAnalytics;
