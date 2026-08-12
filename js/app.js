// ==========================================================================
// PERSONAL-WORKSPACE — MODUL INISIALISASI UTAMA (APP.JS)
// Global components — mobile menu, runs once per session
// ==========================================================================

function initMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const drawer = document.getElementById('mobileMenuDrawer');
    if (!btn || !drawer) return;

    if (btn.dataset.pwMenuBound === '1') return;
    btn.dataset.pwMenuBound = '1';

    btn.addEventListener('click', () => {
        drawer.classList.toggle('open');
        const isOpen = drawer.classList.contains('open');
        btn.innerHTML = isOpen ? '✕' : '☰';
        document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    drawer.addEventListener('click', (e) => {
        if (e.target === drawer || e.target.classList.contains('mobile-nav-link')) {
            drawer.classList.remove('open');
            btn.innerHTML = '☰';
            document.body.style.overflow = '';
        }
    });
}

function initAppGlobal() {
    initMobileMenu();
}

if (window.pwLifecycle) {
    window.pwLifecycle.initGlobalOnce(initAppGlobal);
    window.pwLifecycle.runWhenReady(initAppGlobal);
} else {
    document.addEventListener('DOMContentLoaded', initAppGlobal);
}
