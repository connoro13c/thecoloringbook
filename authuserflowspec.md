# Auth, Pricing, and Abuse Prevention Specification

## Phase 5★ – Coloring Book App

**Final Auth, Credits, and Monetization Architecture**

---

## 🌟 Overview

We’re implementing a robust auth system and free tier to support both guest users and logged-in users while preventing abuse and introducing optional monetization through a donation-based model. The app is a 501(c)(3), and all proceeds will be donated to Stanford Children’s Hospital. The goal is to offer a delightful, fair user experience that invites generosity without compromising security or performance.

This document outlines the full spec:

- How users sign in
- How credits are issued and consumed
- How Stripe payments are processed
- How we prevent abuse
- How this all ties into our UI/UX and backend flows

---

## 🤓 Free Tier + Pricing Structure

### Default Offering:

- **Free users get 5 image credits** (approx. $0.25 in cost) after they **verify their email**
- No recurring free credits — just a one-time “starter pack”

### Monetization:

- **Supporter Pack**: $5 for 20 image credits
- **Patron Donation**: Any amount over $10 (e.g. $25 = 100 credits)
- Users can also donate freely at any time and receive credits at a flat rate: **$0.25 per image**

**No subscriptions, no limits, just one-time donations.**

---

## 🧠 User Flow (Narrative)

1. A parent visits the landing page and is greeted with a short explanation of what the app does, followed by a clear CTA: **"Create your coloring page"**.
2. They are prompted to upload a photo and describe a scene. The form is minimal and linear.
3. After they select their coloring page style and click **"Generate coloring page"**, the system creates a low-res coloring page preview. This image is visible directly on the page.
4. Below the preview, they see two options:
   - **Download and save** (requires account)
   - **Make another** (starts over, no account required)
5. If they click **"Download and save"**, a modal appears prompting them to log in or sign up with Google or Magic Link.
6. Upon signup and verified email:
   - The app copies the temp preview image to their account
   - They receive 5 free credits
   - The preview is replaced by a full-res downloadable version
   - Their dashboard is created and pre-populated with their first saved image
7. Returning users who log in land directly in their dashboard. They see:
   - A grid of saved coloring pages (most recent first)
   - Credit balance and "Donate for more" button
   - A prominent **"Create New Page"** button
8. When a user with zero credits attempts to generate an image, they are shown the Paywall modal offering preset donation options and credit count explanations.
9. After successful payment, their credit count is increased and the generation flow continues without loss of work or image state.

At every stage, the app ensures the user knows how many credits they have, what they can do next, and how to donate more if they want to keep going.

---

## 🔐 Abuse Prevention

Anticipated threats and our solutions:

| Threat                | Mitigation                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| **Anonymous abuse**   | Rate-limit preview generations to **2 per minute per IP** using **Upstash Redis**                |
| **Signup farming**    | Require **email verification** + enable **CAPTCHA** via Supabase                                 |
| **Credit fraud**      | Credits stored in secure table; decremented via **Postgres function** that runs server-side only |
| **Storage scraping**  | High-res images in **private bucket** with signed URLs (60 min TTL)                              |
| **Endpoint flooding** | All auth and job routes **rate-limited (100 req/min/IP)** at the Edge                            |

---

## 📁 Backend Architecture Summary

### Tables

- `pages`: stores user-owned pages (already implemented)
- `user_credits`: tracks each user’s credit balance
- `donations`: logs Stripe payments and credits granted

### Logic

- **Trigger on sign-up** → grants 5 free credits post verification
- **`use_credit(n)`** → safely decrements credit balance
- **`add_credits()`** → called via Stripe webhook to add credits

### Edge Functions

- `/api/jobs`: handles preview and full-generation
- `/webhooks/stripe`: validates payments and updates credits
- `/auth/callback`: handles post-login migration of image to permanent storage

---

## 🧩 UI Components

| Component         | Role                                                       |
| ----------------- | ---------------------------------------------------------- |
| `CreditBadge.tsx` | Displays credit count + progress ring                      |
| `DonateSheet.tsx` | Modal with $5 / $10 / custom amounts                       |
| `Paywall.tsx`     | Full-screen modal shown when credits = 0                   |
| `useCredits.ts`   | React hook to sync credits in real time (Supabase channel) |

---

## 💪 Test Coverage Plan

Key cases to test via Playwright:

- Sign up → verify → 5 credits granted
- Generate 5 images → 6th shows paywall
- Donate $10 → 200 credits added
- Double signup with same email → blocked
- 120 preview req/min → rate-limited
- Direct credit call from client → denied

---

## 📦 Dev Implementation Checklist

-

---

## 🙏 Transparency

We will display on the site:

> **💖 "$X has been donated to Stanford Children’s Hospital"**  
> (tally pulled from the `donations` table)

---

## ✅ Outcome

When implemented, this system will:

- Offer a generous, fair free tier
- Prevent abuse and edge-case exploits
- Enable donation-based monetization
- Create real-world charitable impact
- Fit beautifully within our watercolor-inspired app design
