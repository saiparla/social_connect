import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Button, TextField, InputAdornment,
  Fade, CircularProgress, LinearProgress
} from '@mui/material';
import { Email, LockOutlined, AutoAwesome, CheckCircle } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import Swal from 'sweetalert2';

const ForgotPasswordPage = () => {
  const [step, setStep]         = useState(1); // 1=email, 2=otp, 3=password
  const [loading, setLoading]   = useState(false);
  const [payload, setPayload]   = useState({ email: '', otp: ['', '', '', ''], newPassword: '', confirmPassword: '' });
  const otpRefs                 = useRef([]);
  const navigate                = useNavigate();

  const swalConfig = { background: '#ffffff', color: '#1e293b', confirmButtonColor: '#2563eb' };

  const handler = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('otp-')) {
      const idx    = parseInt(name.split('-')[1]);
      const newOtp = [...payload.otp];
      newOtp[idx]  = value.slice(-1);
      setPayload({ ...payload, otp: newOtp });
      if (value && idx < 3) otpRefs.current[idx + 1]?.focus();
    } else {
      setPayload({ ...payload, [name]: value });
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !payload.otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const chars  = e.clipboardData.getData('text').slice(0, 4).split('');
    const newOtp = [...payload.otp];
    chars.forEach((c, i) => { if (i < 4) newOtp[i] = c; });
    setPayload({ ...payload, otp: newOtp });
    otpRefs.current[Math.min(chars.length, 3)]?.focus();
  };

  const handleSendEmail = async () => {
    if (!payload.email) return;
    setLoading(true);
    try {
      await api.post('/api/v1/forgot-password', { email: payload.email });
      Swal.fire({ title: 'OTP Sent', text: 'Check your email for the OTP', icon: 'success', timer: 1500, showConfirmButton: false, ...swalConfig });
      setStep(2);
    } catch (err) {
      Swal.fire({ title: 'Error', text: err.response?.data?.detail || 'Email not found', icon: 'error', ...swalConfig });
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async () => {
    const otp = payload.otp.join('');
    if (otp.length < 4) return;
    setLoading(true);
    try {
      await api.post('/api/v1/verify-otp', { email: payload.email, otp });
      Swal.fire({ title: 'OTP Verified', text: 'Set your new password', icon: 'success', timer: 1200, showConfirmButton: false, ...swalConfig });
      setStep(3);
    } catch (err) {
      Swal.fire({ title: 'Invalid OTP', text: 'Please check the code and try again', icon: 'error', ...swalConfig });
    } finally { setLoading(false); }
  };

  const handleResetPassword = async () => {
    if (payload.newPassword !== payload.confirmPassword) {
      Swal.fire({ title: 'Mismatch', text: 'Passwords do not match', icon: 'warning', ...swalConfig });
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/v1/reset-password', { email: payload.email, password: payload.newPassword });
      Swal.fire({ title: 'Password Reset!', text: 'You can now sign in', icon: 'success', timer: 1500, showConfirmButton: false, ...swalConfig });
      setTimeout(() => navigate('/'), 1600);
    } catch (err) {
      Swal.fire({ title: 'Error', text: err.response?.data?.detail || 'Reset failed', icon: 'error', ...swalConfig });
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (step === 2) setTimeout(() => otpRefs.current[0]?.focus(), 100);
  }, [step]);

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '10px', background: 'rgba(255,255,255,0.04)', color: '#1e293b',
      '& fieldset': { borderColor: 'rgba(37,99,235,0.2)' },
      '&:hover fieldset': { borderColor: 'rgba(37,99,235,0.5)' },
      '&.Mui-focused fieldset': { borderColor: '#2563eb', borderWidth: '1.5px' },
    },
    '& .MuiInputLabel-root': { color: '#64748b' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#2563eb' },
    '& input': { color: '#1e293b' },
  };

  const steps = ['Email', 'Verify OTP', 'New Password'];

  return (
    <Box sx={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 3 }}>
      <Fade in timeout={600}>
        <Box sx={{ width: '100%', maxWidth: 420 }}>

          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 5, justifyContent: 'center' }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AutoAwesome sx={{ fontSize: 18, color: '#f0f4f8' }} />
            </Box>
            <Typography sx={{ fontFamily: "'Cookie', cursive", fontSize: '2rem', color: '#1e293b', lineHeight: 1 }}>
              Social Connect
            </Typography>
          </Box>

          {/* Step indicator */}
          <Box sx={{ display: 'flex', gap: 1, mb: 4 }}>
            {steps.map((s, i) => (
              <Box key={i} sx={{ flex: 1 }}>
                <LinearProgress variant="determinate" value={step > i ? 100 : step === i + 1 ? 50 : 0}
                  sx={{ height: 3, borderRadius: 2, bgcolor: 'rgba(37,99,235,0.1)', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #0ea5e9, #2563eb)' } }} />
                <Typography variant="caption" sx={{ color: step > i ? '#2563eb' : '#64748b', fontFamily: 'Nunito, sans-serif', display: 'block', mt: 0.5, textAlign: 'center', fontSize: '0.65rem' }}>{s}</Typography>
              </Box>
            ))}
          </Box>

          {/* Card */}
          <Box sx={{ background: '#ffffff', boxShadow: '0 2px 16px rgba(30,41,59,0.08)', border: '1px solid rgba(37,99,235,0.1)', borderRadius: 3, p: 4, boxShadow: '0 4px 24px rgba(30,41,59,0.10)' }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', mb: 0.5, fontFamily: 'Nunito, sans-serif' }}>
              {step === 1 ? 'Forgot Password' : step === 2 ? 'Verify OTP' : 'New Password'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 3, fontFamily: 'Nunito, sans-serif' }}>
              {step === 1 ? 'Enter your email to receive an OTP' : step === 2 ? 'Enter the 4-digit code sent to your email' : 'Choose a strong new password'}
            </Typography>

            {/* Step 1 — Email */}
            {step === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField fullWidth label="Email Address" name="email" type="email"
                  value={payload.email} onChange={handler} placeholder="Enter your email"
                  InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: '#64748b', fontSize: '1.1rem' }} /></InputAdornment> }}
                  sx={inputSx} />
                <Button fullWidth variant="contained" onClick={handleSendEmail} disabled={loading || !payload.email}
                  sx={{ py: 1.5, borderRadius: '10px', background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', color: '#ffffff', fontFamily: 'Nunito, sans-serif', fontWeight: 800, textTransform: 'none' }}>
                  {loading ? <CircularProgress size={22} sx={{ color: '#f0f4f8' }} /> : 'Send OTP'}
                </Button>
              </Box>
            )}

            {/* Step 2 — OTP */}
            {step === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
                  {[0, 1, 2, 3].map(i => (
                    <TextField key={i} name={`otp-${i}`} value={payload.otp[i]}
                      onChange={handler} onKeyDown={e => handleKeyDown(e, i)}
                      onPaste={i === 0 ? handlePaste : undefined}
                      inputRef={el => otpRefs.current[i] = el}
                      inputProps={{ maxLength: 1, style: { textAlign: 'center', fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', padding: '12px 0' } }}
                      sx={{ width: 64, '& .MuiOutlinedInput-root': { borderRadius: '12px', background: 'rgba(37,99,235,0.06)', '& fieldset': { borderColor: payload.otp[i] ? '#2563eb' : 'rgba(37,99,235,0.2)' }, '&.Mui-focused fieldset': { borderColor: '#2563eb' } } }} />
                  ))}
                </Box>
                <Button fullWidth variant="contained" onClick={handleVerifyOTP} disabled={loading || payload.otp.join('').length < 4}
                  sx={{ py: 1.5, borderRadius: '10px', background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', color: '#ffffff', fontFamily: 'Nunito, sans-serif', fontWeight: 800, textTransform: 'none' }}>
                  {loading ? <CircularProgress size={22} sx={{ color: '#f0f4f8' }} /> : 'Verify OTP'}
                </Button>
              </Box>
            )}

            {/* Step 3 — New Password */}
            {step === 3 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField fullWidth label="New Password" name="newPassword" type="password"
                  value={payload.newPassword} onChange={handler}
                  InputProps={{ startAdornment: <InputAdornment position="start"><LockOutlined sx={{ color: '#64748b', fontSize: '1.1rem' }} /></InputAdornment> }}
                  sx={inputSx} />
                <TextField fullWidth label="Confirm Password" name="confirmPassword" type="password"
                  value={payload.confirmPassword} onChange={handler}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LockOutlined sx={{ color: '#64748b', fontSize: '1.1rem' }} /></InputAdornment>,
                    endAdornment: payload.confirmPassword && payload.newPassword === payload.confirmPassword
                      ? <InputAdornment position="end"><CheckCircle sx={{ color: '#2563eb', fontSize: '1.1rem' }} /></InputAdornment> : null,
                  }}
                  sx={inputSx} />
                <Button fullWidth variant="contained" onClick={handleResetPassword} disabled={loading || !payload.newPassword}
                  sx={{ py: 1.5, borderRadius: '10px', background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', color: '#ffffff', fontFamily: 'Nunito, sans-serif', fontWeight: 800, textTransform: 'none' }}>
                  {loading ? <CircularProgress size={22} sx={{ color: '#f0f4f8' }} /> : 'Reset Password'}
                </Button>
              </Box>
            )}

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Link to="/" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontFamily: 'Nunito, sans-serif', '&:hover': { color: '#2563eb' } }}>
                  ← Back to Sign In
                </Typography>
              </Link>
            </Box>
          </Box>
        </Box>
      </Fade>
    </Box>
  );
};

export default ForgotPasswordPage;
