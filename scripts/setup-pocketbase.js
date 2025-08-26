import PocketBase from 'pocketbase';
import fs from 'fs';
import path from 'path';

const pb = new PocketBase('http://127.0.0.1:8090');

async function setupPocketBase() {
  try {
    console.log('Setting up PocketBase...');
    
    // Create collections through API calls
    const collections = [
      // Users collection (auth collection)
      {
        name: 'users',
        type: 'auth',
        schema: [
          {
            name: 'name',
            type: 'text',
            required: false
          }
        ],
        options: {
          allowUsernameAuth: true,
          allowEmailAuth: true,
          requireEmail: false,
          minPasswordLength: 6
        }
      },
      
      // Categories collection
      {
        name: 'categories',
        type: 'base',
        schema: [
          {
            name: 'user',
            type: 'relation',
            required: true,
            options: {
              collectionId: 'users',
              cascadeDelete: true,
              maxSelect: 1
            }
          },
          {
            name: 'name',
            type: 'text',
            required: true
          },
          {
            name: 'type',
            type: 'select',
            required: true,
            options: {
              maxSelect: 1,
              values: ['income', 'expense']
            }
          },
          {
            name: 'color',
            type: 'text',
            required: true
          },
          {
            name: 'icon',
            type: 'text',
            required: true
          }
        ],
        listRule: 'user = @request.auth.id',
        viewRule: 'user = @request.auth.id',
        createRule: '@request.auth.id != "" && user = @request.auth.id',
        updateRule: 'user = @request.auth.id',
        deleteRule: 'user = @request.auth.id'
      },
      
      // Budgets collection
      {
        name: 'budgets',
        type: 'base',
        schema: [
          {
            name: 'user',
            type: 'relation',
            required: true,
            options: {
              collectionId: 'users',
              cascadeDelete: true,
              maxSelect: 1
            }
          },
          {
            name: 'category',
            type: 'text',
            required: true
          },
          {
            name: 'monthly_limit',
            type: 'number',
            required: true,
            options: {
              min: 0
            }
          },
          {
            name: 'current_spent',
            type: 'number',
            required: false,
            options: {
              min: 0
            }
          }
        ],
        listRule: 'user = @request.auth.id',
        viewRule: 'user = @request.auth.id',
        createRule: '@request.auth.id != "" && user = @request.auth.id',
        updateRule: 'user = @request.auth.id',
        deleteRule: 'user = @request.auth.id'
      },
      
      // Transactions collection
      {
        name: 'transactions',
        type: 'base',
        schema: [
          {
            name: 'user',
            type: 'relation',
            required: true,
            options: {
              collectionId: 'users',
              cascadeDelete: true,
              maxSelect: 1
            }
          },
          {
            name: 'amount',
            type: 'number',
            required: true,
            options: {
              min: 0
            }
          },
          {
            name: 'description',
            type: 'text',
            required: true
          },
          {
            name: 'category',
            type: 'text',
            required: true
          },
          {
            name: 'type',
            type: 'select',
            required: true,
            options: {
              maxSelect: 1,
              values: ['income', 'expense']
            }
          },
          {
            name: 'date',
            type: 'date',
            required: true
          }
        ],
        listRule: 'user = @request.auth.id',
        viewRule: 'user = @request.auth.id',
        createRule: '@request.auth.id != "" && user = @request.auth.id',
        updateRule: 'user = @request.auth.id',
        deleteRule: 'user = @request.auth.id'
      },
      
      // Insights collection
      {
        name: 'insights',
        type: 'base',
        schema: [
          {
            name: 'user',
            type: 'relation',
            required: true,
            options: {
              collectionId: 'users',
              cascadeDelete: true,
              maxSelect: 1
            }
          },
          {
            name: 'type',
            type: 'select',
            required: true,
            options: {
              maxSelect: 1,
              values: ['warning', 'success', 'info']
            }
          },
          {
            name: 'title',
            type: 'text',
            required: true
          },
          {
            name: 'message',
            type: 'text',
            required: true
          },
          {
            name: 'category',
            type: 'text',
            required: false
          },
          {
            name: 'is_read',
            type: 'bool',
            required: false
          }
        ],
        listRule: 'user = @request.auth.id',
        viewRule: 'user = @request.auth.id',
        createRule: '@request.auth.id != "" && user = @request.auth.id',
        updateRule: 'user = @request.auth.id',
        deleteRule: 'user = @request.auth.id'
      }
    ];

    // Create test users
    console.log('Creating test users...');
    try {
      const user1 = await pb.collection('users').create({
        username: 'fahdmaa',
        password: 'fahdmaa123',
        passwordConfirm: 'fahdmaa123',
        name: 'Fahd Maa'
      });
      console.log('Created user:', user1.username);
      
      const user2 = await pb.collection('users').create({
        username: 'farahfa', 
        password: 'farahfa123',
        passwordConfirm: 'farahfa123',
        name: 'Farah Fa'
      });
      console.log('Created user:', user2.username);

      // Create default categories for both users
      const defaultCategories = [
        { name: "Food & Dining", type: "expense", color: "#F97316", icon: "Utensils" },
        { name: "Transportation", type: "expense", color: "#3B82F6", icon: "Car" },
        { name: "Entertainment", type: "expense", color: "#A855F7", icon: "Gamepad2" },
        { name: "Shopping", type: "expense", color: "#F43F5E", icon: "ShoppingBag" },
        { name: "Bills & Utilities", type: "expense", color: "#10B981", icon: "Home" },
        { name: "Income", type: "income", color: "#0EA5E9", icon: "Wallet" },
      ];

      const defaultLimits = {
        "Food & Dining": 600.00,
        "Transportation": 400.00,
        "Entertainment": 300.00,
        "Shopping": 500.00,
        "Bills & Utilities": 800.00,
      };

      for (const user of [user1, user2]) {
        for (const category of defaultCategories) {
          await pb.collection('categories').create({
            user: user.id,
            name: category.name,
            type: category.type,
            color: category.color,
            icon: category.icon
          });

          if (category.type === 'expense') {
            await pb.collection('budgets').create({
              user: user.id,
              category: category.name,
              monthly_limit: defaultLimits[category.name] || 0,
              current_spent: 0
            });
          }
        }
      }

      console.log('Default categories and budgets created for both users');
      
    } catch (error) {
      console.log('Users already exist or error creating users:', error.message);
    }

    console.log('PocketBase setup complete!');
    console.log('Dashboard URL: http://127.0.0.1:8090/_/');
    console.log('API URL: http://127.0.0.1:8090/api/');
    
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

setupPocketBase();