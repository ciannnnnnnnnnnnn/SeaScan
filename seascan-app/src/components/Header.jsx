// src/components/Header.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogIn, User, ShieldCheck, Microscope, Menu, X } from 'lucide-react';

export default function Header({ onOpenAuth, currentUser }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Scanner', path: '/scanner' },
    { name: 'Species Library', path: '/library' },
    { name: 'Distribution Map', path: '/map' },
    // Demo Mode Portals
    { name: 'Admin Panel', path: '/admin', isDemo: true, icon: ShieldCheck },
    { name: 'Researcher Panel', path: '/researcher', isDemo: true, icon: Microscope },
  ];

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <img 
              src="/Gemini_Generated_Image_s1dywes1dywes1dy.png" 
              alt="SeaScan Logo" 
              className="w-10 h-10 object-contain" 
            />
            <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-teal-400 to-cyan-200 bg-clip-text text-transparent">
              SeaScan
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-6 text-sm font-medium items-center">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              const Icon = link.icon;

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`transition-colors py-1 flex items-center gap-1.5 ${
                    isActive
                      ? 'text-teal-400 border-b-2 border-teal-400 font-semibold'
                      : link.isDemo
                      ? 'text-amber-400/90 hover:text-amber-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{link.name}</span>
                  {link.isDemo && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 font-bold uppercase tracking-wide">
                      Demo
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Actions & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenAuth}
              className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-sm"
            >
              {currentUser ? (
                <>
                  <User className="w-4 h-4" />
                  <span>{currentUser.role || 'Account'}</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Portal Login</span>
                </>
              )}
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;

            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-teal-950 text-teal-400 border border-teal-800'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  {Icon && <Icon className="w-4 h-4 text-amber-400" />}
                  <span>{link.name}</span>
                </div>
                {link.isDemo && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold uppercase">
                    Demo
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}