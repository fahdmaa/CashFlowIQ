import PocketBase from 'pocketbase';
import 'dotenv/config';

const pb = new PocketBase(process.env.VITE_POCKETBASE_URL);

async function setupProduction() {
  try {
    console.log('🚀 Setting up production PocketBase instance...');
    console.log(`📍 PocketBase URL: ${process.env.VITE_POCKETBASE_URL}`);

    // Authenticate as admin
    const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
    const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;
    
    if (!adminEmail || !adminPassword) {
      throw new Error('Missing admin credentials. Set POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD environment variables.');
    }

    await pb.admins.authWithPassword(adminEmail, adminPassword);
    console.log('✅ Admin authenticated successfully');

    // Check if collections exist
    const collections = await pb.collections.getFullList();
    const requiredCollections = ['users', 'categories', 'budgets', 'transactions', 'insights'];
    const existingCollections = collections.map(c => c.name);

    console.log('📊 Existing collections:', existingCollections);

    const missingCollections = requiredCollections.filter(name => !existingCollections.includes(name));
    
    if (missingCollections.length > 0) {
      console.log('❌ Missing collections:', missingCollections);
      console.log('⚠️  Please create the missing collections manually in the PocketBase admin interface.');
      console.log('📚 Refer to DEPLOYMENT.md for detailed collection schema.');
      return;
    }

    console.log('✅ All required collections exist');

    // Create test users if they don't exist
    const testUsers = [
      { username: 'fahdmaa', email: 'fahdmaa@test.com', password: 'fahdmaa123', name: 'Fahd Maa' },
      { username: 'farahfa', email: 'farahfa@test.com', password: 'farahfa123', name: 'Farah Fa' }
    ];

    for (const userData of testUsers) {
      try {
        // Check if user exists
        await pb.collection('users').getFirstListItem(`username="${userData.username}"`);
        console.log(`👤 User ${userData.username} already exists`);
      } catch (error) {
        // User doesn't exist, create it
        try {
          const user = await pb.collection('users').create({
            username: userData.username,
            email: userData.email,
            password: userData.password,
            passwordConfirm: userData.password,
            name: userData.name
          });
          console.log(`✅ Created user: ${user.username}`);

          // Create default categories and budgets for the user
          await createDefaultData(user.id);
          console.log(`📂 Created default data for ${user.username}`);
        } catch (createError) {
          console.error(`❌ Failed to create user ${userData.username}:`, createError.message);
        }
      }
    }

    console.log('🎉 Production setup complete!');
    console.log(`🌐 Your app should now be accessible with PocketBase at: ${process.env.VITE_POCKETBASE_URL}`);

  } catch (error) {
    console.error('💥 Setup failed:', error.message);
    process.exit(1);
  }
}

async function createDefaultData(userId) {
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
      user: userId,
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon
    });

    if (category.type === 'expense') {
      await pb.collection('budgets').create({
        user: userId,
        category: category.name,
        monthly_limit: defaultLimits[category.name] || 0,
        current_spent: 0
      });
    }
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupProduction();
}