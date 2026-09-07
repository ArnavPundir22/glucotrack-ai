import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDatabase } from './db.js';
import authRouter from './routes/auth.js';
import ocrRouter from './routes/ocr.js';
import readingsRouter from './routes/readings.js';
import analyticsRouter from './routes/analytics.js';
import aiRouter from './routes/ai.js';
import exportRouter from './routes/export.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database & Seed data if empty
initDatabase();

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Healthcheck
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'GlucoTrack AI API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/ocr', ocrRouter);
app.use('/api/v1/readings', readingsRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1/export', exportRouter);

// Serve static frontend in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) res.status(200).send('GlucoTrack AI Backend Running (Dev Mode)');
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  🩸 GlucoTrack AI Backend running on port ${PORT}`);
  console.log(`  🔗 Health Check: http://localhost:${PORT}/api/v1/health`);
  console.log(`=======================================================`);
});
