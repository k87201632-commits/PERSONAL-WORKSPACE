const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

let hasError = false;
walkDir('js', (filePath) => {
    if (filePath.endsWith('.js')) {
        try {
            execSync(`node -c "${filePath}"`);
        } catch (e) {
            console.error(`Syntax error in ${filePath}:`, e.message);
            hasError = true;
        }
    }
});

if (!hasError) {
    console.log("All JS files have valid syntax!");
}
