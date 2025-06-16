// Auto-discovery and registry for all islands
const fs = require('fs');
const path = require('path');

const islandsDir = path.join(__dirname);
const islands = [];

fs.readdirSync(islandsDir).forEach(file => {
  if (file.endsWith('.js') && file !== 'index.js') {
    const mod = require(path.join(islandsDir, file));
    // Only register if shouldRender and renderIsland exist
    if (typeof mod.shouldRender === 'function' && typeof mod.renderIsland === 'function') {
      islands.push(mod);
    }
  }
});

module.exports = islands;
