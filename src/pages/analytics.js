import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Grid, CircularProgress, Alert, Chip } from '@mui/material';
import { TrendingUp, BarChart, PieChart, Timeline, TrendingDown } from '@mui/icons-material';
import { api } from '../context/AuthContext';

const METRIC_ICONS = { campaign_performance: <BarChart />, lead_conversion: <TrendingUp />, engagement_rate: <PieChart />, roi: <TrendingUp />, click_through_rate: <Timeline />, cost_per_lead: <TrendingDown /> };
const PERIOD_COLORS = { weekly: '#2563eb', monthly: '#10b981', quarterly: '#f59e0b' };

const formatVal = (metric, value) => {
  if (['roi','lead_conversion','engagement_rate','click_through_rate'].includes(metric)) return `${value}%`;
  if (metric === 'cost_per_lead') return `$${value}`;
  return typeof value === 'number' ? value.toFixed(1) : value;
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/api/v1/analytics'); setAnalytics(r.data.analytics || []); }
    catch { setError('Failed to load analytics'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const get = (metric) => analytics.find(a => a.metric === metric);

  const topCards = [
    { label: 'Campaign Performance', metric: 'campaign_performance', color: '#2563eb' },
    { label: 'Lead Conversion',      metric: 'lead_conversion',      color: '#10b981' },
    { label: 'Engagement Rate',      metric: 'engagement_rate',      color: '#f59e0b' },
    { label: 'ROI',                  metric: 'roi',                  color: '#06b6d4' },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, background: 'linear-gradient(135deg, #1e293b 30%, #2563eb 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Analytics</Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>Performance metrics and insights</Typography>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: '#2563eb' }} /></Box> : (
        <>
          <Grid container spacing={2} mb={3}>
            {topCards.map(({ label, metric, color }) => {
              const item = get(metric);
              return (
                <Grid item xs={6} sm={3} key={metric}>
                  <Card>
                    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="caption" sx={{ color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.68rem', fontWeight: 700 }}>{label}</Typography>
                        <Box sx={{ color: color, opacity: 0.7, '& svg': { fontSize: '1.2rem' } }}>{METRIC_ICONS[metric]}</Box>
                      </Box>
                      <Typography variant="h4" sx={{ color: color, fontWeight: 800 }}>{item ? formatVal(metric, item.value) : '—'}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5 }}>Detailed Analytics</Typography>
              <TableContainer>
                <Table>
                  <TableHead><TableRow>{['Metric','Value','Period','Campaign/Channel','Date','Created By'].map(h => <TableCell key={h}>{h}</TableCell>)}</TableRow></TableHead>
                  <TableBody>
                    {analytics.length === 0 ? <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: '#64748b' }}>No analytics data yet</TableCell></TableRow>
                    : analytics.map(a => (
                      <TableRow key={a.id} sx={{ '&:hover': { background: 'rgba(37,99,235,0.03)' }, '&:last-child td': { border: 0 } }}>
                        <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#64748b' }}>{METRIC_ICONS[a.metric] || <BarChart />}<Typography variant="body2" sx={{ color: '#1e293b', textTransform: 'capitalize' }}>{a.metric?.replace(/_/g, ' ')}</Typography></Box></TableCell>
                        <TableCell><Typography variant="body2" sx={{ fontWeight: 700, color: '#2563eb' }}>{formatVal(a.metric, a.value)}</Typography></TableCell>
                        <TableCell><Box sx={{ display: 'inline-flex', alignItems: 'center', px: 1.5, py: 0.4, borderRadius: 20, background: `${PERIOD_COLORS[a.period] || '#64748b'}18`, border: `1px solid ${PERIOD_COLORS[a.period] || '#64748b'}40` }}><Typography variant="caption" sx={{ color: PERIOD_COLORS[a.period] || '#64748b', fontWeight: 700, textTransform: 'capitalize', fontSize: '0.72rem' }}>{a.period}</Typography></Box></TableCell>
                        <TableCell><Typography variant="body2" sx={{ color: '#64748b' }}>{a.campaign_id || a.channel_id || '—'}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ color: '#64748b' }}>{a.date ? new Date(a.date).toLocaleDateString() : '—'}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ color: '#64748b' }}>{a.created_by || '—'}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}