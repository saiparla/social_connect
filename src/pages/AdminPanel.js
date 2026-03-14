import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import refreshService from '../services/refreshService';
import { useAuth, api } from '../context/AuthContext';
import Swal from 'sweetalert2';

const AdminPanel = () => {
  const { hasRole } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  const [companies, setCompanies] = useState([]);

  const [activeTab, setActiveTab] = useState(0);

  // Status filters
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [companyStatusFilter, setCompanyStatusFilter] = useState('all');

  const [userFormData, setUserFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    role: '',
  });

  const [openCompanyDialog, setOpenCompanyDialog] = useState(false);
  const [companyForm, setCompanyForm] = useState({
    name: '',
    companyId: '',
    adminEmail: '',
    adminUsername: '',
    subscription: 'noexpiry',
    startDate: '',
    endDate: '',
  });

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // ────────────────────────────────────────────────
  //                   API CALLS
  // ────────────────────────────────────────────────

  const fetchRoles = useCallback(async () => {
    try {
      setRolesLoading(true);
      const res = await api.get(`/api/v1/admin/roles`);
      const rolesData = res.data?.data?.roles || res.data?.roles || {};
      const allRoles = [...new Set([...Object.keys(rolesData), 'user', 'admin'])];
      setAvailableRoles(allRoles);
      if (!userFormData.role && allRoles.length) {
        setUserFormData((prev) => ({ ...prev, role: allRoles[0] }));
      }
    } catch (err) {
      const fallback = ['user', 'admin'];
      setAvailableRoles(fallback);
      setUserFormData((prev) => ({ ...prev, role: 'user' }));
    } finally {
      setRolesLoading(false);
    }
  }, [userFormData.role]);

  const fetchUsers = useCallback(async () => {
    try {
      let url = '/api/v1/admin/users';
      if (userStatusFilter !== 'all') url += `?status=${userStatusFilter}`;
      const res = await api.get(url);
      setUsers(res.data.users || []);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to fetch users', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [userStatusFilter]);

  const fetchCompanies = useCallback(async () => {
    try {
      let url = '/api/v1/admin/companies';
      if (companyStatusFilter !== 'all') url += `?status=${companyStatusFilter}`;
      const res = await api.get(url);
      setCompanies(res.data.companies || []);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to fetch companies', severity: 'error' });
    }
  }, [companyStatusFilter]);

  useEffect(() => {
    if (hasRole('admin') || hasRole('super_admin')) {
      fetchUsers();
      fetchRoles();
      fetchCompanies();
    }
  }, [hasRole, fetchUsers, fetchRoles, fetchCompanies, userStatusFilter, companyStatusFilter]);

  useEffect(() => {
    refreshService.onUserCreated(() => fetchUsers());
    refreshService.onAutoRefresh(() => fetchUsers());
  }, [fetchUsers]);

  // Auto-generate company ID when name changes
  useEffect(() => {
    if (companyForm.name) {
      const base = companyForm.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      const suffix = Math.random().toString(36).substring(2, 7);
      setCompanyForm((prev) => ({
        ...prev,
        companyId: `${base}-${suffix}`,
        adminUsername: prev.adminUsername || `${base}_admin`,
      }));
    }
  }, [companyForm.name]);

  // ────────────────────────────────────────────────
  //                   HANDLERS
  // ────────────────────────────────────────────────

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/api/v1/admin/users/${editingUser.id}`, userFormData);
      } else {
        await api.post(`/api/v1/admin/users`, userFormData);
      }
      setSnackbar({
        open: true,
        message: editingUser ? 'User updated' : 'User created',
        severity: 'success',
      });
      setOpenUserDialog(false);
      setEditingUser(null);
      setUserFormData({ username: '', email: '', password: '', name: '', role: availableRoles[0] || 'user' });
      fetchUsers();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || 'Failed to save user',
        severity: 'error',
      });
    }
  };

  const handleEditUser = (u) => {
    setEditingUser(u);
    setUserFormData({
      username: u.username,
      email: u.email,
      password: '',
      name: u.name,
      role: u.role,
    });
    setOpenUserDialog(true);
  };

  const handleDeactivateUser = async (id, name) => {
    const res = await Swal.fire({
      title: 'Deactivate?',
      text: `Deactivate ${name}?`,
      icon: 'warning',
      showCancelButton: true,
    });
    if (res.isConfirmed) {
      try {
        await api.delete(`/api/v1/admin/users/${id}`);
        setSnackbar({ open: true, message: 'User deactivated', severity: 'success' });
        fetchUsers();
      } catch (err) {
        setSnackbar({ open: true, message: 'Failed to deactivate', severity: 'error' });
      }
    }
  };

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: companyForm.name,
        companyId: companyForm.companyId,
        adminEmail: companyForm.adminEmail,
        adminUsername: companyForm.adminUsername,
        subscription: companyForm.subscription,
        startDate: companyForm.subscription !== 'noexpiry' ? companyForm.startDate : null,
        endDate: companyForm.subscription !== 'noexpiry' ? companyForm.endDate : null,
      };
      await api.post('/api/v1/admin/companies', payload);
      setSnackbar({ open: true, message: 'Company & admin user created', severity: 'success' });
      setOpenCompanyDialog(false);
      setCompanyForm({
        name: '',
        companyId: '',
        adminEmail: '',
        adminUsername: '',
        subscription: 'noexpiry',
        startDate: '',
        endDate: '',
      });
      fetchCompanies();
      fetchUsers();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || 'Failed to create company',
        severity: 'error',
      });
    }
  };

  const handleDeleteCompany = async (id, name) => {
    const res = await Swal.fire({
      title: 'Delete?',
      text: `Delete ${name}?`,
      icon: 'warning',
      showCancelButton: true,
    });
    if (res.isConfirmed) {
      try {
        await api.delete(`/api/v1/admin/companies/${id}`);
        setSnackbar({ open: true, message: 'Company deleted', severity: 'success' });
        fetchCompanies();
      } catch (err) {
        setSnackbar({ open: true, message: 'Failed to delete', severity: 'error' });
      }
    }
  };

  const getRoleColor = (role) =>
    role === 'super_admin' ? 'error' : role === 'admin' ? 'warning' : 'primary';

  if (!hasRole('admin') && !hasRole('super_admin')) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Access Denied</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#136aed', mb: 3 }}>
        Admin Panel
      </Typography> */}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Users" />
          <Tab label="Companies" />
        </Tabs>
      </Box>

      {/* USERS TAB */}
      {activeTab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#136aed' }}>
              User Management
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={userStatusFilter}
                  label="Status"
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  sx={{ borderRadius: 1 }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenUserDialog(true)}
                sx={{ backgroundColor: '#136aed', borderRadius: 1 }}
              >
                Create User
              </Button>
            </Box>
          </Box>

          <Card sx={{ borderRadius: 1 }}>
            <CardContent>
              <TableContainer component={Paper} sx={{ borderRadius: 1 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Username</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={6} align="center">Loading...</TableCell></TableRow>
                    ) : users.length === 0 ? (
                      <TableRow><TableCell colSpan={6} align="center">No users found</TableCell></TableRow>
                    ) : (
                      users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>{u.username}</TableCell>
                          <TableCell>{u.name}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>
                            <Chip label={u.role} color={getRoleColor(u.role)} size="small" />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={u.activitystatus ? 'Active' : 'Inactive'}
                              color={u.activitystatus ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton size="small" onClick={() => handleEditUser(u)} color="primary">
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeactivateUser(u.id, u.username)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* COMPANIES TAB */}
      {activeTab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#136aed' }}>
              Company Management
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={companyStatusFilter}
                  label="Status"
                  onChange={(e) => setCompanyStatusFilter(e.target.value)}
                  sx={{ borderRadius: 1 }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                startIcon={<BusinessIcon />}
                onClick={() => setOpenCompanyDialog(true)}
                sx={{ backgroundColor: '#136aed', borderRadius: 1 }}
              >
                Add Company
              </Button>
            </Box>
          </Box>

          <Card sx={{ borderRadius: 1 }}>
            <CardContent>
              <TableContainer component={Paper} sx={{ borderRadius: 1 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Company ID</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Admin Username</TableCell>
                      <TableCell>Subscription</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {companies.length === 0 ? (
                      <TableRow><TableCell colSpan={6} align="center">No companies found</TableCell></TableRow>
                    ) : (
                      companies.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>{c.companyId || c.id}</TableCell>
                          <TableCell>{c.name}</TableCell>
                          <TableCell>{c.adminUsername || '—'}</TableCell>
                          <TableCell>{c.subscription || 'No Expiry'}</TableCell>
                          <TableCell>
                            <Chip
                              label={c.status === 'active' ? 'Active' : 'Inactive'}
                              color={c.status === 'active' ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteCompany(c.id, c.name)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* User Dialog */}
      <Dialog open={openUserDialog} onClose={() => setOpenUserDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderRadius: '4px 4px 0 0' }}>
          {editingUser ? 'Edit User' : 'Create New User'}
        </DialogTitle>
        <form onSubmit={handleUserSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              label="Username"
              value={userFormData.username}
              onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
              margin="normal"
              required
              disabled={!!editingUser}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={userFormData.email}
              onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
              margin="normal"
              required
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={userFormData.password}
              onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
              margin="normal"
              required={!editingUser}
              placeholder={editingUser ? "Leave blank to keep current" : ""}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
            />
            <TextField
              fullWidth
              label="Full Name"
              value={userFormData.name}
              onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
              margin="normal"
              required
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Role</InputLabel>
              <Select
                value={userFormData.role}
                onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                disabled={rolesLoading}
                sx={{ borderRadius: 1 }}
              >
                {rolesLoading ? (
                  <MenuItem value="" disabled>Loading...</MenuItem>
                ) : (
                  availableRoles.map((r) => (
                    <MenuItem key={r} value={r}>
                      {r.replace(/_/g, ' ')}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setOpenUserDialog(false)} sx={{ borderRadius: 1 }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" sx={{ borderRadius: 1 }}>
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Company Dialog */}
      <Dialog
        open={openCompanyDialog}
        onClose={() => setOpenCompanyDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 1 } }}
      >
        <DialogTitle sx={{ borderRadius: '4px 4px 0 0' }}>Add New Company</DialogTitle>
        <form onSubmit={handleCompanySubmit}>
          <DialogContent sx={{ pb: 1 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', lg: 'row' },
                gap: 3,
                '& > *': { flex: 1 },
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  required
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                />
                <TextField
                  fullWidth
                  label="Company ID"
                  value={companyForm.companyId}
                  onChange={(e) => setCompanyForm({ ...companyForm, companyId: e.target.value })}
                  helperText="Auto-generated, editable"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                />
                <TextField
                  fullWidth
                  label="Admin Email"
                  type="email"
                  value={companyForm.adminEmail}
                  onChange={(e) => setCompanyForm({ ...companyForm, adminEmail: e.target.value })}
                  required
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Admin Username (optional)"
                  value={companyForm.adminUsername}
                  onChange={(e) => setCompanyForm({ ...companyForm, adminUsername: e.target.value })}
                  helperText="Auto-suggested if empty"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                />

                <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}>
                  <InputLabel>Subscription Duration</InputLabel>
                  <Select
                    value={companyForm.subscription}
                    label="Subscription Duration"
                    onChange={(e) => {
                      const newSub = e.target.value;
                      setCompanyForm((prev) => ({
                        ...prev,
                        subscription: newSub,
                        startDate: '',
                        endDate: '',
                      }));
                    }}
                  >
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="quarterly">Quarterly</MenuItem>
                    <MenuItem value="halfyearly">Half Yearly</MenuItem>
                    <MenuItem value="yearly">Yearly</MenuItem>
                    <MenuItem value="noexpiry">No Expiry</MenuItem>
                  </Select>
                </FormControl>

                {companyForm.subscription !== 'noexpiry' && (
                  <>
                    <TextField
                      fullWidth
                      label="Start Date"
                      type="date"
                      value={companyForm.startDate}
                      onChange={(e) => {
                        const start = e.target.value;
                        let end = '';
                        if (start) {
                          const d = new Date(start);
                          switch (companyForm.subscription) {
                            case 'monthly':
                              d.setMonth(d.getMonth() + 1);
                              break;
                            case 'quarterly':
                              d.setMonth(d.getMonth() + 3);
                              break;
                            case 'halfyearly':
                              d.setMonth(d.getMonth() + 6);
                              break;
                            case 'yearly':
                              d.setFullYear(d.getFullYear() + 1);
                              break;
                          }
                          end = d.toISOString().split('T')[0];
                        }
                        setCompanyForm((prev) => ({ ...prev, startDate: start, endDate: end }));
                      }}
                      InputLabelProps={{ shrink: true }}
                      required
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                    />

                    <TextField
                      fullWidth
                      label="End Date"
                      type="date"
                      value={companyForm.endDate}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ readOnly: true }}
                      helperText="Auto-calculated"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                    />
                  </>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
            <Button onClick={() => setOpenCompanyDialog(false)} sx={{ borderRadius: 1 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={
                !companyForm.name ||
                !companyForm.adminEmail ||
                (companyForm.subscription !== 'noexpiry' && (!companyForm.startDate || !companyForm.endDate))
              }
              sx={{ borderRadius: 1 }}
            >
              Create Company
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminPanel;