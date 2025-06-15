const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');

exports.id = "misspell";
exports.name = "Misspell";
exports.trigger_type = "self";
exports.require_context = false;
exports.manually_curated = false;
exports.column = "supporting";

exports.shouldRender = async function(query) {
  // Only check for single-word or short queries (optional, can be removed)
  if (!query || query.length < 3) {
    console.log('[misspellIsland] Query too short or empty:', query);
    return { shouldRender: false };
  }
  try {
    console.log(`[misspellIsland] Querying Datamuse for: '${query}'`);
    const resp = await fetchFn(`https://api.datamuse.com/sug?s=${encodeURIComponent(query)}`);
    if (!resp.ok) {
      console.log('[misspellIsland] Datamuse API error:', resp.status);
      return { shouldRender: false };
    }
    const suggestions = await resp.json();
    console.log('[misspellIsland] Suggestions received:', suggestions);
    if (suggestions.length && suggestions[0].word.toLowerCase() !== query.toLowerCase()) {
      console.log(`[misspellIsland] Suggestion found: '${suggestions[0].word}' for query '${query}'`);
      return {
        shouldRender: true,
        context: {
          suggestion: suggestions[0].word,
          suggestions
        }
      };
    } else {
      console.log('[misspellIsland] No spelling correction needed for:', query);
    }
  } catch (e) {
    console.log('[misspellIsland] Error during Datamuse fetch:', e);
    // Ignore errors
  }
  return { shouldRender: false };
};

exports.renderIsland = function(query, params = {}) {
  console.log('[misspellIsland] renderIsland called with query:', query, 'params:', params);
  const ctx = (params && params.context) || {};
  return {
    id: exports.id,
    name: exports.name,
    column: exports.column,
    html: `
      <div class="serp-item__wrap misspell-island">
        <span style="font-size:1.1em;">Did you mean <b style='color:#ff7e7e;'>${ctx.suggestion || ''}</b>?</span>
        ${ctx.suggestions && ctx.suggestions.length > 1 ? `<div style='margin-top:8px;font-size:0.95em;'>Other suggestions: ${ctx.suggestions.slice(1, 4).map(s => `<span style='color:#ffb37e;'>${s.word}</span>`).join(', ')}</div>` : ''}
      </div>
    `
  };
};
