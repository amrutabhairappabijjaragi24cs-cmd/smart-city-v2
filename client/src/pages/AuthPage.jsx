import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ZONES = ['Central','North','South','East','West','North-East','North-West','South-East','South-West'];

export default function AuthPage() {
  const [mode, setMode]     = useState('login');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm]     = useState({
    name:'', email:'', password:'', role:'user', phone:'', zone:'Central'
  });
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = mode === 'login'
        ? await login(form.email, form.password)
        : await register(form);
      if (res.success) navigate('/dashboard');
      else setError(res.message || 'Failed');
    } catch(err) {
      setError(err.response?.data?.message || 'Server not reachable. Start backend first.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Skyline */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none flex items-end">
        {[...Array(30)].map((_,i)=>(
          <div key={i} className="flex-1 opacity-10"
            style={{ height:`${40+Math.abs(Math.sin(i)*80)}px`,
                     background:'#0a1628', borderTop:'1px solid rgba(0,212,255,0.3)' }}/>
        ))}
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 mb-1">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{background:'rgba(0,212,255,0.12)',border:'1px solid rgba(0,212,255,0.35)'}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 21h18M3 7l9-4 9 4M4 21V7m16 14V7M9 21V13h6v8"
                  stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="10" r="1.5" fill="#00d4ff"/>
              </svg>
            </div>
            <h1 className="font-display text-2xl font-black text-cyan-400">SmartCity</h1>
          </div>
          <p className="text-slate-400 text-sm">Bengaluru Intelligent Urban Monitor</p>
        </div>

        <div className="rounded-2xl p-7"
          style={{background:'rgba(10,22,40,0.95)',border:'1px solid rgba(26,58,92,0.8)',backdropFilter:'blur(20px)'}}>
          {/* Tabs */}
          <div className="flex mb-6 p-1 rounded-xl" style={{background:'#050a14'}}>
            {['login','register'].map(m=>(
              <button key={m} onClick={()=>{setMode(m);setError('');}}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all
                  ${mode===m?'bg-cyan-400 text-slate-900':'text-slate-400 hover:text-slate-200'}`}>
                {m}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm text-red-400"
              style={{background:'rgba(255,68,68,0.1)',border:'1px solid rgba(255,68,68,0.25)'}}>
              ⚠ {error}
            </div>
          )}

          <div className="space-y-3">
            {mode==='register' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Full Name</label>
                <input type="text" value={form.name} onChange={e=>set('name',e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600"
                  style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(26,58,92,0.8)'}}/>
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Email</label>
              <input type="email" value={form.email} onChange={e=>set('email',e.target.value)}
                placeholder="you@email.com"
                className="w-full px-4 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600"
                style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(26,58,92,0.8)'}}/>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Password</label>
              <input type="password" value={form.password} onChange={e=>set('password',e.target.value)}
                placeholder="Min 6 characters"
                className="w-full px-4 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600"
                style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(26,58,92,0.8)'}}
                onKeyDown={e=>e.key==='Enter'&&submit(e)}/>
            </div>

            {mode==='register' && (
              <>
                <div>
                  <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">
                    Phone Number <span className="text-cyan-400">(for SMS/WhatsApp alerts)</span>
                  </label>
                  <input type="text" value={form.phone} onChange={e=>set('phone',e.target.value)}
                    placeholder="+91XXXXXXXXXX"
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600"
                    style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(26,58,92,0.8)'}}/>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Your Zone</label>
                    <select value={form.zone} onChange={e=>set('zone',e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-200"
                      style={{background:'rgba(10,22,40,0.95)',border:'1px solid rgba(26,58,92,0.8)'}}>
                      {ZONES.map(z=><option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Role</label>
                    <select value={form.role} onChange={e=>set('role',e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-200"
                      style={{background:'rgba(10,22,40,0.95)',border:'1px solid rgba(26,58,92,0.8)'}}>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <p className="text-xs text-slate-500 flex items-start gap-1.5">
                  <span className="text-cyan-400 mt-0.5">ℹ</span>
                  You will receive danger alerts via SMS & WhatsApp when your zone has a critical event.
                </p>
              </>
            )}

            <button onClick={submit} disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm mt-1 transition-all disabled:opacity-50"
              style={{background:loading?'rgba(0,212,255,0.1)':'linear-gradient(135deg,#00d4ff,#0099cc)',
                     color:'#050a14',boxShadow:loading?'none':'0 0 24px rgba(0,212,255,0.3)'}}>
              {loading ? '⟳ Connecting...' : mode==='login' ? '→ Sign In' : '→ Create Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
