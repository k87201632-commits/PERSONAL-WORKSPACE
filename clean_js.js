const fs = require('fs');
const path = require('path');

const jsDir = "C:\\Users\\ridho\\.gemini\\antigravity\\scratch\\personal-portfolio\\PERSONAL-WORKSPACE\\js";

function cleanJSFile(filename) {
    let filepath = path.join(jsDir, filename);
    if (!fs.existsSync(filepath)) return;
    
    let content = fs.readFileSync(filepath, 'utf-8');
    
    // Remove "deleteTask" and "openCreateModal" and "saveTaskFromForm" etc buttons from templates
    content = content.replace(/<button[^>]*onclick="[^"]*deleteTask[^"]*"[^>]*>[\s\S]*?<\/button>/gi, '');
    content = content.replace(/<button[^>]*onclick="[^"]*openCreateModal[^"]*"[^>]*>[\s\S]*?<\/button>/gi, '');
    content = content.replace(/<button[^>]*onclick="[^"]*openEditModal[^"]*"[^>]*>[\s\S]*?<\/button>/gi, '');
    
    // Remove the functions from the JS code if they exist (naive removal by regex)
    // Actually we can just leave the unused functions to be safe, or just clear out the add/edit/delete task button HTML
    
    fs.writeFileSync(filepath, content, 'utf-8');
    console.log(`Cleaned ${filename}`);
}

['tasks.js', 'subject.js', 'subject-page.js'].forEach(cleanJSFile);
