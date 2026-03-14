import React, { useState } from 'react';
import { Box, Typography, TextField, Button, CircularProgress, InputAdornment, IconButton, Fade, Slide, Chip } from '@mui/material';
import { Visibility, VisibilityOff, LockOutlined, PersonOutline, AutoAwesome } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { api, setCookie } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

const LoginPage = () => {
  const { setAuthUser } = useAuth();
  const [form, setForm] = useState({ username: '', password: '', otp: '' });
  const [showOTP, setShowOTP]           = useState(false);
  const [showPass, setShowPass]         = useState(false);
  const [loading, setLoading]           = useState(false);

  const change = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) return;
    setLoading(true);

    try {
      const res = await api.post('/api/v1/login', form);

      if (res.data?.otp) {
        setLoading(false);
        setShowOTP(true);
        Swal.fire({ title: 'OTP Sent', text: 'Check your email for the OTP', icon: 'info', confirmButtonColor: '#2563eb', background: '#ffffff', color: '#1e293b' });
        return;
      }

      if (res.data?.access_token || res.data?.user) {
        const token = res.data.access_token;
        if (token) setCookie('token', token);

        let userData = res.data.user;
        if (token) {
          try {
            const verify = await api.get('/api/v1/verify-token', { headers: { Authorization: `Bearer ${token}` } });
            if (verify.data?.data) userData = verify.data.data;
          } catch { /* use res.data.user */ }
        }

        setAuthUser(userData, token);
        Swal.fire({
          title: `Welcome back!`,
          text: `Hello, ${userData?.name || form.username}`,
          icon: 'success',
          timer: 1200,
          showConfirmButton: false,
          background: '#ffffff',
          color: '#1e293b',
          iconColor: '#2563eb',
        });
        setTimeout(() => { window.location.hash = '/dashboard'; }, 1300);
      } else {
        throw new Error('Unexpected response');
      }
    } catch (err) {
      setLoading(false);
      Swal.fire({
        title: 'Login Failed',
        text: err.response?.data?.detail || err.response?.data?.message || 'Invalid credentials',
        icon: 'error',
        confirmButtonText: 'Try Again',
        confirmButtonColor: '#2563eb',
        background: '#ffffff',
        color: '#1e293b',
      });
    }
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '10px',
      background: '#f8fafc',
      color: '#1e293b',
      '& fieldset': { borderColor: 'rgba(37,99,235,0.20)' },
      '&:hover fieldset': { borderColor: 'rgba(37,99,235,0.45)' },
      '&.Mui-focused fieldset': { borderColor: '#2563eb', borderWidth: '1.5px' },
    },
    '& .MuiInputLabel-root': { color: '#64748b' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#2563eb' },
    '& input': { color: '#1e293b' },
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: '#f0f4f8' }}>

      {/* Left decorative panel */}
      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        width: '45%',
        position: 'relative',
        overflow: 'hidden',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #0ea5e9 100%)',
        p: 6,
      }}>
        {/* Decorative circles */}
        <Box sx={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <Box sx={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <Box sx={{ position: 'absolute', top: '30%', left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, justifyContent: 'center' }}>
            <Box sx={{ width: 48, height: 48, borderRadius: '14px', background: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AutoAwesome sx={{ color: '#fff', fontSize: 24 }} />
            </Box>
            <Typography sx={{ fontFamily: "'Cookie', cursive", fontSize: '2.4rem', color: '#fff', lineHeight: 1 }}>
              Social Connect
            </Typography>
          </Box>
          <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'Nunito, sans-serif', fontSize: '1rem', lineHeight: 1.8, mb: 4 }}>
            Manage your leads, campaigns, and<br />social channels — all from one place.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Leads', 'Campaigns', 'Analytics', 'Channels', 'Scheduler'].map(tag => (
              <Box key={tag} sx={{ px: 2, py: 0.5, borderRadius: 20, border: '1px solid rgba(255,255,255,0.30)', background: 'rgba(255,255,255,0.12)' }}>
                <Typography variant="caption" sx={{ color: '#fff', fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>{tag}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Right form panel */}
      <Fade in timeout={700}>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: { xs: 3, md: 6 }, background: '#ffffff' }}>
          <Box sx={{ width: '100%', maxWidth: 420 }}>
            {/* Mobile logo */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1, mb: 5, justifyContent: 'center' }}>
              <AutoAwesome sx={{ color: '#2563eb' }} />
              <Typography sx={{ fontFamily: "'Cookie', cursive", fontSize: '2.2rem', color: '#1e293b' }}>Social Connect</Typography>
            </Box>

            {/* Heading */}
            <Typography variant="h5" sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, color: '#1e293b', mb: 0.5 }}>
              Sign in to your account
            </Typography>
            <Box sx={{ height: 3, width: 40, background: 'linear-gradient(90deg, #2563eb, transparent)', borderRadius: 2, mb: 3 }} />
            <Typography variant="body2" sx={{ color: '#64748b', mb: 4, fontFamily: 'Nunito, sans-serif' }}>
              Enter your credentials to continue
            </Typography>

            <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                fullWidth label="Username" name="username"
                placeholder="Enter username" onChange={change} value={form.username}
                autoComplete="username"
                InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutline sx={{ color: '#94a3b8', fontSize: '1.1rem' }} /></InputAdornment> }}
                sx={inputSx}
              />

              <TextField
                fullWidth label="Password" name="password"
                type={showPass ? 'text' : 'password'}
                placeholder="Enter password" onChange={change} value={form.password}
                autoComplete="current-password"
                InputProps={{
                  startAdornment: <InputAdornment position="start"><LockOutlined sx={{ color: '#94a3b8', fontSize: '1.1rem' }} /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPass(v => !v)} sx={{ color: '#94a3b8' }}>
                        {showPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={inputSx}
              />

              <Slide in={showOTP} direction="down" unmountOnExit>
                <TextField
                  fullWidth label="One-Time Password" name="otp"
                  placeholder="Enter OTP" onChange={change} value={form.otp}
                  inputProps={{ maxLength: 6, style: { letterSpacing: '0.4em', textAlign: 'center', fontSize: '1.1rem' } }}
                  sx={inputSx}
                />
              </Slide>

              <Box sx={{ textAlign: 'right', mt: -1 }}>
                <Link to="/forgot" style={{ textDecoration: 'none' }}>
                  <Typography variant="body2" sx={{ color: '#2563eb', fontFamily: 'Nunito, sans-serif', fontWeight: 600, '&:hover': { opacity: 0.8 } }}>
                    Forgot password?
                  </Typography>
                </Link>
              </Box>

              <Button
                type="submit" fullWidth disabled={loading}
                sx={{
                  py: 1.5, borderRadius: '10px',
                  background: loading ? 'rgba(37,99,235,0.25)' : 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
                  color: '#ffffff', fontFamily: 'Nunito, sans-serif', fontWeight: 800,
                  fontSize: '0.95rem', textTransform: 'none',
                  boxShadow: '0 4px 20px rgba(37,99,235,0.25)',
                  '&:hover': { background: 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)', boxShadow: '0 6px 24px rgba(37,99,235,0.35)' },
                }}
              >
                {loading ? <CircularProgress size={22} sx={{ color: '#2563eb' }} /> : showOTP ? 'Verify & Sign In' : 'Sign In'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Fade>
    </Box>
  );
};

export default LoginPage;
