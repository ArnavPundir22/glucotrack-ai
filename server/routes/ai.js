import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

router.post('/insights', async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 14 } = req.body;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const readings = await db.all(
      `SELECT * FROM glucose_readings 
       WHERE user_id = ? AND measured_at >= ?
       ORDER BY measured_at ASC`,
      [userId, startDate.toISOString()]
    );

    if (!readings || readings.length === 0) {
      return res.status(200).json({
        status: 'success',
        is_empty: true,
        summary: 'No readings logged yet for this period. Snap a photo of your glucometer display or log a reading manually to unlock personalized GlucoTrack AI metabolic insights.',
        patterns: [],
        recommendations: [],
        disclaimer: 'GlucoTrack AI provides analytical pattern identification for informational purposes only. Consult your physician for clinical decisions.',
      });
    }

    const total = readings.length;
    const mean = parseFloat((readings.reduce((a, b) => a + b.value_mgdl, 0) / total).toFixed(1));
    const eA1c = parseFloat(((mean + 46.7) / 28.7).toFixed(1));
    const inRangeCount = readings.filter((r) => r.value_mgdl >= 70 && r.value_mgdl <= 180).length;
    const tirPct = parseFloat(((inRangeCount / total) * 100).toFixed(1));

    const lowEvents = readings.filter((r) => r.value_mgdl < 70);
    const highEvents = readings.filter((r) => r.value_mgdl > 180);
    const postMealSpikes = readings.filter((r) => r.meal_context === 'post_meal' && r.value_mgdl > 180);
    const fastingHigh = readings.filter((r) => r.meal_context === 'fasting' && r.value_mgdl > 115);

    const apiKey = process.env.GEMINI_API_KEY;
    let structuredInsights = null;

    if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
      const modelNames = [
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
        'gemini-3.6-flash',
        'gemini-3.6-flash-lite',
        'gemini-1.5-flash-8b',
      ];

      for (const modelName of modelNames) {
        try {
          console.log(`[AI Advisor] Attempting Gemini model: ${modelName}...`);
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: modelName });

          const prompt = `
You are GlucoTrack AI, a professional medical metabolic health assistant.
Analyze this patient blood glucose data over the last ${days} days:

- Logged Readings: ${total}
- Mean Glucose: ${mean} mg/dL
- Estimated HbA1c (eA1c): ${eA1c}%
- Time-In-Range (70-180 mg/dL): ${tirPct}%
- Hypo Events (<70 mg/dL): ${lowEvents.length}
- Hyper Events (>180 mg/dL): ${highEvents.length}
- Post-Meal Spikes (>180 mg/dL): ${postMealSpikes.length}

Return ONLY a valid JSON object with NO MARKDOWN formatting, matching this exact schema:
{
  "summary": "Concise 1-2 sentence executive summary of glycemic stability and eA1c progress.",
  "patterns": [
    {
      "title": "Pattern Name",
      "type": "success" | "warning" | "alert",
      "description": "Specific observation on fasting/post-meal trends or variability."
    }
  ],
  "recommendations": [
    {
      "title": "Short Category Title",
      "detail": "Actionable lifestyle, carb timing, or hydration tip."
    }
  ],
  "disclaimer": "GlucoTrack AI insights are generated for informational pattern identification only. Consult your endocrinologist or physician for medical decisions."
}
`;

          const result = await model.generateContent(prompt);
          const responseText = result.response.text().trim();
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            structuredInsights = JSON.parse(jsonMatch[0]);
            console.log(`[AI Advisor] Success with model: ${modelName}`);
            break;
          }
        } catch (geminiErr) {
          console.warn(`[AI Advisor] Gemini model ${modelName} error:`, geminiErr.message);
        }
      }
    }

    if (!structuredInsights) {
      structuredInsights = generateStructuredFallback(days, total, mean, eA1c, tirPct, lowEvents, highEvents, postMealSpikes, fastingHigh);
    }

    const insightId = `ins_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    await db.run(
      `INSERT INTO ai_insights (id, user_id, period_days, summary_markdown, detected_patterns)
       VALUES (?, ?, ?, ?, ?)`,
      [insightId, userId, days, JSON.stringify(structuredInsights), JSON.stringify(structuredInsights.patterns || [])]
    );

    return res.status(200).json({
      status: 'success',
      is_empty: false,
      insight_id: insightId,
      summary: structuredInsights.summary,
      patterns: structuredInsights.patterns || [],
      recommendations: structuredInsights.recommendations || [],
      disclaimer: structuredInsights.disclaimer || 'GlucoTrack AI insights are for informational pattern identification only.',
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[AI Advisor] Insights generation error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

function generateStructuredFallback(days, total, mean, eA1c, tirPct, lowEvents, highEvents, postMealSpikes, fastingHigh) {
  const patterns = [];

  if (tirPct >= 70) {
    patterns.push({
      title: 'Target Time-In-Range Control',
      type: 'success',
      description: `Your Time-In-Range of ${tirPct}% meets the ADA clinical standard target (≥70%).`,
    });
  } else {
    patterns.push({
      title: 'Time-In-Range Focus',
      type: 'warning',
      description: `Your Time-In-Range is ${tirPct}%. Focus on identifying post-prandial spike triggers to expand target time.`,
    });
  }

  if (postMealSpikes.length > 0) {
    patterns.push({
      title: 'Post-Prandial Glucose Spikes',
      type: 'warning',
      description: `Recorded ${postMealSpikes.length} post-meal reading(s) exceeding 180 mg/dL target limit.`,
    });
  }

  if (lowEvents.length > 0) {
    patterns.push({
      title: 'Hypoglycemia Occurrences',
      type: 'alert',
      description: `Detected ${lowEvents.length} reading(s) below 70 mg/dL. Monitor exercise timing and quick-acting carb intake.`,
    });
  }

  if (fastingHigh.length > 0) {
    patterns.push({
      title: 'Elevated Morning Fasting Levels',
      type: 'warning',
      description: `Fasting readings averaged above 115 mg/dL. Review late evening snacks or dawn phenomenon dynamics.`,
    });
  }

  return {
    summary: `Over the past ${days} days across ${total} logged reading(s), your average glucose level is ${mean} mg/dL with an estimated HbA1c of ${eA1c}% and ${tirPct}% Time-In-Range.`,
    patterns,
    recommendations: [
      {
        title: 'Carbohydrate & Protein Pairing',
        detail: 'Combine complex carbs with lean protein and fiber to cushion post-meal glucose excursions.',
      },
      {
        title: 'Post-Dinner Walk',
        detail: 'A short 10-15 minute walk after meals helps enhance muscle glucose uptake and smooth out peaks.',
      },
      {
        title: 'Consistent Photo Logging',
        detail: 'Continue capturing glucometer display photos post-meal to track personal food responses.',
      },
    ],
    disclaimer: 'GlucoTrack AI insights are generated for informational pattern identification only. Always consult your physician or endocrinologist before adjusting medication or diet plans.',
  };
}

export default router;

