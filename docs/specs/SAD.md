# Software Architecture Document (SAD)
## Project Name: GlucoTrack AI

---

## 1. Introduction & Architectural Objectives
The Software Architecture Document (SAD) presents a high-level overview of the architectural design decisions, system components, patterns, and quality attributes governing the **GlucoTrack AI** system.

### Key Objectives:
- **Accuracy & Reliability:** High precision in OCR extractions with verification fallbacks.
- **Low Latency:** Rapid processing of multimodal vision requests (< 2.5 seconds total latency).
- **Scalability:** Microservice-ready architecture supporting high concurrency for image processing and analytics aggregation.
- **Privacy & Security:** End-to-end data encryption, HIPAA/GDPR alignment for personal health information (PHI).

---

## 2. Architectural Drivers & Quality Attributes

| Attribute | Requirement | Architectural Strategy |
| :--- | :--- | :--- |
| **Performance** | Image OCR response < 2.5s; Chart rendering < 200ms | Client-side compression before upload; cached analytics calculations; optimized DB indexing. |
| **Security** | Secure PHI storage and transmission | TLS 1.3 in transit; AES-256 at rest; zero raw image retention on 3rd party AI servers. |
| **Modularity** | Decoupled UI, Vision Engine, Analytics Engine | Clean RESTful APIs, dependency injection, service contract isolation. |
| **Availability** | 99.9% operational uptime | Stateless serverless API endpoints with auto-scaling & health probes. |

---

## 3. High-Level System Layers

```
+-------------------------------------------------------------------------------+
|                             1. PRESENTATION LAYER                             |
|  - React / Vite SPA or Next.js App                                            |
|  - HTML5 Media Capture / Camera Canvas API                                    |
|  - Dynamic Visualization (Recharts / Chart.js)                                |
+---------------------------------------+---------------------------------------+
                                        |  HTTPS / REST / JSON
                                        v
+-------------------------------------------------------------------------------+
|                          2. APPLICATION & API GATEWAY                         |
|  - Authentication & AuthZ Middleware (JWT / OAuth2)                           |
|  - Input Validation & Payload Sanitization (Zod / Pydantic)                   |
|  - Rate Limiting & Request Throttling                                         |
+---------------------------------------+---------------------------------------+
                                        |  Internal Service Calls
                                        v
+-------------------------------------------------------------------------------+
|                            3. DOMAIN SERVICE LAYER                            |
|                                                                               |
|  +--------------------------+  +--------------------------+                   |
|  | Reading Ingestion Service|  |  Analytics & Stats Engine|                   |
|  | - Validation & Unit Conv |  |  - TIR, eA1c, SD, CV%    |                   |
|  +-------------+------------+  +------------+-------------+                   |
|                |                            |                                 |
|                +--------------------+-------+                                 |
|                                     v                                         |
|  +--------------------------------------------------------+                   |
|  |                Gemini Orchestration Service            |                   |
|  |  - Vision OCR Extraction Prompt Gateway                |                   |
|  |  - Longitudinal Insights & Pattern Generator           |                   |
|  +----------------------------------+---------------------+                   |
+-------------------------------------|-----------------------------------------+
                                      |
                    +-----------------+-----------------+
                    v                                   v
+---------------------------------------+  +------------------------------------+
|            4. DATA LAYER              |  |         5. EXTERNAL SERVICES       |
| - Relational DB (PostgreSQL / SQLite) |  | - Google Gemini 2.5/1.5 API Gateway|
| - Object Store (S3 / Cloudflare R2)   |  | - Medical Reference Knowledge Base |
+---------------------------------------+  +------------------------------------+
```

---

## 4. Key Subsystem Descriptions

### 4.1. Presentation Layer (Web/Mobile Client)
- Responsive Single Page Application (SPA) built with modern JavaScript/TypeScript framework.
- Client-side state management handling optimistic updates and local offline queueing.
- Canvas API for hardware-accelerated image scaling and aspect ratio cropping.

### 4.2. Gemini Orchestration Service
- Responsible for formatting structured prompts sent to Google Gemini Vision API.
- Implements exponential backoff, rate limiting retry handling, and response schema parsing.
- Strips any identifiable user PII prior to calling the external LLM endpoint.

### 4.3. Analytics & Statistical Engine
- Executes mathematical aggregations over historical glucose readings.
- Caches 7-day and 30-day aggregate statistics per user ID to minimize redundant database hits.

### 4.4. Persistence & Storage Layer
- **Relational Database:** Stores user records, normalized glucose readings (`mg/dL`), meal context tags, and generated AI summaries.
- **Object Storage:** Stores encrypted glucometer display images for auditability and verification history.

---

## 5. Cross-Cutting Concerns

### 5.1. Security & Compliance
- All API communication enforced over HTTPS (TLS 1.3).
- Database connections encrypted via SSL.
- Data scrubbed of diagnostic PII when passing to external Gemini endpoints.

### 5.2. Error Handling & Resilience
- Graceful degradation: If Gemini Vision API experiences downtime, user is directed to fallback manual entry UI without service interruption.
- Circuit breaker pattern implemented on external API dependencies.

### 5.3. Logging & Observability
- Centralized structured logging (JSON format) detailing request latency, OCR accuracy rates, and API error counts.
