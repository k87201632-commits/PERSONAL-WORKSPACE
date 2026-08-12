// ==========================================================================
// PERSONAL-WORKSPACE — ARCADE STORAGE (ARCADE-STORAGE.JS)
// Single source of truth for all arcade localStorage keys.
// ==========================================================================

(function () {
    'use strict';

    const KEYS = {
        SCORES:          'pw_arcade_scores',
        XP:              'pw_arcade_xp',
        ACHIEVEMENTS:    'pw_arcade_achievements',
        DAILY_CHALLENGE: 'pw_daily_challenge',
        STREAK:          'pw_arcade_streak',
        XP_CONSUMED:     'pw_xp_consumed',
    };

    // -------------------------------------------------------------------------
    // HELPERS
    // -------------------------------------------------------------------------
    function _load(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function _save(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
    }

    const DEFAULT_GAME_STATS = () => ({
        highScore:   0,
        bestMoves:   Infinity, // for memory (lower = better)
        wins:        0,
        gamesPlayed: 0,
        lastPlayed:  null,
    });

    // -------------------------------------------------------------------------
    // PUBLIC API
    // -------------------------------------------------------------------------
    window.arcadeStorage = {

        // --- SCORES ---
        getScores() {
            return _load(KEYS.SCORES, { snake: DEFAULT_GAME_STATS(), memory: DEFAULT_GAME_STATS(), tictactoe: DEFAULT_GAME_STATS() });
        },

        getGameStats(game) {
            const scores = this.getScores();
            return scores[game] || DEFAULT_GAME_STATS();
        },

        recordGamePlayed(game) {
            const scores = this.getScores();
            if (!scores[game]) scores[game] = DEFAULT_GAME_STATS();
            scores[game].gamesPlayed = (scores[game].gamesPlayed || 0) + 1;
            scores[game].lastPlayed  = new Date().toISOString();
            _save(KEYS.SCORES, scores);
        },

        recordGameWon(game, score) {
            const scores = this.getScores();
            if (!scores[game]) scores[game] = DEFAULT_GAME_STATS();
            scores[game].wins = (scores[game].wins || 0) + 1;
            if (typeof score === 'number' && score > (scores[game].highScore || 0)) {
                scores[game].highScore = score;
            }
            _save(KEYS.SCORES, scores);
        },

        updateHighScore(game, score) {
            const scores = this.getScores();
            if (!scores[game]) scores[game] = DEFAULT_GAME_STATS();
            if (typeof score === 'number' && score > (scores[game].highScore || 0)) {
                scores[game].highScore = score;
                _save(KEYS.SCORES, scores);
            }
        },

        updateBestMoves(game, moves) {
            const scores = this.getScores();
            if (!scores[game]) scores[game] = DEFAULT_GAME_STATS();
            const current = scores[game].bestMoves;
            if (!isFinite(current) || moves < current) {
                scores[game].bestMoves = moves;
                _save(KEYS.SCORES, scores);
            }
        },

        // --- ACHIEVEMENTS ---
        getAchievements() {
            return _load(KEYS.ACHIEVEMENTS, []);
        },

        unlockAchievement(id) {
            const list = this.getAchievements();
            if (!list.includes(id)) {
                list.push(id);
                _save(KEYS.ACHIEVEMENTS, list);
                return true; // newly unlocked
            }
            return false;
        },

        isAchievementUnlocked(id) {
            return this.getAchievements().includes(id);
        },

        // --- DAILY CHALLENGE ---
        getDailyChallenge() {
            return _load(KEYS.DAILY_CHALLENGE, null);
        },

        saveDailyChallenge(data) {
            _save(KEYS.DAILY_CHALLENGE, data);
        },

        // --- STREAK ---
        getStreak() {
            return _load(KEYS.STREAK, { count: 0, lastDate: null });
        },

        saveStreak(data) {
            _save(KEYS.STREAK, data);
        },

        // --- XP CONSUMED (idempotency) ---
        getConsumedKeys() {
            return _load(KEYS.XP_CONSUMED, {});
        },

        saveConsumedKeys(map) {
            _save(KEYS.XP_CONSUMED, map);
        },

        markXPConsumed(key) {
            const map = this.getConsumedKeys();
            map[key] = Date.now();
            // Prune keys older than 7 days
            const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
            for (const k in map) {
                if (map[k] < cutoff) delete map[k];
            }
            this.saveConsumedKeys(map);
        },

        isXPConsumed(key) {
            const map = this.getConsumedKeys();
            return !!map[key];
        },
    };

})();
