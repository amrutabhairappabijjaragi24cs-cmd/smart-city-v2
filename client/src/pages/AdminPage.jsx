import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';

export default function AdminPage() {
  const { connected } = useSocket();
  const [users, setUsers]       = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [alertForm, setAlertForm] = useState({ userId:'', message:'' });
  const [alertMsg, setAlertMsg] = useState('');

  useEffect(() => { fetchAll(); const iv = setInterval(fetchAll, 10000); return ()=>clearInterval(iv); }, []);

  const fetchAll = async () => {
    try {
      const [u, s] = await Promise.all([
        api.get('/api/auth/admin/users'),
        api.get('/api/auth/admin/online'),
      ]);
      if (u.data.success) setUsers(u.data.data);
      if (s.data.success) setStats(s.data.data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const sendAlert = async () => {
    if (!alertForm.userId || !alertForm.message) return;
    try {
      const { data } = await api.post('/api/auth/admin/alert-user', alertForm);
      setAlertMsg(data.success ? `✓ ${data.message}` : `⚠ ${data.message}`);
      setAlertForm({ userId:'', message:'' });
      setTimeout(() => setAlertMsg(''), 4000);
    } catch(e) {
      setAlertMsg(`⚠ ${e.response?.data?.message || 'Failed'}`);
    }
  };

  const onlineUsers  = users.filter(u => u.isOnline);
  const offlineUsers = users.filter(u => !u.isOnline);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-black text-white tracking-wide">ADMIN PANEL</h1>
        <p className="text-slate-400 text-sm mt-0.5">User management & monitoring</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label:'Total Users',   value: stats.total,   color:'#00d4ff', icon:'👥' },
            { label:'Online Now',    value: stats.online,  color:'#00ff9f', icon:'🟢' },
            { label:'Offline',       value: stats.offline, color:'#94a3b8', icon:'⭕' },
            { label:'Socket Status', value: connected?'Live':'Off', color: connected?'#00ff9f':'#ff4444', icon:'📡' },
          ].map(k=>(
            <div key={k.label} className="border-glow rounded-2xl p-5" style={{background:'rgba(10,22,40,0.8)'}}>
              <span className="text-2xl">{k.icon}</span>
              <p className="metric-value text-2xl font-bold mt-2" style={{color:k.color}}>{k.value}</p>
              <p className="text-xs text-slate-400 mt-1">{k.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Send Manual Alert */}
      <div className="border-glow rounded-2xl p-6" style={{background:'rgba(10,22,40,0.8)'}}>
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
          📲 Send Manual Alert to User
        </h2>
        {alertMsg && (
          <div className="mb-3 p-3 rounded-xl text-sm"
            style={{background:alertMsg.startsWith('✓')?'rgba(0,255,159,0.1)':'rgba(255,68,68,0.1)',
                    color:alertMsg.startsWith('✓')?'#00ff9f':'#ff6b6b',
                    border:`1px solid ${alertMsg.startsWith('✓')?'rgba(0,255,159,0.2)':'rgba(255,68,68,0.2)'}`}}>
            {alertMsg}
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <select value={alertForm.userId} onChange={e=>setAlertForm(f=>({...f,userId:e.target.value}))}
            className="flex-1 min-w-48 px-4 py-2.5 rounded-xl text-sm text-slate-200"
            style={{background:'rgba(10,22,40,0.95)',border:'1px solid rgba(26,58,92,0.8)'}}>
            <option value="">Select User...</option>
            {users.filter(u=>u.phone).map(u=>(
              <option key={u.id||u._id} value={u.id||u._id}>
                {u.name} ({u.phone}) — {u.zone}
              </option>
            ))}
          </select>
          <input type="text" value={alertForm.message}
            onChange={e=>setAlertForm(f=>({...f,message:e.target.value}))}
            placeholder="Alert message..."
            className="flex-1 min-w-64 px-4 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600"
            style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(26,58,92,0.8)'}}/>
          <button onClick={sendAlert}
            className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{background:'linear-gradient(135deg,#ff8c00,#ff6600)',color:'#fff'}}>
            📤 Send Alert
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">Only users with a phone number will receive alerts.</p>
      </div>

      {/* Online Users */}
      <div className="border-glow rounded-2xl overflow-hidden" style={{background:'rgba(10,22,40,0.8)'}}>
        <div className="px-5 py-4 border-b flex items-center gap-3" style={{borderColor:'rgba(26,58,92,0.6)'}}>
          <div className="status-dot green"/>
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Online Users ({onlineUsers.length})
          </h2>
        </div>
        {loading ? (
          <div className="p-4 space-y-2">{[...Array(3)].map((_,i)=><div key={i} className="skeleton h-12 rounded-xl"/>)}</div>
        ) : onlineUsers.length === 0 ? (
          <p className="p-6 text-slate-500 text-sm text-center">No users online right now</p>
        ) : (
          <UserTable users={onlineUsers} online />
        )}
      </div>

      {/* All Users */}
      <div className="border-glow rounded-2xl overflow-hidden" style={{background:'rgba(10,22,40,0.8)'}}>
        <div className="px-5 py-4 border-b" style={{borderColor:'rgba(26,58,92,0.6)'}}>
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            All Registered Users ({users.length})
          </h2>
        </div>
        {loading ? (
          <div className="p-4 space-y-2">{[...Array(5)].map((_,i)=><div key={i} className="skeleton h-12 rounded-xl"/>)}</div>
        ) : (
          <UserTable users={users} />
        )}
      </div>
    </div>
  );
}

function UserTable({ users, online }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{borderBottom:'1px solid rgba(26,58,92,0.4)'}}>
            {['Status','Name','Email','Role','Phone','Zone','Logins','Last Seen'].map(h=>(
              <th key={h} className="px-4 py-3 text-left text-xs text-slate-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((u,i)=>(
            <tr key={u.id||u._id||i} className="border-b hover:bg-white/5 transition-colors"
              style={{borderColor:'rgba(26,58,92,0.2)'}}>
              <td className="px-4 py-3">
                <div className={`status-dot ${u.isOnline?'green':'red'}`}/>
              </td>
              <td className="px-4 py-3 font-semibold text-white">{u.name}</td>
              <td className="px-4 py-3 text-slate-400 font-mono text-xs">{u.email}</td>
              <td className="px-4 py-3">
                <span className={`alert-pill ${u.role==='admin'?'high':'low'}`}>{u.role}</span>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-slate-300">{u.phone||'—'}</td>
              <td className="px-4 py-3 text-slate-300">{u.zone||'—'}</td>
              <td className="px-4 py-3 text-cyan-400 font-mono">{u.loginCount||0}</td>
              <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                {u.lastSeen ? new Date(u.lastSeen).toLocaleString('en-IN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'short'}) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
