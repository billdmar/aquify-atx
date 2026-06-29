// Bundle-size budget gate. Run after `npm run build`.
//
// Checks the main entry chunk in dist/assets (the `index-*.js` Vite emits for
// the app entry) and fails if it exceeds the raw-byte budget below. The
// current index chunk is ~260 kB raw (~81 kB gzipped); the budget gives
// headroom while catching an accidental heavy import that would balloon the
// initial download. (Firebase and the Leaflet map are code-split into their
// own chunks and are not counted here.)
//
// Usage: node scripts/check-bundle-size.mjs

import { readdir, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const assetsDir = resolve(__dirname, '..', 'dist', 'assets')

// Raw (uncompressed) byte budget for the main entry chunk. Set above the
// current ~260 kB with headroom so the gate catches a runaway import rather
// than the status quo.
const BUDGET_BYTES = 300 * 1024

async function main() {
  let files
  try {
    files = await readdir(assetsDir)
  } catch {
    console.error(
      `✗ Bundle check: ${assetsDir} not found — run \`npm run build\` first.`,
    )
    process.exit(1)
  }

  // Vite names the app entry chunk `index-<hash>.js`.
  const indexChunks = files.filter(
    (f) => /^index-.*\.js$/.test(f) && !f.endsWith('.map'),
  )

  if (indexChunks.length === 0) {
    console.error(
      `✗ Bundle check: no index-*.js entry chunk found in ${assetsDir}.`,
    )
    process.exit(1)
  }

  let failed = false
  for (const chunk of indexChunks) {
    const { size } = await stat(resolve(assetsDir, chunk))
    const kb = (size / 1024).toFixed(1)
    const budgetKb = (BUDGET_BYTES / 1024).toFixed(0)
    if (size > BUDGET_BYTES) {
      console.error(
        `✗ ${chunk} is ${kb} kB — over the ${budgetKb} kB budget.`,
      )
      failed = true
    } else {
      console.log(`✓ ${chunk} is ${kb} kB (budget ${budgetKb} kB).`)
    }
  }

  if (failed) {
    console.error(
      'Bundle-size budget exceeded. Trim the entry chunk (lazy-load heavy deps) or raise the budget deliberately.',
    )
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
