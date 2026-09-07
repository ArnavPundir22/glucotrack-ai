import React from 'react';
import { Activity, BarChart2, Camera, Sparkles, Database } from 'lucide-react';

export default function MobileBottomNav({
  activeSection,
  setActiveSection,
  onOpenSnap,
}) {
  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <div className="mobile-nav-container">
        
        {/* Tab 1: Dashboard */}
        <button
          className={`mobile-nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}
          onClick={() => scrollToSection('dashboard')}
        >
          <Activity size={20} />
          <span>Trends</span>
        </button>

        {/* Tab 2: TIR Analytics */}
        <button
          className={`mobile-nav-item ${activeSection === 'analytics' ? 'active' : ''}`}
          onClick={() => scrollToSection('analytics')}
        >
          <BarChart2 size={20} />
          <span>Analytics</span>
        </button>

        {/* Center Floating Action Button (Camera Scan) */}
        <div className="mobile-nav-center-action">
          <button
            className="mobile-fab-btn"
            onClick={onOpenSnap}
            title="Scan Glucometer Photo"
            aria-label="Scan Glucometer Display Screen"
          >
            <Camera size={24} color="#ffffff" />
          </button>
        </div>

        {/* Tab 3: GlucoTrack AI Insights */}
        <button
          className={`mobile-nav-item ${activeSection === 'insights' ? 'active' : ''}`}
          onClick={() => scrollToSection('insights')}
        >
          <Sparkles size={20} />
          <span>AI Insights</span>
        </button>

        {/* Tab 4: Logbook */}
        <button
          className={`mobile-nav-item ${activeSection === 'logbook' ? 'active' : ''}`}
          onClick={() => scrollToSection('logbook')}
        >
          <Database size={20} />
          <span>Logbook</span>
        </button>

      </div>
    </nav>
  );
}
