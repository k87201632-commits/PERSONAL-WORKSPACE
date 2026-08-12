// ==========================================================================
// PERSONAL-WORKSPACE — FOCUS STORAGE (FOCUS-STORAGE.JS)
// Persisted stats + session snapshot (localStorage / sessionStorage).
// Same pattern as arcade-storage — no second database.
// ==========================================================================

(function () {
    'use strict';

    const STATS_KEY   = 'pw_focus_stats';
    const SESSION_KEY = 'pw_focus_session';

    function _load(key, storage, fallback) {
        try {
            const raw = storage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function _save(key, storage, value) {
        try { storage.setItem(key, JSON.stringify(value)); } catch (e) {}
    }

    const DEFAULT_STATS = () => ({
        completedSessions: 0,
        totalFocusMinutes: 0,
        lastSession:       null,
    });

    window.focusStorage = {
        getStats() {
            return _load(STATS_KEY, localStorage, DEFAULT_STATS());
        },

        recordCompletedSession(durationMinutes) {
            const stats = this.getStats();
            stats.completedSessions = (stats.completedSessions || 0) + 1;
            stats.totalFocusMinutes = (stats.totalFocusMinutes || 0) + durationMinutes;
            stats.lastSession = new Date().toISOString();
            _save(STATS_KEY, localStorage, stats);
            return stats;
        },

        saveSession(session) {
            _save(SESSION_KEY, sessionStorage, session);
        },

        loadSession() {
            return _load(SESSION_KEY, sessionStorage, null);
        },

        clearSession() {
            try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
        },
    };
})();
