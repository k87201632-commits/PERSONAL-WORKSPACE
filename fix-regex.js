const fs = require('fs');
['js/ai/ai-ui.js', 'js/ai/ai-core.js'].forEach(f => {
    let t = fs.readFileSync(f, 'utf8');
    t = t.replace(/\\\\\\*\\\\\\*/g, '\\*\\*'); // replace \\*\\* with \*\*
    t = t.replace(/\\\\\\*(.*?)\\\\\\*/g, '\\*(.*?)\\*');
    t = t.replace(/\\\\n/g, '\\n');
    fs.writeFileSync(f, t, 'utf8');
});
