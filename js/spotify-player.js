// ==========================================================================
// PERSONAL-WORKSPACE — MODUL SPOTIFY EMBED PLAYER (SPOTIFY-PLAYER.JS)
// Menggunakan Spotify Embed resmi (iframe API)
// Dokumentasi: https://developer.spotify.com/documentation/embeds
//
// CARA MENGGANTI KONTEN MUSIK:
// Ubah nilai `spotifyConfig.items` di bawah ini.
// Format URI: spotify:track:<id>  | spotify:playlist:<id> | spotify:album:<id>
// Format URL: https://open.spotify.com/playlist/<id>
// Cukup ganti satu konfigurasi di sini, tidak perlu edit file lain.
// ==========================================================================

const spotifyConfig = {
    // Item yang akan ditampilkan sebagai featured player utama
    // Ganti 'uri' untuk mengganti lagu/playlist/album
    featured: {
        label: "Playlist Belajar",
        // Lofi Beats (Spotify Official) - Valid & Stable
        uri: "spotify:playlist:37i9dQZF1DWWQRwui0ExPn",
        theme: "0"  // "0" = dark theme embed, "1" = light (tidak semua embed support)
    },

    // Opsi playlist/track alternatif (untuk referensi dan ekspansi masa depan)
    alternatives: [
        {
            label: "Deep Focus",
            uri: "spotify:playlist:37i9dQZF1DWZeKCadgRdKQ"
        },
        {
            label: "Musik Instrumental",
            uri: "spotify:playlist:37i9dQZF1DX9sIqqvKsjEu"
        }
    ]
};

// --------------------------------------------------------------------------
// INISIALISASI PLAYER
// Membuat persistent floating widget untuk Spotify
// --------------------------------------------------------------------------
function initSpotifyPlayer() {
    const container = document.getElementById("spotifyPlayerContainer");
    if (!container) return; // Berhenti jika tidak di halaman beranda

    // Jika sudah pernah di-inisialisasi di dalam kontainer ini (mencegah duplikasi SPA)
    if (container.querySelector("#iframeSpotifyContainer")) return;

    // Bersihkan teks "Memuat player Spotify..."
    container.innerHTML = "";

    const body = document.createElement("div");
    body.id = "spotifyWidgetBody";
    body.style.cssText = "padding: 1rem; transition: all 0.3s ease;";

    const iframeContainer = document.createElement("div");
    iframeContainer.id = "iframeSpotifyContainer";
    
    // Paste Link Input (Sebagai pengganti Search API)
    const pasteContainer = document.createElement("div");
    pasteContainer.style.cssText = "margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px dashed var(--border-color);";
    pasteContainer.innerHTML = `
        <p style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 0.4rem;">Ganti Musik (Paste Link Spotify):</p>
        <div style="display: flex; gap: 0.4rem;">
            <input type="text" id="spotifyPasteInput" placeholder="https://open.spotify.com/..." style="flex: 1; padding: 0.4rem 0.6rem; font-size: 0.75rem; border-radius: 0.4rem; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary);">
            <button id="spotifyPasteBtn" class="btn btn-primary" style="padding: 0.4rem 0.75rem; font-size: 0.75rem; border-radius: 0.4rem;">Putar</button>
        </div>
    `;

    body.appendChild(iframeContainer);
    body.appendChild(pasteContainer);
    container.appendChild(body);

    // Paste handler
    document.getElementById("spotifyPasteBtn").addEventListener("click", () => {
        const inputUrl = document.getElementById("spotifyPasteInput").value.trim();
        if (inputUrl) {
            const newUrl = uriToEmbedUrl(inputUrl);
            if (newUrl) {
                renderIframe(newUrl);
                document.getElementById("spotifyPasteInput").value = "";
            } else {
                alert("URL Spotify tidak valid. Gunakan format https://open.spotify.com/track/...");
            }
        }
    });

    // Render iframe awal
    const uri = spotifyConfig.featured.uri;
    const embedUrl = uriToEmbedUrl(uri);
    if (embedUrl) {
        renderIframe(embedUrl);
    } else {
        iframeContainer.innerHTML = `<p style="font-size:0.8rem;color:red;">Error: Konfigurasi Spotify tidak valid.</p>`;
    }

    function renderIframe(url) {
        iframeContainer.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">Memuat Player Spotify...</div>`;
        const iframe = document.createElement("iframe");
        iframe.style.cssText = "border-radius: 0.75rem; width: 100%; height: 152px; border: none; display: none;";
        iframe.setAttribute("src", url);
        iframe.setAttribute("frameborder", "0");
        iframe.setAttribute("allowtransparency", "true");
        iframe.setAttribute("allow", "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture");
        iframe.setAttribute("loading", "lazy");
        
        iframe.onload = () => {
            // Hilangkan tulisan memuat
            const loadingText = iframeContainer.querySelector("div");
            if (loadingText) loadingText.remove();
            iframe.style.display = "block";
            console.log("Spotify iframe berhasil dimuat.");
        };

        iframe.onerror = () => {
            console.error("Gagal memuat Spotify iframe.");
            showSpotifyFallback(iframeContainer, url);
        };
        
        iframeContainer.appendChild(iframe);
        renderAlternativeButtons(iframeContainer, iframe);
    }
}

// --------------------------------------------------------------------------
// KONVERSI URI SPOTIFY KE URL EMBED
// Input:  "spotify:playlist:0vvXsWCC9xrXsKd4eVNbd1"
//       atau "https://open.spotify.com/playlist/..."
// Output: "https://open.spotify.com/embed/playlist/0vvXsWCC9xrXsKd4eVNbd1"
// --------------------------------------------------------------------------
function uriToEmbedUrl(uriOrUrl) {
    if (!uriOrUrl) return null;

    // Jika sudah berupa URL open.spotify.com
    if (uriOrUrl.startsWith("https://open.spotify.com/")) {
        return uriOrUrl.replace("open.spotify.com/", "open.spotify.com/embed/");
    }

    // Jika berupa URI format spotify:type:id
    const parts = uriOrUrl.split(":");
    if (parts.length === 3 && parts[0] === "spotify") {
        const type = parts[1];  // track, playlist, album, artist
        const id = parts[2];
        return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
    }

    return null;
}

// --------------------------------------------------------------------------
// RENDER TOMBOL ALTERNATIF PLAYLIST (compact, di bawah iframe)
// --------------------------------------------------------------------------
function renderAlternativeButtons(container, iframe) {
    if (!spotifyConfig.alternatives || spotifyConfig.alternatives.length === 0) return;

    const btnContainer = document.createElement("div");
    btnContainer.style.cssText = "display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 0.75rem 1rem; border-top: 1px solid var(--border-color); background-color: var(--bg-tertiary);";

    const label = document.createElement("span");
    label.style.cssText = "font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; margin-right: 0.25rem;";
    label.textContent = "Ganti:";
    btnContainer.appendChild(label);

    spotifyConfig.alternatives.forEach(alt => {
        const btn = document.createElement("button");
        btn.style.cssText = "font-size: 0.7rem; font-weight: 700; padding: 0.3rem 0.65rem; border-radius: 999px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-secondary); cursor: pointer;";
        btn.textContent = alt.label;
        btn.setAttribute("aria-label", `Putar ${alt.label}`);
        btn.addEventListener("click", () => {
            const newUrl = uriToEmbedUrl(alt.uri);
            if (newUrl && iframe) {
                iframe.src = newUrl;
                // Update tombol active state
                btnContainer.querySelectorAll("button").forEach(b => b.style.color = "var(--text-secondary)");
                btn.style.color = "var(--accent-primary)";
            }
        });
        btnContainer.appendChild(btn);
    });

    container.appendChild(btnContainer);
}

// --------------------------------------------------------------------------
// FALLBACK JIKA IFRAME GAGAL / BROWSER MEMBLOKIR
// --------------------------------------------------------------------------
function showSpotifyFallback(container, embedUrl) {
    container.innerHTML = `
        <div style="padding: 1.5rem; text-align: center;">
            <span style="font-size: 2rem; display: block; margin-bottom: 0.5rem;">🎵</span>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">
                Musik tidak dapat diputar di browser ini.<br>Buka langsung di Spotify.
            </p>
            <a href="${embedUrl.replace('/embed/', '/')}" 
               target="_blank" 
               rel="noopener noreferrer"
               style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.25rem; background-color: #1DB954; color: white; border-radius: 999px; font-size: 0.8rem; font-weight: 700; text-decoration: none;">
                🎵 Buka di Spotify
            </a>
        </div>
    `;
}

// Inisialisasi saat DOM siap
document.addEventListener("DOMContentLoaded", initSpotifyPlayer);
