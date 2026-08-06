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
// Mengembalikan null jika URL tidak valid.
// Mendukung:
//   - https://open.spotify.com/playlist/ID
//   - https://open.spotify.com/track/ID?si=...
//   - https://open.spotify.com/intl-id/playlist/ID  (URL regional/lokal)
//   - https://open.spotify.com/en/album/ID
// --------------------------------------------------------------------------
function spotifyParseUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== "string") {
        console.warn("[spotify-storage] spotifyParseUrl: input bukan string atau kosong.");
        return null;
    }

    let url = rawUrl.trim();

    // Hapus trailing slash sebelum parse
    if (url.endsWith("/")) url = url.slice(0, -1);

    // Wajib berasal dari open.spotify.com
    if (!url.startsWith("https://open.spotify.com/")) {
        console.warn("[spotify-storage] Bukan URL open.spotify.com:", url);
        return null;
    }

    let type = null;
    let id   = null;

    try {
        const parsed = new URL(url);
        // pathname contoh:
        //   /playlist/37i9dQZF1DWWQRwui0ExPn
        //   /intl-id/track/4uLU6hMCjMI75M1A2tKUQC
        //   /en/album/6FJxoadUE4JNVwWHghBwnb
        const parts = parsed.pathname.split("/").filter(Boolean);

        console.log("[spotify-storage] pathname parts:", parts);

        if (parts.length < 2) {
            console.warn("[spotify-storage] Pathname terlalu pendek:", parts);
            return null;
        }

        // Cek apakah parts[0] adalah tipe langsung
        if (SPOTIFY_SUPPORTED_TYPES.includes(parts[0])) {
            // Format standar: /playlist/ID
            type = parts[0];
            id   = parts[1];
        } else if (parts.length >= 3 && SPOTIFY_SUPPORTED_TYPES.includes(parts[1])) {
            // Format regional: /intl-id/playlist/ID  atau  /en/track/ID
            type = parts[1];
            id   = parts[2];
        } else {
            console.warn("[spotify-storage] Format URL tidak dikenali. parts[0]:", parts[0], "parts[1]:", parts.length > 1 ? parts[1] : "—");
            return null;
        }

        // Bersihkan ID dari parameter yang mungkin masih menempel
        // (seharusnya sudah bersih karena kita pakai pathname, bukan href)
        id = id.split("?")[0].split("#")[0];

        console.log("[spotify-storage] Parsed → type:", type, "id:", id);

        if (!SPOTIFY_SUPPORTED_TYPES.includes(type)) {
            console.warn("[spotify-storage] Tipe tidak didukung:", type);
            return null;
        }

        if (!id || id.length < 10) {
            console.warn("[spotify-storage] ID terlalu pendek atau kosong:", id);
            return null;
        }

        const cleanUrl = `https://open.spotify.com/${type}/${id}`;
        console.log("[spotify-storage] cleanUrl:", cleanUrl);
        return { type, id, cleanUrl };

    } catch (e) {
        console.error("[spotify-storage] Error parsing URL:", url, e);
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
        if (!raw) {
            console.log("[spotify-storage] spotifyLibraryGet: tidak ada data, mengembalikan array kosong.");
            return [];
        }
        const parsed = JSON.parse(raw);
        const result = Array.isArray(parsed) ? parsed : [];
        console.log("[spotify-storage] spotifyLibraryGet: loaded", result.length, "item dari localStorage.");
        return result;
    } catch (e) {
        console.error("[spotify-storage] Gagal membaca localStorage:", e);
        return [];
    }
}

// --------------------------------------------------------------------------
// TULIS LIBRARY KE localStorage
// --------------------------------------------------------------------------
function spotifyLibrarySave(library) {
    try {
        const json = JSON.stringify(library);
        localStorage.setItem(SPOTIFY_STORAGE_KEY, json);
        console.log("[spotify-storage] spotifyLibrarySave: tersimpan", library.length, "item ke localStorage.");
    } catch (e) {
        console.error("[spotify-storage] Gagal menyimpan ke localStorage:", e);
    }
}

// --------------------------------------------------------------------------
// TAMBAH ITEM BARU
// Mengembalikan: { ok: true, item } | { ok: false, reason: string }
// --------------------------------------------------------------------------
function spotifyLibraryAdd(rawUrl, name) {
    console.log("[spotify-storage] spotifyLibraryAdd dipanggil. URL:", rawUrl, "| Nama:", name);

    const parsed = spotifyParseUrl(rawUrl);
    if (!parsed) {
        console.warn("[spotify-storage] Validasi URL gagal → tolak add.");
        return {
            ok:     false,
            reason: "URL tidak valid. Gunakan link dari open.spotify.com (track, playlist, album, atau artist)."
        };
    }

    const library = spotifyLibraryGet();
    console.log("[spotify-storage] Library sebelum add:", library.length, "item.");

    // Cek duplikat berdasarkan cleanUrl (perbandingan string eksak)
    const duplicate = library.find(item => item.url === parsed.cleanUrl);
    if (duplicate) {
        console.warn("[spotify-storage] Duplikat ditemukan:", parsed.cleanUrl);
        return { ok: false, reason: "Link sudah ada di library." };
    }

    const newItem = {
        id:        spotifyGenId(),
        name:      (name && name.trim()) ? name.trim() : spotifyDefaultName(parsed.type, parsed.id),
        url:       parsed.cleanUrl,
        type:      parsed.type,
        createdAt: new Date().toISOString()
    };

    // Tambah di awal agar item terbaru tampil paling atas
    library.unshift(newItem);
    spotifyLibrarySave(library);

    console.log("[spotify-storage] Item berhasil ditambahkan:", newItem);
    return { ok: true, item: newItem };
}

// --------------------------------------------------------------------------
// HAPUS SATU ITEM BERDASARKAN ID
// --------------------------------------------------------------------------
function spotifyLibraryDelete(itemId) {
    console.log("[spotify-storage] spotifyLibraryDelete dipanggil. id:", itemId);
    const library = spotifyLibraryGet();
    const before  = library.length;
    const updated = library.filter(item => item.id !== itemId);
    console.log("[spotify-storage] Sebelum:", before, "item → Sesudah:", updated.length, "item.");
    spotifyLibrarySave(updated);
    return updated;
}

// --------------------------------------------------------------------------
// HAPUS SELURUH LIBRARY
// --------------------------------------------------------------------------
function spotifyLibraryClear() {
    console.log("[spotify-storage] spotifyLibraryClear: menghapus seluruh library.");
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
