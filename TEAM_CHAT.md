# MyFridge - Team Communication Log

> This document serves as an asynchronous communication channel for all team roles.
> Each entry should tag relevant roles and be responded to by those affected.

---

## Format

```
### [DATE] [ROLE] - Subject
Message content here.

**Tags:** @Role1 @Role2
**Priority:** Low | Medium | High | Critical
**Status:** Open | In Discussion | Resolved

#### Responses:
- **[ROLE]:** Response content...
```

---

## Active Threads

### [2024-03-10] 🎯 PM - Project Kickoff & MVP Scope Confirmation

Team, we've aligned with the stakeholder on MVP scope. Key decisions:

1. **Core focus:** Expiration tracking (not spending)
2. **UI approach:** Simple list/grid, NOT visual fridge representation
3. **Workspace model:** Slack-style (one fridge = one workspace with invite code)
4. **AI strategy:** AI-first with manual fallback

The user will provide Supabase credentials shortly. Gemini API is ready.

**Tags:** @CTO @UI/UX @QA @Security @CEO
**Priority:** High
**Status:** Open

#### Responses:
- **🏗️ CTO:** Acknowledged. Ready to initialize Next.js once Supabase creds are in. Will follow the architecture in CLAUDE.md. Proposing we start with data model tests before any UI work.

- **🎨 UI/UX:** Understood on simple UI. Will prepare wireframe concepts for:
  - Product list (expiration-sorted)
  - Add product form
  - Receipt review screen
  Waiting on foundation before implementing.

- **🧪 QA:** TDD approach confirmed. Will write tests for:
  1. Product model validation
  2. Expiration date calculations
  3. Invite code generation
  Before any implementation begins.

- **🔒 Security:** Noted. Will prepare:
  - Supabase RLS policy templates
  - Input validation schemas
  - API security checklist

- **💼 CEO:** Good alignment. Speed is priority but not at cost of core quality. Let's aim for a working demo within the week.

---

### [2024-03-10] 🏗️ CTO - Technical Architecture Decisions

Confirming technical choices for the team:

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 14 (App Router) | Modern, great DX, API routes built-in |
| Auth | Supabase Auth | Integrated with DB, handles sessions |
| File Storage | Supabase Storage | Receipt images, avatars |
| AI | Gemini 1.5 Flash | Free tier, multimodal, fast |
| Testing | Vitest + RTL | Fast, modern, good DX |

**Architecture concern:** Receipt images need to be stored temporarily for AI processing but we should consider privacy - auto-delete after 30 days?

**Tags:** @Security @PM @CEO
**Priority:** Medium
**Status:** Open

#### Responses:
- **🔒 Security:** Agree on 30-day retention. Recommend:
  - Store images in private bucket (no public URLs)
  - Generate signed URLs only when needed
  - Add clear privacy policy about receipt data

- **🎯 PM:** 30 days seems reasonable. Users might want to reference old receipts for returns. Let's make it configurable in settings later (backlog item).

---

### [2024-03-10] 🧪 QA - TDD Strategy Proposal

Proposing the following test structure:

```
__tests__/
├── unit/
│   ├── models/          # Data validation
│   ├── utils/           # Helper functions
│   └── hooks/           # Custom hooks
├── integration/
│   ├── api/             # API route tests
│   └── flows/           # User flow tests
└── e2e/                 # Future: Playwright
```

**Test priorities for Phase 1:**
1. `isExpiringSoon(date)` - returns urgency level
2. `generateInviteCode()` - unique 6-char codes
3. `validateProduct(data)` - schema validation
4. `parseReceiptResponse(aiResponse)` - AI output parsing

**Tags:** @CTO @PM
**Priority:** High
**Status:** Open

#### Responses:
- **🏗️ CTO:** Approved. Will set up Vitest with this structure. Good call on testing AI output parsing - that's where bugs will likely surface.

---

### [2024-03-10] 🎨 UI/UX - Design System Proposal

For MVP, proposing minimal design system:

**Colors:**
- Fresh (green): `#22c55e` - 7+ days to expiration
- Warning (amber): `#f59e0b` - 3-6 days
- Urgent (red): `#ef4444` - 0-2 days
- Expired (gray): `#6b7280` - past date

**Components needed (Phase 2):**
1. ProductCard - shows name, expiry, category icon
2. ProductList - sorted, filterable
3. AddProductForm - simple form with date picker
4. CommandBar - text input + mic button
5. CameraCapture - receipt scanner

Will keep it functional first, can beautify later.

**Tags:** @PM @CTO
**Priority:** Medium
**Status:** Open

#### Responses:
- **🎯 PM:** Love the color system - very intuitive. Approved. Keep components minimal for MVP.

---

## Resolved Threads

*None yet - project just started!*

---

## Quick Pings

> For short updates that don't need full threads

- **[2024-03-10] User:** Gemini API key ready ✅
- **[2024-03-10] User:** Supabase credentials ready ✅
- **[2024-03-10] 🏗️ CTO:** Next.js 16 initialized with TypeScript + Tailwind ✅
- **[2024-03-10] 🧪 QA:** Vitest configured, 32 tests written and passing ✅
- **[2024-03-10] 🏗️ CTO:** Supabase client + database schema created ✅
- **[2024-03-10] 🏗️ CTO:** Gemini AI client + prompts ready ✅
- **[2024-03-10] 🔒 Security:** RLS policies defined in schema.sql ✅
- **[2024-03-10] 🎯 PM:** Phase 1 Foundation nearly complete - moving to UI! 🚀

---

## Decision Log

| Date | Decision | Made By | Rationale |
|------|----------|---------|-----------|
| 2024-03-10 | Simple list UI | PM + User | Speed to market |
| 2024-03-10 | Slack-style workspaces | PM + User | Familiar pattern |
| 2024-03-10 | TDD approach | QA + CTO | Quality assurance |
| 2024-03-10 | 30-day receipt retention | Security + PM | Privacy + utility balance |

---

## Blockers

| Issue | Blocking | Owner | Status |
|-------|----------|-------|--------|
| ~~Supabase credentials~~ | ~~Project init~~ | ~~User~~ | ✅ Resolved |
| Run schema.sql in Supabase | First user flow | User | Action needed |

---

## Next Standup Topics

1. ✅ ~~Supabase setup status~~ - DONE
2. ✅ ~~First test files to write~~ - 32 tests passing!
3. Run schema.sql in Supabase SQL Editor
4. Build core UI components (ProductCard, ProductList)
5. Create first user flow (Create/Join Fridge)
