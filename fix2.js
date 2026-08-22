const fs = require('fs');
const files = ['index.html', 'arcade.html', 'jadwal.html', 'pelajaran.html', 'profil.html', 'tugas.html'];
files.forEach(f => {
    let text = fs.readFileSync(f, 'utf8');
    text = text.replace(/🕹️ï¸ /g, '🕹️');
    text = text.replace(/☀️ï¸ /g, '☀️');
    text = text.replace(/👁️ï¸ /g, '👁️');
    text = text.replace(/ï¸ /g, '');
    fs.writeFileSync(f, text, 'utf8');
});
