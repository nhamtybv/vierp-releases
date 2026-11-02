// Regenerates docs/user-guide/images/*. Usage: node docs/user-guide/capture/capture.mjs [chapter]  (see README.md in this folder)
import { startServer, seed, Shooter } from './lib.mjs'
import { chapters } from './steps.mjs'
import { execFileSync } from 'node:child_process'

// Chapter keys: 01 02 03 04 (also holds the whole of chapter 05) 06 07 08 09 10 11. Later chapters need data made by earlier ones.
const only = process.argv[2]
const picked = chapters.filter(([name]) => !only || name.startsWith(only))
if (!picked.length) { console.error(`no chapter matches "${only}"; keys: ${chapters.map((c) => c[0]).join(' ')}`); process.exit(2) }
try { execFileSync('cwebp', ['-version'], { stdio: 'ignore' }) } catch { console.error('cwebp not found: brew install webp (macOS) or apt install webp (Linux)'); process.exit(2) }
const srv = await startServer()
let sh
const bye = () => { srv.stop(); process.exit(130) }
process.on('SIGINT', bye); process.on('SIGTERM', bye)
try {
  console.log('server', srv.base)
  seed(srv.base)
  sh = new Shooter(srv.base)
  await sh.init()
  const S = {} // ids shared between steps (ORDER, INV, ...)
  for (const [, run] of picked) await run(sh, S)
  console.log(`\n${sh.count} images; failed steps: ${sh.failed.length ? sh.failed.join(', ') : 'none'}`)
  if (sh.failed.length) process.exitCode = 1
} catch (e) {
  console.error(e); process.exitCode = 1
} finally {
  await sh?.close().catch(() => {})
  srv.stop()
}
