const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const { connectToDb } = require('./lib/db');
const Resource = require('./models/Resource');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

function normalizeUrlKey(url) {
  return String(url || '')
    .trim()
    .toLowerCase()
    .replace(/\/$/, '');
}

function loadClientResources() {
  const tsPath = path.resolve(__dirname, '../../client/src/data/resources.ts');
  const source = fs.readFileSync(tsPath, 'utf8');

  const transformed = source
    .replace(/import[^;]+;\s*/g, '')
    .replace(/export const resources[^=]*=\s*/g, 'module.exports = ');

  const sandbox = { module: { exports: null }, exports: {} };
  vm.runInNewContext(transformed, sandbox, { timeout: 1000 });

  if (!Array.isArray(sandbox.module.exports)) {
    throw new Error('Failed to load resources from client/src/data/resources.ts');
  }

  return sandbox.module.exports;
}

async function run() {
  await connectToDb();

  const clientResources = loadClientResources();

  const existing = await Resource.find({}, { url: 1 }).lean();
  const existingKeys = new Set(existing.map((r) => normalizeUrlKey(r.url)));

  const toInsert = [];
  let skipped = 0;

  for (const r of clientResources) {
    const urlKey = normalizeUrlKey(r.url);
    if (!urlKey) {
      skipped += 1;
      continue;
    }

    if (existingKeys.has(urlKey)) {
      skipped += 1;
      continue;
    }

    toInsert.push({
      name: r.name,
      description: r.description,
      url: r.url,
      locations: r.locations,
      types: r.types,
      audiences: r.audiences,
      tags: r.tags,
      status: 'active'
    });

    existingKeys.add(urlKey);
  }

  if (toInsert.length) {
    await Resource.insertMany(toInsert);
  }

  console.log(
    JSON.stringify(
      {
        inserted: toInsert.length,
        skipped
      },
      null,
      2
    )
  );
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
