const fs = require('fs');
const glob = require('fs').readdirSync('.');

const htmlFiles = glob.filter(file => file.endsWith('.html'));

const headInjection = '    <link rel="stylesheet" href="css/loading.css">\n</head>';
const scriptsInjection = `    <!-- Contextual Loading System -->
    <script src="js/loading/loading-messages.js"></script>
    <script src="js/loading/loading-manager.js"></script>
    <script src="js/loading-screen.js"></script>
    <script src="js/page-transition.js"></script>`;

htmlFiles.forEach(file => {
    if (file === 'index.html') return; // already did CSS for index.html, need to do script though
    let content = fs.readFileSync(file, 'utf-8');
    let modified = false;

    // 1. Inject CSS
    if (!content.includes('css/loading.css')) {
        content = content.replace('</head>', headInjection);
        modified = true;
    }

    // 2. Inject Scripts
    if (!content.includes('js/loading/loading-manager.js')) {
        if (content.includes('<script src="js/page-transition.js"></script>')) {
            content = content.replace(
                '<script src="js/page-transition.js"></script>',
                scriptsInjection
            );
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(file, content, 'utf-8');
        console.log('Updated ' + file);
    }
});

// For index.html, script specifically:
let indexContent = fs.readFileSync('index.html', 'utf-8');
if (!indexContent.includes('js/loading/loading-manager.js')) {
    indexContent = indexContent.replace(
        '<script src="js/loading-screen.js"></script>',
        ''
    ).replace(
        '<script src="js/page-transition.js"></script>',
        scriptsInjection
    );
    fs.writeFileSync('index.html', indexContent, 'utf-8');
    console.log('Updated index.html scripts');
}
