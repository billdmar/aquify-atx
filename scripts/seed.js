/**
 * Aquify ATX — Firestore seed script
 *
 * Reads src/data/fountains.json and writes each entry into the `fountains`
 * Firestore collection using the object's `id` field as the document ID.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/seed.js
 *
 * The service-account key JSON can be downloaded from the Firebase console:
 *   Project Settings → Service Accounts → Generate new private key
 *
 * Requirements:
 *   - firebase-admin must be installed (it is a dev dependency)
 *   - GOOGLE_APPLICATION_CREDENTIALS env var must point to a valid key file
 *     OR a file named serviceAccountKey.json must exist in the project root
 */

import { createRequire } from 'module';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Credential resolution
// ---------------------------------------------------------------------------
const serviceAccountPath = resolve(projectRoot, 'serviceAccountKey.json');

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  if (existsSync(serviceAccountPath)) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = serviceAccountPath;
    console.log(`Using service account key at ${serviceAccountPath}`);
  } else {
    console.error(
      '\nError: No Firebase credentials found.\n' +
      'Set GOOGLE_APPLICATION_CREDENTIALS to your service-account key path:\n' +
      '  GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/seed.js\n' +
      'Or place a serviceAccountKey.json file in the project root.\n'
    );
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Firebase Admin init
// ---------------------------------------------------------------------------
import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();

// ---------------------------------------------------------------------------
// Load fountain data
// ---------------------------------------------------------------------------
const require = createRequire(import.meta.url);
const fountains = require('../src/data/fountains.json');

console.log(`\nSeeding ${fountains.length} fountains into Firestore...\n`);

// ---------------------------------------------------------------------------
// Write documents
// ---------------------------------------------------------------------------
const COLLECTION = 'fountains';
let successCount = 0;
let errorCount = 0;

for (const fountain of fountains) {
  const { id, ...data } = fountain;
  if (!id) {
    console.warn('  [SKIP] Fountain entry missing id field:', fountain);
    errorCount++;
    continue;
  }
  try {
    await db.collection(COLLECTION).doc(id).set(data, { merge: true });
    console.log(`  [OK]   ${id}`);
    successCount++;
  } catch (err) {
    console.error(`  [ERR]  ${id} — ${err.message}`);
    errorCount++;
  }
}

console.log(
  `\nDone. ${successCount} written, ${errorCount} skipped/errored out of ${fountains.length} total.\n`
);

process.exit(errorCount > 0 ? 1 : 0);
