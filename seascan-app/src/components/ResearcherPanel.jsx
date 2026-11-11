// src/components/ResearcherPanel.jsx
// Researcher panel: review community sightings, export them as CSV, read
// feedback and answer community questions. Species and station editing stays
// with administrators (enforced by the database).
import React, { useCallback, useEffect, useState } from 'react';
import { LayoutDashboard, ShieldCheck, Inbox, MessageSquare, ClipboardList, MapPin, Leaf, Download, Activity } from 'lucide-react';
import { usePortalTool } from './PortalTool';
import PortalShell, { StatTile, Panel, buttonClass } from './staff/PortalShell';
import SightingsReview from './staff/SightingsReview';
import { FeedbackInbox, QuestionsInbox } from './staff/Inboxes';
import IdentificationLog from './staff/IdentificationLog';
import { fetchAllSightings, downloadCsv } from '../lib/api';
import { useCatalog } from '../hooks/useCatalog';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, heading: 'Research Overview', description: 'Community sighting data for Pujada Bay.' },
  { id: 'sightings', label: 'Sighting Review', icon: ShieldCheck, permission: 'sightings.review', heading: 'Sighting Review', description: 'Approve, reject or delete sightings; export CSV.' },
  { id: 'questions', label: 'Questions', icon: MessageSquare, permission: 'questions.answer', heading: 'Community Questions', description: 'Answer questions from the community.' },
  { id: 'feedback', label: 'Feedback', icon: Inbox, permission: 'feedback.read', heading: 'User Feedback', description: 'Messages sent from the Help page.' },
  { id: 'identifications', label: 'Identifications', icon: Activity, permission: 'identifications.read', heading: 'Identification Log', description: 'What the Scanner answered and how long it took. No photos or accounts are stored.' },
];

export default function ResearchPanel() {
  const tool = usePortalTool('/researcher');
  const { species, stations, speciesById } = useCatalog();
  const [activeTab, setActiveTab] = useState('overview');
  const [all, setAll] = useState(null);

  const load = useCallback(async () => {
    try { setAll(await fetchAllSightings('all')); } catch { setAll([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const pending = all?.filter((s) => s.status === 'pending').length;
  const approved = all?.filter((s) => s.status === 'approved') ?? [];

  // Approved sightings per species, for a quick overview.
  const perSpecies = species.map((sp) => ({ sp, n: approved.filter((s) => s.species_id === sp.id).length }))
    .sort((a, b) => b.n - a.n);
  const max = Math.max(1, ...perSpecies.map((r) => r.n));

  const exportStations = () => downloadCsv('seascan-stations.csv',
    stations.flatMap((st) => (st.station_species.length ? st.station_species : [null]).map((l) => ({ st, l }))),
    [
      { label: 'station', value: ({ st }) => st.name },
      { label: 'latitude', value: ({ st }) => st.latitude },
      { label: 'longitude', value: ({ st }) => st.longitude },
      { label: 'station_sources', value: ({ st }) => st.sources },
      { label: 'species', value: ({ l }) => (l ? speciesById(l.species_id)?.scientific_name : '') },
      { label: 'species_source', value: ({ l }) => l?.source },
    ]);

  const tab = TABS.find((t) => t.id === activeTab);

  return (
    <PortalShell
      base="/researcher"
      title="Research Panel"
      subtitle="Data & Analytics"
      accent="cyan"
      tabs={TABS.map((t) => (t.id === 'sightings' ? { ...t, badge: pending } : t))}
      activeTab={activeTab}
      onTab={setActiveTab}
      tool={tool}
      heading={tab.heading}
      description={tab.description}
    >
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatTile label="Pending review" value={pending} icon={ClipboardList} tone="amber" />
            <StatTile label="Approved sightings" value={all ? approved.length : null} icon={MapPin} tone="cyan" />
            <StatTile label="Verified stations" value={stations.length} icon={Leaf} tone="emerald" />
          </div>
          <Panel icon={Leaf} title="Approved sightings per species"
            actions={<button onClick={exportStations} className={`${buttonClass} bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5`}><Download className="w-3.5 h-3.5" /> Stations CSV</button>}>
            <ul className="space-y-2.5">
              {perSpecies.map(({ sp, n }) => (
                <li key={sp.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="italic text-slate-300">{sp.scientific_name}</span>
                    <span className="text-slate-500 tabular-nums">{n}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-cyan-500/70" style={{ width: `${(n / max) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </>
      )}
      {activeTab === 'sightings' && <SightingsReview onChanged={load} />}
      {activeTab === 'questions' && <QuestionsInbox />}
      {activeTab === 'feedback' && <FeedbackInbox canDelete={false} />}
      {activeTab === 'identifications' && <IdentificationLog />}
    </PortalShell>
  );
}
