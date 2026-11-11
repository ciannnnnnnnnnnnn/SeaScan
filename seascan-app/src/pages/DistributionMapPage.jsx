// src/pages/DistributionMapPage.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Rectangle, LayersControl, LayerGroup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Crosshair, Layers, AlertTriangle, Loader2, Filter, ListOrdered, Plus, X } from 'lucide-react';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../hooks/useCatalog';
import { fetchMySightings, fetchPublicSightings } from '../lib/api';
import SightingForm from '../components/SightingForm';

const coloredIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const communityIcon = coloredIcon('gold');
const ownPendingIcon = coloredIcon('grey');

// Geographic lock: the map can never be panned or zoomed outside Mati City,
// Davao Oriental. [south, west] to [north, east].
const MATI_BOUNDS = [[6.72, 126.08], [7.08, 126.40]];
const MATI_CENTER = [6.87, 126.26];
const DEFAULT_ZOOM = 12;

// Station marker size grows with species richness (number of species recorded).
const richnessRadius = (n) => 7 + Math.min(n, 9) * 1.6;

export default function DistributionMapPage() {
  const { user, openAuthModal } = useAuth();
  const { species, stations, loading: catalogLoading, error: catalogError, speciesById } = useCatalog();
  const [publicSightings, setPublicSightings] = useState([]);
  const [mySightings, setMySightings] = useState([]);
  const [sightingsError, setSightingsError] = useState(null);
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [map, setMap] = useState(null);
  const [showSightingDrawer, setShowSightingDrawer] = useState(false);

  useEffect(() => {
    fetchPublicSightings()
      .then(setPublicSightings)
      .catch((err) => setSightingsError(err.message));
  }, []);

  // The user's own pending sightings, shown as grey pins only to them.
  const loadMySightings = useCallback(() => {
    if (!user) { setMySightings([]); return; }
    fetchMySightings(user.id)
      .then((rows) => setMySightings(rows.filter((s) => s.status === 'pending')))
      .catch(() => setMySightings([]));
  }, [user]);

  useEffect(() => { loadMySightings(); }, [loadMySightings]);

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

  const filterId = speciesFilter === 'all' ? null : Number(speciesFilter);

  const stationRows = useMemo(() => stations.map((st) => {
    const ids = [...new Set((st.station_species || []).map((l) => l.species_id))];
    return { ...st, speciesIds: ids, richness: ids.length };
  }), [stations]);

  const visibleStations = stationRows.filter((st) => !filterId || st.speciesIds.includes(filterId));
  const pinnedStations = visibleStations.filter((st) => st.latitude !== null);
  const unpinnedStations = visibleStations.filter((st) => st.latitude === null);
  const visibleSightings = publicSightings.filter((s) => !filterId || s.species_id === filterId);
  const visibleMine = mySightings.filter((s) => !filterId || s.species_id === filterId);

  const resetView = () => {
    if (map) map.flyToBounds(MATI_BOUNDS, { duration: 0.6 });
  };

  const sourcesFor = (st, speciesId) =>
    (st.station_species || []).filter((l) => l.species_id === speciesId).map((l) => l.source).join('; ');

  return (
    <div className="bg-slate-950 text-slate-100 font-sans antialiased flex flex-col">
      {/* PAGE HEADER STRIP */}
      <div className="border-b border-slate-800 bg-slate-900 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <MapPin className="w-5 h-5 text-teal-400" />
              Mati City Seagrass Distribution Map
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified survey stations from published studies, and community sightings reviewed by researchers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800">
              <Filter className="w-3.5 h-3.5 text-teal-400" />
              <span className="sr-only">Filter by species</span>
              <select value={speciesFilter} onChange={(e) => setSpeciesFilter(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none italic">
                <option value="all" className="not-italic">All species</option>
                {species.map((sp) => <option key={sp.id} value={sp.id}>{sp.scientific_name}</option>)}
              </select>
            </label>
            <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500">Stations </span>
              <span className="font-bold text-cyan-300 tabular-nums">{visibleStations.length}</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500">Community sightings </span>
              <span className="font-bold text-amber-400 tabular-nums">{visibleSightings.length}</span>
            </div>
            <button
              onClick={resetView}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold flex items-center gap-2 transition-colors"
            >
              <Crosshair className="w-3.5 h-3.5" />
              Reset View
            </button>
            <button
              onClick={handleAddSighting}
              className="px-3 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold flex items-center gap-2 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Submit a sighting
            </button>
          </div>
        </div>
      </div>

      {/* STATUS BANNERS */}
      {(catalogError || sightingsError) && (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="reveal reveal-in p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Some map data could not be loaded ({catalogError || sightingsError}). Showing the base Mati City map.</span>
          </div>
        </div>
      )}

      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* MAP */}
        <div className="lg:col-span-3">
          {/* `isolate` traps Leaflet's internal z-indexes (panes 400, controls 1000)
              in this stacking context so they cannot paint over the sticky header. */}
          <div
            className="rounded-2xl overflow-hidden border border-slate-800 shadow-2xl shadow-slate-950/60 relative isolate z-0"
            style={{ height: 'calc(100vh - 16rem)', minHeight: '440px' }}
          >
            {catalogLoading && (
              <div className="absolute inset-0 z-[1000] bg-slate-950/80 flex items-center justify-center gap-2 text-sm text-slate-300">
                <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                Loading Mati City map data...
              </div>
            )}

            <MapContainer
              center={MATI_CENTER}
              zoom={DEFAULT_ZOOM}
              minZoom={11}
              maxZoom={19}
              maxBounds={MATI_BOUNDS}
              maxBoundsViscosity={1.0}
              ref={setMap}
              style={{ height: '100%', width: '100%' }}
            >
              {/* HOT style: barangays, roads, beaches and named bays without
                  the mountain-peak markers of the standard OSM style. */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/">HOT</a>'
                url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
                subdomains="abc"
                maxNativeZoom={19}
                bounds={MATI_BOUNDS}
                noWrap
              />

              <Rectangle bounds={MATI_BOUNDS} pathOptions={{ color: '#2dd4bf', weight: 2, dashArray: '6 6', fill: false }} />

              <LayersControl position="topright">
                <LayersControl.Overlay checked name="Verified survey stations">
                  <LayerGroup>
                    {pinnedStations.map((st) => (
                      <CircleMarker
                        key={`station-${st.id}`}
                        center={[st.latitude, st.longitude]}
                        radius={richnessRadius(st.richness)}
                        pathOptions={{ color: '#0e7490', fillColor: '#22d3ee', fillOpacity: 0.75, weight: 2 }}
                      >
                        <Tooltip>{st.name} · {st.richness} species</Tooltip>
                        <Popup>
                          <div style={{ minWidth: 200 }}>
                            <h4 style={{ margin: '0 0 4px 0' }}>{st.name}</h4>
                            <p style={{ margin: '2px 0', fontSize: 12 }}><strong>Verified survey station</strong></p>
                            <p style={{ margin: '2px 0', fontSize: 12 }}><strong>Source:</strong> {st.sources.join('; ') || '—'}</p>
                            <p style={{ margin: '6px 0 2px', fontSize: 12 }}><strong>Species richness:</strong> {st.richness}</p>
                            {st.speciesIds.length ? (
                              <ul style={{ margin: '2px 0 0 16px', padding: 0, fontSize: 12 }}>
                                {st.speciesIds.map((id) => (
                                  <li key={id}><em>{speciesById(id)?.scientific_name}</em> <span style={{ color: '#64748b' }}>({sourcesFor(st, id)})</span></li>
                                ))}
                              </ul>
                            ) : (
                              <p style={{ margin: '2px 0', fontSize: 12, fontStyle: 'italic' }}>Species list to be added</p>
                            )}
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}
                  </LayerGroup>
                </LayersControl.Overlay>

                <LayersControl.Overlay checked name="Community sightings (unverified)">
                  <LayerGroup>
                    {visibleSightings.map((s) => (
                      <Marker key={`sighting-${s.id}`} position={[s.latitude, s.longitude]} icon={communityIcon}>
                        <Popup>
                          <div>
                            <h4 style={{ margin: '0 0 4px 0' }}><em>{s.scientific_name}</em></h4>
                            <p style={{ margin: '2px 0', fontSize: 12, color: '#b45309' }}><strong>Community-submitted, unverified</strong></p>
                            <p style={{ margin: '2px 0', fontSize: 12 }}>Reviewed by a researcher; not a verified survey station.</p>
                            <p style={{ margin: '2px 0', fontSize: 12 }}><strong>Observed:</strong> {s.observed_on}</p>
                            {s.location_source === 'demo' && <p style={{ margin: '2px 0', fontSize: 12 }}>Demo location (user testing)</p>}
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                    {visibleMine.map((s) => (
                      <Marker key={`mine-${s.id}`} position={[s.latitude, s.longitude]} icon={ownPendingIcon}>
                        <Popup>
                          <div>
                            <h4 style={{ margin: '0 0 4px 0' }}><em>{speciesById(s.species_id)?.scientific_name}</em></h4>
                            <p style={{ margin: '2px 0', fontSize: 12 }}><strong>Your sighting - pending review</strong></p>
                            <p style={{ margin: '2px 0', fontSize: 12 }}>Only you can see this until a researcher approves it.</p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </LayerGroup>
                </LayersControl.Overlay>
              </LayersControl>
            </MapContainer>
          </div>

          {/* LEGEND */}
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Layers className="w-3.5 h-3.5 text-teal-400" /> Legend
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-cyan-400 border-2 border-cyan-700" /> Verified survey station (larger = more species)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Community-submitted, unverified
            </span>
            {user && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Your sighting, pending review
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0 border-t-2 border-dashed border-teal-400" /> Mati City coverage limit
            </span>
          </div>
        </div>

        {/* SPECIES RICHNESS PER STATION */}
        <aside className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4 h-fit">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-teal-400" />
            Species richness by station
          </h2>
          {visibleStations.length === 0 ? (
            <p className="text-xs text-slate-500">No stations match this filter.</p>
          ) : (
            <ul className="space-y-2">
              {[...visibleStations].sort((a, b) => b.richness - a.richness || a.name.localeCompare(b.name)).map((st) => (
                <li key={st.id} className="flex items-start justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <button
                      type="button"
                      disabled={st.latitude === null}
                      onClick={() => map?.flyTo([st.latitude, st.longitude], 14, { duration: 0.6 })}
                      className="font-semibold text-slate-200 hover:text-teal-300 disabled:hover:text-slate-200 disabled:cursor-default text-left"
                    >
                      {st.name}
                    </button>
                    <p className="text-slate-500 truncate" title={st.sources.join('; ')}>{st.sources.join('; ')}</p>
                    {st.latitude === null && <p className="text-slate-600 italic">Coordinates to be added</p>}
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 font-bold tabular-nums"
                    title="Number of species recorded">
                    {st.richness}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {unpinnedStations.length > 0 && (
            <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-800 pt-3">
              {unpinnedStations.length} station{unpinnedStations.length > 1 ? 's are' : ' is'} not on the map yet because
              {unpinnedStations.length > 1 ? ' their' : ' its'} coordinates still need to be entered from the source papers.
            </p>
          )}
          <Link to="/scanner" className="block text-center text-xs font-semibold text-teal-300 hover:text-teal-200 border-t border-slate-800 pt-3">
            Not sure of the species? Identify it with the Scanner first
          </Link>
        </aside>
      </div>

      {/* SIGHTING RECORD DRAWER */}
      {showSightingDrawer && (
        <div
          className="backdrop-in fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end"
          onClick={(e) => { if (e.target === e.currentTarget) setShowSightingDrawer(false); }}
        >
          <div role="dialog" aria-modal="true" aria-label="Submit seagrass sighting"
            className="drawer-in thin-scroll bg-slate-900 border-l border-slate-800 w-full max-w-md h-full p-6 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold">
                <MapPin className="w-5 h-5 text-teal-400" />
                Submit a Sighting
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
            <SightingForm onSaved={loadMySightings} />
          </div>
        </div>
      )}
    </div>
  );
}
