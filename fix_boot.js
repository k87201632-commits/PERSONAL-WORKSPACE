const fs = require('fs');
const files = ['index.html', 'arcade.html', 'jadwal.html', 'pelajaran.html', 'profil.html', 'tugas.html'];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    if (!content.includes('boot-loading')) {
        content = content.replace(/<head>/i, '<head>\\n    <script>document.documentElement.classList.add("boot-loading");</script>');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log("Updated " + file);
    }
});
