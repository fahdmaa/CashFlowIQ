# CashFlowIQ - PocketBase to Supabase Migration Guide

This guide provides step-by-step instructions for migrating the CashFlowIQ application from PocketBase to Supabase.

## Overview

The migration includes:
- Database schema migration with Row Level Security (RLS)
- Authentication system migration from custom token-based auth to Supabase Auth
- API routes updated to use Supabase client
- Frontend authentication updates
- Automated data migration scripts

## Prerequisites

1. **Supabase Account**: Create an account at [supabase.com](https://supabase.com)
2. **Node.js**: Ensure you have Node.js 18+ installed
3. **Database Access**: Access to your current PocketBase data (if migrating existing data)

## Step 1: Set Up Supabase Project

1. **Create a new project** in your Supabase dashboard
2. **Note your project credentials**:
   - Project URL: `https://your-project-id.supabase.co`
   - Anon Key: Your public API key
   - Service Role Key: Your private API key (keep secure!)

3. **Configure authentication settings**:
   - Go to Authentication > Settings
   - Configure email confirmations as needed
   - Set up any additional providers (Google, GitHub, etc.) if desired

## Step 2: Apply Database Schema

1. **Open your Supabase SQL Editor** (Database > SQL Editor)
2. **Run the schema file**: Copy and paste the contents of `supabase/schema.sql`
3. **Execute the SQL**: This will create all tables, indexes, RLS policies, and triggers

The schema includes:
- `user_profiles` - Extended user information
- `categories` - Income/expense categories
- `budgets` - Monthly spending limits
- `transactions` - Financial transactions
- `insights` - AI-generated financial insights

## Step 3: Update Environment Variables

1. **Copy the Supabase environment template**:
   ```bash
   cp .env.supabase.example .env
   ```

2. **Update with your Supabase credentials**:
   ```bash
   # Backend
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Frontend
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

## Step 4: Install Dependencies

```bash
npm install @supabase/supabase-js
```

## Step 5: Update Application Code

The following files have been created/updated for Supabase integration:

### Backend Files
- `server/supabase-storage.ts` - Supabase data access layer
- `server/supabase-routes.ts` - API routes using Supabase Auth
- `api/supabase/[...path].ts` - Vercel serverless function entry point

### Frontend Files
- `client/src/lib/supabase-auth.ts` - Supabase authentication utilities
- `client/src/lib/supabase-query-client.ts` - Query client with token refresh
- `client/src/pages/supabase-login.tsx` - Login/signup page for Supabase

### Configuration Files
- Updated `package.json` with Supabase dependencies and build scripts
- `.env.supabase.example` - Environment variables template

## Step 6: Data Migration (Optional)

If you have existing PocketBase data to migrate:

1. **Export your PocketBase data** (if possible) to JSON files
2. **Update the migration script** (`scripts/migrate-to-supabase.js`) with your data paths
3. **Run the migration**:
   ```bash
   node scripts/migrate-to-supabase.js
   ```

### Manual Setup (No Existing Data)

If starting fresh, the database will automatically create:
- Default categories for new users
- Initial budget allocations
- Sample insights generation

## Step 7: Update Application Entry Points

### For Development
Update your main application to use the new Supabase components:

```typescript
// In your main App component or router
import SupabaseLogin from './pages/supabase-login';
import { queryClient } from './lib/supabase-query-client';

// Use SupabaseLogin instead of the old Login component
// Use the new queryClient with token refresh capability
```

### For Production (Vercel)
The application now has two API endpoints:
- `/api/[...path]` - Original PocketBase-compatible API (for backward compatibility)
- `/api/supabase/[...path]` - New Supabase API

Update your API calls to use the `/api/supabase/` endpoint.

## Step 8: Test the Migration

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Test key functionality**:
   - User registration/login
   - Creating categories and budgets
   - Adding transactions
   - Viewing insights and analytics

## Step 9: Deploy

1. **Update your environment variables** in your deployment platform (Vercel, etc.)
2. **Deploy the updated application**
3. **Test in production environment**

## Key Differences from PocketBase

### Authentication
- **PocketBase**: Custom username/password with token-based auth
- **Supabase**: Email/password with JWT tokens and automatic refresh

### Data Access
- **PocketBase**: Direct API calls with custom authentication
- **Supabase**: JavaScript client with automatic RLS enforcement

### Real-time Features
- **PocketBase**: Custom WebSocket implementation
- **Supabase**: Built-in real-time subscriptions (can be added later)

### File Storage
- **PocketBase**: Built-in file storage
- **Supabase**: Separate storage service (not implemented in this migration)

## Post-Migration Tasks

1. **User Communication**: 
   - Inform users about the migration
   - Users will need to create new accounts or reset passwords

2. **Data Validation**:
   - Verify all data migrated correctly
   - Test all application features thoroughly

3. **Performance Monitoring**:
   - Monitor application performance
   - Check database query performance
   - Monitor authentication flows

4. **Security Review**:
   - Review RLS policies
   - Test data isolation between users
   - Verify API security

## Rollback Plan

If you need to rollback to PocketBase:

1. Keep the original files (`server/routes.ts`, `client/src/lib/auth.ts`, etc.)
2. Update API endpoints back to the original paths
3. Revert environment variables
4. Redeploy the application

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**:
   - Ensure user is properly authenticated
   - Check that policies match your data access patterns

2. **Token Refresh Issues**:
   - Verify Supabase project settings
   - Check token expiration settings

3. **CORS Errors**:
   - Update CORS settings in your Vercel configuration
   - Ensure proper headers in API responses

4. **Migration Errors**:
   - Check database connections
   - Verify data format compatibility
   - Review error logs for specific issues

### Getting Help

- **Supabase Documentation**: [https://supabase.com/docs](https://supabase.com/docs)
- **Supabase Community**: [https://supabase.com/community](https://supabase.com/community)
- **GitHub Issues**: Create issues in the project repository

## Files Modified/Created

### New Files
- `/supabase/schema.sql` - Database schema with RLS policies
- `/server/supabase-storage.ts` - Supabase data access layer
- `/server/supabase-routes.ts` - API routes with Supabase Auth
- `/client/src/lib/supabase-auth.ts` - Supabase authentication
- `/client/src/lib/supabase-query-client.ts` - Query client with token refresh
- `/client/src/pages/supabase-login.tsx` - New login/signup page
- `/api/supabase/[...path].ts` - Supabase API entry point
- `/scripts/migrate-to-supabase.js` - Data migration script
- `/.env.supabase.example` - Environment variables template
- `/SUPABASE_MIGRATION_GUIDE.md` - This migration guide

### Modified Files
- `/package.json` - Added Supabase dependencies and updated build scripts

### Preserved Files (for backward compatibility)
- Original PocketBase integration files remain unchanged
- Can be removed after successful migration and testing

This migration provides a robust, scalable foundation for the CashFlowIQ application with enterprise-grade authentication and database security.