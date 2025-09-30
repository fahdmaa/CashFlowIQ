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
- **State Management**: TanStack Query v5 for server state
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Routing**: Wouter v3
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation

### Database Integration
The application migrated from PocketBase to Supabase, using direct client-side integration with RLS policies for security:

1. **Authentication**: Supabase Auth handles JWT tokens stored in localStorage
2. **Direct Queries**: Client uses `supabase-direct.ts` to bypass API endpoints for better performance
3. **Query Client**: `supabase-query-client.ts` wraps Supabase calls with TanStack Query for caching
4. **RLS Policies**: All tables use `auth.uid()` to isolate user data

### Transaction Types & Categories
- **income**: Auto-assigns "Salary" category, no category selection needed
- **expense**: Requires category selection from user's categories
- **savings**: Auto-assigns "Savings" category, deducted from balance calculations

### Date Handling
- Salary cycles run from 27th to 26th of each month
- All dates normalized to ISO format (YYYY-MM-DD) before database storage
- Frontend accepts flexible formats (DD/MM/YYYY, MM/DD/YYYY) via `normalize.ts`

### Key Files Structure
```
client/src/lib/
├── supabase-auth.ts        # Auth setup and token management
├── supabase-direct.ts      # Direct Supabase queries
├── supabase-query-client.ts # TanStack Query integration
└── normalize.ts            # Input normalization utilities

server/
├── supabase-routes.ts      # API endpoints (backup/legacy)
└── supabase-storage.ts     # Server-side Supabase client
```

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
1. Ensure TypeScript checks pass: `npm run check`
2. Test in browser (responsive design)
3. Verify RLS policies work (user isolation)
4. Check console for errors

## Important Notes

- **ALWAYS COMMIT AND PUSH CHANGES** after completing tasks - use `git push` to save to GitHub
- Direct API calls are preferred over serverless functions for performance
- Amounts can be entered flexibly (e.g., "1000", "1,000", "1k") and are normalized
- Balance = income - expenses - savings
- Auth tokens stored in localStorage with refresh handling
- Use existing UI patterns from shadcn/ui components