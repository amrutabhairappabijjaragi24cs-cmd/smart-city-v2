const ICON = { critical:'🔴', high:'🟠', medium:'🟡', low:'🟢' };

export default function AlertFeed({ alerts }) {
  if (!alerts.length) return (
    <div className="flex flex-col items-center justify-center h-48 text-slate-600">
      <span className="text-2xl mb-2">✓</span>
      <p className="text-sm">All systems nominal</p>
    </div>
  );
  return (
    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
      {alerts.map((a, i) => (
        <div key={a._id || i} className="rounded-xl p-3 animate-slide-in"
          style={{ background:'rgba(0,0,0,0.3)',
            border:`1px solid ${a.severity==='critical'?'rgba(255,68,68,0.3)':a.severity==='high'?'rgba(255,140,0,0.3)':'rgba(26,58,92,0.5)'}` }}>
          <div className="flex items-start gap-2">
            <span className="text-sm mt-0.5 flex-shrink-0">{ICON[a.severity]||'⚪'}</span>
            <div className="min-w-0">
              <p className="text-xs text-slate-300 leading-snug line-clamp-2">{a.message}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`alert-pill ${a.severity}`}>{a.severity}</span>
                <span className="text-xs text-slate-600 font-mono">{new Date(a.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
