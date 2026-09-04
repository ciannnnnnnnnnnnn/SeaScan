import React, { useState } from 'react';
import { 
  Users, 
  MapPin, 
  AlertCircle, 
  Cpu, 
  ShieldCheck, 
  Search, 
  Leaf, 
  Check, 
  Save, 
  LayoutDashboard, 
  Activity, 
  Settings 
} from 'lucide-react';

// Sample Baseline Data
const initialSightings = [
  { id: 1, speciesMatch: 'Sargassum ilicifolium', confidence: '94.2%', user: 'Elena Rostova', role: 'Researcher', station: 'Station A', gps: '6.9214, 126.2178', date: '2026-09-02', status: 'Pending', thumbnail: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=100&q=80' },
  { id: 2, speciesMatch: 'Turbinaria ornata', confidence: '88.7%', user: 'Mark Tan', role: 'Fisherfolk', station: 'Station C', gps: '6.9011, 126.2411', date: '2026-09-03', status: 'Approved', thumbnail: 'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?auto=format&fit=crop&w=100&q=80' },
  { id: 3, speciesMatch: 'Padina australis', confidence: '79.1%', user: 'Sarah Jenkins', role: 'Student', station: 'Station B', gps: '6.9150, 126.2201', date: '2026-09-04', status: 'Pending', thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=100&q=80' }
];

const initialBaselineSpecies = [
  { id: 'sp-1', sciname: 'Sargassum ilicifolium', localName: 'Aragan', station: 'Station A - Pujada Bay' },
  { id: 'sp-2', sciname: 'Turbinaria ornata', localName: 'Samang', station: 'Station C - Guang-guang' },
  { id: 'sp-3', sciname: 'Padina australis', localName: 'Lapot-lapot', station: 'Station B - Lawigan' }
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sightings, setSightings] = useState(initialSightings);
  const [speciesList, setSpeciesList] = useState(initialBaselineSpecies);
  const [selectedSpecies, setSelectedSpecies] = useState(initialBaselineSpecies[0]);
  const [editForm, setEditForm] = useState({ ...initialBaselineSpecies[0] });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSavedAlert, setIsSavedAlert] = useState(false);

  // Moderation Handler
  const handleModerate = (id, newStatus) => {
    setSightings(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
  };

  // Species Edit Handler
  const handleSelectSpecies = (sp) => {
    setSelectedSpecies(sp);
    setEditForm({ ...sp });
  };

  const handleSaveSpecies = (e) => {
    e.preventDefault();
    setSpeciesList(prev => prev.map(s => s.id === editForm.id ? editForm : s));
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 2500);
  };

  // Filtered sightings search
  const filteredSightings = sightings.filter(s => 
    s.speciesMatch.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.station.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex min-w-0 w-full bg-slate-950 text-slate-100 font-sans antialiased">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 font-bold">
            S
          </div>
          <div>
            <h1 className="font-bold text-sm text-white tracking-wide">Admin Control</h1>
            <p className="text-[10px] text-teal-400 font-semibold uppercase tracking-wider">System Control</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 text-xs font-semibold">
          {[
            { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
            { id: 'moderation', label: 'Sightings Moderation', icon: ShieldCheck, badge: sightings.filter(s => s.status === 'Pending').length },
            { id: 'catalog', label: 'Baseline Species', icon: Leaf },
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'system', label: 'System Logs', icon: Activity },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors ${
                  activeTab === tab.id ? 'bg-teal-600 text-white shadow-md shadow-teal-900/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </div>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="px-2 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-8 space-y-8 max-w-7xl overflow-y-auto">
        {/* KPI STATS BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Registered Users</span>
              <Users className="w-4 h-4 text-teal-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-white">142</span>
              <span className="text-[10px] text-emerald-400 font-semibold">+12% this month</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Verified GPS Sightings</span>
              <MapPin className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-white">418</span>
              <span className="text-[10px] text-cyan-400 font-semibold">Active Region</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Pending Moderation</span>
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-white">
                {sightings.filter(s => s.status === 'Pending').length}
              </span>
              <span className="text-[10px] text-amber-400 font-semibold">Requires Review</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Model Accuracy</span>
              <Cpu className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-white">92.4%</span>
              <span className="text-[10px] text-teal-400 font-semibold">v3.2 Production</span>
            </div>
          </div>
        </div>

        {/* SIGHTINGS MODERATION SECTION */}
        {(activeTab === 'overview' || activeTab === 'moderation') && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden space-y-4">
            <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-400" />
                  Sightings Moderation
                </h3>
                <p className="text-xs text-slate-400">
                  Review field uploads before publishing coordinates to the public layout.
                </p>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter sightings..." 
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-6">Thumbnail</th>
                    <th className="py-3.5 px-4">Match</th>
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">GPS / Station</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSightings.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-6">
                        <img src={item.thumbnail} alt={item.speciesMatch} className="w-10 h-10 rounded-lg object-cover border border-slate-700" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white italic">{item.speciesMatch}</div>
                        <div className="text-[10px] text-teal-400">Conf: {item.confidence}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-200">{item.user}</div>
                        <div className="text-[10px] text-slate-500">{item.role}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-300 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span>{item.station}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{item.gps}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">{item.date}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 text-[10px] rounded-full font-semibold border ${
                          item.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          item.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right space-x-2">
                        {item.status === 'Pending' ? (
                          <>
                            <button onClick={() => handleModerate(item.id, 'Approved')} className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-[11px] font-semibold transition">
                              Approve
                            </button>
                            <button onClick={() => handleModerate(item.id, 'Rejected')} className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-[11px] font-semibold transition">
                              Reject
                            </button>
                          </>
                        ) : (
                          <button onClick={() => handleModerate(item.id, 'Pending')} className="text-[11px] text-slate-500 hover:text-slate-300 underline">
                            Reset
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SPECIES CATALOG MANAGEMENT */}
        {(activeTab === 'overview' || activeTab === 'catalog') && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-teal-400" />
                  Baseline Taxonomy Catalog
                </h3>
                <p className="text-xs text-slate-400">
                  Update taxonomy parameters and region assignments.
                </p>
              </div>
            </div>

            {isSavedAlert && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Species updated successfully!</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-2 max-h-96 overflow-y-auto pr-1">
                {speciesList.map((sp) => (
                  <div
                    key={sp.id}
                    onClick={() => handleSelectSpecies(sp)}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      selectedSpecies.id === sp.id 
                        ? 'bg-teal-950/50 border-teal-500 text-white' 
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:bg-slate-800/50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold italic text-slate-200">{sp.sciname}</div>
                      <div className="text-[10px] text-teal-400">Local: {sp.localName}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500">{sp.station}</div>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSaveSpecies} className="lg:col-span-7 bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Edit: <span className="italic text-teal-400">{editForm.sciname}</span>
                  </span>
                  <button type="submit" className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition">
                    <Save className="w-3.5 h-3.5" />
                    Save Entry
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Scientific Name</label>
                    <input 
                      type="text" 
                      value={editForm.sciname}
                      onChange={(e) => setEditForm({ ...editForm, sciname: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Local Name</label>
                    <input 
                      type="text" 
                      value={editForm.localName}
                      onChange={(e) => setEditForm({ ...editForm, localName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 font-semibold mb-1">Baseline Station</label>
                    <input 
                      type="text" 
                      value={editForm.station}
                      onChange={(e) => setEditForm({ ...editForm, station: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}