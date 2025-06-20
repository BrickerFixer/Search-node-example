// utils/federatedSearchUtil.js
// Utility for federated search across peer nodes
// Usage: await federatedSearch(peers, query, options)

const fetch = require('node-fetch');

/**
 * Perform federated search across peer nodes.
 * @param {string[]} peers - Array of peer base URLs (e.g., ['http://peer1:3000', ...])
 * @param {string} query - The search query string
 * @param {object} [options] - Optional settings
 * @param {number} [options.timeout=3000] - Timeout per peer in ms
 * @param {object} [options.rankingPreferences] - Optional ranking preferences
 * @param {object} [options.extra] - Extra params to send to peers
 * @returns {Promise<object[]>} Array of peer result objects: { peer, result, error }
 */
async function federatedSearch(peers, query, options = {}) {
  const timeout = options.timeout || 3000;
  const rankingPreferences = options.rankingPreferences || {};
  const extra = options.extra || {};

  // Helper to fetch with timeout
  const fetchWithTimeout = (url, opts, ms) => {
    return Promise.race([
      fetch(url, opts),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
    ]);
  };

  // Prepare requests
  const requests = peers.map(async (peer) => {
    const url = `${peer.replace(/\/$/, '')}/federated-search`;
    let result = null, error = null;
    try {
      const resp = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, rankingPreferences, ...extra })
      }, timeout);
      if (!resp.ok) throw new Error(`Peer ${peer} error: ${resp.status}`);
      result = await resp.json();
    } catch (e) {
      error = e.message;
    }
    return { peer, result, error };
  });

  // Wait for all
  return Promise.all(requests);
}

module.exports = { federatedSearch };
