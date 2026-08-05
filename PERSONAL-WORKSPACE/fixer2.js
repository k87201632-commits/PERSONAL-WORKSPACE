const fs = require('fs');
const path = require('path');

const workspaceDir = "C:\\Users\\ridho\\.gemini\\antigravity\\scratch\\personal-portfolio\\PERSONAL-WORKSPACE";

function walkSync(dir) {
    let files = fs.readdirSync(dir);
    files.forEach(function(file) {
        let filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            walkSync(filepath);
        } else if (file.endsWith('.html')) {
            let content = fs.readFileSync(filepath, 'utf-8');
            content = content.replace(/<script src="\.\.\/data\/music\.js"><\/script>\s*/g, '');
            content = content.replace(/<script src="\.\.\/js\/music-player\.js"><\/script>\s*/g, '');
            content = content.replace(/<div[^>]*id="musicPlayerContainer"[^>]*>[\s\S]*?<\/div>/gi, '');
            fs.writeFileSync(filepath, content, 'utf-8');
        }
    });
}
walkSync(workspaceDir);
