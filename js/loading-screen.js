// ==========================================================================
// PERSONAL-WORKSPACE — INISIALISASI LOADING (LOADING-SCREEN.JS)
// Modul ini memicu LoadingManager pada saat halaman pertama dimuat
// ==========================================================================

function triggerInitialLoading() {
    if (window.pwLoadingManager) {
        // Jangan tampilkan di halaman arcade (arcade punya loadingnya sendiri)
        if (window.location.pathname.toLowerCase().includes('arcade')) return;

        // Tampilkan loading dengan konteks halaman saat ini
        window.pwLoadingManager.show(window.location.href, true);
        
        // Halaman sudah siap karena ini initial load (bukan navigasi SPA)
        // Jadi kita beritahu manager bahwa fetch selesai, 
        // tinggal menunggu minimum duration.
        window.pwLoadingManager.markPageReady();
    }
}

if (window.pwLifecycle) {
    window.pwLifecycle.runWhenReady(triggerInitialLoading);
} else {
    document.addEventListener('DOMContentLoaded', triggerInitialLoading);
}
