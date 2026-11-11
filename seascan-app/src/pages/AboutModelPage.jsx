// src/pages/AboutModelPage.jsx
import React, { useState } from 'react';
import { Cpu, ShieldCheck, Table2, Grid3x3, Info } from 'lucide-react';
import { Reveal } from '../components/motion';
import { MODEL_METRICS as M } from '../data/modelMetrics';

const cell = (v) => (v === null || v === undefined ? <span className="text-slate-600 italic">to be added</span> : `${v.toFixed(1)}%`);

export default function AboutModelPage() {
  const [matrixMissing, setMatrixMissing] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans antialiased pb-16">
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 py-14">
        <div className="caustic absolute -top-24 left-1/3 w-[32rem] h-[32rem] rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">About the model</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">How SeaScan identifies seagrass</h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Two neural networks run directly in your browser. Your photo never leaves your device
            unless you choose to submit it with a sighting.
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <Reveal className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <p className="text-xs text-slate-400 font-semibold">Overall test accuracy</p>
            <p className="text-3xl font-bold text-teal-300 tabular-nums mt-2">{M.overallAccuracy}%</p>
          </Reveal>
          <Reveal delay={60} className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <p className="text-xs text-slate-400 font-semibold">Every species, every metric</p>
            <p className="text-3xl font-bold text-teal-300 tabular-nums mt-2">&ge; {M.minimumPerSpecies}%</p>
            <p className="text-xs text-slate-500 mt-1">Accuracy, precision, recall and F1</p>
          </Reveal>
          <Reveal delay={120} className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <p className="text-xs text-slate-400 font-semibold">Species recognised</p>
            <p className="text-3xl font-bold text-teal-300 tabular-nums mt-2">{M.perSpecies.length}</p>
          </Reveal>
        </div>

        <Reveal>
          <section className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2"><Cpu className="w-5 h-5 text-teal-400" /> How a photo is processed</h2>
            <ol className="space-y-3 text-sm text-slate-300 list-decimal pl-5">
              <li>The photo is resized (longest side up to 1024 px) and enhanced: contrast stretch, noise filter and sharpening, exactly as during training.</li>
              <li>A <strong className="text-white">seagrass check</strong> (gate model) estimates whether the photo shows seagrass at all. Below {M.gateThreshold}% the app says "This doesn't look like seagrass" and stops.</li>
              <li>The <strong className="text-white">species model</strong> ({M.architecture}, input {M.inputSize}) gives a confidence for each of the nine species.</li>
              <li>If the top confidence is below {M.confidenceThreshold}%, the app does not name a species and asks you to retake the photo or consult a marine science expert.</li>
            </ol>
          </section>
        </Reveal>

        <Reveal>
          <section className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2"><Table2 className="w-5 h-5 text-teal-400" /> Results per species (test set)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-500 uppercase text-[11px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 pr-4">Species</th>
                    <th className="py-2.5 pr-4">Test photos</th>
                    <th className="py-2.5 pr-4">Accuracy</th>
                    <th className="py-2.5 pr-4">Precision</th>
                    <th className="py-2.5 pr-4">Recall</th>
                    <th className="py-2.5">F1</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 tabular-nums">
                  {M.perSpecies.map((r) => (
                    <tr key={r.species}>
                      <td className="py-2.5 pr-4 italic text-slate-200">{r.species}</td>
                      <td className="py-2.5 pr-4">{r.testImages ?? '—'}</td>
                      <td className="py-2.5 pr-4">{cell(r.accuracy)}</td>
                      <td className="py-2.5 pr-4">{cell(r.precision)}</td>
                      <td className="py-2.5 pr-4">{cell(r.recall)}</td>
                      <td className="py-2.5">{cell(r.f1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Held-out test set of {M.perSpecies.reduce((n, r) => n + (r.testImages || 0), 0).toLocaleString()} photos
              the model never saw in training. Accuracy per species is one-vs-rest (correct yes/no decisions for that
              species over all test photos), so it is higher than the overall accuracy.
            </p>
          </section>
        </Reveal>

        <Reveal>
          <section className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2"><Grid3x3 className="w-5 h-5 text-teal-400" /> Confusion matrix</h2>
            {matrixMissing ? (
              <p className="text-sm italic text-slate-600">To be added.</p>
            ) : (
              <img src={M.confusionMatrixImage} alt="Confusion matrix of the species model on the test set"
                onError={() => setMatrixMissing(true)} className="max-w-full rounded-xl border border-slate-800 bg-white" />
            )}
          </section>
        </Reveal>

        <Reveal>
          <section className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-6 space-y-2">
            <h2 className="text-sm font-bold text-white flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-amber-300" /> Limitations</h2>
            <ul className="text-sm text-slate-300 space-y-1.5 list-disc pl-5">
              <li>Results come from a test set of photos; accuracy in the field depends on light, focus and water clarity.</li>
              <li>The model knows only the nine species of Pujada Bay. Other plants or algae may be rejected by the seagrass check, but not always.</li>
              <li>The highlight box is found by colour, not by the model, and is approximate.</li>
              <li className="flex items-start gap-1.5 list-none -ml-5"><Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-300" /> SeaScan supports, but does not replace, identification by a marine science expert.</li>
            </ul>
          </section>
        </Reveal>
      </main>
    </div>
  );
}
