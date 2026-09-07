# Development Phases & Roadmap (phases.md)
## Project Name: GlucoTrack AI

---

## 1. Roadmap Overview

```
+-----------------------------------------------------------------------------------+
|  PHASE 1: Project Setup & Gemini Vision OCR Engine                                |
|  [ Environment setup | Camera interface | Gemini 2.5/1.5 Vision API | Test Harness ]|
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|  PHASE 2: Persistence Layer & Logbook Management                                  |
|  [ Database DDL | REST APIs | Manual Verification UI | Historical Table ]          |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|  PHASE 3: Statistical Engine & Dynamic Trend Visualizations                       |
|  [ TIR & eA1c calculations | Recharts Trend Line | Donut & Bar Charts ]           |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|  PHASE 4: Gemini AI Health Insights & Pattern Advisor                             |
|  [ LLM Prompt Engineering | Pattern Detection | AI Summary Card Widget ]          |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|  PHASE 5: Quality Assurance, Security & Deployment                                |
|  [ Unit & E2E Testing | HIPAA Compliance Audit | Performance Tuning | Production ] |
+-----------------------------------------------------------------------------------+
```

---

## 2. Detailed Phase Execution Plan

### Phase 1: Core Foundation & Gemini Vision OCR Engine
- **Objective:** Establish the project codebase and deliver working camera-to-OCR extraction using Google Gemini API.
- **Tasks:**
  1. Initialize repository structure and configuration (`.env`, project dependencies).
  2. Implement HTML5 camera capture and client-side image compression.
  3. Create backend API route proxying base64 image requests to `@google/genai` Vision endpoint.
  4. Build image preview & extraction result JSON parsing.
- **Deliverables:** Working prototype capable of taking a photo of a glucometer display screen and displaying extracted value, unit, and confidence score.
- **Exit Criteria:** `> 95%` extraction accuracy on standard clean display images.

### Phase 2: Database Persistence & Logbook Management
- **Objective:** Enable reliable data persistence, meal tagging, and logbook CRUD operations.
- **Tasks:**
  1. Deploy SQL schema (`users`, `glucose_readings`, `ocr_audit_logs`).
  2. Implement backend REST API endpoints (`POST /readings`, `GET /readings`, `PUT /readings/:id`, `DELETE /readings/:id`).
  3. Build Verification Modal UI allowing users to edit extracted value, select unit, set date/time, and assign meal tags (`Fasting`, `Pre-Meal`, `Post-Meal`, `Bedtime`).
  4. Construct searchable, paginated history logbook table with CSV export.
- **Deliverables:** Complete reading lifecycle from photo confirmation to DB write and history list view.

### Phase 3: Trend & Analytics Engine with Interactive Charts
- **Objective:** Compute clinical glucose metrics and render rich interactive charts.
- **Tasks:**
  1. Develop statistical functions for:
     - 7D, 14D, 30D, 90D Mean Glucose
     - Time-In-Range (TIR %) breakdown
     - Estimated HbA1c (eA1c %) calculation via ADAG equation
     - Glycemic Variability (SD & CV%)
  2. Build Recharts / Chart.js components:
     - Multi-day trend line with target range zone shading (70–180 mg/dL).
     - TIR Donut / Pie chart with clinical color metrics.
     - Meal comparison bar chart (Pre vs Post meal averages).
- **Deliverables:** Fully interactive health analytics dashboard.

### Phase 4: Gemini AI Health Insights Advisor
- **Objective:** Leverage LLM intelligence to analyze longitudinal trends and provide context-aware insights.
- **Tasks:**
  1. Engineer prompt templates feeding 14-day user history, stats, and meal tags to Gemini LLM.
  2. Implement pattern detection rules (Dawn phenomenon, post-meal spikes, nocturnal lows).
  3. Build AI Health Advisor UI widget rendering formatted markdown cards.
  4. Enforce strict safety guardrails and medical disclaimer injection.
- **Deliverables:** Personalized AI health summary engine.

### Phase 5: Hardening, Security & Release
- **Objective:** Ensure performance, security compliance, responsiveness, and deployment readiness.
- **Tasks:**
  1. Conduct mobile responsiveness and cross-browser testing.
  2. Implement rate-limiting, CORS, and SQL injection defenses.
  3. Optimize bundle size and image compression speeds (< 2.5s end-to-end latency).
  4. Deploy application to cloud infrastructure (Vercel / Cloudflare Workers / Node Server).
- **Deliverables:** Production-grade GlucoTrack AI web application.
