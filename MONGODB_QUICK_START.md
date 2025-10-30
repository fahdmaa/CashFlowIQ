# MongoDB Migration - Quick Start Guide

## Overview

This guide will help you quickly migrate your CashFlowIQ application from Supabase to MongoDB.

## Files Created

The following files have been created for MongoDB integration:

### Backend Files
1. **server/mongodb-connection.ts** - MongoDB connection manager with automatic index creation
2. **server/auth-service.ts** - JWT-based authentication service (replaces Supabase Auth)
3. **server/auth-middleware.ts** - Express middleware for JWT token verification
4. **server/mongodb-storage.ts** - Complete data access layer for MongoDB (24+ functions)

### Migration Files
5. **scripts/migrate-supabase-to-mongodb.js** - Automated migration script
6. **.env.mongodb.example** - Environment variables template

### Documentation
7. **MONGODB_MIGRATION_GUIDE.md** - Comprehensive migration documentation
8. **MONGODB_QUICK_START.md** - This file

## Quick Start Steps

### 1. Set Up MongoDB Atlas (Free Tier)

```bash
# Go to https://www.mongodb.com/cloud/atlas
# 1. Create free account
# 2. Create a cluster (M0 free tier)
# 3. Create database user (username/password)
# 4. Whitelist your IP (or use 0.0.0.0/0 for development)
# 5. Get connection string
```

### 2. Configure Environment Variables

```bash
# Copy the MongoDB example file
cp .env.mongodb.example .env.mongo

# Edit .env.mongo and add your MongoDB connection string
# Replace <username>, <password>, and <cluster> with your values
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=cashflowiq

# Generate secure JWT secrets (run this command):
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Update JWT secrets in .env.mongo:
JWT_SECRET=<generated-secret-1>
JWT_REFRESH_SECRET=<generated-secret-2>
```

### 3. Install Dependencies

Dependencies are already installed! The following were added:
- `mongodb` - MongoDB Node.js driver
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token generation/verification
- `@types/bcryptjs` & `@types/jsonwebtoken` - TypeScript definitions

### 4. Run Migration Script

```bash
# This will transfer all data from Supabase to MongoDB
node scripts/migrate-supabase-to-mongodb.js
```

**Expected Output:**
```
🚀 Starting Supabase to MongoDB migration...
📡 Connecting to MongoDB...
✅ Connected to MongoDB database: cashflowiq
📋 Creating MongoDB indexes...
✅ Indexes created successfully

👥 Migrating users...
Found 2 users to migrate
  ✓ Migrated user: user1@example.com
  ✓ Migrated user: user2@example.com
✅ Users migration complete: 2/2 successful

📁 Migrating categories...
✅ Categories migration complete: 10/10 successful

💰 Migrating budgets...
✅ Budgets migration complete: 8/8 successful

💸 Migrating transactions...
✅ Transactions migration complete: 156/156 successful

💡 Migrating insights...
✅ Insights migration complete: 12/12 successful

📊 MIGRATION SUMMARY
============================================================
USERS:
  Total:    2
  Migrated: 2 ✓
  Failed:   0 ✗

TOTAL: 188 records migrated, 0 failed
🎉 Migration completed successfully!

⚠️  IMPORTANT: All users have been assigned the default password "ChangeMe123!"
    Users will need to reset their passwords on first login.
```

### 5. Next Steps

After successful migration, you have two options:

#### Option A: Complete Backend Rewrite (Recommended)
You'll need to create MongoDB API routes to replace Supabase routes. This requires:

1. **Create `server/mongodb-routes.ts`** with Express routes
2. **Update `server/index.ts`** to use MongoDB routes
3. **Update frontend** to use new MongoDB API endpoints
4. **Test all functionality** thoroughly

See `MONGODB_MIGRATION_GUIDE.md` for detailed instructions.

#### Option B: Gradual Migration (Safer)
Keep both Supabase and MongoDB running simultaneously:

1. **New features** use MongoDB
2. **Existing features** continue using Supabase
3. **Migrate feature by feature** over time
4. **Eventual decommission** of Supabase

## MongoDB vs Supabase Key Differences

| Feature | Supabase | MongoDB |
|---------|----------|---------|
| **Authentication** | Built-in Auth | Custom JWT (implemented in `auth-service.ts`) |
| **Security** | Row Level Security (RLS) | App-level filtering by `user_id` |
| **Triggers** | Database triggers | Application logic (in `mongodb-storage.ts`) |
| **Schema** | Strict PostgreSQL schema | Flexible documents (validated in app) |
| **IDs** | UUID | ObjectId |

## Important MongoDB Concepts

### 1. ObjectId
MongoDB uses ObjectId instead of UUID:

```typescript
// Supabase
const userId = "123e4567-e89b-12d3-a456-426614174000"; // UUID

// MongoDB
const userId = new ObjectId("507f1f77bcf86cd799439011"); // ObjectId
```

### 2. User Isolation
Supabase automatically filters by user via RLS. In MongoDB, you must:

```typescript
// ALWAYS include user_id in queries
collection.find({ user_id: toObjectId(userId) })

// The middleware in auth-middleware.ts handles this
req.user.userId // Available in all protected routes
```

### 3. No Auto-Triggers
Supabase triggers are now in application code:

```typescript
// After creating expense transaction:
await generateSpendingInsight(userId, transaction); // Manual call
```

## Verification Checklist

After migration, verify:

- [ ] MongoDB connection works (`npm run dev`)
- [ ] All collections created (users, categories, budgets, transactions, insights)
- [ ] Indexes created successfully
- [ ] Data counts match Supabase (check MongoDB Atlas dashboard)
- [ ] No duplicate records

## MongoDB Atlas Dashboard

Access your data at:
```
https://cloud.mongodb.com
→ Select your cluster
→ Browse Collections
→ View your data
```

## Troubleshooting

### Connection Failed
```bash
# Check your connection string format
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority

# Common issues:
# - Username/password not URL-encoded (use %40 for @)
# - IP not whitelisted in MongoDB Atlas
# - Wrong cluster URL
```

### Migration Script Errors
```bash
# Make sure Supabase credentials are still in .env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# Check Supabase connection first
node -e "import('@supabase/supabase-js').then(({createClient})=>{const c=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);c.from('users').select('*').then(console.log)})"
```

### Missing Data
```bash
# Re-run migration (it will skip existing records due to unique indexes)
node scripts/migrate-supabase-to-mongodb.js

# Or drop MongoDB database and start fresh:
# In MongoDB Atlas: Browse Collections → Drop Database
```

## Security Notes

⚠️ **IMPORTANT**:
- All migrated users have password: `"ChangeMe123!"`
- Users must reset passwords on first login
- Change JWT secrets in production
- Never commit `.env` files with real credentials
- Enable MongoDB Atlas IP whitelist in production

## Cost Comparison

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| **Supabase** | 500MB database, 2GB bandwidth | Starts at $25/month |
| **MongoDB Atlas** | 512MB storage, shared cluster | Starts at $9/month |

## Support

- **MongoDB Docs**: https://docs.mongodb.com
- **MongoDB University**: https://university.mongodb.com (free courses)
- **Community Forums**: https://www.mongodb.com/community/forums

## Next Steps

1. Read **MONGODB_MIGRATION_GUIDE.md** for complete implementation details
2. Create MongoDB API routes (examples in guide)
3. Update frontend authentication to use JWT
4. Test all features thoroughly
5. Deploy to production

---

**Need Help?** Check the comprehensive guide: [MONGODB_MIGRATION_GUIDE.md](MONGODB_MIGRATION_GUIDE.md)
