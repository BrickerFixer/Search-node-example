const { collectAllowedIslands } = require('../utils/islandHelpers');

// Example text search method
module.exports = {
  name: 'Text Search',
  description: 'Performs a simple text search.',
  supports: {
    pagination: false,
    pageParam: 'p',
    pageSize: 10,
    filters: [] // No user-facing filters for this method
  },
  allowedIslands: ['expose', 'misspell', 'test', 'music-expose'], // Only these islands will be considered
  async search(query, rankingPreferences) {
    // Dummy search results
    const answers = [
      {
        name: 'Example Result',
        domain: 'example.com',
        url: 'https://example.com',
        snippet: `Result for query: ${query}`,
        favicon: 'https://example.com/favicon.ico'
      },
      {
        name: 'Example Result',
        domain: 'example.com',
        url: 'https://example.com',
        snippet: `Result for query: ${query}`,
        favicon: 'https://example.com/favicon.ico'
      },
      {
        name: 'Example Result',
        domain: 'example.ru',
        url: 'https://example.ru',
        snippet: `Result for query: ${query}`,
        favicon: 'https://example.com/favicon.ico'
      },
      {
        name: 'Example Result',
        domain: 'example.ru',
        url: 'https://example.ru',
        snippet: `Result for query: ${query}`,
        favicon: 'https://example.com/favicon.ico'
      }
    ];
    // Use the shared utility for islands
    const islands = await collectAllowedIslands(query, this.allowedIslands);
    return {
      answers,
      html: '',
      islands,
      meta: { page: 1, pageSize: 10, total: answers.length }
    };
  }
};
