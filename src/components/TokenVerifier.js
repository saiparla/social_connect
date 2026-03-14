import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Button, Box, Alert, Chip, Divider, Grid, CircularProgress } from '@mui/material';
import { VerifiedUser as VerifiedIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useAuth, api } from '../context/AuthContext';

const TokenVerifier = () => {
  const { isAuthenticated } = useAuth();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const verify = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/api/v1/verify-token');
      if (res.data?.data) setData(res.data.data);
      else setError('Unexpected server response');
    } catch (e) {
      setError(e.response?.data?.detail || 'Verification failed');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (isAuthenticated) verify(); }, [isAuthenticated]);

  const roleColor = (r) => ({ super_admin: 'error', admin: 'warning', marketing_manager: 'info' }[r] || 'default');

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', mt: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>JWT Token Verification</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {loading && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}><CircularProgress size={18} /><Typography variant="body2">Verifying…</Typography></Box>}
          {data && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <VerifiedIcon color="success" />
                <Typography variant="h6" color="success.main">Token Valid</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {[['Name', data.name], ['Username', data.username], ['Email', data.email], ['Company', data.companyid]].map(([l, v]) => (
                  <Grid item xs={12} sm={6} key={l}>
                    <Typography variant="body2" color="textSecondary">{l}</Typography>
                    <Typography variant="body1" fontWeight="bold">{v || 'N/A'}</Typography>
                  </Grid>
                ))}
                <Grid item xs={6}><Typography variant="body2" color="textSecondary">Role</Typography><Chip label={data.role || 'N/A'} color={roleColor(data.role)} size="small" /></Grid>
                <Grid item xs={6}><Typography variant="body2" color="textSecondary">Status</Typography><Chip label={data.activitystatus ? 'Active' : 'Inactive'} color={data.activitystatus ? 'success' : 'error'} size="small" /></Grid>
              </Grid>
              {data.permissions && (
                <Box mt={3}>
                  <Typography variant="h6" gutterBottom>Permissions</Typography>
                  {Object.entries(data.permissions).map(([mod, perms]) => (
                    <Card key={mod} variant="outlined" sx={{ mb: 1 }}>
                      <CardContent sx={{ py: '12px !important' }}>
                        <Typography variant="subtitle2" sx={{ textTransform: 'capitalize', mb: 1 }}>{mod.replace('_', ' ')}</Typography>
                        <Grid container spacing={1}>
                          {Object.entries(perms).map(([action, allowed]) => (
                            <Grid item xs={6} sm={3} key={action}>
                              <Typography variant="caption" color="textSecondary">{action}</Typography>
                              <Chip label={allowed ? 'Yes' : 'No'} color={allowed ? 'success' : 'default'} size="small" sx={{ display: 'block', width: 'fit-content', mt: 0.25 }} />
                            </Grid>
                          ))}
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </>
          )}
          <Button fullWidth variant="contained" startIcon={<RefreshIcon />} onClick={verify} disabled={loading} sx={{ mt: 3 }}>
            {loading ? 'Verifying…' : 'Re-verify Token'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TokenVerifier;
