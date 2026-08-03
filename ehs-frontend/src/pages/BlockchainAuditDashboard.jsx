import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Link as LinkIcon, Clock, Database, AlertOctagon, CheckCircle, Activity, Info } from 'lucide-react';
import api from '../services/api';
import { Link } from 'react-router-dom';

const BlockchainAuditDashboard = () => {
  const { user } = useAuth();
  const [ledger, setLedger] = useState([]);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit/ledger');
      setLedger(res.data.chain);
    } catch (err) {
      console.error("Failed to fetch ledger", err);
    } finally {
      setLoading(false);
    }
  };

  const verifyChain = async () => {
    try {
      setVerification({ status: 'verifying' });
      const res = await api.get('/audit/verify');
      setTimeout(() => {
        setVerification({ status: 'success', message: res.data.msg });
      }, 1000); // Simulate some calculation time for visual effect
    } catch (err) {
      setTimeout(() => {
        setVerification({ 
          status: 'error', 
          message: err.response?.data?.msg || 'Cryptographic verification failed!' 
        });
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12 selection:bg-teal-500/30 font-['Inter']">
      
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 p-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100 shadow-sm">
              <Database size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-wider text-teal-700 font-['Outfit']">IMMUTABLE LEDGER</h1>
              <p className="text-slate-500 text-xs flex items-center gap-1 mt-1 font-medium">
                CareSphere Cryptographic Audit Trail
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <Link to={user?.role === 'government' ? '/government/dashboard' : '/patient/dashboard'} className="bg-white border border-slate-200 px-5 py-2 text-slate-700 hover:bg-slate-50 rounded-lg text-sm transition-colors shadow-sm font-bold">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 mt-6">
        
        {/* Verification Status */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 mb-8 relative overflow-hidden shadow-sm">
          <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-teal-50 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="flex justify-between items-center relative z-10">
            <div>
              <h2 className="text-2xl font-bold mb-2 font-['Outfit'] text-slate-800">Network Integrity</h2>
              <p className="text-slate-500 max-w-xl text-sm leading-relaxed">
                Every emergency dispatch, acceptance, and resolution is cryptographically hashed and chained. 
                Verify the ledger to mathematically prove that no medical response data has been tampered with.
              </p>
            </div>
            
            <div className="flex flex-col items-end">
              <button 
                onClick={verifyChain}
                disabled={verification?.status === 'verifying'}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 shadow-sm"
              >
                {verification?.status === 'verifying' ? (
                   <><Activity size={18} className="animate-spin" /> Verifying Hashes...</>
                ) : (
                   <><ShieldCheck size={18} /> Verify Blockchain Integrity</>
                )}
              </button>
              
              {verification && verification.status !== 'verifying' && (
                <div className={`mt-4 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm ${
                  verification.status === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {verification.status === 'success' ? <CheckCircle size={16}/> : <AlertOctagon size={16}/>}
                  {verification.message}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* The Ledger */}
        <div>
           <h3 className="text-lg font-bold mb-6 flex items-center gap-2 font-['Outfit'] text-slate-700">
             <LinkIcon size={18}/> Latest Blocks
           </h3>
           
           {loading ? (
             <div className="text-center py-12 text-slate-500">Loading blockchain data...</div>
           ) : ledger.length === 0 ? (
             <div className="text-center py-12 text-slate-500 border border-dashed border-slate-300 rounded-2xl bg-slate-50">
               No blocks found in the ledger.
             </div>
           ) : (
             <div className="space-y-6 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-teal-200 before:to-transparent">
               
               {ledger.map((block, idx) => (
                 <div key={block.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-slate-50 bg-teal-50 text-teal-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm">
                      <ShieldCheck size={20} />
                    </div>
                    
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-teal-300 transition-colors">
                      <div className="flex justify-between items-center mb-3">
                        <span className="bg-teal-50 text-teal-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-teal-100">
                          {block.action.replace('_', ' ')}
                        </span>
                        <div className="text-slate-500 text-xs font-medium flex items-center gap-1">
                          <Clock size={12}/> {new Date(block.timestamp).toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 rounded-lg p-3 mb-4 font-mono text-[10px] text-slate-500 break-all border border-slate-200 shadow-inner">
                        <span className="text-slate-700 select-none font-bold">PREV_HASH:</span> {block.previous_hash}<br/>
                        <span className="text-teal-600 select-none mt-1 inline-block font-bold">BLOCK_HASH:</span> <span className="text-teal-700">{block.block_hash}</span>
                      </div>
                      
                      <div className="text-sm text-slate-600">
                        <div className="flex items-center gap-1 mb-1 text-xs text-slate-400 font-bold uppercase tracking-wider"><Info size={12}/> Payload</div>
                        <pre className="bg-slate-50 p-2 rounded text-xs overflow-x-auto text-slate-700 border border-slate-200 shadow-inner custom-scrollbar">
                          {JSON.stringify(JSON.parse(block.details), null, 2)}
                        </pre>
                      </div>
                    </div>
                 </div>
               ))}
               
             </div>
           )}
        </div>

      </main>
    </div>
  );
};

export default BlockchainAuditDashboard;
