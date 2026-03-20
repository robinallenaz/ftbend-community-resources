// Force reload environment and test
const dotenv = require('dotenv');
const path = require('path');

// Clear any existing env cache
delete process.env.MONGODB_URI;

// Load environment from root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('Environment loaded:');
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('Length:', process.env.MONGODB_URI?.length);

// Test connection
const mongoose = require('mongoose');

async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connection successful!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();
