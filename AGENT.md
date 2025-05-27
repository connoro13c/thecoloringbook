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
- **AI**: OpenAI (DALL-E 3, GPT-4o)
- **Database**: Supabase (Postgres + RLS)
- **Queue**: Custom Supabase Postgres-based queue
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
.
├── .env.local
├── .env.production
├── .github
│   ├── lighthouse
│   │   └── lighthouserc.json
│   └── workflows
│       └── ci.yml
├── .gitignore
├── .npmrc
├── .prettierrc
├── .vercel
│   ├── project.json
│   └── README.txt
├── AGENT.md
├── AGENT.md.bak
├── app                     # Next.js 15 app router
│   ├── {auth}
│   ├── api
│   │   ├── cron
│   │   │   ├── cleanup-expired-data
│   │   │   │   └── route.ts
│   │   │   └── process-queue
│   │   │       └── route.ts
│   │   ├── debug
│   │   │   └── tables
│   │   │       └── route.ts
│   │   ├── health
│   │   │   └── route.ts
│   │   ├── setup
│   │   │   └── tracking
│   │   ├── stripe-webhook
│   │   │   └── route.ts
│   │   ├── v1              # Versioned API routes
│   │   │   ├── .gitkeep
│   │   │   ├── analytics
│   │   │   │   ├── comprehensive
│   │   │   │   │   └── route.ts
│   │   │   │   ├── long-tasks
│   │   │   │   │   └── route.ts
│   │   │   │   └── performance
│   │   │   │       └── route.ts
│   │   │   ├── analyze-image
│   │   │   │   └── route.ts
│   │   │   ├── checkout
│   │   │   │   └── route.ts
│   │   │   ├── create-checkout-session
│   │   │   │   └── route.ts
│   │   │   ├── createJob
│   │   │   │   └── route.ts
│   │   │   ├── download
│   │   │   │   └── [jobId]
│   │   │   │       └── route.ts
│   │   │   ├── export-pdf
│   │   │   │   └── route.ts
│   │   │   ├── generate
│   │   │   │   └── route.ts
│   │   │   ├── health
│   │   │   │   └── route.ts
│   │   │   ├── job
│   │   │   │   └── [id]
│   │   │   │       └── route.ts
│   │   │   ├── jobs
│   │   │   │   ├── [id]
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── make-pdf
│   │   │   │   └── route.ts
│   │   │   ├── my-pages
│   │   │   │   └── route.ts
│   │   │   ├── queue
│   │   │   │   └── route.ts
│   │   │   ├── status
│   │   │   │   └── route.ts
│   │   │   ├── upload
│   │   │   │   └── route.ts
│   │   │   ├── user
│   │   │   │   └── jobs
│   │   │   │       └── route.ts
│   │   │   └── worker
│   │   │       └── route.ts
│   │   └── webhooks
│   │       └── stripe
│   │           └── route.ts
│   ├── auth
│   │   └── page.tsx
│   ├── dashboard
│   │   └── page.tsx
│   ├── globals.css         # Global styles
│   ├── layout.tsx
│   ├── page.tsx
│   ├── status
│   │   └── page.tsx
│   └── upload
│       └── page.tsx
├── components              # Atomic → composite pattern
│   ├── forms               # Form components
│   │   ├── .gitkeep
│   │   ├── DifficultySlider.tsx
│   │   ├── EditableAnalysis.tsx
│   │   ├── GenerateForm.tsx
│   │   ├── OrientationPicker.tsx
│   │   ├── PaymentFlow.tsx
│   │   ├── PhotoUpload.tsx
│   │   ├── ScenePrompt.tsx
│   │   └── StylePicker.tsx
│   ├── layout              # Layout components
│   │   ├── .gitkeep
│   │   ├── header.tsx
│   │   └── PerformanceMonitoring.tsx
│   └── ui                  # shadcn/ui components
│       ├── alert.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── ImagePreview.tsx
│       ├── input.tsx
│       ├── JobProgress.tsx
│       ├── label.tsx
│       ├── PaymentButton.tsx
│       ├── PricingCard.tsx
│       ├── progress.tsx
│       ├── QueueStatus.tsx
│       ├── radio-group.tsx
│       ├── slider.tsx
│       └── textarea.tsx
├── components.json
├── eslint.config.mjs
├── lib                     # Utilities & configs
│   ├── api.ts              # API utilities
│   ├── auth-server.ts      # Server-side auth
│   ├── auth-utils.ts       # Auth utilities
│   ├── auth.ts             # Supabase Auth config
│   ├── db.ts               # Supabase client
│   ├── hooks               # React hooks
│   │   ├── useJobPolling.ts
│   │   ├── useJobs.ts
│   │   └── useJobStatus.ts
│   ├── monitoring.ts       # Performance monitoring
│   ├── pdf.ts              # PDF generation
│   ├── prompt-builder.ts   # AI prompt generation with difficulty/style
│   ├── queue.ts            # Database queue system
│   ├── rate-limit.ts       # Rate limiting
│   ├── session-manager.ts  # Session management
│   ├── storage.ts          # Supabase Storage helpers
│   ├── stripe.ts           # Stripe config
│   ├── utils.ts            # Utility functions
│   ├── validation.ts       # Input validation
│   └── worker.ts           # Background job processing
├── middleware.ts
├── next-env.d.ts
├── next.config.js
├── next.config.ts
├── package-lock.json
├── package.json
├── PHASE7-SUMMARY.md
├── postcss.config.mjs
├── public                  # Static assets
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── README.md
├── RUNBOOK.md
├── scripts                 # Database scripts & utilities
│   ├── add-image-analysis-column.sql
│   ├── comprehensive-tracking-schema-fixed.sql
│   ├── comprehensive-tracking-schema.sql
│   ├── create-image-analyses-table.sql
│   ├── create-tracking-tables.sql
│   ├── debug-image-analyses.sql
│   ├── debug-style-enum.sql
│   ├── fix-ghibli-enum.sql
│   ├── fix-image-analyses-schema.sql
│   ├── fix-tracking-tables.sql
│   ├── setup-database-clean.sql
│   ├── setup-database.sql
│   ├── setup-queue.sql
│   ├── setup-storage.sql
│   ├── simple-add-ghibli.sql
│   ├── simple-tracking-migration.sql
│   ├── start.sh
│   ├── step-by-step-migration.sql
│   └── verify-env.js
├── tailwind.config.ts
├── temp_backup             # Temporary backups
│   ├── stripe-webhook
│   └── stripe-webhook-backup.ts
├── tests                   # Load testing & performance
│   └── load
│       ├── audit-runner.sh
│       ├── payment-flow.js
│       ├── performance-audit.js
│       ├── README.md
│       ├── run-tests.sh
│       ├── security-audit.js
│       ├── stress-test.js
│       └── upload-flow.js
├── tsconfig.json
├── tsconfig.tsbuildinfo
└── vercel.json

61 directories, 141 files
```

## Core Features

### Anonymous Users (No Account Required)
1. Photo upload (1-3 JPG/PNG, ≤10 MB each)
2. Scene prompt box
3. Style picker – "classic", "ghibli", "bold" 
4. Difficulty slider 1-5 (controls line weight: 1=extra-thick, 5=extra-thin)
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
- `/api/v1/createJob` (POST) - Generate JPG for anon or auth users with difficulty/style controls
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