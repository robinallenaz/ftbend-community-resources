const mongoose = require('mongoose');
const Taxonomy = require('../models/Taxonomy');
const User = require('../models/User');
require('dotenv').config();

async function seedTaxonomy() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find admin user
    const adminUser = await User.findOne({ email: process.env.SEED_ADMIN_EMAIL });
    if (!adminUser) {
      console.error('Admin user not found. Please run the regular seed script first.');
      process.exit(1);
    }

    // Clear existing taxonomy
    await Taxonomy.deleteMany({});
    console.log('Cleared existing taxonomy');

    // Seed locations
    const locations = [
      { value: 'Fort Bend', label: 'Fort Bend', sortOrder: 1 },
      { value: 'Houston', label: 'Houston', sortOrder: 2 },
      { value: 'Virtual', label: 'Virtual', sortOrder: 3 },
      { value: 'South TX', label: 'South TX', sortOrder: 4 },
      { value: 'TX', label: 'Texas', sortOrder: 5 },
    ];

    // Seed resource types
    const resourceTypes = [
      { value: 'Mental Health', label: 'Mental Health', sortOrder: 1 },
      { value: 'Legal', label: 'Legal', sortOrder: 2 },
      { value: 'Self Care', label: 'Self Care', sortOrder: 3 },
      { value: 'Faith', label: 'Faith', sortOrder: 4 },
      { value: 'Business', label: 'Business', sortOrder: 5 },
      { value: 'Community', label: 'Community', sortOrder: 6 },
      { value: 'Pride Orgs', label: 'Pride Orgs', sortOrder: 7 },
      { value: 'Arts', label: 'Arts', sortOrder: 8 },
      { value: 'Youth', label: 'Youth', sortOrder: 9 },
      { value: 'Family', label: 'Family', sortOrder: 10 },
      { value: 'Events', label: 'Events', sortOrder: 11 },
      { value: 'Medical', label: 'Medical', sortOrder: 12 },
    ];

    // Seed audiences
    const audiences = [
      { value: 'Trans', label: 'Trans', sortOrder: 1 },
      { value: 'Youth', label: 'Youth', sortOrder: 2 },
      { value: 'Seniors', label: 'Seniors', sortOrder: 3 },
      { value: 'Families', label: 'Families', sortOrder: 4 },
      { value: 'All', label: 'All', sortOrder: 5 },
    ];

    // Insert all items
    const allItems = [
      ...locations.map(item => ({ ...item, type: 'location', createdBy: adminUser._id })),
      ...resourceTypes.map(item => ({ ...item, type: 'resourceType', createdBy: adminUser._id })),
      ...audiences.map(item => ({ ...item, type: 'audience', createdBy: adminUser._id })),
    ];

    await Taxonomy.insertMany(allItems);
    console.log(`Seeded ${allItems.length} taxonomy items`);

    console.log('Taxonomy seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding taxonomy:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  seedTaxonomy();
}

module.exports = seedTaxonomy;
