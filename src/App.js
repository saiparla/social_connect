import './App.css';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './layout/layout';
import LoginPage from './AuthPages/login';
import ForgotPasswordPage from './AuthPages/forgotpassword';
import Dashboard from './pages/dashboard';
import AdminPanel from './pages/AdminPanel';
import RoleManagementPage from './pages/rolemanagement';
import CampaignsPage from './pages/campaigns';
import LeadsPage from './pages/leads';
import ChannelsPage from './pages/channels';
import AnalyticsPage from './pages/analytics';
import SchedulerPage from './pages/scheduler';
import SettingsPage from './pages/settings';

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
}

function AppRoutes() {
  const { isAuthenticated, loading, logout } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0d1b2a' }}>
        <CircularProgress sx={{ color: '#00d4ff' }} />
      </Box>
    );
  }

  const handleLogout = () => { logout(); };

  const wrap = (Component) => (
    <AppLayout onLogout={handleLogout}>
      <Component />
    </AppLayout>
  );

  return (
    <Routes>
      <Route path="/"          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/forgot"    element={<ForgotPasswordPage />} />
      <Route path="/dashboard" element={isAuthenticated ? wrap(Dashboard)           : <Navigate to="/" replace />} />
      <Route path="/admin"     element={isAuthenticated ? wrap(AdminPanel)           : <Navigate to="/" replace />} />
      <Route path="/roles"     element={isAuthenticated ? wrap(RoleManagementPage)   : <Navigate to="/" replace />} />
      <Route path="/campaigns" element={isAuthenticated ? wrap(CampaignsPage)        : <Navigate to="/" replace />} />
      <Route path="/leads"     element={isAuthenticated ? wrap(LeadsPage)            : <Navigate to="/" replace />} />
      <Route path="/channels"  element={isAuthenticated ? wrap(ChannelsPage)         : <Navigate to="/" replace />} />
      <Route path="/analytics" element={isAuthenticated ? wrap(AnalyticsPage)        : <Navigate to="/" replace />} />
      <Route path="/scheduler" element={isAuthenticated ? wrap(SchedulerPage)        : <Navigate to="/" replace />} />
      <Route path="/settings"  element={isAuthenticated ? wrap(SettingsPage)         : <Navigate to="/" replace />} />
      <Route path="*"          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
