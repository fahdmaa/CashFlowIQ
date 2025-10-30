/**
 * Migration Script: Supabase to MongoDB
 *
 * This script migrates all data from Supabase (PostgreSQL) to MongoDB
 *
 * Usage:
 *   node scripts/migrate-supabase-to-mongodb.js
 *
 * Prerequisites:
 *   1. Set MONGODB_URI in .env file
 *   2. Supabase credentials must be in .env file
 *   3. Install dependencies: npm install
 */

import { createClient } from '@supabase/supabase-js';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

// MongoDB configuration
const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_DATABASE || 'cashflowiq';

if (!mongoUri) {
  console.error('❌ Error: MONGODB_URI must be set in .env');
  process.exit(1);
}

// Initialize clients
const supabase = createClient(supabaseUrl, supabaseKey);
let mongoClient;
let mongodb;

// Statistics
const stats = {
  users: { total: 0, migrated: 0, failed: 0 },
  categories: { total: 0, migrated: 0, failed: 0 },
  budgets: { total: 0, migrated: 0, failed: 0 },
  transactions: { total: 0, migrated: 0, failed: 0 },
  insights: { total: 0, migrated: 0, failed: 0 }
};

/**
 * Connect to MongoDB
 */
async function connectMongoDB() {
  console.log('📡 Connecting to MongoDB...');
  mongoClient = new MongoClient(mongoUri);
  await mongoClient.connect();
  mongodb = mongoClient.db(mongoDbName);
  console.log(`✅ Connected to MongoDB database: ${mongoDbName}`);
}

/**
 * Close MongoDB connection
 */
async function closeMongoDB() {
  if (mongoClient) {
    await mongoClient.close();
    console.log('✅ MongoDB connection closed');
  }
}

/**
 * Create MongoDB indexes
 */
async function createIndexes() {
  console.log('\n📋 Creating MongoDB indexes...');

  try {
    // Users indexes
    await mongodb.collection('users').createIndex({ email: 1 }, { unique: true });
    await mongodb.collection('users').createIndex({ username: 1 }, { unique: true });

    // Categories indexes
    await mongodb.collection('categories').createIndex({ user_id: 1, name: 1 }, { unique: true });
    await mongodb.collection('categories').createIndex({ user_id: 1, type: 1 });

    // Budgets indexes
    await mongodb.collection('budgets').createIndex({ user_id: 1, category: 1 }, { unique: true });

    // Transactions indexes
    await mongodb.collection('transactions').createIndex({ user_id: 1, date: -1 });
    await mongodb.collection('transactions').createIndex({ user_id: 1, category: 1 });

    // Insights indexes
    await mongodb.collection('insights').createIndex({ user_id: 1, is_read: 1 });

    console.log('✅ Indexes created successfully');
  } catch (error) {
    console.warn('⚠️  Warning: Some indexes may already exist:', error.message);
  }
}

/**
 * Migrate users from Supabase Auth to MongoDB
 */
async function migrateUsers() {
  console.log('\n👥 Migrating users...');

  try {
    // Get users from Supabase Auth (requires service role key)
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Error fetching Supabase auth users:', authError);
      return;
    }

    // Get user profiles from Supabase
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*');

    if (profilesError) {
      console.error('❌ Error fetching user profiles:', profilesError);
      return;
    }

    stats.users.total = authUsers.users.length;
    console.log(`Found ${stats.users.total} users to migrate`);

    // Create user map
    const profileMap = new Map();
    profiles.forEach(profile => {
      profileMap.set(profile.id, profile);
    });

    // Map to store Supabase UUID -> MongoDB ObjectId
    const userIdMap = new Map();

    for (const authUser of authUsers.users) {
      try {
        const profile = profileMap.get(authUser.id);
        const username = profile?.username || authUser.email?.split('@')[0] || 'user';

        // Generate a default password hash (users will need to reset password)
        const defaultPasswordHash = await bcrypt.hash('ChangeMe123!', 10);

        const mongoUser = {
          _id: new ObjectId(), // Generate new ObjectId
          email: authUser.email,
          username: username,
          password_hash: defaultPasswordHash,
          profile_picture_url: profile?.profile_picture_url || null,
          created_at: new Date(authUser.created_at),
          updated_at: new Date(authUser.updated_at || authUser.created_at)
        };

        // Store mapping of Supabase UUID to MongoDB ObjectId
        userIdMap.set(authUser.id, mongoUser._id);

        await mongodb.collection('users').insertOne(mongoUser);
        stats.users.migrated++;
        console.log(`  ✓ Migrated user: ${authUser.email}`);
      } catch (error) {
        stats.users.failed++;
        console.error(`  ✗ Failed to migrate user ${authUser.email}:`, error.message);
      }
    }

    console.log(`\n✅ Users migration complete: ${stats.users.migrated}/${stats.users.total} successful`);
    return userIdMap;
  } catch (error) {
    console.error('❌ Fatal error migrating users:', error);
    return new Map();
  }
}

/**
 * Migrate categories
 */
async function migrateCategories(userIdMap) {
  console.log('\n📁 Migrating categories...');

  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*');

    if (error) {
      console.error('❌ Error fetching categories:', error);
      return;
    }

    stats.categories.total = categories.length;
    console.log(`Found ${stats.categories.total} categories to migrate`);

    for (const category of categories) {
      try {
        const mongoUserId = userIdMap.get(category.user_id);
        if (!mongoUserId) {
          throw new Error(`User mapping not found for user_id: ${category.user_id}`);
        }

        const mongoCategory = {
          _id: new ObjectId(),
          user_id: mongoUserId,
          name: category.name,
          type: category.type,
          color: category.color,
          icon: category.icon,
          created_at: new Date(category.created_at),
          updated_at: new Date(category.updated_at)
        };

        await mongodb.collection('categories').insertOne(mongoCategory);
        stats.categories.migrated++;
      } catch (error) {
        stats.categories.failed++;
        console.error(`  ✗ Failed to migrate category ${category.name}:`, error.message);
      }
    }

    console.log(`✅ Categories migration complete: ${stats.categories.migrated}/${stats.categories.total} successful`);
  } catch (error) {
    console.error('❌ Fatal error migrating categories:', error);
  }
}

/**
 * Migrate budgets
 */
async function migrateBudgets(userIdMap) {
  console.log('\n💰 Migrating budgets...');

  try {
    const { data: budgets, error } = await supabase
      .from('budgets')
      .select('*');

    if (error) {
      console.error('❌ Error fetching budgets:', error);
      return;
    }

    stats.budgets.total = budgets.length;
    console.log(`Found ${stats.budgets.total} budgets to migrate`);

    for (const budget of budgets) {
      try {
        const mongoUserId = userIdMap.get(budget.user_id);
        if (!mongoUserId) {
          throw new Error(`User mapping not found for user_id: ${budget.user_id}`);
        }

        const mongoBudget = {
          _id: new ObjectId(),
          user_id: mongoUserId,
          category: budget.category,
          monthly_limit: parseFloat(budget.monthly_limit),
          current_spent: parseFloat(budget.current_spent || 0),
          created_at: new Date(budget.created_at),
          updated_at: new Date(budget.updated_at)
        };

        await mongodb.collection('budgets').insertOne(mongoBudget);
        stats.budgets.migrated++;
      } catch (error) {
        stats.budgets.failed++;
        console.error(`  ✗ Failed to migrate budget ${budget.category}:`, error.message);
      }
    }

    console.log(`✅ Budgets migration complete: ${stats.budgets.migrated}/${stats.budgets.total} successful`);
  } catch (error) {
    console.error('❌ Fatal error migrating budgets:', error);
  }
}

/**
 * Migrate transactions
 */
async function migrateTransactions(userIdMap) {
  console.log('\n💸 Migrating transactions...');

  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*');

    if (error) {
      console.error('❌ Error fetching transactions:', error);
      return;
    }

    stats.transactions.total = transactions.length;
    console.log(`Found ${stats.transactions.total} transactions to migrate`);

    for (const transaction of transactions) {
      try {
        const mongoUserId = userIdMap.get(transaction.user_id);
        if (!mongoUserId) {
          throw new Error(`User mapping not found for user_id: ${transaction.user_id}`);
        }

        const mongoTransaction = {
          _id: new ObjectId(),
          user_id: mongoUserId,
          amount: parseFloat(transaction.amount),
          description: transaction.description,
          category: transaction.category,
          type: transaction.type,
          date: new Date(transaction.date),
          created_at: new Date(transaction.created_at),
          updated_at: new Date(transaction.updated_at)
        };

        await mongodb.collection('transactions').insertOne(mongoTransaction);
        stats.transactions.migrated++;
      } catch (error) {
        stats.transactions.failed++;
        console.error(`  ✗ Failed to migrate transaction:`, error.message);
      }
    }

    console.log(`✅ Transactions migration complete: ${stats.transactions.migrated}/${stats.transactions.total} successful`);
  } catch (error) {
    console.error('❌ Fatal error migrating transactions:', error);
  }
}

/**
 * Migrate insights
 */
async function migrateInsights(userIdMap) {
  console.log('\n💡 Migrating insights...');

  try {
    const { data: insights, error } = await supabase
      .from('insights')
      .select('*');

    if (error) {
      console.error('❌ Error fetching insights:', error);
      return;
    }

    stats.insights.total = insights.length;
    console.log(`Found ${stats.insights.total} insights to migrate`);

    for (const insight of insights) {
      try {
        const mongoUserId = userIdMap.get(insight.user_id);
        if (!mongoUserId) {
          throw new Error(`User mapping not found for user_id: ${insight.user_id}`);
        }

        const mongoInsight = {
          _id: new ObjectId(),
          user_id: mongoUserId,
          type: insight.type,
          title: insight.title,
          message: insight.message,
          category: insight.category || null,
          is_read: insight.is_read || false,
          created_at: new Date(insight.created_at),
          updated_at: new Date(insight.updated_at)
        };

        await mongodb.collection('insights').insertOne(mongoInsight);
        stats.insights.migrated++;
      } catch (error) {
        stats.insights.failed++;
        console.error(`  ✗ Failed to migrate insight:`, error.message);
      }
    }

    console.log(`✅ Insights migration complete: ${stats.insights.migrated}/${stats.insights.total} successful`);
  } catch (error) {
    console.error('❌ Fatal error migrating insights:', error);
  }
}

/**
 * Print migration summary
 */
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));

  const collections = ['users', 'categories', 'budgets', 'transactions', 'insights'];
  let totalMigrated = 0;
  let totalFailed = 0;

  collections.forEach(collection => {
    const stat = stats[collection];
    console.log(`\n${collection.toUpperCase()}:`);
    console.log(`  Total:    ${stat.total}`);
    console.log(`  Migrated: ${stat.migrated} ✓`);
    console.log(`  Failed:   ${stat.failed} ✗`);

    totalMigrated += stat.migrated;
    totalFailed += stat.failed;
  });

  console.log('\n' + '='.repeat(60));
  console.log(`TOTAL: ${totalMigrated} records migrated, ${totalFailed} failed`);
  console.log('='.repeat(60));

  if (totalFailed === 0) {
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n⚠️  IMPORTANT: All users have been assigned the default password "ChangeMe123!"');
    console.log('    Users will need to reset their passwords on first login.');
  } else {
    console.log('\n⚠️  Migration completed with errors. Please review the logs above.');
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('🚀 Starting Supabase to MongoDB migration...');
  console.log('='.repeat(60));

  try {
    // Connect to MongoDB
    await connectMongoDB();

    // Create indexes
    await createIndexes();

    // Migrate in order (respecting dependencies)
    const userIdMap = await migrateUsers();
    await migrateCategories(userIdMap);
    await migrateBudgets(userIdMap);
    await migrateTransactions(userIdMap);
    await migrateInsights(userIdMap);

    // Print summary
    printSummary();
  } catch (error) {
    console.error('\n❌ Fatal migration error:', error);
    process.exit(1);
  } finally {
    // Close connections
    await closeMongoDB();
  }
}

// Run migration
migrate().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
