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

// Root with a trailing separator, so the containment test below is a prefix match on
// a path boundary rather than on a string (which would let a sibling `pebble-ui-x/`
// pass). Matches the shape of the ROOT constant in the CodeQL remediation example.
const rootPrefix = root + path.sep;

http.createServer(function (req, res) {
  var raw;
  try {
    raw = decodeURIComponent(req.url.split('?')[0]);
  } catch (_) {
    res.writeHead(400); res.end('Bad request'); return;
  }

  // req.url is attacker-controlled and Node does NOT normalise it, so path.join alone
  // lets `/../../` escape the repo and serve any file on disk; and resolving without
  // realpath still lets a symlink inside the repo point at a target outside it.
  // Kept inline, and using startsWith, because that is the exact remediation shape
  // CodeQL's js/path-injection barrier guard recognises — the same check hoisted into
  // a helper that returns the path is not detected as a sanitizer.
  // https://codeql.github.com/codeql-query-help/javascript/js-path-injection/
  var fp = path.resolve(root, '.' + (raw === '/' ? '/demo/index.html' : raw));
  try {
    fp = fs.realpathSync(fp);
  } catch (_) {
    res.writeHead(404); res.end('Not found'); return;
  }
  if (!fp.startsWith(rootPrefix)) {
    res.writeHead(404); res.end('Not found'); return;
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
