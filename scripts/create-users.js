import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function createUsers() {
  try {
    // Authenticate as admin first
    await pb.admins.authWithPassword('admin@cashflowiq.com', 'admin123456');
    console.log('Admin authenticated');

    // Clear existing users first
    try {
      const existingUsers = await pb.collection('users').getFullList();
      for (const user of existingUsers) {
        await pb.collection('users').delete(user.id);
        console.log(`Deleted existing user: ${user.username}`);
      }
    } catch (error) {
      console.log('No existing users to delete or error:', error.message);
    }

    const testUsers = [
      { username: 'fahdmaa', email: 'fahdmaa@test.com', password: 'fahdmaa123', name: 'Fahd Maa' },
      { username: 'farahfa', email: 'farahfa@test.com', password: 'farahfa123', name: 'Farah Fa' }
    ];

    for (const userData of testUsers) {
      try {
        const user = await pb.collection('users').create({
          username: userData.username,
          email: userData.email,
          password: userData.password,
          passwordConfirm: userData.password,
          name: userData.name
        });
        console.log(`✅ Created user: ${user.username} (ID: ${user.id})`);
      } catch (error) {
        console.error(`❌ Failed to create user ${userData.username}:`, error);
      }
    }

    console.log('User creation complete!');
  } catch (error) {
    console.error('Error:', error);
  }
}

createUsers();