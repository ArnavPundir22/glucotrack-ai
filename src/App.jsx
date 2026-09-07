import React, { useState, useEffect } from 'react';
import { Camera, Plus, Activity, Download, Smartphone, Wifi, WifiOff, User, LogIn, LogOut, X, Sparkles, Menu } from 'lucide-react';
import CameraModal from './components/CameraModal';
import VerificationModal from './components/VerificationModal';
import AuthModal from './components/AuthModal';
import GlucoseTrendChart from './components/GlucoseTrendChart';
import TIRDonutChart from './components/TIRDonutChart';
import MealContextChart from './components/MealContextChart';
import AIHealthInsights from './components/AIHealthInsights';
import LogbookTable from './components/LogbookTable';
import SidePanel from './components/SidePanel';
import MobileBottomNav from './components/MobileBottomNav';
import { usePWAState } from './pwaRegister';

export default function App() {
  const pwaState = usePWAState();

  // Side Panel & Section Navigation State
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');

  // Auth & User States
  const [token, setToken] = useState(() => localStorage.getItem('glucotrack_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('glucotrack_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');

  const [preferredUnit, setPreferredUnit] = useState(user?.preferred_unit || 'mg/dL');
  const [periodDays, setPeriodDays] = useState(14);

  // Data states
  const [readings, setReadings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState(null);

  // Modal & Async states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isManual, setIsManual] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [editingReading, setEditingReading] = useState(null);
  const [isAnalyzingOcr, setIsAnalyzingOcr] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  useEffect(() => {
    if (token) {
      loadAllData();
    } else {
      // Auto open auth modal if not logged in
      setIsAuthOpen(true);
    }
  }, [token, periodDays]);

  const loadAllData = async () => {
    if (!token) return;
    await Promise.all([
      fetchReadings(),
      fetchAnalytics(periodDays),
      fetchAiInsights(periodDays),
    ]);
  };

  const fetchReadings = async () => {
    try {
      const res = await fetch('/api/v1/readings', {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.status === 'success') {
        setReadings(json.data || []);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error('[App] Error fetching readings:', err);
    }
  };

  const fetchAnalytics = async (days) => {
    try {
      const res = await fetch(`/api/v1/analytics/trends?days=${days}`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.status === 'success') {
        setAnalytics(json);
      }
    } catch (err) {
      console.error('[App] Error fetching analytics:', err);
    }
  };

  const fetchAiInsights = async (days) => {
    try {
      setIsGeneratingAi(true);
      const res = await fetch('/api/v1/ai/insights', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ days }),
      });
      const json = await res.json();
      if (json.status === 'success') {
        setInsights(json);
      }
    } catch (err) {
      console.error('[App] Error generating AI insights:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleAuthSuccess = (userData, authToken, message) => {
    setUser(userData);
    setToken(authToken);
    setIsAuthOpen(false); // Instantly turn off the pop-up modal panel!
    if (userData.preferred_unit) {
      setPreferredUnit(userData.preferred_unit);
    }
    if (message) {
      setWelcomeMessage(message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('glucotrack_token');
    localStorage.removeItem('glucotrack_user');
    setToken(null);
    setUser(null);
    setWelcomeMessage('');
    setReadings([]);
    setAnalytics(null);
    setInsights(null);
    setIsAuthOpen(true);
  };

  const handleOpenSnap = () => {
    if (!token) {
      setIsAuthOpen(true);
      return;
    }
    setEditingReading(null);
    setOcrResult(null);
    setIsManual(false);
    setIsCameraOpen(true);
  };

  const handleOpenManual = () => {
    if (!token) {
      setIsAuthOpen(true);
      return;
    }
    setEditingReading(null);
    setOcrResult(null);
    setIsManual(true);
    setIsVerificationOpen(true);
  };

  const handleImageCaptured = async (base64Data) => {
    try {
      setIsAnalyzingOcr(true);
      const res = await fetch('/api/v1/ocr/extract', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ image_base64: base64Data }),
      });

      const json = await res.json();
      if (json.status === 'success') {
        setOcrResult(json.data);
        setIsCameraOpen(false);
        setIsVerificationOpen(true);
      } else {
        alert(`OCR Extraction Failed: ${json.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('[App] OCR upload error:', err);
      alert('Failed to connect to AI vision extraction service.');
    } finally {
      setIsAnalyzingOcr(false);
    }
  };

  const handleSaveReading = async (readingPayload) => {
    try {
      let endpoint = '/api/v1/readings';
      let method = 'POST';

      if (editingReading) {
        endpoint = `/api/v1/readings/${editingReading.id}`;
        method = 'PUT';
      }

      const res = await fetch(endpoint, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(readingPayload),
      });

      const json = await res.json();
      if (json.status === 'success') {
        setIsVerificationOpen(false);
        setEditingReading(null);
        setOcrResult(null);
        await loadAllData();
      } else {
        alert(`Failed to save reading: ${json.message}`);
      }
    } catch (err) {
      console.error('[App] Error saving reading:', err);
      alert('Network error saving glucose reading.');
    }
  };

  const handleEditReading = (reading) => {
    setEditingReading(reading);
    setOcrResult({
      value: reading.original_value,
      unit: reading.original_unit,
      suggested_meal_context: reading.meal_context,
      confidence: 1.0,
    });
    setIsManual(false);
    setIsVerificationOpen(true);
  };

  const handleDeleteReading = async (id) => {
    if (!window.confirm('Are you sure you want to delete this glucose reading?')) return;
    try {
      const res = await fetch(`/api/v1/readings/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.status === 'success') {
        await loadAllData();
      }
    } catch (err) {
      console.error('[App] Error deleting reading:', err);
    }
  };

  const handleExportCSV = () => {
    if (!token) {
      setIsAuthOpen(true);
      return;
    }
    window.location.href = `/api/v1/export/csv?token=${token}`;
  };

  const totalReadings = analytics ? analytics.summary.total_readings : 0;

  return (
    <div className="wireframe-app-shell">
      
      {/* Side Panel Navigation Drawer */}
      <SidePanel
        isOpen={isSidePanelOpen}
        onClose={() => setIsSidePanelOpen(false)}
        user={user}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthOpen(true)}
        preferredUnit={preferredUnit}
        setPreferredUnit={setPreferredUnit}
        periodDays={periodDays}
        setPeriodDays={setPeriodDays}
        onOpenSnap={handleOpenSnap}
        onOpenManual={handleOpenManual}
        pwaState={pwaState}
        onExportCSV={handleExportCSV}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />

      {/* TOP WIREFRAME CARD (Dark Slate Container #1e293b) */}
      <div className="top-wireframe-card" id="dashboard">
        
        {/* Top Control Bar inside Dark Card */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Native Mobile / Desktop Hamburger Drawer Toggle */}
            <button
              onClick={() => setIsSidePanelOpen(true)}
              style={{
                background: '#334155',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#ffffff',
                borderRadius: '12px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
              title="Open Navigation Menu"
              aria-label="Open Navigation Side Panel"
            >
              <Menu size={20} />
            </button>

            {/* Top Left: Unit Switch Toggle */}
            <div style={{ display: 'flex', background: '#334155', borderRadius: '20px', padding: '3px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={() => setPreferredUnit('mg/dL')}
              style={{
                padding: '5px 14px',
                fontSize: '0.78rem',
                fontWeight: 700,
                borderRadius: '16px',
                border: 'none',
                cursor: 'pointer',
                background: preferredUnit === 'mg/dL' ? '#0284c7' : 'transparent',
                color: '#ffffff',
                transition: 'var(--transition)',
              }}
            >
              mg/dL
            </button>
            <button
              onClick={() => setPreferredUnit('mmol/L')}
              style={{
                padding: '5px 14px',
                fontSize: '0.78rem',
                fontWeight: 700,
                borderRadius: '16px',
                border: 'none',
                cursor: 'pointer',
                background: preferredUnit === 'mmol/L' ? '#0284c7' : 'transparent',
                color: '#ffffff',
                transition: 'var(--transition)',
              }}
            >
              mmol/L
            </button>
          </div>
        </div>

        {/* Top Right: User Account Profile Pill & 3 Action Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            
            {/* User Profile Pill / Login button */}
            {user ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#334155',
                  padding: '4px 12px 4px 6px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'var(--gradient-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}>
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc' }}>
                  {user.full_name}
                </span>
                <button
                  onClick={handleLogout}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                  title="Sign Out"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setIsAuthOpen(true)}
                style={{ padding: '6px 14px', borderRadius: '16px', fontSize: '0.78rem' }}
              >
                <LogIn size={14} /> Patient Login
              </button>
            )}

            {/* Badge 1: Network / Offline */}
            <div
              style={{
                background: '#334155',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: pwaState.isOnline ? '#10b981' : '#ef4444'
              }}
              title={pwaState.isOnline ? 'Online - Cloud Sync' : 'Offline Mode'}
            >
              {pwaState.isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            </div>

            {/* Badge 2: PWA / Install */}
            <div
              onClick={pwaState.isInstallable ? pwaState.triggerInstall : undefined}
              style={{
                background: '#334155',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
                cursor: pwaState.isInstallable ? 'pointer' : 'default',
              }}
              title="PWA Application"
            >
              <Smartphone size={14} />
            </div>

            {/* Badge 3: Export CSV */}
            <button
              onClick={handleExportCSV}
              style={{
                background: '#334155',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f8fafc',
                border: 'none',
                cursor: 'pointer',
              }}
              title="Export CSV Data"
            >
              <Download size={14} />
            </button>
          </div>

        </div>

        {/* Main Middle Layout Row inside Top Dark Card */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 260px) 1fr 54px',
          gap: '20px',
          alignItems: 'center',
        }}>
          
          {/* Left Column: Branding Title & Subtitle & Dual Action Buttons */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Activity size={20} color="#ffffff" />
              </div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', margin: 0, lineHeight: 1.1 }}>
                GlucoTrack <span style={{ color: '#38bdf8' }}>AI</span>
              </h1>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '0 0 10px', lineHeight: 1.35 }}>
              AI Glucometer OCR & Multi-User Analytics
            </p>

            {/* Embedded Medical AI Project Image Graphic */}
            <div style={{
              width: '100%',
              height: '75px',
              borderRadius: '10px',
              overflow: 'hidden',
              marginBottom: '12px',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              position: 'relative',
            }}>
              <img
                src="/images/hero_medical_illustration.jpg"
                alt="AI Glucose Monitoring System"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Dual Action Pill Buttons Side-by-Side */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" onClick={handleOpenSnap} style={{ padding: '9px 12px', fontSize: '0.82rem', flex: 1 }}>
                <Camera size={16} /> Snap Photo
              </button>
              <button className="btn btn-secondary" onClick={handleOpenManual} style={{ padding: '9px 12px', fontSize: '0.82rem', flex: 1 }}>
                <Plus size={16} /> Manual
              </button>
            </div>
          </div>

          {/* Center Column: Glucose Trend Line Chart (Area Chart on Dark Background) */}
          <div style={{ height: '230px', position: 'relative' }}>
            <GlucoseTrendChart
              readings={analytics ? analytics.readings_timeline : []}
              periodDays={periodDays}
              onPeriodChange={(days) => setPeriodDays(days)}
              preferredUnit={preferredUnit}
              onOpenManual={handleOpenManual}
              isDark={true}
            />
          </div>

          {/* Right Column: Vertical Period Filter Buttons (7D, 14D, 30D, 90D) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            {[7, 14, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setPeriodDays(days)}
                style={{
                  width: '44px',
                  height: '36px',
                  borderRadius: '10px',
                  border: periodDays === days ? 'none' : '1px solid #334155',
                  background: periodDays === days ? '#0284c7' : '#1e293b',
                  color: periodDays === days ? '#ffffff' : '#94a3b8',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  boxShadow: periodDays === days ? '0 4px 12px rgba(2, 132, 199, 0.4)' : 'none',
                }}
              >
                {days}D
              </button>
            ))}
          </div>

        </div>

        {/* Bottom Center Circular Joint Node connecting top and bottom sections */}
        <div className="joint-circle-node" title="GlucoTrack AI Joint Node">
          <Activity size={20} />
        </div>

      </div>

      {/* BOTTOM WIREFRAME SECTION (Light Slate Surface Card #f8fafc) */}
      <div className="bottom-wireframe-section">
        
        {/* Welcome Alert Banner */}
        {user && (
          <div style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
            color: '#ffffff',
            padding: '14px 20px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)',
            animation: 'fadeIn 0.3s ease-out',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                flexShrink: 0,
              }}>
                👋
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>
                  {welcomeMessage || `Welcome back, ${user.full_name}!`}
                </div>
                <div style={{ fontSize: '0.78rem', opacity: 0.9, margin: 0 }}>
                  You are logged into your private, isolated patient account ({user.email}).
                </div>
              </div>
            </div>

            <button
              onClick={() => setWelcomeMessage('')}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'var(--transition)',
              }}
              title="Dismiss welcome message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Bento Grid: 2 Vertical Bento Cards on Left + AI Card on Right */}
        <div className="bottom-wireframe-grid" id="analytics" style={{ marginBottom: '24px' }}>
          
          {/* Bento 1: Vertical Card 1 (TIR Donut Chart & Breakdown) */}
          <div className="vertical-card-col">
            <TIRDonutChart
              timeInRange={analytics ? analytics.summary.time_in_range : {}}
              totalReadings={totalReadings}
            />
          </div>

          {/* Bento 2: Vertical Card 2 (Quick Stats & Meal Context Averages) */}
          <div className="vertical-card-col">
            <MealContextChart
              mealAverages={analytics ? analytics.meal_averages : []}
              preferredUnit={preferredUnit}
            />
          </div>

          {/* Bento 3: Right AI Card (AI Insights + Circular Ring Gauge Widget) */}
          <div className="ai-card-col" id="insights">
            <AIHealthInsights
              insightsData={insights}
              onGenerateInsights={() => fetchAiInsights(periodDays)}
              isGenerating={isGeneratingAi}
              summaryAnalytics={analytics ? analytics.summary : null}
            />
          </div>

        </div>

        {/* Integrated Logbook Table at bottom */}
        <div id="logbook">
          <LogbookTable
            readings={readings}
            preferredUnit={preferredUnit}
            onEditReading={handleEditReading}
            onDeleteReading={handleDeleteReading}
            onOpenManual={handleOpenManual}
          />
        </div>

      </div>

      {/* Native Mobile Bottom Action & Navigation Bar */}
      <MobileBottomNav
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onOpenSnap={handleOpenSnap}
      />

      {/* Auth Login / Registration Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          if (token) setIsAuthOpen(false);
        }}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Camera Capture Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onImageCaptured={handleImageCaptured}
        isAnalyzing={isAnalyzingOcr}
      />

      {/* Verification & Edit Modal */}
      <VerificationModal
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
        ocrResult={ocrResult}
        isManual={isManual}
        onSaveReading={handleSaveReading}
      />

    </div>
  );
}


