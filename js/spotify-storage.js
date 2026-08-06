// ==========================================================================
// PERSONAL-WORKSPACE — MODUL STORAGE SPOTIFY LIBRARY (SPOTIFY-STORAGE.JS)
// Mengelola seluruh operasi localStorage untuk fitur Spotify Library.
// Tidak ada Spotify API, OAuth, atau Client ID yang digunakan.
// ==========================================================================

const SPOTIFY_STORAGE_KEY = "personal_workspace_spotify_library";

// Tipe yang didukung
const SPOTIFY_SUPPORTED_TYPES = ["track", "playlist", "album", "artist"];

// --------------------------------------------------------------------------
// PARSE URL SPOTIFY → OBJECT { type, id, cleanUrl }
// Mengembalikan null jika URL tidak valid
// --------------------------------------------------------------------------
function spotifyParseUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== "string") return null;

    // Bersihkan trailing slash dan query params untuk normalisasi
    let url = rawUrl.trim();

    // Harus berasal dari open.spotify.com
    if (!url.startsWith("https://open.spotify.com/")) return null;

    try {
        const parsed = new URL(url);
        // Pathname contoh: /playlist/37i9dQZF1DWWQRwui0ExPn
        const parts = parsed.pathname.split("/").filter(Boolean);
        // parts[0] = type, parts[1] = id
        if (parts.length < 2) return null;

        const type = parts[0];
        const id   = parts[1];

        if (!SPOTIFY_SUPPORTED_TYPES.includes(type)) return null;
        if (!id || id.length < 10) return null;

        // URL bersih (tanpa query params) untuk keseragaman duplikasi check
        const cleanUrl = `https://open.spotify.com/${type}/${id}`;
        return { type, id, cleanUrl };
    } catch (_) {
        return null;
    }
}

// --------------------------------------------------------------------------
// GENERATE ID UNIK
// --------------------------------------------------------------------------
function spotifyGenId() {
    return "sl_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
}

// --------------------------------------------------------------------------
// BACA LIBRARY DARI localStorage
// --------------------------------------------------------------------------
function spotifyLibraryGet() {
    try {
        const raw = localStorage.getItem(SPOTIFY_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
        console.error("[spotify-storage] Gagal membaca localStorage.");
        return [];
    }
}

// --------------------------------------------------------------------------
// TULIS LIBRARY KE localStorage
// --------------------------------------------------------------------------
function spotifyLibrarySave(library) {
    try {
        localStorage.setItem(SPOTIFY_STORAGE_KEY, JSON.stringify(library));
    } catch (e) {
        console.error("[spotify-storage] Gagal menyimpan ke localStorage:", e);
    }
}

// --------------------------------------------------------------------------
// TAMBAH ITEM BARU
// Mengembalikan: { ok: true, item } | { ok: false, reason: string }
// --------------------------------------------------------------------------
function spotifyLibraryAdd(rawUrl, name) {
    const parsed = spotifyParseUrl(rawUrl);
    if (!parsed) {
        return { ok: false, reason: "URL tidak valid. Gunakan link dari open.spotify.com (track, playlist, album, atau artist)." };
    }

    const library = spotifyLibraryGet();

    // Cek duplikat berdasarkan cleanUrl
    const duplicate = library.find(item => item.url === parsed.cleanUrl);
    if (duplicate) {
        return { ok: false, reason: "Link sudah ada di library." };
    }

    const newItem = {
        id:        spotifyGenId(),
        name:      (name && name.trim()) ? name.trim() : spotifyDefaultName(parsed.type, parsed.id),
        url:       parsed.cleanUrl,
        type:      parsed.type,
        createdAt: new Date().toISOString()
    };

    library.unshift(newItem); // Tambah di awal agar item terbaru tampil paling atas
    spotifyLibrarySave(library);
    return { ok: true, item: newItem };
}

// --------------------------------------------------------------------------
// HAPUS SATU ITEM BERDASARKAN ID
// --------------------------------------------------------------------------
function spotifyLibraryDelete(itemId) {
    const library = spotifyLibraryGet();
    const updated  = library.filter(item => item.id !== itemId);
    spotifyLibrarySave(updated);
    return updated;
}

// --------------------------------------------------------------------------
// HAPUS SELURUH LIBRARY
// --------------------------------------------------------------------------
function spotifyLibraryClear() {
    spotifyLibrarySave([]);
}

// --------------------------------------------------------------------------
// NAMA DEFAULT JIKA PENGGUNA TIDAK MENGISI NAMA
// --------------------------------------------------------------------------
function spotifyDefaultName(type, id) {
    const labels = {
        track:    "Track",
        playlist: "Playlist",
        album:    "Album",
        artist:   "Artist"
    };
    return `${labels[type] || "Musik"} (${id.slice(0, 6)}...)`;
}

// --------------------------------------------------------------------------
// KONVERSI URL KE EMBED URL
// Input:  "https://open.spotify.com/playlist/xxxxx"
// Output: "https://open.spotify.com/embed/playlist/xxxxx?utm_source=generator"
// --------------------------------------------------------------------------
function spotifyToEmbedUrl(cleanUrl) {
    if (!cleanUrl) return null;
    return cleanUrl.replace("open.spotify.com/", "open.spotify.com/embed/") + "?utm_source=generator";
}
