# Technical Architecture Document (TAD)
## Project Name: GlucoTrack AI

---

## 1. Concrete Technology Stack

| Domain | Selected Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 / Vite / JavaScript (ESNext) | Ultra-fast build times, modular component system, rich ecosystem for charting. |
| **Styling** | Modern Vanilla CSS (CSS Variables, Flexbox, Grid) | Zero dependency overhead, clean custom design system, dark-mode ready. |
| **Backend Runtime** | Node.js (Express / Fastify) OR Python (FastAPI) | High asynchronous I/O performance for image streaming and external API proxying. |
| **AI SDK** | `@google/genai` (Google Gen AI SDK) | Direct access to Gemini 2.5 Flash / 1.5 Flash Vision capabilities with structured JSON response mode. |
| **Database** | SQLite (Development) / PostgreSQL (Production) | ACID compliant, strong typing, indexing support, relational integrity for health records. |
| **Data Visualization** | Recharts / Chart.js | Hardware-accelerated SVG/Canvas charting with support for reference lines and custom tooltips. |

---

## 2. Database Schema (DDL)

```sql
-- Database Schema for GlucoTrack AI

-- 1. Users Table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    target_low_mgdl INT DEFAULT 70,
    target_high_mgdl INT DEFAULT 180,
    preferred_unit VARCHAR(10) DEFAULT 'mg/dL', -- 'mg/dL' or 'mmol/L'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Glucose Readings Table
CREATE TABLE glucose_readings (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    value_mgdl DECIMAL(5,2) NOT NULL,       -- Normalized standard storage in mg/dL
    original_value DECIMAL(5,2) NOT NULL,    -- Extracted original value
    original_unit VARCHAR(10) NOT NULL,      -- 'mg/dL' or 'mmol/L'
    meal_context VARCHAR(30) NOT NULL,       -- 'fasting', 'pre_meal', 'post_meal', 'bedtime', 'night', 'random'
    notes TEXT,
    measured_at TIMESTAMP NOT NULL,          -- Timestamp of reading (from glucometer or user override)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for fast user timeline querying
CREATE INDEX idx_readings_user_timestamp ON glucose_readings(user_id, measured_at DESC);

-- 3. OCR Audit Logs Table
CREATE TABLE ocr_audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    reading_id VARCHAR(36),
    image_url TEXT,
    raw_ai_response JSON,
    confidence_score DECIMAL(3,2),
    is_user_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reading_id) REFERENCES glucose_readings(id) ON DELETE SET NULL
);

-- 4. AI Insights History Table
CREATE TABLE ai_insights (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    period_days INT NOT NULL,                -- e.g., 7, 14, 30
    summary_markdown TEXT NOT NULL,
    detected_patterns JSON,                  -- e.g., ["morning_hypo", "post_dinner_spike"]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 3. REST API Specifications

### 3.1. Extract Reading from Image (Gemini Vision OCR)
- **Endpoint:** `POST /api/v1/ocr/extract`
- **Content-Type:** `multipart/form-data`
- **Request Body:**
  - `image`: Binary file (JPEG/PNG)
- **Response `200 OK`:**
  ```json
  {
    "status": "success",
    "data": {
      "value": 142,
      "unit": "mg/dL",
      "value_mgdl": 142,
      "confidence": 0.95,
      "detected_timestamp": "2026-09-07T08:15:00Z",
      "suggested_meal_context": "fasting",
      "bounding_box": { "x": 120, "y": 80, "width": 300, "height": 150 }
    }
  }
  ```

### 3.2. Create Glucose Reading
- **Endpoint:** `POST /api/v1/readings`
- **Content-Type:** `application/json`
- **Request Body:**
  ```json
  {
    "user_id": "usr_101",
    "value": 142,
    "unit": "mg/dL",
    "meal_context": "fasting",
    "notes": "Felt fine, after morning walk",
    "measured_at": "2026-09-07T08:15:00Z",
    "ocr_log_id": "ocr_8891"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "status": "success",
    "reading_id": "rdg_5502",
    "message": "Reading recorded successfully."
  }
  ```

### 3.3. Get Trend & Analytics Summary
- **Endpoint:** `GET /api/v1/analytics/trends?user_id=usr_101&days=14`
- **Response `200 OK`:**
  ```json
  {
    "status": "success",
    "period_days": 14,
    "summary": {
      "total_readings": 42,
      "average_mgdl": 134.5,
      "estimated_a1c": 6.3,
      "sd": 24.2,
      "cv_percent": 18.0,
      "time_in_range": {
        "very_low_pct": 0,
        "low_pct": 2.4,
        "in_range_pct": 85.7,
        "high_pct": 9.5,
        "very_high_pct": 2.4
      }
    },
    "readings_timeline": [
      { "id": "rdg_5502", "value_mgdl": 142, "meal_context": "fasting", "measured_at": "2026-09-07T08:15:00Z" }
    ]
  }
  ```

### 3.4. Generate Gemini AI Insights
- **Endpoint:** `POST /api/v1/ai/insights`
- **Request Body:** `{ "user_id": "usr_101", "days": 14 }`
- **Response `200 OK`:**
  ```json
  {
    "status": "success",
    "insight_id": "ins_9011",
    "insights_markdown": "### Key Findings\nYour glucose management over the past 14 days is stable with an **85.7% Time-In-Range**.\n\n- **Post-Breakfast Spike:** We noticed elevated readings around 10:00 AM (avg 195 mg/dL).\n- **Recommendation:** Consider reviewing carb ratios during breakfast.",
    "created_at": "2026-09-07T13:00:00Z"
  }
  ```

---

## 4. Gemini Prompt Template Specification

```javascript
// Gemini Vision OCR Prompt Structure
const OCR_PROMPT = `
You are an expert OCR vision assistant for medical glucometers.
Examine the provided image of a glucometer display screen.
Extract the following information in strict JSON format matching this schema:
{
  "value": number (the numerical glucose reading displayed),
  "unit": string ("mg/dL" or "mmol/L"),
  "confidence": number between 0.0 and 1.0,
  "device_timestamp": string ISO format if date/time is visible on display, otherwise null,
  "flags": array of strings (e.g. "low_battery", "error_code", "post_meal_icon")
}

If the image is not a glucometer display or value is unreadable, set value to null and confidence to 0.0.
Output ONLY the raw JSON object without markdown formatting.
`;
```
