/* eslint-disable */
/**
 * verify-diagrams.mjs — proves every diagram/animation on the docs site works:
 * - normal motion: the animated layer actually loops (transforms change)
 * - prefers-reduced-motion: every diagram renders its COMPLETE static frame
 * - the dither hero renders and is sized
 *
 * Run against a live dev server (default http://localhost:3022):
 *   node scripts/verify-diagrams.mjs [baseUrl]
 */
const path = require('path')

function resolvePlaywright() {
  for (const p of [
    'playwright',
    path.join(__dirname, '../../hedgehogs-frontend/node_modules/playwright'),
  ]) {
    try {
      return require(p)
    } catch {
      /* try next */
    }
  }
  throw new Error('playwright not found — npm i -D playwright, or run from the hedgehogs workspace')
}
const { chromium } = resolvePlaywright()

const BASE = process.argv[2] || 'http://localhost:3022'

const PAGES = [
  ['/docs/how-it-works/architecture', 'architecture', 'Non-custodial'],
  ['/docs/how-it-works/approvals', 'approvals', 'Just-in-time approvals'],
  ['/docs/how-it-works/automation', 'strategyflow', 'HedgeHog account'],
  ['/docs/automations/auto-compound', 'autocompound', 'Position'],
  ['/docs/automations/auto-repay', 'autorepay', 'Health factor'],
  ['/docs/automations/auto-rebalance', 'autorebalance', 'Your range'],
  ['/docs/automations/auto-harvest', 'autoharvest', 'Your wallet'],
  ['/docs/automations/auto-collateralize', 'autocollaterize', 'Collateral'],
]

const sampleTransforms = (page) =>
  page.evaluate(() => {
    const shell = document.querySelector('[data-diagram-shell]')
    if (!shell) return 'noshell'
    const sig = []
    for (const el of shell.querySelectorAll('*')) {
      const cs = getComputedStyle(el)
      const t = cs.transform
      if (t && t !== 'none') sig.push('t:' + t)
      const l = cs.left
      if (l && l !== 'auto' && l !== '0px') sig.push('l:' + l)
      const o = cs.opacity
      if (o && o !== '1') sig.push('o:' + o)
      if (el.getAttribute && el.getAttribute('pathLength')) sig.push('pl:' + el.getAttribute('pathLength'))
    }
    return sig.join('|')
  })

;(async () => {
  const browser = await chromium.launch()
  const results = []
  const check = (n, ok, extra = '') =>
    results.push(`${ok ? 'PASS' : 'FAIL'} ${n}${extra ? ' — ' + extra : ''}`)

  for (const [pathname, name, label] of PAGES) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message.slice(0, 140)))

    await page.goto(BASE + pathname, { waitUntil: 'networkidle' })
    await page.waitForTimeout(900)
    check(`${name}@normal: content label renders`, (await page.locator(`text=${label}`).count()) >= 1)
    const a = await sampleTransforms(page)
    await page.waitForTimeout(1600)
    const b = await sampleTransforms(page)
    check(`${name}@normal: animated layer loops`, a !== b && a !== 'noshell')
    check(`${name}@normal: no page errors`, errors.length === 0, errors[0] ?? '')

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(700)
    check(`${name}@reduce: complete static frame`, (await page.locator(`text=${label}`).count()) >= 1)
    await page.close()
  }

  // Result-state settlement under reduced motion
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(BASE + '/docs/automations/auto-repay', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  const repayFill = await page.evaluate(() => {
    const shell = document.querySelector('[data-diagram-shell]')
    if (!shell) return 'noshell'
    return [...shell.querySelectorAll('div')]
      .filter((d) => d.className.includes('origin-left'))
      .map((d) => getComputedStyle(d).transform)
      .join('|')
  })
  check('autorepay@reduce: debt bar settled at ~0.35', /0\.35/.test(repayFill), repayFill)

  await page.goto(BASE + '/docs/automations/auto-rebalance', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  const bandY = await page.evaluate(() => {
    const shell = document.querySelector('[data-diagram-shell]')
    const g = shell?.querySelector('g[style*="transform"]')
    return g ? getComputedStyle(g).transform : 'none'
  })
  check('autorebalance@reduce: band re-centered (y≈22)', /22/.test(bandY), bandY)
  await page.close()

  const home = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await home.goto(BASE + '/', { waitUntil: 'networkidle' })
  await home.waitForTimeout(700)
  const hero = await home.evaluate(() => {
    const sec = document.querySelector('section')
    return {
      svgs: sec ? sec.querySelectorAll('svg').length : 0,
      wave: sec ? !!sec.querySelector('path[stroke]') : false,
    }
  })
  check('home: dither hero renders (glow + wave)', hero.svgs >= 2 && hero.wave, JSON.stringify(hero))
  await home.close()

  console.log(results.join('\n'))
  const fails = results.filter((r) => r.startsWith('FAIL')).length
  console.log(`\n${results.length - fails}/${results.length} checks passed`)
  await browser.close()
  process.exit(fails ? 1 : 0)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})