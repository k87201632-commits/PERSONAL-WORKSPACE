// ==========================================================================
// PERSONAL-WORKSPACE — MODUL INUSIALISASI UTAMA (APP.JS)
// Menghubungkan Seluruh Komponen Workspace dalam Bahasa Indonesia
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
    initMobileMenu();
});

function initMobileMenu() {
    const btn = document.getElementById("mobileMenuBtn");
    const drawer = document.getElementById("mobileMenuDrawer");

    if (btn && drawer) {
        btn.addEventListener("click", () => {
            drawer.classList.toggle("open");
            const isOpen = drawer.classList.contains("open");
            btn.innerHTML = isOpen ? "✕" : "☰";
            document.body.style.overflow = isOpen ? "hidden" : "";
        });
    }
}
