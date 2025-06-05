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
  async search(query, rankingPreferences) {
    const url = `https://api.qwant.com/v3/search/web?count=10&q=${encodeURIComponent(query)}&t=web&uiv=4&tgp=3&locale=en_US`;
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
      // Exposé island (Wikipedia)
      const islands = [];
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
        islands
      };
    } catch (e) {
      return { answers: [], html: '', islands: [], error: e.message };
    }
  }
};
