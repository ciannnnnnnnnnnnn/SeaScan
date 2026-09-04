import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Box, 
  BookOpen, 
  Quote, 
  GraduationCap, 
  Microscope,
  Eye,
  Layers,
  ChevronDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import LoginModal from '../components/LoginModal';

// Custom inline SVG icons for Facebook & Twitter (X)
const FacebookIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H7.5v-3H10V9.5C10 7.01 11.49 5.6 13.78 5.6c1.1 0 2.25.2 2.25.2v2.47h-1.27c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 3h-2.33v6.8c4.56-.93 8-4.96 8-9.8z"/>
  </svg>
);

const TwitterIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

export default function HomePage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    setIsAuthModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased selection:bg-teal-500 selection:text-white">
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[85vh] flex items-center justify-center bg-slate-900 overflow-hidden px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2000&q=80" 
            alt="Underwater Marine Life" 
            className="w-full h-full object-cover opacity-35 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-teal-950/60 to-slate-900" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 py-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold tracking-wide uppercase backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Empowering Marine Conservation in Mati City</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight">
            AI Powered <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Seagrass Intelligence
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-200 max-w-2xl mx-auto font-normal leading-relaxed">
            A high-fidelity identification system bridging the gap between advanced image recognition and local environmental preservation in Pujada Bay.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/scanner"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-sm transition shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 group"
            >
              <span>Start Identifying Now</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <a
              href="#technology"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-white border border-slate-700 font-semibold text-sm transition backdrop-blur-md flex items-center justify-center gap-2"
            >
              <span>Explore Technology</span>
            </a>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-slate-400 animate-bounce">
          <ChevronDown className="w-5 h-5 text-teal-400" />
        </div>
      </section>

      {/* 2. THE VISION SECTION */}
      <section id="vision" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl bg-slate-100 border border-slate-200/80 p-8 shadow-sm aspect-square flex flex-col justify-end overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/10 via-emerald-500/5 to-transparent" />
              
              <div className="relative z-10 bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/60 space-y-3">
                <Quote className="w-6 h-6 text-teal-600" />
                <p className="text-sm font-semibold text-slate-800 leading-snug">
                  "Seagrass beds are the lungs of our bay. Identifying them is the first step to saving them."
                </p>
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                  — Local Marine Ecologist
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">
              The Vision
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Preserving the Underwater Blueprints of Pujada Bay
            </h2>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Mati City is blessed with diverse marine ecosystems. However, monitoring seagrass health remains a challenge. SeaScan leverages Artificial Intelligence to turn every smartphone into a research tool.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 pt-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-100/80 border border-slate-200/60">
                <div className="p-2 rounded-lg bg-teal-100/80 text-teal-700 shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Education</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Engaging the youth of Mati City with interactive literacy.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-100/80 border border-slate-200/60">
                <div className="p-2 rounded-lg bg-teal-100/80 text-teal-700 shrink-0">
                  <Microscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Research</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Supplying marine researchers with accurate data.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. CORE TECHNOLOGY SECTION */}
      <section id="technology" className="py-24 bg-slate-100/60 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">
              Core Technology
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Innovation Beneath the Surface
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              We've integrated four key technologies into a single, intuitive responsive platform.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div id="recognition" className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">AI Recognition</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                92% accuracy in identifying local species including Cymodocea and Thalassia hemprichii.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Box className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">3D Botanical Models</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                High-resolution models for studying root systems and blade structures without damaging samples.
              </p>
            </div>

            <div id="prototypes" className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Augmented Reality</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bring seagrass ecology into the classroom by overlaying 3D models in a real-world environment.
              </p>
            </div>

            <div id="ar" className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Knowledge Base</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                A central repository for Mati City's seagrass data, accessible for researchers globally.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 4. CALL TO ACTION BANNER */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto bg-slate-900 rounded-3xl p-10 sm:p-16 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Ready to explore Mati's marine wonders?
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              Join the BSIT Capstone 2026 initiative and contribute to the conservation of our blue ecosystems.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                to="/scanner"
                className="w-full sm:w-auto px-7 py-3 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs uppercase tracking-wider transition shadow-lg"
              >
                Enter SeaScan System
              </Link>
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full sm:w-auto px-7 py-3 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-md"
              >
                Contact Research Team
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOOTER SECTION */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 text-xs py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <span className="w-3 h-3 rounded-full bg-teal-400" />
                <span>SeaScan</span>
              </div>
              <p className="text-slate-500 leading-relaxed max-w-sm">
                An innovative classification system for the seagrasses of Mati City, Dahican, Davao Oriental. Developed by BSIT Students of Davao Oriental State University.
              </p>
              <div className="flex items-center gap-3 text-slate-400 pt-2">
                <a href="#facebook" aria-label="Facebook" className="hover:text-white transition">
                  <FacebookIcon className="w-4 h-4" />
                </a>
                <a href="#twitter" aria-label="Twitter" className="hover:text-white transition">
                  <TwitterIcon className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="md:col-span-3 space-y-3">
              <h4 className="text-white font-bold uppercase tracking-wider">The Project</h4>
              <ul className="space-y-2 text-slate-500">
                <li><a href="#vision" className="hover:text-slate-300 transition">Our Vision</a></li>
                <li><a href="#ar" className="hover:text-slate-300 transition">Digital Library</a></li>
                <li><a href="#recognition" className="hover:text-slate-300 transition">Image Recognition</a></li>
                <li><a href="#prototypes" className="hover:text-slate-300 transition">AR Prototypes</a></li>
              </ul>
            </div>

            <div className="md:col-span-4 space-y-3">
              <h4 className="text-white font-bold uppercase tracking-wider">Developers</h4>
              <ul className="space-y-1.5 text-slate-500">
                <li>Labrador, E. M.</li>
                <li>Valing, Jeffrey</li>
                <li>Kandalla, Dave R.</li>
                <li className="pt-2 text-slate-400 font-semibold">DORSU - BSIT 2026</li>
              </ul>
            </div>

          </div>

          <div className="pt-12 mt-12 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-slate-600 gap-4">
            <p>© 2026 SeaScan Project. All Rights Reserved.</p>
            <div className="flex gap-6">
              <a href="#privacy" className="hover:text-slate-400 transition">Privacy Policy</a>
              <a href="#terms" className="hover:text-slate-400 transition">DMCA Institutional Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal Integration */}
      <LoginModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onLoginSuccess={handleLoginSuccess}
      />

    </div>
  );
}