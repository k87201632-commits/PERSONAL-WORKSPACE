// ==========================================================================
// PERSONAL-WORKSPACE — LOCAL MUSIC LIBRARY (LOCAL-LIBRARY.JS)
// Menangani UI Library Lokal, Drag & Drop, dan File Metadata.
// Dengan integrasi keamanan PIN (music-security.js).
// ==========================================================================

class LocalLibrary {
    constructor() {
        this.container = null;
        this.tracks = [];
    }

    async init() {
        this.container = document.getElementById('localMusicContainer');
        if (!this.container) return;

        this.buildUI();
        await this.loadTracks();
        this._bindSecurityEvents();
    }

    // -----------------------------------------------------------------------
    // BUILD UI
    // -----------------------------------------------------------------------
    buildUI() {
        this.container.innerHTML = `
            <!-- Security Banner (shown when locked) -->
            <div class="lm-security-banner" id="lmSecurityBanner">
                <div class="lm-security-banner-content">
                    <span class="lm-security-icon">🔒</span>
                    <div>
                        <div class="lm-security-title">Library Terkunci</div>
                        <div class="lm-security-desc">Drop file & hapus musik dinonaktifkan</div>
                    </div>
                </div>
                <button class="lm-security-unlock-btn" id="lmUnlockBtn" type="button">
                    🔓 Buka Kunci
                </button>
            </div>

            <!-- Unlocked Bar (shown when unlocked) -->
            <div class="lm-unlocked-bar" id="lmUnlockedBar" style="display:none;">
                <span class="lm-unlocked-icon">🔓</span>
                <span class="lm-unlocked-label">Library Terbuka</span>
                <button class="lm-lock-btn" id="lmLockBtn" type="button">🔒 Kunci</button>
            </div>

            <!-- Drop Zone (disabled when locked) -->
            <div class="lm-drop-zone" id="lmDropZone">
                <span class="lm-drop-icon">📂</span>
                <div class="lm-drop-title">Drop Music &amp; Lyrics Here</div>
                <div class="lm-drop-subtitle">Support MP3, WAV, OGG, LRC (Max 50MB per file)</div>
                <input type="file" id="lmFileInput" class="lm-file-input" multiple accept="audio/*,.lrc" />
                <div class="lm-drop-lock-overlay" id="lmDropLockOverlay">
                    <span>🔒 Buka kunci untuk menambah musik</span>
                </div>
            </div>

            <div class="lm-library-section">
                <div class="lm-library-header">
                    <div class="lm-library-title-row">
                        <span class="sl-library-title">📁 Local Library</span>
                        <span class="sl-library-count" id="lmLibraryCount">0</span>
                    </div>
                    <div>
                        <button id="lmClearAllBtn" class="sl-clear-all-btn" style="display:none;">Hapus Semua</button>
                    </div>
                </div>

                <!-- Lyrics panel -->
                <div class="lm-lyrics-panel" id="lmLyricsPanel" style="display: none;">
                    <div class="lm-lyrics-placeholder">Lirik akan muncul di sini jika ada file .lrc</div>
                </div>

                <div class="lm-list-container">
                    <ul class="sl-library-list" id="lmTrackList"></ul>
                </div>
            </div>
        `;

        this.bindEvents();
        this._updateSecurityUI();
    }

    // -----------------------------------------------------------------------
    // SECURITY UI UPDATE
    // -----------------------------------------------------------------------
    _updateSecurityUI() {
        const locked = window.musicSecurity ? window.musicSecurity.isLocked() : true;
        const banner   = document.getElementById('lmSecurityBanner');
        const unlockedBar = document.getElementById('lmUnlockedBar');
        const dropZone = document.getElementById('lmDropZone');
        const lockOverlay = document.getElementById('lmDropLockOverlay');
        const clearBtn = document.getElementById('lmClearAllBtn');

        if (locked) {
            if (banner)     banner.style.display = 'flex';
            if (unlockedBar) unlockedBar.style.display = 'none';
            if (dropZone)   dropZone.classList.add('lm-drop-zone-locked');
            if (lockOverlay) lockOverlay.style.display = 'flex';
            if (clearBtn)   clearBtn.style.display = 'none';
        } else {
            if (banner)     banner.style.display = 'none';
            if (unlockedBar) unlockedBar.style.display = 'flex';
            if (dropZone)   dropZone.classList.remove('lm-drop-zone-locked');
            if (lockOverlay) lockOverlay.style.display = 'none';
            if (clearBtn && this.tracks.length > 0) clearBtn.style.display = 'inline-block';
        }

        // Re-render to update delete button states
        this.renderTracks();
    }

    _bindSecurityEvents() {
        document.addEventListener('musicLibraryUnlocked', () => {
            this._updateSecurityUI();
        });
        document.addEventListener('musicLibraryLocked', () => {
            this._updateSecurityUI();
        });
    }

    // -----------------------------------------------------------------------
    // BIND EVENTS
    // -----------------------------------------------------------------------
    bindEvents() {
        const dropZone  = document.getElementById('lmDropZone');
        const fileInput = document.getElementById('lmFileInput');
        const lockOverlay = document.getElementById('lmDropLockOverlay');
        const clearBtn  = document.getElementById('lmClearAllBtn');
        const unlockBtn = document.getElementById('lmUnlockBtn');
        const lockBtn   = document.getElementById('lmLockBtn');

        // Unlock button
        if (unlockBtn) {
            unlockBtn.addEventListener('click', () => {
                if (window.musicSecurity) window.musicSecurity.promptUnlock();
            });
        }

        // Lock button
        if (lockBtn) {
            lockBtn.addEventListener('click', () => {
                if (window.musicSecurity) window.musicSecurity.lock();
            });
        }
        
        // Lock Overlay click (for File Picker)
        if (lockOverlay) {
            lockOverlay.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.musicSecurity) {
                    window.musicSecurity.promptUnlock(() => {
                        if (fileInput) fileInput.click();
                    });
                }
            });
        }

        // Drag & Drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-active');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-active');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-active');

            if (e.dataTransfer.files.length > 0) {
                if (window.musicSecurity) {
                    window.musicSecurity.promptUnlock(() => {
                        this.handleFiles(e.dataTransfer.files);
                    });
                } else {
                    this.handleFiles(e.dataTransfer.files);
                }
            }
        });

        // File Input
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                if (window.musicSecurity) {
                    window.musicSecurity.promptUnlock(() => {
                        this.handleFiles(e.target.files);
                        fileInput.value = ''; // Reset input after processing
                    });
                } else {
                    this.handleFiles(e.target.files);
                    fileInput.value = '';
                }
            }
        });

        // Clear All
        clearBtn.addEventListener('click', () => {
            this._safeClearLibrary();
        });
    }

    async _safeClearLibrary() {
        if (window.musicSecurity) {
            window.musicSecurity.promptUnlock(async () => {
                this._executeClearLibrary();
            });
        } else {
            this._executeClearLibrary();
        }
    }

    async _executeClearLibrary() {
        if (confirm('Hapus seluruh musik lokal?')) {
            await window.localMusicDB.clearTracks();
            this.tracks = [];
            this.renderTracks();
            this._updateSecurityUI();
        }
    }
    
    async _safeDeleteTrack(track) {
        if (window.musicSecurity) {
            window.musicSecurity.promptUnlock(async () => {
                this._executeDeleteTrack(track);
            });
        } else {
            this._executeDeleteTrack(track);
        }
    }
    
    async _executeDeleteTrack(track) {
        if (confirm(`Hapus "${track.title}"?`)) {
            await window.localMusicDB.deleteTrack(track.id);
            this.tracks = this.tracks.filter(t => t.id !== track.id);
            this.renderTracks();
            this._updateSecurityUI();
        }
    }

    // -----------------------------------------------------------------------
    // LOAD TRACKS
    // -----------------------------------------------------------------------
    async loadTracks() {
        try {
            this.tracks = await window.localMusicDB.getAllTracks();
            this.renderTracks();
        } catch (e) {
            console.error('Gagal meload local tracks', e);
        }
    }

    // -----------------------------------------------------------------------
    // HANDLE FILES
    // -----------------------------------------------------------------------
    async handleFiles(files) {
        let audioFiles = [];
        let lrcFiles   = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const ext  = file.name.split('.').pop().toLowerCase();

            if (file.type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
                audioFiles.push(file);
            } else if (ext === 'lrc') {
                lrcFiles.push(file);
            }
        }

        for (const file of audioFiles) {
            const isDuplicate = this.tracks.some(
                t => t.file.name === file.name && t.file.size === file.size
            );
            if (isDuplicate) {
                console.log(`Skipped duplicate: ${file.name}`);
                continue;
            }

            try {
                const metadata = await this.readMetadata(file);
                const track = {
                    id: 'lm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
                    title:        metadata.title,
                    artist:       metadata.artist,
                    album:        metadata.album,
                    coverDataUrl: metadata.coverDataUrl,
                    file:         file,
                    createdAt:    new Date().toISOString()
                };

                await window.localMusicDB.addTrack(track);
                this.tracks.unshift(track);
            } catch (e) {
                console.error('Gagal memproses file:', file.name, e);
            }
        }

        for (const file of lrcFiles) {
            const baseName    = file.name.substring(0, file.name.lastIndexOf('.'));
            const matchedTrack = this.tracks.find(t => {
                const trackBase = t.file.name.substring(0, t.file.name.lastIndexOf('.'));
                return trackBase === baseName || trackBase.includes(baseName) || baseName.includes(trackBase);
            });

            if (matchedTrack) {
                const text = await file.text();
                await window.localMusicDB.saveLyrics(matchedTrack.id, text);
            } else {
                console.warn(`LRC '${file.name}' tidak cocok dengan lagu manapun.`);
            }
        }

        this.renderTracks();
        this._updateSecurityUI();
    }

    // -----------------------------------------------------------------------
    // READ METADATA
    // -----------------------------------------------------------------------
    readMetadata(file) {
        return new Promise((resolve) => {
            let metadata = {
                title:        file.name.replace(/\.[^/.]+$/, ''),
                artist:       'Unknown Artist',
                album:        'Unknown Album',
                coverDataUrl: null
            };

            if (window.jsmediatags) {
                window.jsmediatags.read(file, {
                    onSuccess(tag) {
                        const tags = tag.tags;
                        if (tags.title)  metadata.title  = tags.title;
                        if (tags.artist) metadata.artist = tags.artist;
                        if (tags.album)  metadata.album  = tags.album;

                        if (tags.picture) {
                            let base64 = '';
                            for (let i = 0; i < tags.picture.data.length; i++) {
                                base64 += String.fromCharCode(tags.picture.data[i]);
                            }
                            metadata.coverDataUrl = 'data:' + tags.picture.format + ';base64,' + window.btoa(base64);
                        }
                        resolve(metadata);
                    },
                    onError() {
                        resolve(metadata);
                    }
                });
            } else {
                resolve(metadata);
            }
        });
    }

    // -----------------------------------------------------------------------
    // RENDER TRACKS
    // -----------------------------------------------------------------------
    renderTracks() {
        const list     = document.getElementById('lmTrackList');
        const countEl  = document.getElementById('lmLibraryCount');
        const clearBtn = document.getElementById('lmClearAllBtn');

        if (!list) return;

        const locked = window.musicSecurity ? window.musicSecurity.isLocked() : true;

        countEl.textContent = this.tracks.length;

        // Show clear button only if unlocked AND has tracks
        if (clearBtn) {
            clearBtn.style.display = (!locked && this.tracks.length > 0) ? 'inline-block' : 'none';
        }

        list.innerHTML = '';

        if (this.tracks.length === 0) {
            list.innerHTML = `
                <div class="sl-empty-state">
                    <span class="sl-empty-icon">🎶</span>
                    <p class="sl-empty-text">Belum ada musik lokal. Drop file MP3 ke area di atas.</p>
                </div>
            `;
            return;
        }

        this.tracks.forEach(track => {
            const isPlaying = window.localPlayer && window.localPlayer.currentTrack?.id === track.id;

            const li = document.createElement('li');
            li.className = 'sl-library-item' + (isPlaying ? ' sl-item-playing' : '');

            let artworkHtml = `<div class="lm-track-artwork">🎵</div>`;
            if (track.coverDataUrl) {
                artworkHtml = `<img src="${track.coverDataUrl}" class="lm-track-artwork" alt="cover" />`;
            }

            // Delete button: show lock icon when locked
            const deleteBtn = locked
                ? `<button class="sl-delete-btn lm-delete-locked" title="Terkunci" data-action="delete" aria-label="Hapus dikunci">🔒</button>`
                : `<button class="sl-delete-btn" title="Hapus" data-action="delete" aria-label="Hapus ${this.escape(track.title)}">✕</button>`;

            li.innerHTML = `
                ${artworkHtml}
                <div class="sl-item-info" style="margin-left: 0.5rem;">
                    <div class="sl-item-name">
                        ${this.escape(track.title)}
                        ${isPlaying ? '<span class="sl-item-playing-badge">▶ Diputar</span>' : ''}
                    </div>
                    <div class="sl-item-type-label">
                        <span>${this.escape(track.artist)} • ${this.escape(track.album)}</span>
                    </div>
                </div>
                <div class="sl-item-actions">
                    <button class="sl-play-btn" title="Putar" data-action="play" aria-label="Putar ${this.escape(track.title)}">▶</button>
                    ${deleteBtn}
                </div>
            `;

            li.querySelector('[data-action="play"]').addEventListener('click', () => {
                if (window.localPlayer) {
                    window.localPlayer.playTrack(track, this.tracks);
                    this.renderTracks();
                }
            });

            li.querySelector('[data-action="delete"]').addEventListener('click', () => {
                this._safeDeleteTrack(track);
            });

            list.appendChild(li);
        });
    }

    escape(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}

window.localLibrary = new LocalLibrary();

document.addEventListener('DOMContentLoaded', () => {
    window.localLibrary.init();
});
