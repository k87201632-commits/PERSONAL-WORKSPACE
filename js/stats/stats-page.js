// ==========================================================================
// PERSONAL-WORKSPACE — STATS PAGE (STATS-PAGE.JS)
// Renders personal statistics from statsAggregator — SPA-safe.
// ==========================================================================

(function () {
    'use strict';

    let _eventsBound = false;

    function _fmtDate(iso) {
        if (!iso) return null;
        try {
            const d = new Date(iso);
            return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return null;
        }
    }

    function _esc(s) {
        const d = document.createElement('span');
        d.textContent = s ?? '';
        return d.innerHTML;
    }

    function _empty(msg) {
        return `<p class="stats-empty">${_esc(msg)}</p>`;
    }

    function _barChart(items, valueKey, maxVal) {
        if (!items.length) return _empty('Belum ada data.');
        const max = maxVal || Math.max(...items.map(i => i[valueKey] || 0), 1);
        return items.map(item => {
            const v = item[valueKey] || 0;
            const pct = max > 0 ? Math.round((v / max) * 100) : 0;
            return `
                <div class="stats-bar-row">
                    <span class="stats-bar-label">${item.icon || ''} ${_esc(item.label)}</span>
                    <div class="stats-bar-track"><div class="stats-bar-fill" style="width:${pct}%"></div></div>
                    <span class="stats-bar-value">${v}</span>
                </div>`;
        }).join('');
    }

    function _renderOverview(d) {
        const cards = [
            { icon: '🎯', label: 'Focus Sessions', value: d.focus.sessions, empty: 'Belum ada sesi focus. Coba mulai 25 menit dulu 🎯' },
            { icon: '⏱️', label: 'Focus Time', value: `${d.focus.minutes} min`, empty: null },
            { icon: '🎮', label: 'Games Played', value: d.arcade.gamesPlayed, empty: 'Belum main game. Arcade lagi nungguin lo 😭' },
            { icon: '🏆', label: 'Wins', value: d.arcade.wins, empty: null },
            { icon: '📝', label: 'Tasks Done', value: d.tasks.completed, empty: 'Belum ada data tugas.' },
        ];

        if (d.music.total != null) {
            cards.push({ icon: '🎵', label: 'Music Library', value: d.music.total, empty: 'Library masih kosong.' });
        }

        return cards.map(c => {
            const showEmpty = (c.value === 0 || c.value === '0 min') && c.empty;
            return `
                <div class="stats-overview-card workspace-card">
                    <div class="stats-overview-icon">${c.icon}</div>
                    <div class="stats-overview-value">${showEmpty ? '—' : _esc(String(c.value))}</div>
                    <div class="stats-overview-label">${_esc(c.label)}</div>
                    ${showEmpty ? `<div class="stats-overview-empty-hint">${_esc(c.empty)}</div>` : ''}
                </div>`;
        }).join('');
    }

    function _renderFocus(d) {
        if (!d.focus.sessions) {
            return _empty('Belum ada sesi focus. Coba mulai 25 menit dulu 🎯');
        }
        const last = _fmtDate(d.focus.lastSession);
        return `
            <div class="stats-detail-grid">
                <div><span class="stats-detail-num">${d.focus.sessions}</span><span class="stats-detail-lbl">sessions</span></div>
                <div><span class="stats-detail-num">${d.focus.minutes}</span><span class="stats-detail-lbl">minutes</span></div>
                <div><span class="stats-detail-num">${d.focus.averageMinutes}</span><span class="stats-detail-lbl">min avg</span></div>
            </div>
            ${last ? `<p class="stats-meta">Last session: ${last}</p>` : ''}`;
    }

    function _renderTasks(d) {
        if (!d.tasks.total) return _empty('Belum ada data tugas.');
        return `
            <div class="stats-detail-grid">
                <div><span class="stats-detail-num">${d.tasks.completed}</span><span class="stats-detail-lbl">completed</span></div>
                <div><span class="stats-detail-num">${d.tasks.pending}</span><span class="stats-detail-lbl">pending</span></div>
                <div><span class="stats-detail-num">${d.tasks.completionRate}%</span><span class="stats-detail-lbl">done</span></div>
            </div>
            <div class="stats-progress-track">
                <div class="stats-progress-fill" style="width:${d.tasks.completionRate}%"></div>
            </div>`;
    }

    function _renderArcade(d) {
        if (!d.arcade.gamesPlayed) return _empty('Belum main game. Arcade lagi nungguin lo 😭');

        const gameBars = _barChart(
            d.arcade.perGame.filter(g => g.gamesPlayed > 0),
            'gamesPlayed'
        );

        const rows = d.arcade.perGame.map(g => {
            let best = '—';
            if (g.id === 'memory' && g.bestMoves != null) best = `${g.bestMoves} moves`;
            else if (g.id === 'reaction' && g.bestMoves != null) best = `${g.bestMoves}ms`;
            else if (g.highScore > 0) best = String(g.highScore);

            return `
                <div class="stats-game-row">
                    <span>${g.icon} ${_esc(g.label)}</span>
                    <span>${g.gamesPlayed} played · ${g.wins} wins · best ${best}</span>
                </div>`;
        }).join('');

        return `
            <div class="stats-detail-grid stats-detail-grid--compact">
                <div><span class="stats-detail-num">${d.arcade.gamesPlayed}</span><span class="stats-detail-lbl">played</span></div>
                <div><span class="stats-detail-num">${d.arcade.wins}</span><span class="stats-detail-lbl">wins</span></div>
                ${d.arcade.topGame ? `<div><span class="stats-detail-num">${d.arcade.topGame.icon}</span><span class="stats-detail-lbl">${_esc(d.arcade.topGame.label)}</span></div>` : ''}
            </div>
            <div class="stats-bar-section">${gameBars}</div>
            <details class="stats-details-expand">
                <summary>Per-game breakdown</summary>
                <div class="stats-game-list">${rows}</div>
            </details>`;
    }

    function _renderMusic(d) {
        const hasLocal = d.music.localTracks != null;
        const hasSpotify = d.music.spotifyItems != null;
        if (!hasLocal && !hasSpotify) return _empty('Library masih kosong.');
        return `
            <div class="stats-detail-grid">
                ${hasLocal ? `<div><span class="stats-detail-num">${d.music.localTracks}</span><span class="stats-detail-lbl">local tracks</span></div>` : ''}
                ${hasSpotify ? `<div><span class="stats-detail-num">${d.music.spotifyItems}</span><span class="stats-detail-lbl">spotify saved</span></div>` : ''}
            </div>`;
    }

    function _renderAchievements(d) {
        if (!d.achievements.total) return _empty('Achievement system belum tersedia.');
        const recent = d.achievements.recent.length
            ? d.achievements.recent.map(a => `
                <div class="stats-ach-item stats-ach-unlocked">
                    <span>${a.icon}</span><span>${_esc(a.title)}</span>
                </div>`).join('')
            : _empty('Belum ada achievement unlocked.');

        return `
            <p class="stats-ach-count">Unlocked: <strong>${d.achievements.unlockedCount} / ${d.achievements.total}</strong></p>
            <div class="stats-ach-grid">${recent}</div>`;
    }

    async function renderStatsPage() {
        const root = document.getElementById('statsPageRoot');
        if (!root || !window.statsAggregator) return;

        root.innerHTML = '<p class="stats-loading">Memuat statistik...</p>';

        try {
            const d = await window.statsAggregator.aggregate();

            root.innerHTML = `
                ${d.insight ? `<div class="stats-insight workspace-card">${_esc(d.insight)}</div>` : ''}

                <section class="stats-section">
                    <h2 class="stats-section-title font-serif">Your Workspace</h2>
                    <div class="stats-overview-grid">${_renderOverview(d)}</div>
                </section>

                <section class="stats-section stats-two-col">
                    <div class="workspace-card stats-block">
                        <h3 class="stats-block-title">🎯 Focus</h3>
                        ${_renderFocus(d)}
                    </div>
                    <div class="workspace-card stats-block">
                        <h3 class="stats-block-title">📝 Tasks</h3>
                        ${_renderTasks(d)}
                    </div>
                </section>

                <section class="stats-section">
                    <div class="workspace-card stats-block">
                        <h3 class="stats-block-title">🎮 Arcade</h3>
                        ${_renderArcade(d)}
                    </div>
                </section>

                <section class="stats-section stats-two-col">
                    <div class="workspace-card stats-block">
                        <h3 class="stats-block-title">🎵 Music</h3>
                        ${_renderMusic(d)}
                    </div>
                    <div class="workspace-card stats-block">
                        <h3 class="stats-block-title">🏆 Achievements</h3>
                        ${_renderAchievements(d)}
                    </div>
                </section>
            `;
        } catch (e) {
            console.error('[stats-page]', e);
            root.innerHTML = _empty('Gagal memuat statistik. Coba refresh.');
        }
    }

    function _bindRefreshEvents() {
        if (_eventsBound) return;
        _eventsBound = true;
        ['focus:completed', 'game:started', 'game:won', 'task:completed', 'achievement:unlocked'].forEach(ev => {
            window.addEventListener(ev, () => {
                if (document.getElementById('statsPageRoot')) renderStatsPage();
            });
        });
    }

    function initStatsPage() {
        _bindRefreshEvents();
        renderStatsPage();
    }

    window.pwInitStatsPage = initStatsPage;

    if (window.pwLifecycle) {
        window.pwLifecycle.registerPageInit(
            (_path, file) => file === 'stats.html',
            initStatsPage
        );
    }
})();
