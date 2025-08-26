import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function checkCollections() {
  try {
    await pb.admins.authWithPassword('admin@cashflowiq.com', 'admin123456');
    console.log('Admin authenticated');

    const collections = await pb.collections.getFullList();
    console.log('Existing collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.name} (${collection.type}) - ID: ${collection.id}`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

checkCollections();