const mongoose = require('mongoose');
require('dotenv').config({path: '../.env'});

async function testMongoConnection() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('URI:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Successfully connected to MongoDB!');
    
    // Test a simple query
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Collections found:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Check if MongoDB Atlas cluster is running');
      console.log('2. Verify your IP is whitelisted in MongoDB Atlas');
      console.log('3. Check network connectivity');
    }
  } finally {
    await mongoose.disconnect();
  }
}

testMongoConnection();
