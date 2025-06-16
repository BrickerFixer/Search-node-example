// Utility to extract the first sentence containing the query (case-insensitive)
function findRelevantSentence(content, query) {
  if (!content) return '';
  const sentences = content.match(/[^.!?\n]+[.!?\n]+/g) || [content];
  const q = query.trim().toLowerCase();
  for (const s of sentences) {
    if (s.toLowerCase().includes(q)) return s.trim();
  }
  // fallback: first sentence
  return sentences[0].trim();
}

module.exports = { findRelevantSentence };
