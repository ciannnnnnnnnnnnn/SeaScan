// src/pages/CommunityPortal.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  MessageSquare,
  LogOut,
  Camera,
  MapPin,
  Leaf,
  Send,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Clock,
  ImagePlus,
  Trash2,
  Menu,
  X,
} from 'lucide-react';
import { useAuth, accountLabel } from '../context/AuthContext';
import { fetchMySightings, fetchMyQuestions, askQuestion, deleteQuestion } from '../lib/api';
import { useCatalog } from '../hooks/useCatalog';
import PortalSiteLinks from '../components/PortalSiteLinks';
import { usePortalTool } from '../components/PortalTool';
import { Reveal } from '../components/motion';
import SightingForm from '../components/SightingForm';
import ThemeToggle from '../components/ThemeToggle';

export default function CommunityPortal() {
  const { user, logout } = useAuth();
  const tool = usePortalTool('/community');
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [menuOpen, setMenuOpen] = useState(false);

  const [sightings, setSightings] = useState([]);
  const [loadingSightings, setLoadingSightings] = useState(true);

  // Ask a researcher
  const [questions, setQuestions] = useState([]);
  const [questionText, setQuestionText] = useState('');
  const [questionTopic, setQuestionTopic] = useState('Species identification');
  const [sending, setSending] = useState(false);
  const [askError, setAskError] = useState(null);
  const [askNotice, setAskNotice] = useState(null);

  const { speciesById } = useCatalog();

  const loadSightings = useCallback(async () => {
    if (!user) return;
    try { setSightings(await fetchMySightings(user.id)); } catch { setSightings([]); }
    setLoadingSightings(false);
  }, [user]);

  const loadQuestions = useCallback(async () => {
    if (!user) return;
    try { setQuestions(await fetchMyQuestions(user.id)); } catch { setQuestions([]); }
  }, [user]);

  useEffect(() => { loadSightings(); loadQuestions(); }, [loadSightings, loadQuestions]);

  const removeQuestion = async (q) => {
    if (!window.confirm(q.answer ? 'Delete this question and the researcher\'s reply?' : 'Delete this question?')) return;
    setAskError(null);
    setAskNotice(null);
    try {
      await deleteQuestion(q.id);
      setAskNotice('Question deleted.');
      loadQuestions();
    } catch (err) {
      setAskError(err.message);
    }
  };

  const submitQuestion = async (e) => {
    e.preventDefault();
    setSending(true);
    setAskError(null);
    setAskNotice(null);
    try {
      await askQuestion(questionTopic, questionText);
      setAskNotice('Question sent to the research team.');
      setQuestionText('');
      loadQuestions();
    } catch (err) {
      setAskError(err.message);
    } finally {
      setSending(false);
    }
  };

  const distinctSpecies = new Set(sightings.map((s) => s.species_id)).size;
  const thisMonth = sightings.filter((s) => {
    const d = new Date(s.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const navTabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'record', label: 'Record a Sighting', icon: ImagePlus },
    { id: 'sightings', label: 'My Sightings', icon: ClipboardList, badge: sightings.length },
    { id: 'ask', label: 'Ask a Researcher', icon: MessageSquare },
  ];

  // Same content for the desktop sidebar and the phone slide-in menu.
  const sidebar = (
    <>
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 font-extrabold shadow-lg shadow-emerald-900/40">
          <Leaf className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <h1 className="font-bold text-sm text-white tracking-wide">Community Hub</h1>
          <p className="text-[11px] text-emerald-300 font-semibold uppercase tracking-wider">Citizen Science</p>
        </div>
        <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="md:hidden p-1.5 text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="thin-scroll flex-1 min-h-0 overflow-y-auto p-4 space-y-1 text-xs font-semibold">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = !tool && activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setMenuOpen(false); if (tool) navigate('/community'); }}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </div>
              {tab.badge > 0 && (
                <span className="px-2 py-0.5 text-[11px] bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30 tabular-nums">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}

        <PortalSiteLinks base="/community" activeClass="bg-emerald-600 text-white shadow-md shadow-emerald-900/30" />
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-2">
        <p className="text-[11px] text-slate-500 truncate">
          Signed in as <span className="text-slate-300 font-semibold">{accountLabel(user)}</span>
        </p>
        <ThemeToggle withLabel />
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-950/40 border border-rose-900/40 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Log Out
        </button>
      </div>
    </>
  );

  return (
    <div className="h-screen flex min-w-0 w-full overflow-hidden bg-slate-950 text-slate-100 font-sans antialiased">
      {/* SIDEBAR - emerald, distinct from the three staff portals. On phones it
          becomes a slide-in menu so the work area keeps the full width. */}
      <aside className="hidden md:flex w-64 h-full bg-slate-900 border-r border-slate-800 flex-col shrink-0">
        {sidebar}
      </aside>

      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-slate-950/70 backdrop-in"
          // Close on the backdrop, and after following a tool link inside the menu.
          onClick={(e) => { if (e.target === e.currentTarget || e.target.closest('a')) setMenuOpen(false); }}
        >
          <aside className="drawer-in-left w-72 max-w-[85vw] h-full bg-slate-900 border-r border-slate-800 flex flex-col">
            {sidebar}
          </aside>
        </div>
      )}

      {/* MAIN */}
      <main className="thin-scroll flex-1 min-w-0 h-full overflow-y-auto">
        <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
          <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu" className="p-2 rounded-lg bg-slate-800 text-slate-300">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-white">Community Hub</span>
        </div>

        {tool || (
          <>
            <div className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 md:px-8 py-5">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {navTabs.find((t) => t.id === activeTab)?.label}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Your contributions to the SeaScan seagrass record for Pujada Bay.
              </p>
            </div>

            <div className="p-4 md:p-8 space-y-6 max-w-7xl">

              {/* OVERVIEW */}
              {activeTab === 'overview' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Reveal>
                      <div className="hover-lift relative overflow-hidden h-full p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 space-y-3">
                        <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-emerald-500/10 blur-2xl" />
                        <div className="relative flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-400">Sightings Recorded</span>
                          <ClipboardList className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="relative text-3xl font-bold text-white tabular-nums">
                          {sightings.length}
                        </div>
                      </div>
                    </Reveal>

                    <Reveal delay={60}>
                      <div className="hover-lift relative overflow-hidden h-full p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 space-y-3">
                        <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-teal-500/10 blur-2xl" />
                        <div className="relative flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-400">Species Contributed</span>
                          <Leaf className="w-4 h-4 text-teal-400" />
                        </div>
                        <div className="relative text-3xl font-bold text-white tabular-nums">
                          {distinctSpecies}
                          <span className="text-sm text-slate-500 font-semibold"> / 9</span>
                        </div>
                      </div>
                    </Reveal>

                    <Reveal delay={120}>
                      <div className="hover-lift relative overflow-hidden h-full p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 space-y-3">
                        <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-cyan-500/10 blur-2xl" />
                        <div className="relative flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-400">This Month</span>
                          <MapPin className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="relative text-3xl font-bold text-white tabular-nums">{thisMonth}</div>
                      </div>
                    </Reveal>
                  </div>

                  {/* Quick actions */}
                  <Reveal>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        onClick={() => setActiveTab('record')}
                        className="hover-lift group text-left p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 space-y-3"
                      >
                        <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center justify-center">
                          <Camera className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-bold text-white">Record a Sighting</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Upload a photo and pin exactly where you found the seagrass.
                        </p>
                      </button>

                      <button
                        onClick={() => setActiveTab('ask')}
                        className="hover-lift group text-left p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 space-y-3"
                      >
                        <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 flex items-center justify-center">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-bold text-white">Ask a Researcher</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Unsure about an identification? Send it to the DORSU research team.
                        </p>
                      </button>

                      <Link
                        to="/community/map"
                        className="hover-lift group p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 space-y-3"
                      >
                        <div className="w-11 h-11 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-300 flex items-center justify-center">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-bold text-white">See the Meadows</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          View recorded seagrass distribution across Pujada Bay.
                        </p>
                      </Link>
                    </div>
                  </Reveal>
                </>
              )}


              {/* RECORD A SIGHTING */}
              {activeTab === 'record' && (
                <Reveal>
                  <div className="max-w-2xl bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-5">
                    <div className="border-b border-slate-800 pb-4">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <ImagePlus className="w-5 h-5 text-emerald-400" />
                        Record a sighting
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Not sure which species?{' '}
                        <Link to="/community/scanner" className="text-emerald-300 hover:text-emerald-200 underline">
                          Identify it with the scanner first
                        </Link>.
                      </p>
                    </div>
                    <SightingForm accent="emerald" onSaved={loadSightings} />
                  </div>
                </Reveal>
              )}

              {/* MY SIGHTINGS */}
              {activeTab === 'sightings' && (
                <Reveal>
                  <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <ClipboardList className="w-5 h-5 text-emerald-400" />
                          My Recorded Sightings
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Everything you have contributed to the seagrass record.
                        </p>
                      </div>
                      <Link
                        to="/community"
                        onClick={() => setActiveTab('record')}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors"
                      >
                        Record a new sighting
                      </Link>
                    </div>

                    {loadingSightings ? (
                      <div className="p-6 space-y-3">
                        <div className="skeleton h-10 rounded-xl" />
                        <div className="skeleton h-10 rounded-xl" />
                        <div className="skeleton h-10 rounded-xl" />
                      </div>
                    ) : sightings.length === 0 ? (
                      <div className="py-16 text-center space-y-2">
                        <MapPin className="w-8 h-8 text-slate-700 mx-auto" />
                        <p className="text-xs font-semibold text-slate-400">No sightings recorded yet</p>
                        <p className="text-xs text-slate-500">
                          Use the scanner to identify a sample, then save it with its location.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-950/60 text-slate-500 uppercase text-[11px] tracking-wider border-b border-slate-800">
                            <tr>
                              <th className="py-3 px-6">Species</th>
                              <th className="py-3 px-4">Location</th>
                              <th className="py-3 px-4">Observed</th>
                              <th className="py-3 px-4">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {sightings.map((rec) => (
                              <tr key={rec.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="py-3 px-6 font-semibold italic text-slate-200">{speciesById(rec.species_id)?.scientific_name || '—'}</td>
                                <td className="py-3 px-4 font-mono text-slate-400">
                                  {Number(rec.latitude).toFixed(4)}, {Number(rec.longitude).toFixed(4)}
                                </td>
                                <td className="py-3 px-4 text-slate-500">{rec.observed_on}</td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold capitalize ${
                                    rec.status === 'approved' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                                      : rec.status === 'rejected' ? 'bg-rose-500/10 text-rose-300 border-rose-500/25'
                                      : 'bg-amber-500/10 text-amber-300 border-amber-500/25'
                                  }`}>
                                    {rec.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </Reveal>
              )}

              {/* ASK A RESEARCHER */}
              {activeTab === 'ask' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <Reveal className="lg:col-span-5">
                    <form onSubmit={submitQuestion} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-emerald-400" />
                          Ask a Researcher
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Questions go to the DORSU marine research team.
                        </p>
                      </div>

                      {askError && (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{askError}</span>
                        </div>
                      )}

                      {askNotice && (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>{askNotice}</span>
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Topic
                        </label>
                        <select
                          value={questionTopic}
                          onChange={(e) => setQuestionTopic(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                        >
                          <option>Species identification</option>
                          <option>Sighting location</option>
                          <option>Seagrass health</option>
                          <option>Using SeaScan</option>
                          <option>Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Your question
                        </label>
                        <textarea
                          required
                          rows={5}
                          value={questionText}
                          onChange={(e) => setQuestionText(e.target.value)}
                          placeholder="e.g. I found a narrow-leaf seagrass near Dahican with three-toothed tips — is this Halodule uninervis?"
                          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={sending}
                        className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Send Question
                      </button>
                    </form>
                  </Reveal>

                  <Reveal delay={80} className="lg:col-span-7">
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
                      <h3 className="text-base font-bold text-white border-b border-slate-800 pb-4">
                        My Questions
                      </h3>

                      {questions.length === 0 ? (
                        <div className="py-12 text-center space-y-2">
                          <MessageSquare className="w-8 h-8 text-slate-700 mx-auto" />
                          <p className="text-xs font-semibold text-slate-400">No questions yet</p>
                          <p className="text-xs text-slate-500">
                            Ask about an identification and the research team will reply here.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {questions.map((q) => (
                            <div key={q.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
                                  {q.topic}
                                </span>
                                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${
                                  q.status === 'Answered'
                                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                                    : 'bg-amber-500/10 text-amber-300 border-amber-500/25'
                                }`}>
                                  {q.status}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed">{q.question}</p>
                              {q.answer && (
                                <div className="mt-2 pl-3 border-l-2 border-emerald-500/40">
                                  <p className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                                    Researcher reply
                                  </p>
                                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{q.answer}</p>
                                </div>
                              )}
                              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                {new Date(q.created_at).toLocaleDateString()}
                                <button
                                  type="button"
                                  onClick={() => removeQuestion(q)}
                                  className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-rose-300 hover:bg-rose-950/40 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Reveal>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
