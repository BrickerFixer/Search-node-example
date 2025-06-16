const { collectAllowedIslands } = require('../utils/islandHelpers');

let fetchFn;
try {
  fetchFn = fetch;
} catch (e) {
  fetchFn = require('node-fetch');
}

module.exports = {
  name: 'Archive.org Timeline',
  description: 'Shows a timeline of snapshots for a given domain or URL using the Internet Archive.',
  supports: {
    pagination: false,
    filters: [] // No user-facing filters for this method
  },
  allowedIslands: [], // Only these islands will be considered
  async search(query, rankingPreferences) {
    // Check if query is a domain or URL
    let url, domain;
    try {
      if (/^https?:\/\//i.test(query)) {
        url = new URL(query);
        domain = url.hostname;
      } else if (/^[\w.-]+\.[a-z]{2,}$/i.test(query)) {
        domain = query.trim();
        url = new URL('http://' + domain);
      } else {
        return {
          answers: [],
          html: '',
          islands: [],
          error: 'Please enter a valid domain name or website URL.'
        };
      }
    } catch (e) {
      return {
        answers: [],
        html: '',
        islands: [],
        error: 'Please enter a valid domain name or website URL.'
      };
    }

    // Query the Wayback Machine CDX API for snapshot years
    const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(domain)}&output=json&fl=timestamp,original&collapse=year`;
    let snapshots = [];
    try {
      const resp = await fetchFn(cdxUrl);
      if (!resp.ok) throw new Error('Archive.org API error');
      const data = await resp.json();
      // data[0] is header, rest are [timestamp, original]
      snapshots = data.slice(1).map(row => ({
        year: row[0].slice(0, 4),
        timestamp: row[0],
        url: `https://web.archive.org/web/${row[0]}/${row[1]}`
      }));
    } catch (e) {
      return {
        answers: [],
        html: '',
        islands: [],
        error: e.message
      };
    }

    // Query the Wayback Machine Availability API for the closest snapshot
    const availUrl = `https://archive.org/wayback/available?url=${encodeURIComponent(domain)}`;
    let closest = null;
    try {
      const resp = await fetchFn(availUrl);
      if (!resp.ok) throw new Error('Archive.org API error');
      const data = await resp.json();
      if (data.archived_snapshots && data.archived_snapshots.closest && data.archived_snapshots.closest.available) {
        closest = data.archived_snapshots.closest;
      }
    } catch (e) {
      // Ignore, just don't show closest snapshot
    }

    // Timeline HTML
    const html = `
      <div style="background:#181c24;color:#e0e6f0;border-radius:14px;box-shadow:0 4px 32px #0008;padding:32px 24px 24px 24px;max-width:700px;margin:32px auto;font-family:'Fira Mono','JetBrains Mono','Consolas',monospace;">
        <div style="font-size:1.4em;font-weight:bold;margin-bottom:18px;">Archive.org Timeline for <span style='color:#7ecfff;'>${domain}</span></div>
        ${closest ? `<div style='margin-bottom:18px;'>
          <span style='color:#7ecfff;'>Closest snapshot:</span> <a href="${closest.url}" target="_blank" style="color:#7ecfff;text-decoration:underline;">${closest.timestamp}</a>
        </div>` : ''}
        <div style="display:flex;flex-wrap:wrap;gap:12px 18px;align-items:center;">
          ${snapshots.map(s => `
            <a href="${s.url}" target="_blank" style="display:inline-block;background:#23293a;padding:8px 14px;border-radius:8px;color:#7ecfff;text-decoration:none;font-weight:bold;box-shadow:0 2px 8px #0003;transition:background 0.2s;">${s.year}</a>
          `).join('')}
        </div>
        <div style="margin-top:18px;font-size:0.98em;color:#b3b8c5;">Click a year to view a snapshot in the Wayback Machine.</div>
      </div>
    `;
    const islands = await collectAllowedIslands(query, this.allowedIslands);
    return {
      answers: [],
      html,
      islands,
      meta: { special: true }
    };
  }
};
