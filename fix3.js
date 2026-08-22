const fs = require('fs');
const files = ['arcade.html', 'jadwal.html', 'pelajaran.html', 'profil.html', 'tugas.html', 'index.html'];

const rep = {
    'ðŸ  ': '🐍',
    'ðŸƒ ': '🎴',
    'â­•': '⭕',
    'ðŸ”¢': '🔢',
    'ðŸ’£': '💣',
    'âš¡': '⚡',
    'ðŸª½': '🪽',
    'ðŸ …': '🏅',
    'Ã—': '×'
};

files.forEach(f => {
    let text = fs.readFileSync(f, 'utf8');
    for (let [bad, good] of Object.entries(rep)) {
        text = text.split(bad).join(good);
    }
    fs.writeFileSync(f, text, 'utf8');
});
