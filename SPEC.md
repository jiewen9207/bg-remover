# BG Remover - Technical Specification

## 1. Project Overview

- **Type**: Next.js web application
- **Core Feature**: Remove image backgrounds via AI (remove.bg API)
- **Target Users**: E-commerce sellers, designers, general users

## 2. Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| API Route | Next.js Route Handler (`/api/removebg`) |
| AI Engine | remove.bg API |
| Deployment | Cloudflare Pages + Workers |

## 3. Functionality

### Core Features
- [x] Image upload (drag & drop or click, ≤10MB, JPG/PNG/WebP)
- [x] AI background removal via remove.bg API
- [x] Original / Result tab switcher
- [x] Background color picker (white, black, red, green, blue, purple)
- [x] Preview with checkerboard/transparent result
- [x] Download transparent PNG
- [x] Progress / status indication
- [x] Error handling with retry

### Out of Scope
- User login / registration
- Batch processing
- API access for third parties
- Payment

## 4. Architecture

```
User Browser
    │
    ▼
Next.js App (Cloudflare Pages)
    │
    ├── / (page.tsx) → Upload UI + Preview
    │
    └── /api/removebg (route.ts) → POST
              │
              ▼
         remove.bg API
              │
              ▼
         Image returned to browser
```

## 5. API Design

### POST /api/removebg

**Request**: `multipart/form-data`
- `file`: Image file (max 10MB)

**Response**:
- 200: `image/png` binary
- 400: `{ "error": "..." }`
- 502: `{ "error": "remove.bg API error" }`

**Environment Variables**:
- `REMOVE_BG_API_KEY`: remove.bg API key

## 6. UI Layout

Single page, centered content:

```
┌──────────────────────────────────────┐
│  🪄 BG Remover                        │
│  Remove image backgrounds...          │
├──────────────────────────────────────┤
│  [Upload Area: drag & drop]          │
│                                      │
│  [Original] [Result]  ← tab switcher │
│                                      │
│  ┌──────────────────────────┐        │
│  │     Image Preview        │        │
│  └──────────────────────────┘        │
│                                      │
│  BG: [■][■][■][■][■][■] color picker │
│  [⬇️ Download]  [New Image]           │
├──────────────────────────────────────┤
│  Powered by remove.bg · Cloudflare   │
└──────────────────────────────────────┘
```

## 7. Project Structure

```
src/
├── app/
│   ├── layout.tsx       # Root layout with metadata
│   ├── page.tsx         # Main UI page (client component)
│   ├── globals.css      # Tailwind v4 + @theme variables
│   └── api/removebg/
│       └── route.ts     # API route handler
├── components/          # (reserved for future)
└── .env.local           # Local env vars (not committed)
```

## 8. Security

- No images stored anywhere
- No personal data collected
- Client-side file size validation (10MB max)
- API key protected server-side (env var)
- CORS handled by same-origin

## 9. Milestones

- [x] M1: Project scaffolding (Next.js + Tailwind)
- [x] M2: Frontend upload UI with drag & drop
- [x] M3: API route proxying remove.bg
- [x] M4: Preview + tab switcher + bg color picker
- [ ] M5: Download functionality
- [ ] M6: Deploy to Cloudflare Pages
- [ ] M7: Add environment variable for API key
- [ ] M8: Test and verify end-to-end flow