import React, { useState } from 'react';
import { Database, Filter, Download, LineChart, Layers, RefreshCw, CheckCircle2 } from 'lucide-react';

const datasetEntries = [
  { id: 'DS-101', name: 'Coastal Seagrass Transects 2026', format: 'GeoJSON / CSV', records: '1,420', size: '12.4 MB', lastUpdated: '2026-09-01' },
  { id: 'DS-102', name: 'CNN Classification Labels (v3)', format: 'JSON Dataset', records: '8,900', size: '148 MB', lastUpdated: '2026-08-28' },
  { id: 'DS-103', name: 'Water Quality Parameters Q3', format: 'CSV', records: '310', size: '1.1 MB', lastUpdated: '2026-08-15' }
];

export default function ResearchPanel() {
  const [selectedDataset, setSelectedDataset] = useState(datasetEntries[0]);
  const [filterQuery, setFilterQuery] = useState('');
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
    }, 1500);
  };

  return (
    <div className="flex-1 p-8 bg-slate-950 text-slate-100 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Database className="w-6 h-6 text-cyan-400" />
              Research & Data Analytics Panel
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Export raw spatial metrics, manage data splits, and perform environmental model comparisons.
            </p>
          </div>

          <button 
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-900/20 transition disabled:opacity-50"
          >
            {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exporting ? 'Exporting Package...' : 'Export Selected Dataset'}
          </button>
        </div>

        {/* ANALYTICS HIGHLIGHTS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <LineChart className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Dataset Density Score</div>
              <div className="text-xl font-bold text-white">0.87 Index</div>
            </div>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Validated Coordinates</div>
              <div className="text-xl font-bold text-white">10,630 Points</div>
            </div>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Model Baseline Drift</div>
              <div className="text-xl font-bold text-white">&lt; 1.2% Low</div>
            </div>
          </div>
        </div>

        {/* DATASETS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Filter className="w-4 h-4 text-cyan-400" />
                Available Research Datasets
              </h2>
              <input 
                type="text" 
                placeholder="Search datasets..." 
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-2">
              {datasetEntries
                .filter(d => d.name.toLowerCase().includes(filterQuery.toLowerCase()))
                .map((ds) => (
                  <div
                    key={ds.id}
                    onClick={() => setSelectedDataset(ds)}
                    className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      selectedDataset.id === ds.id 
                        ? 'bg-cyan-950/40 border-cyan-500 text-white' 
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-200">{ds.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{ds.id} • {ds.format}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-cyan-400">{ds.records} Records</div>
                      <div className="text-[10px] text-slate-500">{ds.size}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* METADATA INSPECTOR */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-4">
              Dataset Metadata Inspector
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block">Dataset Title</span>
                <span className="font-semibold text-slate-200">{selectedDataset.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Identifier</span>
                <span className="font-mono text-cyan-400">{selectedDataset.id}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Format</span>
                <span className="text-slate-300">{selectedDataset.format}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Recorded Samples</span>
                <span className="text-slate-300">{selectedDataset.records}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Last Modification Date</span>
                <span className="text-slate-300">{selectedDataset.lastUpdated}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}