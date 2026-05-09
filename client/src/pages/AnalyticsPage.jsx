import { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid,
         PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid,
         Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3 text-xs" style={{ background:'#0a1628', border:'1px solid #1a3a5c' }}>
      <p className="text-slate-400 mb-1 font-mono">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background:p.color }} />
          <span style={{ color:p.color }}>{p.name}: {typeof p.value==='number'?p.value.toFixed(1):p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [summary, setSummary]       = useState(null);
  const [byLocation, setByLocation] = useState([]);
  const [trend, setTrend]           = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => { fetchAll(); const iv = setInterval(fetchAll, 30000); return () => clearInterval(iv); }, []);

  const fetchAll = async () => {
    try {
      const [s, l, t] = await Promise.all([
        axios.get('/api/analytics/summary'),
        axios.get('/api/analytics/by-location'),
        axios.get('/api/analytics/trend?hours=6'),
      ]);
      if (s.data.success) setSummary(s.data.data);
      if (l.data.success) setByLocation(l.data.data);
      if (t.data.success) setTrend(t.data.data.map(d => ({
        time: new Date(d.timestamp).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }),
        temp: +d.avgTemp?.toFixed(1), aqi: +d.avgAQI?.toFixed(0),
        traffic: +d.avgTraffic?.toFixed(0), noise: +d.avgNoise?.toFixed(0),
        ml: +d.avgMlScore?.toFixed(3),
      })));
    } catch {}
    finally { setLoading(false); }
  };

  const radarData = summary ? [
    { metric:'Temperature', value: Math.min(100,(+summary.averages.temperature/50)*100) },
    { metric:'AQI',         value: Math.min(100,(+summary.averages.airQualityIndex/300)*100) },
    { metric:'Noise',       value: Math.min(100,(+summary.averages.noiseLevel/100)*100) },
    { metric:'Traffic',     value: +summary.averages.trafficDensity },
    { metric:'Power',       value: Math.min(100,(+summary.averages.powerConsumption/200)*100) },
  ] : [];

  if (loading) return (
    <div className="p-6 space-y-4">
      <div className="skeleton h-8 w-48 rounded-xl" />
      <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_,i)=><div key={i} className="skeleton h-28 rounded-2xl"/>)}</div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-black text-white tracking-wide">ANALYTICS</h1>
        <p className="text-slate-400 text-sm mt-0.5">24-hour city performance intelligence</p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label:'Total Readings',    value: summary.totalReadings,                 color:'#00d4ff', icon:'⬕' },
            { label:'Avg Temperature',   value: `${summary.averages.temperature}°C`,   color:'#ff8c00', icon:'🌡' },
            { label:'Avg AQI',           value: summary.averages.airQualityIndex,      color:'#00ff9f', icon:'💨' },
            { label:'ML Avg Score',      value: summary.averages.mlScore ?? '—',       color:'#c084fc', icon:'🤖' },
          ].map(k => (
            <div key={k.label} className="border-glow rounded-2xl p-5" style={{ background:'rgba(10,22,40,0.8)' }}>
              <span className="text-xl">{k.icon}</span>
              <p className="metric-value text-2xl font-bold mt-2" style={{ color:k.color }}>{k.value}</p>
              <p className="text-xs text-slate-400 mt-1">{k.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Area trend */}
        <div className="border-glow rounded-2xl p-5" style={{ background:'rgba(10,22,40,0.8)' }}>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">◈ 6-Hour Trend</h2>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trend} margin={{ top:5,right:5,left:-20,bottom:5 }}>
                <defs>
                  {[['temp','#00d4ff'],['aqi','#ff8c00'],['ml','#c084fc']].map(([k,c])=>(
                    <linearGradient key={k} id={`g_${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c} stopOpacity={0.25}/>
                      <stop offset="95%" stopColor={c} stopOpacity={0}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,58,92,0.5)" />
                <XAxis dataKey="time" stroke="#334155" tick={{ fill:'#475569',fontSize:10 }} />
                <YAxis stroke="#334155" tick={{ fill:'#475569',fontSize:10 }} />
                <Tooltip content={<Tip />} />
                <Legend wrapperStyle={{ fontSize:'11px' }} />
                <Area type="monotone" dataKey="temp"    name="Temp °C" stroke="#00d4ff" fill="url(#g_temp)" strokeWidth={2}/>
                <Area type="monotone" dataKey="aqi"     name="AQI"     stroke="#ff8c00" fill="url(#g_aqi)"  strokeWidth={2}/>
                <Area type="monotone" dataKey="ml"      name="ML Score" stroke="#c084fc" fill="url(#g_ml)"  strokeWidth={1.5} strokeDasharray="4 2"/>
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 text-sm text-center py-20">Accumulating data...</p>}
        </div>

        {/* Radar */}
        <div className="border-glow rounded-2xl p-5" style={{ background:'rgba(10,22,40,0.8)' }}>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">◉ City Health Radar</h2>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(26,58,92,0.6)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill:'#94a3b8',fontSize:11 }} />
                <PolarRadiusAxis angle={30} domain={[0,100]} tick={{ fill:'#475569',fontSize:9 }} />
                <Radar name="City Score" dataKey="value" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.15} strokeWidth={2}/>
                <Legend wrapperStyle={{ fontSize:'11px' }} />
              </RadarChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 text-sm text-center py-20">Loading...</p>}
        </div>
      </div>

      {/* By location */}
      {byLocation.length > 0 && (
        <div className="border-glow rounded-2xl p-5" style={{ background:'rgba(10,22,40,0.8)' }}>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">⬡ Performance by Location</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byLocation} margin={{ top:5,right:5,left:-20,bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,58,92,0.5)" />
              <XAxis dataKey="_id" stroke="#334155" tick={{ fill:'#475569',fontSize:10 }} />
              <YAxis stroke="#334155" tick={{ fill:'#475569',fontSize:10 }} />
              <Tooltip content={<Tip />} />
              <Legend wrapperStyle={{ fontSize:'11px' }} />
              <Bar dataKey="avgTemp"    name="Avg Temp"    fill="#00d4ff" radius={[4,4,0,0]} fillOpacity={0.8}/>
              <Bar dataKey="avgAQI"     name="Avg AQI"     fill="#ff8c00" radius={[4,4,0,0]} fillOpacity={0.8}/>
              <Bar dataKey="avgTraffic" name="Avg Traffic%" fill="#00ff9f" radius={[4,4,0,0]} fillOpacity={0.8}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
