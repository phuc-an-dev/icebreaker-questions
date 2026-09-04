<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Icebreaker Questions — Agent Guidelines & Architecture Manual

This document is the single source of truth for AI agents (Antigravity, Claude Code, Cursor, Copilot) working on this codebase. Follow these rules and architectural standards strictly.

---

## 1. Project Overview

**Icebreaker Questions** is a modern, high-performance web application designed for group icebreaking, team-building, and party games.
- **230+ Curated Questions** categorized across themes (Work, Fun, Memory, Group, Faith, Relationship, Growth, Game).
- **Interactive Modes**: Presentation/Stage View, Random Roulette Draw, Confetti FX, Category & Type Filters.
- **Hybrid Architecture**: Server-Side Rendering (SSR) from MongoDB Atlas with optimistic client-side filtering and local interaction state (Favorites, Asked status) stored in `localStorage`.

---

## 2. Tech Stack & Dependencies

- **Framework**: Next.js 16 (App Router with Turbopack)
- **Runtime / UI**: React 19, TypeScript 5
- **Database**: MongoDB Atlas via official `mongodb` Node.js driver (v6.x)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`)
- **Animation & Effects**: `framer-motion`, `lucide-react`
- **Linter**: ESLint 9 (`eslint-config-next`)

---

## 3. Directory Structure

```
├── .env.example               # Template for environment variables (commit-safe)
├── .env.local                 # Local environment secrets (NEVER commit, in .gitignore)
├── AGENTS.md                  # Instructions for AI agents (this file)
├── CLAUDE.md                  # Pointer to AGENTS.md
├── package.json               # Scripts and dependencies
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── questions/     # Route Handler (GET /api/questions)
│   │   │       └── route.ts
│   │   ├── globals.css        # Global CSS & Tailwind v4 theme
│   │   ├── layout.tsx         # Root HTML layout & meta tags
│   │   └── page.tsx           # Server Component: fetches questions from MongoDB (SSR)
│   ├── components/
│   │   ├── IcebreakerClient.tsx # Client root: manages state, layout, cards grid, stage
│   │   ├── canvas/            # 60fps Particle/Ambient Canvas backgrounds
│   │   ├── cards/             # QuestionCard component
│   │   ├── filters/           # CategoryChips, FilterBar
│   │   ├── stage/             # Fullscreen PresentationModal
│   │   └── ui/                # StatsBar, IconHelper
│   ├── data/
│   │   └── metadata.ts        # UI metadata: Category labels, colors, icons, type hints
│   ├── hooks/
│   │   └── useQuestionsState.ts # Custom hook: derived state, filtering, roulette, storage
│   ├── lib/
│   │   ├── db-questions.ts    # Database query service (getAllQuestions)
│   │   ├── mongodb.ts         # Cached singleton MongoClient promise for Next.js HMR
│   │   └── utils.ts           # Utility functions (stripAccents, cn helper)
│   └── types/
│       └── question.ts        # Core TypeScript interfaces & type definitions
```

---

## 4. Data Layer & MongoDB Atlas Rules

### Connection Pattern
- **Singleton Connection**: All MongoDB interactions must use `clientPromise` from `@/lib/mongodb.ts`. Do not instantiate `new MongoClient` directly in routes or components to prevent connection leaks during Next.js Hot Module Replacement (HMR).
- **Environment Configuration**:
  - `MONGODB_URI`: Atlas connection string including credentials and cluster hostname.
  - `MONGODB_DB`: Default database name (`icebreaker_db`).
- **Data Access Service**: Business logic and database queries must reside in `@/lib/db-questions.ts`, never directly in UI components.

### Schema & Indexing
- **Collection**: `questions`
- **Document Structure**:
  ```ts
  {
    id: number;           // Unique integer identifier (1-indexed)
    text: string;         // Vietnamese question text
    category: CategoryId; // 'group' | 'fun' | 'memory' | 'work' | 'relationship' | 'growth' | 'faith' | 'game'
    type: QuestionTypeId; // 'open' | 'rotating' | 'pick1' | 'pick2' | 'rate' | 'guess' | ...
    tags: string[];       // Tag identifiers (e.g. ['roles', 'food'])
  }
  ```
- **Indexes**: Unique index on `id` field (`{ id: 1 }, { unique: true }`).

---

## 5. Coding Guidelines & Zero Technical Debt Policy

1. **React 19 & Hooks Rules**:
   - **No Synchronous `setState` in `useEffect`**: Follow React's "You Might Not Need an Effect" pattern. Prefer **Derived State** when initial props are available (see `src/hooks/useQuestionsState.ts`).
   - `useEffect` must only be used to synchronize with external systems or run network fetches when initial data is absent.
2. **Server vs. Client Separation**:
   - Keep `src/app/page.tsx` as a **Server Component** for instant first-paint SSR from MongoDB.
   - Interactive logic (`useState`, `useCallback`, `localStorage`, modals) belongs in client components marked with `'use client'`.
3. **Resilience & Fallback**:
   - Always handle database connectivity failures gracefully. If MongoDB SSR fails, the UI must fallback to client-side API fetch with a clear error card and retry button.
4. **No Static Redundancies / Dead Code**:
   - Do NOT commit hardcoded question data files (e.g. `questions.json` has been migrated and deleted).
   - Temporary migration scripts or sensitive credential dumps must never be retained in the workspace.
5. **Quality Gates (Mandatory before submitting work)**:
   - Run `npm run lint` — must exit with **0 errors and 0 warnings**.
   - Run `npm run build` — must build and compile TypeScript with **0 errors**.
6. **Strict English-Only Policy**:
   - All code, UI strings, labels, placeholders, error messages, code comments, logs, and documentation MUST be written strictly in English.
   - Do NOT use Vietnamese in source code or UI components (the only exception is the Vietnamese text of existing questions stored in the database and regex diacritic mapping in `stripAccents`).

---

## 6. Common Commands

```bash
# Start local dev server (Turbopack)
npm run dev

# Run ESLint validation
npm run lint

# Build production bundle & verify TypeScript
npm run build

# Start production server
npm run start
```
