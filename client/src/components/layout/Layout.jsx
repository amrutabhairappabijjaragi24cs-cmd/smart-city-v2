import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const USER_NAV = [
  { to:'/dashboard', label:'Dashboard', icon:'⬡' },
  { to:'/map',       label:'City Map',  icon:'🗺' },
  { to:'/analytics', label:'Analytics', icon:'◈' },
  { to:'/alerts',    label:'Alerts',    icon:'◉' },
  { to:'/sensors',   label:'Sensors',   icon:'⬕' },
  { to:'/profile',   label:'My Profile',icon:'👤' },
];
const ADMIN_NAV = [
  { to:'/dashboard', label:'Dashboard',  icon:'⬡' },
  { to:'/map',       label:'City Map',   icon:'🗺' },
  { to:'/analytics', label:'Analytics',  icon:'◈' },
  { to:'/alerts',    label:'Alerts',     icon:'◉' },
  { to:'/sensors',   label:'Sensors',    icon:'⬕' },
  { to:'/admin',     label:'Admin Panel',icon:'🛡' },
  { to:'/profile',   label:'My Profile', icon:'👤' },
];

export default function Layout({ children }) {
  const { user, logout }                    = useAuth();
  const { connected, latestAlerts }         = useSocket();
  const navigate                            = useNavigate();
  const [collapsed, setCollapsed]           = useState(false);
  const NAV = user?.role === 'admin' ? ADMIN_NAV : USER_NAV;
  const unread = latestAlerts.filter(a=>!a.acknowledged).length;

  return (
    <div className="flex h-screen overflow-hidden" style={{background:'#050a14'}}>
      {/* Sidebar */}
      <aside className={`flex flex-col flex-shrink-0 transition-all duration-300 ${collapsed?'w-16':'w-60'}`}
        style={{background:'rgba(10,22,40,0.98)',borderRight:'1px solid rgba(26,58,92,0.7)'}}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b" style={{borderColor:'rgba(26,58,92,0.6)'}}>
          <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
            style={{background:'rgba(0,212,255,0.12)',border:'1px solid rgba(0,212,255,0.35)'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M3 21h18M3 7l9-4 9 4M4 21V7m16 14V7M9 21V13h6v8"
                stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {!collapsed && (
            <div>
              <p className="font-display text-sm font-bold text-cyan-400 leading-none">SmartCity</p>
              <p className="text-xs text-slate-500">Bengaluru Monitor</p>
            </div>
          )}
          <button onClick={()=>setCollapsed(!collapsed)}
            className="ml-auto text-slate-500 hover:text-cyan-400 transition-colors text-lg">
            {collapsed?'›':'‹'}
          </button>
        </div>

        {/* Live indicator */}
        <div className={`flex items-center gap-2 mx-3 mt-3 px-3 py-2 rounded-xl ${collapsed?'justify-center':''}`}
          style={{background:'rgba(0,0,0,0.3)'}}>
          <div className={`status-dot ${connected?'green':'red'}`}/>
          {!collapsed && <span className="text-xs text-slate-400">{connected?'Live Connected':'Reconnecting...'}</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pt-3 space-y-1 overflow-y-auto">
          {NAV.map(item=>(
            <NavLink key={item.to} to={item.to}
              className={({isActive})=>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative
                ${isActive?'text-cyan-400 bg-cyan-400/10 border border-cyan-400/20':'text-slate-400 hover:text-slate-200 hover:bg-white/5'}
                ${collapsed?'justify-center':''}`
              }>
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              {item.label==='Alerts' && unread>0 && (
                <span className={`${collapsed?'absolute -top-1 -right-1':'ml-auto'}
                  bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold`}>
                  {unread>9?'9+':unread}
                </span>
              )}
              {item.label==='Admin Panel' && (
                <span className={`${collapsed?'hidden':'ml-auto'} text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full`}>
                  Admin
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-3 pb-4 pt-3 border-t" style={{borderColor:'rgba(26,58,92,0.6)'}}>
          {!collapsed && (
            <div className="px-3 py-2 mb-2 rounded-xl" style={{background:'rgba(0,0,0,0.3)'}}>
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold
                  ${user?.role==='admin'?'bg-cyan-400/20 text-cyan-400':'bg-emerald-400/20 text-emerald-400'}`}>
                  {user?.role}
                </span>
                {user?.zone && <span className="text-xs text-slate-500">{user.zone}</span>}
              </div>
              {user?.phone ? (
                <p className="text-xs text-emerald-400 mt-1">📲 Alerts ON</p>
              ) : (
                <p className="text-xs text-yellow-400 mt-1">⚠ Add phone for alerts</p>
              )}
            </div>
          )}
          <button onClick={async()=>{await logout();navigate('/login');}}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all ${collapsed?'justify-center':''}`}>
            <span>⏻</span>
            {!collapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto grid-bg">{children}</main>
    </div>
  );
}
