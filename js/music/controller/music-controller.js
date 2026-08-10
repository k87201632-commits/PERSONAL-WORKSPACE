// ==========================================================================
// PERSONAL-WORKSPACE — MUSIC CONTROLLER (MUSIC-CONTROLLER.JS)
// Mengatur perpindahan mode antara Local dan Spotify.
// Mutual exclusion: HANYA SATU sumber audio yang boleh aktif.
// ==========================================================================

class MusicController {
    constructor() {
        this.currentMode = localStorage.getItem('music_mode') || 'spotify';
        this._spotifyInitialized = false;
    }

    init() {
        this.setMode(this.currentMode, { silent: true });
    }

    // -----------------------------------------------------------------------
    // STOP LOCAL — pause HTMLAudioElement dari LocalPlayer
    // -----------------------------------------------------------------------
    stopLocal() {
        if (window.localPlayer) {
            const audio = window.localPlayer.audio;
            if (audio && !audio.paused) {
                audio.pause();
                window.localPlayer.isPlaying = false;
                if (typeof window.localPlayer.updatePlayButton === 'function') {
                    window.localPlayer.updatePlayButton();
                }
            }
            if (typeof window.localPlayer.onModeInactive === 'function') {
                window.localPlayer.onModeInactive();
            }
        }
    }

    // -----------------------------------------------------------------------
    // STOP SPOTIFY — destroy iframe, reset state, allow re-init on next switch
    // -----------------------------------------------------------------------
    stopSpotify() {
        // 1. Blank out the iframe src to stop audio immediately
        const iframeWrapper = document.getElementById('slIframeWrapper');
        if (iframeWrapper) {
            // Remove all iframes inside wrapper to fully stop Spotify audio
            const iframes = iframeWrapper.querySelectorAll('iframe');
            iframes.forEach(iframe => {
                // Navigate to blank to stop audio
                try { iframe.src = 'about:blank'; } catch (e) {}
                // Small delay then remove to prevent ghost audio
                setTimeout(() => {
                    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
                }, 150);
            });
        }

        // 2. Reset Spotify playback state variables (from spotify-player.js globals)
        if (typeof spotifyCurrentPlayingId !== 'undefined') {
            window.spotifyCurrentPlayingId = null;
        }

        // 3. Mark spotify as needing re-init so slPlayItem() creates a fresh iframe
        this._spotifyInitialized = false;
        window._spotifyPlayerNeedsReinit = true;
    }

    // -----------------------------------------------------------------------
    // SET MODE — central switch with mutual exclusion
    // -----------------------------------------------------------------------
    setMode(mode, options = {}) {
        if (mode !== 'local' && mode !== 'spotify') return;

        const previousMode = this.currentMode;
        this.currentMode = mode;
        localStorage.setItem('music_mode', mode);

        // --- MUTUAL EXCLUSION ---
        if (mode === 'local' && previousMode === 'spotify') {
            this.stopSpotify();
        } else if (mode === 'spotify' && previousMode === 'local') {
            this.stopLocal();
        }

        // --- UPDATE BUTTON UI ---
        const btnLocal   = document.getElementById('modeLocalBtn');
        const btnSpotify = document.getElementById('modeSpotifyBtn');

        if (btnLocal && btnSpotify) {
            btnLocal.classList.toggle('active', mode === 'local');
            btnSpotify.classList.toggle('active', mode === 'spotify');
        }

        // --- TOGGLE CONTAINERS ---
        const containerLocal   = document.getElementById('localMusicContainer');
        const containerSpotify = document.getElementById('spotifyPlayerContainer');

        if (containerLocal)   containerLocal.style.display   = mode === 'local'   ? 'block' : 'none';
        if (containerSpotify) containerSpotify.style.display = mode === 'spotify' ? 'block' : 'none';

        // --- NOTIFY PLAYERS ---
        if (mode === 'local' && window.localPlayer) {
            window.localPlayer.onModeActive();
        }

        if (mode === 'spotify') {
            // Re-initialize Spotify if it was stopped or first load
            if (window._spotifyPlayerNeedsReinit || !this._spotifyInitialized) {
                this._reinitSpotify();
            }
        }

        this.updateMiniPlayerSource();
    }

    // -----------------------------------------------------------------------
    // REINIT SPOTIFY — safely re-initialize after being stopped
    // -----------------------------------------------------------------------
    _reinitSpotify() {
        const container = document.getElementById('spotifyPlayerContainer');
        if (!container) return;

        // Reset init flag so initSpotifyPlayer() will rebuild
        delete container.dataset.slInit;

        if (typeof initSpotifyPlayer === 'function') {
            initSpotifyPlayer();
            this._spotifyInitialized = true;
            window._spotifyPlayerNeedsReinit = false;
        }
    }

    getMode() {
        return this.currentMode;
    }

    updateMiniPlayerSource() {
        const badge = document.querySelector('.sl-player-header-badge');
        if (!badge) return;

        if (this.currentMode === 'local') {
            badge.textContent = 'LOCAL';
            badge.classList.add('local-badge');
        } else {
            badge.textContent = 'SPOTIFY';
            badge.classList.remove('local-badge');
        }
    }
}

// Global instance
window.musicController = new MusicController();

document.addEventListener('DOMContentLoaded', () => {
    window.musicController.init();
});
