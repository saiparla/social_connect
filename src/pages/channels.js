import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, IconButton, Grid, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Tooltip, LinearProgress } from '@mui/material';
import { Add, Edit, Delete, Refresh, Close } from '@mui/icons-material';
import { useAuth, api } from '../context/AuthContext';
import Swal from 'sweetalert2';

const swal = { background: '#f8fafc', color: '#1e293b', confirmButtonColor: '#2563eb' };
const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px', background: '#f8fafc', color: '#1e293b', '& fieldset': { borderColor: 'rgba(37,99,235,0.2)' }, '&:hover fieldset': { borderColor: 'rgba(37,99,235,0.4)' }, '&.Mui-focused fieldset': { borderColor: '#2563eb', borderWidth: '1.5px' } }, '& .MuiInputLabel-root': { color: '#64748b' }, '& .MuiInputLabel-root.Mui-focused': { color: '#2563eb' }, '& input': { color: '#1e293b' }, '& .MuiSvgIcon-root': { color: '#64748b' } };

const CHANNEL_ICONS = { facebook: '📘', instagram: '📷', linkedin: '💼', twitter: '🐦', tiktok: '🎵' };
const connStatus = (c, a) => c && a ? { color: '#10b981', label: 'Active' } : c ? { color: '#f59e0b', label: 'Inactive' } : { color: '#ef4444', label: 'Disconnected' };

export default function ChannelsPage() {
  const { hasPermission } = useAuth();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [open, setOpen]         = useState(false);
  const [editing, setEditing]   = useState(null);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ name: '', connected: false, active: false, followers: 0 });

  const canCreate = hasPermission('channels', 'Create');
  const canEdit   = hasPermission('channels', 'Update');
  const canDelete = hasPermission('channels', 'Delete');

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/api/v1/channels'); setChannels(r.data.channels || []); }
    catch { setError('Failed to load channels'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openCreate = () => { setEditing(null); setForm({ name: '', connected: false, active: false, followers: 0 }); setOpen(true); };
  const openEdit   = (c) => { setEditing(c); setForm({ name: c.name, connected: c.connected, active: c.active, followers: c.followers }); setOpen(true); };

  const save = async () => {
    setSaving(true);
    try {
      editing ? await api.put(`/api/v1/channels/${editing.id}`, form) : await api.post('/api/v1/channels', form);
      setOpen(false); await fetch();
    } catch (e) { Swal.fire({ title: 'Error', text: e.response?.data?.detail || 'Save failed', icon: 'error', ...swal }); }
    finally { setSaving(false); }
  };

  const del = async (c) => {
    const r = await Swal.fire({ title: 'Delete Channel?', text: `Delete "${c.name}"?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#0284c7', confirmButtonText: 'Delete', ...swal });
    if (r.isConfirmed) {
      try { await api.delete(`/api/v1/channels/${c.id}`); setChannels(p => p.filter(x => x.id !== c.id)); }
      catch (e) { Swal.fire({ title: 'Error', text: e.response?.data?.detail || 'Delete failed', icon: 'error', ...swal }); }
    }
  };

  const toggleConnect = async (c) => {
    const path = c.connected ? `/api/v1/channels/${c.id}/disconnect` : `/api/v1/channels/${c.id}/connect`;
    try { await api.post(path, {}); setChannels(p => p.map(x => x.id === c.id ? { ...x, connected: !c.connected, active: !c.connected } : x)); }
    catch { /* silent */ }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box><Typography variant="h4" sx={{ fontWeight: 800, background: 'linear-gradient(135deg, #1e293b 30%, #2563eb 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Channels</Typography><Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>{channels.filter(c => c.connected).length} of {channels.length} connected</Typography></Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh"><IconButton onClick={fetch} disabled={loading} sx={{ color: '#64748b', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 2 }}><Refresh fontSize="small" /></IconButton></Tooltip>
          {canCreate && <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ borderRadius: 2 }}>Add Channel</Button>}
        </Box>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Grid container spacing={2} mb={3}>
        {[{ l: 'Total', c: channels.length, clr: '#2563eb' }, { l: 'Connected', c: channels.filter(x => x.connected).length, clr: '#10b981' }, { l: 'Active', c: channels.filter(x => x.active).length, clr: '#10b981' }, { l: 'Total Followers', c: channels.reduce((s, x) => s + (x.followers || 0), 0).toLocaleString(), clr: '#06b6d4' }].map(({ l, c, clr }) => (
          <Grid item xs={6} sm={3} key={l}><Card><CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}><Typography variant="caption" sx={{ color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.68rem', fontWeight: 700 }}>{l}</Typography><Typography variant="h4" sx={{ color: clr, fontWeight: 800, mt: 0.5 }}>{c}</Typography></CardContent></Card></Grid>
        ))}
      </Grid>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5 }}>Channel List</Typography>
          {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: '#2563eb' }} /></Box> : (
            <TableContainer>
              <Table>
                <TableHead><TableRow>{['Channel','Status','Followers','Created By','Actions'].map(h => <TableCell key={h}>{h}</TableCell>)}</TableRow></TableHead>
                <TableBody>
                  {channels.length === 0 ? <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6, color: '#64748b' }}>No channels yet</TableCell></TableRow>
                  : channels.map(c => {
                    const st = connStatus(c.connected, c.active);
                    return (
                      <TableRow key={c.id} sx={{ '&:hover': { background: 'rgba(37,99,235,0.03)' }, '&:last-child td': { border: 0 } }}>
                        <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><Typography sx={{ fontSize: '1.4rem' }}>{CHANNEL_ICONS[c.name?.toLowerCase()] || '📱'}</Typography><Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', textTransform: 'capitalize' }}>{c.name}</Typography></Box></TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 1.5, py: 0.4, borderRadius: 20, background: `${st.color}18`, border: `1px solid ${st.color}40` }}>
                              <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: st.color, mr: 0.75 }} />
                              <Typography variant="caption" sx={{ color: st.color, fontWeight: 700, fontSize: '0.72rem' }}>{st.label}</Typography>
                            </Box>
                            {canEdit && <Button size="small" variant="outlined" onClick={() => toggleConnect(c)} sx={{ fontSize: '0.65rem', py: 0.25, px: 1, borderColor: 'rgba(37,99,235,0.25)', color: '#2563eb', borderRadius: 1, minWidth: 0 }}>{c.connected ? 'Disconnect' : 'Connect'}</Button>}
                          </Box>
                        </TableCell>
                        <TableCell><Typography variant="body2" sx={{ color: '#2563eb', fontWeight: 700 }}>{(c.followers || 0).toLocaleString()}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ color: '#64748b' }}>{c.created_by || '—'}</Typography></TableCell>
                        <TableCell>
                          {canEdit   && <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(c)} sx={{ color: '#64748b', '&:hover': { color: '#2563eb' } }}><Edit fontSize="small" /></IconButton></Tooltip>}
                          {canDelete && <Tooltip title="Delete"><IconButton size="small" onClick={() => del(c)} sx={{ color: '#64748b', '&:hover': { color: '#ef4444' } }}><Delete fontSize="small" /></IconButton></Tooltip>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { background: '#ffffff', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{editing ? 'Edit Channel' : 'Add Channel'}</Typography>
          <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: '#64748b' }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField fullWidth label="Channel Name" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} sx={inputSx} />
            <TextField fullWidth label="Followers" type="number" value={form.followers} onChange={e => setForm(p => ({ ...p, followers: parseInt(e.target.value) || 0 }))} sx={inputSx} />
            <FormControl fullWidth sx={inputSx}><InputLabel>Connection Status</InputLabel><Select value={form.connected ? 'connected' : 'disconnected'} onChange={e => setForm(p => ({ ...p, connected: e.target.value === 'connected', active: e.target.value === 'connected' }))} label="Connection Status"><MenuItem value="disconnected">Disconnected</MenuItem><MenuItem value="connected">Connected</MenuItem></Select></FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: '#64748b', borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving} sx={{ borderRadius: 2, minWidth: 100 }}>{saving ? <CircularProgress size={20} sx={{ color: '#f0f4f8' }} /> : editing ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}