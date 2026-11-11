// src/components/staff/SightingDetails.jsx
// Pop-up with every detail of one sighting, opened from Sighting Review.
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, MapPin, Copy, Check, ExternalLink, ImageOff, Ban, Trash2, CalendarDays, Cpu, User, Hash, StickyNote, ShieldCheck, Loader2 } from 'lucide-react';
import { sightingPhotoUrl } from '../../lib/api';
import StationMiniMap from '../StationMiniMap';
import { buttonClass } from './PortalShell';

const STATUS = {
  pending: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
  approved: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
  rejected: 'bg-rose-500/10 text-rose-300 border-rose-500/25',
};

const SOURCE = {
  gps: 'Device GPS',
  map: 'Picked on the map',
  demo: 'Demo location (user testing - not a real place)',
};

const AMBER = { color: '#b45309', fillColor: '#fbbf24', fillOpacity: 0.9, weight: 2 };

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-slate-800/70 last:border-0">
      <Icon className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500">{label}</p>
        <div className="text-sm text-slate-200 mt-0.5 break-words">{children}</div>
      </div>
    </div>
  );
}

const when = (v) => (v ? new Date(v).toLocaleString() : '—');

export default function SightingDetails({ sighting: s, species, submitter, busy, canDelete, onApprove, onReject, onDelete, onClose }) {
  const [photo, setPhoto] = useState({ url: null, loading: !!s.photo_path, failed: false });
  const [copied, setCopied] = useState(false);
  const lat = Number(s.latitude);
  const lng = Number(s.longitude);
  const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  // Private photo: fetch a short-lived signed link when the pop-up opens.
  useEffect(() => {
    let active = true;
    if (!s.photo_path) return undefined;
    sightingPhotoUrl(s.photo_path).then((url) => {
      if (active) setPhoto({ url, loading: false, failed: !url });
    });
    return () => { active = false; };
  }, [s.photo_path]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const copyCoords = async () => {
    try {
      await navigator.clipboard.writeText(coords);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked: the text is still selectable */ }
  };

  return (
    <div
      className="backdrop-in fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div role="dialog" aria-modal="true" aria-label="Sighting details"
        className="modal-in thin-scroll w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 z-[1100] flex items-start justify-between gap-4 p-5 border-b border-slate-800 bg-slate-900/95">
          <div className="min-w-0">
            <p className="text-xs text-teal-400">Sighting details</p>
            <h2 className="text-xl font-semibold italic text-white mt-1 truncate">{species?.scientific_name || 'Unknown species'}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
              <span className={`px-2 py-0.5 rounded-md border font-semibold capitalize ${STATUS[s.status]}`}>{s.status}</span>
              {species && (
                <Link to={`/library/${species.slug}`} target="_blank" className="text-teal-300 hover:text-teal-200 flex items-center gap-1">
                  Species profile <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 grid md:grid-cols-2 gap-5">
          {/* Photo */}
          <div className="space-y-2">
            <p className="text-xs text-slate-500">Photo</p>
            <div className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
              {!s.photo_path ? (
                <p className="text-sm text-slate-600 flex items-center gap-2"><ImageOff className="w-4 h-4" /> No photo submitted</p>
              ) : photo.loading ? (
                <Loader2 className="w-6 h-6 text-teal-300 animate-spin" />
              ) : photo.failed ? (
                <p className="text-sm text-slate-500 flex items-center gap-2"><ImageOff className="w-4 h-4" /> Photo could not be loaded</p>
              ) : (
                <a href={photo.url} target="_blank" rel="noreferrer" title="Open full size" className="w-full h-full">
                  <img src={photo.url} alt={`Sighting of ${species?.scientific_name || 'seagrass'}`} className="w-full h-full object-contain" />
                </a>
              )}
            </div>
            {photo.url && <p className="text-xs text-slate-500">Click the photo to open it full size. The link expires after 10 minutes.</p>}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <p className="text-xs text-slate-500">Location</p>
            <StationMiniMap
              stations={[{ id: s.id, name: species?.scientific_name || 'Sighting', latitude: lat, longitude: lng }]}
              height={220}
              singleZoom={14}
              pathOptions={AMBER}
            />
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-sm text-slate-100 select-all">{coords}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Latitude {lat.toFixed(6)} · Longitude {lng.toFixed(6)}
                  </p>
                </div>
                <button type="button" onClick={copyCoords}
                  className={`${buttonClass} bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5`}>
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className={`text-xs flex items-center gap-1.5 ${s.location_source === 'demo' ? 'text-amber-300' : 'text-slate-400'}`}>
                <MapPin className="w-3.5 h-3.5" /> {SOURCE[s.location_source] || s.location_source}
              </p>
              <div className="flex flex-wrap gap-3 text-xs">
                <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noreferrer"
                  className="text-teal-300 hover:text-teal-200 flex items-center gap-1">Open in Google Maps <ExternalLink className="w-3 h-3" /></a>
                <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`} target="_blank" rel="noreferrer"
                  className="text-teal-300 hover:text-teal-200 flex items-center gap-1">OpenStreetMap <ExternalLink className="w-3 h-3" /></a>
              </div>
            </div>
          </div>

          {/* All recorded data */}
          <div className="md:col-span-2 grid md:grid-cols-2 gap-x-6 rounded-xl bg-slate-950/40 border border-slate-800 px-4">
            <div>
              <Row icon={CalendarDays} label="Date observed">{s.observed_on}</Row>
              <Row icon={CalendarDays} label="Submitted">{when(s.created_at)}</Row>
              <Row icon={Cpu} label="Scanner confidence">
                {s.model_confidence != null ? `${s.model_confidence}%` : 'Not identified with the scanner'}
              </Row>
              <Row icon={User} label="Submitted by">{submitter}</Row>
            </div>
            <div>
              <Row icon={StickyNote} label="Field notes">{s.notes || <span className="text-slate-600 italic">None</span>}</Row>
              <Row icon={ShieldCheck} label="Review">
                {s.reviewed_at ? `${s.status} on ${when(s.reviewed_at)}` : 'Not reviewed yet'}
                {s.review_note && <span className="block text-rose-300/90 mt-0.5">Note: {s.review_note}</span>}
              </Row>
              <Row icon={Hash} label="Sighting ID"><span className="font-mono text-xs text-slate-400 select-all">{s.id}</span></Row>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 p-4 border-t border-slate-800 bg-slate-900/95">
          {canDelete && (
            <button disabled={busy} onClick={onDelete}
              className={`${buttonClass} mr-auto bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 flex items-center gap-1.5`}>
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          )}
          <button onClick={onClose} className={`${buttonClass} bg-slate-800 hover:bg-slate-700 text-slate-200`}>Close</button>
          {s.status !== 'rejected' && (
            <button disabled={busy} onClick={onReject}
              className={`${buttonClass} bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 flex items-center gap-1.5`}>
              <Ban className="w-3.5 h-3.5" /> Reject
            </button>
          )}
          {s.status !== 'approved' && (
            <button disabled={busy} onClick={onApprove}
              className={`${buttonClass} bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5`}>
              <Check className="w-3.5 h-3.5" /> Approve
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
