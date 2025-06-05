// Exposé Island for Wikipedia summaries (Node.js server version)
let fetchFn;
try {
  fetchFn = fetch;
} catch (e) {
  fetchFn = require('node-fetch');
}

exports.id = "expose";
exports.name = "Exposé";
exports.trigger_type = "self";
exports.require_context = false;
exports.manually_curated = false;
exports.column = "supporting";

// Self-trigger: always request Wikipedia for the query
exports.shouldRender = async function(query) {
  console.log('[Exposé] shouldRender called with query:', query);
  const title = query.trim();
  if (!title) {
    console.log('[Exposé] Empty title, will not render.');
    return { shouldRender: false };
  }
  try {
    // Wikipedia API expects spaces as underscores
    const safeTitle = title.replace(/\s+/g, '_');
    const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(safeTitle)}`;
    console.log('[Exposé] Fetching Wikipedia summary from:', apiUrl);
    const resp = await fetchFn(apiUrl, { headers: { 'User-Agent': 'SearchNode/1.0 (https://github.com/yourrepo)' } });
    console.log('[Exposé] Wikipedia response status:', resp.status);
    if (!resp.ok) throw new Error('No summary');
    const data = await resp.json();
    console.log('[Exposé] Wikipedia response data:', data);
    if ((data.type === 'standard' || data.type === 'disambiguation') && data.extract) {
      console.log('[Exposé] Wikipedia summary found, will render.');
      return {
        shouldRender: true,
        context: {
          summary: data.extract,
          image: (data.thumbnail && data.thumbnail.source) || null,
          title: data.title || title
        }
      };
    } else {
      console.log('[Exposé] Wikipedia summary not suitable for rendering.');
    }
  } catch (e) {
    console.log('[Exposé] Wikipedia fetch error:', e);
    return { shouldRender: false };
  }
  console.log('[Exposé] No summary found, will not render.');
  return { shouldRender: false };
};

exports.renderIsland = function(query, params = {}) {
  console.log('[Exposé] renderIsland called with query:', query, 'params:', params);
  const ctx = (params && params.context) || {};
  return {
    id: exports.id,
    name: exports.name,
    column: exports.column,
    html: `
            <div class="expose-island">
              <div class="image-container">
                ${ctx.image ? `<img src="${ctx.image}" alt="${ctx.title}" class="expose-image">` : ''}
              </div>
              <div class="content">
                <h1>${ctx.title || ''}</h1>
                <p>${ctx.summary || ''}</p>
              </div>
            </div>
    `
  };
};
