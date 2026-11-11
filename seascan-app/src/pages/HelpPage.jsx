// src/pages/HelpPage.jsx
// User manual, FAQ, privacy notes, contact and feedback (maintenance plan).
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LifeBuoy, BookOpen, HelpCircle, Lock, Mail, Send, Star, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';
import { Reveal } from '../components/motion';
import { useAuth } from '../context/AuthContext';
import { sendFeedback } from '../lib/api';

const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL;

const MANUAL = [
  {
    title: 'Identify a seagrass',
    steps: [
      'Open Scanner from the top menu.',
      'Tap "Select a photo" to choose one JPEG or PNG photo (up to 10 MB), or "Use camera" to take one.',
      'Wait a moment. SeaScan first checks that the photo shows seagrass, then names the species with a confidence score.',
      'Below 70% confidence, retake the photo in daylight, closer and in focus, or ask a marine science expert.',
      'Read the species profile and conservation guide, or open the full profile in the Digital Library.',
    ],
  },
  {
    title: 'Record a sighting',
    steps: [
      'Create an account or log in (Portal Login). No real name is needed.',
      'After a scan, choose "Record This Sighting", or use "Submit a sighting" on the Distribution Map.',
      'Pick the location: your GPS, tap the map, or "Demo location" during user testing.',
      'Check the species and date, add notes or the photo if you like, then submit.',
      'A researcher reviews it. Once approved it appears on the map as a community-submitted, unverified record.',
      'My Account (top menu) lists your sightings and their review status, your scan history and your profile settings.',
    ],
  },
  {
    title: 'Tips for taking photographs',
    steps: [
      'Fill most of the frame with the leaves; get close rather than zooming in.',
      'Use daylight. Avoid glare on the water surface and strong shadows.',
      'Keep the camera steady so the leaf edges and tips are sharp.',
      'Show the leaf tip and blade clearly: they separate look-alike species.',
      'One plant type per photo. Remove sand, algae and other objects from view where you can.',
    ],
  },
  {
    title: 'Explore species and the map',
    steps: [
      'Digital Library: search by scientific, common or local name and filter by leaf shape or conservation status.',
      'Open a species to see its morphology, ecology, distribution, survey stations and conservation tips.',
      'Distribution Map: blue circles are verified survey stations (bigger = more species), gold pins are approved community sightings.',
      'Use the species filter to show where one species was recorded.',
    ],
  },
];

const FAQ = [
  ['Is my photo uploaded when I scan it?', 'Normally no: identification runs on your device. Only if your device cannot run the identification model (older phones, or browsers without graphics acceleration) is the photo sent to the SeaScan server, identified there in memory, and discarded without being stored; the Scanner tells you when this happens. A photo is kept only if you choose to attach it to a sighting, and then it is stored privately with its hidden metadata (including GPS tags) removed.'],
  ['What is saved in my scan history?', 'When you are signed in, each identification result (species, confidence, date) is saved in My Account > Scan history, never the photo. You can delete single scans or the whole history there.'],
  ['Why does it say "This doesn\'t look like seagrass"?', 'A first check estimates whether the photo shows seagrass. Land grass, algae, sand or other objects are rejected. Photograph the seagrass leaves up close, filling most of the frame.'],
  ['Why does it say "not sure"?', 'The best match was below 70% confidence. Blurry, dark or distant photos, or species not in the nine covered, lead to low confidence. Retake the photo or consult a marine science expert.'],
  ['Which species can SeaScan identify?', 'The nine seagrass species recorded in Pujada Bay, Mati City. See the Digital Library for the full list.'],
  ['Why is my sighting not on the map?', 'New sightings are pending until a researcher approves them. You can see your own pending sightings on the map as grey pins and in your sighting list.'],
  ['What is the demo location?', 'A fixed point in Pujada Bay used during user testing, so participants never share their real location.'],
  ['How do I become a researcher or admin?', 'Those roles are assigned by a SeaScan administrator. Contact the team using the email below.'],
  ['Does the camera work on my phone?', 'Yes, on current Chrome, Safari, Firefox and Edge over HTTPS. Allow camera access when asked. If it does not start, use "Select a photo" - most phones then offer to take a picture.'],
];

export default function HelpPage() {
  const { user } = useAuth();
  const [category, setCategory] = useState('general');
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (message.trim().length < 3) { setError('Please write a short message.'); return; }
    setSending(true);
    try {
      await sendFeedback({ userId: user?.id, category, message, rating, page: 'help' });
      setSent(true);
      setMessage('');
      setRating(0);
    } catch (err) {
      setError(`Could not send feedback: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const field = 'w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans antialiased pb-16">
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 py-14">
        <div className="absolute -top-24 left-1/3 w-[32rem] h-[32rem] rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <span className="text-xs font-bold text-teal-400 uppercase tracking-widest flex items-center gap-1.5"><LifeBuoy className="w-4 h-4" /> Help</span>
          <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">Help, FAQ and feedback</h1>
          <nav className="flex flex-wrap gap-2 text-xs font-semibold pt-1">
            {[['#manual', 'User manual'], ['#faq', 'FAQ'], ['#privacy', 'Privacy'], ['#contact', 'Contact'], ['#feedback', 'Send feedback']].map(([href, label]) => (
              <a key={href} href={href} className="px-3 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-200">{label}</a>
            ))}
          </nav>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <section id="manual" className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><BookOpen className="w-5 h-5 text-teal-400" /> User manual</h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            {MANUAL.map((part, i) => (
              <Reveal key={part.title} delay={i * 60} className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <h3 className="text-sm font-bold text-white mb-3">{part.title}</h3>
                <ol className="space-y-2 text-xs text-slate-400 leading-relaxed list-decimal pl-4">
                  {part.steps.map((s) => <li key={s}>{s}</li>)}
                </ol>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="faq" className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><HelpCircle className="w-5 h-5 text-teal-400" /> Frequently asked questions</h2>
          <div className="space-y-2">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group rounded-xl bg-slate-900 border border-slate-800 open:border-teal-500/30">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-slate-200">
                  {q}
                  <ChevronDown className="w-4 h-4 text-slate-500 transition-transform group-open:rotate-180 shrink-0" />
                </summary>
                <p className="px-5 pb-4 text-sm text-slate-400 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="privacy" className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><Lock className="w-5 h-5 text-teal-400" /> Privacy</h2>
          <ul className="text-sm text-slate-400 space-y-2 list-disc pl-5 leading-relaxed">
            <li>Scanning happens on your device. On devices that cannot run the model, the photo is sent to the SeaScan server, identified in memory and not stored.</li>
            <li>When you are signed in, your identification results (not the photos) are saved in your scan history, which only you can see and which you can delete in My Account.</li>
            <li>SeaScan uses only essential cookies to keep you signed in. Without "Keep me signed in", they are removed when you close the browser; with it, after 30 days. No tracking or advertising cookies are used. You are signed out after 30 minutes of inactivity unless you chose to stay signed in (staff accounts are always signed out).</li>
            <li>An account needs only an email and password. A nickname is optional; no real name is collected.</li>
            <li>Sighting photos are stored privately, visible only to you and the research team, with hidden metadata removed.</li>
            <li>The public map never shows who submitted a sighting.</li>
            <li>Feedback is anonymous. Data from user-testing sessions is deleted after the sessions.</li>
          </ul>
        </section>

        <section id="contact" className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><Mail className="w-5 h-5 text-teal-400" /> Contact</h2>
          {CONTACT_EMAIL ? (
            <p className="text-sm text-slate-400">
              Email the SeaScan team at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-teal-300 hover:text-teal-200 underline">{CONTACT_EMAIL}</a>.
            </p>
          ) : (
            <p className="text-sm text-slate-500 italic">Contact email to be added (set VITE_CONTACT_EMAIL).</p>
          )}
          <p className="text-sm text-slate-400">
            Signed-in users can also use <Link to="/community" className="text-teal-300 hover:text-teal-200 underline">Ask a Researcher</Link> in the Community Hub.
          </p>
        </section>

        <section id="feedback" className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><Send className="w-5 h-5 text-teal-400" /> Send feedback</h2>
          <form onSubmit={submit} className="max-w-2xl p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            {sent && (
              <p className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2" role="status">
                <CheckCircle2 className="w-4 h-4" /> Thank you! Your feedback was sent anonymously.
              </p>
            )}
            {error && (
              <p className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2" role="alert">
                <AlertCircle className="w-4 h-4" /> {error}
              </p>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fb-cat" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Topic</label>
                <select id="fb-cat" value={category} onChange={(e) => setCategory(e.target.value)} className={field}>
                  <option value="general">General</option>
                  <option value="identification">Identification result</option>
                  <option value="content">Species or map content</option>
                  <option value="bug">Something is broken</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Rating (optional)</span>
                <div className="flex gap-1 py-1.5" role="radiogroup" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`}
                      onClick={() => setRating(rating === n ? 0 : n)}>
                      <Star className={`w-6 h-6 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="fb-msg" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Message</label>
              <textarea id="fb-msg" rows={5} maxLength={2000} required value={message} onChange={(e) => { setMessage(e.target.value); setSent(false); }}
                placeholder="What worked, what didn't, what would help?" className={`${field} resize-none`} />
              <p className="text-xs text-slate-600 mt-1">Please don't include your name or other personal details.</p>
            </div>
            <button type="submit" disabled={sending} className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-slate-950 font-bold text-sm flex items-center gap-2">
              <Send className="w-4 h-4" /> Send feedback
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
