// src/pages/DeveloperPortal.jsx
import { supabase } from '../supabaseClient';
import ThemeToggle from '../components/ThemeToggle';
import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Bug,
  MessageSquare,
  Activity,
  Users,
  Search,
  LogOut,
  Server,
  Star,
  Cpu,
  Database,
  GitBranch,
  LogIn
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Reveal, CountUp } from '../components/motion';
import PortalSiteLinks from '../components/PortalSiteLinks';
import { usePortalTool } from '../components/PortalTool';

const devTeam = [
  {
    id: 'dev-1',
    name: 'Labrador, C. M.',
    role: 'Full-Stack Developer',
    focus: 'React front-end architecture, Supabase integration, and authentication flows.',
  },
  {
    id: 'dev-2',
    name: 'Indong, J.',
    role: 'AI / Machine Learning Engineer',
    focus: 'CNN image classification model for seagrass species identification.',
  },
  {
    id: 'dev-3',
    name: 'Ramaila, Dave N.',
    role: 'Backend & GIS Developer',
    focus: 'Flask API services, Supabase data modeling, and the distribution mapping system.',
  },
];

const initialReports = [
  { id: 'BUG-014', title: 'Scanner returns low confidence on blurred Halophila samples', module: 'Scanner', severity: 'High', reporter: 'Elena Rostova', assignee: 'Indong, J.', status: 'Open', date: '2026-09-06' },
  { id: 'BUG-013', title: 'Map markers not clustering at zoom level 12', module: 'Distribution Map', severity: 'Medium', reporter: 'Mark Tan', assignee: 'Ramaila, Dave N.', status: 'In Progress', date: '2026-09-05' },
  { id: 'BUG-012', title: 'Session not restored after browser refresh on mobile', module: 'Authentication', severity: 'Critical', reporter: 'Sarah Jenkins', assignee: 'Labrador, C. M.', status: 'Open', date: '2026-09-04' },
  { id: 'BUG-011', title: 'Species filter resets when closing the botanical profile modal', module: 'Species Library', severity: 'Low', reporter: 'Juan Dela Cruz', assignee: 'Labrador, C. M.', status: 'Resolved', date: '2026-09-01' },
];

const initialFeedback = [
  { id: 'FB-021', user: 'Sarah Jenkins', role: 'Student', module: 'Scanner', rating: 5, message: 'Identification is fast and the botanical breakdown helped a lot with our field report.', date: '2026-09-06', status: 'New' },
  { id: 'FB-020', user: 'Mark Tan', role: 'Fisherfolk', module: 'Distribution Map', rating: 3, message: 'Hard to read the station labels on a small phone screen while out on the boat.', date: '2026-09-05', status: 'New' },
  { id: 'FB-019', user: 'Elena Rostova', role: 'Researcher', module: 'Species Library', rating: 4, message: 'Would be great to export the morphology table as CSV for our lab notes.', date: '2026-09-03', status: 'Reviewed' },
];

const severityStyles = {
  Critical: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  High: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Medium: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  Low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const statusStyles = {
  Open: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'In Progress': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  Resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export default function DeveloperPortal() {
  const { user, logout } = useAuth();
  const tool = usePortalTool('/developers');
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [reports, setReports] = useState(initialReports);
  const [feedback, setFeedback] = useState(initialFeedback);
  const [searchQuery, setSearchQuery] = useState('');
  const [apiStatus, setApiStatus] = useState('checking');

  // Live probe of the database the app reads directly (species table).
  useEffect(() => {
    let cancelled = false;
    supabase.from('species').select('id', { head: true, count: 'exact' })
      .then(({ error }) => (error ? 'degraded' : 'online'), () => 'offline')
      .then((status) => {
        if (!cancelled) setApiStatus(status);
      });
    return () => { cancelled = true; };
  }, []);

  const openIssues = reports.filter((r) => r.status !== 'Resolved').length;
  const newFeedback = feedback.filter((f) => f.status === 'New').length;
  const avgRating = (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1);

  const filteredReports = reports.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.assignee.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const setReportStatus = (id, status) => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const markFeedbackReviewed = (id) => {
    setFeedback((prev) => prev.map((f) => (f.id === id ? { ...f, status: 'Reviewed' } : f)));
  };

  const services = [
    { name: 'Supabase Postgres', detail: 'species, stations, sightings, feedback (Row Level Security)', icon: Database, status: apiStatus },
    { name: 'Supabase Auth', detail: 'Email/password sessions; roles in the profiles table', icon: LogIn, status: apiStatus },
    { name: 'Supabase Storage', detail: 'Private sighting photos, public species photos', icon: Server, status: apiStatus },
    { name: 'In-browser models', detail: 'Gate + MobileNetV3 species model (TensorFlow.js)', icon: Cpu, status: 'online' },
  ];

  const statusDot = (status) => {
    if (status === 'online') return 'bg-emerald-400';
    if (status === 'checking') return 'bg-slate-500 animate-pulse';
    if (status === 'degraded') return 'bg-amber-400';
    return 'bg-rose-500';
  };

  return (
    <div className="h-screen flex min-w-0 w-full overflow-hidden bg-slate-950 text-slate-100 font-sans antialiased">
      {/* SIDEBAR NAVIGATION - pinned to the viewport; only the nav list scrolls */}
      <aside className="w-64 h-full bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center text-slate-950 font-extrabold shadow-lg shadow-violet-900/40">
            D
          </div>
          <div>
            <h1 className="font-bold text-sm text-white tracking-wide">Developer Console</h1>
            <p className="text-[11px] text-violet-300 font-semibold uppercase tracking-wider">Engineering Team</p>
          </div>
        </div>

        <nav className="thin-scroll flex-1 min-h-0 overflow-y-auto p-4 space-y-1 text-xs font-semibold">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'reports', label: 'Bug Reports', icon: Bug, badge: openIssues },
            { id: 'feedback', label: 'User Feedback', icon: MessageSquare, badge: newFeedback },
            { id: 'system', label: 'System Health', icon: Activity },
            { id: 'team', label: 'Dev Team', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); if (tool) navigate('/developers'); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors ${
                  activeTab === tab.id
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-900/30'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </div>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="px-2 py-0.5 text-[11px] bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}

          <PortalSiteLinks base="/developers" activeClass="bg-violet-600 text-white shadow-md shadow-violet-900/30" />
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <p className="text-[11px] text-slate-500 truncate">
            Signed in as <span className="text-slate-300 font-semibold">{user?.fullName}</span>
          </p>
          <ThemeToggle withLabel />
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-950/40 border border-rose-900/40 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Log Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="thin-scroll flex-1 min-w-0 h-full overflow-y-auto">
        {tool || (
        <div className="p-8 space-y-6 max-w-7xl">
        {/* KPI STATS BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Reveal>
            <div className="hover-lift relative overflow-hidden h-full p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 space-y-3">
            <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-amber-500/10 blur-2xl" />
            <div className="relative flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Open Issues</span>
              <Bug className="w-4 h-4 text-amber-400" />
            </div>
            <div className="relative flex items-baseline justify-between">
              <span className="text-3xl font-bold text-white tabular-nums">{openIssues}</span>
              <span className="text-[11px] text-amber-400 font-semibold">Needs triage</span>
            </div>
            </div>
          </Reveal>

          <Reveal delay={60}>
            <div className="hover-lift relative overflow-hidden h-full p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 space-y-3">
            <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-cyan-500/10 blur-2xl" />
            <div className="relative flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Unread Feedback</span>
              <MessageSquare className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="relative flex items-baseline justify-between">
              <span className="text-3xl font-bold text-white tabular-nums">{newFeedback}</span>
              <span className="text-[11px] text-cyan-400 font-semibold">From community</span>
            </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="hover-lift relative overflow-hidden h-full p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 space-y-3">
            <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-teal-500/10 blur-2xl" />
            <div className="relative flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Avg. User Rating</span>
              <Star className="w-4 h-4 text-teal-400" />
            </div>
            <div className="relative flex items-baseline justify-between">
              <span className="text-3xl font-bold text-white tabular-nums"><CountUp value={Number(avgRating)} decimals={1} /></span>
              <span className="text-[11px] text-slate-400 font-semibold">out of 5.0</span>
            </div>
            </div>
          </Reveal>

          <Reveal delay={180}>
            <div className="hover-lift relative overflow-hidden h-full p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 space-y-3">
            <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-emerald-500/10 blur-2xl" />
            <div className="relative flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Backend API</span>
              <Server className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="relative flex items-baseline justify-between">
              <span className="text-2xl font-bold text-white capitalize">{apiStatus}</span>
              <span className={`w-2.5 h-2.5 rounded-full ${statusDot(apiStatus)}`} />
            </div>
            </div>
          </Reveal>
        </div>

        {/* BUG REPORTS */}
        {(activeTab === 'overview' || activeTab === 'reports') && (
          <Reveal>
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Bug className="w-5 h-5 text-violet-400" />
                  Bug Reports
                </h3>
                <p className="text-xs text-slate-400">
                  Issues raised from the field, triaged and assigned across the development team.
                </p>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter reports..."
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors w-full sm:w-56"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-6">Report</th>
                    <th className="py-3.5 px-4">Severity</th>
                    <th className="py-3.5 px-4">Assignee</th>
                    <th className="py-3.5 px-4">Reported By</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredReports.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-6">
                        <div className="font-semibold text-white">{item.title}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {item.id} • {item.module} • {item.date}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 text-[11px] rounded-full font-semibold border ${severityStyles[item.severity]}`}>
                          {item.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{item.assignee}</td>
                      <td className="py-3 px-4 text-slate-400">{item.reporter}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 text-[11px] rounded-full font-semibold border ${statusStyles[item.status]}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right space-x-2">
                        {item.status === 'Resolved' ? (
                          <button
                            onClick={() => setReportStatus(item.id, 'Open')}
                            className="text-xs text-slate-500 hover:text-slate-300 underline"
                          >
                            Reopen
                          </button>
                        ) : (
                          <>
                            {item.status === 'Open' && (
                              <button
                                onClick={() => setReportStatus(item.id, 'In Progress')}
                                className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-semibold transition"
                              >
                                Start
                              </button>
                            )}
                            <button
                              onClick={() => setReportStatus(item.id, 'Resolved')}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-semibold transition"
                            >
                              Resolve
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </Reveal>
        )}

        {/* USER FEEDBACK */}
        {(activeTab === 'overview' || activeTab === 'feedback') && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-5">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-violet-400" />
                Community Feedback
              </h3>
              <p className="text-xs text-slate-400">
                Suggestions and issues submitted by students, fisherfolk, and researchers using SeaScan.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {feedback.map((item) => (
                <div key={item.id} className="hover-lift p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-violet-500/40 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < item.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
                        {item.module}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">"{item.message}"</p>

                    <div className="text-[11px] text-slate-500">
                      <span className="text-slate-400 font-semibold">{item.user}</span> • {item.role} • {item.date}
                    </div>
                  </div>

                  {item.status === 'New' ? (
                    <button
                      onClick={() => markFeedbackReviewed(item.id)}
                      className="w-full py-2 rounded-lg bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/30 text-xs font-semibold transition"
                    >
                      Mark as Reviewed
                    </button>
                  ) : (
                    <span className="text-[11px] text-emerald-400 font-semibold text-center py-2">Reviewed</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SYSTEM HEALTH */}
        {(activeTab === 'overview' || activeTab === 'system') && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-5">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-violet-400" />
                System Health
              </h3>
              <p className="text-xs text-slate-400">
                Service checks across the SeaScan stack. The database is probed live on page load.
              </p>
            </div>

            <div className="space-y-2">
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <div
                    key={service.name}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-200">{service.name}</div>
                        <div className="text-[11px] text-slate-500">{service.detail}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${statusDot(service.status)}`} />
                      <span className="text-xs font-semibold text-slate-300 capitalize">{service.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DEV TEAM */}
        {(activeTab === 'overview' || activeTab === 'team') && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-5">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-violet-400" />
                Development Team
              </h3>
              <p className="text-xs text-slate-400">
                DORSU - BSIT 2026 capstone team and current issue load.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {devTeam.map((dev) => {
                const assigned = reports.filter((r) => r.assignee === dev.name && r.status !== 'Resolved').length;
                return (
                  <div key={dev.id} className="hover-lift p-5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-violet-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-300 font-bold">
                        {dev.name.charAt(0)}
                      </div>
                      <span className="text-[11px] px-2 py-1 rounded-full bg-slate-800 text-slate-400 font-semibold">
                        {assigned} open
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{dev.name}</h4>
                      <p className="text-[11px] text-violet-300 font-semibold uppercase tracking-wide mt-0.5">
                        {dev.role}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{dev.focus}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        </div>
        )}
      </main>
    </div>
  );
}
