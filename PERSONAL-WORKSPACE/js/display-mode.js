// ==========================================================================
// PERSONAL-WORKSPACE — MODUL MODE TAMPILAN (DISPLAY-MODE.JS)
// Mengelola Mode Tampilan: Terang ☀️, Gelap 🌙, & Ramah Warna 👁️
// ==========================================================================

const DISPLAY_MODE_KEY = "personal_workspace_display_mode";

// Inisialisasi Mode Tampilan Saat Aplikasi Dimuat
function initDisplayMode() {
    const savedMode = localStorage.getItem(DISPLAY_MODE_KEY) || "light";
    setDisplayMode(savedMode, false);
}

// Mengatur Mode Tampilan (light, dark, colorblind)
function setDisplayMode(mode, showNotification = true) {
    if (!["light", "dark", "colorblind"].includes(mode)) {
        mode = "light";
    }

    // Terapkan Atribut data-theme ke Tag HTML Root
    document.documentElement.setAttribute("data-theme", mode);
    localStorage.setItem(DISPLAY_MODE_KEY, mode);

    // Perbarui Teks Label Tombol Selector Tampilan
    updateSelectorUI(mode);

    if (showNotification && typeof showToast === "function") {
        const modeNames = {
            light: "Terang ☀️",
            dark: "Gelap 🌙",
            colorblind: "Ramah Warna 👁️"
        };
        showToast(`Mode tampilan diubah ke ${modeNames[mode]}.`);
    }
}

// Memperbarui UI Selector Dropdown
function updateSelectorUI(mode) {
    const currentLabel = document.getElementById("currentThemeLabel");
    const options = document.querySelectorAll(".theme-option");

    const modeText = {
        light: "☀️ Terang",
        dark: "🌙 Gelap",
        colorblind: "👁️ Ramah Warna"
    };

    if (currentLabel) {
        currentLabel.textContent = modeText[mode] || "☀️ Terang";
    }

    options.forEach(opt => {
        if (opt.getAttribute("data-mode") === mode) {
            opt.classList.add("selected");
        } else {
            opt.classList.remove("selected");
        }
    });
}

// Toggle Dropdown Menu Tampilan
function toggleThemeMenu() {
    const menu = document.getElementById("themeMenu");
    if (menu) {
        menu.classList.toggle("show");
    }
}

// Menutup Dropdown Saat Klik di Luar Menu
document.addEventListener("click", (e) => {
    const selector = document.querySelector(".theme-selector");
    const menu = document.getElementById("themeMenu");
    if (selector && menu && !selector.contains(e.target)) {
        menu.classList.remove("show");
    }
});

// Jalankan Inisialisasi Segera
initDisplayMode();
