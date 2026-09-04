// src/components/Footer.jsx
import React from 'react';
import { Globe, Share2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 text-xs py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Col 1: Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <span className="w-3 h-3 rounded-full bg-teal-400" />
              <span>SeaScan</span>
            </div>
            <p className="text-slate-500 leading-relaxed max-w-sm">
              An innovative classification system for the seagrasses of Mati City, Dahican, Davao Oriental. Developed by BSIT Students of Davao Oriental State University.
            </p>
            <div className="flex items-center gap-3 text-slate-400 pt-2">
              <a href="#globe" className="hover:text-white transition"><Globe className="w-4 h-4" /></a>
              <a href="#share" className="hover:text-white transition"><Share2 className="w-4 h-4" /></a>
            </div>
          </div>

          {/* Col 2: The Project */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider">The Project</h4>
            <ul className="space-y-2 text-slate-500">
              <li><a href="#vision" className="hover:text-slate-300 transition">Our Vision</a></li>
              <li><a href="#ar" className="hover:text-slate-300 transition">Digital Library</a></li>
              <li><a href="#technology" className="hover:text-slate-300 transition">Image Recognition</a></li>
              <li><a href="#technology" className="hover:text-slate-300 transition">AR Prototypes</a></li>
            </ul>
          </div>

          {/* Col 3: Developers */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider">Developers</h4>
            <ul className="space-y-1.5 text-slate-500">
              <li>Labrador, C. M.</li>
              <li>Indong, J.</li>
              <li>Ramaila, Dave N.</li>
              <li className="pt-2 text-slate-400 font-semibold">DORSU - BSIT 2026</li>
            </ul>
          </div>

        </div>

        {/* Bottom Row */}
        <div className="pt-12 mt-12 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-slate-600 gap-4">
          <p>© 2026 SeaScan Project. All Rights Reserved.</p>
          <div className="flex gap-6">
            <a href="#privacy" className="hover:text-slate-400">Privacy Policy</a>
            <a href="#terms" className="hover:text-slate-400">DMCA Institutional Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}