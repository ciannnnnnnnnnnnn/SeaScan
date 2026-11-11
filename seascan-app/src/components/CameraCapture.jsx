// src/components/CameraCapture.jsx
// Live camera (phone rear camera or desktop webcam) that hands back one JPEG.
// Needs HTTPS or localhost; the browser asks the user for permission.
import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, AlertCircle, SwitchCamera } from 'lucide-react';

export const cameraSupported = () =>
  typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [facing, setFacing] = useState('environment');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError(null);

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      .then(async (stream) => {
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();
        setReady(true);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err.name === 'NotAllowedError'
            ? 'Camera permission was denied. Allow camera access in your browser settings, or upload a photo instead.'
            : err.name === 'NotFoundError'
              ? 'No camera was found on this device. Upload a photo instead.'
              : `The camera could not start (${err.message}). Upload a photo instead.`
        );
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facing]);

  // Esc closes, like the other dialogs.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const capture = () => {
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) { setError('Could not take the photo. Please try again.'); return; }
      onCapture(new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.92);
  };

  return (
    <div className="backdrop-in fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label="Take a photo" className="modal-in w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Camera className="w-4 h-4 text-teal-400" /> Take a photo
          </h2>
          <button type="button" onClick={onClose} aria-label="Close camera" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative bg-black aspect-[4/3]">
          <video ref={videoRef} playsInline muted className="w-full h-full object-contain" />
          {!ready && !error && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-sm gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> Starting camera…
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <p className="text-sm text-rose-300 flex items-start gap-2 max-w-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
              </p>
            </div>
          )}
        </div>

        <div className="p-4 flex gap-3">
          <button type="button" onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))}
            className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold flex items-center gap-2"
            title="Switch between front and back camera">
            <SwitchCamera className="w-4 h-4" /> Switch
          </button>
          <button type="button" onClick={capture} disabled={!ready}
            className="flex-1 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2">
            <Camera className="w-4 h-4" /> Capture
          </button>
        </div>
        <p className="px-4 pb-4 text-xs text-slate-500">
          Tip: get close, fill the frame with the leaves, and use daylight. Your camera stream stays on this device.
        </p>
      </div>
    </div>
  );
}
