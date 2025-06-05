const express = require('express');
const app = express();
const port = 4000;
const os = require('os');
const cors = require('cors');

// Import search methods
delete require.cache[require.resolve('./searchMethods/textSearch')];
delete require.cache[require.resolve('./searchMethods/musicSearch')];
const textSearch = require('./searchMethods/textSearch');
const musicSearch = require('./searchMethods/musicSearch');
const qwantSearch = require('./searchMethods/qwantSearch');

const NODE_NAME = 'Example Search Node';
const NODE_DESCRIPTION = 'A node that provides search capabilities.';
const NODE_FEATURES = ['text search', 'qwant search', "music search"];
const NODE_METHODS = ['text', 'qwant', "music"];

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
    methods: NODE_METHODS
  });
});

// Search endpoint
app.post('/search', async (req, res) => {
  const { query, method = 'text', rankingPreferences = {} } = req.body;
  if (!query) return res.status(400).json({ error: 'Missing query' });
  let results;
  if (method === 'text') {
    results = await textSearch.search(query, rankingPreferences);
  } else if (method === 'qwant') {
    results = await qwantSearch.search(query, rankingPreferences);
  } else if (method === 'music') {
    results = await musicSearch.search(query, rankingPreferences);
  } else {
    return res.status(400).json({ error: 'Unknown search method' });
  }
  res.json(results);
});

app.listen(port, () => {
  console.log(`Search node listening at http://localhost:${port}`);
});
