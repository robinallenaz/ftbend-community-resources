const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const { connectToDb } = require('./lib/db');
const Event = require('./models/Event');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

function normalizeUrlKey(url) {
  return String(url || '')
    .trim()
    .toLowerCase()
    .replace(/\/$/, '');
}

function loadClientEvents() {
  const tsPath = path.resolve(__dirname, '../../client/src/data/events.ts');
  const source = fs.readFileSync(tsPath, 'utf8');

  const transformed = source
    .replace(/import[^;]+;\s*/g, '')
    .replace(/export const events[^=]*=\s*/g, 'module.exports = ');

  const sandbox = { module: { exports: null }, exports: {} };
  vm.runInNewContext(transformed, sandbox, { timeout: 1000 });

  if (!Array.isArray(sandbox.module.exports)) {
    throw new Error('Failed to load events from client/src/data/events.ts');
  }

  return sandbox.module.exports;
}

async function run() {
  await connectToDb();

  const clientEvents = loadClientEvents();

  const existing = await Event.find({}, { url: 1 }).lean();
  const existingKeys = new Set(existing.map((e) => normalizeUrlKey(e.url)));

  const toInsert = [];
  let skipped = 0;

  for (const e of clientEvents) {
    const urlKey = normalizeUrlKey(e.url);
    if (!urlKey) {
      skipped += 1;
      continue;
    }

    if (existingKeys.has(urlKey)) {
      skipped += 1;
      continue;
    }

    toInsert.push({
      name: e.name,
      schedule: e.schedule,
      url: e.url,
      locationHint: e.locationHint,
      status: 'active'
    });

    existingKeys.add(urlKey);
  }

  if (toInsert.length) {
    await Event.insertMany(toInsert);
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
