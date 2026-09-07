import express from 'express';
import { db } from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

router.get('/trends', async (req, res) => {
  try {
    const userId = req.user.id;
    const periodDays = parseInt(req.query.days, 10) || 14;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);
    const startDateIso = startDate.toISOString();

    const readings = await db.all(
      `SELECT * FROM glucose_readings 
       WHERE user_id = ? AND measured_at >= ?
       ORDER BY measured_at ASC`,
      [userId, startDateIso]
    );

    if (readings.length === 0) {
      return res.status(200).json({
        status: 'success',
        period_days: periodDays,
        summary: {
          total_readings: 0,
          average_mgdl: 0,
          estimated_a1c: 0,
          sd: 0,
          cv_percent: 0,
          time_in_range: {
            very_low_pct: 0,
            low_pct: 0,
            in_range_pct: 0,
            high_pct: 0,
            very_high_pct: 0,
          },
        },
        readings_timeline: [],
        meal_averages: [],
      });
    }

    // 1. Mean Glucose
    const totalSum = readings.reduce((acc, r) => acc + r.value_mgdl, 0);
    const meanMgDl = parseFloat((totalSum / readings.length).toFixed(1));

    // 2. Estimated HbA1c (ADAG formula)
    const eA1c = parseFloat(((meanMgDl + 46.7) / 28.7).toFixed(1));

    // 3. Glycemic Variability (SD & CV%)
    const variance = readings.reduce((acc, r) => acc + Math.pow(r.value_mgdl - meanMgDl, 2), 0) / readings.length;
    const sd = parseFloat(Math.sqrt(variance).toFixed(1));
    const cvPercent = meanMgDl > 0 ? parseFloat(((sd / meanMgDl) * 100).toFixed(1)) : 0;

    // 4. Time-In-Range (TIR %) Categories
    let countVeryLow = 0;  // < 54
    let countLow = 0;      // 54 - 69
    let countInRange = 0;  // 70 - 180
    let countHigh = 0;     // 181 - 250
    let countVeryHigh = 0; // > 250

    readings.forEach((r) => {
      const v = r.value_mgdl;
      if (v < 54) countVeryLow++;
      else if (v < 70) countLow++;
      else if (v <= 180) countInRange++;
      else if (v <= 250) countHigh++;
      else countVeryHigh++;
    });

    const total = readings.length;
    const tir = {
      very_low_pct: parseFloat(((countVeryLow / total) * 100).toFixed(1)),
      low_pct: parseFloat(((countLow / total) * 100).toFixed(1)),
      in_range_pct: parseFloat(((countInRange / total) * 100).toFixed(1)),
      high_pct: parseFloat(((countHigh / total) * 100).toFixed(1)),
      very_high_pct: parseFloat(((countVeryHigh / total) * 100).toFixed(1)),
    };

    // 5. Meal Context Averages
    const mealGroups = {};
    readings.forEach((r) => {
      const ctx = r.meal_context || 'random';
      if (!mealGroups[ctx]) mealGroups[ctx] = { count: 0, sum: 0 };
      mealGroups[ctx].count++;
      mealGroups[ctx].sum += r.value_mgdl;
    });

    const mealAverages = Object.keys(mealGroups).map((ctx) => ({
      context: ctx,
      average_mgdl: parseFloat((mealGroups[ctx].sum / mealGroups[ctx].count).toFixed(1)),
      count: mealGroups[ctx].count,
    }));

    return res.status(200).json({
      status: 'success',
      period_days: periodDays,
      summary: {
        total_readings: total,
        average_mgdl: meanMgDl,
        estimated_a1c: eA1c,
        sd,
        cv_percent: cvPercent,
        time_in_range: tir,
      },
      readings_timeline: readings,
      meal_averages: mealAverages,
    });
  } catch (err) {
    console.error('[Analytics API] Error computing trends:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

export default router;

