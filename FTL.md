# Feature Task List (FTL)
## Project Name: GlucoTrack AI

---

## 1. Overview
The Feature Task List (FTL) breaks down the project implementation into concrete, actionable engineering tasks. Each task specifies deliverables, acceptance criteria, tech stacks involved, and dependencies.

---

## 2. Feature & Task Matrix

### Core Track 1: Image Capture & Gemini Vision OCR Integration
| Task ID | Task Title | Description & Acceptance Criteria | Tech Layer | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **FTL-101** | Mobile/Web Camera Interface | Build responsive camera component supporting native device camera access, drag-and-drop file upload, flashlight toggle, and framing guide overlay. | Frontend (HTML5 / React) | High |
| **FTL-102** | Client-Side Image Preprocessor | Implement image resize (max 1920px width), JPEG compression, EXIF auto-rotation, and canvas contrast enhancement. | Frontend / JS Canvas | Medium |
| **FTL-103** | Gemini Vision API Client | Construct serverless API endpoint connecting to `gemini-2.5-flash` / `gemini-1.5-flash` with optimized JSON mode prompt. | Node.js / Python API | Critical |
| **FTL-104** | OCR Confidence & Fallback UI | Render confidence badge (Green/Yellow/Red) and editable input drawer allowing manual value/unit override before submission. | Frontend UI | High |

---

### Core Track 2: Database Schema & Reading Persistence
| Task ID | Task Title | Description & Acceptance Criteria | Tech Layer | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **FTL-201** | DB Schema Migration | Design and execute SQL migrations for `users`, `glucose_readings`, `ocr_audit_logs`, and `ai_insights` tables with index optimization on `(user_id, measured_at)`. | PostgreSQL / SQLite | Critical |
| **FTL-202** | Reading Ingestion API | Build RESTful `/api/v1/readings` POST/GET/PUT/DELETE endpoints with payload validation, rate-limiting, and unit standardizer. | Backend API | Critical |
| **FTL-203** | Meal & Context Tagging | Implement tag selector UI (Fasting, Pre-Meal, Post-Meal 2h, Bedtime, Exercise, Night) with smart default inference based on time of day. | Frontend UI | High |
| **FTL-204** | Historical Logbook Table | Develop paginated, sortable, filterable history view with inline edit, delete confirmation, and CSV download. | Frontend UI | Medium |

---

### Core Track 3: Trend Analytics & Statistical Engine
| Task ID | Task Title | Description & Acceptance Criteria | Tech Layer | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **FTL-301** | Time-In-Range (TIR) Calculator | Develop utility function calculating TIR breakdown (% In Range 70-180, % Low <70, % Very Low <54, % High >180, % Very High >250). | Backend / Utility | Critical |
| **FTL-302** | Estimated HbA1c (eA1c) Engine | Implement ADAG formula calculation (`eA1c = (mean_mgdl + 46.7) / 28.7`) requires minimum 14 readings across 7+ days. | Backend Analytics | High |
| **FTL-303** | Glycemic Variability Metrics | Compute Standard Deviation (SD) and Coefficient of Variation (`CV% = SD / Mean * 100`) with high-risk alerts when CV > 36%. | Backend Analytics | High |
| **FTL-304** | Modal Day 24-Hour Plot Data | Construct backend aggregation API grouping glucose readings into 24-hour time slots to populate overlay curves. | Backend API | Medium |

---

### Core Track 4: Interactive Charts & Visualizations
| Task ID | Task Title | Description & Acceptance Criteria | Tech Layer | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **FTL-401** | Glucose Trend Chart | Implement responsive multi-series time graph with color-coded target zones (Green 70-180 mg/dL), tooltips, and range selectors (7D, 14D, 30D, 90D). | Recharts / Chart.js | Critical |
| **FTL-402** | Time-In-Range Donut Chart | Build visual donut/pie chart displaying TIR percentages with standard clinical color codes (Green, Yellow, Red, Dark Red). | Charting Component | High |
| **FTL-403** | Meal Breakdown Bar Chart | Render comparative bar graph comparing pre-prandial vs post-prandial glucose averages across meals (Breakfast, Lunch, Dinner). | Charting Component | Medium |

---

### Core Track 5: Gemini AI Health Advisor & Reporting
| Task ID | Task Title | Description & Acceptance Criteria | Tech Layer | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **FTL-501** | AI Trend Analyzer Prompt | Develop system prompt passing structured 14-day history to Gemini API to detect hypoglycemic risks, meal spikes, and lifestyle tips. | LLM Engineering | Critical |
| **FTL-502** | AI Insights Widget | Build interactive frontend card displaying AI-generated summary, action items, and safety disclaimers. | Frontend UI | High |
| **FTL-503** | PDF Report Generator | Implement server-side or client-side PDF export compiling patient stats, trend graphs, logbook table, and doctor sign-off area. | PDF Service | Medium |

---

## 3. Dependency Mapping
```
[FTL-101 Camera] -> [FTL-102 Preprocessing] -> [FTL-103 Gemini Vision API] -> [FTL-104 Verification UI]
                                                                                      |
                                                                                      v
[FTL-201 DB Schema] ---------------------------------------------------------> [FTL-202 Ingestion API]
                                                                                      |
                                                                                      v
[FTL-301 TIR Calc] + [FTL-302 eA1c Engine] + [FTL-303 Variability] --------> [FTL-204 History Log]
                                  |
                                  +------------------------------------------> [FTL-401 Trend Chart]
                                  |
                                  v
                       [FTL-501 Gemini Insights] ----------------------------> [FTL-502 AI Widget]
```
