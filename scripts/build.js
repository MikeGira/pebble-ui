// Pebble UI build script — concatenates + minifies src into dist/
// Requires: npm install (esbuild + lightningcss as devDeps)
const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
const { transform } = require('lightningcss');

const root = path.join(__dirname, '..');
const src  = path.join(root, 'src');
const dist = path.join(root, 'dist');

if (!fs.existsSync(dist)) fs.mkdirSync(dist);

// CSS order matters
const cssFiles = [
  'tokens.css',
  'reset.css',
  'animations.css',
  'components/cursor.css',
  'components/card.css',
  'components/button.css',
  'components/badge.css',
  'components/nav.css',
  'components/input.css',
  'components/toast.css',
  'components/progress.css',
  'components/tooltip.css',
].map(f => path.join(src, f));

// JS order matters (theme first — no flash)
const jsFiles = [
  'js/theme.js',
  'js/cursor.js',
  'js/tilt.js',
  'js/entrance.js',
  'js/toast.js',
].map(f => path.join(src, f));

const rawCss = cssFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');
const rawJs  = jsFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');

// Minify CSS with lightningcss Node API
const { code: minCss } = transform({
  filename: 'pebble.css',
  code: Buffer.from(rawCss),
  minify: true,
});
fs.writeFileSync(path.join(dist, 'pebble.css'), minCss);

// Bundle + minify JS with esbuild via a temp file (esbuild needs a file input)
const tmpJs = path.join(dist, '_pebble.tmp.js');
fs.writeFileSync(tmpJs, rawJs);
execSync(
  `npx esbuild "${tmpJs}" --bundle --minify --outfile="${path.join(dist, 'pebble.js')}"`,
  { cwd: root, stdio: 'inherit' }
);
fs.unlinkSync(tmpJs);

console.log('✓ dist/pebble.css');
console.log('✓ dist/pebble.js');
