import React from 'react';
import { Award } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-teal-700 font-bold text-xs uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
          Research Project Background
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-3 font-serif">
          About SeaScan & Pujada Bay
        </h1>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-teal-600" />
          <span>Institutional Framework</span>
        </h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          Developed at <strong>Davao Oriental State University (DORSU)</strong> under the Faculty of Computing, Engineering, and Technology (FCET). The SeaScan system addresses the need for automated ecological monitoring tools along Pujada Bay.
        </p>
      </div>
    </div>
  );
}