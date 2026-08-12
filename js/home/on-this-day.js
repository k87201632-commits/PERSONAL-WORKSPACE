// ==========================================================================
// PERSONAL-WORKSPACE — ON THIS DAY (ON-THIS-DAY.JS)
// Historical matches from real dated data — no fake memories.
// ==========================================================================

(function () {
    'use strict';

    const INTROS = [
        'Eh bro, hari ini',
        'Throwback dikit 👀',
        'Buset, ternyata',
        'Hari ini ada flashback:',
    ];

    const BULAN = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];

    const GAME_NAMES = {
        snake: 'Snake', memory: 'Memory', tictactoe: 'Tic-Tac-Toe',
        '2048': '2048', minesweeper: 'Minesweeper', reaction: 'Reaction Test', flappy: 'Flappy Mini',
    };

    let _cacheKey = null;
    let _cacheResults = null;

    function _parseDate(str) {
        if (!str) return null;
        const d = new Date(str.includes('T') ? str : `${str}T12:00:00`);
        return isNaN(d.getTime()) ? null : d;
    }

    function _formatDate(d) {
        return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
    }

    function _yearsAgo(past, today) {
        return today.getFullYear() - past.getFullYear();
    }

    function _sameMonthDay(a, b) {
        return a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    }

    function _introFor(id) {
        const idx = Math.abs(id.split('').reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0)) % INTROS.length;
        return INTROS[idx];
    }

    function _yearsLabel(n) {
        if (n === 1) return 'setahun';
        return `${n} tahun`;
    }

    function _getTasks() {
        try {
            const raw = localStorage.getItem('personal_workspace_tasks');
            if (raw) return JSON.parse(raw);
        } catch (e) { /* ignore */ }
        return typeof initialTasks !== 'undefined' ? initialTasks : [];
    }

    function _addCandidate(list, candidate) {
        if (candidate.yearsAgo < 1) return;
        list.push(candidate);
    }

    function _collectTaskCandidates(today, out) {
        _getTasks().forEach(task => {
            const created = _parseDate(task.createdAt);
            const deadline = _parseDate(task.deadline);

            if (created && _sameMonthDay(created, today) && created.getFullYear() < today.getFullYear()) {
                const years = _yearsAgo(created, today);
                const intro = _introFor(`task-done-${task.id}`);
                if (task.status === 'Selesai') {
                    _addCandidate(out, {
                        id: `task-done-${task.id}`,
                        priority: 100,
                        date: created,
                        yearsAgo: years,
                        message: `${intro} ${_yearsLabel(years)} lalu lo udah nyelesaiin tugas "${task.title}" (${task.subject}).`,
                    });
                } else {
                    _addCandidate(out, {
                        id: `task-start-${task.id}`,
                        priority: 75,
                        date: created,
                        yearsAgo: years,
                        message: `${intro} ${_yearsLabel(years)} lalu lo mulai tugas "${task.title}" (${task.subject}).`,
                    });
                }
            }

            if (deadline && _sameMonthDay(deadline, today) && deadline.getFullYear() < today.getFullYear()) {
                const years = _yearsAgo(deadline, today);
                const intro = _introFor(`task-deadline-${task.id}`);
                _addCandidate(out, {
                    id: `task-deadline-${task.id}`,
                    priority: 65,
                    date: deadline,
                    yearsAgo: years,
                    message: `${intro} ${_yearsLabel(years)} lalu deadline tugas "${task.title}" jatuh tempo.`,
                });
            }
        });
    }

    function _collectFocusCandidate(today, out) {
        const last = window.focusStorage?.getStats?.()?.lastSession;
        const d = _parseDate(last);
        if (!d || !_sameMonthDay(d, today) || d.getFullYear() >= today.getFullYear()) return;
        const years = _yearsAgo(d, today);
        _addCandidate(out, {
            id: 'focus-last',
            priority: 85,
            date: d,
            yearsAgo: years,
            message: `${_introFor('focus')} ${_yearsLabel(years)} lalu lo abis sesi focus. Mantap.`,
        });
    }

    function _collectArcadeCandidates(today, out) {
        const scores = window.arcadeStorage?.getScores?.() || {};
        Object.entries(scores).forEach(([id, stats]) => {
            const d = _parseDate(stats.lastPlayed);
            if (!d || !_sameMonthDay(d, today) || d.getFullYear() >= today.getFullYear()) return;
            const years = _yearsAgo(d, today);
            const name = GAME_NAMES[id] || id;
            _addCandidate(out, {
                id: `game-${id}`,
                priority: 55,
                date: d,
                yearsAgo: years,
                message: `${_introFor(`game-${id}`)} ${_yearsLabel(years)} lalu lo main ${name} di Arcade.`,
            });
        });
    }

    function _collectSpotifyCandidates(today, out) {
        if (typeof spotifyLibraryGet !== 'function') return;
        try {
            spotifyLibraryGet().forEach(item => {
                const d = _parseDate(item.createdAt);
                if (!d || !_sameMonthDay(d, today) || d.getFullYear() >= today.getFullYear()) return;
                const years = _yearsAgo(d, today);
                _addCandidate(out, {
                    id: `sp-${item.id}`,
                    priority: 45,
                    date: d,
                    yearsAgo: years,
                    message: `${_introFor(`sp-${item.id}`)} ${_yearsLabel(years)} lalu lo nambahin "${item.name}" ke Spotify library.`,
                });
            });
        } catch (e) { /* ignore */ }
    }

    async function _collectLocalMusicCandidates(today, out) {
        if (!window.localMusicDB?.getAllTracks) return;
        try {
            const tracks = await window.localMusicDB.getAllTracks();
            tracks.forEach(track => {
                const d = _parseDate(track.createdAt);
                if (!d || !_sameMonthDay(d, today) || d.getFullYear() >= today.getFullYear()) return;
                const years = _yearsAgo(d, today);
                const title = track.title || track.filename || 'lagu';
                _addCandidate(out, {
                    id: `lm-${track.id}`,
                    priority: 40,
                    date: d,
                    yearsAgo: years,
                    message: `${_introFor(`lm-${track.id}`)} ${_yearsLabel(years)} lalu lo nambahin "${title}" ke Local Music.`,
                });
            });
        } catch (e) { /* ignore */ }
    }

    async function findCandidates() {
        const today = new Date();
        const dayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
        if (_cacheKey === dayKey && _cacheResults) return _cacheResults;

        const all = [];
        _collectTaskCandidates(today, all);
        _collectFocusCandidate(today, all);
        _collectArcadeCandidates(today, all);
        _collectSpotifyCandidates(today, all);
        await _collectLocalMusicCandidates(today, all);

        all.sort((a, b) => b.priority - a.priority || b.date - a.date);
        const results = all.slice(0, 3);

        _cacheKey = dayKey;
        _cacheResults = results;
        return results;
    }

    function _esc(s) {
        const el = document.createElement('span');
        el.textContent = s ?? '';
        return el.innerHTML;
    }

    async function renderOnThisDay() {
        const card = document.getElementById('onThisDayCard');
        if (!card) return;

        card.innerHTML = '<p class="on-this-day-empty">Memuat throwback...</p>';

        const items = await findCandidates();

        if (!items.length) {
            card.innerHTML = `
                <div class="on-this-day-header">
                    <span aria-hidden="true">🕰️</span>
                    <h2 class="on-this-day-title font-serif">On This Day</h2>
                </div>
                <p class="on-this-day-empty">Belum ada throwback buat hari ini 😭<br><span style="font-size:0.78rem;opacity:0.85">Belum ada data lama yang bisa di-throwback.</span></p>`;
            return;
        }

        const list = items.map(item => `
            <article class="on-this-day-item">
                <p class="on-this-day-message">${_esc(item.message)}</p>
                <time class="on-this-day-date" datetime="${item.date.toISOString()}">${_esc(_formatDate(item.date))}</time>
            </article>
        `).join('');

        card.innerHTML = `
            <div class="on-this-day-header">
                <span aria-hidden="true">🕰️</span>
                <h2 class="on-this-day-title font-serif">On This Day</h2>
            </div>
            <div class="on-this-day-list">${list}</div>`;
    }

    function scrollToCard() {
        const card = document.getElementById('onThisDayCard');
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return true;
        }
        return false;
    }

    function initOnThisDay() {
        renderOnThisDay();
    }

    window.onThisDay = {
        findCandidates,
        renderOnThisDay,
        scrollToCard,
        invalidateCache() {
            _cacheKey = null;
            _cacheResults = null;
        },
    };

    if (window.pwLifecycle) {
        window.pwLifecycle.registerPageInit(
            (_path, file) => file === 'index.html' || file === '',
            initOnThisDay
        );
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            const path = window.location.pathname;
            if (path.includes('index.html') || path.endsWith('/') || !path.split('/').filter(Boolean).length) {
                initOnThisDay();
            }
        });
    }
})();
