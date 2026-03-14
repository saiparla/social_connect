import React, { useState } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItemButton,
  ListItemIcon, ListItemText, IconButton, Avatar, Tooltip, Divider,
  alpha, useMediaQuery, createTheme, ThemeProvider, CssBaseline, Fade,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CampaignIcon from '@mui/icons-material/Campaign';
import InsightsIcon from '@mui/icons-material/Insights';
import GroupIcon from '@mui/icons-material/Group';
import SettingsIcon from '@mui/icons-material/Settings';
import AdminPanelIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import WorkIcon from '@mui/icons-material/Work';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '@fontsource/nunito';

const DRAWER_OPEN = 260;
const DRAWER_CLOSED = 75;

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563eb' },
    secondary: { main: '#0ea5e9' },
    background: { default: '#f0f4f8', paper: '#ffffff' },
    text: { primary: '#1e293b', secondary: '#64748b' },
    divider: 'rgba(37,99,235,0.10)',
  },
  typography: {
    fontFamily: '"Nunito", "Roboto", sans-serif',
    h4: { fontWeight: 800 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: '#ffffff',
          border: '1px solid rgba(37,99,235,0.08)',
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(30,41,59,0.07)',
          transition: 'all 0.3s ease',
          '&:hover': { borderColor: 'rgba(37,99,235,0.18)', boxShadow: '0 6px 24px rgba(37,99,235,0.10)' },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontFamily: 'Nunito, sans-serif', fontWeight: 700, borderRadius: 10 },
        contained: {
          background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 16px rgba(37,99,235,0.25)',
          '&:hover': { background: 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)' },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: { '& .MuiTableCell-root': { fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', borderColor: 'rgba(37,99,235,0.08)', background: '#f8fafc' } },
      },
    },
    MuiTableCell: {
      styleOverrides: { root: { borderColor: 'rgba(37,99,235,0.06)', color: '#1e293b' } },
    },
    MuiChip: {
      styleOverrides: { root: { fontFamily: 'Nunito, sans-serif', fontWeight: 700, borderRadius: 8 } },
    },
  },
});

export default function AppLayout({ onLogout, children }) {
  const [open, setOpen] = useState(true);
  const [hover, setHover] = useState(false);
  const { user, hasPermission } = useAuth();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isExpanded = isMobile ? false : (open || hover);
  const drawerW = isMobile ? 0 : isExpanded ? DRAWER_OPEN : DRAWER_CLOSED;

  const navItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', always: true },
    { label: 'Admin Panel', icon: <AdminPanelIcon />, path: '/admin', perm: 'role_management' },
    { label: 'Role Management', icon: <WorkIcon />, path: '/roles', perm: 'role_management' },
    { label: 'Campaigns', icon: <CampaignIcon />, path: '/campaigns', perm: 'campaigns' },
    { label: 'Analytics', icon: <InsightsIcon />, path: '/analytics', perm: 'analytics' },
    { label: 'Leads', icon: <GroupIcon />, path: '/leads', perm: 'leads' },
    { label: 'Channels', icon: <PhoneIphoneIcon />, path: '/channels', perm: 'channels' },
    { label: 'Scheduler', icon: <ScheduleIcon />, path: '/scheduler', perm: 'scheduler' },
    { label: 'Settings', icon: <SettingsIcon />, path: '/settings', always: true },
  ].filter(item => item.always || hasPermission(item.perm, 'Read'));

  const NavItem = ({ item }) => {
    const active = location.pathname === item.path;
    return (
      <Tooltip title={!isExpanded ? item.label : ''} placement="right">
        <ListItemButton
          component={Link} to={item.path}
          sx={{
            mx: 1, mb: 0.5, borderRadius: 2, px: isExpanded ? 2 : 1.5,
            justifyContent: isExpanded ? 'flex-start' : 'center',
            background: active ? 'linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(14,165,233,0.07) 100%)' : 'transparent',
            border: active ? '1px solid rgba(37,99,235,0.20)' : '1px solid transparent',
            color: active ? '#2563eb' : '#64748b',
            '&:hover': { background: 'rgba(37,99,235,0.07)', color: '#1e293b', border: '1px solid rgba(37,99,235,0.10)' },
            transition: 'all 0.2s ease',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {active && <Box sx={{ position: 'absolute', left: 0, top: '20%', height: '60%', width: 3, background: '#2563eb', borderRadius: '0 3px 3px 0' }} />}
          <ListItemIcon sx={{ minWidth: 0, mr: isExpanded ? 2 : 0, color: 'inherit', justifyContent: 'center' }}>
            {item.icon}
          </ListItemIcon>
          {isExpanded && <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active ? 700 : 500 }} />}
        </ListItemButton>
      </Tooltip>
    );
  };

  const SidebarContent = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', pt: 0, mt: 0 }}>
      {/* Logo */}
      <Box sx={{ py: 2 ,alignContent:'center',display:'flex',justifyContent:'center'}}>
        {!isExpanded && <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <AutoAwesomeIcon sx={{ fontSize: 18, color: '#fff' }} />
        </Box>}
        {isExpanded && (
          <Typography sx={{ fontFamily: "'Cookie', cursive", fontSize: '1.6rem', color: '#1e293b', lineHeight: 1 }}>
            Social Connect
          </Typography>
        )}
      </Box>
      <Divider sx={{ borderColor: 'rgba(37,99,235,0.10)', mx: 2, mb: 1 }} />

      {/* Nav items */}
      <List sx={{ flex: 1, px: 0, py: 0.5 }}>
        {navItems.map(item => <NavItem key={item.path} item={item} />)}
      </List>

      {/* User + Logout */}
      <Divider sx={{ borderColor: 'rgba(37,99,235,0.10)', mx: 2, mt: 1 }} />
      <Box sx={{ p: 1.5 }}>
        {isExpanded ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, py: 1 }}>
            <Avatar sx={{ width: 34, height: 34, background: 'linear-gradient(135deg, #2563eb, #0ea5e9)', fontSize: '0.85rem', color: '#fff', fontWeight: 800 }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || user?.username}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>{user?.role}</Typography>
            </Box>
            <Tooltip title="Logout">
              <IconButton size="small" onClick={onLogout} sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' } }}>
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          <Tooltip title="Logout" placement="right">
            <IconButton onClick={onLogout} sx={{ mx: 'auto', display: 'block', color: '#94a3b8', '&:hover': { color: '#ef4444' } }}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );

  const drawerSx = {
    width: drawerW,
    flexShrink: 0,
    '& .MuiDrawer-paper': {
      width: isExpanded ? DRAWER_OPEN : DRAWER_CLOSED,
      background: '#ffffff',
      border: 'none',
      borderRight: '1px solid rgba(37,99,235,0.10)',
      overflowX: 'hidden',
      transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
      boxSizing: 'border-box',
      boxShadow: '2px 0 12px rgba(30,41,59,0.06)',
    },
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', background: '#f0f4f8' }}>

        {/* TopBar */}
        <AppBar position="fixed" sx={{
          background: 'rgba(255,255,255,0.90)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(37,99,235,0.08)',
          boxShadow: '0 1px 8px rgba(30,41,59,0.07)',
          zIndex: theme.zIndex.drawer + 1,
          ml: `${drawerW}px`,
          width: `calc(100% - ${drawerW}px)`,
          transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={() => setOpen(v => !v)} sx={{ color: '#64748b', '&:hover': { color: '#2563eb' } }}>
                {open ? <ChevronLeftIcon /> : <MenuIcon />}
              </IconButton>
              <Typography variant="body1" sx={{ color: '#64748b', fontFamily: 'Nunito, sans-serif', display: { xs: 'none', sm: 'block' } }}>
                {navItems.find(n => n.path === location.pathname)?.label || 'Social Connect'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 32, height: 32, background: 'linear-gradient(135deg, #2563eb, #0ea5e9)', fontSize: '0.8rem', color: '#fff', fontWeight: 800 }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>{user?.name}</Typography>
                <Typography variant="caption" sx={{ color: '#2563eb', fontSize: '0.65rem' }}>{user?.role}</Typography>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Desktop Drawer */}
        {!isMobile && (
          <Drawer
            variant="permanent"
            sx={drawerSx}
            onMouseEnter={() => !open && setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            <Toolbar />
            <SidebarContent />
          </Drawer>
        )}

        {/* Mobile Drawer */}
        {isMobile && (
          <Drawer variant="temporary" open={open} onClose={() => setOpen(false)}
            sx={{ '& .MuiDrawer-paper': { width: DRAWER_OPEN, background: '#ffffff', border: 'none', borderRight: '1px solid rgba(37,99,235,0.10)' } }}>
            <Toolbar />
            <SidebarContent />
          </Drawer>
        )}

        {/* Main content */}
        <Box component="main" sx={{ flexGrow: 1, width: `calc(100% - ${drawerW}px)`, transition: 'all 0.3s ease', overflow: 'auto' }}>
          <Toolbar />
          <Fade in timeout={400}>
            <Box sx={{ p: { xs: 2, sm: 3, md: 3 }, minHeight: 'calc(100vh - 64px)' }}>
              {children}
            </Box>
          </Fade>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
