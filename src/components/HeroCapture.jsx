import React from 'react';
import { Camera, PlusCircle, Sparkles, ShieldCheck } from 'lucide-react';

export default function HeroCapture({ onOpenSnap, onOpenManual }) {
  return (
    <div className="glass-card" style={{
      padding: '28px',
      marginBottom: '24px',
      background: 'var(--gradient-hero)',
      border: '1px solid #bae6fd',
      boxShadow: '0 10px 30px -5px rgba(2, 132, 199, 0.08)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient background glow */}
      <div style={{
        position: 'absolute',
        top: '-60px',
        right: '-60px',
        width: '240px',
        height: '240px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(255,255,255,0) 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 1 }}>
        
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span className="badge badge-cyan" style={{ padding: '5px 12px', fontSize: '0.72rem' }}>
              <Sparkles size={13} /> GlucoTrack AI Powered
            </span>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={14} color="#059669" /> ISO 15197 Standard
            </span>
          </div>
          <h2 style={{ fontSize: '1.45rem', color: '#0f172a', fontWeight: 800, marginBottom: '6px', lineHeight: 1.2 }}>
            Zero-Friction Blood Glucose Logging
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#475569', maxWidth: '580px', lineHeight: 1.5 }}>
            Point your camera at any handheld glucometer display screen. Our multimodal AI vision engine automatically extracts your blood sugar reading, measurement unit, and meal context.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={onOpenSnap}
            style={{
              padding: '13px 24px',
              fontSize: '1rem',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 6px 20px rgba(2, 132, 199, 0.35)',
            }}
          >
            <Camera size={20} /> Snap Glucometer Photo
          </button>

          <button
            className="btn btn-secondary"
            onClick={onOpenManual}
            style={{
              padding: '13px 22px',
              fontSize: '0.95rem',
              borderRadius: 'var(--radius-md)',
              background: '#ffffff',
            }}
          >
            <PlusCircle size={18} /> Manual Entry
          </button>
        </div>

      </div>
    </div>
  );
}
