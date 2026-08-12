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
        
        // Bind to global player controls when local mode is active
        // But since we share the mini player, we'll inject/hijack its buttons
        this.setupMiniPlayerHijack();
    }

    setupMiniPlayerHijack() {
        // We will create our own control row inside the mini player that is only visible in Local mode
        const miniQueue = document.getElementById('slMiniQueue');
        if (!miniQueue) {
            // Wait for it
            setTimeout(() => this.setupMiniPlayerHijack(), 500);
            return;
        }

        // Add Progress Bar
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

        // Add Controls
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
        // Hide spotify iframe, show our controls
        const iframeWrapper = document.getElementById('slIframeWrapper');
        if (iframeWrapper) iframeWrapper.style.display = 'none';

        const miniQueue = document.getElementById('slMiniQueue');
        if (miniQueue) miniQueue.style.display = 'none';

        if (this.controlsRow) this.controlsRow.style.display = 'flex';
        if (this.progressContainer) this.progressContainer.style.display = 'block';

        // Show visualizer
        const visWrapper = document.getElementById('lmVisualizerWrapper');
        if (visWrapper) visWrapper.style.display = 'block';

        this.updateMiniPlayerHeader();
    }

    onModeInactive() {
        const iframeWrapper = document.getElementById('slIframeWrapper');
        if (iframeWrapper) iframeWrapper.style.display = 'block';

        const miniQueue = document.getElementById('slMiniQueue');
        if (miniQueue) miniQueue.style.display = 'flex';

        if (this.controlsRow) this.controlsRow.style.display = 'none';
        if (this.progressContainer) this.progressContainer.style.display = 'none';

        // Hide & pause visualizer when switching to Spotify
        const visWrapper = document.getElementById('lmVisualizerWrapper');
        if (visWrapper) visWrapper.style.display = 'none';
        if (window.musicVisualizer) window.musicVisualizer.stop();

        // Restore Spotify Title if it exists
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
        this.currentTrack = track;
        
        // Build queue
        if (queueList.length > 0) {
            this.queue = queueList;
        }

        // Create object URL from Blob
        if (this.currentObjectUrl) {
            URL.revokeObjectURL(this.currentObjectUrl);
        }
        
        this.currentObjectUrl = URL.createObjectURL(track.file);
        this.audio.src = this.currentObjectUrl;
        
        try {
            // Init visualizer (safe — only creates AudioContext once)
            if (window.musicVisualizer) {
                window.musicVisualizer.init(this.audio);
            }

            await this.audio.play();
            this.isPlaying = true;
            this.updateMiniPlayerHeader();
            this.updatePlayButton();

            // Start visualizer
            if (window.musicVisualizer) {
                window.musicVisualizer.start();
            }

            // Dispatch event for gamification
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
            if (window.musicVisualizer) window.musicVisualizer.pause();
        } else {
            this.audio.play();
            this.isPlaying = true;
            if (window.musicVisualizer) window.musicVisualizer.start();
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
        if (window.musicVisualizer) window.musicVisualizer.stop();
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
            prevIndex = this.queue.length - 1; // loop to back
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
