const mongoose = require('mongoose');
const Resource = require('../models/Resource');
const Taxonomy = require('../models/Taxonomy');
require('dotenv').config();

async function migrateResources() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all taxonomy items for mapping
    const taxonomyItems = await Taxonomy.find({});
    const taxonomyMap = new Map();

    taxonomyItems.forEach(item => {
      taxonomyMap.set(`${item.type}:${item.value}`, item.value);
    });

    // Get all resources
    const resources = await Resource.find({});
    console.log(`Found ${resources.length} resources to migrate`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const resource of resources) {
      let needsUpdate = false;
      const updateData = {};

      // Migrate locations
      if (resource.locations && Array.isArray(resource.locations)) {
        const migratedLocations = resource.locations.map(loc => {
          const taxonomyKey = `location:${loc}`;
          return taxonomyMap.get(taxonomyKey) || loc;
        });
        
        if (JSON.stringify(resource.locations) !== JSON.stringify(migratedLocations)) {
          updateData.locations = migratedLocations;
          needsUpdate = true;
        }
      }

      // Migrate types
      if (resource.types && Array.isArray(resource.types)) {
        const migratedTypes = resource.types.map(type => {
          const taxonomyKey = `resourceType:${type}`;
          return taxonomyMap.get(taxonomyKey) || type;
        });
        
        if (JSON.stringify(resource.types) !== JSON.stringify(migratedTypes)) {
          updateData.types = migratedTypes;
          needsUpdate = true;
        }
      }

      // Migrate audiences
      if (resource.audiences && Array.isArray(resource.audiences)) {
        const migratedAudiences = resource.audiences.map(aud => {
          const taxonomyKey = `audience:${aud}`;
          return taxonomyMap.get(taxonomyKey) || aud;
        });
        
        if (JSON.stringify(resource.audiences) !== JSON.stringify(migratedAudiences)) {
          updateData.audiences = migratedAudiences;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await Resource.findByIdAndUpdate(resource._id, updateData);
        updatedCount++;
        console.log(`Updated resource: ${resource.name}`);
      } else {
        skippedCount++;
      }
    }

    console.log(`Migration completed. Updated: ${updatedCount}, Skipped: ${skippedCount}`);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  migrateResources();
}

module.exports = migrateResources;
