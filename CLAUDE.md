# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev                  # Start development server (client on :5173, API on :3000)
npm run build               # Build both client and server
npm run build:client        # Build client (Vite)
npm run build:server        # Build server (esbuild)
npm run check               # TypeScript type checking
npm run start               # Production start (Azure)
```

### Azure Deployment
```bash
npm run azure:build         # Build for Azure deployment
npm run azure:start         # Start Azure production server (PORT 8080)
```

## Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **State Management**: TanStack Query v5 for server state caching
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Routing**: Wouter v3 (lightweight alternative to React Router)
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation

### Database Integration (Direct Client-Side Approach)
The application migrated from PocketBase to Supabase. **IMPORTANT**: It uses **direct client-side database queries** instead of API endpoints for better performance:

1. **Authentication**: Supabase Auth with JWT tokens stored in localStorage
   - Auth setup in `client/src/lib/supabase-auth.ts`
   - Auto-refresh handled by `refreshAuthToken()` function

2. **Direct Queries**: Client makes direct database calls via `supabase-direct.ts`
   - Bypasses server API for most operations
   - All queries protected by Row Level Security (RLS)
   - 24+ exported functions for CRUD operations

3. **Query Caching**: `supabase-query-client.ts` wraps TanStack Query
   - Handles token refresh on 401 errors
   - Manages cache invalidation

4. **RLS Security**: All tables enforce user isolation via `auth.uid()` policies
   - Each user can only access their own data
   - Policies defined in `supabase/schema.sql`

**Server Routes**: `server/supabase-routes.ts` exists as backup/legacy but is rarely used.

### Transaction Types & Categories
- **income**: Auto-assigns "Salary" category (no user selection needed)
- **expense**: Requires category selection from user's custom categories
- **savings**: Auto-assigns "Savings" category, **deducted from balance** (not included in spending)

**Balance Calculation**: `currentBalance = monthlyIncome - monthlySpending - savingsAmount`

### Date & Month Handling
- **Salary Cycles**: Run from 27th of previous month to 26th of current month
  - If today is Oct 28, you're in the "November" salary cycle (Oct 27 - Nov 26)
  - Implemented in `getSalaryCycleDates()` in `supabase-direct.ts`

- **Fiscal Months**: Optional user-defined month boundaries (currently disabled)
  - `getFiscalCycleDates()` falls back to salary cycles
  - Future feature for custom month start dates

- **Date Normalization**: All dates stored as ISO format (YYYY-MM-DD)
  - Frontend accepts DD/MM/YYYY or MM/DD/YYYY via `normalize.ts`
  - `normalizeDateToISO()` converts to UTC midnight

### Amount Input Normalization
The `normalizeAmount()` function in `client/src/lib/normalize.ts` handles flexible user input:
- Strips currency symbols/text: `"28 DH"` → `"28"`
- Handles commas as decimal separators: `"28,50"` → `"28.50"`
- Removes grouping separators: `"1,234.50"` → `"1234.50"`
- Returns empty string for invalid numbers

### Key Files Structure
```
client/src/lib/
├── supabase-auth.ts          # Auth setup, token management, refresh
├── supabase-direct.ts        # Direct DB queries (24+ functions)
├── supabase-query-client.ts  # TanStack Query wrapper with auth
├── normalize.ts              # Input normalization (amounts, dates)
└── categorization.ts         # Category assignment logic

client/src/components/
├── financial-overview.tsx    # Dashboard summary cards
├── budget-tracking.tsx       # Budget progress indicators
├── spending-analytics.tsx    # Recharts spending graph
├── recent-transactions.tsx   # Transaction list with edit/delete
└── pill-month-filter.tsx     # Month selector dropdown

server/
├── index.ts                  # Express server setup
├── supabase-routes.ts        # API endpoints (legacy/backup)
└── supabase-storage.ts       # Server-side Supabase client
```

### Component Patterns
- **shadcn/ui**: All UI components in `client/src/components/ui/`
  - Use existing components: Button, Card, Dialog, Select, etc.
  - Custom variants: `pill-select.tsx`, `pill-dropdown-menu.tsx` for navigation

- **Modals**: Dialog-based modals for forms
  - `add-transaction-modal.tsx`: Create transactions
  - `edit-transaction-modal.tsx`: Update transactions
  - `add-category-modal.tsx`: Create categories with color/icon

- **Data Fetching**: Use TanStack Query hooks
  - Query keys match database tables: `['transactions']`, `['budgets']`, etc.
  - Mutations invalidate related queries on success

## Development Workflow

### Git Commit Convention
Use conventional commits with Claude attribution:
```
feat: add budget tracking
fix: resolve date parsing issue
refactor: optimize query performance

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Before Committing
1. Run TypeScript checks: `npm run check`
2. Test in browser (check responsive design)
3. Verify RLS policies work (user data isolation)
4. Check browser console for errors

### Deployment Targets
- **Azure App Service**: Primary deployment (see `AZURE-DEPLOYMENT.md`)
  - Uses `azure-server.js` entry point
  - Configured via `web.config` and `.deployment`

- **Vercel**: Alternative deployment option
  - API routes in `api/` directory
  - Build via `vercel-build` script

## Important Notes

- **ALWAYS COMMIT AND PUSH** after completing tasks - use `git push` to save to GitHub
- Direct client-side queries are **preferred** over API endpoints for performance
- Auth tokens auto-refresh on 401 errors via `supabase-query-client.ts`
- All monetary amounts normalized via `normalizeAmount()` before storage
- Month selection affects what data is displayed (salary cycle filtering)
- Use existing shadcn/ui patterns for consistency

## Documentation Cleanup Policy

**IMPORTANT**: After completing any task, delete temporary/task-specific .md files to keep the repository clean:

### Files to ALWAYS Keep
- `README.md` - Main project documentation
- `CLAUDE.md` - This file (instructions for Claude Code)
- `AZURE-DEPLOYMENT.md` - Current deployment instructions
- `email-templates/README.md` - Email template setup guide

### Files to DELETE After Task Completion
Delete any .md files that were created for specific tasks or debugging sessions, such as:
- Migration guides (after migration is complete)
- Debugging instructions (after bugs are fixed)
- Setup guides for completed features
- Historical summaries
- Platform-specific guides that are no longer relevant (e.g., Replit, PocketBase)

### When to Clean Up
1. **Immediately after task completion**: Remove any temporary documentation files created during the task
2. **During code review**: Check for outdated .md files before committing
3. **Before major releases**: Audit all documentation and remove obsolete files

Use this command to identify potential cleanup candidates:
```bash
# List all .md files in root directory
ls *.md

# Review and delete unnecessary files
rm <filename>.md
```

Always commit the cleanup with a clear message:
```
chore: remove outdated documentation files

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```