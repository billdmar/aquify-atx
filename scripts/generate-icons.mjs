/**
 * generate-icons.mjs — rasterize the brand favicon.svg into the PNG icons the
 * PWA manifest + iOS need. Run with `npm run icons`. Outputs to public/.
 *
 * - pwa-192.png / pwa-512.png : standard PWA icons (logo on the brand bg)
 * - pwa-maskable-512.png      : extra safe-zone padding for Android maskable
 * - apple-touch-icon.png      : 180px, iOS home-screen (no transparency)
 */

import sharp from 'sharp'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pub = join(root, 'public')

// Brand background (the aqua-50 page tone) so icons aren't transparent on iOS.
const BG = { r: 239, g: 249, b: 255, alpha: 1 }

const svg = await readFile(join(pub, 'favicon.svg'))

/** Render the logo centered on the brand background at `size`, with `pad`
 *  fraction of padding (maskable needs more safe zone). */
async function render(size, pad, outFile) {
  const logoSize = Math.round(size * (1 - pad))
  const logo = await sharp(svg, { density: 384 })
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
  const offset = Math.round((size - logoSize) / 2)
  await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: logo, top: offset, left: offset }])
    .png()
    .toFile(join(pub, outFile))
  console.log(`wrote public/${outFile} (${size}x${size})`)
}

await render(192, 0.18, 'pwa-192.png')
await render(512, 0.18, 'pwa-512.png')
await render(512, 0.3, 'pwa-maskable-512.png')
await render(180, 0.12, 'apple-touch-icon.png')

// Social-share (Open Graph / Twitter) image: 1200x630 from the map screenshot.
const ogSrc = join(root, 'docs', 'screenshots', 'map.png')
await sharp(ogSrc)
  .resize(1200, 630, { fit: 'cover', position: 'top' })
  .png({ compressionLevel: 9 })
  .toFile(join(pub, 'og-image.png'))
console.log('wrote public/og-image.png (1200x630)')

console.log('Done. Icons generated.')
