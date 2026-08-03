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
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-purple-500/30 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center gap-4 mb-8">
          <Link to="/patient/dashboard" className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-sm">
            <ChevronLeft size={24} className="text-slate-600" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100 shadow-sm">
              <History size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Health Records</h1>
              <p className="text-slate-500 text-sm">Your digital medical history and past emergencies.</p>
            </div>
          </div>
        </header>

        <main className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="space-y-6">
            {records.map(record => (
              <div key={record.id} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-500 border border-slate-200 shadow-sm">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">{record.type}</h3>
                      <p className="text-sm text-slate-500 flex items-center gap-2 font-medium"><Calendar size={14}/> {record.date}</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-bold uppercase tracking-wider text-center shadow-sm">
                    {record.status}
                  </div>
                </div>
                
                <div className="pl-13 border-t border-slate-200 pt-4">
                  <p className="text-sm font-medium text-slate-500 mb-1">Attended by: <span className="text-slate-800 font-bold">{record.doctor}</span></p>
                  <p className="text-slate-600 text-sm">{record.desc}</p>
                </div>

                <div className="mt-4 flex justify-end">
                  <button className="flex items-center gap-2 text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors bg-purple-50 hover:bg-purple-100 border border-purple-100 px-3 py-2 rounded-lg shadow-sm">
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
