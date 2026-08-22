const fs = require('fs');
const text = fs.readFileSync('arcade.html', 'utf8');
const match = text.match(/<div class="arcade-game-icon">([^<]+)<\/div>\s*<div class="arcade-game-name\">Snake<\/div>/);
if (match) {
    const str = match[1];
    console.log('Snake icon length:', str.length);
    for (let i=0; i<str.length; i++) {
        console.log(str.charCodeAt(i).toString(16));
    }
}
