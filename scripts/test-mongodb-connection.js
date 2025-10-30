/**
 * Quick test script to verify MongoDB connection
 * Usage: node scripts/test-mongodb-connection.js
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DATABASE || 'cashflowiq';

console.log('🔍 Testing MongoDB connection...');
console.log('Database:', dbName);

async function testConnection() {
  let client;

  try {
    console.log('\n📡 Connecting to MongoDB Atlas...');
    client = new MongoClient(uri);
    await client.connect();

    console.log('✅ Connected successfully!');

    const db = client.db(dbName);

    // Ping the database
    await db.command({ ping: 1 });
    console.log('✅ Ping successful!');

    // List collections
    const collections = await db.listCollections().toArray();
    console.log('\n📂 Existing collections:', collections.length);
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });

    // Get database stats
    const stats = await db.stats();
    console.log('\n📊 Database statistics:');
    console.log(`  Collections: ${stats.collections}`);
    console.log(`  Data size: ${(stats.dataSize / 1024).toFixed(2)} KB`);
    console.log(`  Storage size: ${(stats.storageSize / 1024).toFixed(2)} KB`);

    console.log('\n🎉 MongoDB connection test passed!');
    console.log('✅ You\'re ready to run the migration script.');

  } catch (error) {
    console.error('\n❌ Connection test failed!');
    console.error('Error:', error.message);

    if (error.message.includes('authentication failed')) {
      console.error('\n💡 Tip: Check your username and password in .env file');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('\n💡 Tip: Check your MongoDB URI in .env file');
    } else if (error.message.includes('IP')) {
      console.error('\n💡 Tip: Whitelist your IP address in MongoDB Atlas');
    }

    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Connection closed');
    }
  }
}

testConnection();
