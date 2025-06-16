# Index Search Node

A modular backend for federated and local search, supporting multiple search methods and interactive result blocks ("islands").

## Features
- Modular search methods: Qwant, static documents (Markdown/HTML/PDF/TXT), music, archive.org timeline, and more.
- Interactive islands: Wikipedia summaries, spelling suggestions, music exposé, and custom blocks.
- Extensible: Add new search methods or islands by dropping JS files into `searchMethods/` or `islands/`.
- REST API: `/search`, `/metadata`, `/health` endpoints.
- CORS enabled, static file serving for music and documents.
- Frontend decoupled (bring your own UI).

## Directory Structure
- `searchMethods/` — Pluggable search backends (Qwant, local files, static docs, music, etc.)
- `islands/` — Interactive result blocks (Wikipedia, misspell, music exposé, etc.)
- `demo/staticdocs/` — Example static documents for local search (Markdown, PDF, etc.)
- `music/` — Local music files for music search
- `index.js` — Main server entry point
- `DOCUMENTATION.md` — Full architecture and extension guide

## API Usage
### Health
`GET /health` — Returns node health, timestamp, uptime.

### Metadata
`GET /metadata` — Returns node name, description, features, available search methods, and their capabilities (pagination, filters, etc.).

### Search
`POST /search`
```json
{
  "query": "your search terms",
  "method": "qwantSearch", // or any method in searchMethods/
  "rankingPreferences": { "p": 1, "count": 10, "locale": "en_US", ... }
}
```
Returns:
- `answers`: Array of results (name, domain, url, snippet, favicon)
- `html`: Optional custom HTML layout
- `islands`: Array of interactive blocks (rendered HTML)
- `meta`: Metadata (e.g., current page)

## Adding Search Methods
1. Create a JS file in `searchMethods/` exporting `name`, `description`, `supports`, and an async `search()` function.
2. Use FlexSearch, SQLite, or any backend you want.
3. Expose user-facing filters in `supports.filters`.
4. See `searchMethods/staticDocSearch.js` and `searchMethods/localFileSearch.js` for templates.

## Adding Islands
1. Create a JS file in `islands/` exporting `id`, `name`, `trigger_type`, `shouldRender()`, and `renderIsland()`.
2. See `islands/exposeIsland.js` and `islands/misspellIsland.js` for templates.
3. Call `shouldRender` from your search method and, if true, add the result of `renderIsland` to the `islands` array in the search response.

## Example: Local Static Document Search
- Place `.md`, `.html`, `.pdf`, or `.txt` files in `demo/staticdocs/`.
- Use the `staticDocSearch` method to search their contents (BM25-like ranking).
- Results link directly to the document for download/viewing.

## Example: Music Search
- Place music files in `music/`.
- Use the `musicSearch` method to search and play music files.

## Example: Qwant Search
- Use the `qwantSearch` method for web search via Qwant API.
- Supports pagination, locale, and safesearch filters.
- Integrates islands for spelling suggestions and Wikipedia summaries.

## Extending
- See `DOCUMENTATION.md` for full details on architecture, extension, and future plans (federation, remote search, etc.).
- Add new methods and islands as needed — the node will auto-discover them.

---

**Bring your own frontend!** This node is backend-only and designed to be paired with a custom UI which will be released soon in a github repo of Index.

---

## Credits / Libraries Used
- [FlexSearch](https://github.com/nextapps-de/flexsearch) — Full-text search and BM25-like ranking for local/static document search.
- [node-fetch](https://github.com/node-fetch/node-fetch) — HTTP requests for APIs and islands.
- [jsdom](https://github.com/jsdom/jsdom) — HTML parsing for static document search.
- [pdf-parse](https://github.com/modesty/pdf-parse) — PDF text extraction for static document search.
- [sqlite3](https://github.com/TryGhost/node-sqlite3) — SQLite database support for DB search.
- [Datamuse API](https://www.datamuse.com/api/) — Spelling suggestions for misspell island.
- [Qwant API](https://www.qwant.com/) — Web search results for qwantSearch method.
- [Wikipedia REST API](https://en.wikipedia.org/api/rest_v1/) — Wikipedia summaries for Exposé island.
- [The Project Gutenberg](https://www.gutenberg.org/) — Royalty Free library that provides ebook texts that are used as a demo for static document search.
All other code is original and released under the project license.

## Future plans
- Add expansion based on interconnectivity of nodes.
- Add live reload

---

If you find potential copyright infringement in demo material, write me an email here: brickerfixer@gmail.com