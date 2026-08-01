// Pebble UI dev server — builds on start, watches src/ for changes, serves on :4242
const http = require('http');
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

http.createServer(function (req, res) {
  // req.url is attacker-controlled and Node does NOT normalise it, so `path.join`
  // alone lets `/../../` escape the repo and serve any file on disk. Decode, strip
  // the query, resolve, then require the result to stay under root.
  var raw;
  try {
    raw = decodeURIComponent(req.url.split('?')[0]);
  } catch (_) {
    res.writeHead(400); res.end('Bad request'); return;
  }
  var fp = path.resolve(root, '.' + (raw === '/' ? '/demo/index.html' : raw));
  if (fp !== root && !fp.startsWith(root + path.sep)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.readFile(fp, function (err, data) {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    var ct = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' }[path.extname(fp)] || 'text/plain';
    res.writeHead(200, { 'Content-Type': ct, 'X-Content-Type-Options': 'nosniff' });
    res.end(data);
  });
}).listen(4242, '127.0.0.1', function () {
  console.log('Pebble UI dev server → http://localhost:4242');
});
