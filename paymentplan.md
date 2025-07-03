Finalized User Story & Implementation Spec – “Donate to Unlock High‑Resolution Coloring Page”
All outstanding choices have been resolved. The document below is ready for hand‑off to engineering and design.

1  Narrative (updated)
As a signed‑in visitor who has just created a coloring page, I want to donate (minimum $1, via quick‑select buttons or an “Other” field) and, after paying, receive an IRS‑compliant tax receipt and immediate access to both PDF and PNG high‑resolution files—while knowing my files will remain available to me in my Library and be cost‑efficiently archived after 90 days.

2  Key Decisions (all locked)
Topic	Final Decision
Modal layout	UI team free to choose grid buttons, radio, or other pattern that matches site aesthetic.
Authentication	Forced login (Supabase Auth) before donation; no guest checkout.
File formats	Provide both PDF and PNG versions for every paid page.
Storage lifecycle	Originals stay in “hot” storage for 90 days. After 90 days of inactivity they move to cold storage; Library seamlessly regenerates presigned URLs from cold storage on demand.

3  Revised Preconditions
User is authenticated via Supabase Auth (email magic link or OAuth) before the Donate button appears.

The app has pre‑rendered both high‑res PDF and PNG and stored them under a unique page_id.

Stripe account, Checkout Session, webhook endpoint, and non‑profit settings are configured.

4  Updated Main Flow (Happy Path)
User clicks Donate → Auth check passes → Donate modal appears (customizable layout).

User selects $1 / $5 / $10 or types custom ≥ $1 → Press Donate.

Backend creates Stripe Checkout Session (USD only) with chosen amount; adds metadata {page_id, user_id}.

Browser redirects to Stripe Checkout → user pays.

Stripe fires checkout.session.completed webhook → backend verifies → generates two presigned URLs (PDF, PNG).

Backend inserts row in downloads table (pdf_url, png_url, expires_at, storage_tier = 'hot').

Browser lands on Success page → front end fetches URLs →

Desktop: automatically starts PDF download, shows secondary “Download PNG” button.

Mobile: tries auto‑download; if blocked, shows in‑browser preview plus buttons Download PDF / Download PNG.

User receives (a) Stripe receipt and (b) tax‑deductible donation letter email.

Library page (/library) lists every paid page with refreshed download links.

5  Extended Acceptance Criteria
#	Given	When	Then
1	Unauthenticated visitor	Clicks Donate	Redirected to login/signup, then back to page with Donate modal open.
2	Authenticated user selects Other = $0.99	Clicks Donate	Client validation blocks with “Minimum is $1”.
3	Payment succeeds	Success page loads on Android	Either automatic download starts or preview displays with working Download PDF / Download PNG buttons.
4	User revisits Library after 100 days	Clicks file	System fetches from cold storage, regenerates presigned URL, download works ≤ 3 s.
5	User pays twice for same page	Library lists only one entry (most recent timestamp), but Donate modal still works for additional donations.	

6  Storage & Lifecycle Details
Phase	Tier	Action
0–90 days	Hot (standard S3)	Immediate download; URLs valid 24 h, refreshed on demand.
> 90 days	Cold (S3 Glacier Instant)	Nightly batch moves objects; storage_tier updated. Library fetch triggers a Lambda / cron to restore object (≈1 s) and issue fresh URL.
Deletion policy	—	No automatic deletion; manual admin purge only.

7  Backend Schema (final)
sql
Copy
create table downloads (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id),
  page_id uuid not null,
  stripe_session_id text not null unique,
  pdf_path text not null,
  png_path text not null,
  storage_tier text default 'hot',         -- 'hot' | 'cold'
  created_at timestamptz default now(),
  last_accessed_at timestamptz,
  expires_at timestamptz                   -- 24‑h presigned URL expiry
);
8  Email Template Snippet (IRS‑Compliant)
Subject: Your Tax‑Deductible Donation Receipt – Coloring Book

Thank you for your donation of ${{amount}} on {{date}}.

Organization: Coloring Book Foundation (EIN 12‑3456789)
Donation Type: Charitable Contribution (no goods or services were provided in return).

Keep this letter for your tax records.

9  Engineering TODO Checklist
Area	Task
Frontend	Implement modal UI per design team’s pattern; add auth gate; success page logic for PDF/PNG handling on desktop/mobile.
Backend	Extend /checkout/session endpoint to enforce login; generate dual file URLs; update schema; nightly storage‑tier migration script.
Infra	Add cold‑storage bucket lifecycle rule; deploy Lambda for on‑demand restore; set up Cron job.
Email	Build SendGrid (or equivalent) template; wire up webhook handler.
QA	Cross‑browser mobile download tests; storage‑tier retrieval test; security pen‑test on presigned URLs.

Ready for Development
With forced login, dual file formats, and a 90‑day cost‑efficient storage policy in place, the feature set is fully specified. Engineering can now proceed to sprint planning and implementation.