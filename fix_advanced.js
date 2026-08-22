const fs = require('fs');

// Reverse mapping for Windows-1252
const win1252Rev = {
    0x20AC: 0x80,
    0x201A: 0x82,
    0x0192: 0x83,
    0x201E: 0x84,
    0x2026: 0x85,
    0x2020: 0x86,
    0x2021: 0x87,
    0x02C6: 0x88,
    0x2030: 0x89,
    0x0160: 0x8A,
    0x2039: 0x8B,
    0x0152: 0x8C,
    0x017D: 0x8E,
    0x2018: 0x91,
    0x2019: 0x92,
    0x201C: 0x93,
    0x201D: 0x94,
    0x2022: 0x95,
    0x2013: 0x96,
    0x2014: 0x97,
    0x02DC: 0x98,
    0x2122: 0x99,
    0x0161: 0x9A,
    0x203A: 0x9B,
    0x0153: 0x9C,
    0x017E: 0x9E,
    0x0178: 0x9F
};

function unmojibake(str) {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        if (code <= 0xFF) {
            bytes.push(code);
        } else if (win1252Rev[code] !== undefined) {
            bytes.push(win1252Rev[code]);
        } else {
            // It's a genuine unicode character that wasn't mojibaked, or we missed it.
            // But wait, if there are genuine unicode chars, we shouldn't ruin them.
            // Actually, we should just extract the bytes and decode as utf8.
            // If there's genuine unicode, it means this file wasn't fully mojibaked?
            // Since it was read as ANSI, ALL characters are <= 0xFF OR in the win1252Rev map.
            // If we find something else, it's not from the mojibake.
            bytes.push(code); 
        }
    }
    
    // Convert bytes back to string using utf8
    return Buffer.from(bytes).toString('utf8');
}

const files = ['index.html', 'arcade.html', 'jadwal.html', 'pelajaran.html', 'profil.html', 'tugas.html'];

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    
    // ONLY replace chunks of text that match the corrupted emojis.
    // We shouldn't run the whole file through unmojibake because normal characters like '—' 
    // might have already been fixed or we might corrupt real UTF-8 characters if any were preserved.
    // Wait, since I already ran a script that fixed some of the file, it is now a mix of UTF-8 and mojibake!
    
    // So let's just find the specific patterns for the arcade emojis.
    // We know they start with \u00F0 (ð)
    
    // A corrupted emoji is typically 4 bytes starting with F0 9F.
    // F0 is 0xF0 (ð). 9F is mapped to 0x178 (Ÿ).
    const regex = /\u00F0\u0178[\u0000-\u00FF\u0152-\u2122]{2}/g;
    
    content = content.replace(regex, (match) => {
        return unmojibake(match);
    });
    
    // There are also 3-byte emojis (like ⭕, ⚡)
    // E.g., ⭕ is E2 AD 95. 
    // E2 is 0xE2 (â).
    // Let's replace any 3-byte sequence starting with E2 (â)
    const regex3 = /\u00E2[\u0000-\u00FF\u0152-\u2122]{2}/g;
    content = content.replace(regex3, (match) => {
        // Only decode if it actually forms a valid utf8 emoji
        const decoded = unmojibake(match);
        if (decoded.length < match.length) { // successful decode means fewer characters
            return decoded;
        }
        return match;
    });

    // Replace the achievement medal (🏅 U+1F3C5: F0 9F 8F 85)
    
    fs.writeFileSync(f, content, 'utf8');
    console.log('Fixed', f);
});
