// ==========================================================================
// PERSONAL-WORKSPACE — LRC PARSER (LRC-PARSER.JS)
// Parse format teks LRC menjadi array of objects { time, text }
// ==========================================================================

class LrcParser {
    static parse(lrcText) {
        if (!lrcText || typeof lrcText !== 'string') return [];
        
        const lines = lrcText.split('\n');
        const lyricsArray = [];
        
        // Match [mm:ss.xx] or [mm:ss.xxx]
        const timeRegex = /\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?\]/g;
        
        lines.forEach(line => {
            line = line.trim();
            if (!line) return;
            
            let match;
            const timestamps = [];
            
            // Extract all timestamps in the line (some lines have multiple timestamps)
            while ((match = timeRegex.exec(line)) !== null) {
                const minutes = parseInt(match[1], 10);
                const seconds = parseInt(match[2], 10);
                let milliseconds = 0;
                
                if (match[3]) {
                    // if .xx, multiply by 10. if .xxx, keep as is
                    milliseconds = parseInt(match[3], 10);
                    if (match[3].length === 2) {
                        milliseconds *= 10; 
                    }
                }
                
                const totalTimeInSeconds = (minutes * 60) + seconds + (milliseconds / 1000);
                timestamps.push(totalTimeInSeconds);
            }
            
            // Text is whatever remains after removing all timestamps
            const text = line.replace(timeRegex, '').trim();
            
            // If it's just metadata like [ar:Artist], timestamps will be empty
            if (timestamps.length > 0 && text) {
                timestamps.forEach(time => {
                    lyricsArray.push({ time, text });
                });
            }
        });
        
        // Sort by time
        lyricsArray.sort((a, b) => a.time - b.time);
        
        return lyricsArray;
    }
}

window.lrcParser = LrcParser;
