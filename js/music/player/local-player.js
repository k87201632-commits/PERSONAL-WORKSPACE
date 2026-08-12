// ==========================================================================
// PERSONAL-WORKSPACE — LOCAL MUSIC PLAYER (LOCAL-PLAYER.JS)
// Mengelola HTMLAudioElement untuk pemutaran musik lokal
// ==========================================================================

class LocalPlayer {
    constructor() {
        this.audio = new Audio();
        this.currentTrack = null;
        this.queue = [];
        this.isPlaying = false;
        this.isShuffle = false;
        
        // mode: 'all', 'one', 'none'
        this.repeatMode = 'all'; 

        this.bindEvents();
    }

    bindEvents() {
        this.audio.addEventListener('timeupdate', () => this.onTimeUpdate());
        this.audio.addEventListener('ended', () => this.onEnded());
        this.audio.addEventListener('error', (e) => this.onError(e));
        
        this.setupMiniPlayerHijack();
    }

    setupMiniPlayerHijack() {
        const miniQueue = document.getElementById('slMiniQueue');
        if (!miniQueue) {
            setTimeout(() => this.setupMiniPlayerHijack(), 500);
            return;
        }

        const header = document.querySelector('.sl-player-header');
        if (header) {
            this.progressContainer = document.createElement('div');
            this.progressContainer.className = 'lm-progress-container';
            this.progressContainer.id = 'lmProgressContainer';
            
            this.progressBar = document.createElement('div');
            this.progressBar.className = 'lm-progress-bar';
            this.progressBar.id = 'lmProgressBar';
            
            this.progressContainer.appendChild(this.progressBar);
            header.after(this.progressContainer);

            this.progressContainer.addEventListener('click', (e) => {
                const rect = this.progressContainer.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                if (this.audio.duration) {
                    this.audio.currentTime = pos * this.audio.duration;
                }
            });
        }

        this.controlsRow = document.createElement('div');
        this.controlsRow.className = 'lm-controls-row';
        this.controlsRow.id = 'lmControlsRow';
        this.controlsRow.innerHTML = `
            <button class="lm-control-btn" id="lmBtnPrev" title="Previous">⏮</button>
            <button class="lm-control-btn" id="lmBtnPlay" title="Play/Pause">▶</button>
            <button class="lm-control-btn" id="lmBtnNext" title="Next">⏭</button>
            <button class="lm-control-btn" id="lmBtnRepeat" title="Repeat All">🔁</button>
        `;

        miniQueue.after(this.controlsRow);

        document.getElementById('lmBtnPrev').addEventListener('click', () => this.playPrevious());
        document.getElementById('lmBtnPlay').addEventListener('click', () => this.togglePlay());
        document.getElementById('lmBtnNext').addEventListener('click', () => this.playNext());
        
        const btnRepeat = document.getElementById('lmBtnRepeat');
        btnRepeat.addEventListener('click', () => {
            if (this.repeatMode === 'all') {
                this.repeatMode = 'one';
                btnRepeat.textContent = '🔂';
                btnRepeat.title = "Repeat One";
                btnRepeat.classList.add('active-state');
            } else if (this.repeatMode === 'one') {
                this.repeatMode = 'none';
                btnRepeat.textContent = '➡';
                btnRepeat.title = "No Repeat";
                btnRepeat.classList.remove('active-state');
            } else {
                this.repeatMode = 'all';
                btnRepeat.textContent = '🔁';
                btnRepeat.title = "Repeat All";
                btnRepeat.classList.add('active-state');
            }
        });
    }

    onModeActive() {
        const iframeWrapper = document.getElementById('slIframeWrapper');
        if (iframeWrapper) iframeWrapper.style.display = 'none';

        const miniQueue = document.getElementById('slMiniQueue');
        if (miniQueue) miniQueue.style.display = 'none';

        if (this.controlsRow) this.controlsRow.style.display = 'flex';
        if (this.progressContainer) this.progressContainer.style.display = 'block';

        this.updateMiniPlayerHeader();
    }

    onModeInactive() {
        const iframeWrapper = document.getElementById('slIframeWrapper');
        if (iframeWrapper) iframeWrapper.style.display = 'block';

        const miniQueue = document.getElementById('slMiniQueue');
        if (miniQueue) miniQueue.style.display = 'flex';

        if (this.controlsRow) this.controlsRow.style.display = 'none';
        if (this.progressContainer) this.progressContainer.style.display = 'none';

        if (window.spotifyCurrentPlayingId) {
            const lib = typeof spotifyLibraryGet === 'function' ? spotifyLibraryGet() : [];
            const item = lib.find(i => i.id === window.spotifyCurrentPlayingId);
            if (item) {
                const titleEl = document.getElementById('slPlayerTitle');
                if (titleEl) titleEl.textContent = `🎵 ${item.name}`;
            }
        } else {
            const titleEl = document.getElementById('slPlayerTitle');
            if (titleEl) titleEl.textContent = "Tambahkan musik untuk mulai memutar";
        }
    }

    async playTrack(track, queueList = []) {
        if (window.musicController && window.musicController.getMode() !== 'local') {
            window.musicController.setMode('local');
        } else if (typeof this.onModeActive === 'function') {
            this.onModeActive();
        }

        this.currentTrack = track;
        
        if (queueList.length > 0) {
            this.queue = queueList;
        }

        if (this.currentObjectUrl) {
            URL.revokeObjectURL(this.currentObjectUrl);
        }
        
        this.currentObjectUrl = URL.createObjectURL(track.file);
        this.audio.src = this.currentObjectUrl;
        
        try {
            await this.audio.play();
            this.isPlaying = true;
            this.updateMiniPlayerHeader();
            this.updatePlayButton();

            window.dispatchEvent(new CustomEvent('music:played', { detail: { track } }));
            
            if (window.lyricsManager) {
                window.lyricsManager.loadLyricsForTrack(track.id);
            }
        } catch (err) {
            console.error("Local play error:", err);
        }
    }

    togglePlay() {
        if (!this.currentTrack) return;
        
        if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
        } else {
            this.audio.play();
            this.isPlaying = true;
        }
        this.updatePlayButton();
    }

    playNext() {
        if (this.queue.length === 0) {
            this._stopPlayback();
            return;
        }

        let currentIndex = this.queue.findIndex(t => t.id === this.currentTrack?.id);
        let nextIndex = currentIndex + 1;

        if (nextIndex >= this.queue.length) {
            if (this.repeatMode === 'all') {
                nextIndex = 0;
            } else {
                this._stopPlayback();
                return;
            }
        }

        this.playTrack(this.queue[nextIndex], this.queue);
    }

    _stopPlayback() {
        this.isPlaying = false;
        this.updatePlayButton();
    }

    playPrevious() {
        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
            return;
        }

        if (this.queue.length === 0) return;

        let currentIndex = this.queue.findIndex(t => t.id === this.currentTrack?.id);
        let prevIndex = currentIndex - 1;

        if (prevIndex < 0) {
            prevIndex = this.queue.length - 1;
        }

        this.playTrack(this.queue[prevIndex], this.queue);
    }

    onTimeUpdate() {
        if (this.audio.duration && this.progressBar) {
            const percent = (this.audio.currentTime / this.audio.duration) * 100;
            this.progressBar.style.width = `${percent}%`;
        }

        if (window.lyricsSync) {
            window.lyricsSync.sync(this.audio.currentTime);
        }
    }

    onEnded() {
        if (this.repeatMode === 'one') {
            this.audio.currentTime = 0;
            this.audio.play();
            this.isPlaying = true;
            this.updatePlayButton();
            return;
        }

        this.isPlaying = false;
        this.updatePlayButton();
        this.playNext();
    }

    onError(e) {
        console.error("Audio Error:", e);
        if (typeof showToast === 'function') {
            showToast("Gagal memutar file audio lokal.");
        }
    }

    updatePlayButton() {
        const btn = document.getElementById('lmBtnPlay');
        if (btn) {
            btn.textContent = this.isPlaying ? '⏸' : '▶';
        }
    }

    updateMiniPlayerHeader() {
        if (window.musicController && window.musicController.getMode() !== 'local') return;

        const titleEl = document.getElementById('slPlayerTitle');
        if (!titleEl) return;

        if (this.currentTrack) {
            titleEl.textContent = `🎵 ${this.currentTrack.title} - ${this.currentTrack.artist}`;
        } else {
            titleEl.textContent = "Library Lokal Kosong";
        }
    }
}

window.localPlayer = new LocalPlayer();
