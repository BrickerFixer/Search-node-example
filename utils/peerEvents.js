// Peer Event Listener for Index Updates
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

function subscribeToPeers(peers, onUpdate) {
  if (!Array.isArray(peers)) return;
  peers.forEach(peer => {
    if (!peer.url) return;
    // Polling approach (could be replaced with WebSocket or SSE in future)
    setInterval(async () => {
      try {
        const res = await fetch(`${peer.url}/index-updates`);
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.updates)) {
          onUpdate(peer, data.updates);
        }
      } catch (e) {
        // Ignore errors, peer may be offline
      }
    }, peer.pollInterval || 60000); // Default: poll every 60s
  });
}

// Example handler: log updates or trigger local actions
function handlePeerUpdates(peer, updates) {
  // You could merge, log, or trigger local enrichment here
  updates.forEach(update => {
    // Example: log new/changed staticdocs
    if (update.type === 'staticdoc') {
      console.log(`[Peer Update] From ${peer.url}:`, update);
      // Optionally, trigger local enrichment or fetch new files
    }
  });
}

module.exports = { subscribeToPeers, handlePeerUpdates };
