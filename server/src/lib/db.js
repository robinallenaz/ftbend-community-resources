const mongoose = require('mongoose');

async function connectToDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    const err = new Error('Missing MONGODB_URI');
    err.status = 500;
    throw err;
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri);
}

module.exports = { connectToDb };
