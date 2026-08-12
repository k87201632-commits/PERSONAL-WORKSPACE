// ==========================================================================
// PERSONAL-WORKSPACE — REACTION TEST (REACTION-TEST.JS)
// Wait → color change → click → measure ms.
// ==========================================================================

(function () {
    'use strict';

    const STATES = { idle: 'idle', waiting: 'waiting', ready: 'ready', result: 'result' };

    let _padEl, _timeEl, _bestEl, _avgEl, _state, _timeoutId, _readyAt, _times, _started, _listenersBound;

    function init(padId) {
        _padEl  = document.getElementById(padId);
        _timeEl = document.getElementById('reactionTime');
        _bestEl = document.getElementById('reactionBest');
        _avgEl  = document.getElementById('reactionAvg');
        if (!_padEl) return;

        _loadStats();

        const restartBtn = document.getElementById('reactionRestartBtn');
        if (restartBtn && !restartBtn.dataset.bound) {
            restartBtn.dataset.bound = '1';
            restartBtn.addEventListener('click', restart);
        }

        if (!_listenersBound) {
            _listenersBound = true;
            _padEl.addEventListener('click', _onClick);
            _padEl.addEventListener('touchstart', e => { e.preventDefault(); _onClick(); }, { passive: false });
        }

        restart();
    }

    function _loadStats() {
        const stats = window.arcadeStorage ? window.arcadeStorage.getGameStats('reaction') : {};
        const best = stats.bestMoves;
        _times = [];
        if (_bestEl) _bestEl.textContent = isFinite(best) ? `${best}ms` : '—';
        const avg = stats.highScore;
        if (_avgEl) _avgEl.textContent = avg ? `${avg}ms` : '—';
    }

    function restart() {
        _clearWait();
        _state = STATES.idle;
        _started = false;
        _setPad('reaction-pad-idle', 'Tap to Start', 'Klik untuk mulai');
        if (_timeEl) _timeEl.textContent = '—';
    }

    function _setPad(cls, title, sub) {
        _padEl.className = `reaction-pad ${cls}`;
        _padEl.innerHTML = `<span class="reaction-title">${title}</span><span class="reaction-sub">${sub || ''}</span>`;
    }

    function _clearWait() {
        if (_timeoutId) { clearTimeout(_timeoutId); _timeoutId = null; }
    }

    function _beginRound() {
        _state = STATES.waiting;
        _setPad('reaction-pad-wait', 'WAIT...', 'Jangan klik dulu');
        const delay = 1500 + Math.random() * 3500;
        _timeoutId = setTimeout(() => {
            _state = STATES.ready;
            _readyAt = performance.now();
            _setPad('reaction-pad-go', 'CLICK!', 'Sekarang!');
        }, delay);
    }

    function _onClick() {
        const panel = document.getElementById('panelReaction');
        if (!panel || panel.style.display === 'none') return;

        if (_state === STATES.idle || _state === STATES.result) {
            if (!_started) {
                _started = true;
                window.dispatchEvent(new CustomEvent('game:started', { detail: { game: 'reaction' } }));
                if (window.arcadeStorage) window.arcadeStorage.recordGamePlayed('reaction');
            }
            _beginRound();
            return;
        }

        if (_state === STATES.waiting) {
            _clearWait();
            _state = STATES.result;
            _setPad('reaction-pad-early', 'Too Early!', 'Tap untuk coba lagi');
            return;
        }

        if (_state === STATES.ready) {
            const ms = Math.round(performance.now() - _readyAt);
            _state = STATES.result;
            _clearWait();
            if (_timeEl) _timeEl.textContent = `${ms}ms`;
            _setPad('reaction-pad-result', `${ms} ms`, 'Tap untuk ulang');

            if (window.arcadeStorage) {
                window.arcadeStorage.updateBestMoves('reaction', ms);
                const stats = window.arcadeStorage.getGameStats('reaction');
                if (_bestEl) _bestEl.textContent = `${stats.bestMoves}ms`;

                const played = stats.gamesPlayed || 1;
                const prevAvg = stats.highScore || ms;
                const newAvg = Math.round((prevAvg * (played - 1) + ms) / played);
                window.arcadeStorage.updateHighScore('reaction', newAvg);
                if (_avgEl) _avgEl.textContent = `${newAvg}ms`;
            }

            if (ms < 300) {
                window.dispatchEvent(new CustomEvent('game:won', { detail: { game: 'reaction', score: ms } }));
            }
        }
    }

    window.reactionTest = { init, restart };
})();
