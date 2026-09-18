# Domain & repo architecture — HedgeHogs (Uniswap model)

**Date:** 2026-09-17 · **Owner:** confirmed the split, docs as a Uniswap-style developers site (not GitBook) ·
**Branch:** `feat/portfolio-truthful-hero`

## The target

One subdomain, one repo, one Vercel project — the way Uniswap splits
`app.uniswap.org` / `web.uniswap.org` / `developers.uniswap.org`.

| Subdomain | Repo | Vercel project | Content |
|---|---|---|---|
| `hedgehogs.app` | `hedgehogs-frontend` (this repo, slimmed) | the app | The dashboard **and** an app homepage with a "Get started" (modeled on `app.uniswap.org`). |
| `web.hedgehogs.app` | `hedgehogs-marketing` (**new**) | marketing | The marketing homepage (the v2 waitlist landing today) + privacy/status + the waitlist API. |
| `docs.hedgehogs.app` | `hedgehogs-docs` (**new**) | docs | The documentation site, Uniswap-style (self-hosted developer site, **not** GitBook). |
| `demo.hedgehogs.app` | `hedgehogs-frontend` (preview) | demo | The demo deployment. Today `/` redirects to `/overview`. |
| `api.hedgehogs.app` | backend (outside this repo) | — | Unchanged. |

## Repos

### `hedgehogs-marketing` — what moves out of `hedgehogs-frontend`

- **Pages:** `/` (the landing v2), `/privacy`, `/status`, `robots.txt` + `sitemap.xml` for the web domain.
- **Components:** `components/landing/*` (AutopilotDemo, FeatureRows, PortfolioPulse, LiveAndNext, CapitalRouting, the dither WebGL), the **dither-kit** (stays marketing-side), the shared brand primitives (Button, Checkbox, Accordion, LogoText, DexIcon, `globals.css` tokens) as its own copy.
- **API:** `pages/api/mail/*` (the waitlist plumbing + the email provider config moves with it).
- The app's public-route shell (`isPublicRoute`/`PUBLIC_ROUTES`/`EXCLUDED_PAGES`) is deleted here.
- Own `package.json`, `next.config.ts` (CSP, allowed API origins), `globals.css`.

### `hedgehogs-frontend` — what stays

Everything app-side: overview, portfolio, explore, swap, pools, loans, vaults,
strategies, settings, referrals, wallet, asset, the provider stack, the
`*-preview` dev pages, the e2e suite. The `/` route becomes the **app homepage**
(see below). `/docs` is removed — the docs move to `hedgehogs-docs`.

### `hedgehogs-docs` — the docs site (Uniswap-style, not GitBook)

Like `developers.uniswap.org`: a self-hosted developer docs site in its own
repo, deployed to `docs.hedgehogs.app`. No GitBook.

- **Stack (TBD during implementation):** a docs-first framework (e.g. Mintlify /
  Next.js + MDX) or the simplest self-hosted option the content needs.
- **Content:** What is HedgeHogs · Getting started (connect, deploy the account) ·
  The dashboard · Each automation (Auto Compound / Repay / Rebalance / Harvest /
  Collateralize) · The proxy/account model · Chains & protocols · Security · FAQ.
  The in-app `/docs` visual content migrates here in markdown.
- The app's docs links point to `docs.hedgehogs.app`.

## The app homepage (`hedgehogs.app` `/`) — model `app.uniswap.org`

Uniswap's app homepage is the product itself (the swap widget) plus a
"Get started". For HedgeHogs:

- **Hero app:** a live dashboard preview + the **Get started** CTA → the existing
  connect flow (`useForkBetaConnect`) → deploy the HedgeHog account
  (`ProxyOnboarding`) → `/portfolio`.
- **Sections (product grammar, same tokens as the marketing side):**
  - *The command center* — Portfolio, Explore, Strategies, Activity.
  - *Put it on autopilot* — the automations pitch.
  - *Chains & protocols* — Ethereum · Base · BNB + Aave/Uniswap/Curve/…
  - *Security* — non-custodial, proxy, revoke anytime.
  - Nav: Portfolio · Explore · Strategies · **Docs** (docs.hedgehogs.app) ·
    **web.hedgehogs.app**.
- **Routing:** unauthenticated → the homepage app; authenticated → `/portfolio`.
  `demo.hedgehogs.app` keeps redirecting `/` → `/overview`.

## Sequencing

1. **Scaffold `hedgehogs-marketing`**: new repo, copy the landing + assets +
   waitlist API, its own config, Vercel project bound to `web.hedgehogs.app`.
2. **Slim `hedgehogs-frontend`**: remove the landing, `/privacy` `/status`
   `/docs`, the waitlist API, the dither-kit; `/` becomes the app homepage.
3. **Build the app homepage**: hero app + sections + get-started flow;
   `/` → `/portfolio` when connected.
4. **Scaffold `hedgehogs-docs`**: the docs repo, write the content, connect
   `docs.hedgehogs.app`.
5. **DNS/Vercel**: create the projects + aliases (`web`, `docs`), point the
   domains, verify redirects.

## Owner actions

- Create `hedgehogs-marketing` and `hedgehogs-docs` under the org and grant access.
- Confirm the docs stack (Mintlify vs Next+MDX) when the docs repo is scaffolded.
- The marketing repo needs the email-provider credentials for the waitlist API.

## Notes

- The marketing and app repos each carry their own copy of the shared design
  tokens; they evolve independently (like Uniswap's repos).
- The current session's action-side UI work (side-panel kit, Rebalance
  automatable, charts on recharts, LP/Idle detail charts) all stays in
  `hedgehogs-frontend` and is independent of this split.