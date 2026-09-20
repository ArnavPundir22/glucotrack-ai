import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, ArrowRight, ShieldCheck, KeyRound, CheckCircle2, ArrowLeft, RotateCcw } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  // Mode can be: 'signin' | 'signup' | 'forgot'
  const [mode, setMode] = useState('signin');

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preferredUnit, setPreferredUnit] = useState('mg/dL');

  // Captcha Reset Password form states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captchaDataUrl, setCaptchaDataUrl] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);

  // Async & feedback states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch a new visual Captcha challenge from the backend
  const fetchCaptcha = async () => {
    try {
      setCaptchaLoading(true);
      const res = await fetch('/api/v1/auth/captcha');
      const json = await res.json();
      if (json.status === 'success') {
        setCaptchaDataUrl(json.captchaDataUrl);
        setCaptchaToken(json.captchaToken);
        setCaptchaAnswer('');
      }
    } catch (err) {
      console.error('[Fetch Captcha Error]:', err);
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    if (mode === 'forgot' && isOpen) {
      fetchCaptcha();
    }
  }, [mode, isOpen]);

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

  // Instant Captcha-Verified Password Reset
  const handleCaptchaResetSubmit = async (e) => {
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

    if (!captchaAnswer.trim()) {
      setErrorMsg('Please enter the 5-character visual security code.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/reset-password-captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          captchaToken,
          captchaAnswer,
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
        fetchCaptcha(); // Refresh captcha code on error
      }
    } catch (err) {
      console.error('[Captcha Reset Error]:', err);
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
        return 'Instant Password Reset';
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
        return 'Solve the visual security check to create a new password instantly';
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
              {mode === 'forgot' ? <KeyRound size={22} /> : <ShieldCheck size={22} />}
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

        {/* INSTANT CAPTCHA PASSWORD RESET FORM */}
        {mode === 'forgot' && (
          <form onSubmit={handleCaptchaResetSubmit}>
            <div style={{ marginBottom: '14px' }}>
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

            {/* Visual Security Captcha Challenge Box */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Security Visual Code
              </label>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                {captchaDataUrl ? (
                  <img
                    src={captchaDataUrl}
                    alt="Security Captcha"
                    style={{
                      height: '46px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid #cbd5e1',
                      objectFit: 'contain',
                    }}
                  />
                ) : (
                  <div style={{
                    width: '180px',
                    height: '46px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8',
                    fontSize: '0.8rem',
                  }}>
                    {captchaLoading ? 'Loading Code...' : 'Visual Captcha'}
                  </div>
                )}

                <button
                  type="button"
                  onClick={fetchCaptcha}
                  disabled={captchaLoading}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                  }}
                  title="Generate new captcha code"
                >
                  <RotateCcw size={14} className={captchaLoading ? 'spin' : ''} />
                  Refresh
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <KeyRound size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  required
                  maxLength={5}
                  placeholder="Enter 5 characters above"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value.toUpperCase())}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
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
