const fs = require('fs');
const path = require('path');

// Directory where your music files are stored
const MUSIC_DIR = path.resolve(__dirname, '../music');

// Dummy function to extract metadata (replace with a real parser if needed)
function getAudioMetadata(filename) {
  // Example: "Artist - Track.mp3" or "Artist - Track.flac"
  const base = path.basename(filename, path.extname(filename));
  const [artist, track] = base.split(' - ');
  return {
    artist: artist ? artist.trim() : 'Unknown Artist',
    track: track ? track.trim() : base,
    thumbnail: '/favicon.ico' // Placeholder, replace with real album art if available
  };
}

module.exports = {
  name: 'Music Search',
  description: 'Searches local music files and returns playable results.',
  async search(query) {
    let files = [];
    try {
      files = fs.readdirSync(MUSIC_DIR).filter(f => /\.(mp3|wav|ogg|flac)$/i.test(f));
    } catch (e) {
      return { answers: [], html: '', islands: [], error: 'Music directory not found.' };
    }
    // Simple search: match query in filename
    const matches = files.filter(f => f.toLowerCase().includes(query.toLowerCase()));
    const answers = matches.map((file, i) => {
      const meta = getAudioMetadata(file);
      return {
        name: meta.track,
        domain: meta.artist,
        url: `/music/${encodeURIComponent(file)}`,
        snippet: '',
        favicon: meta.thumbnail
      };
    });
    // Custom HTML for mini audio players in two columns
    const mid = Math.ceil(answers.length / 2);
    const left = answers.slice(0, mid);
    const right = answers.slice(mid);
    // Get the server address from environment or default
    const serverAddress = process.env.NODE_ADDRESS || `http://localhost:${process.env.PORT || 4000}`;
    function player(a) {
      return `<div style="background:#23293a;padding:14px 12px;margin-bottom:18px;display:flex;align-items:center;gap:14px;box-shadow:0 2px 8px #0003;">
        <img src='${a.favicon}' alt='thumb' style='width:48px;height:48px;border-radius:8px;background:#181c24;object-fit:cover;'>
        <div style='flex:1;'>
          <div style='font-size:1.1em;font-weight:bold;color:#7ecfff;'>${a.name}</div>
          <div style='font-size:0.98em;color:#8be9fd;'>${a.domain}</div>
          <audio controls style='width:100%;margin-top:6px;'>
            <source src='${serverAddress}${a.url}' type='audio/mpeg'>
            Your browser does not support the audio element.
          </audio>
        </div>
      </div>`;
    }
    const html = `<div class='results-col' style='flex:1;min-width:0;'>${left.map(player).join('')}</div>`;
    return {
      answers,
      html,
      islands: []
    };
  }
};
