import express from 'express';
import { db } from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Apply JWT auth middleware to all reading routes
router.use(verifyToken);

// GET all readings with optional search & filter
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const contextFilter = req.query.context || null;
    const searchQuery = req.query.search || null;
    const limit = parseInt(req.query.limit, 10) || 100;

    let sql = `SELECT * FROM glucose_readings WHERE user_id = ?`;
    const params = [userId];

    if (contextFilter && contextFilter !== 'all') {
      sql += ` AND meal_context = ?`;
      params.push(contextFilter);
    }

    if (searchQuery) {
      sql += ` AND (notes LIKE ? OR original_value LIKE ? OR meal_context LIKE ?)`;
      const term = `%${searchQuery}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY measured_at DESC LIMIT ?`;
    params.push(limit);

    const readings = await db.all(sql, params);
    const totalRow = await db.get(`SELECT COUNT(*) as count FROM glucose_readings WHERE user_id = ?`, [userId]);

    return res.status(200).json({
      status: 'success',
      total: totalRow ? totalRow.count : 0,
      count: readings.length,
      data: readings,
    });
  } catch (err) {
    console.error('[Readings API] Error fetching readings:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST new reading
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      value,
      unit = 'mg/dL',
      meal_context = 'random',
      notes = '',
      measured_at = new Date().toISOString(),
      ocr_log_id = null,
      is_edited = false,
    } = req.body;

    if (value === undefined || value === null || isNaN(value)) {
      return res.status(400).json({ status: 'error', message: 'Valid glucose value is required.' });
    }

    const numericVal = parseFloat(value);
    let valMgDl = numericVal;

    if (unit === 'mmol/L') {
      valMgDl = parseFloat((numericVal * 18.018).toFixed(1));
    }

    const readingId = `rdg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    await db.run(
      `INSERT INTO glucose_readings (id, user_id, value_mgdl, original_value, original_unit, meal_context, notes, measured_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [readingId, userId, valMgDl, numericVal, unit, meal_context, notes, measured_at]
    );

    if (ocr_log_id) {
      await db.run(
        `UPDATE ocr_audit_logs SET reading_id = ?, is_user_edited = ? WHERE id = ?`,
        [readingId, is_edited ? 1 : 0, ocr_log_id]
      );
    }

    return res.status(201).json({
      status: 'success',
      message: 'Glucose reading recorded successfully.',
      data: {
        id: readingId,
        user_id: userId,
        value_mgdl: valMgDl,
        original_value: numericVal,
        original_unit: unit,
        meal_context,
        notes,
        measured_at,
      },
    });
  } catch (err) {
    console.error('[Readings API] Error creating reading:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// PUT update reading
router.put('/:id', async (req, res) => {
  try {
    const readingId = req.params.id;
    const userId = req.user.id;
    const { value, unit = 'mg/dL', meal_context, notes, measured_at } = req.body;

    const existing = await db.get('SELECT * FROM glucose_readings WHERE id = ? AND user_id = ?', [readingId, userId]);
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Glucose reading not found.' });
    }

    const numericVal = value !== undefined ? parseFloat(value) : existing.original_value;
    const currentUnit = unit || existing.original_unit;
    let valMgDl = numericVal;

    if (currentUnit === 'mmol/L') {
      valMgDl = parseFloat((numericVal * 18.018).toFixed(1));
    }

    await db.run(
      `UPDATE glucose_readings
       SET value_mgdl = ?, original_value = ?, original_unit = ?, meal_context = ?, notes = ?, measured_at = ?
       WHERE id = ? AND user_id = ?`,
      [
        valMgDl,
        numericVal,
        currentUnit,
        meal_context || existing.meal_context,
        notes !== undefined ? notes : existing.notes,
        measured_at || existing.measured_at,
        readingId,
        userId,
      ]
    );

    return res.status(200).json({
      status: 'success',
      message: 'Reading updated successfully.',
    });
  } catch (err) {
    console.error('[Readings API] Error updating reading:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// DELETE reading
router.delete('/:id', async (req, res) => {
  try {
    const readingId = req.params.id;
    const userId = req.user.id;
    const result = await db.run('DELETE FROM glucose_readings WHERE id = ? AND user_id = ?', [readingId, userId]);

    if (result.changes === 0) {
      return res.status(404).json({ status: 'error', message: 'Glucose reading not found.' });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Glucose reading deleted successfully.',
    });
  } catch (err) {
    console.error('[Readings API] Error deleting reading:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

export default router;

