// ==========================================================================
// PERSONAL-WORKSPACE — MODUL SPOTIFY LIBRARY PLAYER (SPOTIFY-PLAYER.JS)
// Menggunakan Spotify Embed resmi (iframe). Tidak ada API/OAuth.
// Bergantung pada: js/spotify-storage.js (harus dimuat lebih dulu)
// ==========================================================================

const SPOTIFY_TYPE_ICONS = {
    track:    "🎵",
    playlist: "📋",
    album:    "💿",
    artist:   "🎤"
};

const SPOTIFY_TYPE_LABELS = {
    track:    "Track",
    playlist: "Playlist",
    album:    "Album",
    artist:   "Artist"
};

let spotifyCurrentPlayingId = null;
let globalIframeInitialized = false;

// State Library UX
let slSearchQuery = "";
let slCurrentFilter = "all";
let slCurrentSort = "newest";
let slIsCollapsed = false;

// State Queue & Rendering
let slCurrentQueue = [];
let slRenderLimit = 50;
let slFilteredItemsCache = [];
let slIntersectionObserver = null;

// --------------------------------------------------------------------------
// ENTRY POINT
// --------------------------------------------------------------------------
function initSpotifyPlayer() {
    if (!globalIframeInitialized) {
        buildGlobalMiniPlayer();
        globalIframeInitialized = true;
    }

    const container = document.getElementById("spotifyPlayerContainer");
    if (!container) return;
    if (container.dataset.slInit === "1") return;
    container.dataset.slInit = "1";

    container.innerHTML = "";
    container.appendChild(slBuildAddForm());
    container.appendChild(slBuildLibrarySection());

    slRenderLibrary();

    if (!spotifyCurrentPlayingId) {
        const library = spotifyLibraryGet();
        if (library.length > 0) {
            slPlayItem(library[0]);
        } else {
            slShowDefaultPlayer();
        }
    }
}

// --------------------------------------------------------------------------
function buildGlobalMiniPlayer() {
    const area = document.createElement("div");
    area.className = "sl-player-area sl-mini-player";
    area.id = "slGlobalPlayerArea";

    const header = document.createElement("div");
    header.className = "sl-player-header";
    header.innerHTML = `
        <span class="sl-player-header-icon">🎵</span>
        <span class="sl-player-header-title" id="slPlayerTitle">Siap memutar...</span>
        <span class="sl-player-header-badge">Spotify</span>
    `;

    const iframeWrapper = document.createElement("div");
    iframeWrapper.className = "sl-iframe-wrapper";
    iframeWrapper.id = "slIframeWrapper";

    const miniQueue = document.createElement("div");
    miniQueue.className = "sl-mini-queue";
    miniQueue.id = "slMiniQueue";
    miniQueue.innerHTML = `
        <span id="slQueueStatus">Antrean kosong</span>
        <button class="sl-queue-shuffle-btn" id="slShuffleBtn">🔀 Shuffle Antrean</button>
    `;

    area.appendChild(header);
    area.appendChild(iframeWrapper);
    area.appendChild(miniQueue);
    
    document.body.appendChild(area);

    document.getElementById("slShuffleBtn").addEventListener("click", () => {
        if (slCurrentQueue.length > 1) {
            // Fisher-Yates shuffle
            for (let i = slCurrentQueue.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [slCurrentQueue[i], slCurrentQueue[j]] = [slCurrentQueue[j], slCurrentQueue[i]];
            }
            slUpdateQueueStatus();
        }
    });
}

function slUpdateQueueStatus() {
    const statusEl = document.getElementById("slQueueStatus");
    if (!statusEl) return;
    if (slCurrentQueue.length > 0) {
        statusEl.textContent = `${slCurrentQueue.length} lagu di antrean`;
    } else {
        statusEl.textContent = `Antrean kosong`;
    }
}

// --------------------------------------------------------------------------
// BUILD: ADD FORM
// --------------------------------------------------------------------------
function slBuildAddForm() {
    const form = document.createElement("div");
    form.className = "sl-add-form";
    form.innerHTML = `
        <div class="sl-add-form-title">➕ Tambah ke Library</div>
        <div class="sl-form-row">
            <div class="sl-form-name">
                <input type="text" id="slInputName" class="sl-form-input" placeholder="Nama (opsional)" maxlength="80" autocomplete="off" />
            </div>
            <div class="sl-form-url">
                <input type="url" id="slInputUrl" class="sl-form-input" placeholder="https://open.spotify.com/playlist/..." autocomplete="off" />
            </div>
            <button id="slAddBtn" class="sl-add-btn" type="button">Tambah</button>
        </div>
        <div id="slFormMessage" class="sl-form-message"></div>
    `;

    const btn   = form.querySelector("#slAddBtn");
    const urlEl = form.querySelector("#slInputUrl");

    if (btn) btn.addEventListener("click", () => slCheckAuth(slHandleAdd));
    if (urlEl) {
        urlEl.addEventListener("keydown", (e) => {
            if (e.key === "Enter") slCheckAuth(slHandleAdd);
        });
    }

    return form;
}

// --------------------------------------------------------------------------
// BUILD: LIBRARY SECTION
// --------------------------------------------------------------------------
function slBuildLibrarySection() {
    const section = document.createElement("div");
    section.className = "sl-library-section";
    section.id = "slLibrarySection";

    const header = document.createElement("div");
    header.className = "sl-library-header";
    header.innerHTML = `
        <div class="sl-library-header-top">
            <div class="sl-library-header-left">
                <span class="sl-library-title">📚 My Library</span>
                <span class="sl-library-count" id="slLibraryCount">0</span>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
                <button id="slLogoutBtn" class="sl-clear-all-btn" type="button" style="display: none; background: #333;">Logout</button>
                <button id="slClearAllBtn" class="sl-clear-all-btn" type="button">Hapus Semua</button>
                <button id="slCollapseBtn" class="sl-collapse-btn">Tutup ▴</button>
            </div>
        </div>
        <div class="sl-controls-row" id="slControlsRow">
            <input type="text" id="slSearchInput" class="sl-search-input" placeholder="Cari musik..." />
            <select id="slFilterSelect" class="sl-select-input">
                <option value="all">Semua Tipe</option>
                <option value="track">Tracks</option>
                <option value="playlist">Playlists</option>
                <option value="album">Albums</option>
                <option value="artist">Artists</option>
            </select>
            <select id="slSortSelect" class="sl-select-input">
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
                <option value="az">A-Z</option>
                <option value="za">Z-A</option>
            </select>
        </div>
    `;

    const listContainer = document.createElement("div");
    listContainer.className = "sl-list-container";
    listContainer.id = "slLibraryListWrapper";

    section.appendChild(header);
    section.appendChild(listContainer);

    // Event Listeners for Controls
    header.querySelector("#slClearAllBtn").addEventListener("click", () => slCheckAuth(slHandleClearAll));
    header.querySelector("#slLogoutBtn").addEventListener("click", slHandleLogout);
    
    header.querySelector("#slCollapseBtn").addEventListener("click", () => {
        slIsCollapsed = !slIsCollapsed;
        const btn = header.querySelector("#slCollapseBtn");
        const controls = header.querySelector("#slControlsRow");
        if (slIsCollapsed) {
            btn.innerHTML = "Buka ▾";
            listContainer.style.display = "none";
            controls.style.display = "none";
        } else {
            btn.innerHTML = "Tutup ▴";
            listContainer.style.display = "block";
            controls.style.display = "flex";
        }
    });

    const searchInput = header.querySelector("#slSearchInput");
    searchInput.addEventListener("input", (e) => {
        slSearchQuery = e.target.value.toLowerCase();
        slRenderLibrary();
    });

    const filterSelect = header.querySelector("#slFilterSelect");
    filterSelect.addEventListener("change", (e) => {
        slCurrentFilter = e.target.value;
        slRenderLibrary();
    });

    const sortSelect = header.querySelector("#slSortSelect");
    sortSelect.addEventListener("change", (e) => {
        slCurrentSort = e.target.value;
        slRenderLibrary();
    });

    return section;
}

// --------------------------------------------------------------------------
// HANDLER: TAMBAH ITEM
// --------------------------------------------------------------------------
function slHandleAdd() {
    const nameEl = document.getElementById("slInputName");
    const urlEl  = document.getElementById("slInputUrl");
    const rawUrl  = urlEl  ? urlEl.value.trim()  : "";
    const rawName = nameEl ? nameEl.value.trim() : "";

    if (urlEl) urlEl.classList.remove("sl-input-error");
    slShowFormMsg("", ""); 

    if (!rawUrl) {
        slShowFormMsg("error", "Masukkan URL Spotify terlebih dahulu.");
        if (urlEl) { urlEl.classList.add("sl-input-error"); urlEl.focus(); }
        return;
    }

    const result = spotifyLibraryAdd(rawUrl, rawName);

    if (!result.ok) {
        slShowFormMsg("error", result.reason);
        if (urlEl) urlEl.classList.add("sl-input-error");
        return;
    }

    if (urlEl)  urlEl.value  = "";
    if (nameEl) nameEl.value = "";
    slShowFormMsg("success", `"${result.item.name}" berhasil ditambahkan ke library.`);
    slRenderLibrary();
    slPlayItem(result.item);
}

function slHandleClearAll() {
    slShowConfirm(
        "Hapus Seluruh Library?",
        "Semua musik yang tersimpan akan dihapus. Tindakan ini tidak dapat dibatalkan.",
        () => {
            spotifyLibraryClear();
            spotifyCurrentPlayingId = null;
            slCurrentQueue = [];
            slRenderLibrary();
            slShowDefaultPlayer();
            slUpdateQueueStatus();
        }
    );
}

// --------------------------------------------------------------------------
// FILTER & SORT LOGIC
// --------------------------------------------------------------------------
function slProcessLibrary(library) {
    // 1. Filter
    let filtered = library.filter(item => {
        if (slCurrentFilter !== "all" && item.type !== slCurrentFilter) return false;
        if (slSearchQuery && !item.name.toLowerCase().includes(slSearchQuery)) return false;
        return true;
    });

    // 2. Sort (without affecting pins yet)
    filtered.sort((a, b) => {
        if (slCurrentSort === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
        if (slCurrentSort === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
        if (slCurrentSort === "az") return a.name.localeCompare(b.name);
        if (slCurrentSort === "za") return b.name.localeCompare(a.name);
        return 0;
    });

    // 3. Separate Pins and Non-Pins
    const pinned = filtered.filter(item => item.isPinned);
    const unpinned = filtered.filter(item => !item.isPinned);

    return [...pinned, ...unpinned];
}

// --------------------------------------------------------------------------
// RENDER: LIBRARY LIST (WITH VIRTUAL/CHUNK RENDERING)
// --------------------------------------------------------------------------
function slRenderLibrary() {
    const rawLibrary = spotifyLibraryGet();
    const wrapper = document.getElementById("slLibraryListWrapper");
    const countEl = document.getElementById("slLibraryCount");
    const clearBtn = document.getElementById("slClearAllBtn");

    if (!wrapper) return;

    if (countEl) countEl.textContent = rawLibrary.length;
    if (clearBtn) clearBtn.classList.toggle("sl-visible", rawLibrary.length > 0);
    slUpdateLogoutBtnVisibility();

    // Reset render limit
    slRenderLimit = 50;
    
    // Process items based on active filters and sort
    slFilteredItemsCache = slProcessLibrary(rawLibrary);
    
    wrapper.innerHTML = "";

    if (rawLibrary.length === 0) {
        wrapper.innerHTML = `
            <div class="sl-empty-state">
                <span class="sl-empty-icon">🎶</span>
                <p class="sl-empty-text">Belum ada musik. Tambahkan link Spotify di atas.</p>
            </div>
        `;
        return;
    }

    if (slFilteredItemsCache.length === 0) {
        wrapper.innerHTML = `
            <div class="sl-empty-state" style="padding: 1.5rem;">
                <p class="sl-empty-text">Tidak ada musik yang sesuai pencarian/filter.</p>
            </div>
        `;
        return;
    }

    const ul = document.createElement("ul");
    ul.className = "sl-library-list";
    ul.id = "slLibraryListUl";

    // 1. Render Recently Played (Only if no search/filter applied and at the top)
    if (slSearchQuery === "" && slCurrentFilter === "all" && slCurrentSort === "newest") {
        const recentIds = spotifyRecentlyPlayedGet();
        if (recentIds.length > 0) {
            const recentGroupTitle = document.createElement("div");
            recentGroupTitle.className = "sl-library-group-title";
            recentGroupTitle.textContent = "Baru Diputar";
            ul.appendChild(recentGroupTitle);

            // Fetch actual items
            const recentItems = recentIds.map(id => rawLibrary.find(i => i.id === id)).filter(Boolean);
            recentItems.forEach(item => {
                ul.appendChild(slBuildListItem(item, true));
            });

            const allGroupTitle = document.createElement("div");
            allGroupTitle.className = "sl-library-group-title";
            allGroupTitle.textContent = "Semua Library";
            ul.appendChild(allGroupTitle);
        }
    }

    // 2. Render initial chunk of list
    slRenderChunk(ul, 0, slRenderLimit);
    wrapper.appendChild(ul);

    // 3. Setup Intersection Observer for infinite scrolling
    slSetupIntersectionObserver(ul, wrapper);
}

function slRenderChunk(ul, startIndex, endIndex) {
    const chunk = slFilteredItemsCache.slice(startIndex, endIndex);
    chunk.forEach(item => {
        ul.appendChild(slBuildListItem(item, false));
    });
}

function slSetupIntersectionObserver(ul, wrapper) {
    if (slIntersectionObserver) {
        slIntersectionObserver.disconnect();
    }

    if (slRenderLimit >= slFilteredItemsCache.length) return;

    const sentinel = document.createElement("div");
    sentinel.style.height = "1px";
    ul.appendChild(sentinel);

    slIntersectionObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            const startIndex = slRenderLimit;
            slRenderLimit += 50;
            const endIndex = Math.min(slRenderLimit, slFilteredItemsCache.length);
            
            sentinel.remove(); // Remove sentinel to append items
            slRenderChunk(ul, startIndex, endIndex);
            
            if (slRenderLimit < slFilteredItemsCache.length) {
                ul.appendChild(sentinel); // Re-append sentinel at the end
            } else {
                slIntersectionObserver.disconnect();
            }
        }
    }, { root: wrapper, rootMargin: '100px' });

    slIntersectionObserver.observe(sentinel);
}

// --------------------------------------------------------------------------
// BUILD: SATU ITEM LIBRARY
// --------------------------------------------------------------------------
function slBuildListItem(item, isRecentBlock = false) {
    const isPlaying = spotifyCurrentPlayingId === item.id;
    const icon  = SPOTIFY_TYPE_ICONS[item.type]  || "🎵";
    const label = SPOTIFY_TYPE_LABELS[item.type] || item.type;
    const playCount = item.playCount || 0;

    const li = document.createElement("li");
    li.className = "sl-library-item" + (isPlaying ? " sl-item-playing" : "");
    li.dataset.id = item.id;

    // Actions icons
    const favClass = item.isFavorite ? "active-fav" : "";
    const favIcon = item.isFavorite ? "★" : "☆";
    const pinClass = item.isPinned ? "active-pin" : "";
    
    li.innerHTML = `
        <span class="sl-item-type-icon">${icon}</span>
        <div class="sl-item-info">
            <div class="sl-item-name">
                ${slEscape(item.name)}
                <span class="sl-item-playing-badge">▶ Diputar</span>
            </div>
            <div class="sl-item-type-label">
                <span>${label}</span>
                <span class="sl-item-play-count">• ▶ ${playCount}</span>
            </div>
        </div>
        <div class="sl-item-actions">
            <button class="sl-action-icon-btn ${favClass}" title="Favorite" data-action="fav">${favIcon}</button>
            <button class="sl-action-icon-btn ${pinClass}" title="Pin to top" data-action="pin">📌</button>
            <button class="sl-play-btn" title="Putar" data-action="play">▶</button>
            <button class="sl-delete-btn" title="Hapus" data-action="delete">✕</button>
        </div>
    `;

    // Event Delegation for buttons
    const actions = li.querySelector(".sl-item-actions");
    actions.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        
        const action = btn.dataset.action;
        if (action === "play") slPlayItem(item);
        if (action === "delete") slCheckAuth(() => slDeleteItem(item.id));
        if (action === "fav") {
            spotifyLibraryToggleFavorite(item.id);
            slRenderLibrary();
        }
        if (action === "pin") {
            spotifyLibraryTogglePin(item.id);
            slRenderLibrary();
        }
    });

    return li;
}

// --------------------------------------------------------------------------
// AKSI: PUTAR ITEM & BUAT QUEUE
// --------------------------------------------------------------------------
function slPlayItem(item) {
    const embedUrl = spotifyToEmbedUrl(item.url);
    if (!embedUrl) return;

    spotifyCurrentPlayingId = item.id;
    spotifyLibraryIncrementPlayCount(item.id);
    spotifyRecentlyPlayedAdd(item.id);

    // Update Queue
    slBuildQueueArray(item.id);

    // Update header player
    const titleEl = document.getElementById("slPlayerTitle");
    if (titleEl) {
        const icon = SPOTIFY_TYPE_ICONS[item.type] || "🎵";
        titleEl.textContent = `${icon} ${item.name}`;
    }

    slRenderIframe(embedUrl, item.url);
    slRenderLibrary(); // Update highlights & recently played
}

function slBuildQueueArray(currentId) {
    // Cari index currentId di dalam slFilteredItemsCache
    const currentIndex = slFilteredItemsCache.findIndex(i => i.id === currentId);
    if (currentIndex >= 0 && currentIndex < slFilteredItemsCache.length - 1) {
        // Queue adalah sisa lagu di bawahnya
        slCurrentQueue = slFilteredItemsCache.slice(currentIndex + 1);
    } else {
        slCurrentQueue = [];
    }
    slUpdateQueueStatus();
}

// --------------------------------------------------------------------------
// RENDER: IFRAME
// --------------------------------------------------------------------------
function slRenderIframe(embedUrl, originalUrl) {
    const wrapper = document.getElementById("slIframeWrapper");
    if (!wrapper) return;

    wrapper.innerHTML = `
        <div class="sl-iframe-loading">
            <span class="sl-iframe-loading-spinner"></span>
            Memuat Player Spotify...
        </div>
    `;

    const iframe = document.createElement("iframe");
    iframe.className = "sl-iframe-player";
    iframe.setAttribute("src", embedUrl);
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("allowtransparency", "true");
    iframe.setAttribute("allow", "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture");
    iframe.style.display = "none";

    iframe.onload = () => {
        const loadingEl = wrapper.querySelector(".sl-iframe-loading");
        if (loadingEl) loadingEl.remove();
        iframe.style.display = "block";
    };

    iframe.onerror = () => {
        wrapper.innerHTML = `
            <div class="sl-iframe-fallback">
                <span class="sl-iframe-fallback-icon">🎵</span>
                <p>Spotify gagal dimuat. Silakan refresh halaman atau buka langsung.</p>
                <a href="${originalUrl}" target="_blank" rel="noopener noreferrer" class="sl-spotify-open-btn">
                    🎵 Buka di Spotify
                </a>
            </div>
        `;
    };

    wrapper.appendChild(iframe);
}

function slShowDefaultPlayer() {
    const wrapper = document.getElementById("slIframeWrapper");
    const titleEl = document.getElementById("slPlayerTitle");
    if (titleEl) titleEl.textContent = "Tambahkan musik untuk mulai memutar";
    if (wrapper) {
        wrapper.innerHTML = `
            <div class="sl-iframe-loading" style="padding: 1.75rem;">
                🎵 Library kosong. Tambahkan link Spotify di bawah.
            </div>
        `;
    }
}

// --------------------------------------------------------------------------
// AKSI: HAPUS SATU ITEM
// --------------------------------------------------------------------------
function slDeleteItem(itemId) {
    const wasPlaying = spotifyCurrentPlayingId === itemId;
    spotifyLibraryDelete(itemId);

    if (wasPlaying) {
        spotifyCurrentPlayingId = null;
        slCurrentQueue = [];
        const updatedLibrary = spotifyLibraryGet();
        if (updatedLibrary.length > 0) {
            slPlayItem(updatedLibrary[0]); 
        } else {
            slShowDefaultPlayer();
        }
    } else {
        slRenderLibrary();
    }
}

// --------------------------------------------------------------------------
// HELPER: UI & AUTH
// --------------------------------------------------------------------------
function slShowFormMsg(type, text) {
    const msgEl = document.getElementById("slFormMessage");
    if (!msgEl) return;
    if (!type || !text) {
        msgEl.className = "sl-form-message";
        msgEl.textContent = "";
        clearTimeout(msgEl._slTimeout);
        return;
    }
    msgEl.className = `sl-form-message sl-msg-${type}`;
    msgEl.textContent = text;
    clearTimeout(msgEl._slTimeout);
    msgEl._slTimeout = setTimeout(() => {
        msgEl.className = "sl-form-message";
        msgEl.textContent = "";
    }, 5000);
}

function slShowConfirm(title, desc, onConfirm) {
    const overlay = document.createElement("div");
    overlay.className = "sl-confirm-overlay";
    overlay.innerHTML = `
        <div class="sl-confirm-box">
            <p class="sl-confirm-title">${slEscape(title)}</p>
            <p class="sl-confirm-desc">${slEscape(desc)}</p>
            <div class="sl-confirm-actions">
                <button class="sl-confirm-cancel" id="slConfirmCancel">Batal</button>
                <button class="sl-confirm-ok" id="slConfirmOk">Ya, Hapus Semua</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector("#slConfirmCancel").addEventListener("click", () => overlay.remove());
    overlay.querySelector("#slConfirmOk").addEventListener("click", () => {
        overlay.remove();
        onConfirm();
    });
}

function slEscape(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function slCheckAuth(onSuccess) {
    if (sessionStorage.getItem("spotify_admin") === "true") {
        onSuccess();
        return;
    }
    slShowAuthModal(onSuccess);
}

function slShowAuthModal(onSuccess) {
    const overlay = document.createElement("div");
    overlay.className = "sl-confirm-overlay";
    overlay.innerHTML = `
        <div class="sl-confirm-box" style="min-width: 300px;">
            <p class="sl-confirm-title">Admin Login</p>
            <p class="sl-confirm-desc">Masukkan password admin untuk melanjutkan.</p>
            <div style="margin-bottom: 15px;">
                <input type="password" id="slAdminPassword" class="sl-form-input" placeholder="Password" style="width: 100%; box-sizing: border-box;" autocomplete="off" />
                <p id="slAuthError" style="color: #ff4d4d; font-size: 0.85rem; margin-top: 5px; display: none;"></p>
            </div>
            <div class="sl-confirm-actions">
                <button class="sl-confirm-cancel" id="slAuthCancel">Batal</button>
                <button class="sl-confirm-ok" id="slAuthLogin">Login</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const input = overlay.querySelector("#slAdminPassword");
    const errEl = overlay.querySelector("#slAuthError");
    const loginBtn = overlay.querySelector("#slAuthLogin");

    input.focus();

    const doLogin = () => {
        if (input.value === "050810") {
            sessionStorage.setItem("spotify_admin", "true");
            overlay.remove();
            slUpdateLogoutBtnVisibility();
            onSuccess();
        } else {
            errEl.textContent = "Password admin salah.";
            errEl.style.display = "block";
        }
    };

    overlay.querySelector("#slAuthCancel").addEventListener("click", () => overlay.remove());
    loginBtn.addEventListener("click", doLogin);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") doLogin(); });
}

function slHandleLogout() {
    sessionStorage.removeItem("spotify_admin");
    slUpdateLogoutBtnVisibility();
    alert("Berhasil logout dari Admin.");
}

function slUpdateLogoutBtnVisibility() {
    const btn = document.getElementById("slLogoutBtn");
    if (btn) btn.style.display = sessionStorage.getItem("spotify_admin") === "true" ? "inline-block" : "none";
}

function initSpotifyPlayerSafe() {
    if (document.getElementById('spotifyPlayerContainer')) {
        initSpotifyPlayer();
    }
}

if (window.pwLifecycle) {
    window.pwLifecycle.initGlobalOnce(initSpotifyPlayerSafe);
    window.pwLifecycle.runWhenReady(initSpotifyPlayerSafe);
    window.addEventListener('pw:page-ready', initSpotifyPlayerSafe);
} else {
    document.addEventListener('DOMContentLoaded', initSpotifyPlayer);
}
