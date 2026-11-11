// src/components/AdminDashboard.jsx
// Administrator panel. Every number and list here comes from the database;
// the database itself only lets admins make these changes (RLS).
import React, { useCallback, useEffect, useState } from 'react';
import {
  LayoutDashboard, ShieldCheck, Leaf, MapPin, Users, Inbox, MessageSquare, Eraser, AlertCircle, ClipboardList, ScrollText, Activity, Cpu,
} from 'lucide-react';
import AuditLog from './staff/AuditLog';
import IdentificationLog from './staff/IdentificationLog';
import ModelManager from './staff/ModelManager';
import { useAuth } from '../context/AuthContext';
import { usePortalTool } from './PortalTool';
import PortalShell, { StatTile } from './staff/PortalShell';
import SightingsReview from './staff/SightingsReview';
import SpeciesManager from './staff/SpeciesManager';
import { StationsManager, UsersManager, TestDataCleanup } from './staff/AdminManagers';
import { FeedbackInbox, QuestionsInbox } from './staff/Inboxes';
import { fetchAllSightings } from '../lib/api';
import { useCatalog } from '../hooks/useCatalog';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, heading: 'Dashboard Overview', description: 'Live counts from the SeaScan database.' },
  { id: 'sightings', label: 'Sighting Review', icon: ShieldCheck, permission: 'sightings.review', heading: 'Sighting Review', description: 'Approve, reject or delete community sightings.' },
  { id: 'species', label: 'Species', icon: Leaf, permission: 'species.manage', heading: 'Species Catalogue', description: 'Digital Library content for the nine species.' },
  { id: 'stations', label: 'Stations', icon: MapPin, permission: 'stations.manage', heading: 'Survey Stations', description: 'Verified stations and the species recorded at each.' },
  { id: 'users', label: 'Users & Roles', icon: Users, permission: 'users.manage', heading: 'Users and Roles', description: 'Assign researcher or admin roles and mark test accounts.' },
  { id: 'feedback', label: 'Feedback', icon: Inbox, permission: 'feedback.read', heading: 'User Feedback', description: 'Messages sent from the Help page.' },
  { id: 'questions', label: 'Questions', icon: MessageSquare, permission: 'questions.answer', heading: 'Community Questions', description: 'Questions from the Community portal.' },
  { id: 'model', label: 'CNN Model', icon: Cpu, permission: 'model.manage', heading: 'CNN Model Management', description: 'Deployed models, test results, the server-side service and identification settings.' },
  { id: 'identifications', label: 'Identifications', icon: Activity, permission: 'identifications.read', heading: 'Identification Log', description: 'What the Scanner answered and how long it took. No photos or accounts are stored.' },
  { id: 'cleanup', label: 'Test Data', icon: Eraser, permission: 'testdata.delete', heading: 'Evaluation Session Data', description: 'Remove data created during user testing.' },
  { id: 'audit', label: 'Audit Log', icon: ScrollText, permission: 'audit.read', heading: 'Audit Log', description: 'Who changed what, and when.' },
];

export default function AdminDashboard() {
  const tool = usePortalTool('/admin');
  const { can } = useAuth();
  const { species, stations } = useCatalog();
  const [activeTab, setActiveTab] = useState('overview');
  const [counts, setCounts] = useState(null);
  const [countError, setCountError] = useState(null);
  const [userCount, setUserCount] = useState(null);

  const loadCounts = useCallback(async () => {
    try {
      const all = await fetchAllSightings('all');
      setCounts({
        pending: all.filter((s) => s.status === 'pending').length,
        approved: all.filter((s) => s.status === 'approved').length,
        total: all.length,
      });
      setCountError(null);
    } catch (err) {
      setCountError(err.message);
    }
  }, []);

  useEffect(() => { loadCounts(); }, [loadCounts]);

  const tab = TABS.find((t) => t.id === activeTab);
  const tabs = TABS.map((t) => (t.id === 'sightings' ? { ...t, badge: counts?.pending } : t));
  const needsReview = species.filter((s) => s.needs_review).length;
  const unpinned = stations.filter((s) => s.latitude === null).length;

  return (
    <PortalShell
      base="/admin"
      title="Admin Control"
      subtitle="System Control"
      accent="teal"
      tabs={tabs}
      activeTab={activeTab}
      onTab={setActiveTab}
      tool={tool}
      heading={tab.heading}
      description={tab.description}
    >
      {activeTab === 'overview' && (
        <>
          {countError && (
            <p className="text-xs text-rose-300 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> {countError}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile label="Pending sightings" value={counts?.pending} icon={ClipboardList} tone="amber" hint="Waiting for review" />
            <StatTile label="Approved sightings" value={counts?.approved} icon={MapPin} tone="cyan" hint="Shown on the public map" />
            <StatTile label="Species needing review" value={`${needsReview} / ${species.length}`} icon={Leaf} tone="emerald" hint="Profiles marked as draft" />
            <StatTile label="Stations without coordinates" value={`${unpinned} / ${stations.length}`} icon={MapPin} tone="rose" hint="Not yet pinned on the map" />
          </div>
          <UsersCountNote count={userCount} onOpen={() => setActiveTab('users')} />
          <SightingsReview onChanged={loadCounts} />
        </>
      )}
      {activeTab === 'sightings' && <SightingsReview onChanged={loadCounts} />}
      {activeTab === 'species' && <SpeciesManager />}
      {activeTab === 'stations' && <StationsManager />}
      {activeTab === 'users' && <UsersManager onCount={setUserCount} />}
      {activeTab === 'feedback' && <FeedbackInbox canDelete={can('feedback.delete')} />}
      {activeTab === 'questions' && <QuestionsInbox />}
      {activeTab === 'model' && <ModelManager />}
      {activeTab === 'identifications' && <IdentificationLog />}
      {activeTab === 'cleanup' && <TestDataCleanup />}
      {activeTab === 'audit' && <AuditLog />}
    </PortalShell>
  );
}

function UsersCountNote({ count, onOpen }) {
  return (
    <button onClick={onOpen} className="text-xs text-slate-400 hover:text-teal-300 underline">
      {count === null ? 'Manage users and roles' : `${count} registered account(s) - manage users and roles`}
    </button>
  );
}
