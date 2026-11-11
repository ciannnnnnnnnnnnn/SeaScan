// src/components/Seagrass3DViewer.jsx
// React wrapper for the <seagrass-viewer> web component (public/seagrass/).
// Nothing is downloaded until the viewer scrolls into view: then the viewer
// script, <model-viewer> (from the jsDelivr CDN) and this species' .glb load.
import React, { useEffect, useRef, useState } from 'react';
import { Box, RefreshCw, AlertCircle, Smartphone } from 'lucide-react';
import { SEAGRASS_BASE, loadSeagrassViewer } from '../lib/seagrass3d';

// A model that has not arrived by then is treated as failed (e.g. CDN blocked).
const LOAD_TIMEOUT_MS = 45000;
const HEIGHT = 'clamp(340px, 62vh, 560px)';

// SeaScan's look, passed in through the viewer's CSS custom properties.
const VIEWER_STYLE = {
  '--sg-height': HEIGHT,
  '--sg-radius': '1rem',
  '--sg-bg': 'radial-gradient(120% 90% at 50% 0%, #0f4c5c 0%, #07293a 48%, #020617 100%)',
  '--sg-accent': '#5eead4',
  '--sg-font': 'inherit',
  display: 'block',
};

// idle -> script (loading the component) -> model (viewer mounted, model
// downloading) -> ready; any step can end in error.
export default function Seagrass3DViewer({ modelId, scientificName }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  // Start only when the viewer area is (nearly) on screen.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || inView) return undefined;
    if (!('IntersectionObserver' in window)) { setInView(true); return undefined; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); io.disconnect(); }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [inView]);

  // Load the web component (once per page visit; cached afterwards).
  useEffect(() => {
    if (!inView) return undefined;
    let cancelled = false;
    setStatus('script');
    setError(null);
    loadSeagrassViewer()
      .then(() => { if (!cancelled) setStatus('model'); })
      .catch(() => {
        if (cancelled) return;
        setError('The 3D viewer could not be loaded. Check your internet connection.');
        setStatus('error');
      });
    return () => { cancelled = true; };
  }, [inView, attempt, modelId]);

  // While the model downloads, listen for the viewer's own events.
  useEffect(() => {
    const el = viewerRef.current;
    if (status !== 'model' || !el) return undefined;
    const onLoad = () => setStatus('ready');
    const onError = (e) => {
      setError(typeof e.detail === 'string' ? `The 3D model could not be shown (${e.detail}).` : 'The 3D model could not be shown.');
      setStatus('error');
    };
    const timer = setTimeout(() => {
      setError('The 3D model is taking too long to load. Check your connection and try again.');
      setStatus('error');
    }, LOAD_TIMEOUT_MS);
    el.addEventListener('seagrass-load', onLoad);
    el.addEventListener('seagrass-error', onError);
    return () => {
      clearTimeout(timer);
      el.removeEventListener('seagrass-load', onLoad);
      el.removeEventListener('seagrass-error', onError);
    };
  }, [status]);

  const mounted = status === 'model' || status === 'ready';
  const loading = status === 'idle' || status === 'script' || status === 'model';

  return (
    <div ref={containerRef} className="space-y-2">
      <div data-theme="dark" className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950" style={{ minHeight: HEIGHT }}>
        {mounted && (
          <seagrass-viewer
            key={`${modelId}-${attempt}`}
            ref={viewerRef}
            species={modelId}
            base={SEAGRASS_BASE}
            ar=""
            style={VIEWER_STYLE}
          />
        )}

        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-300 text-sm bg-slate-900 pointer-events-none" role="status">
            <Box className="w-10 h-10 text-teal-300/70" />
            <span className="flex items-center gap-2 px-4 text-center">
              <RefreshCw className="w-4 h-4 animate-spin text-teal-300 shrink-0" />
              <span>Loading 3D model of <em>{scientificName}</em>…</span>
            </span>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center" role="alert">
            <AlertCircle className="w-8 h-8 text-amber-300" />
            <p className="text-sm text-slate-300 max-w-sm">{error}</p>
            <button type="button" onClick={() => setAttempt((n) => n + 1)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Try again
            </button>
          </div>
        )}
      </div>
      <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>Drag to rotate, pinch or scroll to zoom. <strong className="text-slate-400">Labels</strong> names each part.</span>
        <span className="flex items-center gap-1"><Smartphone className="w-3.5 h-3.5" /> On a supported phone, the AR button shows the plant at real size.</span>
      </p>
      <p className="text-xs text-slate-600">
        A typical plant built from published measurements; real plants vary with depth, light and sediment.
      </p>
    </div>
  );
}
