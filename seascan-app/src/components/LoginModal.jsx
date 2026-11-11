import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Lock, Mail, User, Compass, Waves, CheckCircle2, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth, portalPathForRole, USER_TYPES } from '../context/AuthContext';

const LoginModal = () => {
  const { isAuthModalOpen, closeAuthModal, login, register, resetPassword, authError, authNotice, clearAuthError } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);

  // Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [displayName, setDisplayName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [userType, setUserType] = useState('student');

  // Esc closes the dialog, like every other dialog in the app.
  useEffect(() => {
    if (!isAuthModalOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') closeAuthModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  const switchTab = (tab) => {
    setActiveTab(tab);
    clearAuthError();
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const signedIn = await login(loginEmail, loginPassword, keepSignedIn);
      navigate(portalPathForRole(signedIn.role));
    } catch {
      // authError is already set by the context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const signedUp = await register({
        displayName,
        email: registerEmail,
        password: registerPassword,
        userType,
      });
      if (signedUp) navigate(portalPathForRole(signedUp.role));
    } catch {
      // authError is already set by the context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="backdrop-in fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70"
      onMouseDown={(e) => { if (e.target === e.currentTarget) closeAuthModal(); }}
    >

      {/* Modal Container */}
      <div role="dialog" aria-modal="true" aria-label="Log in or create an account" className="modal-in relative w-full max-w-md bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header Section */}
        <div data-theme="dark" className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-cyan-700 to-slate-900 p-6 text-white">
          {/* Decorative glow: drawn first and click-through, so it can never
              sit on top of the close button. */}
          <div className="pointer-events-none absolute -top-16 -right-10 w-52 h-52 rounded-full bg-teal-300/20 blur-3xl" />

          <button
            type="button"
            onClick={closeAuthModal}
            className="absolute z-10 top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="relative flex items-center gap-2 mb-2">
            <div className="p-2 bg-white/10 rounded-xl">
              <Waves className="w-6 h-6 text-cyan-200" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">SeaScan</span>
          </div>
          <p className="relative text-cyan-100/90 text-sm">
            Access marine baseline datasets and submit community seagrass sightings.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/50">
          <button
            onClick={() => switchTab('login')}
            className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors ${
              activeTab === 'login'
                ? 'border-teal-400 text-teal-300 bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => switchTab('register')}
            className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors ${
              activeTab === 'register'
                ? 'border-teal-400 text-teal-300 bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Content Body */}
        <div className="p-6 overflow-y-auto">

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {authNotice && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authNotice}</span>
            </div>
          )}

          {activeTab === 'login' ? (
            /* TAB 1: LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="user@seascan.org"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-400"
                  title="Keeps your session cookie for 30 days on this device. Leave unticked on shared computers.">
                  <input
                    type="checkbox"
                    checked={keepSignedIn}
                    onChange={(e) => setKeepSignedIn(e.target.checked)}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  Keep me signed in
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (!loginEmail) { clearAuthError(); return; }
                    resetPassword(loginEmail);
                  }}
                  title={loginEmail ? 'Email me a reset link' : 'Type your email above first'}
                  className="text-teal-400 hover:text-teal-300 hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-slate-950 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm mt-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Sign In
              </button>
            </form>
          ) : (
            /* TAB 2: REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nickname <span className="normal-case font-medium text-slate-600">(optional, no real name needed)</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    maxLength={60}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. SeagrassFan"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  I am a
                </label>
                <div className="relative">
                  <Compass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors appearance-none"
                  >
                    {USER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Researcher and Admin portal access is granted by SeaScan administrators after registration.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="juan@example.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-slate-950 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm mt-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Register Account
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
