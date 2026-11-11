// src/components/ScannerPage.jsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload,
  Camera,
  CheckCircle2,
  MapPin,
  X,
  Leaf,
  Sparkles,
  RefreshCw,
  AlertCircle,
  ClipboardList,
  Ruler,
  Waves,
  Compass,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../hooks/useCatalog';
import { fetchMySightings } from '../lib/api';
import { ACCEPT_ATTR, MAX_UPLOAD_MB, validatePhotoFiles } from '../lib/images';
import DetectionOverlay from './DetectionOverlay';
import CameraCapture, { cameraSupported } from './CameraCapture';
import SightingForm from './SightingForm';
import { Fact, ConservationGuide, ReviewNotice } from './SpeciesFacts';
import { loadSeagrassModel, identifyPhoto, browserCanIdentify, serverAvailable, MODEL_VERSION } from './seagrassModel';
import { logIdentification } from '../lib/backend';
import { saveScan } from '../lib/api';
import { useModelSettings } from '../hooks/useModelSettings';
import { Reveal, CountUp } from './motion';

const STATUS_CHIP = {
  pending: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
  approved: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
  rejected: 'bg-rose-500/10 text-rose-300 border-rose-500/25',
};

export default function ScannerPage() {
  const { user, openAuthModal } = useAuth();
  const catalog = useCatalog();
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [inputError, setInputError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [imageAspect, setImageAspect] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [scanMs, setScanMs] = useState(null);
  const [modelStatus, setModelStatus] = useState('loading'); // loading | ready | server | error
  const { settings: modelSettings, loaded: settingsLoaded } = useModelSettings();
  const [modelError, setModelError] = useState(null);
  const scanIdRef = useRef(0);
  const [showSightingDrawer, setShowSightingDrawer] = useState(false);
  const [myRecords, setMyRecords] = useState([]);

  const isRejected = scanResult ? !scanResult.isSeagrass : false;
  const topMatch = scanResult?.predictions[0];
  const alternates = scanResult?.predictions.slice(1, 3) ?? [];
  const isConfident = topMatch && topMatch.pct >= scanResult.threshold;
  const matched = topMatch ? catalog.speciesByModelLabel(topMatch.name) : null;
  const matchedStations = matched ? catalog.stationsForSpecies(matched.id) : [];
  const plantBox = isConfident ? scanResult.plantBox : null;

  // Start downloading the models as soon as the page opens - unless this
  // device cannot run them, in which case photos go to the SeaScan server.
  useEffect(() => {
    if (!settingsLoaded) return;
    let active = true;
    browserCanIdentify().then((capable) => {
      if (!active) return;
      if (!capable) {
        if (serverAvailable(modelSettings)) setModelStatus('server');
        else {
          setModelStatus('error');
          setModelError('this device cannot run the model, and the SeaScan server is not available');
        }
        return;
      }
      loadSeagrassModel()
        .then(() => { if (active) setModelStatus('ready'); })
        .catch((err) => {
          if (!active) return;
          if (serverAvailable(modelSettings)) setModelStatus('server');
          else { setModelStatus('error'); setModelError(err.message); }
        });
    });
    return () => { active = false; };
  }, [settingsLoaded, modelSettings]);

  const loadMyRecords = useCallback(async () => {
    if (!user) return;
    try {
      setMyRecords(await fetchMySightings(user.id));
    } catch {
      setMyRecords([]);
    }
  }, [user]);

  useEffect(() => { loadMyRecords(); }, [loadMyRecords]);

  // Every way of getting a photo (picker, drop, camera) goes through here.
  const selectFiles = (fileList) => {
    const problem = validatePhotoFiles(fileList);
    if (problem) {
      setInputError(problem);
      return;
    }
    const file = fileList[0];
    setInputError(null);
    const url = URL.createObjectURL(file);
    setImageAspect(null);
    setImageFile(file);
    setSelectedImage(url);
    triggerScan(url, file);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // lets the same file be picked again
    if (files.length) selectFiles(files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    selectFiles(e.dataTransfer.files);
  };

  // Run the models on the photo. scanIdRef drops results from an older photo
  // if the user replaced it while the model was still working.
  const triggerScan = async (url, file) => {
    const scanId = ++scanIdRef.current;
    setIsScanning(true);
    setHasScanned(false);
    setScanResult(null);
    setScanError(null);
    const started = performance.now();
    try {
      const result = await identifyPhoto({ url, file, settings: modelSettings });
      if (scanId !== scanIdRef.current) return;
      const elapsed = performance.now() - started;
      setModelStatus(result.method === 'server' ? 'server' : 'ready');
      setScanResult(result);
      setScanMs(elapsed);
      setHasScanned(true);

      const top = result.predictions[0];
      const answer = {
        outcome: !result.isSeagrass ? 'not_seagrass' : top.pct >= result.threshold ? 'identified' : 'low_confidence',
        speciesLabel: result.isSeagrass ? top.name.replace(/ /g, '_') : null,
        confidence: result.isSeagrass ? top.pct : null,
        gateScore: result.gateScore,
        durationMs: elapsed,
      };
      // Monitoring log (never the photo). The server logs its own results.
      if (result.method === 'browser') logIdentification({ ...answer, modelVersion: MODEL_VERSION });
      // My Account > Scan history, for signed-in users. Not essential: ignore failures.
      if (user) saveScan({ ...answer, method: result.method }).catch(() => {});
    } catch (err) {
      if (scanId !== scanIdRef.current) return;
      setScanError(err.message);
    } finally {
      if (scanId === scanIdRef.current) setIsScanning(false);
    }
  };

  const clearImage = () => {
    scanIdRef.current++;
    setSelectedImage(null);
    setImageFile(null);
    setInputError(null);
    setHasScanned(false);
    setScanResult(null);
    setScanError(null);
    setIsScanning(false);
  };

  const handleAddSighting = () => {
    if (!user) openAuthModal();
    else setShowSightingDrawer(true);
  };

  // Esc closes the drawer.
  useEffect(() => {
    if (!showSightingDrawer) return;
    const onKey = (e) => { if (e.key === 'Escape') setShowSightingDrawer(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showSightingDrawer]);

  const speciesName = (id) => catalog.speciesById(id)?.scientific_name || '—';
  const canUseCamera = cameraSupported();

  const inputErrorBox = inputError && (
    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2" role="alert">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{inputError}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans antialiased pb-16">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Page header */}
        <Reveal className="mb-8">
          <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">
            Field Identification
          </span>
          <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            AI Species Identification
            <Sparkles className="w-6 h-6 text-teal-400" />
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl">
            Upload or capture a photo of seagrass to identify it among the nine native
            seagrasses of Pujada Bay.{' '}
            {modelStatus === 'server'
              ? 'This device cannot run the identification model, so your photo is sent to the SeaScan server, identified there and not stored.'
              : 'Your photo is analysed on this device and is not uploaded.'}
          </p>
          {modelStatus === 'loading' && (
            <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-400" />
              Loading identification model…
            </p>
          )}
          {modelStatus === 'error' && (
            <p className="text-xs text-rose-300 mt-3 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Could not load the identification model: {modelError}
            </p>
          )}
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* IMAGE INPUT */}
          <Reveal className="lg:col-span-5">
            <section className="h-full bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-teal-400" />
                Image Input
              </h2>

              {!selectedImage ? (
                <>
                  <label
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false); }}
                    onDrop={handleDrop}
                    className={`group cursor-pointer border-2 border-dashed transition-colors rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[300px] ${
                      isDragging
                        ? 'border-teal-400 bg-teal-500/10'
                        : 'border-slate-700 bg-slate-950/40 hover:border-teal-500/60 hover:bg-teal-500/5'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-300 mb-4 transition-transform duration-200 group-hover:-translate-y-1">
                      <Upload className="float-y w-7 h-7" />
                    </div>
                    <p className="text-sm font-semibold text-slate-200">{isDragging ? 'Drop to identify' : 'Drag & drop a photo here'}</p>
                    <p className="text-xs text-slate-500 mt-1 mb-5">One JPEG or PNG photo, up to {MAX_UPLOAD_MB} MB</p>
                    <span className="bg-teal-500 group-hover:bg-teal-400 text-slate-950 text-sm font-bold px-5 py-2.5 rounded-xl transition-colors inline-flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Select a photo
                    </span>
                    <input type="file" accept={ACCEPT_ATTR} className="hidden" onChange={handleImageUpload} />
                  </label>
                  {canUseCamera && (
                    <button
                      type="button"
                      onClick={() => setShowCamera(true)}
                      className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      Use camera
                    </button>
                  )}
                  {inputErrorBox}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-square max-h-[360px] flex items-center justify-center">
                    {/* Shows the whole photo, not a crop, in a frame exactly its size,
                        so the highlight lands on the right part of the image. */}
                    <div
                      className={`relative ${imageAspect !== null && imageAspect < 1 ? 'h-full' : 'w-full'}`}
                      style={{ aspectRatio: imageAspect ?? 1 }}
                    >
                      <img
                        key={selectedImage}
                        src={selectedImage}
                        alt="Uploaded seagrass sample"
                        onLoad={(e) => setImageAspect(e.target.naturalWidth / e.target.naturalHeight)}
                        className="img-settle block w-full h-full"
                      />
                      {plantBox && (
                        <DetectionOverlay detections={[{ ...plantBox, label: topMatch.name, confidence: topMatch.pct.toFixed(1) }]} />
                      )}
                    </div>

                    {isScanning && (
                      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center text-white overflow-hidden">
                        {/* Sweep reads as the model working across the sample */}
                        <div className="scan-sweep absolute inset-x-0 h-1/3 bg-gradient-to-b from-transparent via-teal-400/25 to-transparent" />
                        {/* Viewfinder corners */}
                        {['top-4 left-4 border-t-2 border-l-2', 'top-4 right-4 border-t-2 border-r-2', 'bottom-4 left-4 border-b-2 border-l-2', 'bottom-4 right-4 border-b-2 border-r-2'].map((pos) => (
                          <span key={pos} className={`detect-corner absolute w-7 h-7 rounded-sm border-teal-300 ${pos}`} />
                        ))}
                        <RefreshCw className="relative w-9 h-9 text-teal-300 animate-spin mb-3" />
                        <span className="relative font-semibold text-sm tracking-wide">
                          Analyzing botanical features...
                        </span>
                      </div>
                    )}
                  </div>

                  {isConfident && (
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {plantBox
                        ? 'The box marks the green plant area found by colour. It is approximate and separate from the species prediction.'
                        : 'No clear green plant area was found to highlight. The species prediction is unaffected.'}
                    </p>
                  )}

                  {scanError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Identification failed: {scanError}</span>
                    </div>
                  )}

                  {inputErrorBox}

                  <div className="flex gap-3">
                    <label className="flex-1 cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 px-3 rounded-xl text-center transition-colors border border-slate-700 flex items-center justify-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5" />
                      Replace
                      <input type="file" accept={ACCEPT_ATTR} className="hidden" onChange={handleImageUpload} />
                    </label>
                    {canUseCamera && (
                      <button
                        type="button"
                        onClick={() => setShowCamera(true)}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 px-3 rounded-xl transition-colors border border-slate-700 flex items-center justify-center gap-2"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        Retake
                      </button>
                    )}
                    <button
                      onClick={clearImage}
                      className="px-4 py-2.5 text-xs text-rose-300 hover:bg-rose-950/40 font-semibold rounded-xl transition-colors border border-rose-900/50"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </section>
          </Reveal>

          {/* CLASSIFICATION RESULT */}
          <Reveal delay={80} className="lg:col-span-7">
            {isScanning ? (
              /* Skeleton while the model runs - shape matches the real result */
              <div className="h-full bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6">
                <div className="skeleton h-28 rounded-2xl" />
                <div className="space-y-3">
                  <div className="skeleton h-3 w-40 rounded" />
                  <div className="skeleton h-2.5 rounded-full" />
                  <div className="skeleton h-2.5 rounded-full" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="skeleton h-16 rounded-xl" />
                  <div className="skeleton h-16 rounded-xl" />
                  <div className="skeleton h-16 rounded-xl" />
                </div>
              </div>
            ) : hasScanned ? (
              <div className="stagger bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6">

                {/* The seagrass check did not load: say so, since any photo now gets a species */}
                {scanResult.gateScore === null && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2" role="alert">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      The seagrass check could not be loaded, so this photo was not checked for being seagrass.
                      Photos of other plants or objects will still get a species name. Reload the page to try again.
                    </span>
                  </div>
                )}

                {/* The gate model judged this is not a seagrass photo: no species shown */}
                {isRejected && (
                  <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/25">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Not seagrass
                    </span>
                    <h3 className="mt-3 text-xl sm:text-2xl font-extrabold text-white">
                      This doesn't look like seagrass
                    </h3>
                    <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                      The seagrass check scored this photo{' '}
                      <span className="tabular-nums">{scanResult.gateScore.toFixed(1)}%</span>, below the{' '}
                      {Math.round(scanResult.gateThreshold)}% needed, so no species was identified. Photograph
                      a seagrass plant up close, in good light, filling most of the frame.
                    </p>
                  </div>
                )}

                {/* Below the threshold the model is guessing - ask for a retake */}
                {!isRejected && !isConfident && (
                  <div className="rounded-2xl border-2 border-amber-500/50 bg-amber-500/10 p-6" role="alert">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/25">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Not sure - please retake
                    </span>
                    <p className="mt-3 text-sm text-slate-200 leading-relaxed">
                      Best guess: <span className="italic font-semibold text-white">{topMatch.name}</span>,{' '}
                      confidence <span className="font-bold tabular-nums text-amber-200">{topMatch.pct.toFixed(1)}%</span>{' '}
                      (below the {Math.round(scanResult.threshold)}% needed for an identification).
                    </p>
                    <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                      Retake the photo in better lighting (daylight, no glare), closer to the leaves and in focus,
                      or consult a marine science expert.
                    </p>
                  </div>
                )}

                {/* Primary match */}
                {isConfident && (
                <div className="relative overflow-hidden rounded-2xl border border-teal-500/30 bg-teal-500/5 p-6">
                  <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-teal-500/10 blur-3xl" />
                  <div className="relative flex items-start justify-between gap-4">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-500/15 text-teal-300 border border-teal-500/25">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Top match identified
                      </span>
                      <h3 className="mt-3 text-2xl sm:text-3xl font-extrabold italic text-white">
                        {topMatch.name}
                      </h3>
                      {(matched?.common_name || matched?.local_name) && (
                        <p className="text-sm text-slate-400 mt-1">
                          {matched.common_name}
                          {matched.common_name && matched.local_name ? ' · ' : ''}
                          {matched.local_name && <span className="text-cyan-300 font-semibold">{matched.local_name}</span>}
                        </p>
                      )}
                      {matched?.leaf_shape && (
                        <span className="inline-block mt-2 text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                          {matched.leaf_shape}
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-3xl font-extrabold text-teal-300 tabular-nums">
                        <CountUp value={topMatch.pct} decimals={1} suffix="%" />
                      </div>
                      <span className="text-[11px] text-slate-500 uppercase tracking-widest font-bold">
                        Confidence
                      </span>
                    </div>
                  </div>
                  <div className="relative mt-5 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="bar-grow h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-300"
                      style={{ width: `${topMatch.pct}%` }}
                    />
                  </div>
                </div>
                )}

                {/* Alternatives */}
                {alternates.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                    Alternative predictions
                  </h4>
                  <div className="space-y-3">
                    {alternates.map((alt) => (
                      <div key={alt.name}>
                        <div className="flex justify-between text-xs font-semibold mb-1.5">
                          <span className="italic text-slate-300">{alt.name}</span>
                          <span className="text-slate-500 tabular-nums">{alt.pct.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bar-grow bg-slate-600 h-2 rounded-full"
                            style={{ width: `${alt.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                )}

                {/* Species profile from the Digital Library */}
                {isConfident && !matched && (
                  <p className="text-xs text-slate-500">
                    {catalog.loading ? 'Loading species profile…' : 'The species profile could not be loaded right now.'}
                  </p>
                )}

                {isConfident && matched && (
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5" />
                      Species profile
                    </h4>
                    <ReviewNotice species={matched} />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <Fact label="Blade length" value={matched.blade_length} />
                      <Fact label="Blade width" value={matched.blade_width} />
                      <Fact label="Venation" value={matched.venation} />
                      <Fact label="Leaf margin" value={matched.leaf_margin} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Fact label="Leaf morphology" value={matched.leaf_morphology} />
                      <Fact label="Rhizome structure" value={matched.rhizome_structure} />
                      <Fact label="Sheath characteristics" value={matched.sheath_characteristics} />
                      <Fact label="Reproductive organs" value={matched.reproductive_organs} />
                    </div>
                  </div>
                )}

                {isConfident && matched && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                      <h5 className="text-xs font-bold text-white flex items-center gap-2">
                        <Waves className="w-4 h-4 text-emerald-400" />
                        Ecological role
                      </h5>
                      <p className={`text-xs leading-relaxed ${matched.ecological_role ? 'text-slate-400' : 'italic text-slate-600'}`}>
                        {matched.ecological_role || 'To be added'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                      <h5 className="text-xs font-bold text-white flex items-center gap-2">
                        <Compass className="w-4 h-4 text-cyan-400" />
                        Distribution
                      </h5>
                      <p className={`text-xs leading-relaxed ${matched.geographic_distribution || matched.local_distribution_note ? 'text-slate-400' : 'italic text-slate-600'}`}>
                        {[matched.geographic_distribution, matched.local_distribution_note].filter(Boolean).join(' ') || 'To be added'}
                      </p>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pt-1">Verified survey stations</p>
                      {matchedStations.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {matchedStations.map((st) => (
                            <span key={st.id} className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-medium">
                              {st.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs italic text-slate-600">To be added</p>
                      )}
                    </div>
                  </div>
                )}

                {isConfident && matched && <ConservationGuide species={matched} />}

                {scanMs !== null && (
                  <p className="text-xs text-slate-500">
                    Analysed in <span className="tabular-nums">{(scanMs / 1000).toFixed(1)}</span> seconds
                    {scanResult?.method === 'server' ? ' by the SeaScan server (the photo was not stored).' : ' on this device.'}
                  </p>
                )}

                {!isRejected && (
                <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAddSighting}
                    className="cta flex-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-teal-900/30 flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-5 h-5" />
                    Record This Sighting
                  </button>
                  {isConfident && matched && (
                    <Link
                      to={`/library/${matched.slug}`}
                      className="sm:w-auto px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <BookOpen className="w-4 h-4" />
                      Full profile in the Digital Library
                    </Link>
                  )}
                </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-2xl h-full min-h-[380px] flex flex-col items-center justify-center p-8 text-center">
                <Leaf className="float-y w-12 h-12 text-slate-700 mb-4" />
                <h3 className="text-base font-bold text-slate-300">Awaiting sample input</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
                  Upload or take a photo on the left to identify the species and see its profile.
                </p>
              </div>
            )}
          </Reveal>
        </div>

        {/* MY RECORDED SIGHTINGS */}
        {user && (
          <Reveal className="mt-8">
            <section className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-teal-400" />
                    My Recorded Sightings
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sightings you submitted. They appear on the public map once a researcher approves them.
                  </p>
                </div>
                <span className="text-xs font-bold text-teal-300 bg-teal-500/10 border border-teal-500/25 px-3 py-1.5 rounded-lg tabular-nums">
                  {myRecords.length} saved
                </span>
              </div>

              {myRecords.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <MapPin className="w-8 h-8 text-slate-700 mx-auto" />
                  <p className="text-xs font-semibold text-slate-400">No sightings recorded yet</p>
                  <p className="text-xs text-slate-500">
                    Scan a sample above, then choose "Record This Sighting".
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-slate-500 uppercase text-[11px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 pr-4">Species</th>
                        <th className="py-2.5 pr-4">Location</th>
                        <th className="py-2.5 pr-4">Observed</th>
                        <th className="py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {myRecords.map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 pr-4 font-semibold italic text-slate-200">{speciesName(rec.species_id)}</td>
                          <td className="py-3 pr-4 font-mono text-slate-400">
                            {Number(rec.latitude).toFixed(4)}, {Number(rec.longitude).toFixed(4)}
                            {rec.location_source === 'demo' && <span className="ml-1.5 font-sans text-amber-300/80">(demo)</span>}
                          </td>
                          <td className="py-3 pr-4 text-slate-500">{rec.observed_on}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold capitalize ${STATUS_CHIP[rec.status]}`}>
                              {rec.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </Reveal>
        )}
      </main>

      {showCamera && (
        <CameraCapture
          onClose={() => setShowCamera(false)}
          onCapture={(file) => { setShowCamera(false); selectFiles([file]); }}
        />
      )}

      {/* SIGHTING RECORD DRAWER */}
      {showSightingDrawer && (
        <div
          className="backdrop-in fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end"
          onClick={(e) => { if (e.target === e.currentTarget) setShowSightingDrawer(false); }}
        >
          <div role="dialog" aria-modal="true" aria-label="Record seagrass sighting"
            className="drawer-in thin-scroll bg-slate-900 border-l border-slate-800 w-full max-w-md h-full p-6 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold">
                <MapPin className="w-5 h-5 text-teal-400" />
                Record Seagrass Sighting
              </div>
              <button
                type="button"
                onClick={() => setShowSightingDrawer(false)}
                aria-label="Close"
                className="text-slate-500 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <SightingForm
              initialSpeciesId={isConfident ? matched?.id : undefined}
              photoFile={imageFile}
              modelConfidence={isConfident ? Number(topMatch.pct.toFixed(2)) : undefined}
              onSaved={loadMyRecords}
            />
          </div>
        </div>
      )}
    </div>
  );
}
