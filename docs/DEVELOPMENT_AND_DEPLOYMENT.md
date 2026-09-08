# GlucoTrack AI — Development & Deployment Guide

This document provides step-by-step instructions for local development setup, environment configuration, database management, and production deployment on **Render.com**.

---

## 1. Prerequisites

Before installing GlucoTrack AI, ensure your system has the following installed:
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: v2.30+

---

## 2. Environment Variables Configuration

Create a `.env` file in the root directory by copying the provided example:

```bash
cp .env.example .env
```

### Environment Variable Glossary

| Variable Name | Required | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Optional | `5000` | HTTP port for the Express API server. |
| `GEMINI_API_KEY` | **Recommended** | — | Primary API key for Google Gemini Vision/Text LLM. |
| `GEMINI_API_KEY_FALLBACK` | Optional | — | Backup API key used automatically if primary key hits rate limits. |
| `JWT_SECRET` | **Required** | `glucotrack_secret_key` | Secret passphrase used to sign authentication tokens. |
| `DATABASE_URL` | Optional | — | PostgreSQL connection URI. If provided, switches database mode to PostgreSQL. |
| `DB_DIR` | Optional | `./` | Directory path for local SQLite database file `glucotrack.db`. |
| `RENDER_EXTERNAL_URL` | Optional | `http://localhost:5000` | Public deployment URL used by the anti-idle keep-alive background worker. |

---

## 3. Local Development Setup

### 3.1. Installation
Clone the repository and install all npm dependencies:

```bash
git clone https://github.com/ArnavPundir22/glucotrack-ai.git
cd glucotrack-ai
npm install
```

### 3.2. Running Development Mode
Run client and server concurrently in development mode with Hot Module Replacement (HMR):

```bash
npm run dev
```

This launches:
- **Frontend Vite Dev Server**: `http://localhost:5173`
- **Backend Express API Server**: `http://localhost:5000`

### 3.3. Isolated Command Execution
- **Run Frontend Only**: `npm run dev:client`
- **Run Backend Only**: `npm run dev:server`

---

## 4. Building & Production Preview

To test the compiled production bundle locally:

```bash
# Build frontend static bundle into dist/
npm run build

# Start production Express server
npm start
```

Visit `http://localhost:5000` to verify the production build.

---

## 5. Deployment Guide (Render.com)

GlucoTrack AI includes a pre-configured [render.yaml](file:///home/dell/glucotrack-ai/render.yaml) blueprint file for one-click deployment on Render.com.

### 5.1. Render Infrastructure Blueprint (`render.yaml`)

```yaml
services:
  - type: web
    name: glucotrack-ai
    env: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: PORT
        value: 5000
      - key: NODE_VERSION
        value: 18.17.0
      - key: GEMINI_API_KEY
        sync: false
      - key: JWT_SECRET
        generateValue: true
    disk:
      name: glucotrack-data
      mountPath: /app/data
      sizeGB: 1
```

### 5.2. Persistent Storage Configuration
When deploying using SQLite on Render's free tier, mount a disk at `/app/data`. The application automatically detects `/app/data` and initializes `glucotrack.db` on persistent storage, ensuring reading logs persist across service restarts.

### 5.3. Render Keep-Alive Worker
To prevent Render's free tier instance from sleeping after 15 minutes of inactivity, [server/index.js](file:///home/dell/glucotrack-ai/server/index.js) includes a lightweight self-ping worker:

```javascript
const PING_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes
setInterval(async () => {
  try {
    const healthUrl = `${RENDER_APP_URL}/api/v1/health`;
    await fetch(healthUrl);
  } catch (err) {
    // Non-blocking log notice
  }
}, PING_INTERVAL_MS);
```
