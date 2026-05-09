import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';

const statusColor = (s) => s === 'critical' ? '#ff4444' : s === 'warning' ? '#ffd700' : '#00ff9f';

export default function MapPage() {
  const { sensorData: liveSensors } = useSocket();
  const [sensors, setSensors] = useState([]);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  useEffect(() => { fetchMap(); }, []);
  useEffect(() => { if (liveSensors.length) setSensors(liveSensors); }, [liveSensors]);

  const fetchMap = async () => {
    try {
      const { data } = await axios.get('/api/sensors/map');
      if (data.success && data.data.length) setSensors(data.data);
    } catch {}
  };

  // Init Leaflet imperatively (avoids react-leaflet SSR/bundler issues)
  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;
    if (typeof window === 'undefined') return;

    // Dynamically import leaflet
    import('leaflet').then((L) => {
      // Fix default icon path broken by vite
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current, {
        center: [12.9716, 77.5946],
        zoom: 12,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://carto.com">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = { map, L };
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update circle markers when sensors change
  useEffect(() => {
    if (!mapInstanceRef.current || !sensors.length) return;
    const { map, L } = mapInstanceRef.current;

    sensors.forEach((sensor) => {
      if (!sensor.coordinates?.lat || !sensor.coordinates?.lng) return;
      const color  = statusColor(sensor.status);
      const radius = sensor.status === 'critical' ? 22 : sensor.status === 'warning' ? 17 : 13;

      const popupHTML = `
        <div style="min-width:200px;font-family:'Exo 2',sans-serif">
          <p style="color:#00d4ff;font-family:monospace;font-size:11px;margin:0 0 4px">${sensor.sensorId}</p>
          <p style="color:#fff;font-weight:600;font-size:14px;margin:0 0 10px">${sensor.location}</p>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
            <span style="color:#94a3b8">Temperature</span>
            <span style="color:#00d4ff;font-family:monospace">${sensor.temperature?.toFixed(1)}°C</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
            <span style="color:#94a3b8">AQI</span>
            <span style="color:#ff8c00;font-family:monospace">${sensor.airQualityIndex?.toFixed(0)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
            <span style="color:#94a3b8">Traffic</span>
            <span style="color:#ffd700;font-family:monospace">${sensor.trafficDensity?.toFixed(0)}%</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px">
            <span style="color:#94a3b8">Noise</span>
            <span style="color:#e2e8f0;font-family:monospace">${sensor.noiseLevel?.toFixed(0)} dB</span>
          </div>
          ${sensor.mlScore > 0 ? `<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px">
            <span style="color:#94a3b8">ML Score</span>
            <span style="color:#c084fc;font-family:monospace">${sensor.mlScore?.toFixed(3)}</span>
          </div>` : ''}
          <div style="border-top:1px solid #1a3a5c;padding-top:8px">
            <span style="background:${color}22;color:${color};border:1px solid ${color}44;
              padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase">
              ${sensor.status}
            </span>
          </div>
        </div>`;

      if (markersRef.current[sensor.sensorId]) {
        // Update existing marker
        const marker = markersRef.current[sensor.sensorId];
        marker.setStyle({ color, fillColor: color });
        marker.setRadius(radius);
        marker.setPopupContent(popupHTML);
      } else {
        // Create new marker
        const circle = L.circleMarker(
          [sensor.coordinates.lat, sensor.coordinates.lng],
          { color, fillColor: color, fillOpacity: 0.35, weight: 2, radius }
        ).bindPopup(popupHTML).addTo(map);
        markersRef.current[sensor.sensorId] = circle;
      }
    });
  }, [sensors]);

  return (
    <div className="p-6 space-y-4 animate-fade-in" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        <div>
          <h1 className="font-display text-2xl font-black text-white tracking-wide">CITY MAP</h1>
          <p className="text-slate-400 text-sm mt-0.5">Live sensor locations — Bengaluru, Karnataka</p>
        </div>
        <div className="flex gap-4 text-xs">
          {[['Normal', '#00ff9f'], ['Warning', '#ffd700'], ['Critical', '#ff4444']].map(([l, c]) => (
            <div key={l} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: c, boxShadow: `0 0 6px ${c}` }} />
              <span className="text-slate-400">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="border-glow rounded-2xl overflow-hidden flex-1"
        style={{ background: 'rgba(10,22,40,0.8)', minHeight: '400px' }}>
        <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
      </div>

      {/* Sensor cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 flex-shrink-0">
        {sensors.map((s) => (
          <div key={s.sensorId} className="border-glow rounded-xl p-3"
            style={{ background: 'rgba(10,22,40,0.8)', borderColor: `${statusColor(s.status)}44` }}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`status-dot ${s.status === 'critical' ? 'red' : s.status === 'warning' ? 'yellow' : 'green'}`} />
              <span className="text-xs font-mono text-slate-400 truncate">{s.sensorId}</span>
            </div>
            <p className="text-xs font-semibold text-white truncate">{s.location}</p>
            <p className="metric-value text-lg font-bold mt-1" style={{ color: statusColor(s.status) }}>
              {s.temperature?.toFixed(1)}°C
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
