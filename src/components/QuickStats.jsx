import React from 'react';
import { Activity, Target, ShieldCheck, TrendingUp } from 'lucide-react';

export default function QuickStats({ summary, preferredUnit = 'mg/dL' }) {
  const { total_readings = 0, average_mgdl = 0, estimated_a1c = 0, sd = 0, cv_percent = 0, time_in_range = {} } = summary || {};
  const tirPct = time_in_range.in_range_pct || 0;

  const displayAvg = preferredUnit === 'mmol/L'
    ? (average_mgdl / 18.018).toFixed(1)
    : Math.round(average_mgdl);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '18px',
      marginBottom: '24px',
    }}>
      {/* 1. Mean Glucose Card */}
      <div className="glass-card glass-card-interactive" style={{ padding: '22px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
            Mean Glucose ({preferredUnit})
          </span>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: '#f0f9ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0284c7',
          }}>
            <Activity size={20} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
            {total_readings > 0 ? displayAvg : '—'}
          </span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
            {preferredUnit}
          </span>
        </div>
        <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#64748b' }}>
          Standard Target: 70-180 mg/dL
        </div>
      </div>

      {/* 2. Time-In-Range (TIR) Card */}
      <div className="glass-card glass-card-interactive" style={{ padding: '22px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
            Time-In-Range (TIR)
          </span>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: '#ecfdf5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#059669',
          }}>
            <Target size={20} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: total_readings === 0 ? '#0f172a' : tirPct >= 70 ? '#059669' : '#d97706', lineHeight: 1 }}>
            {total_readings > 0 ? `${tirPct}%` : '—'}
          </span>
          {total_readings > 0 && (
            <span className={`badge ${tirPct >= 70 ? 'badge-target' : 'badge-high'}`} style={{ fontSize: '0.7rem' }}>
              {tirPct >= 70 ? 'Optimal' : 'Needs Focus'}
            </span>
          )}
        </div>
        <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#64748b' }}>
          ADA Clinical Target: ≥ 70%
        </div>
      </div>

      {/* 3. Estimated HbA1c (eA1c) Card */}
      <div className="glass-card glass-card-interactive" style={{ padding: '22px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
            Estimated HbA1c (eA1c)
          </span>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: '#f3e8ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#7c3aed',
          }}>
            <ShieldCheck size={20} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
            {total_readings > 0 ? `${estimated_a1c}%` : '—'}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
            (ADAG Formula)
          </span>
        </div>
        <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#64748b' }}>
          Target: &lt; 7.0% for control
        </div>
      </div>

      {/* 4. Glycemic Variability (CV %) Card */}
      <div className="glass-card glass-card-interactive" style={{ padding: '22px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
            Glycemic Variability (CV)
          </span>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: '#fffbeb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#d97706',
          }}>
            <TrendingUp size={20} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: total_readings === 0 ? '#0f172a' : cv_percent <= 36 ? '#059669' : '#d97706', lineHeight: 1 }}>
            {total_readings > 0 ? `${cv_percent}%` : '—'}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
            {total_readings > 0 ? `SD: ±${sd}` : ''}
          </span>
        </div>
        <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#64748b' }}>
          Target: ≤ 36% stability
        </div>
      </div>
    </div>
  );
}
