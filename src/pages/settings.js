import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid, CircularProgress, Alert, Switch, FormControlLabel, TextField, Button, FormControl, InputLabel, Select, MenuItem, Chip, Avatar } from '@mui/material';
import { Notifications, Security, Palette, Save, Refresh } from '@mui/icons-material';
import { useAuth, api } from '../context/AuthContext';

const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px', background: '#f8fafc', color: '#1e293b', '& fieldset': { borderColor: 'rgba(37,99,235,0.2)' }, '&:hover fieldset': { borderColor: 'rgba(37,99,235,0.4)' }, '&.Mui-focused fieldset': { borderColor: '#2563eb', borderWidth: '1.5px' } }, '& .MuiInputLabel-root': { color: '#64748b' }, '& .MuiInputLabel-root.Mui-focused': { color: '#2563eb' }, '& input': { color: '#1e293b' }, '& .MuiSvgIcon-root': { color: '#64748b' }, '& .Mui-disabled input': { color: '#64748b', WebkitTextFillColor: '#64748b' } };
const switchSx = { '& .MuiSwitch-switchBase.Mui-checked': { color: '#2563eb' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#2563eb' } };

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({ notifications: { email_alerts: true, sms_alerts: false, push_notifications: true, weekly_reports: true }, preferences: { theme: 'dark', language: 'en', timezone: 'UTC', date_format: 'MM/DD/YYYY' }, security: { session_timeout: 30, two_factor_auth: false, login_notifications: true } });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState({ type: '', text: '' });

  const fetch = async () => {
    setLoading(true);
    try { const r = await api.get('/api/v1/settings'); if (r.data.settings) setSettings(r.data.settings); }
    catch { /* use defaults */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const save = async () => {
    setSaving(true);
    try { await api.post('/api/v1/settings', settings); setMsg({ type: 'success', text: 'Settings saved successfully!' }); setTimeout(() => setMsg({ type: '', text: '' }), 3000); }
    catch { setMsg({ type: 'error', text: 'Failed to save settings' }); }
    finally { setSaving(false); }
  };

  const setN = (k, v) => setSettings(p => ({ ...p, notifications: { ...p.notifications, [k]: v } }));
  const setPr = (k, v) => setSettings(p => ({ ...p, preferences: { ...p.preferences, [k]: v } }));
  const setSec = (k, v) => setSettings(p => ({ ...p, security: { ...p.security, [k]: v } }));

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: '#2563eb' }} /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box><Typography variant="h4" sx={{ fontWeight: 800, background: 'linear-gradient(135deg, #1e293b 30%, #2563eb 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Settings</Typography><Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>Manage preferences and security</Typography></Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetch} sx={{ borderRadius: 2, borderColor: 'rgba(37,99,235,0.3)', color: '#2563eb' }}>Refresh</Button>
          <Button variant="contained" startIcon={<Save />} onClick={save} disabled={saving} sx={{ borderRadius: 2 }}>{saving ? 'Saving…' : 'Save Changes'}</Button>
        </Box>
      </Box>
      {msg.text && <Alert severity={msg.type} sx={{ mb: 2, borderRadius: 2 }} onClose={() => setMsg({ type: '', text: '' })}>{msg.text}</Alert>}
      <Grid container spacing={3}>
        {/* Notifications */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}><Notifications sx={{ color: '#2563eb', fontSize: 20 }} /><Typography variant="h6" sx={{ fontWeight: 700 }}>Notifications</Typography></Box>
              {[['email_alerts','Email Alerts'],['sms_alerts','SMS Alerts'],['push_notifications','Push Notifications'],['weekly_reports','Weekly Reports']].map(([k, l]) => (
                <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: '1px solid rgba(37,99,235,0.06)' }}>
                  <Typography variant="body2" sx={{ color: '#1e293b' }}>{l}</Typography>
                  <Switch checked={settings.notifications[k]} onChange={e => setN(k, e.target.checked)} size="small" sx={switchSx} />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
        {/* Preferences */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}><Palette sx={{ color: '#2563eb', fontSize: 20 }} /><Typography variant="h6" sx={{ fontWeight: 700 }}>Preferences</Typography></Box>
              {[['language','Language',[['en','English'],['es','Spanish'],['fr','French'],['de','German']]],['timezone','Timezone',[['UTC','UTC'],['EST','Eastern'],['PST','Pacific'],['GMT','GMT']]],['date_format','Date Format',[['MM/DD/YYYY','MM/DD/YYYY'],['DD/MM/YYYY','DD/MM/YYYY'],['YYYY-MM-DD','YYYY-MM-DD']]]].map(([k, l, opts]) => (
                <FormControl key={k} fullWidth sx={{ mb: 2, ...inputSx }}><InputLabel>{l}</InputLabel><Select value={settings.preferences[k]} onChange={e => setPr(k, e.target.value)} label={l}>{opts.map(([v, lbl]) => <MenuItem key={v} value={v}>{lbl}</MenuItem>)}</Select></FormControl>
              ))}
            </CardContent>
          </Card>
        </Grid>
        {/* Security */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}><Security sx={{ color: '#2563eb', fontSize: 20 }} /><Typography variant="h6" sx={{ fontWeight: 700 }}>Security</Typography></Box>
              <TextField fullWidth label="Session Timeout (minutes)" type="number" value={settings.security.session_timeout} onChange={e => setSec('session_timeout', parseInt(e.target.value))} sx={{ mb: 2, ...inputSx }} />
              {[['two_factor_auth','Two-Factor Authentication'],['login_notifications','Login Notifications']].map(([k, l]) => (
                <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: '1px solid rgba(37,99,235,0.06)' }}>
                  <Typography variant="body2" sx={{ color: '#1e293b' }}>{l}</Typography>
                  <Switch checked={settings.security[k]} onChange={e => setSec(k, e.target.checked)} size="small" sx={switchSx} />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
        {/* Account */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Account Information</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, background: 'rgba(37,99,235,0.05)', borderRadius: 2, border: '1px solid rgba(37,99,235,0.1)' }}>
                <Avatar sx={{ width: 48, height: 48, background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', color: '#f0f4f8', fontWeight: 800, fontSize: '1.2rem' }}>{user?.name?.charAt(0)?.toUpperCase()}</Avatar>
                <Box><Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>{user?.name}</Typography><Typography variant="caption" sx={{ color: '#2563eb' }}>{user?.role}</Typography></Box>
              </Box>
              {[['Username', user?.username],['Email', user?.email]].map(([l, v]) => (
                <TextField key={l} fullWidth label={l} value={v || ''} margin="normal" disabled sx={inputSx} />
              ))}
              <Box sx={{ mt: 2 }}><Chip label={user?.activitystatus ? 'Account Active' : 'Account Inactive'} size="small" sx={{ background: user?.activitystatus ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: user?.activitystatus ? '#10b981' : '#ef4444', border: `1px solid ${user?.activitystatus ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, fontWeight: 700 }} /></Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}