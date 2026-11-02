// Helpers for capture.mjs: server lifecycle, per-user browser contexts, screenshots.
import { chromium } from '../../../web/node_modules/@playwright/test/index.mjs'
import { spawn, execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import net from 'node:net'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..')
export const IMAGES = join(ROOT, 'docs/user-guide/images')
export const ADMIN_PASSWORD = 'admin-guide-2026'
export const DEMO_PASSWORD = 'Demo@2026'
export const NOW = new Date('2026-11-01T09:00:00+07:00') // the demo seed's "today"; fixed in the browser
export const DESKTOP = { width: 1280, height: 800 }
export const PHONE = { width: 390, height: 844 }

const freePort = () => new Promise((ok) => { const s = net.createServer().listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)) }) })

export async function startServer() {
  const dir = mkdtempSync(join(tmpdir(), 'vierp-guide-'))
  const port = await freePort()
  const bin = join(ROOT, 'bin/vierp')
  if (!existsSync(bin)) execFileSync('make', ['build'], { cwd: ROOT, stdio: 'inherit' })
  const proc = spawn(bin, [], {
    cwd: dir, stdio: ['ignore', 'ignore', 'inherit'],
    env: { ...process.env, DB_DRIVER: 'sqlite', DB_DSN: join(dir, 'guide.db'), ADDR: `127.0.0.1:${port}`, ADMIN_PASSWORD, VIERP_SECRET_KEY: 'A'.repeat(43) + '=', EINVOICE_PROVIDER: 'sandbox', LOG_LEVEL: 'error' },
  })
  const base = `http://127.0.0.1:${port}`
  const stop = () => { proc.kill('SIGTERM'); rmSync(dir, { recursive: true, force: true }) }
  let ready = false
  for (let i = 0; i < 100 && !ready; i++) { try { ready = (await fetch(base + '/login')).ok } catch {} if (!ready) await new Promise((r) => setTimeout(r, 300)) }
  if (!ready) { stop(); throw new Error('server did not become ready on ' + base) }
  return { base, stop, dir }
}

export function seed(base) {
  const res = join(ROOT, 'scripts/seed-demo/result.json') // the seed rewrites this (git-ignored) file; put it back
  const before = existsSync(res) ? readFileSync(res) : null
  try { execFileSync('node', [join(ROOT, 'scripts/seed-demo/seed.mjs')], { env: { ...process.env, BASE: base, ADMIN_PASSWORD }, stdio: 'inherit' }) }
  finally { if (before) writeFileSync(res, before); else rmSync(res, { force: true }) }
}

export class Shooter {
  constructor(base) { this.base = base; this.ctxs = new Map(); this.failed = []; this.count = 0 }
  async init() { this.browser = await chromium.launch() }
  async ctx(user, phone = false) {
    const key = user + (phone ? ':p' : '')
    if (this.ctxs.has(key)) return this.ctxs.get(key)
    const c = await this.browser.newContext({ baseURL: this.base, viewport: phone ? PHONE : DESKTOP, isMobile: phone, hasTouch: phone, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', reducedMotion: 'reduce' })
    await c.clock.setFixedTime(NOW)
    if (user) {
      const r = await c.request.post('/api/login', { data: { login: user, password: user === 'admin' ? ADMIN_PASSWORD : DEMO_PASSWORD } })
      if (!r.ok()) throw new Error(`login ${user}: ${r.status()}`)
    }
    this.ctxs.set(key, c)
    return c
  }
  // Open a fresh page for a user; confirm() dialogs are accepted (they cannot be captured headless).
  async page(user, path, { phone = false } = {}) {
    const p = await (await this.ctx(user, phone)).newPage()
    p.on('dialog', (d) => d.accept())
    if (path) await this.go(p, path)
    return p
  }
  async go(p, path) { await p.goto(path); await this.settle(p) }
  async settle(p, ms = 350) { await p.waitForLoadState('networkidle').catch(() => {}); await p.waitForTimeout(ms) }
  // Save a screenshot. hl = selectors/locators to outline in red, full = full page, el = clip to this element.
  async shot(p, file, { hl = [], full = false, el, wait = 0, toast = false } = {}) {
    await this.settle(p, 250 + wait)
    if (!toast) await p.waitForSelector('[data-toast]', { state: 'detached', timeout: 8000 }).catch(() => {}) // let notifications fade out
    // Deterministic highlight: kill transitions, drop focus rings, then draw an overlay box that the element's own CSS cannot override.
    await p.addStyleTag({ content: '*{transition:none!important;animation:none!important}' }).catch(() => {})
    await p.evaluate(() => { document.activeElement?.blur?.(); document.querySelectorAll('[data-guide-hl]').forEach((e) => e.remove()) })
    for (const h of [].concat(hl)) {
      const l = (typeof h === 'string' ? p.locator(h) : h).first()
      if (!(await l.count().catch(() => 0))) { console.log('  ! highlight target not found in', file, String(h)); continue }
      await l.scrollIntoViewIfNeeded().catch(() => {})
      await l.evaluate((e) => {
        const r = e.getBoundingClientRect(); const o = document.createElement('div')
        o.dataset.guideHl = '1'
        o.style.cssText = `position:fixed;left:${r.left - 4}px;top:${r.top - 4}px;width:${r.width + 8}px;height:${r.height + 8}px;border:3px solid #e11d48;border-radius:10px;box-shadow:0 0 0 3px rgba(225,29,72,.25);pointer-events:none;z-index:2147483647;box-sizing:border-box`
        ;(e.closest('dialog[open]') || document.body).appendChild(o) // a modal sits in the top layer: draw inside it
      }).catch(() => {})
    }
    await p.waitForTimeout(300)
    const path = join(IMAGES, file + '.webp')
    mkdirSync(dirname(path), { recursive: true })
    const png = join(tmpdir(), `vierp-guide-shot-${process.pid}.png`) // Playwright only writes PNG/JPEG; cwebp -lossless is ~1/3 the PNG size
    if (el) await (typeof el === 'string' ? p.locator(el).first() : el).screenshot({ path: png })
    else await p.screenshot({ path: png, fullPage: full })
    execFileSync('cwebp', ['-quiet', '-lossless', '-z', '9', png, '-o', path])
    rmSync(png, { force: true })
    await p.evaluate(() => document.querySelectorAll('[data-guide-hl]').forEach((e) => e.remove())).catch(() => {})
    this.count++
    console.log('  shot', file)
  }
  async btn(p, name, exact = true) { const b = p.getByRole('button', { name, exact }).first(); await b.click(); await this.settle(p) }
  async pick(p, name, text) { const i = p.locator(`input[name="${name}"]`); await i.fill(text); await p.waitForTimeout(500); await p.locator('li', { hasText: text }).first().click(); await p.waitForTimeout(200) }
  // Run a named step; a failure is logged and the run goes on.
  async step(name, fn) {
    console.log('STEP', name)
    try { await fn() } catch (e) { this.failed.push(name); console.log('  FAILED', name, String(e.message).split('\n')[0]) }
  }
  async close() { await this.browser.close() }
}
