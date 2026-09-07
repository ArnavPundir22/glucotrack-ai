import React from 'react';
import {
  X,
  User,
  LogOut,
  LogIn,
  Camera,
  Plus,
  Activity,
  BarChart2,
  Sparkles,
  Database,
  Download,
  Smartphone,
  Wifi,
  WifiOff,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export default function SidePanel({
  isOpen,
  onClose,
  user,
  onLogout,
  onOpenAuth,
  preferredUnit,
  setPreferredUnit,
  periodDays,
  setPeriodDays,
  onOpenSnap,
  onOpenManual,
  pwaState,
  onExportCSV,
  activeSection,
  setActiveSection,
}) {
  if (!isOpen) return null;

  const handleNavClick = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    onClose();
  };

  return (
    <div className="side-panel-overlay" onClick={onClose}>
      <div className="side-panel-drawer" onClick={(e) => e.stopPropagation()}>
        
        {/* Drawer Header */}
        <div className="side-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="side-panel-brand-icon">
              <Activity size={22} color="#ffffff" />
            </div>
            <div>
              <h2 className="side-panel-brand-title">
                GlucoTrack <span style={{ color: '#38bdf8' }}>AI</span>
              </h2>
              <p className="side-panel-brand-sub">Native Health Suite</p>
            </div>
          </div>
          <button className="side-panel-close-btn" onClick={onClose} aria-label="Close Side Panel">
            <X size={20} />
          </button>
        </div>

        {/* User Account Card */}
        <div className="side-panel-user-card">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="side-panel-avatar">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc' }}>
                    {user.full_name}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                    {user.email}
                  </div>
                </div>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                style={{ padding: '6px 10px', borderRadius: '10px' }}
                title="Sign Out"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', width: '100%' }}>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '10px' }}>
                Log in to sync glucometer data across devices
              </p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  onOpenAuth();
                  onClose();
                }}
                style={{ width: '100%', borderRadius: '12px', padding: '10px' }}
              >
                <LogIn size={16} /> Patient Login / Register
              </button>
            </div>
          )}
        </div>

        {/* Drawer Body Scroll Area */}
        <div className="side-panel-scroll">
          
          {/* Quick Capture Actions */}
          <div className="side-panel-section">
            <div className="side-panel-section-title">Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                className="btn btn-primary side-panel-btn"
                onClick={() => {
                  onOpenSnap();
                  onClose();
                }}
              >
                <Camera size={18} /> Snap Glucometer Photo
              </button>
              <button
                className="btn btn-secondary side-panel-btn"
                onClick={() => {
                  onOpenManual();
                  onClose();
                }}
              >
                <Plus size={18} /> Log Manual Reading
              </button>
            </div>
          </div>

          {/* Unit Switcher & Period Filter */}
          <div className="side-panel-section">
            <div className="side-panel-section-title">Preferences</div>
            
            <div className="side-panel-setting-row">
              <span className="side-panel-setting-label">Measurement Unit</span>
              <div className="unit-toggle-group">
                <button
                  className={`unit-toggle-btn ${preferredUnit === 'mg/dL' ? 'active' : ''}`}
                  onClick={() => setPreferredUnit('mg/dL')}
                >
                  mg/dL
                </button>
                <button
                  className={`unit-toggle-btn ${preferredUnit === 'mmol/L' ? 'active' : ''}`}
                  onClick={() => setPreferredUnit('mmol/L')}
                >
                  mmol/L
                </button>
              </div>
            </div>

            <div className="side-panel-setting-row" style={{ marginTop: '12px' }}>
              <span className="side-panel-setting-label">Analytics Window</span>
              <div className="period-pill-group">
                {[7, 14, 30, 90].map((days) => (
                  <button
                    key={days}
                    className={`period-pill-btn ${periodDays === days ? 'active' : ''}`}
                    onClick={() => setPeriodDays(days)}
                  >
                    {days}D
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="side-panel-section">
            <div className="side-panel-section-title">Navigation</div>
            <nav className="side-panel-nav">
              <button
                className={`side-panel-nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}
                onClick={() => handleNavClick('dashboard')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Activity size={18} /> <span>Dashboard & Trends</span>
                </div>
                <ChevronRight size={16} style={{ opacity: 0.5 }} />
              </button>

              <button
                className={`side-panel-nav-item ${activeSection === 'insights' ? 'active' : ''}`}
                onClick={() => handleNavClick('insights')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Sparkles size={18} color="#c084fc" /> <span>GlucoTrack AI Insights</span>
                </div>
                <ChevronRight size={16} style={{ opacity: 0.5 }} />
              </button>

              <button
                className={`side-panel-nav-item ${activeSection === 'logbook' ? 'active' : ''}`}
                onClick={() => handleNavClick('logbook')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Database size={18} /> <span>Glucose Logbook</span>
                </div>
                <ChevronRight size={16} style={{ opacity: 0.5 }} />
              </button>
            </nav>
          </div>

          {/* System & Export Tools */}
          <div className="side-panel-section">
            <div className="side-panel-section-title">Tools & Status</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pwaState?.isInstallable && (
                <button className="side-panel-tool-btn" onClick={pwaState.triggerInstall}>
                  <Smartphone size={16} color="#38bdf8" />
                  <span>Install App on Device</span>
                </button>
              )}

              <button className="side-panel-tool-btn" onClick={onExportCSV}>
                <Download size={16} color="#10b981" />
                <span>Export CSV Report</span>
              </button>

              <div className="side-panel-status-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {pwaState?.isOnline ? <Wifi size={16} color="#10b981" /> : <WifiOff size={16} color="#ef4444" />}
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc' }}>
                    {pwaState?.isOnline ? 'Cloud Sync Online' : 'Offline Mode Active'}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                  Clinical Range: 70–180 mg/dL
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="side-panel-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#64748b' }}>
            <ShieldCheck size={14} color="#0284c7" />
            <span>GlucoTrack AI v1.2 • Non-diagnostic</span>
          </div>
        </div>

      </div>
    </div>
  );
}
