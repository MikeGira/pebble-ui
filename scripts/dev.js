// Pebble UI dev server — builds on start, watches src/ for changes, serves on :4242
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { listen } = require('./static-server');

const root = path.join(__dirname, '..');
const src  = path.join(root, 'src');

function build() {
  try {
    execSync('node scripts/build.js', { cwd: root, stdio: 'inherit' });
  } catch (_) {
    console.error('[pebble] build failed — fix the error above and save again');
  }
}

build();

fs.watch(src, { recursive: true }, function (event, filename) {
  if (!filename) return;
  console.log('[pebble] ' + filename + ' changed — rebuilding...');
  build();
});

listen(root, 'Pebble UI dev server');
