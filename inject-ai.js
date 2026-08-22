const fs = require('fs');

const cssInjection = `    <link rel="stylesheet" href="css/ai-assistant.css">\n</head>`;
const scriptsInjection = `
    <!-- AI Assistant -->
    <script src="js/ai/ai-service.js"></script>
    <script src="js/ai/ai-context.js"></script>
    <script src="js/ai/ai-ui.js"></script>
    <script src="js/ai/ai-core.js"></script>
    <script src="js/ai/ai-dashboard.js"></script>
</body>`;

const files = ['index.html', 'arcade.html', 'jadwal.html', 'pelajaran.html', 'profil.html', 'tugas.html'];

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    if (!content.includes('ai-assistant.css')) {
        content = content.replace('</head>', cssInjection);
    }
    if (!content.includes('ai-service.js')) {
        content = content.replace('</body>', scriptsInjection);
    }
    fs.writeFileSync(f, content, 'utf8');
});
