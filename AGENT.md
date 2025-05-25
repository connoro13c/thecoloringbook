# Coloring Book App - Agent Instructions

## Product Overview
**Vision**: Turn any photo into a printable, line-art colouring-book page.

**Target Users**: Parents of kids 3-10 years old, Teachers, Party planners

**Core Problem**: Removes the pain of DIY photo-editing; gives parents instant, personalised activity pages.

## Tech Stack
- **Frontend**: Next.js 15 (React 18, TypeScript)
- **Styling**: Tailwind CSS + shadcn/ui
- **Auth**: Supabase Auth (social logins, magic links)
- **File Storage**: Supabase Storage
- **Backend**: Next.js API routes
- **AI**: OpenAI (DALL-E 3)
- **Database**: Supabase (Postgres + RLS)
- **Payments**: Stripe + Stripe Radar
- **Hosting**: Local development on port 3000

## Key Commands
```bash
# Development (clean start - kills port 3000 first)
npm run start:clean

# Development (standard)
npm run dev

# Build & Type Check
npm run build
npm run type-check

# Testing
npm run test
npm run test:e2e
npm run test:coverage

# Linting & Formatting
npm run lint
npm run format
npm run lint:fix

# Storybook
npm run storybook

# Troubleshooting
# Clear Next.js cache if white screen or module errors
rm -rf .next && npm run dev
```

## Project Structure
```
app/                    # Next.js 15 app router
├── api/v1/            # Versioned API routes
├── (auth)/            # Auth route groups
└── globals.css        # Global styles

components/            # Atomic → composite pattern
├── ui/               # shadcn/ui components
├── forms/            # Form components
└── layout/           # Layout components

lib/                  # Utilities & configs
├── utils.ts          # Utility functions
├── auth.ts           # Supabase Auth config
├── db.ts             # Supabase client
└── stripe.ts         # Stripe config
```

## Core Features

### Anonymous Users (No Account Required)
1. Photo upload (1-3 JPG/PNG, ≤10 MB each)
2. Scene prompt box
3. Style picker – "Classic Cartoon", "Manga Lite", "Bold Outlines"
4. Difficulty slider 1-5 (controls line density)
5. Instant JPG generation & download (FREE)
6. "Save this page" CTA to create account

### Authenticated Users (Signed In)
1. All anonymous features
2. Auto-save generated pages
3. History dashboard with unlimited storage
4. PDF export ($0.99 via Stripe)
5. Re-download saved pages anytime
6. No rate limits

## Implementation Phases
- **Phase 0** – Setup: Repo, environment configuration
- **Phase 1** – Auth & Upload: Supabase Auth, photo drop-zone, Supabase Storage
- **Phase 2** – AI pipeline: OpenAI DALL-E 3 generation, return PNG
- **Phase 3** – Preview UI: Live progress, difficulty slider
- **Phase 4** – Payments: Stripe Checkout, webhook to DB
- **Phase 5** – PDF & history: pdf-kit concat, user dashboard
- **Phase 6** – Hardening: Load test (k6), security pen-test, framerate audits
- **Phase 7** – Launch: Prod env, runbook, status page

## Code Standards

### General
- ESLint + Prettier, 4.4% max cyclomatic complexity
- GitHub Flow – main, feature branches, squash merges, semantic commits
- Unit ≥80% coverage, e2e on Chromium + Safari
- Core Web Vitals ≥90; <200 KB JS first load
- WCAG-AA accessibility, colour-contrast ≥4.5:1

### Frontend Guidelines
- Mobile-first, 2-column desktop, 44px touch targets
- app/ router pages → thin wrappers
- components/ atomic → composite pattern
- Zustand for state; no global Redux
- next/dynamic lazy load, image blur placeholders
- Semantic HTML; useId() for labels; keyboard flows
- Tailwind tokens only; no inline styles except dynamic canvas

### React Performance
```typescript
// ❌ Bad - inline objects/functions
<Canvas style={{ width: 200 }} onClick={() => doThing()} />

// ✅ Good - memoized
const styles = useMemo(() => ({ width: 200 }), []);
const handleClick = useCallback(doThing, []);
<Canvas style={styles} onClick={handleClick} />

// Heavy components
export default React.memo(ColoringPreview);
```

### Backend Guidelines
- REST API, versioned under /api/v1, typed with zod
- Services: /createJob, /job/:id (polling)
- JWT from Supabase Auth verified in middleware
- RBAC in Supabase policies
- helmet for headers, rate-limit 100 req/min/IP
- Stateless API
- Signed Supabase URLs, 1h TTL
- Map 5xx to generic "Something went wrong"
- OpenTelemetry traces → Grafana Cloud

## Security Checklist
- [x] Supabase Auth + JWT, MFA optional
- [x] Middleware verifies JWT
- [x] No secrets in frontend – .env only
- [x] .gitignore: .env, *.pem, coverage/
- [x] Sanitised errors, stack only in server logs
- [x] Middleware gates every /api/*
- [x] RBAC roles in Supabase; admin-only delete
- [x] Supabase RLS, no raw SQL
- [x] HTTPS in production
- [x] next.config.js forces https in prod
- [x] File upload: image/png|jpeg, ≤10 MB, clamav scan
- [x] Stripe Radar fraud prevention
- [x] DDOS protection: rate limiting

## Data & Privacy
- **Anonymous uploads**: Stored temporarily in temp-pages bucket
- **Authenticated pages**: Permanent storage in user-pages bucket unless user deletes
- GDPR-ready data deletion
- Daily DB backups, weekly snapshots (30d retention)

## Storage Architecture
```
Supabase Storage:
├── temp-pages/     # Public bucket, temporary storage for anonymous users
└── user-pages/     # Private bucket, permanent storage for authenticated users
```

## Database Schema
```sql
-- Anonymous sessions (temporary tracking)
page_sessions (
  id uuid PK,
  created_at TIMESTAMP default now()
)

-- Authenticated user pages (permanent)
pages (
  id uuid PK,
  user_id uuid references auth.users,
  prompt TEXT,
  style TEXT,
  jpg_path TEXT,
  pdf_path TEXT,
  created_at TIMESTAMP default now()
)
-- RLS: pages.user_id = auth.uid()
```

## API Routes
- `/api/v1/generate` (POST) - Generate JPG for anon or auth users
- `/api/v1/export-pdf` (POST, auth required) - Export PDF after Stripe payment
- `/api/v1/my-pages` (GET, auth required) - List user's saved pages

## Monitoring
- OpenTelemetry + Grafana Cloud
- Slack alerts: downtime, errors, queue latency
- Analytics: page load, upload, generation, checkout, difficulty changes

## Error Handling UX
- Photo Upload Error: Clear message + retry
- Generation Failure: Graceful retry/re-generate button
- Payment Failures: Specific guidance ("Please verify card details")

## File Co-location
```
Component.tsx
Component.test.tsx
Component.stories.tsx
```

## Key Dependencies
```json
{
  "@supabase/ssr": "^0.x",
  "@supabase/supabase-js": "^2.x", 
  "openai": "^4.x",
  "stripe": "^18.x",
  "zod": "^3.x",
  "tailwindcss": "^3.x",
  "@radix-ui/react-*": "^1.x",
  "react-dropzone": "^14.x"
}
```