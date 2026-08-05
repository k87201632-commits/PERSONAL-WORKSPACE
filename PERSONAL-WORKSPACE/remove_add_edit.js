const fs = require('fs');
const path = require('path');

const targetDir = 'C:\\Users\\ridho\\.gemini\\antigravity\\scratch\\personal-portfolio\\PERSONAL-WORKSPACE';

function processFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');
    let original = content;

    content = content.replace(/<button[^>]*onclick="window\.subjectPage\.openCreateModal\(\)"[^>]*>[\s\S]*?Tambah\s*Tugas[\s\S]*?<\/button>/gi, '');
    content = content.replace(/<a[^>]*href="tugas\.html"[^>]*>[\s\S]*?Tambah\s*Tugas[\s\S]*?<\/a>/gi, '');
    content = content.replace(/<button[^>]*onclick="window\.tasksManager\.openCreateModal\(\)"[^>]*>[\s\S]*?Tambah\s*Tugas[\s\S]*?<\/button>/gi, '');
    content = content.replace(/<button[^>]*onclick="window\.subjectPage\.openEditModal[^>]*>[\s\S]*?<\/button>/gi, '');
    content = content.replace(/<button[^>]*onclick="window\.subjectPage\.deleteTask[^>]*>[\s\S]*?<\/button>/gi, '');
    content = content.replace(/<button[^>]*onclick="window\.tasksManager\.openEditModal[^>]*>[\s\S]*?<\/button>/gi, '');
    content = content.replace(/<button[^>]*onclick="window\.tasksManager\.deleteTask[^>]*>[\s\S]*?<\/button>/gi, '');

    if (content !== original) {
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`Updated: ${filepath}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else {
            if (fullPath.endsWith('.html') || fullPath.endsWith('.js')) {
                processFile(fullPath);
            }
        }
    }
}

walkDir(targetDir);
