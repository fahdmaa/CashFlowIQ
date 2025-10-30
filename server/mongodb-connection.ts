import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

/**
 * Connect to MongoDB
 * Creates a persistent connection that's reused across requests
 */
export async function connectToMongoDB(): Promise<Db> {
  if (db) {
    return db;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  const dbName = process.env.MONGODB_DATABASE || 'cashflowiq';

  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);

    console.log(`✅ Connected to MongoDB database: ${dbName}`);

    // Create indexes on first connection
    await createIndexes(db);

    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

/**
 * Get the current database instance
 * Throws error if not connected
 */
export function getDatabase(): Db {
  if (!db) {
    throw new Error('Database not initialized. Call connectToMongoDB() first.');
  }
  return db;
}

/**
 * Get a collection from the database
 */
export function getCollection<T = any>(collectionName: string): Collection<T> {
  const database = getDatabase();
  return database.collection<T>(collectionName);
}

/**
 * Close the MongoDB connection
 * Should be called when shutting down the server
 */
export async function closeConnection(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB connection closed');
  }
}

/**
 * Create all necessary indexes for optimal query performance
 */
async function createIndexes(database: Db): Promise<void> {
  try {
    // Users collection indexes
    await database.collection('users').createIndexes([
      { key: { email: 1 }, unique: true, name: 'email_unique' },
      { key: { username: 1 }, unique: true, name: 'username_unique' }
    ]);

    // Categories collection indexes
    await database.collection('categories').createIndexes([
      { key: { user_id: 1, name: 1 }, unique: true, name: 'user_category_unique' },
      { key: { user_id: 1, type: 1 }, name: 'user_type_idx' }
    ]);

    // Budgets collection indexes
    await database.collection('budgets').createIndexes([
      { key: { user_id: 1, category: 1 }, unique: true, name: 'user_budget_unique' },
      { key: { user_id: 1 }, name: 'user_idx' }
    ]);

    // Transactions collection indexes
    await database.collection('transactions').createIndexes([
      { key: { user_id: 1, date: -1 }, name: 'user_date_idx' },
      { key: { user_id: 1, category: 1 }, name: 'user_category_idx' },
      { key: { user_id: 1, type: 1 }, name: 'user_type_idx' },
      { key: { date: 1, type: 1 }, name: 'date_type_idx' }
    ]);

    // Insights collection indexes
    await database.collection('insights').createIndexes([
      { key: { user_id: 1, is_read: 1 }, name: 'user_read_idx' },
      { key: { user_id: 1, created_at: -1 }, name: 'user_created_idx' }
    ]);

    console.log('✅ MongoDB indexes created successfully');
  } catch (error) {
    console.warn('⚠️  Warning: Could not create some indexes:', error);
    // Don't throw - indexes might already exist
  }
}

/**
 * Helper function to convert string ID to ObjectId
 */
export function toObjectId(id: string): ObjectId {
  try {
    return new ObjectId(id);
  } catch (error) {
    throw new Error(`Invalid ObjectId format: ${id}`);
  }
}

/**
 * Helper function to safely convert ObjectId to string
 */
export function toString(id: ObjectId | string): string {
  return id.toString();
}

/**
 * Ping MongoDB to check connection health
 */
export async function pingDatabase(): Promise<boolean> {
  try {
    const database = getDatabase();
    await database.command({ ping: 1 });
    return true;
  } catch (error) {
    console.error('MongoDB ping failed:', error);
    return false;
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeConnection();
  process.exit(0);
});
