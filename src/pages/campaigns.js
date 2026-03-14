import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, IconButton, Grid, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Tooltip, Chip } from '@mui/material';
import { Add, Edit, Delete, Refresh, Close } from '@mui/icons-material';
import { useAuth, api } from '../context/AuthContext';
import Swal from 'sweetalert2';

const swal = { background: '#f8fafc', color: '#1e293b', confirmButtonColor: '#2563eb' };
const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px', background: '#f8fafc', color: '#1e293b', '& fieldset': { borderColor: 'rgba(37,99,235,0.2)' }, '&:hover fieldset': { borderColor: 'rgba(37,99,235,0.4)' }, '&.Mui-focused fieldset': { borderColor: '#2563eb', borderWidth: '1.5px' } }, '& .MuiInputLabel-root': { color: '#64748b' }, '& .MuiInputLabel-root.Mui-focused': { color: '#2563eb' }, '& input': { color: '#1e293b' }, '& .MuiSvgIcon-root': { color: '#64748b' } };

const STATUS = { active: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' }, draft: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' }, completed: { color: '#64748b', bg: 'rgba(123,167,194,0.1)', border: 'rgba(123,167,194,0.2)' } };
const StatusBadge = ({ status }) => { const s = STATUS[status] || STATUS.draft; return <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 1.5, py: 0.4, borderRadius: 20, background: s.bg, border: `1px solid ${s.border}` }}><Box sx={{ width: 6, height: 6, borderRadius: '50%', background: s.color, mr: 0.75 }} /><Typography variant="caption" sx={{ color: s.color, fontWeight: 700, textTransform: 'capitalize', fontSize: '0.72rem' }}>{status}</Typography></Box>; };

export default function CampaignsPage() {
  const { hasPermission } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [open, setOpen]           = useState(false);
  const [editing, setEditing]     = useState(null);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState({ name: '', status: 'draft' });

  const canCreate = hasPermission('campaigns', 'Create');
  const canEdit   = hasPermission('campaigns', 'Update');
  const canDelete = hasPermission('campaigns', 'Delete');

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/api/v1/campaigns'); setCampaigns(r.data.campaigns || []); }
    catch { setError('Failed to load campaigns'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openCreate = () => { setEditing(null); setForm({ name: '', status: 'draft' }); setOpen(true); };
  const openEdit   = (c) => { setEditing(c); setForm({ name: c.name, status: c.status }); setOpen(true); };

  const save = async () => {
    setSaving(true);
    try {
      editing ? await api.put(`/api/v1/campaigns/${editing.id}`, form) : await api.post('/api/v1/campaigns', form);
      setOpen(false); await fetch();
    } catch (e) { Swal.fire({ title: 'Error', text: e.response?.data?.detail || 'Save failed', icon: 'error', ...swal }); }
    finally { setSaving(false); }
  };

  const del = async (c) => {
    const r = await Swal.fire({ title: 'Delete Campaign?', text: `Delete "${c.name}"?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#0284c7', confirmButtonText: 'Delete', ...swal });
    if (r.isConfirmed) {
      try { await api.delete(`/api/v1/campaigns/${c.id}`); setCampaigns(p => p.filter(x => x.id !== c.id)); }
      catch (e) { Swal.fire({ title: 'Error', text: e.response?.data?.detail || 'Delete failed', icon: 'error', ...swal }); }
    }
  };

  const summary = [
    { l: 'Total', c: campaigns.length, clr: '#2563eb' },
    { l: 'Active', c: campaigns.filter(x => x.status === 'active').length, clr: '#10b981' },
    { l: 'Draft', c: campaigns.filter(x => x.status === 'draft').length, clr: '#f59e0b' },
    { l: 'Total Leads', c: campaigns.reduce((s, x) => s + (x.leads || 0), 0), clr: '#06b6d4' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box><Typography variant="h4" sx={{ fontWeight: 800, background: 'linear-gradient(135deg, #1e293b 30%, #2563eb 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Campaigns</Typography><Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>{campaigns.length} campaigns</Typography></Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh"><IconButton onClick={fetch} disabled={loading} sx={{ color: '#64748b', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 2 }}><Refresh fontSize="small" /></IconButton></Tooltip>
          {canCreate && <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ borderRadius: 2 }}>New Campaign</Button>}
        </Box>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Grid container spacing={2} mb={3}>
        {summary.map(({ l, c, clr }) => (<Grid item xs={6} sm={3} key={l}><Card><CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}><Typography variant="caption" sx={{ color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.68rem', fontWeight: 700 }}>{l}</Typography><Typography variant="h4" sx={{ color: clr, fontWeight: 800, mt: 0.5 }}>{c}</Typography></CardContent></Card></Grid>))}
      </Grid>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5 }}>Campaign List</Typography>
          {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: '#2563eb' }} /></Box> : (
            <TableContainer>
              <Table>
                <TableHead><TableRow>{['Campaign Name','Status','Leads','Conversion Rate','Created By','Actions'].map(h => <TableCell key={h}>{h}</TableCell>)}</TableRow></TableHead>
                <TableBody>
                  {campaigns.length === 0 ? <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: '#64748b' }}>No campaigns yet</TableCell></TableRow>
                  : campaigns.map(c => (
                    <TableRow key={c.id} sx={{ '&:hover': { background: 'rgba(37,99,235,0.03)' }, '&:last-child td': { border: 0 } }}>
                      <TableCell><Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>{c.name}</Typography></TableCell>
                      <TableCell><StatusBadge status={c.status} /></TableCell>
                      <TableCell><Typography variant="body2" sx={{ color: '#2563eb', fontWeight: 700 }}>{c.leads || 0}</Typography></TableCell>
                      <TableCell><Typography variant="body2" sx={{ color: '#64748b' }}>{c.conversion_rate || 0}%</Typography></TableCell>
                      <TableCell><Typography variant="body2" sx={{ color: '#64748b' }}>{c.created_by || '—'}</Typography></TableCell>
                      <TableCell>
                        {canEdit   && <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(c)} sx={{ color: '#64748b', '&:hover': { color: '#2563eb' } }}><Edit fontSize="small" /></IconButton></Tooltip>}
                        {canDelete && <Tooltip title="Delete"><IconButton size="small" onClick={() => del(c)} sx={{ color: '#64748b', '&:hover': { color: '#ef4444' } }}><Delete fontSize="small" /></IconButton></Tooltip>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { background: '#ffffff', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{editing ? 'Edit Campaign' : 'New Campaign'}</Typography>
          <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: '#64748b' }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField fullWidth label="Campaign Name" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} sx={inputSx} />
            <FormControl fullWidth sx={inputSx}><InputLabel>Status</InputLabel><Select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} label="Status"><MenuItem value="draft">Draft</MenuItem><MenuItem value="active">Active</MenuItem><MenuItem value="completed">Completed</MenuItem></Select></FormControl>
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