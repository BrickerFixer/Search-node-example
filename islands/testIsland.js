// Example Island block
exports.id = "test";
exports.name = "Test";
exports.trigger_type = "query";
exports.keywords = ["test island block"];
exports.require_context = false;
exports.manually_curated = true;
exports.column = "supporting";

exports.shouldRender = async function(query) {
  return exports.keywords.some(k => query.includes(k))
    ? { shouldRender: true }
    : { shouldRender: false };
};

exports.renderIsland = function(query) {
  return {
    id: exports.id,
    name: exports.name,
    column: exports.column, // Ensure column is included in the returned object
    html: `<div>Island for: ${query}</div>`
  };
};
