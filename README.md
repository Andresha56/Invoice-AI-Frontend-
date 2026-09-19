# AI-Powered Invoice Generator & Intelligence Platform

A intelligent, prompt-driven invoicing system with dual-engine AI entity extraction, Retrieval-Augmented Generation (RAG) for customer directory & product catalog lookups, deterministic financial arithmetic, interactive missing-field detection, and live inference transparency telemetry.

---

## 🌟 Key Features

1. **Natural Language Invoice Generation**
   - Describe invoices in free-form English (e.g. _"Invoice Acme Corp for 2 Website Development packages, due in 15 days"_).
   - Dual-engine architecture:
     - **Google Gemini AI** (`gemini-flash-lite-latest`) for structured entity extraction.
     - **Smart Heuristic Fallback Engine** providing offline, regex & NLP-based parsing if no API key is provided.

2. **RAG (Retrieval-Augmented Generation)**
   - Local directory lookup for customer profiles, GSTINs, addresses, and contacts.
   - Catalog matching for standard services, hourly rates, and standard pricing.

3. **Deterministic Financial Arithmetic**
   - LLMs are never allowed to perform math calculations.
   - A dedicated calculation engine guarantees exact subtotal, SGST, CGST, IGST, discount, and total amounts.

4. **Missing Mandatory Field Detection & Interactive Banner**
   - Automatically detects missing critical details (such as unknown clients or unpriced custom line items).
   - Displays 1-click quick-fill prompt chips to complete required details or proceed with reasonable defaults.

5. **Inference Transparency & Audit Panel**
   - Discloses explicitly which fields were directly stated by the user vs. inferred by RAG or default settings.
   - Shows engine telemetry (Gemini AI vs Heuristic Engine) for full auditability.

6. **Professional Invoicing Experience**
   - Real-time live invoice preview.
   - Custom branding with logo and signature upload & crop tool.
   - Native Print to PDF export and Copy JSON.

---

## 🏗️ Architecture

```
├── Invoice-AI-Frontend-          # Client Application (React 18 + Vite + TailwindCSS v4)
│   ├── src/
│   │   ├── componenets/         # UI Panels (Left prompt & chips, Right invoice preview)
│   │   ├── types/               # TypeScript models & telemetry interfaces
│   │   └── utils/               # Crop & formatting utilities
│   └── vite.config.ts           # Development proxy (/api -> localhost:5000)
│
└── server/                      # Backend Service (Node.js + Express + TypeScript)
    ├── src/
    │   ├── data/knowledgeBase.ts # Seed client directory & product catalog
    │   ├── services/ragService.ts    # Customer & service catalog retriever
    │   ├── services/llmService.ts    # Gemini API + Heuristic fallback
    │   ├── services/invoiceEngine.ts # Deterministic math & validator
    │   └── server.ts                 # Express REST API
    └── .env.example
```

---

## 🚀 Quick Start Guide

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+ recommended)
- Optional: Free [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### 1. Setup Backend Server

```bash
cd server
npm install
cp .env.example .env
```

_(Optional)_ Add your Gemini API key inside `server/.env`:

```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
```

> **Note**: If `GEMINI_API_KEY` is not provided, the server seamlessly falls back to the smart heuristic extraction engine!

Start the backend server:

```bash
npm run dev
```

The server will run on `http://localhost:5000`.

### 2. Setup Frontend Client

In a new terminal window:

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Testing & Linting

```bash
# Check code style & linter
npm run lint

# Check prettier code formatting
npm run format:check

# Production build verification
npm run build
```
