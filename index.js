const express = require('express');
const app = express();
const port = 4000;
const os = require('os');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Dynamically load all search methods from the searchMethods directory
const searchMethodsDir = path.join(__dirname, 'searchMethods');
const searchMethods = {};
fs.readdirSync(searchMethodsDir).forEach(file => {
  if (file.endsWith('.js')) {
    const methodName = path.basename(file, '.js');
    searchMethods[methodName] = require(path.join(searchMethodsDir, file));
  }
});

const islands = require('./islands');

const NODE_NAME = 'Example Index Node';
const NODE_DESCRIPTION = 'An example Index Search Engine node from a repository.';
const NODE_FEATURES = Object.values(searchMethods).map(m => m.description || m.name || '').filter(Boolean);
const NODE_METHODS = Object.keys(searchMethods);

const startTime = Date.now();

app.use(express.json());
app.use('/music', express.static(require('path').resolve(__dirname, 'music')));
app.use(cors());

// Static file serving for static document search
app.use('/demo/staticdocs', express.static(path.resolve(__dirname, 'demo/staticdocs')));

// Load config for interconnectivity
let nodeConfig = {};
try {
  nodeConfig = require('./config.json');
} catch (e) {
  nodeConfig = { indexSharing: { enabled: false }, peers: [] };
}

// Peer event listening for index updates
const { subscribeToPeers, handlePeerUpdates } = require('./utils/peerEvents');
if (nodeConfig.peers && nodeConfig.peers.length > 0) {
  subscribeToPeers(nodeConfig.peers, handlePeerUpdates);
}

// Helper to get recent index updates (stub for now)
function getIndexUpdates() {
  const updates = [];
  if (nodeConfig.indexSharing && nodeConfig.indexSharing.enabled) {
    if (nodeConfig.indexSharing.expose.includes('staticdocs')) {
      // Example: list files in staticdocs
      const staticdocsDir = path.join(__dirname, 'demo/staticdocs');
      if (fs.existsSync(staticdocsDir)) {
        fs.readdirSync(staticdocsDir).forEach(file => {
          const stat = fs.statSync(path.join(staticdocsDir, file));
          updates.push({
            type: 'staticdoc',
            name: file,
            mtime: stat.mtime,
            size: stat.size
          });
        });
      }
    }
    // Add more sources (music, db, etc.) as needed
  }
  return updates.slice(0, nodeConfig.indexSharing.maxUpdates || 100);
}

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Metadata endpoint
app.get('/metadata', (req, res) => {
  res.json({
    name: NODE_NAME,
    description: NODE_DESCRIPTION,
    features: NODE_FEATURES,
    methods: NODE_METHODS,
    methodCapabilities: Object.fromEntries(
      Object.entries(searchMethods).map(([k, v]) => [k, v.supports || {}])
    )
  });
});

// Index updates endpoint
app.get('/index-updates', (req, res) => {
  if (!nodeConfig.indexSharing || !nodeConfig.indexSharing.enabled) {
    return res.status(403).json({ error: 'Index sharing is disabled.' });
  }
  res.json({
    node: NODE_NAME,
    updates: getIndexUpdates(),
    timestamp: new Date().toISOString()
  });
});

// Helper to run all islands for a query and collect those that should render
async function collectIslands(query) {
  const results = [];
  for (const island of islands) {
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

// Helper to sanitize query input (basic)
function sanitizeQuery(query) {
  if (typeof query !== 'string') return '';
  // Remove null bytes and excessive whitespace
  return query.replace(/\0/g, '').trim();
}

// Search endpoint
app.post('/search', async (req, res) => {
  let { query, method, rankingPreferences = {} } = req.body;
  query = sanitizeQuery(query);
  if (!query) return res.status(400).json({ error: 'Missing or invalid query' });
  if (!method) return res.status(400).json({ error: 'Missing search method' });
  const searchMethod = searchMethods[method];
  if (!searchMethod || typeof searchMethod.search !== 'function') {
    return res.status(400).json({ error: 'Unknown search method' });
  }
  const results = await searchMethod.search(query, rankingPreferences);
  res.json(results);
});

// Federated search endpoint (non-priority, strict timeout, parallel execution, rate-limited)
let lastFederatedSearch = 0;
const FEDERATED_SEARCH_MIN_INTERVAL = 2000; // 2 seconds between federated searches per node

app.post('/federated-search', async (req, res) => {
  // Simple rate limiting to avoid being bombed by peer nodes
  const now = Date.now();
  if (now - lastFederatedSearch < FEDERATED_SEARCH_MIN_INTERVAL) {
    return res.status(429).json({ error: 'Federated search rate limit exceeded. Please try again later.' });
  }
  lastFederatedSearch = now;

  let { query, method, rankingPreferences = {}, timeoutMs = 3000 } = req.body;
  query = sanitizeQuery(query);
  if (!query) return res.status(400).json({ error: 'Missing or invalid query' });
  if (!method) return res.status(400).json({ error: 'Missing search method' });
  const searchMethod = searchMethods[method];
  if (!searchMethod || typeof searchMethod.federatedSearch !== 'function') {
    return res.status(400).json({ error: 'Search method does not support federated search' });
  }
  let timedOut = false;
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => {
      timedOut = true;
      reject(new Error('Federated search timed out'));
    }, timeoutMs)
  );
  try {
    const federatedPromise = searchMethod.federatedSearch(query, rankingPreferences, timeoutMs);
    const result = await Promise.race([federatedPromise, timeoutPromise]);
    res.json(result);
  } catch (err) {
    if (timedOut) {
      res.status(504).json({ error: 'Federated search timed out' });
    } else {
      res.status(500).json({ error: 'Federated search failed', details: err.message });
    }
  }
});

// Use global fetch if available (Node 18+), otherwise require node-fetch
let fetchFn;
try {
  fetchFn = fetch;
} catch (e) {
  fetchFn = require('node-fetch');
}

// Search suggestions endpoint (proxies to external API, e.g., DuckDuckGo)
app.post('/suggest', async (req, res) => {
  const { partial } = req.body;
  const query = sanitizeQuery(partial);
  if (!query) return res.status(400).json({ error: 'Missing or invalid partial query' });
  try {
    const url = `https://duckduckgo.com/ac/?q=${encodeURIComponent(query)}`;
    const response = await fetchFn(url);
    if (!response.ok) throw new Error('Suggestion API error');
    const suggestions = await response.json();
    res.json({ suggestions: suggestions.map(s => s.phrase) });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch suggestions', details: e.message });
  }
});

app.listen(port, () => {
  console.log(`Search node listening at http://localhost:${port}`);
});
