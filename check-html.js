const fs = require('fs');
['index.html', 'arcade.html', 'jadwal.html', 'pelajaran.html', 'profil.html', 'tugas.html'].forEach(f => {
    let t = fs.readFileSync(f, 'utf8');
    const lines = t.split('\n');
    const lastLines = lines.slice(-20).join('\n');
    console.log('--- ' + f + ' ---');
    console.log(lastLines);
});
