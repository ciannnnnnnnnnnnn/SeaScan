// src/components/StationMiniMap.jsx
// Small read-only map of one or more points (species profile stations, the
// sighting details pop-up).
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const MATI_BOUNDS = [[6.72, 126.08], [7.08, 126.4]];
const CYAN = { color: '#0e7490', fillColor: '#22d3ee', fillOpacity: 0.8, weight: 2 };

// Leaflet measures its box once; inside an opening pop-up that can be too
// early, so measure again after the open animation.
function Remeasure() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 350);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export default function StationMiniMap({ stations, height = 240, singleZoom = 13, pathOptions = CYAN }) {
  const pinned = stations.filter((s) => s.latitude !== null && s.longitude !== null);
  if (!pinned.length) return null;

  return (
    <div className="rounded-xl overflow-hidden border border-slate-800 relative isolate z-0" style={{ height }}>
      <MapContainer
        bounds={pinned.length > 1 ? pinned.map((s) => [s.latitude, s.longitude]) : undefined}
        center={pinned.length === 1 ? [pinned[0].latitude, pinned[0].longitude] : undefined}
        zoom={pinned.length === 1 ? singleZoom : undefined}
        maxBounds={MATI_BOUNDS}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, Tiles by <a href="https://www.hotosm.org/">HOT</a>'
          url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          subdomains="abc"
        />
        <Remeasure />
        {pinned.map((s) => (
          <CircleMarker key={s.id} center={[s.latitude, s.longitude]} radius={8} pathOptions={pathOptions}>
            <Tooltip>{s.name}</Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
