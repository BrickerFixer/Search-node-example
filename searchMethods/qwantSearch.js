// Qwant search method
let fetchFn;
try {
  fetchFn = fetch;
} catch (e) {
  fetchFn = require('node-fetch');
}
const exposeIsland = require('../islands/exposeIsland');

module.exports = {
  name: 'Qwant Search',
  description: 'Performs a search using the Qwant API.',
  supports: {
    pagination: true,
    pageParam: 'p',
    pageSize: 10,
    maxPage: 100,
    filters: [
      {
        name: 'safesearch',
        type: 'integer',
        description: 'Level of content filtering (0=off, 1=moderate, 2=strict)',
        default: 1,
        choices: [0, 1, 2] // for client dropdown
      },
      {
        name: 'locale',
        type: 'string',
        description: 'Locale/language code (e.g. en_US, fr_FR)',
        default: 'en_US'
      }
    ]
  },
  async search(query, rankingPreferences = {}) {
    // Log any custom ranking parameters received
    Object.entries(rankingPreferences).forEach(([key, value]) => {
      if (['safesearch', 'locale', 'p', 'count'].includes(key)) return;
      console.log(`[QwantSearch] Custom ranking parameter received: ${key} =`, value);
    });
    // Accept all supported parameters from client
    const page = parseInt(rankingPreferences.p || 1, 10);
    const count = parseInt(rankingPreferences.count || 10, 10);
    const offset = (page - 1) * count;
    const safesearch = typeof rankingPreferences.safesearch !== 'undefined' ? rankingPreferences.safesearch : 1;
    const locale = rankingPreferences.locale || 'en_US';
    const params = {
      count,
      offset,
      q: query,
      t: rankingPreferences.t || 'web',
      locale,
      safesearch,
      uiv: rankingPreferences.uiv || '4',
      tgp: rankingPreferences.tgp || 3
    };
    // Log the received page parameter and calculated offset
    console.log('[QwantSearch] Received page parameter p:', page, 'Calculated offset:', offset, 'Locale:', locale, 'Safesearch:', safesearch);
    // Build URL with all parameters
    const url = `https://api.qwant.com/v3/search/web?` +
      Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
    try {
      const response = await fetchFn(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
        }
      });
      const data = await response.json();
      // Extract results from Qwant API response
      let results = [];
      if (
        data.data &&
        data.data.result &&
        data.data.result.items &&
        data.data.result.items.mainline &&
        Array.isArray(data.data.result.items.mainline)
      ) {
        // Collect all items from all mainline blocks with type 'web'
        data.data.result.items.mainline.forEach(block => {
          if (block.type === 'web' && Array.isArray(block.items)) {
            results.push(...block.items);
          }
        });
      }
      // Misspell island
      const misspellIsland = require('../islands/misspellIsland');
      const misspellResult = await misspellIsland.shouldRender(query);
      // Exposé island (Wikipedia)
      const islands = [];
      if (misspellResult && misspellResult.shouldRender) {
        islands.push(misspellIsland.renderIsland(query, misspellResult));
      }
      const exposeResult = await exposeIsland.shouldRender(query);
      if (exposeResult && exposeResult.shouldRender) {
        islands.push(exposeIsland.renderIsland(query, exposeResult));
      }
      return {
        answers: results.map(item => ({
          name: item.title,
          domain: item.url ? (new URL(item.url)).hostname : '',
          url: item.url,
          snippet: item.desc,
          favicon: item.favicon || ''
        })),
        html: '', // No layout
        islands,
        meta: { page } // Add meta with current page
      };
    } catch (e) {
      return { answers: [], html: '', islands: [], error: e.message, meta: { page } };
    }
  }
};
