// ==========================================================================
// PERSONAL-WORKSPACE — STATS AGGREGATOR (STATS-AGGREGATOR.JS)
// Reads existing storage only — no duplicate DB, no fake data.
// ==========================================================================

(function () {
    'use strict';

    const GAME_META = {
        snake:       { label: 'Snake',         icon: '🐍' },
        memory:      { label: 'Memory',        icon: '🃏' },
        tictactoe:   { label: 'Tic-Tac-Toe',   icon: '⭕' },
        '2048':      { label: '2048',          icon: '🔢' },
        minesweeper: { label: 'Minesweeper',   icon: '💣' },
        reaction:    { label: 'Reaction Test', icon: '⚡' },
        flappy:      { label: 'Flappy Mini',   icon: '🪽' },
    };

    function _getTasks() {
        try {
            const raw = localStorage.getItem('personal_workspace_tasks');
            if (raw) return JSON.parse(raw);
        } catch (e) { /* ignore */ }
        return typeof initialTasks !== 'undefined' ? initialTasks : [];
    }

    function _focusStats() {
        const s = window.focusStorage?.getStats?.() || {};
        const sessions = s.completedSessions || 0;
        const minutes = s.totalFocusMinutes || 0;
        const avg = sessions > 0 ? Math.round(minutes / sessions) : 0;
        return {
            sessions,
            minutes,
            averageMinutes: avg,
            lastSession: s.lastSession || null,
        };
    }

    function _taskStats() {
        const tasks = _getTasks();
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'Selesai').length;
        const pending = total - completed;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { total, completed, pending, completionRate };
    }

    function _arcadeStats() {
        const scores = window.arcadeStorage?.getScores?.() || {};
        let gamesPlayed = 0;
        let wins = 0;
        let topGame = null;
        let topPlayed = 0;
        const perGame = [];

        Object.entries(GAME_META).forEach(([id, meta]) => {
            const g = scores[id] || {};
            const played = g.gamesPlayed || 0;
            const w = g.wins || 0;
            gamesPlayed += played;
            wins += w;

            if (played > topPlayed) {
                topPlayed = played;
                topGame = { id, ...meta, gamesPlayed: played };
            }

            perGame.push({
                id,
                label: meta.label,
                icon: meta.icon,
                gamesPlayed: played,
                wins: w,
                highScore: g.highScore || 0,
                bestMoves: isFinite(g.bestMoves) ? g.bestMoves : null,
                lastPlayed: g.lastPlayed || null,
            });
        });

        perGame.sort((a, b) => b.gamesPlayed - a.gamesPlayed);

        return { gamesPlayed, wins, topGame, perGame };
    }

    function _achievementStats() {
        const all = window.achievementManager?.getAll?.() || [];
        const unlockedIds = window.arcadeStorage?.getAchievements?.() || [];
        const unlocked = all.filter(a => unlockedIds.includes(a.id));
        const recent = unlocked.slice(-3).reverse();
        return {
            total: all.length,
            unlockedCount: unlocked.length,
            recent,
            all: all.map(a => ({
                ...a,
                unlocked: unlockedIds.includes(a.id),
            })),
        };
    }

    async function _musicStats() {
        let localTracks = null;
        let spotifyItems = null;

        if (window.localMusicDB?.getAllTracks) {
            try {
                localTracks = (await window.localMusicDB.getAllTracks()).length;
            } catch (e) { localTracks = null; }
        }

        if (typeof spotifyLibraryGet === 'function') {
            try {
                spotifyItems = spotifyLibraryGet().length;
            } catch (e) { spotifyItems = null; }
        }

        const total = (localTracks || 0) + (spotifyItems || 0);
        return { localTracks, spotifyItems, total: localTracks != null || spotifyItems != null ? total : null };
    }

    function _computeInsight(data) {
        const parts = [];

        if (data.tasks.pending > 0) {
            parts.push({
                priority: 3,
                text: `Masih ada ${data.tasks.pending} tugas yang belum selesai.`,
            });
        }

        if (data.focus.sessions > 0) {
            parts.push({
                priority: 2,
                text: `Nice, fokus lo udah ${data.focus.sessions} sesi — total ${data.focus.minutes} menit.`,
            });
        }

        if (data.arcade.topGame && data.arcade.topGame.gamesPlayed > 0) {
            parts.push({
                priority: 1,
                text: `Lo paling sering main ${data.arcade.topGame.label} akhir-akhir ini.`,
            });
        }

        if (data.tasks.completionRate === 100 && data.tasks.total > 0) {
            parts.push({
                priority: 4,
                text: 'Semua tugas selesai — mantap bro! 🔥',
            });
        }

        if (!parts.length) return null;
        parts.sort((a, b) => b.priority - a.priority);
        return parts[0].text;
    }

    async function aggregate() {
        const focus = _focusStats();
        const tasks = _taskStats();
        const arcade = _arcadeStats();
        const achievements = _achievementStats();
        const music = await _musicStats();

        const data = { focus, tasks, arcade, achievements, music };
        data.insight = _computeInsight(data);
        return data;
    }

    window.statsAggregator = {
        aggregate,
        GAME_META,
    };
})();
