import React from 'react';
import { Smartphone, X, Zap, Camera, ShieldCheck, Download } from 'lucide-react';

export default function PWAInstallModal({ isOpen, onClose, onInstall }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px', borderRadius: '24px', padding: '28px', background: '#ffffff' }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 6px 18px rgba(2, 132, 199, 0.35)',
            }}>
              <Smartphone size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#0f172a', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                Install GlucoTrack AI
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                Native App Experience on Your Device
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Hero Banner Box */}
        <div style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #fae8ff 100%)',
          border: '1px solid #bae6fd',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '20px',
          textAlign: 'center',
        }}>
          <span className="badge badge-cyan" style={{ marginBottom: '6px', fontSize: '0.7rem' }}>
            Recommended For New Users
          </span>
          <p style={{ fontSize: '0.88rem', color: '#0f172a', fontWeight: 700, margin: 0, lineHeight: 1.4 }}>
            Add GlucoTrack AI to your Home Screen for faster logging and instant offline access!
          </p>
        </div>

        {/* Feature Highlights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ background: '#f0fdf4', color: '#10b981', padding: '8px', borderRadius: '10px', flexShrink: 0 }}>
              <Zap size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>Instant Offline Access</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Log readings and check trends even without internet connectivity.</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ background: '#f0f9ff', color: '#0284c7', padding: '8px', borderRadius: '10px', flexShrink: 0 }}>
              <Camera size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>1-Tap Camera Scan</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Open directly into glucometer scanning mode from your home screen.</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ background: '#fae8ff', color: '#7c3aed', padding: '8px', borderRadius: '10px', flexShrink: 0 }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>Full Screen Privacy</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Clean standalone window without browser search bars or tabs.</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn btn-secondary"
            onClick={onClose}
            style={{ flex: 1, padding: '12px', borderRadius: '14px', fontSize: '0.88rem' }}
          >
            Maybe Later
          </button>
          <button
            className="btn btn-primary"
            onClick={onInstall}
            style={{ flex: 1.4, padding: '12px', borderRadius: '14px', fontSize: '0.88rem', fontWeight: 700 }}
          >
            <Download size={18} /> Install App Now
          </button>
        </div>

      </div>
    </div>
  );
}
