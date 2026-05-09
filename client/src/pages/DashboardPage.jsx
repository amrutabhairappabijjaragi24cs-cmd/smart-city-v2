import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth }   from '../context/AuthContext';
import api from '../utils/api';
import SensorCard from '../components/dashboard/SensorCard';
import LiveChart  from '../components/charts/LiveChart';
import AlertFeed  from '../components/dashboard/AlertFeed';

export default function DashboardPage() {
  const { sensorData, latestAlerts, connected } = useSocket();
  const { user } = useAuth();
  const [summary, setSummary]         = useState(null);
  const [chartHistory, setChartHistory] = useState([]);
  const [lastUpdate, setLastUpdate]   = useState(null);
  const [mlOnline, setMlOnline]       = useState(false);
  const [filter, setFilter]           = useState('all'); // all | my-zone | critical

  useEffect(() => {
    fetchSummary(); fetchMlStatus();
    const iv = setInterval(fetchSummary, 30000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!sensorData.length) return;
    setLastUpdate(new Date());
    const avg = k => sensorData.reduce((s,d)=>s+(d[k]||0),0)/sensorData.length;
    setChartHistory(p => [...p, {
      time:        new Date().toLocaleTimeString(),
      temperature: +avg('temperature').toFixed(1),
      aqi:         +avg('airQualityIndex').toFixed(0),
      noise:       +avg('noiseLevel').toFixed(0),
      traffic:     +avg('trafficDensity').toFixed(0),
      mlScore:     +avg('mlScore').toFixed(3),
    }].slice(-20));
  }, [sensorData]);

  const fetchSummary  = async () => { try { const {data} = await api.get('/api/analytics/summary'); if(data.success) setSummary(data.data); } catch {} };
  const fetchMlStatus = async () => { try { const {data} = await api.get('/api/anomaly/ml-status'); setMlOnline(data.online); } catch {} };

  // Filter sensors
  const filtered = sensorData.filter(s => {
    if (filter === 'my-zone') return s.zone === user?.zone;
    if (filter === 'critical') return s.status === 'critical' || s.status === 'warning';
    return true;
  });

  const avg = k => sensorData.length ? (sensorData.reduce((s,d)=>s+(d[k]||0),0)/sensorData.length).toFixed(1) : '--';
  const criticals = sensorData.filter(d=>d.status==='critical').length;
  const warnings  = sensorData.filter(d=>d.status==='warning').length;
  const st = criticals>0 ? {label:'CRITICAL',color:'#ff4444',dot:'red'}
           : warnings>0  ? {label:'WARNING', color:'#ffd700',dot:'yellow'}
           :               {label:'NOMINAL', color:'#00ff9f',dot:'green'};

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-white tracking-wide">CITY MONITOR</h1>
          <p className="text-slate-400 text-sm">Welcome, <span className="text-cyan-400">{user?.name}</span> · {sensorData.length} sensors live across Bengaluru</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
            style={{background:'rgba(10,22,40,0.8)',border:'1px solid rgba(26,58,92,0.6)'}}>
            <div className={`status-dot ${mlOnline?'green':'yellow'}`}/>
            <span className="text-slate-400">ML: {mlOnline?'Online':'Offline'}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{background:'rgba(10,22,40,0.8)',border:'1px solid rgba(26,58,92,0.6)'}}>
            <div className={`status-dot ${st.dot}`}/>
            <span className="text-xs font-semibold font-mono" style={{color:st.color}}>{st.label}</span>
          </div>
          {lastUpdate && <span className="text-xs text-slate-500 font-mono">{lastUpdate.toLocaleTimeString()}</span>}
        </div>
      </div>

      {/* Zone alert banner for user */}
      {user?.role==='user' && !user?.phone && (
        <div className="flex items-center gap-3 p-4 rounded-2xl"
          style={{background:'rgba(255,215,0,0.08)',border:'1px solid rgba(255,215,0,0.25)'}}>
          <span className="text-xl">⚠️</span>
          <div className="flex-1">
            <p className="text-yellow-400 text-sm font-semibold">You won't receive danger alerts!</p>
            <p className="text-slate-400 text-xs">Add your phone number in <a href="/profile" className="text-cyan-400 underline">My Profile</a> to get SMS & WhatsApp alerts when your zone is in danger.</p>
          </div>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Total Sensors',   value:sensorData.length||50, icon:'⬕', color:'#00d4ff' },
          { label:'Alerts (24h)',    value:summary?.alertCount??latestAlerts.length, icon:'◉', color:'#ff8c00' },
          { label:'Critical Events', value:criticals, icon:'⚠', color:'#ff4444' },
          { label:'Avg AQI',         value:avg('airQualityIndex'), icon:'💨', color:'#00ff9f' },
        ].map(k=>(
          <div key={k.label} className="border-glow rounded-2xl p-5" style={{background:'rgba(10,22,40,0.8)'}}>
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{k.icon}</span>
              <div className="w-2 h-2 rounded-full" style={{background:k.color,boxShadow:`0 0 8px ${k.color}`}}/>
            </div>
            <p className="metric-value text-2xl font-bold" style={{color:k.color}}>{k.value}</p>
            <p className="text-xs text-slate-400 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-slate-500 uppercase tracking-wider">Filter:</span>
        {[
          {k:'all',     label:`All Bengaluru (${sensorData.length})`},
          {k:'my-zone', label:`My Zone: ${user?.zone||'Not Set'}`},
          {k:'critical',label:`Critical/Warning (${criticals+warnings})`},
        ].map(f=>(
          <button key={f.k} onClick={()=>setFilter(f.k)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: filter===f.k ? 'rgba(0,212,255,0.15)' : 'rgba(10,22,40,0.8)',
              border: `1px solid ${filter===f.k?'rgba(0,212,255,0.4)':'rgba(26,58,92,0.6)'}`,
              color: filter===f.k ? '#00d4ff' : '#94a3b8',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Sensor Cards */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
          ⬡ Live Sensor Readings — {filtered.length} sensors shown
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.length > 0
            ? filtered.map(s=><SensorCard key={s.sensorId} sensor={s}/>)
            : [...Array(6)].map((_,i)=><div key={i} className="skeleton h-56 rounded-2xl"/>)
          }
        </div>
      </div>

      {/* Chart + Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 border-glow rounded-2xl p-5" style={{background:'rgba(10,22,40,0.8)'}}>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">◈ Live Trend</h2>
          <LiveChart data={chartHistory}/>
        </div>
        <div className="border-glow rounded-2xl p-5" style={{background:'rgba(10,22,40,0.8)'}}>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">◉ Alert Feed</h2>
          <AlertFeed alerts={latestAlerts}/>
        </div>
      </div>
    </div>
  );
}
