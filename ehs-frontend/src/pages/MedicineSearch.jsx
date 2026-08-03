import React, { useState, useEffect } from 'react';
import { Pill, Search, MapPin, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const MedicineSearch = () => {
  const [query, setQuery] = useState('');
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('../services/api').then(({ default: api }) => {
      api.get('/pharmacy/inventory').then(res => {
        // Map backend items to add dummy pharmacy data since the model doesn't have it yet
        const mapped = res.data.map(item => ({
          ...item,
          pharmacy: "Apollo Pharmacy", // Dummy data for UI
          distance: "1.2 km", // Dummy data for UI
          price: "₹" + (Math.floor(Math.random() * 100) + 20) // Random price for UI
        }));
        setInventory(mapped);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    });
  }, []);

  const filteredInventory = inventory.filter(item => item.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-teal-500/30 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center gap-4 mb-8">
          <Link to="/patient/dashboard" className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-sm">
            <ChevronLeft size={24} className="text-slate-600" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100 shadow-sm">
              <Pill size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Medicine Search</h1>
              <p className="text-slate-500 text-sm">Find critical medicines at nearby pharmacies in real-time.</p>
            </div>
          </div>
        </header>

        <main className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="relative mb-8">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="text-slate-400" size={20} />
            </div>
            <input 
              type="text" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 shadow-inner transition-all"
              placeholder="Search for medicines (e.g. Paracetamol, ORS)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            {filteredInventory.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Pill size={48} className="mx-auto mb-4 opacity-20" />
                <p>No medicines found matching "{query}"</p>
              </div>
            ) : (
              filteredInventory.map(item => (
                <div key={item.id} className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <h3 className="font-bold text-lg text-teal-600">{item.name}</h3>
                    <p className="text-sm font-medium text-slate-700 flex items-center gap-2 mt-1">
                      {item.pharmacy} <span className="text-slate-500 flex items-center gap-1"><MapPin size={12}/> {item.distance}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">In Stock</p>
                      <p className="text-xl font-black text-green-600">{item.stock}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Price</p>
                      <p className="text-xl font-bold text-slate-800">{item.price}</p>
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
