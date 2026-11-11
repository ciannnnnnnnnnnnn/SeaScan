import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import DigitalLibrary from './pages/DigitalLibraryPage';
import DistributionMap from './pages/DistributionMapPage';
import SpeciesProfilePage from './pages/SpeciesProfilePage';
import HelpPage from './pages/HelpPage';
import AboutModelPage from './pages/AboutModelPage';
import DeveloperPortal from './pages/DeveloperPortal';
import CommunityPortal from './pages/CommunityPortal';
import AdminDashboard from './components/AdminDashboard';
import ResearcherPanel from './components/ResearcherPanel';
import ScannerPage from './components/ScannerPage';
import AccountPage from './pages/AccountPage';

const ALL_ROLES = ['community', 'researcher', 'admin', 'developer'];

// Each portal is a self-contained shell with its own sidebar navigation, and
// the roles that may open it. The Community Hub is open to every signed-in user.
const PORTAL_ROLES = {
  '/admin': ['admin'],
  '/researcher': ['researcher'],
  '/developers': ['developer'],
  '/community': ALL_ROLES,
};

function AppShell() {
  const location = useLocation();
  const { user } = useAuth();

  // New page starts at the top, unless the link points at a section of it.
  useEffect(() => {
    if (location.hash) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView();
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [location.pathname, location.hash]);

  // Drop the public header/footer only while the user is inside a portal their
  // role may open. Anyone else hitting /admin still gets the header, so the
  // "sign in required" screen remains navigable.
  const portalRoot = Object.keys(PORTAL_ROLES)
    .find((root) => location.pathname === root || location.pathname.startsWith(`${root}/`));
  const inOwnPortal = !!user && !!portalRoot && PORTAL_ROLES[portalRoot].includes(user.role);

  const showGlobalFooter = !inOwnPortal;

  // Fade in when moving between sections. Keyed on the first path segment only,
  // so navigating inside a portal does not remount it and lose its state.
  const section = location.pathname.split('/')[1];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {!inOwnPortal && <Header />}

      <main className="flex-1 flex flex-col min-h-0">
        <div key={section} className="page-enter flex-1 flex flex-col min-h-0">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/scanner" element={<ScannerPage />} />
          <Route path="/library" element={<DigitalLibrary />} />
          <Route path="/library/:slug" element={<SpeciesProfilePage />} />
          <Route path="/map" element={<DistributionMap />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/about-model" element={<AboutModelPage />} />
          <Route path="/help" element={<HelpPage />} />
          {/* Every signed-in user, whatever their role. */}
          <Route
            path="/account"
            element={
              <ProtectedRoute allowedRoles={ALL_ROLES}>
                <AccountPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/developers/*"
            element={
              <ProtectedRoute allowedRoles={['developer']}>
                <DeveloperPortal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/community/*"
            element={
              // Researchers and administrators are signed-in users too, so they
              // can open everything community users can.
              <ProtectedRoute allowedRoles={ALL_ROLES}>
                <CommunityPortal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']} permission="users.manage">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/researcher/*"
            element={
              <ProtectedRoute allowedRoles={['researcher']} permission="sightings.review">
                <ResearcherPanel />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<HomePage />} />
        </Routes>
        </div>
      </main>

      <LoginModal />

      {showGlobalFooter && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
