// ==========================================================================
// PERSONAL-WORKSPACE — MODUL STORAGE SPOTIFY LIBRARY (SPOTIFY-STORAGE.JS)
// Mengelola seluruh operasi localStorage untuk fitur Spotify Library.
// Tidak ada Spotify API, OAuth, atau Client ID yang digunakan.
// ==========================================================================

const SPOTIFY_STORAGE_KEY = "personal_workspace_spotify_library";
const SPOTIFY_RECENTLY_PLAYED_KEY = "personal_workspace_spotify_recent";

// Tipe yang didukung
const SPOTIFY_SUPPORTED_TYPES = ["track", "playlist", "album", "artist"];

// --------------------------------------------------------------------------
// PARSE URL SPOTIFY → OBJECT { type, id, cleanUrl }
// --------------------------------------------------------------------------
function spotifyParseUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== "string") {
        console.warn("[spotify-storage] spotifyParseUrl: input bukan string atau kosong.");
        return null;
    }

    let url = rawUrl.trim();

    if (url.endsWith("/")) url = url.slice(0, -1);

    if (!url.startsWith("https://open.spotify.com/")) {
        console.warn("[spotify-storage] Bukan URL open.spotify.com:", url);
        return null;
    }

    let type = null;
    let id   = null;

    try {
        const parsed = new URL(url);
        const parts = parsed.pathname.split("/").filter(Boolean);

        if (parts.length < 2) return null;

        if (SPOTIFY_SUPPORTED_TYPES.includes(parts[0])) {
            type = parts[0];
            id   = parts[1];
        } else if (parts.length >= 3 && SPOTIFY_SUPPORTED_TYPES.includes(parts[1])) {
            type = parts[1];
            id   = parts[2];
        } else {
            return null;
        }

        id = id.split("?")[0].split("#")[0];

        if (!SPOTIFY_SUPPORTED_TYPES.includes(type)) return null;
        if (!id || id.length < 10) return null;

        const cleanUrl = `https://open.spotify.com/${type}/${id}`;
        return { type, id, cleanUrl };

    } catch (e) {
        return null;
    }
}

function spotifyGenId() {
    return "sl_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
}

// --------------------------------------------------------------------------
// LIBRARY CRUD
// --------------------------------------------------------------------------
function spotifyLibraryGet() {
    try {
        const raw = localStorage.getItem(SPOTIFY_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
}

function spotifyLibrarySave(library) {
    try {
        localStorage.setItem(SPOTIFY_STORAGE_KEY, JSON.stringify(library));
    } catch (e) {}
}

function spotifyLibraryAdd(rawUrl, name) {
    const parsed = spotifyParseUrl(rawUrl);
    if (!parsed) {
        return {
            ok:     false,
            reason: "URL tidak valid. Gunakan link dari open.spotify.com (track, playlist, album, atau artist)."
        };
    }

    const library = spotifyLibraryGet();
    const duplicate = library.find(item => item.url === parsed.cleanUrl);
    
    if (duplicate) {
        return { ok: false, reason: "Link sudah ada di library." };
    }

    const newItem = {
        id:        spotifyGenId(),
        name:      (name && name.trim()) ? name.trim() : spotifyDefaultName(parsed.type, parsed.id),
        url:       parsed.cleanUrl,
        type:      parsed.type,
        createdAt: new Date().toISOString(),
        isFavorite: false,
        isPinned: false,
        playCount: 0
    };

    library.unshift(newItem);
    spotifyLibrarySave(library);
    return { ok: true, item: newItem };
}

function spotifyLibraryDelete(itemId) {
    const library = spotifyLibraryGet();
    const updated = library.filter(item => item.id !== itemId);
    spotifyLibrarySave(updated);
    
    // Hapus juga dari recently played
    const recent = spotifyRecentlyPlayedGet();
    const updatedRecent = recent.filter(id => id !== itemId);
    spotifyRecentlyPlayedSave(updatedRecent);
    
    return updated;
}

function spotifyLibraryClear() {
    spotifyLibrarySave([]);
    spotifyRecentlyPlayedSave([]);
}

function spotifyDefaultName(type, id) {
    const labels = {
        track:    "Track",
        playlist: "Playlist",
        album:    "Album",
        artist:   "Artist"
    };
    return `${labels[type] || "Musik"} (${id.slice(0, 6)}...)`;
}

function spotifyToEmbedUrl(cleanUrl) {
    if (!cleanUrl) return null;
    return cleanUrl.replace("open.spotify.com/", "open.spotify.com/embed/") + "?utm_source=generator";
}

// --------------------------------------------------------------------------
// ITEM UPDATES (Favorite, Pin, Play Count)
// --------------------------------------------------------------------------
function spotifyLibraryToggleFavorite(itemId) {
    const library = spotifyLibraryGet();
    const item = library.find(i => i.id === itemId);
    if (item) {
        item.isFavorite = !item.isFavorite;
        spotifyLibrarySave(library);
    }
}

function spotifyLibraryTogglePin(itemId) {
    const library = spotifyLibraryGet();
    const item = library.find(i => i.id === itemId);
    if (item) {
        item.isPinned = !item.isPinned;
        spotifyLibrarySave(library);
    }
}

function spotifyLibraryIncrementPlayCount(itemId) {
    const library = spotifyLibraryGet();
    const item = library.find(i => i.id === itemId);
    if (item) {
        item.playCount = (item.playCount || 0) + 1;
        spotifyLibrarySave(library);
    }
}

// --------------------------------------------------------------------------
// RECENTLY PLAYED MANAGEMENT
// --------------------------------------------------------------------------
function spotifyRecentlyPlayedGet() {
    try {
        const raw = localStorage.getItem(SPOTIFY_RECENTLY_PLAYED_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
}

function spotifyRecentlyPlayedSave(recentArray) {
    try {
        localStorage.setItem(SPOTIFY_RECENTLY_PLAYED_KEY, JSON.stringify(recentArray));
    } catch (e) {}
}

function spotifyRecentlyPlayedAdd(itemId) {
    let recent = spotifyRecentlyPlayedGet();
    
    // Hapus jika sudah ada di dalam list (untuk memindahkannya ke urutan teratas)
    recent = recent.filter(id => id !== itemId);
    
    // Tambah ke awal
    recent.unshift(itemId);
    
    // Batasi maksimum 10
    if (recent.length > 10) {
        recent = recent.slice(0, 10);
    }
    
    spotifyRecentlyPlayedSave(recent);
}
