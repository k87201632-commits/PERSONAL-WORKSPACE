// ==========================================================================
// PERSONAL-WORKSPACE — MUSIC CONTROLLER (MUSIC-CONTROLLER.JS)
// Mengatur perpindahan mode antara Local dan Spotify
// ==========================================================================

class MusicController {
    constructor() {
        this.currentMode = localStorage.getItem('music_mode') || 'spotify';
    }

    init() {
        // Render initial UI based on saved mode
        this.setMode(this.currentMode);
    }

    setMode(mode) {
        if (mode !== 'local' && mode !== 'spotify') return;
        
        this.currentMode = mode;
        localStorage.setItem('music_mode', mode);

        // Update Button UI
        const btnLocal = document.getElementById('modeLocalBtn');
        const btnSpotify = document.getElementById('modeSpotifyBtn');
        
        if (btnLocal && btnSpotify) {
            btnLocal.classList.toggle('active', mode === 'local');
            btnSpotify.classList.toggle('active', mode === 'spotify');
        }

        // Toggle Containers
        const containerLocal = document.getElementById('localMusicContainer');
        const containerSpotify = document.getElementById('spotifyPlayerContainer');
        
        if (containerLocal) containerLocal.style.display = mode === 'local' ? 'block' : 'none';
        if (containerSpotify) containerSpotify.style.display = mode === 'spotify' ? 'block' : 'none';

        // Notify Players
        if (mode === 'local' && window.localPlayer) {
            window.localPlayer.onModeActive();
        } else if (mode === 'spotify' && typeof initSpotifyPlayer === 'function') {
            // Re-initialize or focus spotify if needed, though mostly it's just CSS switching
            // Mini player is shared, so we need to update it
            if (window.localPlayer) window.localPlayer.onModeInactive();
        }

        this.updateMiniPlayerSource();
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

document.addEventListener("DOMContentLoaded", () => {
    window.musicController.init();
});
