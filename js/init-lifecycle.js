// ==========================================================================
// PERSONAL-WORKSPACE — INIT LIFECYCLE (INIT-LIFECYCLE.JS)
// Global + page-specific initialization — first load & page-transition safe.
// Load BEFORE page-transition.js and app.js on every page.
// ==========================================================================

(function () {
    'use strict';

    const _pageInits = [];
    let _globalInitialized = false;

    /**
     * Run callback when DOM is ready. Safe if DOMContentLoaded already fired.
     */
    function runWhenReady(fn) {
        if (typeof fn !== 'function') return;
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn, { once: true });
        } else {
            fn();
        }
    }

    /**
     * Run once per full page session (navbar, theme listeners, etc.)
     */
    function initGlobalOnce(fn) {
        if (_globalInitialized) return;
        _globalInitialized = true;
        fn();
    }

    /**
     * Register page-specific init: test(pathname, filename) → boolean
     */
    function registerPageInit(testFn, initFn) {
        _pageInits.push({ test: testFn, init: initFn });
    }

    function _filenameFromPath(path) {
        if (!path) path = window.location.pathname;
        const clean = path.split('?')[0].split('#')[0];
        const parts = clean.split('/').filter(Boolean);
        return parts.length ? parts[parts.length - 1] : 'index.html';
    }

    /** Resolve site-local .html href from current page depth (subjects/* → ../). */
    function resolveSiteUrl(href) {
        if (!href || /^(https?:|mailto:|tel:|javascript:|#)/i.test(href)) return href;

        const hashIdx = href.indexOf('#');
        const hash = hashIdx >= 0 ? href.slice(hashIdx) : '';
        const beforeHash = hashIdx >= 0 ? href.slice(0, hashIdx) : href;

        const queryIdx = beforeHash.indexOf('?');
        const query = queryIdx >= 0 ? beforeHash.slice(queryIdx) : '';
        const pathPart = queryIdx >= 0 ? beforeHash.slice(0, queryIdx) : beforeHash;

        if (!pathPart.endsWith('.html') && !pathPart.includes('.html#')) return href;
        if (pathPart.startsWith('/') || pathPart.startsWith('../')) {
            return pathPart + query + hash;
        }

        const inSubjects = window.location.pathname.replace(/\\/g, '/').includes('/subjects/');
        if (inSubjects) {
            return '../' + pathPart + query + hash;
        }

        return pathPart + query + hash;
    }

    /**
     * Run matching page inits after navigation or first load.
     * @param {string} [href] — optional href from SPA navigation
     */
    function runPageInit(href) {
        const path = href || window.location.pathname + window.location.search;
        const file = _filenameFromPath(path);
        const isSubject = path.includes('/subjects/') || path.includes('subjects\\');

        _pageInits.forEach(({ test, init }) => {
            try {
                if (test(path, file, isSubject)) init(path, file, isSubject);
            } catch (e) {
                console.error('[pwLifecycle] Page init error:', e);
            }
        });

        window.dispatchEvent(new CustomEvent('pw:page-ready', {
            detail: { path, file, isSubject }
        }));
    }

    function bootstrap() {
        runPageInit();
    }

    window.pwLifecycle = {
        runWhenReady,
        initGlobalOnce,
        registerPageInit,
        runPageInit,
        filenameFromPath: _filenameFromPath,
        resolveSiteUrl,
    };

    window.pwUrl = { resolveSiteUrl };

    runWhenReady(bootstrap);
})();
