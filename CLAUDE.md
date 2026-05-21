# Pebble UI — CLAUDE.md

## What this is
Lightweight enterprise design system. Zero runtime dependencies. Pure CSS + vanilla JS.
Shipped as two files: `dist/pebble.css` and `dist/pebble.js`.
Installs in any project (HTML, React, Next.js, Svelte) with two `<link>` and `<script>` tags.

## Stack
- Build: Node.js (esbuild for JS, lightningcss for CSS)
- Hosting: Vercel (static CDN at pebble-ui.vercel.app)
- No framework, no bundler runtime in the output files

## Commands
```bash
npm install            # install devDeps (esbuild + lightningcss)
node scripts/dev.js    # build + watch src/ + serve demo on http://localhost:4242
node scripts/build.js  # one-shot build → dist/pebble.css + dist/pebble.js
node scripts/serve.js  # static server only (no watch) on :4242
vercel --prod          # deploy to production
```

## File Structure
```
src/
  tokens.css              — CSS custom properties (--pb- prefix)
  reset.css               — minimal reset
  animations.css          — @keyframes + [data-entrance] scroll system
  components/
    cursor.css            — magnetic cursor ring/dot
    button.css            — .btn, .btn-primary, .btn-ghost, .btn-circle
    card.css              — .card, .card-lift, .card-glass, .card-tilt, .card-skeleton
    badge.css             — .badge variants + .badge-dot + .pb-stat
    nav.css               — .pb-nav, .pb-section, .pb-container
    input.css             — .input, .input-group, .form-group, .form-label
    toast.css             — .pebble-toast-container (styles for toast.js)
    progress.css          — .progress, .progress-bar, variants, indeterminate
    tooltip.css           — [data-tooltip] pure CSS tooltips, 4 directions
  js/
    theme.js              — dark/light mode toggle + FOUC prevention
    cursor.js             — magnetic cursor + ring/dot + MutationObserver rebind
    tilt.js               — 3D card tilt with lerp + will-change management
    entrance.js           — IntersectionObserver scroll entrance animations
    toast.js              — window.pebble.toast() API
demo/
  index.html              — live demo (references ../dist/ — run dev server to view)
dist/
  pebble.css              — built + minified (committed — Vercel serves this)
  pebble.js               — built + minified (committed — Vercel serves this)
scripts/
  build.js                — concatenate src → dist, minify with esbuild + lightningcss
  dev.js                  — build + fs.watch + HTTP server (development)
  serve.js                — static HTTP server only
```

## Architecture Decisions
- All animations use only `transform` and `opacity` — no `width`, `height`, `top`, `left`
- `will-change` set only during active animation, cleared when idle (frees GPU memory)
- theme.js runs as a synchronous IIFE before `<body>` to prevent flash of unstyled content
- All CSS uses `--pb-` prefix — zero collision risk with host project styles
- JS files use IIFE pattern (no ES modules) for maximum browser compatibility (no bundler needed)
- Build concatenates files in strict dependency order (tokens first, then components)
- toast.js exposes `window.pebble.toast()` — single global namespace, no conflicts

## CSS Build Order (must be preserved)
1. tokens.css
2. reset.css
3. animations.css
4. components/cursor.css
5. components/card.css
6. components/button.css
7. components/badge.css
8. components/nav.css
9. components/input.css
10. components/toast.css
11. components/progress.css
12. components/tooltip.css

## JS Build Order (must be preserved)
1. theme.js — first, handles FOUC
2. cursor.js
3. tilt.js
4. entrance.js
5. toast.js

## Required Environment Variables
None — this is a static site with no server-side code.

## Deploy
- `dist/` is committed and deployed as static files by Vercel
- `vercel.json` sets `Cache-Control: immutable` on `/dist/` — always run build before deploy
- Demo served at `/`, dist assets at `/dist/pebble.css` and `/dist/pebble.js`
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.) set in vercel.json
