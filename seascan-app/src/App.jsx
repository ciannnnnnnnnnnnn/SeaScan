import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import Header from './components/Header';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';

import HomePage from './pages/HomePage';
import AdminDashboard from './components/AdminDashboard'; 
import ResearcherPanel from './components/ResearcherPanel'; 
// 1. Import your pages
import DigitalLibrary from './pages/DigitalLibrary'; // Adjust filename if different
import DistributionMap from './pages/DistributionMap'; // Adjust filename if different
import ScannerPage from './components/ScannerPage';

export default function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const location = useLocation();

  // Hide the global layout footer on HomePage if HomePage has its own footer
  const showGlobalFooter = location.pathname !== '/';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header 
        onOpenAuth={() => setIsAuthOpen(true)} 
        currentUser={currentUser} 
      />

      <main className="flex-1 flex flex-col min-h-0">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/scanner" element={<ScannerPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/researcher" element={<ResearcherPanel />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>

      {isAuthOpen && (
        <LoginModal 
          onClose={() => setIsAuthOpen(false)} 
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setIsAuthOpen(false);
          }} 
        />
      )}

      {showGlobalFooter && <Footer />}
    </div>
  );
}