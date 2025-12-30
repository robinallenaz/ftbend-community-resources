const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

const { connectToDb } = require('./lib/db');
const User = require('./models/User');

dotenv.config();

async function seedAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL || '').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || '';

  if (!email || !password) {
    throw new Error('Missing SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD');
  }

  const existing = await User.findOne({ email });

  const passwordHash = await bcrypt.hash(password, 12);

  if (existing) {
    existing.passwordHash = passwordHash;
    existing.role = 'admin';
    await existing.save();
    return;
  }

  await User.create({ email, passwordHash, role: 'admin' });
}

async function run() {
  await connectToDb();
  await seedAdmin();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
