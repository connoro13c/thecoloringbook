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
- **AI**: OpenAI (gpt-image-1, GPT-4o with Vision)
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

# Git Workflow
# Custom git aliases for quick commits and deploys
git git                 # Auto-stage, commit with generated message, and push
git save                # Quick save with "Save progress" message
git quick "message"     # Quick commit with custom message

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
- **Philosophy**: Vibrant, dreamy watercolor aesthetic with ethereal light effects - magical yet sophisticated
- **Visual Language**: Saturated watercolor blends, soft bokeh lighting, organic gradients, whimsical nature elements
- **Avoid**: Overly cartoonish elements, harsh lines, flat colors, no emojis in UI/UX

### Color Palette
- **Primary Indigo**: Soft Indigo – #5B6ABF
- **Secondary Rose**: Muted Rose – #D98994  
- **Accent Aqua**: Gentle Aqua – #7FBEBE
- **Neutral Ivory**: Warm Ivory – #FCF8F3
- **Neutral Slate**: Rich Slate – #404040

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
- **Free Tier**: 5 credits after email verification (one-time)
- **Supporter Pack**: $5 for 20 credits
- **Patron Donation**: $10+ (custom amounts, $0.25 per credit)
- **Anonymous Previews**: Free low-res previews, no account required
- **Stripe Integration**: Secure checkout with fraud prevention
- **Donation-based**: All proceeds go to Stanford Children's Hospital

## Implementation Phases
- **Phase 0** – Setup: Repo, environment configuration ✅ COMPLETE
- **Phase 1** – Core UI: React components, watercolor design system ✅ COMPLETE
- **Phase 2** – AI pipeline: OpenAI gpt-image-1 generation, return PNG ✅ COMPLETE
- **Phase 3** – MVP Flow: Photo upload → AI generation → download (anonymous users) ✅ COMPLETE
- **Phase 4** – Auth & Credit System: Supabase Auth, credit management, donation flow ✅ COMPLETE
- **Phase 5** – Payments: Stripe Checkout, webhook processing ✅ COMPLETE
- **Phase 6** – User Dashboard: Saved pages, credit management
- **Phase 7** – PDF Export: pdf-kit generation for authenticated users
- **Phase 8** – Advanced Features: Difficulty slider, regeneration options
- **Phase 9** – Rate Limiting: Upstash Redis, abuse prevention
- **Phase 10** – Hardening: Load test (k6), security pen-test, performance audits
- **Phase 11** – Launch: Prod env, runbook, status page

## Project Structure
```
src/
├── app/                    # Next.js 15 app router
│   ├── api/v1/             # Versioned API routes
│   │   ├── analyze-photo/  # GPT-4o Vision photo analysis
│   │   └── createJob/      # Generate JPG for users
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx           # Main landing page (complete flow)
├── components/             # Atomic → composite pattern
│   ├── forms/             # Form components
│   │   ├── PhotoUpload.tsx     # Photo upload with dropzone
│   │   ├── SceneDescription.tsx # Scene prompt input
│   │   └── StyleSelection.tsx   # Style picker (Cartoon/Ghibli/Mandala)
│   ├── layout/            # Layout components
│   │   └── Hero.tsx       # Landing hero section
│   └── ui/                # shadcn/ui + custom components
│       ├── button.tsx, card.tsx, etc. # Base UI components
│       └── icons/WatercolorIcons.tsx   # Custom watercolor-style icons
├── lib/                   # Utilities & configs
│   ├── ai/                # AI-related modules
│   │   ├── image-generation.ts    # gpt-image-1 generation
│   │   ├── photo-analysis.ts      # GPT-4o Vision analysis
│   │   └── prompt-builder.ts      # Scene-first prompt engineering
│   ├── hooks/             # React hooks
│   │   ├── useGeneration.ts       # AI generation hook
│   │   └── useGenerationState.ts  # State management
│   ├── services/          # Service layer
│   │   └── generation-service.ts  # Complete generation pipeline
│   ├── supabase/          # Supabase client configurations
│   │   ├── client.ts      # Browser client
│   │   └── server.ts      # Server client + service role
│   ├── api.ts, database.ts, openai.ts, storage.ts, utils.ts
│   └── ...
├── database/              # Database migrations & scripts
├── middleware.ts          # Next.js middleware
├── styles/               # Additional styling
└── types/                # TypeScript definitions
```

## Code Standards

### General
- ESLint + Prettier, 4.4% max cyclomatic complexity
- GitHub Flow – main, feature branches, squash merges, semantic commits
- Unit ≥80% coverage, e2e on Chromium + Safari
- Core Web Vitals ≥90; <200 KB JS first load
- WCAG-AA accessibility, colour-contrast ≥4.5:1

### Environment Variables (CRITICAL)
**Rule**: NEVER access `process.env` at module level - always use runtime access

```typescript
// ❌ BAD - Causes Next.js build failures
const secret = process.env.SECRET_KEY!;
if (!secret) throw new Error('Missing secret');

// ✅ GOOD - Runtime access only
function getSecret() {
  const secret = process.env.SECRET_KEY;
  if (!secret) throw new Error('Missing secret');
  return secret;
}
```

**Pattern**: Use lazy initialization for expensive resources:
```typescript
// ❌ BAD - Eager initialization
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ GOOD - Lazy initialization
let stripeInstance: Stripe | null = null;
export function getStripe() {
  if (!stripeInstance) {
    stripeInstance = new Stripe(getRequiredEnv('STRIPE_SECRET_KEY'));
  }
  return stripeInstance;
}
```

**Utility**: Use `src/lib/env-validation.ts` for consistent validation:
```typescript
import { getRequiredEnv, getOptionalEnv } from '@/lib/env-validation';

const apiKey = getRequiredEnv('OPENAI_API_KEY');
const model = getOptionalEnv('OPENAI_MODEL', 'gpt-4o');
```

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
- **Anonymous uploads**: Stored in public/ folder of 'pages' bucket, publicly accessible
- **Authenticated pages**: Permanent storage in user-specific folders with RLS protection
- **File Association**: Anonymous uploads moved to user folders upon authentication
- **GDPR and COPPA compliance**
- **Explicit consent required for image uploads**
- Daily DB backups, weekly snapshots (30d retention)

## Storage Architecture
```
Supabase Storage:
└── pages/     # Single unified bucket with RLS policies
  ├── public/  # Anonymous uploads (publicly readable)
  └── {userId}/ # Authenticated user uploads (private, user-specific folders)
```

**Storage Features**:
- **Automatic File Association**: Anonymous uploads can be moved to user folders on signup
- **RLS Security**: Public folder for anonymous access, user folders protected by RLS
- **Service Role Management**: Backend can manage public files for anonymous users

## Database Schema
```sql
-- Authenticated user pages (permanent)
pages (
  id uuid PK,
  user_id uuid references auth.users,
  prompt TEXT,
  style TEXT,
  difficulty INTEGER default 3,
  jpg_path TEXT,
  pdf_path TEXT,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP default now(),
  updated_at TIMESTAMP default now()
)
-- RLS: pages.user_id = auth.uid()

-- User credit balances
user_credits (
  id uuid PK,
  user_id uuid references auth.users unique,
  credits INTEGER default 0 check (credits >= 0),
  created_at TIMESTAMP default now(),
  updated_at TIMESTAMP default now()
)
-- RLS: user can read own credits only

-- Donation tracking
donations (
  id uuid PK,
  user_id uuid references auth.users,
  stripe_payment_id TEXT unique,
  amount_cents INTEGER not null,
  credits_granted INTEGER not null,
  stripe_status TEXT default 'pending',
  created_at TIMESTAMP default now(),
  updated_at TIMESTAMP default now()
)
-- RLS: user can read own donations only
```

## API Routes
- `/api/v1/createJob` (POST) - Generate JPG for anon or auth users with difficulty/style controls
- `/api/v1/create-checkout` (POST, auth required) - Create Stripe checkout session for donations
- `/api/v1/export-pdf` (POST, auth required) - Export PDF after Stripe payment
- `/api/v1/my-pages` (GET, auth required) - List user's saved pages
- `/api/webhooks/stripe` (POST) - Handle Stripe webhook events for payment processing

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

## AI Pipeline (WORKING)

### Complete Generation Pipeline
The core AI functionality is **fully implemented and working**:

1. **Photo Analysis (GPT-4o Vision)**
   - Analyzes uploaded photos for exact physical characteristics
   - Captures hair color, clothing, accessories (hats, sunglasses, etc.)
   - Identifies pose, composition, and suitable complexity level
   - Returns structured JSON with child details and recommended elements

2. **Scene-First Prompt Engineering**
   - Prioritizes magical scene transformation over static replication
   - Maintains character fidelity as constraints, not primary focus
   - Dynamically adapts pose and composition for scene requirements
   - Balances adventure immersion with character recognition

3. **gpt-image-1 Generation**
   - Uses OpenAI's latest image generation model
   - Returns base64 data (no URLs)
   - Minimal parameter set: model, prompt, n, size
   - No quality/style parameters (not supported)

### gpt-image-1 API Configuration
```typescript
// Correct parameters for gpt-image-1
const response = await openai.images.generate({
  model: 'gpt-image-1',
  prompt: prompt,
  n: 1,
  size: '1024x1024'
  // No quality, style, or response_format parameters
})

// Response handling
const imageData = response.data?.[0]
const imageUrl = `data:image/png;base64,${imageData.b64_json}`
```

### Key Learnings
- **Content Policy**: Reframe prompts as "technical image analysis for artistic illustration" not "child analysis"
- **JSON Parsing**: Strip markdown code blocks (```json) before parsing OpenAI Vision responses
- **Service Role**: Use Supabase service role client to bypass RLS for anonymous users
- **Base64 Handling**: Convert base64 to data URLs for compatibility with existing storage pipeline

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
