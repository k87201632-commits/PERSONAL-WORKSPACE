const fs = require('fs');
const files = ['index.html', 'arcade.html', 'jadwal.html', 'pelajaran.html', 'profil.html', 'tugas.html'];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    if (!content.includes('css/loading.css')) {
        content = content.replace('</head>', '    <link rel="stylesheet" href="css/loading.css">\\n</head>');
        changed = true;
    }

    if (!content.includes('js/loading/loading-manager.js')) {
        if (file === 'index.html') {
            content = content.replace(/<script src="js\\/loading-screen\\.js"><\\/script>\\s*/, '');
        }
        
        let toInject = 
\`    <!-- Contextual Loading System -->
    <script src="js/loading/loading-messages.js"></script>
    <script src="js/loading/loading-manager.js"></script>
    <script src="js/loading-screen.js"></script>
    <script src="js/page-transition.js"></script>\`;

        content = content.replace('<script src="js/page-transition.js"></script>', toInject);
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log("Updated " + file);
    }
});
