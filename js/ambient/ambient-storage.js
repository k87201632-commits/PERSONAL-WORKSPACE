// ==========================================================================
// PERSONAL-WORKSPACE — AMBIENT STORAGE (AMBIENT-STORAGE.JS)
// Lightweight preferences — same localStorage pattern as focus/arcade storage.
// ==========================================================================

(function () {
    'use strict';

    const PREFS_KEY = 'pw_ambient_prefs';

    function _load(fallback) {
        try {
            const raw = localStorage.getItem(PREFS_KEY);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function _save(value) {
        try { localStorage.setItem(PREFS_KEY, JSON.stringify(value)); } catch (e) {}
    }

    const DEFAULT_PREFS = () => ({
        selectedAmbient: null,
        volume:          0.55,
        enabled:         false,
        autoOnFocus:     true,
    });

    window.ambientStorage = {
        getPrefs() {
            return { ...DEFAULT_PREFS(), ..._load({}) };
        },

        savePrefs(partial) {
            const next = { ...this.getPrefs(), ...partial };
            _save(next);
            return next;
        },
    };
})();
