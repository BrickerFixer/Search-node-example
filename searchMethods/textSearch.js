// Example text search method
const testIsland = require('../islands/testIsland');
const exposeIsland = require('../islands/exposeIsland');
const musicExposeIsland = require('../islands/musicExposeIsland');

module.exports = {
  name: 'Text Search',
  description: 'Performs a simple text search.',
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
    
    // Check if any islands should be included
    const islands = [];
    if (testIsland.shouldRender(query)) {
      islands.push(testIsland.renderIsland(query));
    }
    // Exposé island (Wikipedia)
    const exposeResult = await exposeIsland.shouldRender(query);
    if (exposeResult && exposeResult.shouldRender) {
      islands.push(exposeIsland.renderIsland(query, exposeResult));
    }
    // Music Exposé island (music method)
    const musicExposeResult = await musicExposeIsland.shouldRender(query);
    if (musicExposeResult && musicExposeResult.shouldRender) {
      islands.push(musicExposeIsland.renderIsland(query, musicExposeResult));
    }
    return {
      answers,
      html: '',
      islands
    };
  }
};
