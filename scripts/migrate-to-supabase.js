#!/usr/bin/env node

/**
 * Migration script to move data from PocketBase to Supabase
 * 
 * Usage:
 * 1. Set up your Supabase project and get the credentials
 * 2. Run the schema.sql file in your Supabase SQL editor
 * 3. Update the environment variables in this script
 * 4. Run: node scripts/migrate-to-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuration - Update these with your actual values
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project-id.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

// If you have exported data from PocketBase, update these paths
const POCKETBASE_DATA_DIR = './pocketbase-export'; // Directory containing exported JSON files

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function migrateUsers() {
  console.log('📱 Migrating users...');
  
  const usersPath = path.join(POCKETBASE_DATA_DIR, 'users.json');
  if (!fs.existsSync(usersPath)) {
    console.log('⚠️  No users.json found, skipping user migration');
    return;
  }

  const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  
  for (const user of usersData) {
    try {
      // Create user in Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email || `${user.username}@example.com`, // PocketBase might not have email
        password: 'ChangeMe123!', // Temporary password - users will need to reset
        user_metadata: {
          username: user.username
        },
        email_confirm: true
      });

      if (authError) {
        console.error(`❌ Failed to create auth user for ${user.username}:`, authError.message);
        continue;
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authUser.user.id,
          username: user.username
        });

      if (profileError) {
        console.error(`❌ Failed to create profile for ${user.username}:`, profileError.message);
      } else {
        console.log(`✅ Migrated user: ${user.username}`);
      }

    } catch (error) {
      console.error(`❌ Error migrating user ${user.username}:`, error.message);
    }
  }
}

async function migrateCategories() {
  console.log('📂 Migrating categories...');
  
  const categoriesPath = path.join(POCKETBASE_DATA_DIR, 'categories.json');
  if (!fs.existsSync(categoriesPath)) {
    console.log('⚠️  No categories.json found, creating default categories for existing users');
    
    // Get all users and create default categories for each
    const { data: users } = await supabase.from('user_profiles').select('id');
    
    for (const user of users || []) {
      await createDefaultCategories(user.id);
    }
    return;
  }

  const categoriesData = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
  
  // You'll need to map PocketBase user IDs to Supabase user IDs
  // This is a simplified example - you'll need to adapt based on your data structure
  
  for (const category of categoriesData) {
    try {
      const { error } = await supabase
        .from('categories')
        .insert({
          user_id: category.user_id, // You'll need to map this to Supabase user ID
          name: category.name,
          type: category.type,
          color: category.color,
          icon: category.icon
        });

      if (error) {
        console.error(`❌ Failed to migrate category ${category.name}:`, error.message);
      } else {
        console.log(`✅ Migrated category: ${category.name}`);
      }
    } catch (error) {
      console.error(`❌ Error migrating category ${category.name}:`, error.message);
    }
  }
}

async function createDefaultCategories(userId) {
  const defaultCategories = [
    { name: 'Food & Dining', type: 'expense', color: '#F97316', icon: 'Utensils' },
    { name: 'Transportation', type: 'expense', color: '#3B82F6', icon: 'Car' },
    { name: 'Entertainment', type: 'expense', color: '#A855F7', icon: 'Gamepad2' },
    { name: 'Shopping', type: 'expense', color: '#F43F5E', icon: 'ShoppingBag' },
    { name: 'Bills & Utilities', type: 'expense', color: '#10B981', icon: 'Home' },
    { name: 'Income', type: 'income', color: '#0EA5E9', icon: 'Wallet' }
  ];

  for (const category of defaultCategories) {
    const { error } = await supabase
      .from('categories')
      .insert({
        user_id: userId,
        ...category
      });

    if (error && !error.message.includes('duplicate key')) {
      console.error(`❌ Failed to create default category ${category.name} for user ${userId}:`, error.message);
    }
  }
}

async function migrateTransactions() {
  console.log('💳 Migrating transactions...');
  
  const transactionsPath = path.join(POCKETBASE_DATA_DIR, 'transactions.json');
  if (!fs.existsSync(transactionsPath)) {
    console.log('⚠️  No transactions.json found, skipping transaction migration');
    return;
  }

  const transactionsData = JSON.parse(fs.readFileSync(transactionsPath, 'utf8'));
  
  for (const transaction of transactionsData) {
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: transaction.user_id, // Map to Supabase user ID
          amount: transaction.amount,
          description: transaction.description,
          category: transaction.category,
          type: transaction.type,
          date: transaction.date
        });

      if (error) {
        console.error(`❌ Failed to migrate transaction ${transaction.id}:`, error.message);
      } else {
        console.log(`✅ Migrated transaction: ${transaction.description}`);
      }
    } catch (error) {
      console.error(`❌ Error migrating transaction ${transaction.id}:`, error.message);
    }
  }
}

async function migrateBudgets() {
  console.log('💰 Migrating budgets...');
  
  const budgetsPath = path.join(POCKETBASE_DATA_DIR, 'budgets.json');
  if (!fs.existsSync(budgetsPath)) {
    console.log('⚠️  No budgets.json found, creating default budgets');
    
    // Create default budgets for all users
    const { data: users } = await supabase.from('user_profiles').select('id');
    
    const defaultBudgets = {
      'Food & Dining': '600.00',
      'Transportation': '400.00',
      'Entertainment': '300.00',
      'Shopping': '500.00',
      'Bills & Utilities': '800.00'
    };

    for (const user of users || []) {
      for (const [category, limit] of Object.entries(defaultBudgets)) {
        const { error } = await supabase
          .from('budgets')
          .insert({
            user_id: user.id,
            category,
            monthly_limit: limit,
            current_spent: '0.00'
          });

        if (error && !error.message.includes('duplicate key')) {
          console.error(`❌ Failed to create default budget for ${category}:`, error.message);
        }
      }
    }
    return;
  }

  const budgetsData = JSON.parse(fs.readFileSync(budgetsPath, 'utf8'));
  
  for (const budget of budgetsData) {
    try {
      const { error } = await supabase
        .from('budgets')
        .insert({
          user_id: budget.user_id, // Map to Supabase user ID
          category: budget.category,
          monthly_limit: budget.monthly_limit,
          current_spent: budget.current_spent || '0.00'
        });

      if (error) {
        console.error(`❌ Failed to migrate budget ${budget.category}:`, error.message);
      } else {
        console.log(`✅ Migrated budget: ${budget.category}`);
      }
    } catch (error) {
      console.error(`❌ Error migrating budget ${budget.category}:`, error.message);
    }
  }
}

async function migrateInsights() {
  console.log('💡 Migrating insights...');
  
  const insightsPath = path.join(POCKETBASE_DATA_DIR, 'insights.json');
  if (!fs.existsSync(insightsPath)) {
    console.log('⚠️  No insights.json found, skipping insight migration');
    return;
  }

  const insightsData = JSON.parse(fs.readFileSync(insightsPath, 'utf8'));
  
  for (const insight of insightsData) {
    try {
      const { error } = await supabase
        .from('insights')
        .insert({
          user_id: insight.user_id, // Map to Supabase user ID
          type: insight.type,
          title: insight.title,
          message: insight.message,
          category: insight.category,
          is_read: insight.is_read === 'true'
        });

      if (error) {
        console.error(`❌ Failed to migrate insight ${insight.title}:`, error.message);
      } else {
        console.log(`✅ Migrated insight: ${insight.title}`);
      }
    } catch (error) {
      console.error(`❌ Error migrating insight ${insight.title}:`, error.message);
    }
  }
}

async function main() {
  console.log('🚀 Starting PocketBase to Supabase migration...\n');

  // Test connection
  try {
    const { data, error } = await supabase.from('user_profiles').select('count').single();
    if (error) throw error;
    console.log('✅ Supabase connection successful\n');
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error.message);
    console.error('Please check your Supabase credentials and make sure the schema has been applied.\n');
    process.exit(1);
  }

  try {
    // Run migrations in order
    await migrateUsers();
    await migrateCategories();
    await migrateTransactions();
    await migrateBudgets();
    await migrateInsights();

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Test your application with the new Supabase setup');
    console.log('2. Update your environment variables');
    console.log('3. Deploy your updated application');
    console.log('4. Inform users to reset their passwords (temporary passwords were set)');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Handle the case where this script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}