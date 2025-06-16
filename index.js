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

app.listen(port, () => {
  console.log(`Search node listening at http://localhost:${port}`);
});
