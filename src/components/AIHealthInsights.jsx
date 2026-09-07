import React from 'react';
import { Sparkles, RefreshCw, Activity, ShieldAlert, Lightbulb, HeartPulse } from 'lucide-react';

export default function AIHealthInsights({
  insightsData,
  onGenerateInsights,
  isGenerating,
  summaryAnalytics,
}) {
  const {
    is_empty = true,
    summary = '',
    patterns = [],
    recommendations = [],
    disclaimer = '',
  } = insightsData || {};

  const tirPct = summaryAnalytics?.time_in_range?.in_range_pct || 0;
  const totalReadings = summaryAnalytics?.total_readings || 0;
  
  // Calculate a metabolic score (0-100) based on Time In Range and readings
  const metabolicScore = totalReadings > 0 ? Math.min(100, Math.max(30, Math.round(tirPct))) : 0;

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div>
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'var(--gradient-ai)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
            }}>
              <Sparkles size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.2rem', color: '#0f172a', fontWeight: 700, margin: 0 }}>
                  GlucoTrack AI Health Insights
                </h3>
                <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                  Live Clinical AI
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                Metabolic pattern detection & personalized advice
              </p>
            </div>
          </div>

          <button
            className="btn btn-ai btn-sm"
            onClick={onGenerateInsights}
            disabled={isGenerating}
          >
            <RefreshCw size={14} style={{ animation: isGenerating ? 'spin 1.5s linear infinite' : 'none' }} />
            {isGenerating ? 'Analyzing...' : 'Refresh AI'}
          </button>
        </div>

        {/* Content Body */}
        {is_empty ? (
          <div style={{
            background: '#f8fafc',
            border: '1px dashed #cbd5e1',
            padding: '28px 20px',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            marginBottom: '20px',
          }}>
            <Activity size={32} color="#0284c7" style={{ marginBottom: '8px' }} />
            <h4 style={{ color: '#0f172a', marginBottom: '4px', fontSize: '0.95rem' }}>Ready for Your First Log</h4>
            <p style={{ fontSize: '0.82rem', color: '#64748b', maxWidth: '420px', margin: '0 auto' }}>
              Add a glucometer reading or photo log to unlock real-time GlucoTrack AI metabolic advice.
            </p>
          </div>
        ) : (
          <div>
            {/* Executive Overview Box */}
            <div style={{
              background: 'linear-gradient(135deg, #f0f9ff 0%, #fae8ff 100%)',
              border: '1px solid #bae6fd',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              marginBottom: '16px',
            }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Executive AI Summary
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.45 }}>
                {summary}
              </div>
            </div>

            {/* Key Patterns & Recommendations */}
            {patterns.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.88rem', color: '#0f172a', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Activity size={15} color="#7c3aed" /> Pattern Analysis
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {patterns.slice(0, 2).map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: item.type === 'success' ? '#f0fdf4' : item.type === 'alert' ? '#fef2f2' : '#fffbeb',
                        border: `1px solid ${item.type === 'success' ? '#a7f3d0' : item.type === 'alert' ? '#fecaca' : '#fde68a'}`,
                        borderRadius: 'var(--radius-sm)',
                        padding: '10px 14px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>{item.title}</span>
                        <span className={`badge ${item.type === 'success' ? 'badge-target' : 'badge-high'}`} style={{ fontSize: '0.62rem' }}>
                          {item.type === 'success' ? 'Optimal' : 'Alert'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#475569', margin: 0 }}>{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recommendations.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.88rem', color: '#0f172a', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lightbulb size={15} color="#d97706" /> Clinical Recommendations
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {recommendations.slice(0, 2).map((rec, idx) => (
                    <div key={idx} style={{ fontSize: '0.8rem', color: '#334155', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <strong>• {rec.title}:</strong> {rec.detail}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Area: Safety Note + Wireframe Circular Ring Gauge Widget on Bottom Right */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '16px',
        pt: '12px',
        borderTop: '1px solid #f1f5f9',
        gap: '16px',
      }}>
        {/* Safety Note */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#fff7ed',
          border: '1px solid #fed7aa',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 12px',
          fontSize: '0.74rem',
          color: '#9a3412',
          flex: 1,
        }}>
          <ShieldAlert size={16} color="#ea580c" style={{ flexShrink: 0 }} />
          <span>Informational pattern analysis only. Consult your physician for medical decisions.</span>
        </div>

        {/* Circular Metabolic Ring Gauge Node (Matching Wireframe Bottom Right Circle) */}
        <div style={{
          width: '94px',
          height: '94px',
          borderRadius: '50%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 8px 20px rgba(2, 132, 199, 0.3)',
          flexShrink: 0,
          border: '3px solid #ffffff',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #0284c7 0%, #7c3aed 100%)',
        }}>
          <img
            src="/images/metabolic_ai_badge.jpg"
            alt="Metabolic AI Health Score"
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.85,
            }}
          />
          <div style={{
            position: 'relative',
            zIndex: 2,
            textAlign: 'center',
            background: 'rgba(15, 23, 42, 0.65)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
          }}>
            <HeartPulse size={18} color="#ffffff" style={{ opacity: 0.9 }} />
            <span style={{ fontSize: '1rem', fontWeight: 800, lineHeight: 1, marginTop: '2px' }}>
              {totalReadings > 0 ? `${metabolicScore}%` : '—'}
            </span>
            <span style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.9 }}>
              AI Score
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}

