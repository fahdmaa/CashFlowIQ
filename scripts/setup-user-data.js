import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function setupUserData() {
  try {
    // Authenticate as admin
    await pb.admins.authWithPassword('admin@cashflowiq.com', 'admin123456');
    console.log('Admin authenticated');

    // Get all users
    const users = await pb.collection('users').getFullList();
    console.log(`Found ${users.length} users`);

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

    for (const user of users) {
      console.log(`Setting up data for user: ${user.username || user.email} (ID: ${user.id})`);
      
      // Clear existing data
      try {
        const existingCategories = await pb.collection('categories').getFullList({ filter: `user="${user.id}"` });
        for (const category of existingCategories) {
          await pb.collection('categories').delete(category.id);
        }
        
        const existingBudgets = await pb.collection('budgets').getFullList({ filter: `user="${user.id}"` });
        for (const budget of existingBudgets) {
          await pb.collection('budgets').delete(budget.id);
        }
      } catch (error) {
        console.log('No existing data to clear or error:', error.message);
      }

      // Create categories
      for (const category of defaultCategories) {
        try {
          await pb.collection('categories').create({
            user: user.id,
            name: category.name,
            type: category.type,
            color: category.color,
            icon: category.icon
          });
          console.log(`  ✅ Created category: ${category.name}`);

          // Create budget for expense categories
          if (category.type === 'expense') {
            await pb.collection('budgets').create({
              user: user.id,
              category: category.name,
              monthly_limit: defaultLimits[category.name] || 0,
              current_spent: 0
            });
            console.log(`  💰 Created budget: ${category.name} - $${defaultLimits[category.name]}`);
          }
        } catch (error) {
          console.error(`  ❌ Error creating category ${category.name}:`, error.message);
        }
      }
    }

    console.log('✅ User data setup complete!');
  } catch (error) {
    console.error('Error:', error);
  }
}

setupUserData();