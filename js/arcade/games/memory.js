// ==========================================================================
// PERSONAL-WORKSPACE — MEMORY GAME (MEMORY.JS)
// Card-matching game with flip animation, move counter & timer.
// ==========================================================================

(function () {
    'use strict';

    const ICONS = ['🎵','🎮','🏆','📚','🌟','🎯','🚀','🦊'];
    const PAIRS = [...ICONS, ...ICONS];

    let _gridEl, _gameStarted, _firstCard, _secondCard, _locked;
    let _moves, _matched, _timerEl, _movesEl, _timerInterval, _elapsed;
    let _started = false;

    // -----------------------------------------------------------------------
    // INIT
    // -----------------------------------------------------------------------
    function init(gridId) {
        _gridEl   = document.getElementById(gridId);
        _movesEl  = document.getElementById('memoryMoves');
        _timerEl  = document.getElementById('memoryTimer');
        const restartBtn = document.getElementById('memoryRestartBtn');
        if (restartBtn) restartBtn.addEventListener('click', restart);
        restart();
    }

    // -----------------------------------------------------------------------
    // GAME
    // -----------------------------------------------------------------------
    function restart() {
        _clearTimer();
        _moves   = 0;
        _matched = 0;
        _elapsed = 0;
        _locked  = false;
        _firstCard  = null;
        _secondCard = null;
        _started    = false;
        _gameStarted = false;

        _updateMoves();
        _updateTimer();

        const shuffled = _shuffle([...PAIRS]);
        if (!_gridEl) return;
        _gridEl.innerHTML = '';

        shuffled.forEach((icon, idx) => {
            const card = document.createElement('div');
            card.className  = 'memory-card';
            card.dataset.icon = icon;
            card.dataset.idx  = idx;
            card.innerHTML = `
                <div class="memory-card-inner">
                    <div class="memory-card-front">❓</div>
                    <div class="memory-card-back">${icon}</div>
                </div>
            `;
            card.addEventListener('click', () => _onCardClick(card));
            _gridEl.appendChild(card);
        });
    }

    function _onCardClick(card) {
        if (_locked) return;
        if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

        // Start timer on first flip
        if (!_gameStarted) {
            _gameStarted = true;
            if (!_started) {
                _started = true;
                window.dispatchEvent(new CustomEvent('game:started', { detail: { game: 'memory' } }));
                if (window.arcadeStorage) window.arcadeStorage.recordGamePlayed('memory');
            }
            _startTimer();
        }

        card.classList.add('flipped');

        if (!_firstCard) {
            _firstCard = card;
            return;
        }

        _secondCard = card;
        _locked = true;
        _moves++;
        _updateMoves();

        if (_firstCard.dataset.icon === _secondCard.dataset.icon) {
            // Match
            _firstCard.classList.add('matched');
            _secondCard.classList.add('matched');
            _matched++;
            _firstCard  = null;
            _secondCard = null;
            _locked     = false;

            if (_matched === ICONS.length) {
                _onWin();
            }
        } else {
            // No match — flip back
            setTimeout(() => {
                _firstCard.classList.remove('flipped');
                _secondCard.classList.remove('flipped');
                _firstCard  = null;
                _secondCard = null;
                _locked     = false;
            }, 900);
        }
    }

    function _onWin() {
        _clearTimer();

        if (window.arcadeStorage) {
            window.arcadeStorage.recordGameWon('memory', _moves);
            window.arcadeStorage.updateBestMoves('memory', _moves);
        }

        window.dispatchEvent(new CustomEvent('game:won', {
            detail: { game: 'memory', moves: _moves, time: _elapsed }
        }));

        if (_moves <= 20 && window.achievementManager) {
            window.achievementManager.unlock('memory_pro');
        }

        const stats = window.arcadeStorage ? window.arcadeStorage.getGameStats('memory') : {};
        const best  = isFinite(stats.bestMoves) ? stats.bestMoves : _moves;
        const cardHs = document.getElementById('memoryHS');
        if (cardHs) cardHs.textContent = `Best: ${best}`;

        const timeStr = _formatTime(_elapsed);
        if (typeof showToast === 'function') {
            showToast(`🎉 Memory selesai! ${_moves} gerakan, ${timeStr}`, 4000);
        }

        // Show win overlay inside grid
        setTimeout(() => {
            if (_gridEl) {
                const overlay = document.createElement('div');
                overlay.className = 'memory-win-overlay';
                overlay.innerHTML = `
                    <div class="memory-win-box">
                        <div style="font-size:2rem">🎉</div>
                        <div style="font-weight:800;font-size:1.1rem">Selesai!</div>
                        <div style="font-size:0.85rem;color:var(--text-secondary)">${_moves} gerakan · ${timeStr}</div>
                        <button class="arcade-action-btn" onclick="window.memoryGame.restart()" style="margin-top:0.75rem">↺ Lagi</button>
                    </div>
                `;
                _gridEl.parentElement.style.position = 'relative';
                _gridEl.parentElement.appendChild(overlay);
                setTimeout(() => overlay.remove(), 8000);
            }
        }, 400);
    }

    // -----------------------------------------------------------------------
    // TIMER
    // -----------------------------------------------------------------------
    function _startTimer() {
        _elapsed = 0;
        _timerInterval = setInterval(() => {
            _elapsed++;
            _updateTimer();
        }, 1000);
    }

    function _clearTimer() {
        if (_timerInterval) { clearInterval(_timerInterval); _timerInterval = null; }
    }

    function _updateTimer() {
        if (_timerEl) _timerEl.textContent = _formatTime(_elapsed);
    }

    function _updateMoves() {
        if (_movesEl) _movesEl.textContent = _moves;
    }

    function _formatTime(s) {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    }

    // -----------------------------------------------------------------------
    // UTILS
    // -----------------------------------------------------------------------
    function _shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // -----------------------------------------------------------------------
    // PUBLIC
    // -----------------------------------------------------------------------
    window.memoryGame = { init, restart };

})();
