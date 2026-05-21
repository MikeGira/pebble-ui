const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
http.createServer((req, res) => {
  let p = req.url === '/' ? '/demo/index.html' : req.url;
  let fp = path.join(root, p);
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(fp);
    const ct = {'.html':'text/html','.css':'text/css','.js':'application/javascript'}[ext] || 'text/plain';
    res.writeHead(200, {'Content-Type': ct});
    res.end(data);
  });
}).listen(4242, '0.0.0.0', () => console.log('Pebble UI serving on http://localhost:4242'));
