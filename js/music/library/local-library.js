// ==========================================================================
// PERSONAL-WORKSPACE — LOCAL MUSIC LIBRARY (LOCAL-LIBRARY.JS)
// Menangani UI Library Lokal, Drag & Drop, dan File Metadata
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
    }

    buildUI() {
        this.container.innerHTML = `
            <div class="lm-drop-zone" id="lmDropZone">
                <span class="lm-drop-icon">📂</span>
                <div class="lm-drop-title">Drop Music & Lyrics Here</div>
                <div class="lm-drop-subtitle">Support MP3, WAV, OGG, LRC (Max 50MB per file)</div>
                <input type="file" id="lmFileInput" class="lm-file-input" multiple accept="audio/*,.lrc" />
            </div>

            <div class="lm-library-section">
                <div class="lm-library-header">
                    <div class="lm-library-title-row">
                        <span class="sl-library-title">📁 Local Library</span>
                        <span class="sl-library-count" id="lmLibraryCount">0</span>
                    </div>
                    <div>
                        <button id="lmClearAllBtn" class="sl-clear-all-btn">Hapus Semua</button>
                    </div>
                </div>
                
                <!-- This part is for the lyrics panel when a song is playing -->
                <div class="lm-lyrics-panel" id="lmLyricsPanel" style="display: none;">
                    <div class="lm-lyrics-placeholder">Lirik akan muncul di sini jika ada file .lrc</div>
                </div>

                <div class="lm-list-container">
                    <ul class="sl-library-list" id="lmTrackList"></ul>
                </div>
            </div>
        `;

        this.bindEvents();
    }

    bindEvents() {
        const dropZone = document.getElementById('lmDropZone');
        const fileInput = document.getElementById('lmFileInput');
        const clearBtn = document.getElementById('lmClearAllBtn');

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
                this.handleFiles(e.dataTransfer.files);
            }
        });

        // File Input
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFiles(e.target.files);
            }
        });

        // Clear All
        clearBtn.addEventListener('click', async () => {
            if (confirm("Hapus seluruh musik lokal?")) {
                await window.localMusicDB.clearTracks();
                this.tracks = [];
                this.renderTracks();
            }
        });
    }

    async loadTracks() {
        try {
            this.tracks = await window.localMusicDB.getAllTracks();
            this.renderTracks();
        } catch (e) {
            console.error("Gagal meload local tracks", e);
        }
    }

    async handleFiles(files) {
        let audioFiles = [];
        let lrcFiles = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const ext = file.name.split('.').pop().toLowerCase();
            
            if (file.type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
                audioFiles.push(file);
            } else if (ext === 'lrc') {
                lrcFiles.push(file);
            }
        }

        // Process Audio Files
        for (const file of audioFiles) {
            // Check duplicates
            const isDuplicate = this.tracks.some(t => t.file.name === file.name && t.file.size === file.size);
            if (isDuplicate) {
                console.log(`Skipped duplicate: ${file.name}`);
                continue;
            }

            try {
                const metadata = await this.readMetadata(file);
                const track = {
                    id: 'lm_' + Date.now() + '_' + Math.random().toString(36).substring(2,7),
                    title: metadata.title,
                    artist: metadata.artist,
                    album: metadata.album,
                    coverDataUrl: metadata.coverDataUrl,
                    file: file,
                    createdAt: new Date().toISOString()
                };

                await window.localMusicDB.addTrack(track);
                this.tracks.unshift(track);
            } catch (e) {
                console.error("Gagal memproses file:", file.name, e);
            }
        }

        // Process LRC Files
        for (const file of lrcFiles) {
            // Try to match by filename (without extension)
            const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
            
            // Find a track that has a similar filename
            const matchedTrack = this.tracks.find(t => {
                const trackBase = t.file.name.substring(0, t.file.name.lastIndexOf('.'));
                return trackBase === baseName || trackBase.includes(baseName) || baseName.includes(trackBase);
            });

            if (matchedTrack) {
                const text = await file.text();
                await window.localMusicDB.saveLyrics(matchedTrack.id, text);
            } else {
                console.warn(`File LRC '${file.name}' tidak cocok dengan lagu mana pun di library.`);
            }
        }

        this.renderTracks();
    }

    readMetadata(file) {
        return new Promise((resolve) => {
            let metadata = {
                title: file.name.replace(/\.[^/.]+$/, ""),
                artist: "Unknown Artist",
                album: "Unknown Album",
                coverDataUrl: null
            };

            if (window.jsmediatags) {
                window.jsmediatags.read(file, {
                    onSuccess: function(tag) {
                        const tags = tag.tags;
                        if (tags.title) metadata.title = tags.title;
                        if (tags.artist) metadata.artist = tags.artist;
                        if (tags.album) metadata.album = tags.album;
                        
                        if (tags.picture) {
                            let base64String = "";
                            for (let i = 0; i < tags.picture.data.length; i++) {
                                base64String += String.fromCharCode(tags.picture.data[i]);
                            }
                            metadata.coverDataUrl = "data:" + tags.picture.format + ";base64," + window.btoa(base64String);
                        }
                        resolve(metadata);
                    },
                    onError: function(error) {
                        console.log('jsmediatags failed, using fallback for', file.name);
                        resolve(metadata);
                    }
                });
            } else {
                resolve(metadata);
            }
        });
    }

    renderTracks() {
        const list = document.getElementById('lmTrackList');
        const countEl = document.getElementById('lmLibraryCount');
        const clearBtn = document.getElementById('lmClearAllBtn');
        
        if (!list) return;

        countEl.textContent = this.tracks.length;
        clearBtn.style.display = this.tracks.length > 0 ? 'inline-block' : 'none';
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
                    <button class="sl-play-btn" title="Putar" data-action="play">▶</button>
                    <button class="sl-delete-btn" title="Hapus" data-action="delete">✕</button>
                </div>
            `;

            li.querySelector('[data-action="play"]').addEventListener('click', () => {
                if (window.localPlayer) {
                    window.localPlayer.playTrack(track, this.tracks);
                    this.renderTracks();
                }
            });

            li.querySelector('[data-action="delete"]').addEventListener('click', async () => {
                if (confirm(`Hapus "${track.title}"?`)) {
                    await window.localMusicDB.deleteTrack(track.id);
                    this.tracks = this.tracks.filter(t => t.id !== track.id);
                    this.renderTracks();
                }
            });

            list.appendChild(li);
        });
    }

    escape(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }
}

window.localLibrary = new LocalLibrary();

document.addEventListener("DOMContentLoaded", () => {
    window.localLibrary.init();
});
