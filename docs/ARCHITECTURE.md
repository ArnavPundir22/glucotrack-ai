# GlucoTrack AI — System Architecture & Design Specification

This document provides a detailed overview of the system architecture, component interaction, data flow, dual-database design, and security model for **GlucoTrack AI**.

---

## 1. High-Level System Architecture

GlucoTrack AI is built as a full-stack, decoupled Web/PWA application with a Node.js Express API server and a React single-page application.

```mermaid
graph TD
    subgraph Client ["Client Layer (Web / PWA)"]
        UI["React 18 SPA (Vite)"]
        SW["Service Worker (PWA Offline Cache)"]
        Charts["Recharts Engine (TIR, Trends)"]
        Cam["Camera / File Upload Interface"]
    end

    subgraph Backend ["API Server Layer (Node.js & Express)"]
        Router["Express API Router (/api/v1)"]
        AuthMid["JWT Auth Middleware"]
        OCRMod["Multer & OCR Service Module"]
        AIMod["AI Insights Engine"]
        AnalyticsMod["Analytics & Stats Engine"]
    end

    subgraph External ["External Services"]
        Gemini["Google Gemini API (Vision / Text LLM)"]
    end

    subgraph Storage ["Persistence Layer (Dual-Database Driver)"]
        SQLite[("SQLite3 (Local / Dev)")]
        PG[("PostgreSQL (Cloud / Render Prod)")]
    end

    UI --> Router
    UI --> SW
    UI --> Cam
    UI --> Charts

    Router --> AuthMid
    AuthMid --> OCRMod
    AuthMid --> AIMod
    AuthMid --> AnalyticsMod

    OCRMod --> Gemini
    AIMod --> Gemini

    OCRMod --> SQLite
    OCRMod --> PG
    AnalyticsMod --> SQLite
    AnalyticsMod --> PG
    AIMod --> SQLite
    AIMod --> PG
```

---

## 2. Component Taxonomy & Responsibilities

### 2.1. Frontend Tier (`src/`)
- **App Core (`src/App.jsx`)**: Main state coordinator, active tab controller, global readings listener, modal manager.
- **Component Modules (`src/components/`)**:
  - `Header.jsx`: Branding header, quick action buttons, user auth menu.
  - `HeroCapture.jsx`: Hero call-to-action block for camera/upload trigger.
  - `CameraModal.jsx`: Web camera viewfinder, file picker, base64 encoder.
  - `VerificationModal.jsx`: Interactive post-OCR verification dialog allowing user confirmation and manual edit overrides.
  - `QuickStats.jsx`: Metric counters (Latest Reading, Average Glucose, eA1c, TIR percentage).
  - `GlucoseTrendChart.jsx`: Dynamic line charts with target threshold bands (70–180 mg/dL).
  - `TIRDonutChart.jsx`: Recharts pie/donut visualization for glycemic range distribution.
  - `MealContextChart.jsx`: Bar chart breaking down glucose averages by meal context tags.
  - `LogbookTable.jsx`: Filterable, searchable reading history table with edit and deletion controls.
  - `AIHealthInsights.jsx`: Gemini-generated markdown insight report viewer and pattern detection card list.
  - `AuthModal.jsx`: Login / Register form modal with JWT token management.
  - `SidePanel.jsx`: Mobile/desktop slide-out navigation panel.
  - `PWAInstallModal.jsx`: Browser PWA installation banner prompt.
- **PWA Service Worker (`src/pwaRegister.js`)**: Handles offline caching of static assets and service worker registration.

### 2.2. Backend Tier (`server/`)
- **API Server Entry (`server/index.js`)**: Express server config, CORS setup, route mounting, static dist serving, and Render anti-idle keep-alive background worker.
- **Database Abstraction (`server/db.js`)**: Dual-engine wrapper enabling transparent SQL execution across SQLite and PostgreSQL.
- **Route Controllers (`server/routes/`)**:
  - `auth.js`: User registration, login, bcrypt password hashing, and JWT token issuance.
  - `ocr.js`: Image payload parsing, Gemini Vision API invocation, bounding box extraction, and fallback parsing.
  - `readings.js`: CRUD endpoints for blood glucose measurements.
  - `analytics.js`: Statistical computations (TIR breakdown, eA1c formula, SD, CV%).
  - `ai.js`: Aggregates reading history into prompt context for Gemini AI health recommendations.
  - `export.js`: Formatted CSV and clinical report export generators.

---

## 3. Data Flow Diagrams

### 3.1. Vision OCR Extraction Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App as React Frontend
    participant API as Express API Server
    participant Gemini as Google Gemini Vision
    participant DB as Database (SQLite/PG)

    User->>App: Capture / Select Glucometer Image
    App->>API: POST /api/v1/ocr/extract (Multipart or Base64)
    API->>API: Extract image buffer & initialize Gemini SDK
    API->>Gemini: Request Vision Analysis (Model Fallback Sequence)
    Gemini-->>API: Structured JSON (Value, Unit, Confidence, Brand, Context)
    API->>DB: Log OCR audit record (image payload, raw response, confidence)
    API-->>App: Return OCR Extraction Result JSON
    App->>User: Display Verification Modal (Preview & Confirm)
    User->>App: Confirm or Edit Values -> Click "Save Reading"
    App->>API: POST /api/v1/readings
    API->>DB: Persist Glucose Reading
    API-->>App: Reading saved successfully
    App->>User: Update dashboard metrics & charts in real-time
```

### 3.2. AI Health Insights Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App as React Frontend
    participant API as Express API Server
    participant DB as Database
    participant Gemini as Gemini Text LLM

    User->>App: Request AI Health Insights (e.g. 7, 14, or 30 days)
    App->>API: POST /api/v1/ai/generate-insights { periodDays }
    API->>DB: Query glucose_readings for period window
    DB-->>API: Array of glucose readings
    API->>API: Compute statistical metrics (Mean, TIR%, SD, eA1c, Meal context averages)
    API->>Gemini: Send engineered medical summary prompt
    Gemini-->>API: Structured response (Markdown Summary + Pattern List JSON)
    API->>DB: Cache AI Insight record
    API-->>App: Return AI Insight response
    App->>User: Render formatted markdown insights & pattern cards
```

---

## 4. Dual-Database Abstraction Layer

GlucoTrack AI implements a zero-configuration dual database architecture in [server/db.js](file:///home/dell/glucotrack-ai/server/db.js).

### 4.1. Automatic Engine Selection
- **PostgreSQL Mode**: Automatically activated when the `DATABASE_URL` environment variable is detected (e.g. cloud hosting on Render with Render PostgreSQL).
- **SQLite3 Mode**: Activated automatically for local development or lightweight container deployments. Storage defaults to `./glucotrack.db` or persistent mount volume path `/app/data/glucotrack.db`.

### 4.2. Query Parameter Formatting (`formatSql`)
PostgreSQL uses `$1, $2, $3` positional placeholders, while SQLite uses `?`. The abstraction layer inspects queries at runtime and transforms placeholders automatically:

```javascript
function formatSql(sql) {
  if (!isPg) return sql;
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}
```

### 4.3. Database Schema

```mermaid
erDiagram
    users ||--o{ glucose_readings : "logs"
    users ||--o{ ai_insights : "receives"
    glucose_readings ||--o| ocr_audit_logs : "audited by"

    users {
        string id PK
        string email UK
        string password_hash
        string full_name
        int target_low_mgdl
        int target_high_mgdl
        string preferred_unit
        timestamp created_at
    }

    glucose_readings {
        string id PK
        string user_id FK
        number value_mgdl
        number original_value
        string original_unit
        string meal_context
        string notes
        timestamp measured_at
        timestamp created_at
    }

    ocr_audit_logs {
        string id PK
        string reading_id FK
        string image_url
        string raw_ai_response
        number confidence_score
        int is_user_edited
        timestamp created_at
    }

    ai_insights {
        string id PK
        string user_id FK
        int period_days
        string summary_markdown
        string detected_patterns
        timestamp created_at
    }
```

---

## 5. Security Architecture & Medical Safety Guardrails

1. **Authentication & Authorization**: Password hashing with `bcryptjs` (salt rounds: 10). Access tokens signed using JSON Web Tokens (JWT) with configurable secret expiration.
2. **Payload Protection**: Express body parsers capped at 20MB to protect against memory exhaustion during base64 image uploads.
3. **Non-Diagnostic AI Disclaimers**: All AI insight prompts and UI renders strictly include medical safety disclaimers emphasizing that generated content is for informational purposes only and does not constitute medical diagnosis or prescription advice.
4. **Data Isolation**: Database queries enforce user isolation (`WHERE user_id = ?`) across all endpoints.
