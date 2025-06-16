// Utility to collect only allowed islands for a query, given allowedIslands array
const islandsRegistry = require('../islands');

async function collectAllowedIslands(query, allowedIslands) {
  const results = [];
  for (const island of islandsRegistry) {
    if (!allowedIslands.includes(island.id)) continue;
    try {
      const res = await island.shouldRender(query);
      if (res && res.shouldRender) {
        results.push(island.renderIsland(query, res));
      }
    } catch (e) {
      console.log(`[Island Error] ${island.name}:`, e);
    }
  }
  return results;
}

module.exports = { collectAllowedIslands };
