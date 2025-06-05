exports.id = "music-expose";
exports.name = "Music Exposé";
exports.trigger_type = "self";
exports.require_context = false;
exports.manually_curated = false;
exports.column = "supporting";

// Self-trigger: always request the music search method for the query
exports.shouldRender = async function(query) {
  console.log('[Music Exposé] shouldRender called with query:', query);
  const title = query.trim();
  if (!title) {
    console.log('[Music Exposé] Empty title, will not render.');
    return { shouldRender: false };
  }
  try {
    // Dynamically require the music search method
    const musicSearch = require('../searchMethods/musicSearch');
    const result = await musicSearch.search(title, {});
    if (result && Array.isArray(result.answers) && result.answers.length > 0) {
      const top = result.answers[0];
      console.log('[Music Exposé] Music result found, will render:', top);
      return {
        shouldRender: true,
        context: {
          name: top.name,
          url: top.url,
          domain: top.domain,
          snippet: top.snippet,
          favicon: top.favicon
        }
      };
    } else {
      console.log('[Music Exposé] No music result found.');
    }
  } catch (e) {
    console.log('[Music Exposé] Music search error:', e);
    return { shouldRender: false };
  }
  return { shouldRender: false };
};

exports.renderIsland = function(query, params = {}) {
  console.log('[Music Exposé] renderIsland called with query:', query, 'params:', params);
  const ctx = (params && params.context) || {};
  return {
    id: exports.id,
    name: exports.name,
    column: exports.column,
    html: `
      <div class="music-expose-island">
        <div class="music-expose-header">Music Exposé: ${ctx.name || ''}</div>
        <div class="music-expose-content">
          <div class="music-expose-favicon">
            ${ctx.favicon ? `<img src="${ctx.favicon}" alt="favicon" style="width:32px;height:32px;">` : ''}
          </div>
          <div class="music-expose-info">
            <a href="${ctx.url || '#'}" target="_blank" style="font-weight:bold; color:#2196f3; font-size:1.1em;">${ctx.name || ''}</a>
            <div style="color:#888; font-size:0.95em;">${ctx.domain || ''}</div>
            <div style="margin-top:6px;">${ctx.snippet || ''}</div>
          </div>
        </div>
      </div>
    `
  };
};