import React, { useEffect, useState, useCallback } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Avatar, Paper, CircularProgress, Chip, alpha } from '@mui/material';
import GroupsIcon    from '@mui/icons-material/Groups';
import CampaignIcon  from '@mui/icons-material/Campaign';
import InsightsIcon  from '@mui/icons-material/Insights';
import PeopleIcon    from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ConnectIcon   from '@mui/icons-material/ConnectWithoutContact';
import AddIcon       from '@mui/icons-material/Add';
import { useAuth, api } from '../context/AuthContext';
import { Link }     from 'react-router-dom';
import ChatBot      from '../components/ChatBot/ChatBot';

const StatCard = ({ label, value, icon, color, loading }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 1, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.72rem' }}>
            {label}
          </Typography>
          <Typography variant="h3" sx={{ color: color, fontWeight: 800, lineHeight: 1 }}>
            {loading ? <CircularProgress size={30} sx={{ color: color }} /> : value}
          </Typography>
        </Box>
        <Box sx={{ width: 48, height: 48, borderRadius: '12px', background: `linear-gradient(135deg, ${alpha(color, 0.2)}, ${alpha(color, 0.05)})`, border: `1px solid ${alpha(color, 0.2)}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {React.cloneElement(icon, { sx: { color: color, fontSize: 22 } })}
        </Box>
      </Box>
      <Box sx={{ mt: 2, height: 3, borderRadius: 2, background: `linear-gradient(90deg, ${color}, transparent)`, opacity: 0.4 }} />
    </CardContent>
  </Card>
);

const QuickLinkCard = ({ label, desc, icon, path, color }) => (
  <Card component={Link} to={path} sx={{ textDecoration: 'none', cursor: 'pointer', height: '100%', display: 'block' }}>
    <CardContent sx={{ p: 3, textAlign: 'center' }}>
      <Box sx={{ width: 52, height: 52, borderRadius: '14px', background: `linear-gradient(135deg, ${alpha(color, 0.2)}, ${alpha(color, 0.05)})`, border: `1px solid ${alpha(color, 0.25)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2, transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.1) rotate(5deg)' } }}>
        {React.cloneElement(icon, { sx: { color: color, fontSize: 22 } })}
      </Box>
      <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>{label}</Typography>
      <Typography variant="caption" sx={{ color: '#64748b' }}>{desc}</Typography>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const { user, hasPermission } = useAuth();
  const [stats, setStats]       = useState({ channels: 0, campaigns: 0, leads: 0 });
  const [loading, setLoading]   = useState(true);

  const fetchStats = useCallback(async () => {
    const results = await Promise.allSettled([
      api.get('/api/v1/dashboard/stats'),
      api.get('/api/v1/channels'),
      api.get('/api/v1/campaigns'),
      api.get('/api/v1/leads'),
    ]);
    const s  = results[0].status === 'fulfilled' ? results[0].value.data?.stats || {} : {};
    const ch = results[1].status === 'fulfilled' ? (results[1].value.data?.channels || []).length : 0;
    const ca = results[2].status === 'fulfilled' ? (results[2].value.data?.campaigns || []).length : 0;
    const le = results[3].status === 'fulfilled' ? (results[3].value.data?.leads || []).length : 0;
    setStats({ channels: s.channels ?? ch, campaigns: s.campaigns ?? ca, leads: s.leads ?? le });
    setLoading(false);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const greeting = user?.name || user?.username || 'there';
  const hour     = new Date().getHours();
  const tod      = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const quickLinks = [
    { label: 'Channels',   desc: 'Manage social channels', icon: <GroupsIcon />,   path: '/channels',  color: '#2563eb', perm: 'channels' },
    { label: 'Campaigns',  desc: 'Run campaigns',          icon: <CampaignIcon />, path: '/campaigns', color: '#0284c7', perm: 'campaigns' },
    { label: 'Analytics',  desc: 'View performance',       icon: <InsightsIcon />, path: '/analytics', color: '#06b6d4', perm: 'analytics' },
    { label: 'Leads',      desc: 'Track leads',            icon: <PeopleIcon />,   path: '/leads',     color: '#0ea5e9', perm: 'leads' },
  ].filter(q => hasPermission(q.perm, 'Read'));

  const tips = [
    'Connect at least 3 channels to maximize your reach',
    'Schedule posts during peak engagement hours (8AM–10AM, 7PM–9PM)',
    'Follow up with leads within 24 hours for best conversion',
    'Use A/B testing to optimize campaign performance',
  ];

  const barHeights = [45, 70, 55, 90, 60, 80, 65];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontFamily: 'Nunito, sans-serif' }}>{tod},</Typography>
          <Typography variant="h4" sx={{ color: '#1e293b', fontWeight: 800 }}>
            {greeting.charAt(0).toUpperCase() + greeting.slice(1)} 👋
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>Here's your social presence at a glance</Typography>
        </Box>
        {hasPermission('campaigns', 'Create') && (
          <Button variant="contained" startIcon={<AddIcon />} component={Link} to="/campaigns" sx={{ borderRadius: 2 }}>
            New Campaign
          </Button>
        )}
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={4}><StatCard label="Channels"  value={stats.channels}  icon={<ConnectIcon />}  color="#2563eb" loading={loading} /></Grid>
        <Grid item xs={12} sm={4}><StatCard label="Campaigns" value={stats.campaigns} icon={<CampaignIcon />} color="#0284c7" loading={loading} /></Grid>
        <Grid item xs={12} sm={4}><StatCard label="Leads"     value={stats.leads}     icon={<PeopleIcon />}   color="#06b6d4" loading={loading} /></Grid>
      </Grid>

      <Grid container spacing={3} mb={4}>
        {/* Chart */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Campaign Performance</Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>Weekly overview</Typography>
                </Box>
                {stats.campaigns === 0 && <Chip label="No Data" size="small" sx={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb', border: '1px solid rgba(37,99,235,0.2)' }} />}
              </Box>
              {stats.campaigns > 0 ? (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: { xs: 1, sm: 2 }, height: 140, justifyContent: 'center', mb: 2 }}>
                    {barHeights.map((h, i) => (
                      <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <Box sx={{
                          width: { xs: 28, sm: 36 }, height: h * 1.4,
                          background: i === 3 ? 'linear-gradient(180deg, #2563eb 0%, #0ea5e9 100%)' : 'linear-gradient(180deg, rgba(37,99,235,0.35) 0%, rgba(14,165,233,0.25) 100%)',
                          borderRadius: '6px 6px 0 0', transition: 'height 0.5s',
                          '&:hover': { background: 'linear-gradient(180deg, #2563eb 0%, #0284c7 100%)', cursor: 'pointer' },
                        }} />
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 1.5, sm: 3 } }}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                      <Typography key={d} variant="caption" sx={{ color: '#64748b' }}>{d}</Typography>
                    ))}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(37,99,235,0.15)', borderRadius: 2 }}>
                  <InsightsIcon sx={{ fontSize: 48, color: 'rgba(37,99,235,0.2)', mb: 1 }} />
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>Run campaigns to see analytics</Typography>
                  <Button size="small" variant="outlined" component={Link} to="/campaigns" sx={{ borderColor: 'rgba(37,99,235,0.3)', color: '#2563eb', borderRadius: 2 }}>
                    Create Campaign
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Tips */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                <TrendingUpIcon sx={{ color: '#2563eb', fontSize: 20 }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Quick Tips</Typography>
              </Box>
              {tips.map((tip, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                  <Avatar sx={{ width: 22, height: 22, fontSize: '0.7rem', background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', color: '#f0f4f8', fontWeight: 800, flexShrink: 0, mt: 0.1 }}>{i + 1}</Avatar>
                  <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.6 }}>{tip}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Links */}
      {quickLinks.length > 0 && (
        <Grid container spacing={3}>
          {quickLinks.map(q => (
            <Grid item xs={6} sm={3} key={q.path}>
              <QuickLinkCard {...q} />
            </Grid>
          ))}
        </Grid>
      )}

      <ChatBot />
    </Box>
  );
}
