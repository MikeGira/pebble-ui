// Pebble UI static server — serves the demo without building or watching.
const path = require('path');
const { listen } = require('./static-server');

listen(path.join(__dirname, '..'), 'Pebble UI serving on');
