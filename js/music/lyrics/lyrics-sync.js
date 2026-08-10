// ==========================================================================
// PERSONAL-WORKSPACE — LYRICS SYNC (LYRICS-SYNC.JS)
// Sinkronisasi realtime waktu lirik dengan pemutaran audio
// ==========================================================================

class LyricsSync {
    constructor() {
        this.lyrics = [];
        this.currentIndex = -1;
        this.panel = null;
    }

    init() {
        this.panel = document.getElementById('lmLyricsPanel');
    }

    setLyrics(lyricsArray) {
        this.lyrics = lyricsArray;
        this.currentIndex = -1;
    }

    sync(currentTime) {
        if (!this.lyrics || this.lyrics.length === 0) return;
        if (!this.panel) this.init();

        // Cari baris lirik aktif
        let activeIndex = -1;
        for (let i = 0; i < this.lyrics.length; i++) {
            if (currentTime >= this.lyrics[i].time) {
                activeIndex = i;
            } else {
                break;
            }
        }

        // Jika berubah
        if (activeIndex !== this.currentIndex && activeIndex !== -1) {
            // Hapus class active dari yang sebelumnya
            if (this.currentIndex !== -1) {
                const prevEl = document.getElementById(`lyric-line-${this.currentIndex}`);
                if (prevEl) {
                    prevEl.classList.remove('active');
                    prevEl.classList.add('past');
                }
            }

            // Tambah class active ke yang sekarang
            this.currentIndex = activeIndex;
            const currentEl = document.getElementById(`lyric-line-${this.currentIndex}`);
            
            if (currentEl) {
                currentEl.classList.add('active');
                currentEl.classList.remove('past');
                
                // Auto scroll agar lirik ada di tengah
                this.scrollToActive(currentEl);
            }
        }
    }

    scrollToActive(element) {
        if (!this.panel || !element) return;
        const panelHeight = this.panel.clientHeight;
        const elementOffset = element.offsetTop;
        const elementHeight = element.clientHeight;

        // Hitung posisi scroll: Top Element - Setengah Tinggi Panel + Setengah Tinggi Element
        const scrollPos = elementOffset - (panelHeight / 2) + (elementHeight / 2);
        
        this.panel.scrollTo({
            top: Math.max(0, scrollPos),
            behavior: 'smooth'
        });
    }
}

window.lyricsSync = new LyricsSync();

document.addEventListener("DOMContentLoaded", () => {
    window.lyricsSync.init();
});
