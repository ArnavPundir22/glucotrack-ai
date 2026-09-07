import React, { useState } from 'react';
import { Search, Filter, Edit2, Trash2, PlusCircle } from 'lucide-react';

export default function LogbookTable({
  readings = [],
  preferredUnit = 'mg/dL',
  onEditReading,
  onDeleteReading,
  onOpenManual,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [contextFilter, setContextFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredReadings = readings.filter((r) => {
    const matchesContext = contextFilter === 'all' || r.meal_context === contextFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (r.notes && r.notes.toLowerCase().includes(term)) ||
      r.meal_context.toLowerCase().includes(term) ||
      String(r.original_value).includes(term);

    return matchesContext && matchesSearch;
  });

  const totalPages = Math.ceil(filteredReadings.length / itemsPerPage) || 1;
  const paginatedReadings = filteredReadings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', background: '#ffffff' }}>
      
      {/* Table Header Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', color: '#0f172a', fontWeight: 700, margin: 0 }}>
            Historical Glucose Logbook
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
            Searchable clinical records ({filteredReadings.length} total entries)
          </p>
        </div>

        {/* Filter Inputs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          
          {/* Search Input */}
          <div style={{ position: 'relative', width: '200px' }}>
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '7px 10px 7px 32px',
                borderRadius: 'var(--radius-sm)',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#0f172a',
                fontSize: '0.82rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Context Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} color="#94a3b8" />
            <select
              value={contextFilter}
              onChange={(e) => {
                setContextFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '7px 10px',
                borderRadius: 'var(--radius-sm)',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#0f172a',
                fontSize: '0.82rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Contexts</option>
              <option value="fasting">Fasting</option>
              <option value="pre_meal">Pre-Meal</option>
              <option value="post_meal">Post-Meal</option>
              <option value="bedtime">Bedtime</option>
              <option value="exercise">Exercise</option>
              <option value="random">Random</option>
            </select>
          </div>

        </div>
      </div>

      {/* Logbook Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '12px 14px' }}>Date & Time</th>
              <th style={{ padding: '12px 14px' }}>Reading ({preferredUnit})</th>
              <th style={{ padding: '12px 14px' }}>Prandial Context</th>
              <th style={{ padding: '12px 14px' }}>Notes</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedReadings.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ marginBottom: '8px' }}>No glucose logs recorded yet.</div>
                  <button className="btn btn-primary btn-sm" onClick={onOpenManual}>
                    <PlusCircle size={14} /> Add First Entry
                  </button>
                </td>
              </tr>
            ) : (
              paginatedReadings.map((r) => {
                const dateObj = new Date(r.measured_at);
                const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                const timeStr = dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

                const isTarget = r.value_mgdl >= 70 && r.value_mgdl <= 180;
                const isHigh = r.value_mgdl > 180;

                const displayValue = preferredUnit === 'mmol/L'
                  ? (r.value_mgdl / 18.018).toFixed(1)
                  : Math.round(r.value_mgdl);

                return (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'var(--transition)',
                    }}
                  >
                    <td style={{ padding: '12px 14px', color: '#0f172a', whiteSpace: 'nowrap' }}>
                      <div>{dateStr}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{timeStr}</div>
                    </td>

                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <span
                        className={`badge ${isTarget ? 'badge-target' : isHigh ? 'badge-high' : 'badge-low'}`}
                        style={{ fontSize: '0.9rem', padding: '4px 10px', textTransform: 'none' }}
                      >
                        {displayValue} {preferredUnit}
                      </span>
                    </td>

                    <td style={{ padding: '12px 14px', textTransform: 'capitalize', color: '#475569' }}>
                      {r.meal_context ? r.meal_context.replace('_', ' ') : 'Random'}
                    </td>

                    <td style={{ padding: '12px 14px', color: '#64748b', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.notes || '—'}
                    </td>

                    <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => onEditReading(r)}
                        style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginRight: '10px' }}
                        title="Edit Record"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => onDeleteReading(r.id)}
                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                        title="Delete Record"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', fontSize: '0.82rem', color: '#64748b' }}>
          <div>
            Page {currentPage} of {totalPages}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
