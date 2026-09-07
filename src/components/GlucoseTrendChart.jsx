import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { Activity, PlusCircle } from 'lucide-react';

export default function GlucoseTrendChart({
  readings = [],
  periodDays = 14,
  onPeriodChange,
  preferredUnit = 'mg/dL',
  onOpenManual,
  isDark = true,
}) {
  const chartData = readings.map((r) => {
    const dateObj = new Date(r.measured_at);
    const dateStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()} ${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
    
    const displayVal = preferredUnit === 'mmol/L'
      ? parseFloat((r.value_mgdl / 18.018).toFixed(1))
      : r.value_mgdl;

    return {
      id: r.id,
      timestamp: r.measured_at,
      dateFormatted: dateStr,
      valueMgDl: r.value_mgdl,
      displayVal: displayVal,
      mealContext: r.meal_context || 'random',
      notes: r.notes || '',
    };
  });

  const targetLow = preferredUnit === 'mmol/L' ? 3.9 : 70;
  const targetHigh = preferredUnit === 'mmol/L' ? 10.0 : 180;
  const yDomainMin = preferredUnit === 'mmol/L' ? 2.0 : 40;
  const yDomainMax = preferredUnit === 'mmol/L' ? 16.0 : 280;

  // Custom Tooltip Card
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isTarget = data.valueMgDl >= 70 && data.valueMgDl <= 180;
      const isHigh = data.valueMgDl > 180;

      return (
        <div style={{
          background: isDark ? '#0f172a' : '#ffffff',
          border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
          color: isDark ? '#f8fafc' : '#0f172a',
        }}>
          <div style={{ fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#64748b', marginBottom: '4px' }}>
            {new Date(data.timestamp).toLocaleString()}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: isTarget ? '#10b981' : isHigh ? '#f59e0b' : '#ef4444'
            }}>
              {data.displayVal} {preferredUnit}
            </span>
            <span className={`badge ${isTarget ? 'badge-target' : isHigh ? 'badge-high' : 'badge-low'}`}>
              {isTarget ? 'In Target' : isHigh ? 'High' : 'Low'}
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: isDark ? '#cbd5e1' : '#475569' }}>
            Context: <strong style={{ textTransform: 'capitalize', color: isDark ? '#38bdf8' : '#0f172a' }}>{data.mealContext.replace('_', ' ')}</strong>
          </div>
          {data.notes && (
            <div style={{ fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#64748b', marginTop: '4px', fontStyle: 'italic' }}>
              "{data.notes}"
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const renderCustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;

    const val = payload.valueMgDl;
    let color = '#10b981'; // Emerald Green
    if (val < 70) color = '#ef4444'; // Red
    else if (val > 180) color = '#f59e0b'; // Amber

    return (
      <circle
        key={`dot-${payload.id}`}
        cx={cx}
        cy={cy}
        r={5}
        fill={color}
        stroke={isDark ? '#1e293b' : '#ffffff'}
        strokeWidth={2}
      />
    );
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}>
      {chartData.length === 0 ? (
        <div style={{
          height: '240px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: isDark ? 'rgba(15, 23, 42, 0.5)' : '#f8fafc',
          borderRadius: 'var(--radius-md)',
          border: `1px dashed ${isDark ? '#334155' : '#cbd5e1'}`,
          padding: '24px',
          textAlign: 'center',
        }}>
          <Activity size={36} color={isDark ? '#38bdf8' : '#94a3b8'} style={{ marginBottom: '10px' }} />
          <h4 style={{ color: isDark ? '#f8fafc' : '#0f172a', marginBottom: '4px', fontWeight: 700 }}>No Readings Logged Yet</h4>
          <p style={{ fontSize: '0.82rem', color: isDark ? '#94a3b8' : '#64748b', marginBottom: '16px', maxWidth: '380px' }}>
            Your glucose trend line will automatically render here as soon as you record your first reading.
          </p>
          <button className="btn btn-primary btn-sm" onClick={onOpenManual}>
            <PlusCircle size={14} /> Add First Reading
          </button>
        </div>
      ) : (
        <div style={{ width: '100%', height: '240px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="trendGradientDark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#f1f5f9'} vertical={false} />
              <ReferenceArea y1={targetLow} y2={targetHigh} fill="#10b981" fillOpacity={isDark ? 0.12 : 0.08} stroke="none" />
              <ReferenceLine y={targetHigh} stroke="#f59e0b" strokeDasharray="4 4" opacity={0.6} />
              <ReferenceLine y={targetLow} stroke="#ef4444" strokeDasharray="4 4" opacity={0.6} />

              <XAxis dataKey="dateFormatted" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} />
              <YAxis domain={[yDomainMin, yDomainMax]} stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} />

              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="displayVal"
                stroke="#38bdf8"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#trendGradientDark)"
                dot={renderCustomDot}
                activeDot={{ r: 7, stroke: '#38bdf8', strokeWidth: 2, fill: '#0f172a' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

