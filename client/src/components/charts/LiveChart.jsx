import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3 text-xs" style={{ background:'#0a1628', border:'1px solid #1a3a5c' }}>
      <p className="text-slate-400 mb-2 font-mono">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background:p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-semibold font-mono" style={{ color:p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function LiveChart({ data }) {
  if (!data.length) return (
    <div className="h-64 flex items-center justify-center">
      <div className="text-center">
        <div className="text-3xl mb-2 animate-pulse">◈</div>
        <p className="text-slate-500 text-sm">Waiting for data...</p>
      </div>
    </div>
  );
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top:5, right:5, left:-20, bottom:5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,58,92,0.5)" />
        <XAxis dataKey="time" stroke="#334155" tick={{ fill:'#475569', fontSize:10 }} interval="preserveStartEnd" />
        <YAxis stroke="#334155" tick={{ fill:'#475569', fontSize:10 }} />
        <Tooltip content={<Tip />} />
        <Legend wrapperStyle={{ fontSize:'11px' }} formatter={v => <span style={{ color:'#94a3b8' }}>{v}</span>} />
        <Line type="monotone" dataKey="temperature" name="Temp °C" stroke="#00d4ff" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="aqi"         name="AQI"     stroke="#ff8c00" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="noise"       name="Noise dB" stroke="#ffd700" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="traffic"     name="Traffic %" stroke="#00ff9f" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="mlScore"     name="ML Score" stroke="#c084fc" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
      </LineChart>
    </ResponsiveContainer>
  );
}
