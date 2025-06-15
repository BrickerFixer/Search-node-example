# Documentation: Search Node Architecture

## Overview
This node provides a modular backend for federated and local search, supporting multiple search methods ("searchMethods") and interactive result blocks ("islands").

---

## Search Methods
A **search method** is a module in `searchMethods/` that implements a search algorithm, data source, and result formatting. Each method must export:

- `name`: Human-readable name.
- `description`: Short description.
- `supports`: Capabilities (pagination, filters, etc.).
- `async search(query, rankingPreferences)`: Main function. Returns `{ answers, html, islands, meta }`.

### Example: `searchMethods/qwantSearch.js`
- Uses Qwant API for web search.
- Supports pagination, locale, and safesearch filters.
- Integrates islands (misspell, Exposé) for enhanced results.

### Adding a New Search Method
1. Create a new JS file in `searchMethods/`.
2. Export the required fields and a `search` function.
3. Add any user-facing filters to `supports.filters`.
4. The method is auto-discovered by the node.

---

## Islands
An **island** is an interactive result block (e.g., Wikipedia summary, spelling suggestion) in `islands/`.

Each island must export:
- `id`: Unique string.
- `name`: Display name.
- `trigger_type`: How it is triggered ("query", "self", etc.).
- `shouldRender(query)`: Async or sync function to decide if the island should appear.
- `renderIsland(query, params)`: Returns `{ id, name, column, html }` for frontend rendering.
- `column`: Where to display ("main", "supporting").

### Example: `islands/exposeIsland.js`
- Shows Wikipedia summary for the query.
- Always triggers (self).

### Example: `islands/misspellIsland.js`
- Suggests spelling corrections using Datamuse API.
- Only triggers if a suggestion is found.

### Adding a New Island
1. Create a new JS file in `islands/`.
2. Export the required fields and functions.
3. Call `shouldRender` from your search method and, if true, add the result of `renderIsland` to the `islands` array in the search response.

---

## Node Endpoints
- `/health`: Health check.
- `/metadata`: Node and method capabilities, filters, etc.
- `/search`: Main search endpoint. Accepts `{ query, method, rankingPreferences }`.

---

## Result Format
All search methods return:
- `answers`: Array of result objects (name, domain, url, snippet, favicon).
- `html`: Optional custom HTML layout.
- `islands`: Array of rendered islands.
- `meta`: Optional metadata (e.g., current page).

---

## Extending the Node
- Add new search methods or islands as needed.
- Use `supports.filters` to expose user-facing parameters (with `choices` for dropdowns, or `type: string` for free input).
- Islands can be triggered by query, result content, or self (always-on logic).

---

## Node Interconnectivity & Expansion (NOT IMPLEMENTED YET)

The architecture is designed for future expansion to support **interconnected nodes**. This enables nodes to communicate, share data, and collaborate on search and indexing tasks. Potential use cases include:

- **Remote Search:** Query other nodes for additional results or enrichment.
- **Index Sharing:** Share or synchronize index updates between nodes for improved coverage and freshness.
- **Event Listening:** Listen for index changes, new data, or signals from peer nodes.
- **Federated Search:** Aggregate results from multiple nodes, each with its own specialty or dataset.
- **Background Enrichment:** Use remote nodes to fetch or validate extra information in the background.

---

## Example Usage
To add a new search method or island, see the templates in `searchMethods/` and `islands/`.

For more, see the code comments in each file.
