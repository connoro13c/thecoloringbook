# Personalized Coloring Pages Web App - Design Specification

## 1. Project Overview

**Goal**: Instantly create personalized, printable coloring-book pages from user-provided photos and descriptions, tailored with AI-generated drawing styles and adjustable complexity.

**Tagline**: "Bring your kids' adventures to life with personalized coloring pages."

**Primary Call-to-Actions (CTAs)**:
- Primary: "Create your coloring page" (Google OAuth sign-in required)
- Secondary: "Donate for High-Res" (PDF + PNG download)

## 2. Website Structure

**App Type**: Multi-page web application with authentication-first approach.

**Key Pages & Flow**:
1. **Landing Page** (`/`) - Hero section with Google OAuth sign-in requirement
2. **Generator Page** (`/generator`) - Complete creation flow (auth-required)
3. **Dashboard Page** (`/dashboard`) - User's saved coloring pages and history

**Authentication Flow**:
- All functionality requires Google OAuth authentication
- Landing page explains why sign-in is required (charity, safety, saved pages)
- Sign-in redirects to `/generator` for immediate creation

## 3. Copy Guide

### Landing Page
- **Main Headline**: "Welcome to Coloring Pages"
- **Subheading**: "crafted from their imagination"
- **Description**: "Create personalized, printable black and white coloring pages with your child's photos."
- **CTA**: "Create your coloring page" (Google sign-in button)

### Why Sign In Section
- **Header**: "Why sign in?"
- **Explanation**: "We're a simple app helping families turn pictures into fun coloring pages. All proceeds go to Stanford Children's Hospital."

**Benefits Listed**:
- **Tax Documentation**: "Proper receipts for your charitable donations"
- **Prevent Abuse**: "Maintain quality and keep the service safe"
- **Save Creations**: "Keep your coloring pages secure forever"

**Hospital Callout**: "Supporting Stanford Children's Hospital - Sorry for the added step – it helps us help kids! 🏥"

### Generator Page
- **Header**: "Create Your Coloring Page"
- **Description**: "Transform your child's photo into a personalized coloring page with AI magic"

**Step Flow**:
1. **Photo Upload**: Drag-and-drop interface with clear instructions
2. **Scene Description**: Text input for adventure description (e.g., "My daughter flying a unicorn through rainbow clouds")
3. **Style Selection**: Choose from "Classic Cartoon", "Ghibli Style", "Mandala/Pattern"
4. **Generate**: "Generate coloring page" → "Creating your page..." (with progress indication)

**Results Section**:
- **Success Message**: "Your coloring page is ready!"
- **Actions**: 
  - "Donate for High-Res" (PDF + PNG • $1+ donation)
  - "Make another" (Start over with new photo)

## 4. Layout Guide

### Landing Page Layout
- **Hero Section**: Centered content with watercolor gradient background
- **Main Headline**: Large Playfair Display font with gradient text effect
- **Example Preview**: Framed placeholder showing upcoming functionality
- **Primary CTA**: Prominent Google sign-in button
- **Why Sign In**: Dedicated section with 3-column benefit grid
- **Hospital Callout**: Special highlighted section with heart icon

### Generator Page Layout
- **Progressive Revelation**: Steps appear as previous ones are completed
- **Photo Upload**: Central drag-and-drop area with preview
- **Scene Description**: Full-width text input with placeholder examples
- **Style Selection**: Card-based selection with visual previews
- **Generate Button**: Large, prominent call-to-action with loading states
- **Results Display**: Side-by-side image and credit information
- **Action Cards**: Two-column grid for next steps

### Dashboard Layout
- **Navigation**: Top navigation bar with user info and sign-out
- **Page Grid**: Responsive grid of saved coloring pages
- **Page Management**: Individual download and management options

## 5. Style Guide

### Design Philosophy
Refined, artistic, impressionist-inspired watercolor aesthetic with ethereal light effects - magical yet sophisticated. Avoids overly cartoonish elements in favor of dreamy, vibrant watercolor blends.

### Color Palette (Implemented)
- **Primary Indigo**: `#5B6ABF` (Soft Indigo)
- **Secondary Rose**: `#D98994` (Muted Rose)  
- **Accent Aqua**: `#7FBEBE` (Gentle Aqua)
- **Neutral Ivory**: `#FCF8F3` (Warm Ivory)
- **Neutral Slate**: `#404040` (Rich Slate)

### Typography (Implemented)
- **Headlines**: "Playfair Display" (Bold/Semi-Bold)
- **Body/UI**: "Lato" (Regular/Medium) - fallback to system sans-serif
- **CTAs**: "Playfair Display" (Semi-Bold)

### UI Elements
- **Watercolor Gradients**: `bg-gradient-to-br from-primary-indigo/5 via-secondary-rose/5 to-accent-aqua/5`
- **Rounded Corners**: Consistent `rounded-2xl` and `rounded-3xl` usage
- **Soft Shadows**: Layered shadow system with `shadow-lg` and `shadow-xl`
- **Smooth Transitions**: `transition-all duration-300` with `hover:scale-[1.02]`
- **Border Effects**: Subtle borders with opacity variations (`border-primary-indigo/10`)

### Iconography
- **Custom SVG Icons**: Fine-lined, minimalist sketch-like icons
- **Google OAuth Icon**: Official Google color scheme
- **Consistent Sizing**: `w-6 h-6` for small icons, `w-8 h-8` to `w-10 h-10` for feature icons
- **Color Harmony**: Icons use theme colors with appropriate opacity

## 6. Technical Implementation Details

### User Authentication
- **Required for All Features**: Google OAuth via Supabase Auth
- **Redirect Flow**: Landing → Google OAuth → Generator
- **Session Management**: Client-side auth state management with Supabase
- **Auth Guard**: Generator and Dashboard pages redirect to `/` if not authenticated

### File Handling
- **User-Specific Storage**: All uploads stored in user-specific Supabase Storage folders
- **Image Processing**: Client-side preview with drag-and-drop upload
- **Format Support**: JPG/PNG input, PDF/PNG output

### Credit System
- **Donation-Based**: Flexible donation amounts ($1+ minimum)
- **Stripe Integration**: Secure payment processing
- **High-Res Downloads**: Unlocked after donation completion
- **Receipt Generation**: Automatic tax documentation

### Visual States
- **Loading States**: Consistent spinner animations with brand colors
- **Progressive Disclosure**: Smooth slide-in animations for form steps
- **Error Handling**: Friendly error messages with retry options
- **Success States**: Clear confirmation and next-action guidance

## 7. Current Implementation Status

### ✅ Completed Features
- **Authentication-First Architecture**: Google OAuth required for all functionality
- **Complete Generation Pipeline**: Photo upload → Scene description → Style selection → AI generation
- **Donation System**: Stripe integration with flexible pricing
- **User Dashboard**: Saved pages with download management
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Watercolor Design System**: Consistent visual language throughout

### 🔄 Active Components
- **Landing Page**: Hero with sign-in requirement and educational content
- **Generator Flow**: Multi-step creation process with real-time feedback
- **Dashboard**: User history and page management
- **Navigation**: Contextual navigation based on auth state

### 📱 Responsive Behavior
- **Mobile**: Single-column layout with touch-friendly interactions
- **Tablet**: Optimized spacing and component sizing
- **Desktop**: Multi-column layouts with enhanced visual hierarchy

## 8. User Experience Principles

### Accessibility
- **Clear Visual Hierarchy**: Consistent heading structure and color contrast
- **Keyboard Navigation**: Focusable interactive elements
- **Screen Reader Support**: Semantic HTML and ARIA labels
- **Touch Targets**: Minimum 44px touch targets for mobile

### Performance
- **Progressive Loading**: Lazy-loaded components and images
- **Optimized Assets**: Next.js Image optimization and WebP support
- **Fast Navigation**: Client-side routing with smooth transitions
- **Error Recovery**: Graceful error handling with user-friendly messages

### Conversion Optimization
- **Clear Value Proposition**: Immediate understanding of app purpose
- **Trust Signals**: Stanford Children's Hospital partnership
- **Social Proof**: Google OAuth for familiar authentication
- **Friction Reduction**: Streamlined flow with minimal required inputs

This specification reflects the current state of the application as implemented, focusing on the authentication-first approach, donation-based model, and watercolor design aesthetic that distinguishes the app from generic coloring page generators.
