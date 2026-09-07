import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Sparkles, FileText } from 'lucide-react';

export default function VerificationModal({
  isOpen,
  onClose,
  ocrResult,
  isManual = false,
  onSaveReading,
}) {
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('mg/dL');
  const [mealContext, setMealContext] = useState('fasting');
  const [notes, setNotes] = useState('');
  const [measuredAt, setMeasuredAt] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (ocrResult) {
        setValue(ocrResult.value !== undefined ? String(ocrResult.value) : '');
        setUnit(ocrResult.unit || 'mg/dL');
        setMealContext(ocrResult.suggested_meal_context || 'post_meal');
        setNotes('');

        const now = new Date();
        const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setMeasuredAt(localIso);
      } else if (isManual) {
        setValue('');
        setUnit('mg/dL');
        setMealContext('fasting');
        setNotes('');
        const now = new Date();
        const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setMeasuredAt(localIso);
      }
    }
  }, [isOpen, ocrResult, isManual]);

  if (!isOpen) return null;

  const handleConfirm = (e) => {
    e.preventDefault();
    if (!value || isNaN(value) || parseFloat(value) <= 0) return;

    onSaveReading({
      value: parseFloat(value),
      unit,
      meal_context: mealContext,
      notes,
      measured_at: new Date(measuredAt).toISOString(),
      ocr_log_id: ocrResult ? ocrResult.ocr_log_id : null,
      is_edited: ocrResult ? parseFloat(value) !== ocrResult.value : false,
    });
  };

  const confidencePct = ocrResult ? Math.round((ocrResult.confidence || 0.95) * 100) : 100;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', background: '#ffffff' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: isManual ? 'var(--gradient-primary)' : 'var(--gradient-ai)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}>
              {isManual ? <FileText size={18} /> : <Sparkles size={18} />}
            </div>
            <h3 style={{ fontSize: '1.25rem', color: '#0f172a', margin: 0 }}>
              {isManual ? 'Manual Glucose Entry' : 'Verify AI Extracted Reading'}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleConfirm}>
          
          {ocrResult && (
            <div style={{
              display: 'flex',
              gap: '16px',
              background: '#f8fafc',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              alignItems: 'center',
              border: '1px solid #e2e8f0',
            }}>
              {ocrResult.image_preview && (
                <img
                  src={ocrResult.image_preview}
                  alt="Glucometer Crop"
                  style={{ width: '84px', height: '64px', objectFit: 'cover', borderRadius: '8px' }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="badge badge-target">
                    <CheckCircle size={12} /> {confidencePct}% AI Confidence
                  </span>
                  {ocrResult.device_brand && (
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Brand: {ocrResult.device_brand}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.78rem', color: '#475569', margin: 0 }}>
                  Please review the detected value below before confirming to save.
                </p>
              </div>
            </div>
          )}

          {/* Value & Unit Input */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', fontWeight: 600, marginBottom: '6px' }}>
                Blood Glucose Value *
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. 126"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', fontWeight: 600, marginBottom: '6px' }}>
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
              >
                <option value="mg/dL">mg/dL</option>
                <option value="mmol/L">mmol/L</option>
              </select>
            </div>
          </div>

          {/* Meal Context Pills */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', fontWeight: 600, marginBottom: '8px' }}>
              Meal & Event Context Tag
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {[
                { id: 'fasting', label: '🌅 Fasting' },
                { id: 'pre_meal', label: '🥗 Pre-Meal' },
                { id: 'post_meal', label: '🍱 Post-Meal' },
                { id: 'bedtime', label: '🌙 Bedtime' },
                { id: 'exercise', label: '🏃 Exercise' },
                { id: 'random', label: '⏱️ Random' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setMealContext(item.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid',
                    borderColor: mealContext === item.id ? '#0284c7' : '#cbd5e1',
                    background: mealContext === item.id ? '#f0f9ff' : '#f8fafc',
                    color: mealContext === item.id ? '#0284c7' : '#475569',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Measured Timestamp */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', fontWeight: 600, marginBottom: '6px' }}>
              Measurement Date & Time
            </label>
            <input
              type="datetime-local"
              value={measuredAt}
              onChange={(e) => setMeasuredAt(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', fontWeight: 600, marginBottom: '6px' }}>
              Notes & Food Context (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. After 45m walk, high carb meal"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
              Confirm & Save Log
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
