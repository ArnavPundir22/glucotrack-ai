import React from 'react';
import { Download, Smartphone, Wifi, WifiOff, Activity, ShieldCheck } from 'lucide-react';

export default function Header({
  preferredUnit,
  setPreferredUnit,
  pwaState,
  onExportCSV,
}) {
  const { isInstallable, isOnline, triggerInstall } = pwaState;

  return (
    <header className="glass-card" style={{ padding: '18px 24px', marginBottom: '24px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(2, 132, 199, 0.35)',
            flexShrink: 0,
          }}>
            <Activity size={26} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.1 }}>
                GlucoTrack <span style={{ color: '#0284c7' }}>AI</span>
              </h1>
              <span className="badge badge-cyan" style={{ fontSize: '0.68rem', padding: '3px 8px' }}>
                PWA Enabled
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0' }}>
              Smart Glucometer Reading & Analytics System
            </p>
          </div>
        </div>

        {/* Action Controls & Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          
          {/* Target Range Badge */}
          <div className="badge badge-target" style={{ padding: '6px 14px', fontSize: '0.75rem', fontWeight: 700 }}>
            <ShieldCheck size={14} /> Target: 70–180 mg/dL
          </div>

          {/* Unit Switcher */}
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            borderRadius: 'var(--radius-sm)',
            padding: '3px',
            border: '1px solid #e2e8f0'
          }}>
            <button
              onClick={() => setPreferredUnit('mg/dL')}
              style={{
                padding: '5px 12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: preferredUnit === 'mg/dL' ? '#0284c7' : 'transparent',
                color: preferredUnit === 'mg/dL' ? '#ffffff' : '#64748b',
                transition: 'var(--transition)',
                boxShadow: preferredUnit === 'mg/dL' ? '0 2px 8px rgba(2, 132, 199, 0.25)' : 'none',
              }}
            >
              mg/dL
            </button>
            <button
              onClick={() => setPreferredUnit('mmol/L')}
              style={{
                padding: '5px 12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: preferredUnit === 'mmol/L' ? '#0284c7' : 'transparent',
                color: preferredUnit === 'mmol/L' ? '#ffffff' : '#64748b',
                transition: 'var(--transition)',
                boxShadow: preferredUnit === 'mmol/L' ? '0 2px 8px rgba(2, 132, 199, 0.25)' : 'none',
              }}
            >
              mmol/L
            </button>
          </div>

          {/* PWA Install Button */}
          {isInstallable && (
            <button className="btn btn-ai btn-sm" onClick={triggerInstall}>
              <Smartphone size={14} /> Install App
            </button>
          )}

          {/* Network Status Indicator */}
          <div
            className={`badge ${isOnline ? 'badge-target' : 'badge-low'}`}
            title={isOnline ? 'Connected to Network' : 'Working Offline - Data cached locally'}
            style={{ padding: '6px 10px' }}
          >
            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            {isOnline ? 'Online' : 'Offline'}
          </div>

          {/* CSV Export */}
          <button className="btn btn-secondary btn-sm" onClick={onExportCSV} title="Export CSV Report">
            <Download size={14} /> Export
          </button>
        </div>

      </div>
    </header>
  );
}
