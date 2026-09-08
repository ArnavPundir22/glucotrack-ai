# 🩸 GlucoTrack AI — Smart Glucometer Reading & Analytics System

> An intelligent, AI-powered health monitoring application for zero-friction blood glucose logging, Time-In-Range (TIR) analytics, and personalized metabolic insights powered by Google Gemini Vision & LLM.

---

## 🌟 Executive Summary

**GlucoTrack AI** bridges the gap between daily handheld glucometer testing and meaningful long-term glycemic control. By leveraging Computer Vision (Google Gemini 1.5/2.0 Flash Vision API), users can take a photo of their handheld glucometer LCD display screen. The system automatically isolates the 7-segment digital reading, detects measurement units (`mg/dL` or `mmol/L`), verifies visual confidence, and saves the entry to an encrypted logbook.

The application automatically translates raw glucose readings into actionable clinical analytics:
- **Interactive Glucose Trend Lines** with target threshold bands (70–180 mg/dL).
- **Time-In-Range (TIR) Donut Charts** across 5 clinical glycemic zones.
- **Estimated HbA1c (eA1c)** using the standardized ADAG formula.
- **Glycemic Variability Analysis** (Standard Deviation & Coefficient of Variation CV%).
- **Personalized AI Health Insights** generated via Google Gemini.
- **Installable Progressive Web App (PWA)** with offline caching support.

---

## 📸 Key Features Overview

### 1. Computer Vision Glucometer OCR
- Takes photo inputs via web/mobile camera or file uploads.
- Analyzes LCD 7-segment display geometry (differentiating 8 vs 0, 6 vs 5 vs 9, 1 vs 7, and decimal points).
- Automatic unit conversion (\(1 \text{ mmol/L} = 18.018 \text{ mg/dL}\)).
- Interactive **Verification Modal** allowing user overrides prior to final log saving.

### 2. Clinical Analytics & Visualization
- **Time-In-Range Breakdown**: Categorizes measurements into Very Low (<54), Low (54–69), In Target Range (70–180), High (181–250), and Very High (>250 mg/dL).
- **Estimated HbA1c (eA1c)**: Calculated as \(eA1c (\%) = \frac{\bar{G} + 46.7}{28.7}\).
- **Meal Context Breakdown**: Average glucose grouping by Fasting, Pre-Meal, Post-Meal, Bedtime, and Random.

### 3. Gemini AI Health Insights
- Detects recurring patterns (e.g. post-breakfast spikes, dawn phenomenon, nocturnal hypoglycemia).
- Generates contextual markdown summaries with non-diagnostic recommendations.

### 4. Enterprise-Grade Dual Database
- Zero-config engine running on **SQLite3** for local development and **PostgreSQL** for cloud production deployments.

---

## 📚 Project Documentation Catalog

To keep documentation clean, modular, and professional, detailed specifications are organized into dedicated sub-documentation files inside the [`docs/`](file:///home/dell/glucotrack-ai/docs) directory:

| Document | Topic & Focus Area | Description |
| :--- | :--- | :--- |
| 🏗️ **[System Architecture](file:///home/dell/glucotrack-ai/docs/ARCHITECTURE.md)** | `docs/ARCHITECTURE.md` | Decoupled client-server topology, component taxonomy, data flow sequence diagrams, dual-database design, and schema ERD. |
| 🔌 **[API Specification](file:///home/dell/glucotrack-ai/docs/API_SPECIFICATION.md)** | `docs/API_SPECIFICATION.md` | Complete REST API reference covering Auth, OCR extraction, Readings CRUD, Analytics, AI Insights, and CSV/PDF export endpoints. |
| 👁️ **[AI Vision & Insights](file:///home/dell/glucotrack-ai/docs/AI_VISION_AND_INSIGHTS.md)** | `docs/AI_VISION_AND_INSIGHTS.md` | Computer Vision prompt geometry rules, 7-segment display OCR parsing, API key fallback rotation, and eA1c/TIR statistical formulas. |
| 🎨 **[Frontend & PWA Guide](file:///home/dell/glucotrack-ai/docs/FRONTEND_AND_PWA.md)** | `docs/FRONTEND_AND_PWA.md` | React 18 component taxonomy, custom event reactivity (`readingsUpdated`), Recharts visualization engine, and Service Worker offline caching. |
| 🚀 **[Development & Deployment](file:///home/dell/glucotrack-ai/docs/DEVELOPMENT_AND_DEPLOYMENT.md)** | `docs/DEVELOPMENT_AND_DEPLOYMENT.md` | Local setup guide, environment variables reference (`.env.example`), Render.com deployment blueprint (`render.yaml`), and keep-alive worker. |
| 📋 **[Design Specifications](file:///home/dell/glucotrack-ai/docs/specs/)** | `docs/specs/` | Historical PRD, Functional (FAD), System (SAD), Technical (TAD), and Roadmap (phases.md) design documentation. |

---

## 🚀 Quick Start Guide

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/ArnavPundir22/glucotrack-ai.git
cd glucotrack-ai
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and set your credentials:
```bash
cp .env.example .env
```
Provide your Google Gemini API key:
```env
GEMINI_API_KEY=YOUR_PRIMARY_GEMINI_API_KEY
JWT_SECRET=your_secure_jwt_secret_key
PORT=5000
```

### 3. Run Development Mode
```bash
npm run dev
```
- **Client (Vite)**: `http://localhost:5173`
- **Server (Express)**: `http://localhost:5000`

---

## 📂 Repository Directory Tree

```
glucotrack-ai/
├── docs/                       # Comprehensive documentation directory
│   ├── AI_VISION_AND_INSIGHTS.md
│   ├── API_SPECIFICATION.md
│   ├── ARCHITECTURE.md
│   ├── DEVELOPMENT_AND_DEPLOYMENT.md
│   ├── FRONTEND_AND_PWA.md
│   └── specs/                  # PRD, FAD, SAD, TAD & roadmap design specifications
├── server/                     # Express API Backend
│   ├── index.js                # Server entry point & keep-alive worker
│   ├── db.js                   # Dual DB driver (SQLite & PostgreSQL)
│   ├── middleware/             # Express JWT auth middleware
│   └── routes/                 # Endpoint controllers (auth, ocr, readings, ai, analytics, export)
├── src/                        # React 18 Frontend
│   ├── App.jsx                 # Main SPA container & state coordinator
│   ├── main.jsx                # Application root mounting
│   ├── index.css               # Design tokens & glassmorphism styling
│   ├── pwaRegister.js          # Service Worker PWA registration
│   └── components/             # Reusable UI component modules
├── public/                     # Static PWA assets & manifest
├── index.html                  # HTML entry template
├── package.json                # Dependencies & scripts
├── render.yaml                 # Render.com IaC deployment blueprint
└── vite.config.js              # Vite bundler configuration
```

---

## ⚖️ Medical Safety Disclaimer

> **IMPORTANT**: GlucoTrack AI is an informational tool designed to assist users in tracking blood glucose values. It does not provide medical diagnosis, treatment recommendations, or clinical prescription advice. Users should always consult a licensed healthcare professional for medical guidance.
