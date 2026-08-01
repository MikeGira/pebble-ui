// Shared static file server for dev.js (build + watch) and serve.js (serve only).
//
// It exists as one module because the path-containment logic below is the only
// security-relevant code in this repo, and it was previously duplicated in both
// scripts — the copy in dev.js got fixed while the copy in serve.js kept serving
// arbitrary files. One implementation, one place to get it right.
const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = 4242;

const CONTENT_TYPES = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.svg':  'image/svg+xml',
  '.json': 'application/json',
};

// Binds 127.0.0.1 deliberately: this serves files off the developer's disk and has
// no business being reachable from the LAN.
function createStaticServer(rootDir) {
  // realpath the root so the containment comparison holds when the checkout sits
  // behind a symlink; trailing separator so the prefix match lands on a path
  // boundary and a sibling like `pebble-ui-old/` cannot pass.
  const root = fs.realpathSync(rootDir);
  const rootPrefix = root + path.sep;

  return http.createServer(function (req, res) {
    var raw;
    try {
      raw = decodeURIComponent(req.url.split('?')[0]);
    } catch (_) {
      res.writeHead(400); res.end('Bad request'); return;
    }

    // req.url is attacker-controlled and Node does NOT normalise it, so path.join
    // alone lets `/../../` escape the repo and serve any file on disk; resolving
    // without realpath still lets a symlink inside the repo point outside it.
    // Kept inline, and using startsWith, because that is the exact remediation shape
    // CodeQL's js/path-injection barrier guard recognises — the same check hoisted
    // into a helper that returns the path is not detected as a sanitizer.
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
      var ct = CONTENT_TYPES[path.extname(fp)] || 'text/plain';
      res.writeHead(200, { 'Content-Type': ct, 'X-Content-Type-Options': 'nosniff' });
      res.end(data);
    });
  });
}

function listen(rootDir, label) {
  createStaticServer(rootDir).listen(PORT, '127.0.0.1', function () {
    console.log(label + ' → http://localhost:' + PORT);
  });
}

module.exports = { createStaticServer, listen, PORT };
