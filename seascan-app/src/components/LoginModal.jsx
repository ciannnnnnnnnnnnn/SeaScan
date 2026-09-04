import React, { useState } from 'react';
import { X, Lock, Mail, User, Shield, Compass, Waves, CheckCircle2, Eye, EyeOff } from 'lucide-react';

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Demo Role Quick Switcher State
  const [demoRole, setDemoRole] = useState('Community'); // 'Community' | 'Researcher' | 'Admin'

  // Form States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [fullName, setFullName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [userRole, setUserRole] = useState('Citizen Researcher');

  if (!isOpen) return null;

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    // Pass authenticated user object back to caller
    const userData = {
      identifier: loginIdentifier,
      role: demoRole,
      isAuthenticated: true
    };
    if (onLoginSuccess) onLoginSuccess(userData);
    onClose();
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    const userData = {
      fullName,
      email: registerEmail,
      role: userRole,
      isAuthenticated: true
    };
    if (onLoginSuccess) onLoginSuccess(userData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Section */}
        <div className="relative bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-6 text-white">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <Waves className="w-6 h-6 text-cyan-200" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">SeaScan</span>
          </div>
          <p className="text-cyan-100 text-sm">
            Access marine baseline datasets and submit community seagrass sightings.
          </p>
        </div>

        {/* Quick Demo Role Switcher Bar */}
        <div className="bg-slate-100 dark:bg-slate-800/60 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" /> Demo Mode:
          </span>
          <div className="flex bg-slate-200 dark:bg-slate-700/60 p-0.5 rounded-lg">
            {['Community', 'Researcher', 'Admin'].map((role) => (
              <button
                key={role}
                onClick={() => setDemoRole(role)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  demoRole === role 
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors ${
              activeTab === 'login'
                ? 'border-teal-500 text-teal-600 dark:text-teal-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors ${
              activeTab === 'register'
                ? 'border-teal-500 text-teal-600 dark:text-teal-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Content Body */}
        <div className="p-6 overflow-y-auto">
          {activeTab === 'login' ? (
            /* TAB 1: LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Email or Username
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="user@seascan.org"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
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
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white"
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

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  Remember Me
                </label>
                <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-teal-600 hover:underline dark:text-teal-400">
                  Forgot Password?
                </a>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2 text-sm mt-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Sign In as {demoRole}
              </button>
            </form>
          ) : (
            /* TAB 2: REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Juan Dela Cruz"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Community Role
                </label>
                <div className="relative">
                  <Compass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white appearance-none"
                  >
                    <option value="Student">Student / Academic</option>
                    <option value="Tourist">Tourist / Diver</option>
                    <option value="Fisherfolk">Local Fisherfolk</option>
                    <option value="Citizen Researcher">Citizen Researcher</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
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
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="Create strong password"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2 text-sm mt-2"
              >
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