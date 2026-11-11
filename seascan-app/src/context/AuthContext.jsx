// src/context/AuthContext.jsx
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { fetchProfile, fetchMyPermissions } from '../lib/api';
import { decodeJwt, isRemembered, setRemembered } from '../lib/cookieStorage';

const AuthContext = createContext(null);

// Where each role lands after signing in.
export const portalPathForRole = (role) => {
  if (role === 'admin') return '/admin';
  if (role === 'researcher') return '/researcher';
  if (role === 'developer') return '/developers';
  return '/community';
};

export const USER_TYPES = [
  { value: 'student', label: 'Student / Academic' },
  { value: 'tourist', label: 'Tourist / Diver' },
  { value: 'fisherfolk', label: 'Local Fisherfolk' },
  { value: 'other', label: 'Other' },
];

// Signed-in sessions end after this much inactivity. Staff accounts always
// time out; community users only when "Keep me signed in" was not ticked.
export const IDLE_MINUTES = 30;
const ACTIVITY_KEY = 'seascan-last-activity';
const STAFF_ROLES = ['admin', 'researcher'];

/**
 * Build the app's user from a Supabase session.
 * - role: from public.profiles - the same table the database rules check, so
 *   it is always current.
 * - permissions: from the JWT's `permissions` claim (added by the
 *   custom_access_token_hook), falling back to the database when the hook is
 *   not enabled. They only drive what the UI shows; the database enforces them.
 */
async function buildUser(session) {
  const authUser = session?.user;
  if (!authUser) return null;

  let claims = decodeJwt(session.access_token);
  let profile = null;
  try {
    profile = await fetchProfile(authUser.id);
  } catch {
    // Profile unreadable (e.g. migrations not run yet): least privilege.
  }
  const role = profile?.role || 'community';

  // An admin changed this user's role since the token was issued: get a new
  // token so its claims match.
  if (claims.user_role && claims.user_role !== role) {
    const { data } = await supabase.auth.refreshSession();
    if (data?.session) claims = decodeJwt(data.session.access_token);
  }

  let permissions = Array.isArray(claims.permissions) ? claims.permissions : null;
  if (!permissions) {
    try { permissions = await fetchMyPermissions(); } catch { permissions = []; }
  }

  return {
    id: authUser.id,
    email: authUser.email,
    // Optional nickname; nothing in SeaScan requires a real name.
    displayName: profile?.display_name || null,
    userType: profile?.user_type || 'other',
    role,
    isTestAccount: !!profile?.is_test_account,
    permissions,
    jwt: {
      role: claims.user_role || null,
      issuedAt: claims.iat ? new Date(claims.iat * 1000) : null,
      expiresAt: claims.exp ? new Date(claims.exp * 1000) : null,
      hookEnabled: Array.isArray(claims.permissions),
    },
    remembered: isRemembered(),
  };
}

/** Turn Supabase Auth errors into messages a non-technical user can act on. */
export function friendlyAuthError(error) {
  const msg = error?.message || 'Something went wrong. Please try again.';
  if (/rate limit/i.test(msg) && /email/i.test(msg)) {
    return 'Too many emails were sent from SeaScan in the last hour (sign-up confirmations and password resets share a small hourly limit). Please wait an hour and try again, or ask an administrator to create your account.';
  }
  if (/rate limit|too many requests/i.test(msg)) return 'Too many attempts. Please wait a minute and try again.';
  if (/error sending .*email/i.test(msg)) {
    return 'SeaScan could not send the email right now (the mail server refused it). Please try again later or contact the SeaScan team.';
  }
  if (/invalid login credentials/i.test(msg)) return 'Wrong email or password.';
  if (/email not confirmed/i.test(msg)) return 'Please confirm your email first: open the link in the email SeaScan sent you, then log in.';
  if (/user already registered/i.test(msg)) return 'An account with this email already exists. Use Login instead, or "Forgot password?".';
  if (/failed to fetch|network/i.test(msg)) return 'Cannot reach the SeaScan server. Check your internet connection and try again.';
  return msg;
}

/** What to show for "signed in as": nickname, else a neutral label. */
export const accountLabel = (user) => user?.displayName || 'My account';

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authNotice, setAuthNotice] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const userRef = useRef(null);
  useEffect(() => { userRef.current = user; }, [user]);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        const next = await buildUser(session);
        if (active) setUser(next);
      })
      .catch(() => {})
      .finally(() => { if (active) setAuthLoading(false); });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Supabase advises against awaiting other Supabase calls inside this
      // callback, so the profile is fetched on the next tick.
      if (event === 'SIGNED_OUT') { setUser(null); return; }
      setTimeout(async () => {
        const next = await buildUser(session);
        if (active) setUser(next);
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const openAuthModal = useCallback(() => {
    setAuthError(null);
    setAuthNotice(null);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const markActive = () => {
    try { localStorage.setItem(ACTIVITY_KEY, String(Date.now())); } catch { /* ignore */ }
  };

  const login = useCallback(async (email, password, remember = false) => {
    setAuthError(null);
    setRemembered(remember);
    markActive();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(friendlyAuthError(error));
      throw error;
    }
    const signedIn = await buildUser(data.session);
    setUser(signedIn);
    setIsAuthModalOpen(false);
    return signedIn;
  }, []);

  const register = useCallback(async ({ displayName, email, password, userType }) => {
    setAuthError(null);
    setAuthNotice(null);
    setRemembered(false);
    markActive();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Copied into public.profiles by a database trigger. Role is never
        // taken from here - every new account starts as 'community'.
        data: {
          display_name: displayName?.trim() || null,
          user_type: userType,
        },
      },
    });

    if (error) {
      setAuthError(friendlyAuthError(error));
      throw error;
    }

    if (data.session) {
      const signedIn = await buildUser(data.session);
      setUser(signedIn);
      setIsAuthModalOpen(false);
      return signedIn;
    }

    setAuthNotice('Account created. Check your email to confirm before logging in.');
    return null;
  }, []);

  const resetPassword = useCallback(async (email) => {
    setAuthError(null);
    setAuthNotice(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) {
      setAuthError(friendlyAuthError(error));
      return;
    }
    setAuthNotice('If that email has an account, a password reset link is on its way.');
  }, []);

  // Centralised so every log-out button behaves the same. `replace` keeps the
  // portal out of history - back should not return to a signed-out portal.
  const logout = useCallback(async (notice) => {
    await supabase.auth.signOut();
    setRemembered(false);
    setUser(null);
    navigate('/', { replace: true });
    if (typeof notice === 'string') {
      setAuthNotice(notice);
      setIsAuthModalOpen(true);
    }
  }, [navigate]);

  // Inactivity timeout. Activity is shared across tabs through localStorage,
  // so working in one tab keeps the others signed in too.
  useEffect(() => {
    if (!user) return undefined;
    const applies = STAFF_ROLES.includes(user.role) || !user.remembered;
    if (!applies) return undefined;

    const limit = IDLE_MINUTES * 60 * 1000;
    const last = () => Number(localStorage.getItem(ACTIVITY_KEY) || Date.now());
    let lastWrite = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - lastWrite > 15000) { lastWrite = now; markActive(); }
    };
    const check = () => {
      if (Date.now() - last() > limit && userRef.current) {
        logout(`You were signed out after ${IDLE_MINUTES} minutes of inactivity. Please log in again.`);
      }
    };

    if (!localStorage.getItem(ACTIVITY_KEY)) markActive();
    check();
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    document.addEventListener('visibilitychange', check);
    const timer = setInterval(check, 30000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener('visibilitychange', check);
      clearInterval(timer);
    };
  }, [user, logout]);

  /** RBAC check for the UI: does the signed-in user hold this permission? */
  const can = useCallback((permission) => !!user?.permissions?.includes(permission), [user]);

  /** Re-read the signed-in user's profile, e.g. after they changed their settings. */
  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(await buildUser(session));
  }, []);

  const value = {
    user,
    authLoading,
    authError,
    authNotice,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
    login,
    register,
    resetPassword,
    logout,
    can,
    refreshUser,
    clearAuthError: () => setAuthError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
