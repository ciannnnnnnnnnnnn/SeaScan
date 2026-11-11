// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const PROJECT_LINKS = [
  { name: 'Our Vision', to: '/#vision' },
  { name: 'Digital Library', to: '/library' },
  { name: 'Image Recognition', to: '/scanner' },
  { name: 'Distribution Map', to: '/map' },
  { name: 'About', to: '/about' },
  { name: 'About the model', to: '/about-model' },
];

const SUPPORT_LINKS = [
  { name: 'User manual', to: '/help#manual' },
  { name: 'FAQ', to: '/help#faq' },
  { name: 'Send feedback', to: '/help#feedback' },
  { name: 'Contact', to: '/help#contact' },
];

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 text-sm py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">

          {/* Col 1: Brand Info */}
          <div className="md:col-span-4 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-lg tracking-tight">
              <Logo />
              <span>SeaScan</span>
            </div>
            <p className="text-slate-500 leading-relaxed max-w-sm">
              An innovative classification system for the seagrasses of Mati City, Dahican, Davao Oriental. Developed by BSIT Students of Davao Oriental State University.
            </p>
          </div>

          {/* Col 2: The Project */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-white font-semibold">Support</h4>
            <ul className="space-y-2 text-slate-500">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.name}>
                  <Link to={link.to} className="inline-block hover:text-teal-300 hover:translate-x-0.5 transition">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h4 className="text-white font-semibold">The Project</h4>
            <ul className="space-y-2 text-slate-500">
              {PROJECT_LINKS.map((link) => (
                <li key={link.name}>
                  <Link to={link.to} className="inline-block hover:text-teal-300 hover:translate-x-0.5 transition">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Developers */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-white font-semibold">Developers</h4>
            <ul className="space-y-2 text-slate-500">
              <li>Labrador, C. M.</li>
              <li>Indong, J.</li>
              <li>Ramaila, Dave N.</li>
              <li className="pt-1 text-slate-400 font-semibold">DORSU - BSIT 2026</li>
            </ul>
          </div>

        </div>

        {/* Bottom Row */}
        <div className="pt-8 mt-10 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-4">
          <p>© 2026 SeaScan Project. All Rights Reserved.</p>
          <div className="flex gap-6">
            <Link to="/help#privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
            <Link to="/help#contact" className="hover:text-slate-400 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
