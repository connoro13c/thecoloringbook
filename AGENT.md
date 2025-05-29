# Coloring Book App - Agent Instructions

## Product Overview
**Vision**: Instantly create personalized, printable coloring-book pages from user-provided photos and descriptions, tailored with AI-generated drawing styles and adjustable complexity.

**Tagline**: "Bring your kids' adventures to life with personalized coloring pages."

**Target Users**: Parents of kids 3-10 years old, Teachers, Party planners

**Core Problem**: Removes the pain of DIY photo-editing; gives parents instant, personalised activity pages.

## Tech Stack
- **Frontend**: Next.js 15 (React 18, TypeScript)
- **Styling**: Tailwind CSS + shadcn/ui
- **Auth**: Supabase Auth (social logins, magic links)
- **File Storage**: Supabase Storage
- **Backend**: Next.js API routes on Vercel
- **AI**: OpenAI (DALL-E 3, GPT-4o with Vision)
- **Database**: Supabase (Postgres + RLS)
- **Queue**: Custom Supabase Postgres-based queue
- **Payments**: Stripe + Stripe Radar
- **Hosting**: Vercel (Next.js optimized)
- **Email**: SendGrid for transactional emails

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

## Core Features & User Flow

### Single-Page Interactive Web Application Flow:
1. **Hero** (Intro & Main CTA: "Create Your Coloring Page")
2. **Image Upload** - Upload child's photo with clear instructions
3. **Scene Description & Drawing Style Selection** - Describe adventure + choose style
4. **AI-Generated Preview & Complexity Adjustment Slider** - Live preview with difficulty controls
5. **Checkout & Payment** (Stripe Integration) - $0.99 for download, $0.50 for regeneration
6. **Download & Confirmation** - PDF or JPG download

### Anonymous Users (No Account Required)
1. Photo upload (1-3 JPG/PNG, ≤10 MB each)
2. Scene prompt box (e.g., "My daughter flying a unicorn through rainbow clouds")
3. Style picker – "Classic Cartoon", "Ghibli Style", "Mandala/Pattern"
4. Difficulty slider 1-5 (controls line weight: 1=extra-thick, 5=extra-thin)
5. Instant JPG generation & download ($0.99)
6. "Save this page" CTA to create account

### Authenticated Users (Signed In)
1. All anonymous features
2. Auto-save generated pages
3. History dashboard with unlimited storage
4. PDF export included with purchase
5. Re-download saved pages anytime
6. No rate limits

## Design Philosophy & Style Guide

### Design Aesthetic
- **Philosophy**: Refined, artistic, impressionist-inspired watercolor aesthetic appealing to sophisticated tastes
- **Avoid**: Overly playful or cartoonish elements, no emojis in UI/UX

### Color Palette
- **Primary Accent**: Soft Indigo – #5B6ABF
- **Secondary Accent**: Muted Rose – #D98994
- **Highlight Color**: Gentle Aqua – #7FBEBE
- **Neutral Background**: Warm Ivory – #FCF8F3
- **Text Color**: Rich Slate – #404040

### Typography
- **Headlines**: "Playfair Display" (Bold)
- **Body/UI**: "Lato" (Regular/Medium)
- **CTAs**: "Playfair Display" (Semi-Bold)

### UI Elements
- Soft watercolor gradients
- Subtle watercolor paper texture
- Light shadows, rounded corners, smooth transitions
- Fine-lined, minimalist sketch-like icons
- Impressionist-inspired backgrounds, framed artistic image previews

## Payment Structure
- **Initial download**: $0.99 (JPG and PDF)
- **Regeneration** (minor adjustments): $0.50
- **Stripe Integration**: Secure checkout with fraud prevention
- **Email confirmations**: Via SendGrid
- **Slack notifications**: Real-time transaction updates

## Implementation Phases
- **Phase 0** – Setup: Repo, environment configuration
- **Phase 1** – Auth & Upload: Supabase Auth, photo drop-zone, Supabase Storage
- **Phase 2** – AI pipeline: OpenAI DALL-E 3 generation, return PNG
- **Phase 3** – Preview UI: Live progress, difficulty slider
- **Phase 4** – Payments: Stripe Checkout, webhook to DB
- **Phase 5** – PDF & history: pdf-kit concat, user dashboard
- **Phase 6** – Hardening: Load test (k6), security pen-test, framerate audits
- **Phase 7** – Launch: Prod env, runbook, status page

## Project Structure
```
.
├── app                     # Next.js 15 app router
│   ├── api/v1              # Versioned API routes
│   │   ├── createJob       # Generate JPG for users
│   │   ├── export-pdf      # PDF export (auth required)
│   │   ├── my-pages        # User's saved pages
│   │   └── ...
│   ├── auth/               # Authentication pages
│   ├── dashboard/          # User dashboard
│   ├── upload/             # Upload flow
│   └── page.tsx           # Main landing page
├── components              # Atomic → composite pattern
│   ├── forms/             # Form components (PhotoUpload, StylePicker, etc.)
│   ├── layout/            # Layout components (header, etc.)
│   └── ui/                # shadcn/ui components
├── lib                    # Utilities & configs
│   ├── api.ts             # API utilities
│   ├── auth.ts            # Supabase Auth config
│   ├── db.ts              # Supabase client
│   ├── hooks/             # React hooks
│   ├── prompt-builder.ts  # AI prompt generation
│   ├── queue.ts           # Database queue system
│   ├── storage.ts         # Supabase Storage helpers
│   ├── stripe.ts          # Stripe config
│   └── worker.ts          # Background job processing
└── scripts/               # Database scripts & utilities
```

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

## Security & Compliance

### Security Checklist
- [x] Supabase Auth + JWT, MFA optional
- [x] Middleware verifies JWT
- [x] No secrets in frontend – .env only
- [x] .gitignore: .env, *.pem, coverage/
- [x] Sanitised errors, stack only in server logs
- [x] Middleware gates every /api/*
- [x] RBAC roles in Supabase; admin-only delete
- [x] Supabase RLS, no raw SQL
- [x] HTTPS in production
- [x] File upload: image/png|jpeg, ≤10 MB, clamav scan
- [x] Stripe Radar fraud prevention
- [x] DDOS protection: rate limiting

### Content Moderation
- **Automated Moderation**: AI-driven (GPT-4o) immediate content filtering
- **Manual Moderation**: Admin dashboard for manual content review and user management

### Data Compliance
- **Anonymous uploads**: Stored temporarily in temp-pages bucket
- **Authenticated pages**: Permanent storage in user-pages bucket unless user deletes
- **GDPR and COPPA compliance**
- **Explicit consent required for image uploads**
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

## Performance & Monitoring
- **Performance Benchmark**: End-to-end user experience within 30 seconds per image generation
- **Monitoring**: OpenTelemetry + Grafana Cloud, Vercel Analytics
- **Slack alerts**: downtime, errors, queue latency
- **Analytics**: page load, upload, generation, checkout, difficulty changes

## Error Handling UX
- Photo Upload Error: Clear message + retry
- Generation Failure: Graceful retry/re-generate button
- Payment Failures: Specific guidance ("Please verify card details")

## Copy Guide
- **Hero Headline**: "Bring Your Kids' Adventures to Life!"
- **Hero Subheading**: "Instantly create personalized, printable coloring pages from your child's photos."
- **Upload Header**: "Upload Your Child's Photo"
- **Style Selection**: "Choose Your Coloring Style:"
  - "Classic Cartoon – Clean lines, perfect for young artists."
  - "Ghibli Style – Beautiful, detailed illustrations."
  - "Mandala/Pattern – Intricate designs for mindfulness coloring."
- **Success Message**: "Your Coloring Page Is Ready!"

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

## Best Practices
- Clearly defined user flow
- Early and frequent validation via previews
- Intuitive and straightforward UI
- Consistent adherence to refined visual style
- Clean, modern design avoiding overly playful or cartoonish elements
- Clean, modular, commented code structure
- Security focused: Regular audits and updates of dependencies
- Regular testing: Automated tests (Jest, Playwright recommended)
- Maintain technical docs and moderation guidelines clearly for future development
