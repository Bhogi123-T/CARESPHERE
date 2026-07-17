import React, { useState } from 'react';
import { Pill, Search, MapPin, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const MedicineSearch = () => {
  const [query, setQuery] = useState('');
  
  // Mock inventory that normally would come from the pharmacy backend
  const mockInventory = [
    { id: 1, name: "Paracetamol 500mg", pharmacy: "Apollo Pharmacy", distance: "1.2 km", stock: 150, price: "₹25" },
    { id: 2, name: "Amoxicillin 250mg", pharmacy: "MedPlus", distance: "2.4 km", stock: 45, price: "₹85" },
    { id: 3, name: "Cetirizine 10mg", pharmacy: "Apollo Pharmacy", distance: "1.2 km", stock: 200, price: "₹18" },
    { id: 4, name: "Insulin Glargine", pharmacy: "Wellness Forever", distance: "5.1 km", stock: 12, price: "₹450" },
    { id: 5, name: "ORS Powder", pharmacy: "MedPlus", distance: "2.4 km", stock: 500, price: "₹20" }
  ];

  const filteredInventory = mockInventory.filter(item => item.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-teal-500/30 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center gap-4 mb-8">
          <Link to="/patient/dashboard" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
            <ChevronLeft size={24} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-400">
              <Pill size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Medicine Search</h1>
              <p className="text-slate-400 text-sm">Find critical medicines at nearby pharmacies in real-time.</p>
            </div>
          </div>
        </header>

        <main className="bg-slate-800/50 border border-white/5 rounded-3xl p-8 shadow-2xl">
          <div className="relative mb-8">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="text-slate-400" size={20} />
            </div>
            <input 
              type="text" 
              className="w-full bg-slate-900 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500/50"
              placeholder="Search for medicines (e.g. Paracetamol, ORS)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            {filteredInventory.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <Pill size={48} className="mx-auto mb-4 opacity-20" />
                <p>No medicines found matching "{query}"</p>
              </div>
            ) : (
              filteredInventory.map(item => (
                <div key={item.id} className="p-5 bg-slate-900/50 border border-white/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg text-teal-400">{item.name}</h3>
                    <p className="text-sm font-medium text-white flex items-center gap-2 mt-1">
                      {item.pharmacy} <span className="text-slate-500 flex items-center gap-1"><MapPin size={12}/> {item.distance}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">In Stock</p>
                      <p className="text-xl font-black text-green-400">{item.stock}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Price</p>
                      <p className="text-xl font-bold">{item.price}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MedicineSearch;
