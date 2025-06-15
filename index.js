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

const NODE_NAME = 'Example Search Node';
const NODE_DESCRIPTION = 'A node that provides search capabilities.';
const NODE_FEATURES = Object.values(searchMethods).map(m => m.description || m.name || '').filter(Boolean);
const NODE_METHODS = Object.keys(searchMethods);

const startTime = Date.now();

app.use(express.json());
app.use('/music', express.static(require('path').resolve(__dirname, 'music')));
app.use(cors());

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

// Search endpoint
app.post('/search', async (req, res) => {
  const { query, method = 'text', rankingPreferences = {} } = req.body;
  if (!query) return res.status(400).json({ error: 'Missing query' });
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
