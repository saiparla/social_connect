import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, IconButton, Grid, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Tooltip, Chip } from '@mui/material';
import { Add, Edit, Delete, Refresh, Close, Schedule, CheckCircle, RadioButtonUnchecked, Alarm } from '@mui/icons-material';
import { useAuth, api } from '../context/AuthContext';
import Swal from 'sweetalert2';

const swal = { background: '#f8fafc', color: '#1e293b', confirmButtonColor: '#2563eb' };
const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px', background: '#f8fafc', color: '#1e293b', '& fieldset': { borderColor: 'rgba(37,99,235,0.2)' }, '&:hover fieldset': { borderColor: 'rgba(37,99,235,0.4)' }, '&.Mui-focused fieldset': { borderColor: '#2563eb', borderWidth: '1.5px' } }, '& .MuiInputLabel-root': { color: '#64748b' }, '& .MuiInputLabel-root.Mui-focused': { color: '#2563eb' }, '& input, & input[type=date], & input[type=time]': { color: '#1e293b', colorScheme: 'light' }, '& .MuiSvgIcon-root': { color: '#64748b' } };
const STATUS  = { completed: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' }, scheduled: { color: '#2563eb', bg: 'rgba(37,99,235,0.1)', border: 'rgba(37,99,235,0.25)' }, pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' } };
const PRIORITY = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };

export default function SchedulerPage() {
  const { hasPermission } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [open, setOpen]           = useState(false);
  const [editing, setEditing]     = useState(null);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState({ task_name: '', campaign_id: '', scheduled_date: '', scheduled_time: '', priority: 'medium' });

  const canCreate = hasPermission('scheduler', 'Create');
  const canEdit   = hasPermission('scheduler', 'Update');
  const canDelete = hasPermission('scheduler', 'Delete');

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/api/v1/scheduler'); setSchedules(r.data.schedules || []); }
    catch { setError('Failed to load schedules'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openCreate = () => { setEditing(null); setForm({ task_name: '', campaign_id: '', scheduled_date: '', scheduled_time: '', priority: 'medium' }); setOpen(true); };
  const openEdit   = (s) => { setEditing(s); setForm({ task_name: s.task_name, campaign_id: s.campaign_id, scheduled_date: s.scheduled_date, scheduled_time: s.scheduled_time, priority: s.priority }); setOpen(true); };

  const save = async () => {
    setSaving(true);
    try {
      editing ? await api.put(`/api/v1/scheduler/${editing.id}`, form) : await api.post('/api/v1/scheduler', form);
      setOpen(false); await fetch();
    } catch (e) { Swal.fire({ title: 'Error', text: e.response?.data?.detail || 'Save failed', icon: 'error', ...swal }); }
    finally { setSaving(false); }
  };

  const del = async (s) => {
    const r = await Swal.fire({ title: 'Delete Task?', text: `Delete "${s.task_name}"?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#0284c7', confirmButtonText: 'Delete', ...swal });
    if (r.isConfirmed) {
      try { await api.delete(`/api/v1/scheduler/${s.id}`); setSchedules(p => p.filter(x => x.id !== s.id)); }
      catch (e) { Swal.fire({ title: 'Error', text: e.response?.data?.detail || 'Delete failed', icon: 'error', ...swal }); }
    }
  };

  const st = (status) => STATUS[status] || STATUS.pending;
  const counts = { total: schedules.length, completed: schedules.filter(s => s.status === 'completed').length, pending: schedules.filter(s => s.status === 'pending').length, scheduled: schedules.filter(s => s.status === 'scheduled').length };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box><Typography variant="h4" sx={{ fontWeight: 800, background: 'linear-gradient(135deg, #1e293b 30%, #2563eb 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Scheduler</Typography><Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>Manage campaign tasks and schedules</Typography></Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh"><IconButton onClick={fetch} disabled={loading} sx={{ color: '#64748b', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 2 }}><Refresh fontSize="small" /></IconButton></Tooltip>
          {canCreate && <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ borderRadius: 2 }}>Add Task</Button>}
        </Box>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Grid container spacing={2} mb={3}>
        {[{ l: 'Total Tasks', c: counts.total, clr: '#2563eb', icon: <Schedule /> }, { l: 'Completed', c: counts.completed, clr: '#10b981', icon: <CheckCircle /> }, { l: 'Pending', c: counts.pending, clr: '#f59e0b', icon: <Alarm /> }, { l: 'Scheduled', c: counts.scheduled, clr: '#06b6d4', icon: <RadioButtonUnchecked /> }].map(({ l, c, clr, icon }) => (
          <Grid item xs={6} sm={3} key={l}><Card><CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}><Typography variant="caption" sx={{ color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.68rem', fontWeight: 700 }}>{l}</Typography>{React.cloneElement(icon, { sx: { color: clr, opacity: 0.6, fontSize: '1.1rem' } })}</Box><Typography variant="h4" sx={{ color: clr, fontWeight: 800 }}>{c}</Typography></CardContent></Card></Grid>
        ))}
      </Grid>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5 }}>Scheduled Tasks</Typography>
          {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: '#2563eb' }} /></Box> : (
            <TableContainer>
              <Table>
                <TableHead><TableRow>{['Task Name','Campaign','Date','Time','Status','Priority','Actions'].map(h => <TableCell key={h}>{h}</TableCell>)}</TableRow></TableHead>
                <TableBody>
                  {schedules.length === 0 ? <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: '#64748b' }}>No tasks scheduled yet</TableCell></TableRow>
                  : schedules.map(s => (
                    <TableRow key={s.id} sx={{ '&:hover': { background: 'rgba(37,99,235,0.03)' }, '&:last-child td': { border: 0 } }}>
                      <TableCell><Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>{s.task_name}</Typography></TableCell>
                      <TableCell><Typography variant="body2" sx={{ color: '#64748b' }}>{s.campaign_id || '—'}</Typography></TableCell>
                      <TableCell><Typography variant="body2" sx={{ color: '#64748b' }}>{s.scheduled_date ? new Date(s.scheduled_date).toLocaleDateString() : '—'}</Typography></TableCell>
                      <TableCell><Typography variant="body2" sx={{ color: '#64748b' }}>{s.scheduled_time || '—'}</Typography></TableCell>
                      <TableCell><Box sx={{ display: 'inline-flex', alignItems: 'center', px: 1.5, py: 0.4, borderRadius: 20, background: st(s.status).bg, border: `1px solid ${st(s.status).border}` }}><Box sx={{ width: 6, height: 6, borderRadius: '50%', background: st(s.status).color, mr: 0.75 }} /><Typography variant="caption" sx={{ color: st(s.status).color, fontWeight: 700, textTransform: 'capitalize', fontSize: '0.72rem' }}>{s.status}</Typography></Box></TableCell>
                      <TableCell><Box sx={{ display: 'inline-flex', alignItems: 'center', px: 1.5, py: 0.4, borderRadius: 20, background: `${PRIORITY[s.priority] || '#64748b'}18`, border: `1px solid ${PRIORITY[s.priority] || '#64748b'}40` }}><Typography variant="caption" sx={{ color: PRIORITY[s.priority] || '#64748b', fontWeight: 700, textTransform: 'capitalize', fontSize: '0.72rem' }}>{s.priority}</Typography></Box></TableCell>
                      <TableCell>
                        {canEdit   && <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(s)} sx={{ color: '#64748b', '&:hover': { color: '#2563eb' } }}><Edit fontSize="small" /></IconButton></Tooltip>}
                        {canDelete && <Tooltip title="Delete"><IconButton size="small" onClick={() => del(s)} sx={{ color: '#64748b', '&:hover': { color: '#ef4444' } }}><Delete fontSize="small" /></IconButton></Tooltip>}
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
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{editing ? 'Edit Task' : 'New Task'}</Typography>
          <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: '#64748b' }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField fullWidth label="Task Name" required value={form.task_name} onChange={e => setForm(p => ({ ...p, task_name: e.target.value }))} sx={inputSx} />
            <TextField fullWidth label="Campaign ID" value={form.campaign_id} onChange={e => setForm(p => ({ ...p, campaign_id: e.target.value }))} sx={inputSx} />
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField fullWidth label="Date" type="date" InputLabelProps={{ shrink: true }} value={form.scheduled_date} onChange={e => setForm(p => ({ ...p, scheduled_date: e.target.value }))} sx={inputSx} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Time" type="time" InputLabelProps={{ shrink: true }} value={form.scheduled_time} onChange={e => setForm(p => ({ ...p, scheduled_time: e.target.value }))} sx={inputSx} /></Grid>
            </Grid>
            <FormControl fullWidth sx={inputSx}><InputLabel>Priority</InputLabel><Select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} label="Priority"><MenuItem value="high">High</MenuItem><MenuItem value="medium">Medium</MenuItem><MenuItem value="low">Low</MenuItem></Select></FormControl>
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