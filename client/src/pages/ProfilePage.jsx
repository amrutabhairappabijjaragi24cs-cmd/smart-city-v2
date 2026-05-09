import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const ZONES = ['Central','North','South','East','West','North-East','North-West','South-East','South-West'];

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name:          user?.name || '',
    phone:         user?.phone || '',
    zone:          user?.zone || 'Central',
    alertsEnabled: user?.alertsEnabled !== false,
  });
  const [msg, setMsg]       = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const save = async () => {
    setLoading(true); setMsg('');
    try {
      const res = await updateProfile(form);
      setMsg(res.success ? '✓ Profile updated successfully!' : `⚠ ${res.message}`);
    } catch(e) {
      setMsg(`⚠ ${e.response?.data?.message||'Failed to update'}`);
    } finally { setLoading(false); setTimeout(()=>setMsg(''),4000); }
  };

  return (
    <div className="p-6 max-w-xl animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-black text-white tracking-wide">MY PROFILE</h1>
        <p className="text-slate-400 text-sm mt-0.5">Manage your alert preferences</p>
      </div>

      <div className="border-glow rounded-2xl p-6 space-y-5" style={{background:'rgba(10,22,40,0.8)'}}>
        {/* Avatar */}
        <div className="flex items-center gap-4 pb-4 border-b" style={{borderColor:'rgba(26,58,92,0.5)'}}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
            style={{background:'rgba(0,212,255,0.12)',border:'1px solid rgba(0,212,255,0.3)',color:'#00d4ff'}}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-white text-lg">{user?.name}</p>
            <p className="text-slate-400 text-sm">{user?.email}</p>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-semibold
              ${user?.role==='admin'?'bg-cyan-400/20 text-cyan-400':'bg-emerald-400/20 text-emerald-400'}`}>
              {user?.role}
            </span>
          </div>
        </div>

        {msg && (
          <div className="p-3 rounded-xl text-sm"
            style={{background:msg.startsWith('✓')?'rgba(0,255,159,0.1)':'rgba(255,68,68,0.1)',
                    color:msg.startsWith('✓')?'#00ff9f':'#ff6b6b',
                    border:`1px solid ${msg.startsWith('✓')?'rgba(0,255,159,0.2)':'rgba(255,68,68,0.2)'}`}}>
            {msg}
          </div>
        )}

        <div>
          <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Full Name</label>
          <input type="text" value={form.name} onChange={e=>set('name',e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-sm text-slate-200"
            style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(26,58,92,0.8)'}}/>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">
            Phone Number <span className="text-cyan-400 normal-case">(for SMS & WhatsApp alerts)</span>
          </label>
          <input type="text" value={form.phone} onChange={e=>set('phone',e.target.value)}
            placeholder="+91XXXXXXXXXX"
            className="w-full px-4 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600"
            style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(26,58,92,0.8)'}}/>
          <p className="text-xs text-slate-500 mt-1">Enter with country code. E.g. +919876543210</p>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Your Zone (Bengaluru)</label>
          <select value={form.zone} onChange={e=>set('zone',e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-sm text-slate-200"
            style={{background:'rgba(10,22,40,0.95)',border:'1px solid rgba(26,58,92,0.8)'}}>
            {ZONES.map(z=><option key={z} value={z}>{z}</option>)}
          </select>
          <p className="text-xs text-slate-500 mt-1">You'll get alerts when sensors in your zone detect danger.</p>
        </div>

        {/* Alert toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl"
          style={{background:'rgba(0,0,0,0.3)',border:'1px solid rgba(26,58,92,0.5)'}}>
          <div>
            <p className="text-sm font-semibold text-white">Danger Alerts</p>
            <p className="text-xs text-slate-400 mt-0.5">Receive SMS & WhatsApp when your zone is in danger</p>
          </div>
          <button onClick={()=>set('alertsEnabled',!form.alertsEnabled)}
            className="relative w-12 h-6 rounded-full transition-all flex-shrink-0"
            style={{background:form.alertsEnabled?'#00d4ff':'rgba(26,58,92,0.8)'}}>
            <div className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all"
              style={{left:form.alertsEnabled?'28px':'4px'}}/>
          </button>
        </div>

        {/* Alert preview */}
        {form.phone && (
          <div className="p-4 rounded-xl" style={{background:'rgba(0,212,255,0.05)',border:'1px solid rgba(0,212,255,0.15)'}}>
            <p className="text-xs text-cyan-400 font-semibold mb-2">📲 Alert Preview</p>
            <p className="text-xs text-slate-300 font-mono leading-relaxed">
              🏙️ SmartCity DANGER ALERT<br/>
              Dear {form.name||'User'},<br/>
              ⚠️ SEVERITY: HIGH<br/>
              📍 Location: {form.zone} Zone<br/>
              🔔 Air pollution detected — AQI 210<br/>
              This is how your alert will look.
            </p>
          </div>
        )}

        <button onClick={save} disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
          style={{background:loading?'rgba(0,212,255,0.1)':'linear-gradient(135deg,#00d4ff,#0099cc)',
                 color:'#050a14',boxShadow:loading?'none':'0 0 20px rgba(0,212,255,0.25)'}}>
          {loading ? '⟳ Saving...' : '→ Save Changes'}
        </button>
      </div>
    </div>
  );
}
