const sc = s => s === 'critical' ? { border:'rgba(255,68,68,.4)', glow:'rgba(255,68,68,.08)', dot:'red', text:'#ff4444' }
                : s === 'warning' ? { border:'rgba(255,215,0,.35)', glow:'rgba(255,215,0,.05)', dot:'yellow', text:'#ffd700' }
                : { border:'rgba(0,255,159,.2)', glow:'rgba(0,255,159,.03)', dot:'green', text:'#00ff9f' };

const aqiLabel = v => v < 50 ? ['Good','#00ff9f'] : v < 100 ? ['Moderate','#ffd700'] : v < 200 ? ['Unhealthy','#ff8c00'] : ['Hazardous','#ff4444'];

const Row = ({ icon, label, value, unit, color }) => (
  <div className="flex items-center justify-between py-1.5">
    <div className="flex items-center gap-2">
      <span className="text-sm">{icon}</span>
      <span className="text-xs text-slate-400">{label}</span>
    </div>
    <span className="text-sm font-semibold font-mono" style={{ color }}>
      {typeof value === 'number' ? value.toFixed(1) : value} <span className="text-xs text-slate-500">{unit}</span>
    </span>
  </div>
);

export default function SensorCard({ sensor }) {
  const s = sc(sensor.status);
  const [aqiText, aqiColor] = aqiLabel(sensor.airQualityIndex);
  return (
    <div className="rounded-2xl p-5 animate-fade-in transition-all"
      style={{ background:'rgba(10,22,40,0.9)', border:`1px solid ${s.border}`, boxShadow:`0 0 20px ${s.glow}` }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className={`status-dot ${s.dot}`} />
            <span className="text-xs font-mono font-bold text-slate-300">{sensor.sensorId}</span>
          </div>
          <p className="text-sm font-semibold text-white">{sensor.location}</p>
          {sensor.coordinates && (
            <p className="text-xs text-slate-600 font-mono">{sensor.coordinates.lat?.toFixed(4)}, {sensor.coordinates.lng?.toFixed(4)}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs px-2 py-1 rounded-lg font-semibold uppercase"
            style={{ background:`${s.glow}`, color:s.text, border:`1px solid ${s.border}` }}>
            {sensor.status}
          </span>
          {sensor.mlScore > 0 && (
            <span className="text-xs font-mono text-slate-500">ML: {sensor.mlScore.toFixed(3)}</span>
          )}
        </div>
      </div>

      <div className="text-center py-3 mb-4 rounded-xl" style={{ background:'rgba(0,0,0,0.3)' }}>
        <p className="metric-value text-4xl font-bold" style={{ color: sensor.temperature > 38 ? '#ff4444' : '#00d4ff' }}>
          {sensor.temperature?.toFixed(1)}°
        </p>
        <p className="text-xs text-slate-400 mt-0.5">Temperature (°C)</p>
      </div>

      <div className="space-y-0.5 divide-y" style={{ borderColor:'rgba(26,58,92,0.4)' }}>
        <Row icon="💨" label="Air Quality" value={`${sensor.airQualityIndex?.toFixed(0)} · ${aqiText}`} unit="AQI" color={aqiColor} />
        <Row icon="🔊" label="Noise"       value={sensor.noiseLevel}    unit="dB"  color={sensor.noiseLevel > 85 ? '#ff4444' : sensor.noiseLevel > 70 ? '#ffd700' : '#00ff9f'} />
        <Row icon="🚦" label="Traffic"     value={sensor.trafficDensity} unit="%"  color={sensor.trafficDensity > 80 ? '#ff4444' : sensor.trafficDensity > 60 ? '#ffd700' : '#00ff9f'} />
        <Row icon="⚡" label="Power"       value={sensor.powerConsumption} unit="kW" color="#00d4ff" />
        <Row icon="💧" label="Humidity"    value={sensor.humidity}      unit="%"   color="#7c9fff" />
      </div>

      {sensor.anomalies?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {sensor.anomalies.map((a, i) => <span key={i} className={`alert-pill ${a.severity}`}>{a.type}</span>)}
        </div>
      )}
      <p className="text-xs text-slate-600 mt-3 font-mono">{new Date(sensor.timestamp).toLocaleTimeString()}</p>
    </div>
  );
}
