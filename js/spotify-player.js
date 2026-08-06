// ==========================================================================
// PERSONAL-WORKSPACE — MODUL SPOTIFY LIBRARY PLAYER (SPOTIFY-PLAYER.JS)
// Menggunakan Spotify Embed resmi (iframe). Tidak ada API/OAuth.
// Bergantung pada: js/spotify-storage.js (harus dimuat lebih dulu)
// ==========================================================================

// --------------------------------------------------------------------------
// ICON PER TIPE
// --------------------------------------------------------------------------
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

// ID item yang sedang diputar (state in-memory)
let spotifyCurrentPlayingId = null;
let isSpotifyAdmin = false;

// --------------------------------------------------------------------------
// ENTRY POINT — dipanggil saat DOMContentLoaded
// --------------------------------------------------------------------------
function initSpotifyPlayer() {
    const container = document.getElementById("spotifyPlayerContainer");
    if (!container) return; // Hanya di halaman beranda

    // Cegah duplikasi saat SPA re-fire DOMContentLoaded
    if (container.dataset.slInit === "1") return;
    container.dataset.slInit = "1";

    // Bersihkan isi placeholder HTML awal
    container.innerHTML = "";

    // ── 1. Player Area (iframe) ──────────────────────────────────────────
    const playerArea = slBuildPlayerArea();
    container.appendChild(playerArea);

    // ── 2. Add Form ──────────────────────────────────────────────────────
    const addForm = slBuildAddForm();
    container.appendChild(addForm);

    // ── 3. Library Section ───────────────────────────────────────────────
    const librarySection = slBuildLibrarySection();
    container.appendChild(librarySection);

    // ── 4. Load library dari localStorage ───────────────────────────────
    slRenderLibrary();

    // ── 5. Autoplay item pertama jika library tidak kosong ───────────────
    const library = spotifyLibraryGet();
    if (library.length > 0) {
        slPlayItem(library[0]);
    } else {
        slShowDefaultPlayer();
    }
}

// --------------------------------------------------------------------------
// BUILD: PLAYER AREA (iframe wrapper)
// --------------------------------------------------------------------------
function slBuildPlayerArea() {
    const area = document.createElement("div");
    area.className = "sl-player-area";
    area.id = "slPlayerArea";

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

    area.appendChild(header);
    area.appendChild(iframeWrapper);
    return area;
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
                <input
                    type="text"
                    id="slInputName"
                    class="sl-form-input"
                    placeholder="Nama (opsional)"
                    maxlength="80"
                    autocomplete="off"
                />
            </div>
            <div class="sl-form-url">
                <input
                    type="url"
                    id="slInputUrl"
                    class="sl-form-input"
                    placeholder="https://open.spotify.com/playlist/..."
                    autocomplete="off"
                />
            </div>
            <button id="slAddBtn" class="sl-add-btn" type="button">Tambah</button>
        </div>
        <div id="slFormMessage" class="sl-form-message"></div>
    `;

    // PERBAIKAN BUG: Gunakan form.querySelector() langsung — jauh lebih aman
    // dari requestAnimationFrame + document.getElementById karena:
    // 1. Tidak bergantung pada timing/rAF
    // 2. Elemen sudah ada di dalam form element sejak innerHTML di-set
    // 3. Tidak menyimpan closure reference yang bisa menjadi stale/null
    const btn   = form.querySelector("#slAddBtn");
    const urlEl = form.querySelector("#slInputUrl");

    if (btn) {
        // slHandleAdd membaca nilai input secara fresh via document.getElementById
        btn.addEventListener("click", () => slCheckAuth(slHandleAdd));
    } else {
        console.error("[spotify-player] slBuildAddForm: #slAddBtn tidak ditemukan!");
    }

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
        <div class="sl-library-header-left">
            <span class="sl-library-title">📚 My Library</span>
            <span class="sl-library-count" id="slLibraryCount">0</span>
        </div>
        <button id="slClearAllBtn" class="sl-clear-all-btn" type="button">Hapus Semua</button>
    `;

    const listWrapper = document.createElement("div");
    listWrapper.id = "slLibraryListWrapper";

    section.appendChild(header);
    section.appendChild(listWrapper);

    // PERBAIKAN BUG: Gunakan header.querySelector() langsung, bukan rAF
    const clearBtn = header.querySelector("#slClearAllBtn");
    if (clearBtn) {
        clearBtn.addEventListener("click", () => slCheckAuth(slHandleClearAll));
    } else {
        console.error("[spotify-player] slBuildLibrarySection: #slClearAllBtn tidak ditemukan!");
    }

    return section;
}

// --------------------------------------------------------------------------
// HANDLER: TAMBAH ITEM
// PERBAIKAN BUG: Tidak lagi menerima parameter nameEl/urlEl dari closure.
// Setiap kali dipanggil, ambil elemen langsung via document.getElementById
// sehingga selalu mendapat referensi DOM yang fresh & valid.
// --------------------------------------------------------------------------
function slHandleAdd() {
    // Ambil elemen segar setiap kali fungsi dipanggil
    const nameEl = document.getElementById("slInputName");
    const urlEl  = document.getElementById("slInputUrl");
    const rawUrl  = urlEl  ? urlEl.value.trim()  : "";
    const rawName = nameEl ? nameEl.value.trim() : "";

    console.log("[spotify-player] slHandleAdd dipanggil. URL:", rawUrl, "| Nama:", rawName);
    console.log("[spotify-player] urlEl:", urlEl, "nameEl:", nameEl);

    // Reset state error
    if (urlEl) urlEl.classList.remove("sl-input-error");
    slShowFormMsg("", ""); // Reset pesan

    if (!rawUrl) {
        slShowFormMsg("error", "Masukkan URL Spotify terlebih dahulu.");
        if (urlEl) { urlEl.classList.add("sl-input-error"); urlEl.focus(); }
        return;
    }

    const result = spotifyLibraryAdd(rawUrl, rawName);
    console.log("[spotify-player] Hasil spotifyLibraryAdd:", result);

    if (!result.ok) {
        slShowFormMsg("error", result.reason);
        if (urlEl) urlEl.classList.add("sl-input-error");
        return;
    }

    // Berhasil — bersihkan input dan render ulang
    if (urlEl)  urlEl.value  = "";
    if (nameEl) nameEl.value = "";
    slShowFormMsg("success", `"${result.item.name}" berhasil ditambahkan ke library.`);
    slRenderLibrary();
    slPlayItem(result.item);
}

// --------------------------------------------------------------------------
// HANDLER: CLEAR ALL
// --------------------------------------------------------------------------
function slHandleClearAll() {
    slShowConfirm(
        "Hapus Seluruh Library?",
        "Semua musik yang tersimpan akan dihapus. Tindakan ini tidak dapat dibatalkan.",
        () => {
            spotifyLibraryClear();
            spotifyCurrentPlayingId = null;
            slRenderLibrary();
            slShowDefaultPlayer();
        }
    );
}

// --------------------------------------------------------------------------
// RENDER: LIBRARY LIST
// --------------------------------------------------------------------------
function slRenderLibrary() {
    const library   = spotifyLibraryGet();
    const wrapper   = document.getElementById("slLibraryListWrapper");
    const countEl   = document.getElementById("slLibraryCount");
    const clearBtn  = document.getElementById("slClearAllBtn");

    console.log("[spotify-player] slRenderLibrary: merender", library.length, "item.");

    if (!wrapper) {
        console.warn("[spotify-player] slRenderLibrary: #slLibraryListWrapper tidak ditemukan!");
        return;
    }

    // Update count badge
    if (countEl) countEl.textContent = library.length;

    // Toggle clear all button
    if (clearBtn) {
        clearBtn.classList.toggle("sl-visible", library.length > 0);
    }

    wrapper.innerHTML = "";

    if (library.length === 0) {
        wrapper.innerHTML = `
            <div class="sl-empty-state">
                <span class="sl-empty-icon">🎶</span>
                <p class="sl-empty-text">Belum ada musik. Tambahkan link Spotify di atas.</p>
            </div>
        `;
        return;
    }

    const ul = document.createElement("ul");
    ul.className = "sl-library-list";

    library.forEach(item => {
        const li = slBuildListItem(item);
        ul.appendChild(li);
    });

    wrapper.appendChild(ul);
}

// --------------------------------------------------------------------------
// BUILD: SATU ITEM LIBRARY
// --------------------------------------------------------------------------
function slBuildListItem(item) {
    const isPlaying = spotifyCurrentPlayingId === item.id;
    const icon  = SPOTIFY_TYPE_ICONS[item.type]  || "🎵";
    const label = SPOTIFY_TYPE_LABELS[item.type] || item.type;

    const li = document.createElement("li");
    li.className = "sl-library-item" + (isPlaying ? " sl-item-playing" : "");
    li.dataset.id = item.id;

    li.innerHTML = `
        <span class="sl-item-type-icon">${icon}</span>
        <div class="sl-item-info">
            <div class="sl-item-name">
                ${slEscape(item.name)}
                <span class="sl-item-playing-badge">▶ Diputar</span>
            </div>
            <div class="sl-item-type-label">${label}</div>
        </div>
        <div class="sl-item-actions">
            <button class="sl-play-btn" title="Putar" aria-label="Putar ${slEscape(item.name)}">▶</button>
            <button class="sl-delete-btn" title="Hapus dari library" aria-label="Hapus ${slEscape(item.name)}">✕</button>
        </div>
    `;

    li.querySelector(".sl-play-btn").addEventListener("click", () => slPlayItem(item));
    li.querySelector(".sl-delete-btn").addEventListener("click", () => slCheckAuth(() => slDeleteItem(item.id)));

    return li;
}

// --------------------------------------------------------------------------
// AKSI: PUTAR ITEM
// --------------------------------------------------------------------------
function slPlayItem(item) {
    const embedUrl = spotifyToEmbedUrl(item.url);
    if (!embedUrl) return;

    spotifyCurrentPlayingId = item.id;

    // Update header player
    const titleEl = document.getElementById("slPlayerTitle");
    if (titleEl) {
        const icon = SPOTIFY_TYPE_ICONS[item.type] || "🎵";
        titleEl.textContent = `${icon} ${item.name}`;
    }

    // Update iframe
    slRenderIframe(embedUrl, item.url);

    // Re-render library list untuk update highlight
    slRenderLibrary();
}

// --------------------------------------------------------------------------
// RENDER: IFRAME
// --------------------------------------------------------------------------
function slRenderIframe(embedUrl, originalUrl) {
    const wrapper = document.getElementById("slIframeWrapper");
    if (!wrapper) return;

    // Loading state
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
        console.log("[spotify-player] Iframe berhasil dimuat:", embedUrl);
    };

    iframe.onerror = () => {
        console.error("[spotify-player] Gagal memuat iframe:", embedUrl);
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

// --------------------------------------------------------------------------
// DEFAULT PLAYER (saat library kosong)
// --------------------------------------------------------------------------
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
    console.log("[spotify-player] slDeleteItem dipanggil. id:", itemId);
    const wasPlaying = spotifyCurrentPlayingId === itemId;

    // Hapus dari localStorage dulu
    spotifyLibraryDelete(itemId);

    if (wasPlaying) {
        spotifyCurrentPlayingId = null;
        // Ambil library yang sudah diupdate dari localStorage
        const updatedLibrary = spotifyLibraryGet();
        console.log("[spotify-player] Item yang dihapus sedang diputar. Library tersisa:", updatedLibrary.length, "item.");
        if (updatedLibrary.length > 0) {
            slPlayItem(updatedLibrary[0]); // Putar item pertama berikutnya
        } else {
            slShowDefaultPlayer();
        }
    } else {
        // Hanya re-render library (iframe tidak perlu berubah)
        slRenderLibrary();
    }
}

// --------------------------------------------------------------------------
// HELPER: TAMPILKAN PESAN FORM
// --------------------------------------------------------------------------
function slShowFormMsg(type, text) {
    const msgEl = document.getElementById("slFormMessage");
    if (!msgEl) return;

    // Reset jika type/text kosong
    if (!type || !text) {
        msgEl.className = "sl-form-message";
        msgEl.textContent = "";
        clearTimeout(msgEl._slTimeout);
        return;
    }

    msgEl.className = `sl-form-message sl-msg-${type}`;
    msgEl.textContent = text;

    // Auto-hide setelah 5 detik
    clearTimeout(msgEl._slTimeout);
    msgEl._slTimeout = setTimeout(() => {
        msgEl.className = "sl-form-message";
        msgEl.textContent = "";
    }, 5000);
}

// --------------------------------------------------------------------------
// HELPER: KONFIRMASI DIALOG
// --------------------------------------------------------------------------
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

    // Klik di luar box → batal
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

// --------------------------------------------------------------------------
// HELPER: ESCAPE HTML
// --------------------------------------------------------------------------
function slEscape(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// --------------------------------------------------------------------------
// HELPER: AUTHENTICATION
// --------------------------------------------------------------------------
async function slCheckAuth(onSuccess) {
    if (isSpotifyAdmin) {
        onSuccess();
        return;
    }
    
    try {
        const res = await fetch('/api/check');
        if (res.ok) {
            isSpotifyAdmin = true;
            onSuccess();
            return;
        }
    } catch (e) {
        console.error("[spotify-player] Auth check error:", e);
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

    const doLogin = async () => {
        const password = input.value;
        if (!password) return;
        
        loginBtn.textContent = "Loading...";
        loginBtn.disabled = true;
        
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                isSpotifyAdmin = true;
                overlay.remove();
                onSuccess();
            } else {
                errEl.textContent = data.error || "Password admin salah.";
                errEl.style.display = "block";
                loginBtn.textContent = "Login";
                loginBtn.disabled = false;
            }
        } catch (e) {
            errEl.textContent = "Terjadi kesalahan jaringan.";
            errEl.style.display = "block";
            loginBtn.textContent = "Login";
            loginBtn.disabled = false;
        }
    };

    overlay.querySelector("#slAuthCancel").addEventListener("click", () => overlay.remove());
    loginBtn.addEventListener("click", doLogin);
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") doLogin();
    });

    // Klik di luar box -> batal
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

// --------------------------------------------------------------------------
// INISIALISASI
// --------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", initSpotifyPlayer);
