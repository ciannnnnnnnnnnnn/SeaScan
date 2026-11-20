// src/components/SightingCard.jsx
// Hover card for a community sighting on the Distribution Map: photo,
// submitter, species and date. Nickname and photo appear only when the
// submitter chose to share them (or it is your own sighting); otherwise the
// card says "Community member" and shows no photo.
import React, { useEffect, useState } from 'react';
import { ImageOff, UserRound, CalendarDays } from 'lucide-react';
import { sightingPhotoUrl } from '../lib/api';

// Signed photo links, kept for the page visit so hovering again is instant.
const photoCache = new Map();

const formatDate = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

export default function SightingCard({ speciesName, submitter, photoPath, observedOn, status = 'community', demo = false }) {
  const [photo, setPhoto] = useState(() => (photoPath ? photoCache.get(photoPath) : null));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!photoPath || photoCache.has(photoPath)) return undefined;
    let active = true;
    sightingPhotoUrl(photoPath, 3600).then((url) => {
      if (!active) return;
      if (url) { photoCache.set(photoPath, url); setPhoto(url); } else setFailed(true);
    });
    return () => { active = false; };
  }, [photoPath]);

  return (
    <div className="flex gap-3 w-[250px] text-left font-sans">
      {/* Fixed-size photo box, so the card does not change size when the photo arrives. */}
      <div className="w-[72px] h-[72px] shrink-0 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center">
        {photoPath && photo && !failed ? (
          <img src={photo} alt={`Photo of ${speciesName}`} className="w-full h-full object-cover" onError={() => setFailed(true)} />
        ) : photoPath && !failed ? (
          <div className="skeleton w-full h-full" />
        ) : (
          <ImageOff className="w-5 h-5 text-slate-600" aria-label="No photo shared" />
        )}
      </div>
      <div className="min-w-0 space-y-1">
        <p className="text-xs font-semibold italic text-white truncate">{speciesName}</p>
        <p className="flex items-center gap-1 text-[11px] text-slate-300 truncate">
          <UserRound className="w-3 h-3 shrink-0 text-emerald-400" /> {submitter || 'Community member'}
        </p>
        <p className="flex items-center gap-1 text-[11px] text-slate-400">
          <CalendarDays className="w-3 h-3 shrink-0" /> {observedOn ? formatDate(observedOn) : '—'}
        </p>
        <p className={`text-[10px] font-semibold ${status === 'pending' ? 'text-slate-400' : 'text-emerald-300'}`}>
          {status === 'pending' ? 'Your sighting · pending review' : 'Community-submitted · unverified'}
          {demo && ' · demo location'}
        </p>
      </div>
    </div>
  );
}
