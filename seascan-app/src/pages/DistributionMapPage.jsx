import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, LayerGroup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet default marker icons in React/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Gold Icon for Community Sightings
const userSightingIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const DistributionMapPage = () => {
  // Center map on Pujada Bay / Mati City (~6.90, 126.22)
  const mapCenter = [6.8833, 126.2333];
  const [stations, setStations] = useState([]);
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data from Flask backend
    Promise.all([
      fetch('http://127.0.0.1:5000/api/map/verified-stations').then(res => res.json()),
      fetch('http://127.0.0.1:5000/api/map/user-sightings').then(res => res.json())
    ])
      .then(([stationsData, sightingsData]) => {
        setStations(Array.isArray(stationsData) ? stationsData : []);
        setSightings(Array.isArray(sightingsData) ? sightingsData : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching map data:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ padding: "20px" }}>Loading SeaScan GIS Map...</div>;
  }

  return (
    <div style={{ height: "calc(100vh - 60px)", width: "100%" }}>
      <MapContainer center={mapCenter} zoom={12} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LayersControl position="topright">
          {/* Layer 1: Peer-reviewed historical stations */}
          <LayersControl.Overlay checked name="Baseline Survey Stations">
            <LayerGroup>
              {stations.map(station => (
                <Marker key={`station-${station.id}`} position={[station.latitude, station.longitude]}>
                  <Popup>
                    <div>
                      <h4 style={{ margin: "0 0 5px 0" }}>{station.station_name}</h4>
                      <p style={{ margin: "2px 0" }}><strong>Source:</strong> {station.source}</p>
                      <p style={{ margin: "2px 0" }}><strong>Survey Year:</strong> {station.survey_year}</p>
                      <p style={{ margin: "2px 0" }}>
                        <strong>Recorded Species:</strong> {station.species_present ? station.species_present.join(', ') : 'N/A'}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </LayerGroup>
          </LayersControl.Overlay>

          {/* Layer 2: Community Manual Submissions */}
          <LayersControl.Overlay checked name="Community Sightings">
            <LayerGroup>
              {sightings.map(sighting => (
                <Marker 
                  key={`sighting-${sighting.id}`} 
                  position={[sighting.latitude, sighting.longitude]} 
                  icon={userSightingIcon}
                >
                  <Popup>
                    <div>
                      <h4 style={{ margin: "0 0 5px 0" }}>User Sightings Submission</h4>
                      <p style={{ margin: "2px 0" }}><strong>Status:</strong> {sighting.status}</p>
                      {sighting.image_url && (
                        <img src={sighting.image_url} alt="Sighting" style={{ width: "100%", marginTop: "5px", borderRadius: "4px" }} />
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </LayerGroup>
          </LayersControl.Overlay>
        </LayersControl>
      </MapContainer>
    </div>
  );
};

export default DistributionMapPage;