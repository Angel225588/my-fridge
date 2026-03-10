# MyFridge - Intelligent Food Inventory & Expiration Tracker

## Project Overview

MyFridge is a mobile-responsive web application designed to minimize household food waste by tracking inventory and expiration dates. Users can quickly add items via AI-powered receipt scanning or voice/text commands.

### Core Problem
Food expires unnoticed → waste of money and resources.

### Solution
A simple, AI-powered inventory system that tells you what to cook/use first.

---

## Team Roles & Responsibilities

When working on this project, Claude should adopt these specialized perspectives:

### 🎯 Product Manager (PM)
- Prioritize features based on user value
- Keep scope tight - resist feature creep
- Ensure every feature ties back to "reduce food waste"

### 💼 CEO / Strategist
- Make decisions that balance speed vs. quality
- Focus on getting to market fast with core value
- Think about user acquisition and retention

### 🏗️ CTO / Architect
- Ensure scalable, maintainable code architecture
- Make technology decisions (Next.js, Supabase, Gemini)
- Review for security and performance

### 🎨 UI/UX Designer
- Simple, functional interfaces over flashy designs
- Mobile-first responsive design
- Accessibility matters (a11y)

### 🔒 Security Auditor
- Validate all user inputs
- Secure API endpoints
- Protect user data and fridge privacy

### 🧪 QA Engineer (TDD Focus)
- Write tests BEFORE implementation
- Every feature needs test coverage
- Integration tests for AI flows

---

## Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| Framework | Next.js 14 (App Router) | SSR, API routes, great DX |
| Language | TypeScript | Type safety, better tooling |
| Styling | Tailwind CSS | Fast iteration, consistent design |
| Database | Supabase (Postgres) | Auth, realtime, storage, free tier |
| AI | Google Gemini API | Free tier, multimodal (vision + text) |
| Testing | Vitest + React Testing Library | Fast, modern testing |
| Deployment | Vercel | Seamless Next.js deployment |

---

## Data Model

### Fridge (Workspace)
```typescript
interface Fridge {
  id: string;
  name: string;
  invite_code: string; // 6-char unique code
  created_at: Date;
}
```

### User Profile
```typescript
interface UserProfile {
  id: string;
  fridge_id: string;
  name: string;
  avatar_url?: string;
  role: 'owner' | 'member';
  created_at: Date;
}
```

### Product (Inventory Item)
```typescript
interface Product {
  id: string;
  fridge_id: string;
  name: string;
  quantity: number;
  unit: string; // 'pcs', 'lbs', 'oz', 'liters', etc.
  category: ProductCategory;
  expiration_date: Date | null;
  purchase_date: Date;
  added_by: string; // user_id
  location: 'fridge' | 'freezer' | 'pantry';
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

type ProductCategory =
  | 'dairy'
  | 'meat'
  | 'produce'
  | 'beverages'
  | 'grains'
  | 'frozen'
  | 'condiments'
  | 'snacks'
  | 'other';
```

### Receipt
```typescript
interface Receipt {
  id: string;
  fridge_id: string;
  store_name: string;
  purchase_date: Date;
  total_amount: number;
  image_url: string;
  processed: boolean;
  added_by: string;
  created_at: Date;
}
```

---

## Core User Flows

### Flow 1: Join/Create Fridge
```
1. User opens app
2. Option A: Create new fridge → generates invite code
3. Option B: Join existing fridge with code
4. Create profile (name, optional avatar)
5. Enter main dashboard
```

### Flow 2: Add Products via Receipt
```
1. Tap "Add Receipt" button
2. Camera opens → snap photo
3. AI extracts: store, date, products, prices
4. Review extracted items (edit if needed)
5. For each item: set expiration (voice/tap/AI guess)
6. Confirm → items added to inventory
```

### Flow 3: Quick AI Commands
```
1. Tap microphone or type in command bar
2. Natural language: "Milk expires March 20th"
3. AI parses intent and updates inventory
4. Confirmation shown
```

### Flow 4: Check What's Expiring
```
1. Dashboard shows items sorted by expiration
2. Color coding: Green (fresh) → Yellow (soon) → Red (urgent)
3. Tap item to use/remove/edit
```

---

## API Structure

### Supabase Tables
- `fridges` - Workspaces
- `profiles` - Users within fridges
- `products` - Inventory items
- `receipts` - Scanned receipts

### API Routes (Next.js)
```
/api/ai/parse-receipt    POST  - Send image, get extracted items
/api/ai/command          POST  - Natural language command processing
/api/ai/suggest-expiry   POST  - Get AI-suggested expiration for product
```

---

## Development Guidelines

### TDD Workflow
1. **Write the test first** - Define expected behavior
2. **Run test (should fail)** - Confirms test is valid
3. **Implement minimum code** - Make test pass
4. **Refactor** - Clean up while tests stay green

### File Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth-related pages
│   ├── (dashboard)/       # Main app pages
│   ├── api/               # API routes
│   └── layout.tsx
├── components/
│   ├── ui/                # Reusable UI components
│   └── features/          # Feature-specific components
├── lib/
│   ├── supabase/          # Supabase client & helpers
│   ├── gemini/            # Gemini AI integration
│   └── utils/             # Utility functions
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript types
└── __tests__/             # Test files mirror src structure
```

### Naming Conventions
- Components: PascalCase (`ProductCard.tsx`)
- Utilities: camelCase (`formatDate.ts`)
- Constants: SCREAMING_SNAKE_CASE
- Test files: `*.test.ts` or `*.test.tsx`

### Git Workflow
- Feature branches: `feature/add-receipt-scanner`
- Bug fixes: `fix/expiration-date-calculation`
- Commits: Conventional commits (`feat:`, `fix:`, `test:`, `docs:`)

---

## MVP Milestones

### Phase 1: Foundation ✅
- [ ] Project setup (Next.js, TypeScript, Tailwind)
- [ ] Supabase setup (auth, database schema)
- [ ] Basic routing structure
- [ ] Testing infrastructure

### Phase 2: Core Inventory
- [ ] Create/Join fridge flow
- [ ] User profile management
- [ ] Manual add/edit/delete products
- [ ] Product list sorted by expiration
- [ ] Color-coded expiration indicators

### Phase 3: AI Integration
- [ ] Gemini API setup
- [ ] Receipt photo → product extraction
- [ ] Voice/text command processing
- [ ] AI-suggested expiration dates

### Phase 4: Polish
- [ ] Mobile-responsive optimization
- [ ] Error handling & edge cases
- [ ] Loading states & feedback
- [ ] PWA capabilities (offline, install prompt)

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google Gemini
GEMINI_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Key Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2024-03-10 | Simple list UI over visual fridge | Speed to market, core value is data not visuals |
| 2024-03-10 | Slack-style workspace model | Familiar pattern, easy onboarding |
| 2024-03-10 | AI-first with manual fallback | AI handles happy path, manual catches edge cases |
| 2024-03-10 | TDD approach | Ensures quality, faster debugging |

---

## Commands Reference

```bash
# Development
npm run dev          # Start dev server
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Run linter
npm run build        # Production build

# Database
npx supabase start   # Local Supabase
npx supabase db push # Push migrations
```

---

## Questions to Resolve

- [ ] Default expiration times per category (AI training data)
- [ ] Notification system (email? push? in-app only?)
- [ ] Data retention policy for receipts
- [ ] Free tier limits strategy
