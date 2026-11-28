// src/components/OfflineBanner.jsx
// Small notice at the bottom of the screen while the connection is down, and a
// short "back online" confirmation when it returns. Shown on every page.
import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnline } from '../hooks/useOnline';

export default function OfflineBanner() {
  const online = useOnline();
  const [backOnline, setBackOnline] = useState(false);

  // "Back online" for a few seconds after the connection returns.
  useEffect(() => {
    let timer;
    const onOnline = () => {
      setBackOnline(true);
      clearTimeout(timer);
      timer = setTimeout(() => setBackOnline(false), 4000);
    };
    const onOffline = () => { clearTimeout(timer); setBackOnline(false); };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (online && !backOnline) return null;

  return (
    <div role="status" aria-live="polite"
      className="fixed inset-x-3 bottom-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[34rem] z-[2000] modal-in">
      {online ? (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-950/95 border border-emerald-500/40 text-emerald-200 text-xs font-semibold shadow-xl">
          <Wifi className="w-4 h-4 shrink-0" /> Back online.
        </div>
      ) : (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-slate-900/95 border border-amber-500/40 text-amber-200 text-xs leading-relaxed shadow-xl">
          <WifiOff className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <span className="font-semibold">You are offline.</span> Pages already open keep working, and the Scanner still
            identifies photos once its model has loaded. Map tiles, sign-in and saving need the connection;
            a sighting you submit now is kept and sent when you are back online.
          </span>
        </div>
      )}
    </div>
  );
}
