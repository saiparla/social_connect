import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, IconButton, Grid, CircularProgress, Alert, TextField, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Tooltip, Avatar } from '@mui/material';
import { Add, Edit, Delete, Search, Refresh, Close } from '@mui/icons-material';
import { useAuth, api } from '../context/AuthContext';
import Swal from 'sweetalert2';

const swal = { background: '#f8fafc', color: '#1e293b', confirmButtonColor: '#2563eb' };
const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px', background: '#f8fafc', color: '#1e293b', '& fieldset': { borderColor: 'rgba(37,99,235,0.2)' }, '&:hover fieldset': { borderColor: 'rgba(37,99,235,0.4)' }, '&.Mui-focused fieldset': { borderColor: '#2563eb', borderWidth: '1.5px' } }, '& .MuiInputLabel-root': { color: '#64748b' }, '& .MuiInputLabel-root.Mui-focused': { color: '#2563eb' }, '& input': { color: '#1e293b' }, '& .MuiSvgIcon-root': { color: '#64748b' } };

const STATUS = { new: { color: '#2563eb', bg: 'rgba(37,99,235,0.1)', border: 'rgba(37,99,235,0.25)' }, contacted: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' }, converted: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' } };

export default function LeadsPage() {
  const { hasPermission } = useAuth();
  const [leads, setLeads]       = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [open, setOpen]         = useState(false);
  const [editing, setEditing]   = useState(null);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ name: '', email: '', phone: '', campaign_id: '', status: 'new' });

  const canCreate = hasPermission('leads', 'Create');
  const canEdit   = hasPermission('leads', 'Update');
  const canDelete = hasPermission('leads', 'Delete');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [lr, cr] = await Promise.allSettled([api.get('/api/v1/leads'), api.get('/api/v1/campaigns')]);
    if (lr.status === 'fulfilled') setLeads(lr.value.data.leads || []);
    if (cr.status === 'fulfilled') setCampaigns(cr.value.data.campaigns || []);
    if (lr.status === 'rejected') setError('Failed to load leads');
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openCreate = () => { setEditing(null); setForm({ name: '', email: '', phone: '', campaign_id: '', status: 'new' }); setOpen(true); };
  const openEdit   = (l) => { setEditing(l); setForm({ name: l.name, email: l.email, phone: l.phone || '', campaign_id: l.campaign_id || '', status: l.status }); setOpen(true); };

  const save = async () => {
    setSaving(true);
    try {
      editing ? await api.put(`/api/v1/leads/${editing.id}`, form) : await api.post('/api/v1/leads', form);
      setOpen(false); await fetchAll();
    } catch (e) { Swal.fire({ title: 'Error', text: e.response?.data?.detail || 'Save failed', icon: 'error', ...swal }); }
    finally { setSaving(false); }
  };

  const del = async (lead) => {
    const r = await Swal.fire({ title: 'Delete Lead?', text: `Delete "${lead.name}"?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#0284c7', confirmButtonText: 'Delete', ...swal });
    if (r.isConfirmed) {
      try { await api.delete(`/api/v1/leads/${lead.id}`); setLeads(p => p.filter(l => l.id !== lead.id)); }
      catch (e) { Swal.fire({ title: 'Error', text: e.response?.data?.detail || 'Delete failed', icon: 'error', ...swal }); }
    }
  };

  const changeStatus = async (lead, status) => {
    try { await api.put(`/api/v1/leads/${lead.id}`, { status }); setLeads(p => p.map(l => l.id === lead.id ? { ...l, status } : l)); }
    catch { /* silent */ }
  };

  const filtered = leads.filter(l => l.name?.toLowerCase().includes(search.toLowerCase()) || l.email?.toLowerCase().includes(search.toLowerCase()));
  const s = (st) => STATUS[st] || { color: '#64748b', bg: 'rgba(123,167,194,0.1)', border: 'rgba(123,167,194,0.2)' };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, background: 'linear-gradient(135deg, #1e293b 30%, #2563eb 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Leads</Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>{leads.length} total leads</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh"><IconButton onClick={fetchAll} disabled={loading} sx={{ color: '#64748b', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 2, '&:hover': { color: '#2563eb' } }}><Refresh fontSize="small" /></IconButton></Tooltip>
          {canCreate && <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ borderRadius: 2 }}>Add Lead</Button>}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={2} mb={3}>
        {[{ l: 'Total', c: leads.length, clr: '#2563eb' }, { l: 'New', c: leads.filter(l => l.status === 'new').length, clr: '#2563eb' }, { l: 'Contacted', c: leads.filter(l => l.status === 'contacted').length, clr: '#f59e0b' }, { l: 'Converted', c: leads.filter(l => l.status === 'converted').length, clr: '#10b981' }].map(({ l, c, clr }) => (
          <Grid item xs={6} sm={3} key={l}><Card><CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}><Typography variant="caption" sx={{ color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.68rem', fontWeight: 700 }}>{l}</Typography><Typography variant="h4" sx={{ color: clr, fontWeight: 800, mt: 0.5 }}>{c}</Typography></CardContent></Card></Grid>
        ))}
      </Grid>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Lead List</Typography>
            <TextField size="small" placeholder="Search leads…" value={search} onChange={e => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: '#64748b', fontSize: '1rem' }} /></InputAdornment> }}
              sx={{ width: 240, ...inputSx }} />
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: '#2563eb' }} /></Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>{['Name', 'Email', 'Phone', 'Status', 'Campaign', 'Actions'].map(h => <TableCell key={h}>{h}</TableCell>)}</TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: '#64748b' }}>{search ? 'No leads match your search' : 'No leads yet'}</TableCell></TableRow>
                  ) : filtered.map(lead => (
                    <TableRow key={lead.id} sx={{ '&:hover': { background: 'rgba(37,99,235,0.03)' }, '&:last-child td': { border: 0 } }}>
                      <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><Avatar sx={{ width: 30, height: 30, fontSize: '0.75rem', background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', color: '#f0f4f8', fontWeight: 800 }}>{lead.name?.charAt(0)?.toUpperCase()}</Avatar><Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>{lead.name}</Typography></Box></TableCell>
                      <TableCell><Typography variant="body2" sx={{ color: '#64748b' }}>{lead.email}</Typography></TableCell>
                      <TableCell><Typography variant="body2" sx={{ color: '#64748b' }}>{lead.phone || '—'}</Typography></TableCell>
                      <TableCell>
                        {canEdit ? (
                          <Select value={lead.status} onChange={e => changeStatus(lead, e.target.value)} size="small" sx={{ borderRadius: 2, fontSize: '0.75rem', color: s(lead.status).color, '& .MuiOutlinedInput-notchedOutline': { borderColor: s(lead.status).border }, '& .MuiSvgIcon-root': { color: '#64748b' }, background: s(lead.status).bg }}>
                            <MenuItem value="new">New</MenuItem><MenuItem value="contacted">Contacted</MenuItem><MenuItem value="converted">Converted</MenuItem>
                          </Select>
                        ) : (
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 1.5, py: 0.4, borderRadius: 20, background: s(lead.status).bg, border: `1px solid ${s(lead.status).border}` }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: s(lead.status).color, mr: 0.75 }} />
                            <Typography variant="caption" sx={{ color: s(lead.status).color, fontWeight: 700, textTransform: 'capitalize', fontSize: '0.72rem' }}>{lead.status}</Typography>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell><Typography variant="body2" sx={{ color: '#64748b' }}>{lead.campaign_id || '—'}</Typography></TableCell>
                      <TableCell>
                        {canEdit   && <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(lead)} sx={{ color: '#64748b', '&:hover': { color: '#2563eb' } }}><Edit fontSize="small" /></IconButton></Tooltip>}
                        {canDelete && <Tooltip title="Delete"><IconButton size="small" onClick={() => del(lead)} sx={{ color: '#64748b', '&:hover': { color: '#ef4444' } }}><Delete fontSize="small" /></IconButton></Tooltip>}
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
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{editing ? 'Edit Lead' : 'Add New Lead'}</Typography>
          <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: '#64748b' }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {[['name','Full Name','text',true],['email','Email Address','email',true],['phone','Phone Number','tel',false]].map(([n,l,t,req]) => (
              <TextField key={n} fullWidth label={l} type={t} required={req} value={form[n]} onChange={e => setForm(p => ({ ...p, [n]: e.target.value }))} sx={inputSx} />
            ))}
            <FormControl fullWidth sx={inputSx}><InputLabel>Campaign</InputLabel><Select value={form.campaign_id} onChange={e => setForm(p => ({ ...p, campaign_id: e.target.value }))} label="Campaign"><MenuItem value=""><em>None</em></MenuItem>{campaigns.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}</Select></FormControl>
            <FormControl fullWidth sx={inputSx}><InputLabel>Status</InputLabel><Select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} label="Status"><MenuItem value="new">New</MenuItem><MenuItem value="contacted">Contacted</MenuItem><MenuItem value="converted">Converted</MenuItem></Select></FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: '#64748b', borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving} sx={{ borderRadius: 2, minWidth: 100 }}>
            {saving ? <CircularProgress size={20} sx={{ color: '#f0f4f8' }} /> : editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
