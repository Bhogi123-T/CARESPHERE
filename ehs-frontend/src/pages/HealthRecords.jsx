import React from 'react';
import { History, ChevronLeft, Calendar, FileText, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

const HealthRecords = () => {
  const records = [
    { id: 1, date: "12 Aug 2025", type: "Emergency SOS", doctor: "Dr. Ramesh (Apollo)", desc: "Severe Chest Pain, dispatched ambulance. Patient stabilized.", status: "Resolved" },
    { id: 2, date: "05 Jul 2025", type: "Prescription", doctor: "Dr. Priya (Care Clinic)", desc: "Prescribed Amoxicillin 250mg for throat infection.", status: "Completed" },
    { id: 3, date: "22 May 2025", type: "Vaccination", doctor: "Govt Health Worker", desc: "Tetanus booster shot administered.", status: "Completed" }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-purple-500/30 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center gap-4 mb-8">
          <Link to="/patient/dashboard" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
            <ChevronLeft size={24} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
              <History size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Health Records</h1>
              <p className="text-slate-400 text-sm">Your digital medical history and past emergencies.</p>
            </div>
          </div>
        </header>

        <main className="bg-slate-800/50 border border-white/5 rounded-3xl p-8 shadow-2xl">
          <div className="space-y-6">
            {records.map(record => (
              <div key={record.id} className="p-6 bg-slate-900/50 border border-white/5 rounded-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-white/10">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{record.type}</h3>
                      <p className="text-sm text-slate-400 flex items-center gap-2"><Calendar size={14}/> {record.date}</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-bold uppercase tracking-wider text-center">
                    {record.status}
                  </div>
                </div>
                
                <div className="pl-13 border-t border-white/5 pt-4">
                  <p className="text-sm font-medium text-slate-300 mb-1">Attended by: <span className="text-white">{record.doctor}</span></p>
                  <p className="text-slate-400 text-sm">{record.desc}</p>
                </div>

                <div className="mt-4 flex justify-end">
                  <button className="flex items-center gap-2 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors bg-purple-500/10 px-3 py-2 rounded-lg">
                    <Download size={14} /> Download PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default HealthRecords;
