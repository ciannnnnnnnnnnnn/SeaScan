// src/components/Header.jsx
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogIn, LogOut, ShieldCheck, Microscope, Code2, Leaf, Menu, X, UserRound } from 'lucide-react';
import { useAuth, accountLabel } from '../context/AuthContext';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [pill, setPill] = useState(null);
  const navRef = useRef(null);
  const { user, openAuthModal, logout } = useAuth();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Scanner', path: '/scanner' },
    { name: 'Species Library', path: '/library' },
    { name: 'Distribution Map', path: '/map' },
    { name: 'Help', path: '/help' },
    // Each role sees only its own portal - no cross-portal access
    ...(user?.role === 'admin' ? [{ name: 'Admin Panel', path: '/admin', icon: ShieldCheck }] : []),
    ...(user?.role === 'researcher' ? [{ name: 'Researcher Panel', path: '/researcher', icon: Microscope }] : []),
    ...(user?.role === 'developer' ? [{ name: 'Dev Console', path: '/developers', icon: Code2 }] : []),
    ...(user?.role === 'community' ? [{ name: 'Community Hub', path: '/community', icon: Leaf }] : []),
    // Every signed-in user, whatever their role.
    ...(user ? [{ name: 'My Account', path: '/account', icon: UserRound }] : []),
  ];

  // Header firms up into frosted glass once the page has moved under it.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // The active pill slides between links, so it is measured rather than drawn
  // per link. Re-measured on resize and once the web font has swapped in.
  useLayoutEffect(() => {
    const measure = () => {
      const active = navRef.current?.querySelector('[data-active="true"]');
      setPill(active ? { left: active.offsetLeft, width: active.offsetWidth } : null);
    };
    measure();
    window.addEventListener('resize', measure);
    document.fonts?.ready.then(measure);
    return () => window.removeEventListener('resize', measure);
  }, [location.pathname, user?.role]);

  const handleAuthAction = () => {
    if (user) {
      logout();
    } else {
      openAuthModal();
    }
  };

  return (
    <header
      className={`text-white sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300 ${
        scrolled || mobileMenuOpen
          ? 'bg-slate-950/85 border-slate-800'
          : 'bg-slate-950/40 border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="group flex items-center gap-2">
            <Logo />
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-teal-300 to-cyan-200 bg-clip-text text-transparent">
              SeaScan
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav ref={navRef} className="relative hidden lg:flex items-center gap-1 text-sm font-medium">
            {pill && (
              <span
                className="absolute inset-y-0 rounded-full bg-teal-400/10 border border-teal-400/20 transition-[left,width] duration-300 ease-out"
                style={{ left: pill.left, width: pill.width }}
                aria-hidden="true"
              />
            )}
            {navLinks.map((link) => {
              const isActive = link.path === '/' ? location.pathname === '/' : location.pathname.startsWith(link.path);
              const Icon = link.icon;

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  data-active={isActive}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative px-3.5 py-2 rounded-md flex items-center gap-1.5 transition-colors ${
                    isActive ? 'text-teal-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Actions & Mobile Menu Toggle */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={handleAuthAction}
              title={user ? 'Click to log out' : 'Log in or register'}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2"
            >
              {user ? (
                <>
                  <LogOut className="w-4 h-4" />
                  <span className="max-w-[10rem] truncate">Log out</span>
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
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              className="lg:hidden p-2 rounded-full bg-slate-800/80 text-slate-300 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Navigation Menu: grid rows animate open to the content's height */}
      <div
        className="lg:hidden grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: mobileMenuOpen ? '1fr' : '0fr' }}
        inert={!mobileMenuOpen}
      >
        <div className="overflow-hidden min-h-0">
          <div className="px-4 pt-1 pb-4 space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              const Icon = link.icon;

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-teal-400/10 text-teal-300'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4 text-teal-400" />}
                  <span>{link.name}</span>
                </Link>
              );
            })}

            {user && (
              <div className="pt-2 text-xs text-slate-500 px-3">
                Signed in as <span className="text-slate-300 font-semibold">{accountLabel(user)}</span> · {user.role}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
