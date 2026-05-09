import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const ICON = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' };
const TYPE = { temperature: '🌡', pollution: '💨', traffic: '🚦', noise: '🔊', power: '⚡', system: '⚙', ml: '🤖' };

export default function AlertsPage() {
  const { latestAlerts }              = useSocket();
  const { user }                      = useAuth();
  const [alerts, setAlerts]           = useState([]);
  const [filter, setFilter]           = useState({ severity: '', acknowledged: '' });
  const [loading, setLoading]         = useState(true);

  useEffect(() => { fetchAlerts(); }, [filter]);

  // Merge live socket alerts
  useEffect(() => {
    if (!latestAlerts.length) return;
    setAlerts(prev => {
      const ids = new Set(prev.map(a => a._id));
      const fresh = latestAlerts.filter(a => !ids.has(a._id));
      return [...fresh, ...prev].slice(0, 100);
    });
  }, [latestAlerts]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (filter.severity)     params.severity     = filter.severity;
      if (filter.acknowledged) params.acknowledged = filter.acknowledged;
      const { data } = await api.get('/api/alerts', { params });
      if (data.success) setAlerts(data.data);
    } catch {
      setAlerts(latestAlerts);
    } finally {
      setLoading(false);
    }
  };

  const acknowledge = async (id) => {
    try { await api.patch(`/api/alerts/${id}/acknowledge`); } catch {}
    setAlerts(prev => prev.map(a => a._id === id ? { ...a, acknowledged: true } : a));
  };

  const remove = async (id) => {
    try { await api.delete(`/api/alerts/${id}`); } catch {}
    setAlerts(prev => prev.filter(a => a._id !== id));
  };

  const counts = {
    total:    alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    unread:   alerts.filter(a => !a.acknowledged).length,
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-white tracking-wide">ALERTS</h1>
          <p className="text-slate-400 text-sm mt-0.5">Anomaly detection & alert management</p>
        </div>
        <div className="flex gap-3">
          {[['Total', counts.total, '#00d4ff'], ['Critical', counts.critical, '#ff4444'], ['Unread', counts.unread, '#ffd700']].map(([l, v, c]) => (
            <div key={l} className="border-glow rounded-xl px-4 py-2 text-center"
              style={{ background: 'rgba(10,22,40,0.8)' }}>
              <p className="metric-value text-xl font-bold" style={{ color: c }}>{v}</p>
              <p className="text-xs text-slate-500">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filter.severity} onChange={e => setFilter(f => ({ ...f, severity: e.target.value }))}
          className="px-4 py-2 rounded-xl text-sm text-slate-200"
          style={{ background: 'rgba(10,22,40,0.9)', border: '1px solid rgba(26,58,92,0.8)' }}>
          <option value="">All Severities</option>
          {['critical', 'high', 'medium', 'low'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filter.acknowledged} onChange={e => setFilter(f => ({ ...f, acknowledged: e.target.value }))}
          className="px-4 py-2 rounded-xl text-sm text-slate-200"
          style={{ background: 'rgba(10,22,40,0.9)', border: '1px solid rgba(26,58,92,0.8)' }}>
          <option value="">All Status</option>
          <option value="false">Unacknowledged</option>
          <option value="true">Acknowledged</option>
        </select>
        <button onClick={fetchAlerts}
          className="px-4 py-2 rounded-xl text-sm font-medium text-cyan-400 transition-all hover:bg-cyan-400/10"
          style={{ border: '1px solid rgba(0,212,255,0.3)' }}>
          ↻ Refresh
        </button>
      </div>

      {/* Alert List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : alerts.length === 0 ? (
        <div className="border-glow rounded-2xl p-16 text-center" style={{ background: 'rgba(10,22,40,0.8)' }}>
          <p className="text-4xl mb-3">✓</p>
          <p className="text-slate-400">No alerts found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a, i) => (
            <div key={a._id || i}
              className={`rounded-2xl p-4 transition-all ${a.acknowledged ? 'opacity-50' : ''}`}
              style={{
                background: 'rgba(10,22,40,0.85)',
                border: `1px solid ${a.severity === 'critical' ? 'rgba(255,68,68,0.35)' : a.severity === 'high' ? 'rgba(255,140,0,0.3)' : 'rgba(26,58,92,0.6)'}`,
              }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-xl flex-shrink-0 mt-0.5">{ICON[a.severity] || '⚪'}</span>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200 leading-snug">{a.message}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={`alert-pill ${a.severity}`}>{a.severity}</span>
                      <span className="text-xs text-slate-500">{TYPE[a.type] || '◉'} {a.type}</span>
                      <span className="text-xs text-slate-500">📍 {a.location || a.sensorId}</span>
                      {a.mlScore > 0 && (
                        <span className="text-xs text-purple-400 font-mono">🤖 {Number(a.mlScore).toFixed(3)}</span>
                      )}
                      <span className="text-xs text-slate-600 font-mono">
                        {new Date(a.timestamp).toLocaleString()}
                      </span>
                      {a.acknowledged && <span className="text-xs text-emerald-400">✓ Acknowledged</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!a.acknowledged && (
                    <button onClick={() => acknowledge(a._id)}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80"
                      style={{ background: 'rgba(0,255,159,0.1)', color: '#00ff9f', border: '1px solid rgba(0,255,159,0.25)' }}>
                      ✓ Ack
                    </button>
                  )}
                  {user?.role === 'admin' && a._id && !String(a._id).startsWith('mem_') && (
                    <button onClick={() => remove(a._id)}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80"
                      style={{ background: 'rgba(255,68,68,0.1)', color: '#ff4444', border: '1px solid rgba(255,68,68,0.25)' }}>
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
