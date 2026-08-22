const fs = require('fs');
const files = ['index.html', 'arcade.html', 'jadwal.html', 'pelajaran.html', 'profil.html', 'tugas.html'];

// Since we know the corruption was reading UTF-8 bytes as Windows-1252 and encoding back to UTF-8
function reverseMojibake(str) {
    try {
        // Encode back to latin1 (which matches the raw bytes read originally)
        const bytes = Buffer.from(str, 'utf8').toString('latin1');
        // Decode those bytes as UTF-8
        return Buffer.from(bytes, 'latin1').toString('utf8');
    } catch (e) {
        return str; // If it fails, return original
    }
}

// Alternatively, use direct replacement to be safe since latin1 doesn't perfectly match Windows-1252 0x80-0x9F
const replacements = {
  'â€”': '—',
  'ðŸ•¹ï¸ ': '🕹️',
  'ðŸ•¹': '🕹️',
  'ðŸ‘¤': '👤',
  'â˜€ï¸ ': '☀️',
  'â˜€': '☀️',
  'â–¾': '▾',
  'ðŸŒ™': '🌙',
  'ðŸ‘ ï¸ ': '👁️',
  'ðŸ‘ ': '👁️',
  'â˜°': '☰',
  'ðŸŽ¯': '🎯',
  'â†’': '→',
  'ðŸŽµ': '🎵',
  'Â·': '·',
  'ï¸ ': '' // Remove dangling VS16 if any
};

files.forEach(f => {
    let text = fs.readFileSync(f, 'utf8');
    
    for (const [bad, good] of Object.entries(replacements)) {
        text = text.split(bad).join(good);
    }
    
    // Fix the literal backslash n that was in the <head>
    text = text.replace('<head>\\n', '<head>\n');
    
    fs.writeFileSync(f, text, 'utf8');
    console.log('Fixed ' + f);
});
