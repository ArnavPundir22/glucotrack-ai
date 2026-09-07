import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

router.get('/csv', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : req.query.token;

    let userId = 'usr_default';
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (e) {
        // Fallback or unauthorized
      }
    }

    const readings = await db.all(
      `SELECT * FROM glucose_readings 
       WHERE user_id = ? 
       ORDER BY measured_at DESC`,
      [userId]
    );

    let csvContent = 'ID,Date Time (ISO),Value (mg/dL),Original Value,Original Unit,Meal Context,Notes\n';

    readings.forEach((r) => {
      const cleanNotes = (r.notes || '').replace(/"/g, '""');
      csvContent += `"${r.id}","${r.measured_at}",${r.value_mgdl},${r.original_value},"${r.original_unit}","${r.meal_context}","${cleanNotes}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="glucotrack_logbook_${new Date().toISOString().split('T')[0]}.csv"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    console.error('[Export API] CSV export error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

export default router;

