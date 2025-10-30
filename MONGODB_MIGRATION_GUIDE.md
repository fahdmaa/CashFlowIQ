# CashFlowIQ - Supabase to MongoDB Migration Guide

## Overview

This guide provides comprehensive instructions for migrating CashFlowIQ from Supabase (PostgreSQL) to MongoDB, including schema design, data migration, and code updates.

## Key Architectural Changes

### From Supabase to MongoDB

| Aspect | Supabase (PostgreSQL) | MongoDB |
|--------|----------------------|---------|
| **Database Type** | Relational (SQL) | Document-based (NoSQL) |
| **Authentication** | Supabase Auth (JWT) | Custom JWT or MongoDB Atlas App Services |
| **Security** | Row Level Security (RLS) | Application-level or MongoDB RBAC |
| **Schema** | Strict schema with foreign keys | Flexible schema with embedded documents |
| **Queries** | SQL with joins | MongoDB queries with aggregations |
| **Triggers** | PostgreSQL triggers | MongoDB Change Streams or app logic |

## MongoDB Schema Design

### Collections Overview

1. **users** - User accounts and profiles
2. **categories** - Income/expense categories
3. **budgets** - Monthly spending limits
4. **transactions** - Financial transactions
5. **insights** - AI-generated financial insights

### Detailed Schema Definitions

#### 1. Users Collection

```javascript
{
  _id: ObjectId,
  email: String (required, unique),
  username: String (required, unique),
  password_hash: String (required),
  profile_picture_url: String (optional),
  created_at: Date (default: now),
  updated_at: Date (default: now)
}
```

**Indexes:**
- `email: 1` (unique)
- `username: 1` (unique)

#### 2. Categories Collection

```javascript
{
  _id: ObjectId,
  user_id: ObjectId (ref: users, required),
  name: String (required),
  type: String (enum: ['income', 'expense'], required),
  color: String (required, hex color),
  icon: String (required, icon name),
  created_at: Date (default: now),
  updated_at: Date (default: now)
}
```

**Indexes:**
- `user_id: 1, name: 1` (unique compound index)
- `user_id: 1, type: 1`

#### 3. Budgets Collection

```javascript
{
  _id: ObjectId,
  user_id: ObjectId (ref: users, required),
  category: String (required),
  monthly_limit: Number (required, min: 0),
  current_spent: Number (default: 0, min: 0),
  created_at: Date (default: now),
  updated_at: Date (default: now)
}
```

**Indexes:**
- `user_id: 1, category: 1` (unique compound index)
- `user_id: 1`

#### 4. Transactions Collection

```javascript
{
  _id: ObjectId,
  user_id: ObjectId (ref: users, required),
  amount: Number (required, min: 0),
  description: String (required),
  category: String (required),
  type: String (enum: ['income', 'expense', 'savings'], required),
  date: Date (required),
  created_at: Date (default: now),
  updated_at: Date (default: now)
}
```

**Indexes:**
- `user_id: 1, date: -1`
- `user_id: 1, category: 1`
- `user_id: 1, type: 1`
- `date: 1, type: 1`

#### 5. Insights Collection

```javascript
{
  _id: ObjectId,
  user_id: ObjectId (ref: users, required),
  type: String (enum: ['warning', 'success', 'info'], required),
  title: String (required),
  message: String (required),
  category: String (optional),
  is_read: Boolean (default: false),
  created_at: Date (default: now),
  updated_at: Date (default: now)
}
```

**Indexes:**
- `user_id: 1, is_read: 1`
- `user_id: 1, created_at: -1`

## Migration Strategy

### Phase 1: Setup MongoDB

1. **Create MongoDB Atlas Account** (or use local MongoDB)
   - Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Create a new cluster (free tier available)
   - Create database user with read/write permissions
   - Whitelist IP addresses for access

2. **Get Connection String**
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
   ```

3. **Install MongoDB Driver**
   ```bash
   npm install mongodb mongoose bcryptjs jsonwebtoken
   ```

### Phase 2: Data Migration

Run the migration script to transfer data from Supabase to MongoDB:

```bash
node scripts/migrate-supabase-to-mongodb.js
```

The script will:
1. Connect to both Supabase and MongoDB
2. Fetch all data from Supabase
3. Transform data to MongoDB format
4. Insert data into MongoDB collections
5. Verify data integrity

### Phase 3: Code Updates

Update the following files:

#### Backend Changes

1. **server/mongodb-storage.ts** - New MongoDB data access layer
2. **server/mongodb-routes.ts** - API routes using MongoDB
3. **server/auth-middleware.ts** - JWT authentication middleware
4. **server/index.ts** - Update to use MongoDB routes

#### Frontend Changes

1. **client/src/lib/mongodb-client.ts** - MongoDB API client
2. **client/src/lib/auth.ts** - Update authentication to use custom JWT
3. Update all query functions to use new MongoDB API endpoints

### Phase 4: Authentication Migration

MongoDB doesn't have built-in auth like Supabase, so we'll implement JWT-based authentication:

1. **User Registration**: Hash passwords with bcrypt, store in users collection
2. **User Login**: Verify password, generate JWT token
3. **Token Verification**: Middleware validates JWT on protected routes
4. **Token Refresh**: Implement refresh token mechanism

## Environment Variables

Update your `.env` file:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
MONGODB_DATABASE=cashflowiq

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=7d

# Application
NODE_ENV=development
PORT=3000

# Frontend
VITE_API_URL=http://localhost:3000/api
```

## Key Differences & Considerations

### 1. No Built-in RLS

**Supabase:** Row Level Security automatically enforced
**MongoDB:** Application-level security - must check `user_id` in all queries

**Solution:** Create middleware to inject user_id filter on all queries

### 2. No Database Triggers

**Supabase:** Automatic budget updates via triggers
**MongoDB:** Must update budgets in application code

**Solution:** Implement budget update logic in transaction create/update/delete endpoints

### 3. No Auto-Generated Insights

**Supabase:** Triggers generate insights automatically
**MongoDB:** Must generate insights in application code

**Solution:** Add insight generation logic after transaction creation

### 4. Schema Flexibility

**Supabase:** Strict schema enforced by database
**MongoDB:** Flexible schema - use Mongoose schemas for validation

**Solution:** Define Mongoose schemas to maintain data integrity

### 5. Date Handling

**Supabase:** Timestamps with timezone
**MongoDB:** ISO Date objects

**Solution:** Use JavaScript Date objects, convert to ISO strings for storage

## Implementation Files

### 1. MongoDB Connection (`server/mongodb-connection.ts`)

```typescript
import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToMongoDB(): Promise<Db> {
  if (db) return db;

  const uri = process.env.MONGODB_URI!;
  const dbName = process.env.MONGODB_DATABASE || 'cashflowiq';

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);

  console.log('Connected to MongoDB');
  return db;
}

export function getDatabase(): Db {
  if (!db) throw new Error('Database not initialized');
  return db;
}

export async function closeConnection(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
```

### 2. Authentication Service (`server/auth-service.ts`)

Handles user registration, login, token generation, and verification.

### 3. MongoDB Storage Layer (`server/mongodb-storage.ts`)

Data access layer with functions for all CRUD operations.

### 4. Migration Script (`scripts/migrate-supabase-to-mongodb.js`)

Automated script to transfer all data from Supabase to MongoDB.

## Testing Checklist

After migration, verify:

### Authentication
- [ ] User registration works
- [ ] User login works
- [ ] Token refresh works
- [ ] Protected routes require authentication
- [ ] Users can only access their own data

### Data Operations
- [ ] Create/read/update/delete transactions
- [ ] Create/read/update/delete categories
- [ ] Create/read/update/delete budgets
- [ ] Budget spending auto-calculates correctly
- [ ] Insights generation works

### Salary Cycle Filtering
- [ ] Transactions filter by salary cycle
- [ ] Budgets calculate spending for correct cycle
- [ ] Analytics show correct date ranges

### Performance
- [ ] API response times under 200ms
- [ ] Database queries use proper indexes
- [ ] No N+1 query problems

## Rollback Plan

If migration fails:

1. **Keep Supabase intact** - Don't delete Supabase data until MongoDB is stable
2. **Switch environment variables** - Change API URLs back to Supabase
3. **Revert code changes** - Use git to restore previous commit
4. **Clear MongoDB data** - Drop collections and start fresh

## Post-Migration Tasks

### Immediate (Day 1)
1. Monitor application logs for errors
2. Verify all features work correctly
3. Check data integrity
4. Test user authentication flows

### Short-term (Week 1)
1. Optimize MongoDB indexes based on query patterns
2. Set up MongoDB Atlas monitoring
3. Configure automated backups
4. Update API documentation

### Long-term (Month 1)
1. Implement MongoDB Change Streams for real-time features
2. Add MongoDB aggregation pipelines for complex analytics
3. Set up database replication for high availability
4. Implement caching layer (Redis) if needed

## Benefits of MongoDB Migration

### Scalability
- Horizontal scaling with sharding
- Better handling of unstructured data
- Flexible schema for future features

### Performance
- Fast queries with proper indexing
- Embedded documents reduce joins
- Aggregation pipeline for complex queries

### Developer Experience
- JavaScript-native with JSON documents
- Easier to work with nested data
- Rich query language

### Cost
- MongoDB Atlas free tier available
- Pay-as-you-grow pricing
- No connection limits on free tier

## Support Resources

- **MongoDB Documentation**: [docs.mongodb.com](https://docs.mongodb.com)
- **MongoDB University**: Free courses at [university.mongodb.com](https://university.mongodb.com)
- **MongoDB Community Forums**: [mongodb.com/community/forums](https://www.mongodb.com/community/forums)

---

**Note:** This migration is a significant architectural change. Test thoroughly in a development environment before deploying to production.
