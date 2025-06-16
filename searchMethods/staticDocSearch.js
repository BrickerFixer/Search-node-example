// Static Document Search (Markdown/HTML/PDF, BM25 template)
const path = require('path');
const fs = require('fs');
const FlexSearch = require('flexsearch');
const { JSDOM } = require('jsdom');
const pdfParse = require('pdf-parse');

const dataDir = path.join(__dirname, '../demo/staticdocs');
let docIndex = new FlexSearch.Document({
  document: {
    id: 'id',
    index: ['content', 'name']
  },
  tokenize: 'forward',
  cache: true
});
let docMap = {};

function extractTextFromHTML(html) {
  const dom = new JSDOM(html);
  return dom.window.document.body.textContent || '';
}

function extractTextFromMarkdown(md) {
  return md.replace(/[#*_`>\-]/g, '');
}

function extractText(txt) {
  return txt;
}


async function buildIndex() {
  docIndex = new FlexSearch.Document({
    document: {
      id: 'id',
      index: ['content', 'name']
    },
    tokenize: 'forward',
    cache: true
  });
  docMap = {};
  if (!fs.existsSync(dataDir)) return;
  const files = fs.readdirSync(dataDir).filter(f => /\.(md|html|pdf|txt)$/i.test(f));
  let idx = 0;
  for (const file of files) {
    let content = '';
    const ext = path.extname(file).toLowerCase();
    if (ext === '.md') {
      content = extractTextFromMarkdown(fs.readFileSync(path.join(dataDir, file), 'utf8'));
    } else if (ext === '.html') {
      content = extractTextFromHTML(fs.readFileSync(path.join(dataDir, file), 'utf8'));
    } else if (ext === '.pdf') {
      try {
        const data = await pdfParse(fs.readFileSync(path.join(dataDir, file)));
        content = data.text;
      } catch (e) {
        content = '';
      }
    } else if (ext === '.txt') {
      content = extractText(fs.readFileSync(path.join(dataDir, file), 'utf8'));
    }
    const id = idx + '-' + file;
    docMap[id] = { name: file, content };
    docIndex.add({ id, name: file, content });
    idx++;
  }
}
buildIndex();

module.exports = {
  name: 'Static Document Search',
  description: 'Searches markdown, HTML, and PDF files using BM25-like scoring.',
  supports: {
    pagination: true,
    pageParam: 'p',
    pageSize: 10,
    filters: []
  },
  async search(query, rankingPreferences = {}) {
    console.log('[StaticDocSearch] search called with query:', query, 'rankingPreferences:', rankingPreferences);
    if (!query || !query.trim()) {
      console.log('[StaticDocSearch] Empty query received.');
      return { answers: [], html: '', islands: [], meta: { page: 1, total: 0 } };
    }
    // Search index
    const results = docIndex.search(query, { enrich: true, limit: 100 });
    console.log('[StaticDocSearch] Raw search results:', results);
    // Flatten and map to docMap
    const flat = [];
    results.forEach(group => {
      group.result.forEach(id => {
        flat.push(docMap[id]);
      });
    });
    console.log('[StaticDocSearch] Flattened results:', flat.map(f => f && f.name));
    // Pagination
    const page = parseInt(rankingPreferences.p || 1, 10);
    const count = parseInt(rankingPreferences.count || 10, 10);
    const paged = flat.slice((page - 1) * count, page * count);
    console.log('[StaticDocSearch] Returning page', page, 'with', paged.length, 'results.');
    // For each result, find the first sentence containing the query
    function findSentence(content, query) {
      if (!content) return '';
      const sentences = content.match(/[^.!?\n]+[.!?\n]+/g) || [content];
      const q = query.trim().toLowerCase();
      for (const s of sentences) {
        if (s.toLowerCase().includes(q)) return s.trim();
      }
      // fallback: first sentence
      return sentences[0].trim();
    }
    // Build file URL for serving static files
    function getFileUrl(fileName) {
      // Assumes you have static serving set up for /demo/staticdocs
      return `/demo/staticdocs/${encodeURIComponent(fileName)}`;
    }
    return {
      answers: paged.map(f => ({
        name: f.name,
        domain: 'static',
        url: getFileUrl(f.name),
        snippet: findSentence(f.content, query),
        favicon: ''
      })),
      html: '',
      islands: [],
      meta: { page, total: flat.length }
    };
  }
};
