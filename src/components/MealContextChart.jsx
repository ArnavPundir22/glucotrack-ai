import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export default function MealContextChart({ mealAverages = [], preferredUnit = 'mg/dL' }) {
  const formattedData = mealAverages.map((item) => {
    const displayAvg = preferredUnit === 'mmol/L'
      ? parseFloat((item.average_mgdl / 18.018).toFixed(1))
      : item.average_mgdl;

    const labelMap = {
      fasting: 'Fasting',
      pre_meal: 'Pre-Meal',
      post_meal: 'Post-Meal',
      bedtime: 'Bedtime',
      exercise: 'Exercise',
      random: 'Random',
    };

    return {
      context: item.context,
      label: labelMap[item.context] || item.context,
      averageMgDl: item.average_mgdl,
      displayAvg: displayAvg,
      count: item.count,
    };
  });

  return (
    <div className="glass-card" style={{ padding: '24px', height: '100%', background: '#ffffff' }}>
      <h3 style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 700, marginBottom: '6px' }}>
        Meal & Context Comparisons
      </h3>
      <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '16px' }}>
        Average glucose readings grouped by prandial context
      </p>

      <div style={{ width: '100%', height: '230px' }}>
        {formattedData.length === 0 ? (
          <div style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            fontSize: '0.85rem',
            background: '#f8fafc',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed #cbd5e1',
          }}>
            No context data logged yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                formatter={(val, name, props) => [`${val} ${preferredUnit} (${props.payload.count} logs)`, 'Average']}
                contentStyle={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  color: '#0f172a',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              />
              <Bar dataKey="displayAvg" radius={[6, 6, 0, 0]}>
                {formattedData.map((entry, index) => {
                  let barColor = '#0284c7';
                  if (entry.averageMgDl > 180) barColor = '#d97706';
                  else if (entry.averageMgDl < 70) barColor = '#dc2626';
                  else if (entry.context === 'fasting') barColor = '#059669';

                  return <Cell key={`bar-${index}`} fill={barColor} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
