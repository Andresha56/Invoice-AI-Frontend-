# Invoice AI Service

Production-ready backend that turns free-text invoice descriptions into
validated, structured JSON using Groq's `openai/gpt-oss-20b` model.

## What makes this "production level" vs. the quick script version

| Concern | How it's handled |
|---|---|
| AI returns malformed JSON | Groq `strict: true` schema mode makes this essentially impossible |
| AI returns valid JSON but bad values (negative qty, bad email) | Re-validated server-side with Zod (`schema/invoiceZodSchema.js`) |
| AI or network hiccup (rate limit, 5xx, timeout) | Automatic retry with exponential backoff (`services/groqClient.js`) |
| A bad request or auth error | Fails immediately, no wasted retries |
| Someone spams your endpoint | Rate limiting per IP (`middleware/rateLimiter.js`) |
| Huge/malicious request bodies | 100kb body size cap + max input length |
| Missing config at deploy time | App refuses to start with a clear error (`config/env.js`) |
| Errors leaking stack traces to users | Central error handler hides internals in production |
| Server killed mid-request (deploy/restart) | Graceful shutdown drains in-flight requests |
| AI's math being wrong | Grand total recomputed server-side; mismatches flagged, not silently trusted |

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the env template and fill in your key:
   ```bash
   cp .env.example .env
   ```
   Get a free key at https://console.groq.com (API Keys tab).
3. Run it:
   ```bash
   npm start
   ```
   You should see `Server listening on port 3000`.

## Try it

```bash
curl -X POST http://localhost:3000/api/invoices/parse \
  -H "Content-Type: application/json" \
  -d '{"text": "Invoice for Globex Corp, due in 30 days. Website redesign phase 1 for 45000 rupees. Project code GX-2026-14."}'
```

## Endpoints

- `GET /health` — liveness check for load balancers/uptime monitors
- `POST /api/invoices/parse` — body: `{ "text": "..." }`, returns `{ invoice, warnings }`

## Before you actually ship this

- **HTTPS**: terminate TLS in front of this (via your host, e.g. Render/Railway/a
  reverse proxy) — this app itself speaks plain HTTP.
- **Auth**: this endpoint has no authentication. If it's public, add an API
  key check or hook it into your existing user auth before going live.
- **Logging**: swap `utils/logger.js`'s console output for a real log
  aggregator (Datadog, CloudWatch, etc.) once you have real traffic.
- **Monitoring**: track your Groq error rate and latency — if Groq has an
  outage, you'll want an alert, not a silent pile of 503s.
- **Secrets**: never commit `.env`. In production, set env vars through your
  host's dashboard/secrets manager, not a checked-in file.
