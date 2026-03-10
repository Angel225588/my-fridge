# MyFridge - Project TODO

> Last Updated: 2024-03-10
> Current Phase: 1 - Foundation

---

## Legend
- 🔴 Blocked
- 🟡 In Progress
- 🟢 Complete
- ⚪ Not Started

---

## Phase 1: Foundation

### Setup & Configuration
| Status | Task | Owner | Notes |
|--------|------|-------|-------|
| 🟡 | Get Supabase credentials | User | In progress |
| 🟢 | Get Gemini API key | User | Done |
| ⚪ | Initialize Next.js project | CTO | Waiting on env setup |
| ⚪ | Configure TypeScript | CTO | |
| ⚪ | Setup Tailwind CSS | CTO | |
| ⚪ | Configure Vitest | QA | TDD infrastructure |
| ⚪ | Create Supabase tables | CTO | Schema from CLAUDE.md |
| ⚪ | Setup Supabase auth | CTO | |

### Testing Foundation
| Status | Task | Owner | Notes |
|--------|------|-------|-------|
| ⚪ | Write Product model tests | QA | TDD first |
| ⚪ | Write Fridge model tests | QA | TDD first |
| ⚪ | Write utility function tests | QA | Date formatting, etc |

---

## Phase 2: Core Inventory

### Fridge Management
| Status | Task | Owner | Notes |
|--------|------|-------|-------|
| ⚪ | Create fridge flow | PM/CTO | |
| ⚪ | Join fridge with code | PM/CTO | |
| ⚪ | Generate invite codes | CTO | 6-char unique |
| ⚪ | Fridge settings page | UI/UX | |

### User Profiles
| Status | Task | Owner | Notes |
|--------|------|-------|-------|
| ⚪ | Profile creation UI | UI/UX | |
| ⚪ | Profile CRUD operations | CTO | |
| ⚪ | Avatar upload | CTO | Supabase storage |

### Product Management
| Status | Task | Owner | Notes |
|--------|------|-------|-------|
| ⚪ | Add product form | UI/UX | |
| ⚪ | Edit product modal | UI/UX | |
| ⚪ | Delete product (confirm) | UI/UX | |
| ⚪ | Product list component | UI/UX | Sorted by expiration |
| ⚪ | Color-coded expiration | UI/UX | Green/Yellow/Red |
| ⚪ | Category filter | UI/UX | |
| ⚪ | Location filter | UI/UX | Fridge/Freezer/Pantry |

---

## Phase 3: AI Integration

### Receipt Scanner
| Status | Task | Owner | Notes |
|--------|------|-------|-------|
| ⚪ | Camera capture component | CTO | Browser API |
| ⚪ | Gemini vision integration | CTO | Parse receipt image |
| ⚪ | Review extracted items UI | UI/UX | Editable list |
| ⚪ | Batch add products | CTO | From receipt |

### Voice/Text Commands
| Status | Task | Owner | Notes |
|--------|------|-------|-------|
| ⚪ | Command input component | UI/UX | Text + mic button |
| ⚪ | Speech-to-text | CTO | Browser API |
| ⚪ | Gemini command parsing | CTO | NLP intent |
| ⚪ | Command confirmation UI | UI/UX | Show what AI understood |

### AI Helpers
| Status | Task | Owner | Notes |
|--------|------|-------|-------|
| ⚪ | Default expiration by category | CTO | AI knowledge |
| ⚪ | Product categorization | CTO | Auto-assign category |

---

## Phase 4: Polish

### PWA & Mobile
| Status | Task | Owner | Notes |
|--------|------|-------|-------|
| ⚪ | PWA manifest | CTO | |
| ⚪ | Service worker | CTO | Offline support |
| ⚪ | Install prompt | UI/UX | |
| ⚪ | Mobile responsiveness audit | UI/UX | |

### UX Improvements
| Status | Task | Owner | Notes |
|--------|------|-------|-------|
| ⚪ | Loading skeletons | UI/UX | |
| ⚪ | Error boundaries | CTO | |
| ⚪ | Toast notifications | UI/UX | |
| ⚪ | Empty states | UI/UX | |

### Security
| Status | Task | Owner | Notes |
|--------|------|-------|-------|
| ⚪ | Input sanitization audit | Security | |
| ⚪ | RLS policies review | Security | Supabase |
| ⚪ | API rate limiting | Security | |

---

## Backlog (Future)

- [ ] Spending tracking & budget
- [ ] Grocery list generation
- [ ] Waste analytics dashboard
- [ ] Recipe suggestions based on expiring items
- [ ] Push notifications for expiring items
- [ ] Multi-language support
- [ ] Dark mode

---

## Bugs

*No bugs reported yet*

---

## Technical Debt

*None accumulated yet - starting fresh!*
