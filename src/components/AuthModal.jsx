import React, { useState } from 'react';
import { X, Lock, Mail, User, ArrowRight, ShieldCheck, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  // Mode can be: 'signin' | 'signup' | 'forgot' | 'reset'
  const [mode, setMode] = useState('signin');

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preferredUnit, setPreferredUnit] = useState('mg/dL');

  // Reset password form states
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [demoCode, setDemoCode] = useState('');

  // Async & feedback states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Handle standard Sign In or Sign Up
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const isSignUp = mode === 'signup';

    try {
      const endpoint = isSignUp ? '/api/v1/auth/signup' : '/api/v1/auth/login';
      const payload = isSignUp
        ? { full_name: fullName, email, password, preferred_unit: preferredUnit }
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json.status === 'success') {
        localStorage.setItem('glucotrack_token', json.token);
        localStorage.setItem('glucotrack_user', JSON.stringify(json.user));
        const welcomeText = isSignUp
          ? `Account created successfully! Welcome to GlucoTrack AI, ${json.user.full_name}.`
          : `Welcome back, ${json.user.full_name}! You have signed in successfully.`;
        onAuthSuccess(json.user, json.token, welcomeText);
        onClose();
      } else {
        setErrorMsg(json.message || 'Authentication failed. Please try again.');
      }
    } catch (err) {
      console.error('[AuthModal Error]:', err);
      setErrorMsg('Network error connecting to GlucoTrack AI Auth Service.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Request Password Reset Code
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const json = await res.json();

      if (json.status === 'success') {
        setSuccessMsg(json.message || 'Reset code generated.');
        if (json.resetCode) {
          setDemoCode(json.resetCode);
          setResetCode(json.resetCode); // Pre-fill for seamless user experience
        }
        setMode('reset');
      } else {
        setErrorMsg(json.message || 'Failed to request password reset code.');
      }
    } catch (err) {
      console.error('[Forgot Password Error]:', err);
      setErrorMsg('Network error connecting to GlucoTrack AI Auth Service.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit Reset Password with Verification Code
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please check and try again.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: resetCode,
          newPassword,
        }),
      });

      const json = await res.json();

      if (json.status === 'success') {
        localStorage.setItem('glucotrack_token', json.token);
        localStorage.setItem('glucotrack_user', JSON.stringify(json.user));
        onAuthSuccess(json.user, json.token, 'Your password has been reset successfully! Welcome back.');
        onClose();
      } else {
        setErrorMsg(json.message || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      console.error('[Reset Password Error]:', err);
      setErrorMsg('Network error connecting to GlucoTrack AI Auth Service.');
    } finally {
      setLoading(false);
    }
  };

  const getHeaderTitle = () => {
    switch (mode) {
      case 'signup':
        return 'Create Patient Account';
      case 'forgot':
        return 'Forgot Password?';
      case 'reset':
        return 'Create New Password';
      case 'signin':
      default:
        return 'Welcome Back';
    }
  };

  const getHeaderSubtitle = () => {
    switch (mode) {
      case 'signup':
        return 'Independent, isolated glucose tracking';
      case 'forgot':
        return 'Enter your account email to receive a 6-digit reset code';
      case 'reset':
        return 'Enter the 6-digit verification code and your new password';
      case 'signin':
      default:
        return 'Sign in to access your glucose readings';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', padding: '28px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
            }}>
              {mode === 'forgot' || mode === 'reset' ? <KeyRound size={22} /> : <ShieldCheck size={22} />}
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {getHeaderTitle()}
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                {getHeaderSubtitle()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.82rem',
            marginBottom: '16px',
            fontWeight: 600,
          }}>
            {errorMsg}
          </div>
        )}

        {/* Success / Info Alert */}
        {successMsg && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.82rem',
            marginBottom: '16px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <CheckCircle2 size={18} color="#166534" style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Demo Mode Reset Code Banner */}
        {mode === 'reset' && demoCode && (
          <div style={{
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            color: '#0369a1',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.82rem',
            marginBottom: '16px',
            fontWeight: 600,
          }}>
            🔑 Demo Code: <strong style={{ letterSpacing: '1px', background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px', color: '#0284c7' }}>{demoCode}</strong>
          </div>
        )}

        {/* FORGOT PASSWORD FORM (Step 1) */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPasswordSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Account Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem', gap: '8px' }}
            >
              {loading ? 'Sending Code...' : 'Send Reset Code'}
              <ArrowRight size={16} />
            </button>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <ArrowLeft size={14} /> Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* RESET PASSWORD FORM (Step 2) */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPasswordSubmit}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                6-Digit Verification Code
              </label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    letterSpacing: '2px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem', gap: '8px' }}
            >
              {loading ? 'Resetting Password...' : 'Reset Password & Log In'}
              <ArrowRight size={16} />
            </button>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0284c7',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Resend code
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ArrowLeft size={14} /> Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* SIGN IN / SIGN UP FORM */}
        {(mode === 'signin' || mode === 'signup') && (
          <form onSubmit={handleAuthSubmit}>
            {mode === 'signup' && (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Sarah Jenkins"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: mode === 'signup' ? '14px' : '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0284c7',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Preferred Glucose Unit
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setPreferredUnit('mg/dL')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: 'var(--radius-sm)',
                      border: preferredUnit === 'mg/dL' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      background: preferredUnit === 'mg/dL' ? '#f0f9ff' : '#ffffff',
                      color: preferredUnit === 'mg/dL' ? '#0284c7' : '#475569',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    mg/dL
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferredUnit('mmol/L')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: 'var(--radius-sm)',
                      border: preferredUnit === 'mmol/L' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      background: preferredUnit === 'mmol/L' ? '#f0f9ff' : '#ffffff',
                      color: preferredUnit === 'mmol/L' ? '#0284c7' : '#475569',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    mmol/L
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem', gap: '8px' }}
            >
              {loading ? 'Authenticating...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Switch mode footer */}
        {(mode === 'signin' || mode === 'signup') && (
          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.82rem', color: '#64748b' }}>
            {mode === 'signup' ? 'Already have an account?' : "Don't have an account yet?"}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signup' ? 'signin' : 'signup');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
            >
              {mode === 'signup' ? 'Log In' : 'Sign Up'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
