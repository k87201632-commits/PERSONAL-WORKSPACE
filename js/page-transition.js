// ==========================================================================
// PERSONAL-WORKSPACE — MODUL TRANSISI HALAMAN (PAGE-TRANSITION.JS)
// Efek Perpindahan Halaman Halus + lifecycle-safe content swap
// ==========================================================================

function initPageTransitions() {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.classList.add('page-fade-enter');
    }

    if (window._spaInitialized) return;
    window._spaInitialized = true;

    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href]');
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href || !href.endsWith('.html') || href.startsWith('http') || link.target === '_blank') return;

        // Arcade has isolated script stack — always full navigation
        if (href.includes('arcade.html')) return;

        e.preventDefault();
        navigateToPage(href, link);
    });

    window.addEventListener('popstate', () => {
        const path = window.location.pathname + window.location.search;
        loadPageContent(path, null, false);
    });
}

function _resolveSiteHref(href) {
    if (window.pwLifecycle?.resolveSiteUrl) return window.pwLifecycle.resolveSiteUrl(href);
    if (window.pwUrl?.resolveSiteUrl) return window.pwUrl.resolveSiteUrl(href);
    return href;
}

function _resolveHref(href) {
    try {
        const resolved = _resolveSiteHref(href);
        return new URL(resolved, window.location.href).pathname + (new URL(resolved, window.location.href).search || '');
    } catch (e) {
        return href;
    }
}

function _needsFullReload(resolvedHref) {
    const lower = resolvedHref.toLowerCase();
    if (lower.includes('arcade.html')) return true;
    if (lower.includes('/subjects/') && typeof SubjectPageManager === 'undefined') return true;
    if (lower.includes('tugas.html') && typeof window.pwInitTugasPage !== 'function') return true;
    if ((lower.includes('index.html') || lower.endsWith('/')) && typeof window.localPlayer === 'undefined') return true;
    if ((lower.includes('index.html') || lower.endsWith('/')) && typeof window.pwInitHomePage !== 'function') return true;
    if (lower.includes('pelajaran.html') && typeof initSubjectPage === 'undefined') return true;
    return false;
}

function _syncModalsFromDoc(doc) {
    const incoming = doc.querySelectorAll('.modal-backdrop');
    if (!incoming.length) return;

    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    incoming.forEach(modal => {
        document.body.appendChild(modal.cloneNode(true));
    });
}

function _updateActiveNav(link) {
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(el => el.classList.remove('active'));
    if (link) {
        link.classList.add('active');
        return;
    }
    const path = window.location.pathname;
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(el => {
        const h = el.getAttribute('href');
        if (!h) return;
        try {
            const resolved = new URL(h, window.location.href).pathname;
            if (path.endsWith(resolved.replace(/^\//, '')) || path === resolved) {
                el.classList.add('active');
            }
        } catch (e) { /* ignore */ }
    });
}

function loadPageContent(href, link, pushState = true) {
    const fetchUrl = _resolveSiteHref(href);
    const resolved = _resolveHref(href);

    if (_needsFullReload(resolved)) {
        window.location.href = fetchUrl;
        return;
    }

    const mainContent = document.querySelector('.main-content');
    if (!mainContent) {
        window.location.href = fetchUrl;
        return;
    }

    fetch(fetchUrl)
        .then(res => {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.text();
        })
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            if (doc.title) document.title = doc.title;

            const newMain = doc.querySelector('.main-content');
            if (!newMain) throw new Error('No .main-content in fetched page');

            mainContent.innerHTML = newMain.innerHTML;
            mainContent.classList.add('page-fade-enter');

            _syncModalsFromDoc(doc);
            _updateActiveNav(link);

            if (pushState) {
                window.history.pushState({ pwSpa: true }, '', fetchUrl);
            }

            mainContent.style.opacity = '1';
            mainContent.style.transform = 'translateY(0)';

            if (window.pwLifecycle && typeof window.pwLifecycle.runPageInit === 'function') {
                window.pwLifecycle.runPageInit(resolved);
            }
        })
        .catch(err => {
            console.error('Navigasi SPA gagal, fallback reload:', err);
            window.location.href = fetchUrl;
        });
}

function navigateToPage(href, link) {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.opacity = '0';
        mainContent.style.transform = 'translateY(-6px)';
        mainContent.style.transition = 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
    }

    setTimeout(() => loadPageContent(href, link, true), 220);
}

if (window.pwLifecycle) {
    window.pwLifecycle.runWhenReady(initPageTransitions);
} else {
    document.addEventListener('DOMContentLoaded', initPageTransitions);
}
