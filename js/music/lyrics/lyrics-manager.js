// ==========================================================================
// PERSONAL-WORKSPACE — LYRICS MANAGER (LYRICS-MANAGER.JS)
// Mengatur load dan render awal dari baris lirik
// ==========================================================================

class LyricsManager {
    constructor() {
        this.lyrics = [];
        this.panel = null;
    }

    init() {
        this.panel = document.getElementById('lmLyricsPanel');
    }

    async loadLyricsForTrack(trackId) {
        if (!this.panel) this.init();
        if (!this.panel) return;

        this.lyrics = [];
        this.panel.style.display = 'flex';
        this.panel.innerHTML = '<div class="lm-lyrics-placeholder">Mencari lirik...</div>';

        try {
            const lrcText = await window.localMusicDB.getLyrics(trackId);
            if (lrcText && window.lrcParser) {
                this.lyrics = window.lrcParser.parse(lrcText);
                if (this.lyrics.length > 0) {
                    this.render();
                    if (window.lyricsSync) {
                        window.lyricsSync.setLyrics(this.lyrics);
                    }
                    return;
                }
            }
        } catch (e) {
            console.error("Gagal load lirik:", e);
        }

        // Fail / Empty
        this.panel.innerHTML = '<div class="lm-lyrics-placeholder">Tidak ada lirik lokal untuk lagu ini.</div>';
        if (window.lyricsSync) {
            window.lyricsSync.setLyrics([]);
        }
    }

    render() {
        if (!this.panel) return;
        this.panel.innerHTML = '';
        
        // Buat DOM Element untuk setiap lirik
        this.lyrics.forEach((lyric, index) => {
            const div = document.createElement('div');
            div.className = 'lm-lyric-line';
            div.id = `lyric-line-${index}`;
            div.dataset.index = index;
            div.textContent = lyric.text;
            
            // Klik untuk seek
            div.addEventListener('click', () => {
                if (window.localPlayer && window.localPlayer.audio) {
                    window.localPlayer.audio.currentTime = lyric.time;
                }
            });
            
            this.panel.appendChild(div);
        });
    }

    hide() {
        if (this.panel) this.panel.style.display = 'none';
    }
}

window.lyricsManager = new LyricsManager();

document.addEventListener("DOMContentLoaded", () => {
    window.lyricsManager.init();
});
