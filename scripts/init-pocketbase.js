import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function initializePocketBase() {
  try {
    console.log('Authenticating as admin...');
    await pb.admins.authWithPassword('admin@cashflowiq.com', 'admin123456');
    console.log('Admin authenticated successfully');

    // Create collections programmatically
    console.log('Creating collections...');

    // Users collection (auth type)
    try {
      await pb.collections.create({
        name: 'users',
        type: 'auth',
        schema: [
          {
            name: 'name',
            type: 'text',
            required: false,
            options: {}
          }
        ],
        listRule: 'id = @request.auth.id',
        viewRule: 'id = @request.auth.id',
        createRule: '',
        updateRule: 'id = @request.auth.id',
        deleteRule: 'id = @request.auth.id',
        options: {
          allowUsernameAuth: true,
          allowEmailAuth: true,
          requireEmail: false,
          minPasswordLength: 6
        }
      });
      console.log('Users collection created');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('Users collection already exists');
      } else {
        console.error('Error creating users collection:', error.message);
      }
    }

    // Categories collection
    try {
      await pb.collections.create({
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
            required: true,
            options: {}
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
            required: true,
            options: {}
          },
          {
            name: 'icon',
            type: 'text',
            required: true,
            options: {}
          }
        ],
        listRule: 'user = @request.auth.id',
        viewRule: 'user = @request.auth.id',
        createRule: '@request.auth.id != "" && user = @request.auth.id',
        updateRule: 'user = @request.auth.id',
        deleteRule: 'user = @request.auth.id'
      });
      console.log('Categories collection created');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('Categories collection already exists');
      } else {
        console.error('Error creating categories collection:', error.message);
      }
    }

    // Budgets collection
    try {
      await pb.collections.create({
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
            required: true,
            options: {}
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
      });
      console.log('Budgets collection created');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('Budgets collection already exists');
      } else {
        console.error('Error creating budgets collection:', error.message);
      }
    }

    // Transactions collection
    try {
      await pb.collections.create({
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
            required: true,
            options: {}
          },
          {
            name: 'category',
            type: 'text',
            required: true,
            options: {}
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
            required: true,
            options: {}
          }
        ],
        listRule: 'user = @request.auth.id',
        viewRule: 'user = @request.auth.id',
        createRule: '@request.auth.id != "" && user = @request.auth.id',
        updateRule: 'user = @request.auth.id',
        deleteRule: 'user = @request.auth.id'
      });
      console.log('Transactions collection created');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('Transactions collection already exists');
      } else {
        console.error('Error creating transactions collection:', error.message);
      }
    }

    // Insights collection
    try {
      await pb.collections.create({
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
            required: true,
            options: {}
          },
          {
            name: 'message',
            type: 'text',
            required: true,
            options: {}
          },
          {
            name: 'category',
            type: 'text',
            required: false,
            options: {}
          },
          {
            name: 'is_read',
            type: 'bool',
            required: false,
            options: {}
          }
        ],
        listRule: 'user = @request.auth.id',
        viewRule: 'user = @request.auth.id',
        createRule: '@request.auth.id != "" && user = @request.auth.id',
        updateRule: 'user = @request.auth.id',
        deleteRule: 'user = @request.auth.id'
      });
      console.log('Insights collection created');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('Insights collection already exists');
      } else {
        console.error('Error creating insights collection:', error.message);
      }
    }

    // Create test users
    console.log('Creating test users...');
    
    const testUsers = [
      { username: 'fahdmaa', password: 'fahdmaa123', name: 'Fahd Maa' },
      { username: 'farahfa', password: 'farahfa123', name: 'Farah Fa' }
    ];

    for (const userData of testUsers) {
      try {
        const user = await pb.collection('users').create({
          username: userData.username,
          password: userData.password,
          passwordConfirm: userData.password,
          name: userData.name
        });
        console.log(`Created user: ${user.username}`);

        // Create default categories for this user
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

        console.log(`Default categories and budgets created for ${user.username}`);

      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('username_key')) {
          console.log(`User ${userData.username} already exists`);
        } else {
          console.error(`Error creating user ${userData.username}:`, error.message);
        }
      }
    }

    console.log('PocketBase initialization complete!');

  } catch (error) {
    console.error('Initialization failed:', error);
  }
}

initializePocketBase();