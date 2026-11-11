// src/components/ProtectedRoute.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Loader2, KeyRound } from 'lucide-react';
import { useAuth, portalPathForRole } from '../context/AuthContext';

// allowedRoles picks the portal for a role; `permission` (optional) adds an
// RBAC check. Both only shape the UI - the database enforces the same rules.
export default function ProtectedRoute({ allowedRoles, permission, children }) {
  const { user, authLoading, openAuthModal, can } = useAuth();

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] bg-slate-950 text-slate-400 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Checking access...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] bg-slate-950 text-center px-4 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-semibold text-white">Sign in required</h2>
        <p className="text-sm text-slate-400 max-w-sm">
          This portal is restricted to authorized SeaScan accounts. Please log in to continue.
        </p>
        <button
          onClick={openAuthModal}
          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition-colors"
        >
          Log In
        </button>
      </div>
    );
  }

  if (!allowedRoles.includes(user.role) || (permission && !can(permission))) {
    // Deliberately explicit rather than a silent redirect: a missing or wrong
    // role is almost always a provisioning problem, and bouncing to the home
    // page hides the reason entirely.
    const roleMissing = !user.role || user.role === 'community';

    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] bg-slate-950 text-center px-4 py-12 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <KeyRound className="w-7 h-7" />
        </div>

        <h2 className="text-lg font-semibold text-white">This portal needs a different role</h2>

        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-5 text-left text-xs space-y-2.5">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Signed in as</span>
            <span className="text-slate-200 font-semibold truncate">{user.email}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Your account role</span>
            <span className="font-mono font-semibold text-amber-300">{user.role || 'none set'}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">This portal requires</span>
            <span className="font-mono font-semibold text-teal-300">{allowedRoles.join(' or ')}</span>
          </div>
        </div>

        {roleMissing && (
          <p className="text-xs text-slate-500 max-w-md leading-relaxed">
            Roles are stored in the <code className="text-slate-400">profiles</code> table. An
            administrator can change yours in Admin &gt; Users. If this is a new setup, see
            DEPLOYMENT.md for how to create the first admin, then sign out and back in.
          </p>
        )}

        <Link
          to={portalPathForRole(user.role)}
          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition-colors"
        >
          Go to my portal
        </Link>
      </div>
    );
  }

  return children;
}
