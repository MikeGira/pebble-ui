// Pebble UI dev server — builds on start, watches src/ for changes, serves on :4242
const http = require('http');
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// realpath the root too, so the containment comparison below holds even when the
// checkout sits behind a symlink.
const root = fs.realpathSync(path.join(__dirname, '..'));
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

// Containment check, per the CodeQL js/path-injection remediation: resolve against
// the root, then realpath to collapse symlinks, then require the result to sit under
// the root. req.url is attacker-controlled and Node does NOT normalise it, so
// path.join alone lets `/../../` escape the repo and serve any file on disk; and
// resolving without realpath still lets a symlink inside the repo point outside it.
// Returns null when the request escapes or the file does not exist.
function safeResolve(urlPath) {
  var resolved = path.resolve(root, '.' + urlPath);
  var real;
  try {
    real = fs.realpathSync(resolved);
  } catch (_) {
    return null;
  }
  if (real !== root && real.indexOf(root + path.sep) !== 0) return null;
  return real;
}

http.createServer(function (req, res) {
  var raw;
  try {
    raw = decodeURIComponent(req.url.split('?')[0]);
  } catch (_) {
    res.writeHead(400); res.end('Bad request'); return;
  }
  var fp = safeResolve(raw === '/' ? '/demo/index.html' : raw);
  if (fp === null) { res.writeHead(404); res.end('Not found'); return; }

  fs.readFile(fp, function (err, data) {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    var ct = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' }[path.extname(fp)] || 'text/plain';
    res.writeHead(200, { 'Content-Type': ct, 'X-Content-Type-Options': 'nosniff' });
    res.end(data);
  });
}).listen(4242, '127.0.0.1', function () {
  console.log('Pebble UI dev server → http://localhost:4242');
});
