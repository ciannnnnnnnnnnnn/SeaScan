// src/components/staff/PortalShell.jsx
// Sidebar layout shared by the Admin and Researcher panels. On phones the
// sidebar becomes a slide-in menu so the work area keeps the full width.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth, accountLabel } from '../../context/AuthContext';
import PortalSiteLinks from '../PortalSiteLinks';
import ThemeToggle from '../ThemeToggle';
import Logo from '../Logo';

// Literal class strings so Tailwind can see them.
const ACCENTS = {
  teal: { sub: 'text-teal-400', active: 'bg-slate-800 text-white' },
  cyan: { sub: 'text-cyan-300', active: 'bg-slate-800 text-white' },
};

const timeOf = (d) => (d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—');

export default function PortalShell({ base, title, subtitle, accent = 'teal', tabs: allTabs, activeTab, onTab, tool, heading, description, children }) {
  const { user, logout, can } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const a = ACCENTS[accent];
  // RBAC: a tab is listed only when the user's role holds its permission.
  // The database enforces the same permissions on every request.
  const tabs = allTabs.filter((t) => !t.permission || can(t.permission));

  const sidebar = (
    <>
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <Logo className="w-8 h-8" />
        <div className="flex-1">
          <h1 className="font-semibold text-base text-white">{title}</h1>
          <p className={`text-xs ${a.sub}`}>{subtitle}</p>
        </div>
        <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="md:hidden p-1.5 text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="thin-scroll flex-1 min-h-0 overflow-y-auto p-4 space-y-1 text-xs font-semibold">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = !tool && activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { onTab(tab.id); setMenuOpen(false); if (tool) navigate(base); }}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 ${
                isActive ? a.active : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                {tab.label}
              </span>
              {tab.badge > 0 && (
                <span className={`px-2 py-0.5 text-xs rounded-md border tabular-nums ${
                  isActive
                    ? 'bg-slate-950/25 text-white border-white/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}

        <PortalSiteLinks base={base} activeClass={a.active} />
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-2">
        <p className="text-xs text-slate-500 truncate">
          Signed in as <span className="text-slate-300 font-semibold">{accountLabel(user)}</span> · {user?.role}
        </p>
        <p className="text-xs text-slate-600 leading-snug" title="Session stored in a browser cookie; the access token (JWT) renews automatically while you are active.">
          Session: {user?.remembered ? 'kept 30 days' : 'ends when the browser closes'} · token valid until {timeOf(user?.jwt?.expiresAt)}
          {user && !user.jwt?.hookEnabled && <span className="block text-amber-400/70">JWT role claims not enabled yet</span>}
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
      <aside className="hidden md:flex w-64 h-full bg-slate-900 border-r border-slate-800 flex-col shrink-0">
        {sidebar}
      </aside>

      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/70 backdrop-in" onClick={(e) => { if (e.target === e.currentTarget) setMenuOpen(false); }}>
          <aside className="drawer-in-left w-72 max-w-[85vw] h-full bg-slate-900 border-r border-slate-800 flex flex-col">
            {sidebar}
          </aside>
        </div>
      )}

      <main className="thin-scroll flex-1 min-w-0 h-full overflow-y-auto">
        <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-950/90">
          <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu" className="p-2 rounded-lg bg-slate-800 text-slate-300">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-white">{title}</span>
        </div>

        {tool || (
          <>
            <div className="sticky top-0 md:top-0 z-20 border-b border-slate-800 bg-slate-950/80 px-4 md:px-8 py-5">
              <h2 className="text-xl font-semibold text-white tracking-tight">{heading}</h2>
              {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
            </div>
            <div className="p-4 md:p-8 space-y-6 max-w-7xl">{children}</div>
          </>
        )}
      </main>
    </div>
  );
}

/** Small stat tile used on the overview tabs. */
export function StatTile({ label, value, icon: Icon, tone = 'teal', hint }) {
  const tones = {
    teal: 'text-teal-400', cyan: 'text-cyan-400', amber: 'text-amber-400', emerald: 'text-emerald-400', rose: 'text-rose-400',
  };
  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400">{label}</span>
        <Icon className={`w-4 h-4 ${tones[tone]}`} />
      </div>
      <div className="text-3xl font-semibold text-white tabular-nums">{value ?? '—'}</div>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

/** Card wrapper with a title row, used by every staff section. */
export function Panel({ icon: Icon, title, description, actions, children }) {
  return (
    <section className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
      <div className="p-5 md:p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            {Icon && <Icon className="w-5 h-5 text-teal-400" />}
            {title}
          </h3>
          {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}

export function Alert({ kind = 'error', children }) {
  if (!children) return null;
  const cls = kind === 'error'
    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
  return <div role={kind === 'error' ? 'alert' : 'status'} className={`p-3 rounded-xl border text-xs ${cls}`}>{children}</div>;
}

export const inputClass = 'w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors';
export const labelClass = 'block text-xs text-slate-500 mb-1';
export const buttonClass = 'px-3 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50';
