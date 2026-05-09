import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Layout        from './components/layout/Layout';
import AuthPage      from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AlertsPage    from './pages/AlertsPage';
import SensorsPage   from './pages/SensorsPage';
import MapPage       from './pages/MapPage';
import AdminPage     from './pages/AdminPage';
import ProfilePage   from './pages/ProfilePage';

const Guard = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'#050a14'}}>
      <div className="text-center">
        <div className="font-display text-cyan-400 text-2xl mb-2 animate-pulse">SmartCity</div>
        <div className="text-slate-500 text-sm">Initializing...</div>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const Wrapped = ({ page, adminOnly = false }) => (
  <Guard adminOnly={adminOnly}>
    <SocketProvider>
      <Layout>{page}</Layout>
    </SocketProvider>
  </Guard>
);

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login"     element={user ? <Navigate to="/dashboard" replace/> : <AuthPage/>}/>
      <Route path="/"          element={<Navigate to="/dashboard" replace/>}/>
      <Route path="/dashboard" element={<Wrapped page={<DashboardPage/>}/>}/>
      <Route path="/analytics" element={<Wrapped page={<AnalyticsPage/>}/>}/>
      <Route path="/alerts"    element={<Wrapped page={<AlertsPage/>}/>}/>
      <Route path="/sensors"   element={<Wrapped page={<SensorsPage/>}/>}/>
      <Route path="/map"       element={<Wrapped page={<MapPage/>}/>}/>
      <Route path="/profile"   element={<Wrapped page={<ProfilePage/>}/>}/>
      <Route path="/admin"     element={<Wrapped page={<AdminPage/>} adminOnly/>}/>
      <Route path="*"          element={<Navigate to="/dashboard" replace/>}/>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider><AppRoutes/></AuthProvider>
  );
}
