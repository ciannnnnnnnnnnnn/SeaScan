import React from 'react';
import { Award, Waves, GraduationCap, Target } from 'lucide-react';
import { Reveal, CountUp } from '../components/motion';

const pillars = [
  {
    icon: Target,
    title: 'The Problem',
    body: 'Seagrass meadows in Pujada Bay are ecologically critical yet under-monitored. Manual survey work is slow, seasonal, and hard to scale across the bay.',
  },
  {
    icon: Waves,
    title: 'The Approach',
    body: 'A convolutional neural network trained on local samples, paired with community GPS reporting, turns any smartphone into a monitoring instrument.',
  },
  {
    icon: GraduationCap,
    title: 'The Outcome',
    body: 'A georeferenced baseline of the nine native species, open to researchers and usable by students, fisherfolk, and visitors alike.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans antialiased">
      {/* Header banner */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 py-16 px-4 sm:px-6 lg:px-8">
        <div className="absolute -top-24 left-1/3 w-[32rem] h-[32rem] rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center space-y-4">
          <Reveal as="span" className="inline-block text-xs font-bold text-teal-400 uppercase tracking-widest bg-teal-500/10 border border-teal-500/25 px-3 py-1.5 rounded-md">
            Research Project Background
          </Reveal>
          <Reveal delay={80} as="h1" className="text-3xl sm:text-5xl font-semibold text-white tracking-tight">
            About SeaScan &amp; Pujada Bay
          </Reveal>
          <Reveal delay={160} as="p" className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            An automated ecological monitoring system for the seagrass meadows of
            Mati City, Davao Oriental.
          </Reveal>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-6">
        {/* Institutional framework */}
        <Reveal>
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Award className="w-5 h-5 text-teal-400" />
              Institutional Framework
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Developed at <strong className="text-slate-200">Davao Oriental State University (DORSU)</strong> under
              the Faculty of Computing, Engineering, and Technology (FCET). SeaScan
              addresses the need for automated ecological monitoring tools along
              Pujada Bay — one of the most biodiverse bays in the Philippines.
            </p>
          </div>
        </Reveal>

        {/* Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pillars.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <Reveal key={pillar.title} delay={i * 70}>
                <div className="h-full bg-slate-900 rounded-2xl border border-slate-800 hover:border-teal-500/40 p-6 space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-300 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">{pillar.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{pillar.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Figures */}
        <Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-slate-800 bg-slate-800">
            {[
              { value: 9, label: 'Native species', decimals: 0, suffix: '' },
              { value: 3, label: 'Survey stations', decimals: 0, suffix: '' },
              { value: 96.9, label: 'Test accuracy', decimals: 1, suffix: '%' },
              { value: 2026, label: 'Capstone year', decimals: 0, suffix: '' },
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-900 px-5 py-6 text-center">
                <div className="text-2xl font-bold text-teal-300 tabular-nums">
                  <CountUp value={stat.value} decimals={stat.decimals} suffix={stat.suffix} />
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </main>
    </div>
  );
}
