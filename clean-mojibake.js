const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            if (f !== 'node_modules' && f !== '.git') {
                walkDir(dirPath, callback);
            }
        } else {
            callback(dirPath);
        }
    });
}

const badSequence1 = String.fromCharCode(0xEF, 0xB8, 0x8F); // The raw corrupted bytes
const badSequence2 = ""; // The text representation
const badSequence3 = "\x8F"; 

let filesFixed = 0;

walkDir('.', (filePath) => {
    if (filePath.endsWith('.html') || filePath.endsWith('.js') || filePath.endsWith('.css')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        
        // Remove the exact bad bytes globally
        // Also remove U+00EF U+00B8 U+008F literally if parsed as UTF-8
        content = content.replace(new RegExp(badSequence1, 'g'), '');
        content = content.replace(new RegExp(badSequence2, 'g'), '');
        content = content.replace(/\u00ef\u00b8\u008f/g, ''); // literal unicode points
        
        // Also cleanup any "" literal strings
        content = content.replace(//g, '');

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Cleaned up mojibake in ${filePath}`);
            filesFixed++;
        }
    }
});

console.log(`Cleanup complete. Fixed ${filesFixed} files.`);
