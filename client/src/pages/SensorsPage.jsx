import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';

const LOCS = ['MG Road','Whitefield IT Zone','Koramangala','Hebbal Junction','Lalbagh Garden'];
const COORDS = {
  'MG Road':            { lat:12.9757, lng:77.6011 },
  'Whitefield IT Zone': { lat:12.9698, lng:77.7499 },
  'Koramangala':        { lat:12.9352, lng:77.6245 },
  'Hebbal Junction':    { lat:13.0350, lng:77.5970 },
  'Lalbagh Garden':     { lat:12.9507, lng:77.5848 },
};

const sc = s => s==='critical'?'#ff4444':s==='warning'?'#ffd700':'#00ff9f';

export default function SensorsPage() {
  const { sensorData: live } = useSocket();
  const [sensors, setSensors]     = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg]             = useState('');
  const [form, setForm] = useState({
    sensorId:'', location:'MG Road', temperature:'', humidity:'',
    airQualityIndex:'', noiseLevel:'', trafficDensity:'', powerConsumption:'',
  });

  useEffect(() => { fetchSensors(); }, []);
  useEffect(() => { if (live.length) setSensors(live); }, [live]);

  const fetchSensors = async () => {
    try {
      const { data } = await axios.get('/api/sensors/latest');
      if (data.success) setSensors(data.data);
    } catch { setSensors(live); }
    finally { setLoading(false); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setSubmitting(true); setMsg('');
    try {
      const coords = COORDS[form.location] || { lat:12.9716, lng:77.5946 };
      const { data } = await axios.post('/api/sensors', {
        ...form, coordinates: coords,
        temperature: +form.temperature, humidity: +form.humidity,
        airQualityIndex: +form.airQualityIndex, noiseLevel: +form.noiseLevel,
        trafficDensity: +form.trafficDensity, powerConsumption: +form.powerConsumption,
      });
      if (data.success) { setMsg('✓ Reading added'); setShowForm(false); fetchSensors(); }
    } catch (e) { setMsg(`⚠ ${e.response?.data?.message||'Failed'}`); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-white tracking-wide">SENSORS</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage IoT sensor network</p>
        </div>
        <button onClick={()=>setShowForm(!showForm)}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 text-cyan-400 transition-all"
          style={{ background:'rgba(0,212,255,0.08)', border:'1px solid rgba(0,212,255,0.3)' }}>
          {showForm ? '✕ Cancel' : '+ Add Reading'}
        </button>
      </div>

      {msg && (
        <div className="p-3 rounded-xl text-sm" style={{
          background: msg.startsWith('✓')?'rgba(0,255,159,0.1)':'rgba(255,68,68,0.1)',
          border:`1px solid ${msg.startsWith('✓')?'rgba(0,255,159,0.2)':'rgba(255,68,68,0.2)'}`,
          color: msg.startsWith('✓')?'#00ff9f':'#ff6b6b'
        }}>{msg}</div>
      )}

      {showForm && (
        <div className="border-glow rounded-2xl p-6 animate-fade-in" style={{ background:'rgba(10,22,40,0.9)' }}>
          <h2 className="text-xs font-semibold text-slate-300 mb-4 uppercase tracking-wider">⬕ Manual Sensor Entry</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[
              { k:'sensorId',         label:'Sensor ID',      placeholder:'SENSOR-006', type:'text' },
              { k:'temperature',      label:'Temperature °C', placeholder:'25',         type:'number' },
              { k:'humidity',         label:'Humidity %',     placeholder:'60',         type:'number' },
              { k:'airQualityIndex',  label:'AQI',            placeholder:'80',         type:'number' },
              { k:'noiseLevel',       label:'Noise dB',       placeholder:'55',         type:'number' },
              { k:'trafficDensity',   label:'Traffic %',      placeholder:'40',         type:'number' },
              { k:'powerConsumption', label:'Power kW',       placeholder:'120',        type:'number' },
            ].map(f => (
              <div key={f.k}>
                <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">{f.label}</label>
                <input type={f.type} value={form[f.k]} placeholder={f.placeholder}
                  onChange={e=>set(f.k, e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm text-slate-200 placeholder-slate-600"
                  style={{ background:'rgba(0,0,0,0.3)', border:'1px solid rgba(26,58,92,0.8)' }} />
              </div>
            ))}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Location</label>
              <select value={form.location} onChange={e=>set('location',e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm text-slate-200"
                style={{ background:'rgba(10,22,40,0.95)', border:'1px solid rgba(26,58,92,0.8)' }}>
                {LOCS.map(l=><option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <button onClick={submit} disabled={submitting}
            className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
            style={{ background:'linear-gradient(135deg,#00d4ff,#0099cc)', color:'#050a14' }}>
            {submitting ? '⟳ Submitting...' : '→ Submit Reading'}
          </button>
        </div>
      )}

      <div className="border-glow rounded-2xl overflow-hidden" style={{ background:'rgba(10,22,40,0.8)' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor:'rgba(26,58,92,0.6)' }}>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">⬡ Active Sensors ({sensors.length})</h2>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(5)].map((_,i)=><div key={i} className="skeleton h-12 rounded-xl"/>)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(26,58,92,0.4)' }}>
                  {['Sensor ID','Location','Temp °C','AQI','Noise','Traffic %','Power kW','ML Score','Status',''].map(h=>(
                    <th key={h} className="px-4 py-3 text-left text-xs text-slate-500 uppercase tracking-wider font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sensors.map((s,i)=>(
                  <tr key={s._id||s.sensorId||i} className="border-b hover:bg-white/5 transition-colors"
                    style={{ borderColor:'rgba(26,58,92,0.2)' }}>
                    <td className="px-4 py-3 font-mono text-xs text-cyan-400">{s.sensorId}</td>
                    <td className="px-4 py-3 text-slate-300">{s.location}</td>
                    <td className="px-4 py-3 font-mono" style={{ color:s.temperature>38?'#ff4444':'#00d4ff' }}>{s.temperature?.toFixed(1)}</td>
                    <td className="px-4 py-3 font-mono" style={{ color:s.airQualityIndex>150?'#ff4444':s.airQualityIndex>100?'#ff8c00':'#00ff9f' }}>{s.airQualityIndex?.toFixed(0)}</td>
                    <td className="px-4 py-3 font-mono text-slate-300">{s.noiseLevel?.toFixed(0)}</td>
                    <td className="px-4 py-3 font-mono text-slate-300">{s.trafficDensity?.toFixed(0)}</td>
                    <td className="px-4 py-3 font-mono text-slate-300">{s.powerConsumption?.toFixed(0)}</td>
                    <td className="px-4 py-3 font-mono text-purple-400">{s.mlScore?.toFixed(3)||'—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full font-semibold uppercase"
                        style={{ color:sc(s.status), background:`${sc(s.status)}22`, border:`1px solid ${sc(s.status)}44` }}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {s._id && !String(s._id).startsWith('mem') && (
                        <button onClick={async()=>{ try{await axios.delete(`/api/sensors/${s._id}`);setSensors(p=>p.filter(x=>x._id!==s._id))}catch{} }}
                          className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all">✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
