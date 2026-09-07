import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export default function TIRDonutChart({ timeInRange = {}, totalReadings = 0 }) {
  const {
    in_range_pct = 0,
    high_pct = 0,
    very_high_pct = 0,
    low_pct = 0,
    very_low_pct = 0,
  } = timeInRange;

  const data = [
    { name: 'In Range (70-180)', value: in_range_pct, color: '#059669' },
    { name: 'High (181-250)', value: high_pct, color: '#d97706' },
    { name: 'Very High (>250)', value: very_high_pct, color: '#b91c1c' },
    { name: 'Low (54-69)', value: low_pct, color: '#ea580c' },
    { name: 'Very Low (<54)', value: very_low_pct, color: '#dc2626' },
  ].filter((item) => item.value > 0);

  return (
    <div className="glass-card" style={{ padding: '24px', height: '100%', background: '#ffffff' }}>
      <h3 style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 700, marginBottom: '6px' }}>
        Time-In-Range (TIR) Breakdown
      </h3>
      <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '16px' }}>
        Clinical distribution across target glycemic bands
      </p>

      <div style={{ position: 'relative', width: '100%', height: '220px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={totalReadings > 0 && data.length > 0 ? data : [{ name: 'No Data', value: 100, color: '#e2e8f0' }]}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
            >
              {(totalReadings > 0 && data.length > 0 ? data : [{ color: '#e2e8f0' }]).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            {totalReadings > 0 && (
              <Tooltip
                formatter={(value, name) => [`${value}%`, name]}
                contentStyle={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  color: '#0f172a',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>

        {/* Center Percentage Display */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: totalReadings > 0 ? '#059669' : '#94a3b8', lineHeight: 1 }}>
            {totalReadings > 0 ? `${in_range_pct}%` : '0%'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
            In Target
          </div>
        </div>
      </div>

      {/* Legend List */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
        {[
          { label: 'In Range', pct: in_range_pct, color: '#059669' },
          { label: 'High', pct: high_pct, color: '#d97706' },
          { label: 'Very High', pct: very_high_pct, color: '#b91c1c' },
          { label: 'Low', pct: low_pct, color: '#ea580c' },
          { label: 'Very Low', pct: very_low_pct, color: '#dc2626' },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: totalReadings > 0 ? item.color : '#cbd5e1' }} />
            <span style={{ fontSize: '0.78rem', color: '#475569' }}>
              {item.label}: <strong style={{ color: '#0f172a' }}>{totalReadings > 0 ? `${item.pct}%` : '—'}</strong>
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}
