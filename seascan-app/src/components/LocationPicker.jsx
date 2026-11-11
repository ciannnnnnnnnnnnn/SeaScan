// src/components/LocationPicker.jsx
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Same lock as the Distribution Map: a sighting can only be placed inside
// Mati City waters.
const MATI_BOUNDS = [[6.72, 126.08], [7.08, 126.40]];
const MATI_CENTER = [6.87, 126.26];

const pinIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
});

// Fallback so the default marker still resolves if this module loads first.
L.Marker.prototype.options.icon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
});

function ClickToPlace({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6));
    },
  });
  return null;
}

// Leaflet measures its box once. Inside a drawer that is still sliding in the
// box is 0 px wide, so tiles never load: re-measure once the animation ends.
// Also bring the pin into view when it is set from GPS or the demo button.
function KeepInView({ lat, lng, hasPin }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 350);
    return () => clearTimeout(timer);
  }, [map]);
  useEffect(() => {
    if (hasPin) map.setView([Number(lat), Number(lng)], Math.max(map.getZoom(), 13), { animate: true });
  }, [map, lat, lng, hasPin]);
  return null;
}

export default function LocationPicker({ lat, lng, onPick }) {
  const hasPin = lat !== '' && lng !== '' && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));

  return (
    <div className="rounded-xl overflow-hidden border border-slate-800 relative isolate z-0" style={{ height: 260 }}>
      <MapContainer
        center={hasPin ? [Number(lat), Number(lng)] : MATI_CENTER}
        zoom={hasPin ? 14 : 12}
        minZoom={11}
        maxZoom={18}
        maxBounds={MATI_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, Tiles by <a href="https://www.hotosm.org/">HOT</a>'
          url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          subdomains="abc"
          bounds={MATI_BOUNDS}
          noWrap
        />
        <ClickToPlace onPick={onPick} />
        <KeepInView lat={lat} lng={lng} hasPin={hasPin} />
        {hasPin && <Marker position={[Number(lat), Number(lng)]} icon={pinIcon} />}
      </MapContainer>

      {!hasPin && (
        <div className="absolute inset-x-0 bottom-0 z-[500] bg-slate-950/85 px-3 py-2 text-xs text-slate-300 text-center pointer-events-none">
          Tap the map to drop a pin where you found the seagrass
        </div>
      )}
    </div>
  );
}
