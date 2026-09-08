# Visual & Component Design Document (design.md)
## Project Name: GlucoTrack AI

---

## 1. Design System & Aesthetics

GlucoTrack AI adopts a modern, premium, dark-themed medical dashboard design system. It uses high-contrast accessibility standards, sleek glassmorphism panels, vibrant clinical color tokens, and fluid micro-animations.

---

## 2. Color Palette & Clinical Tokens

```css
:root {
  /* Surface & Background Colors */
  --bg-dark: #0f172a;           /* Deep Slate Navy */
  --bg-card: #1e293b;           /* Slate Blue Card Surface */
  --bg-card-hover: #334155;     /* Card Hover State */
  --border-glass: rgba(255, 255, 255, 0.1);

  /* Primary Typography */
  --text-primary: #f8fafc;       /* Crisp White */
  --text-secondary: #94a3b8;     /* Muted Silver */
  --text-accent: #38bdf8;        /* Vivid Cyan */

  /* Clinical Range Color System (ISO 15197 / ADA Standards) */
  --color-very-low: #ef4444;     /* Dark Red (< 54 mg/dL) */
  --color-low: #f97316;          /* Orange (54 - 69 mg/dL) */
  --color-target: #10b981;       /* Emerald Green (70 - 180 mg/dL) */
  --color-high: #f59e0b;         /* Amber Yellow (181 - 250 mg/dL) */
  --color-very-high: #dc2626;    /* Crimson Red (> 250 mg/dL) */

  /* Accent & Gradients */
  --gradient-primary: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%);
  --gradient-ai: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
}
```

---

## 3. UI Layout & Component Hierarchy

```
+-----------------------------------------------------------------------------------+
|  HEADER / NAVIGATION BAR                                                          |
|  [ Logo: GlucoTrack AI ]          [ Current Target: 70-180 mg/dL ]  [ User Profile ]|
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  +-------------------------------------+  +------------------------------------+  |
|  | HERO SNAP CAMERA & QUICK LOG       |  | QUICK STATS SUMMARY                |  |
|  | [ 📸 Snap Glucometer Photo ]        |  |  Mean Glucose: 134 mg/dL           |  |
|  | [ ✏️ Manual Entry ]                 |  |  Time-In-Range: 86%                |  |
|  |                                     |  |  Estimated A1c: 6.3%               |  |
|  +-------------------------------------+  +------------------------------------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | GLUCOSE TREND & ANALYTICS DASHBOARD                                         |  |
|  | [ Range Buttons: 7D | 14D | 30D | 90D ]                                       |  |
|  |                                                                             |  |
|  |  250 |------------------------------------------------------------ (High)    |  |
|  |      |                      *               *                               |  |
|  |  180 |======================*===============*===================== (Target)  |  |
|  |      |             *    *       *   *  *         *                          |  |
|  |   70 |============================================================ (Target)  |  |
|  |      |   *                                                                  |  |
|  |    0 +------------------------------------------------------------          |  |
|  |         Sep 01    Sep 02    Sep 03    Sep 04    Sep 05    Sep 06              |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
|  +-----------------------------------+  +--------------------------------------+  |
|  | TIME-IN-RANGE DONUT CHART         |  | GEMINI AI INSIGHTS CARD 🤖           |  |
|  |  🟢 In Range (70-180): 86%        |  | "Your glucose levels have been very  |  |
|  |  🟡 High (181-250): 9%            |  | steady! Notable post-dinner spike    |  |
|  |  🔴 Low (<70): 5%                 |  | recorded on Friday evening..."       |  |
|  +-----------------------------------+  +--------------------------------------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | RECENT LOGBOOK TABLE                                                       |  |
|  | Date/Time       | Value (mg/dL) | Context     | Source | Actions          |  |
|  | Sep 07 08:15 AM | 126 mg/dL     | Fasting     | AI Vision | [Edit] [Delete]  |  |
|  | Sep 06 07:30 PM | 168 mg/dL     | Post-Meal   | Manual    | [Edit] [Delete]  |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 4. Modal Flow Design: Camera Capture to Saving

```
[ Click 'Snap Photo' ]
         |
         v
+------------------------------------+
|  CAMERA VIEWPORT MODAL             |
|  +------------------------------+  |
|  |    [ Align Display Here ]    |  |
|  |                              |  |
|  +------------------------------+  |
|  [ ⚡ Flash Toggle ]  [ 📸 Capture ]|
+------------------------------------+
         |
         v (Image Compression & Gemini API Request)
+------------------------------------+
|  VERIFICATION & EDIT MODAL         |
|  Image Thumbnail: [ Screenshot ]   |
|                                    |
|  Detected Value: [ 142.0 ] (mg/dL) |
|  Confidence: 🟢 96% High           |
|                                    |
|  Meal Context:                     |
|  (•) Fasting   ( ) Pre-Meal        |
|  ( ) Post-Meal ( ) Bedtime         |
|                                    |
|  Notes: [ Optional user comment ]  |
|                                    |
|  [ Cancel ]        [ Confirm & Save]|
+------------------------------------+
```

---

## 5. Charting Component Specification (Recharts Design)

### 5.1. Trend Line Chart Config
- **Type:** AreaChart / LineChart with responsive container.
- **Reference Areas:**
  - Target Zone (`y1=70, y2=180`): Fill color `rgba(16, 185, 129, 0.12)`, Stroke `none`.
  - High Warning Zone (`y1=180, y2=600`): Fill color `rgba(245, 158, 11, 0.05)`.
- **Data Points Dot Styling:**
  - Value < 70 mg/dL: Fill Red (`#ef4444`), Radius 5px.
  - Value 70–180 mg/dL: Fill Emerald (`#10b981`), Radius 4px.
  - Value > 180 mg/dL: Fill Amber (`#f59e0b`), Radius 5px.
- **Tooltip Component:** Custom Glassmorphic Tooltip showing timestamp, exact reading value, meal context tag, and variance from target mean.

### 5.2. Time-In-Range Donut Chart Config
- **Inner Radius:** `60%`, **Outer Radius:** `80%`.
- **Slices:**
  1. In Range (70-180 mg/dL) -> `#10b981` (Green)
  2. High (181-250 mg/dL) -> `#f59e0b` (Amber)
  3. Very High (>250 mg/dL) -> `#dc2626` (Red)
  4. Low (54-69 mg/dL) -> `#f97316` (Orange)
  5. Very Low (<54 mg/dL) -> `#ef4444` (Dark Red)
