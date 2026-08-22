const fs = require('fs');
['js/ai/ai-ui.js', 'js/ai/ai-core.js', 'js/ai/ai-context.js', 'js/ai/ai-service.js', 'js/ai/ai-dashboard.js'].forEach(f => {
    let t = fs.readFileSync(f, 'utf8');
    t = t.replace(/\\`/g, '`');
    fs.writeFileSync(f, t, 'utf8');
});
